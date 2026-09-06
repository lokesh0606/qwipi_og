"""
Qwipi AI API - FastAPI Backend with JWT Authentication and Multi-Turn LLM Streaming.
Production-ready with rate limiting, Redis caching/blacklisting, and strict per-user data isolation.
Powered by Groq LPU inference.
"""
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from jose import jwt, JWTError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import delete, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.database import engine, Base, get_db, AsyncSessionLocal
from backend.redis_client import init_redis_pool, close_redis, redis_client
from backend.models import Conversation, Message, Settings, User, SystemConfig
from backend.schemas import (
    ConversationResponse, ConversationDetail, ChatRequest, 
    TitleGenerationRequest, SettingsResponse, SettingsUpdate,
    UserCreate, UserLogin, Token, UserResponse,
    AppConfig, SystemConfigUpdate, SystemConfigResponse
)
from backend.chat import LLMFactory
from backend.auth import (
    get_password_hash, create_access_token, get_current_user, 
    authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, blacklist_token,
    oauth2_scheme, get_current_admin_user, SECRET_KEY, ALGORITHM
)

# Rate limiter setup backed by Redis
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
limiter = Limiter(key_func=get_remote_address, storage_uri=redis_url)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and Redis
    try:
        await init_redis_pool()
    except Exception as e:
        print(f"Warning: Failed to initialize Redis on startup: {e}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-promote FIRST_SUPERUSER_EMAIL if configured
    first_admin = os.getenv("FIRST_SUPERUSER_EMAIL")
    if first_admin:
        try:
            async with AsyncSessionLocal() as session:
                res = await session.execute(select(User).where(User.email == first_admin.strip()))
                admin_user = res.scalars().first()
                if admin_user and not admin_user.is_admin:
                    admin_user.is_admin = True
                    await session.commit()
                    print(f"INFO: Auto-promoted {first_admin} to administrator.")
        except Exception as e:
            print(f"Warning: Failed auto-promoting superuser: {e}")

    yield

    # Shutdown: Close connections
    try:
        await close_redis()
    except Exception:
        pass
    await engine.dispose()


app = FastAPI(title="Qwipi AI API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration - Restrict origins for production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-Id"],
)


@app.get("/api/v1/models")
async def get_enabled_models(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all enabled LLM providers and their models for selection.
    """
    return await LLMFactory.get_enabled_providers(db)


# ============== Config Endpoints ==============

@app.get("/api/v1/config/public", response_model=AppConfig)
async def get_public_config(db: AsyncSession = Depends(get_db)):
    """
    Get public configuration (e.g., app name).
    Caches in Redis with automatic fallback to PostgreSQL.
    """
    # 1. Try Redis cache first
    if redis_client:
        try:
            cached_name = await redis_client.get("app_name")
            if cached_name:
                return AppConfig(app_name=cached_name)
        except Exception:
            pass
    
    # 2. Fallback to DB
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "app_name"))
    config = result.scalars().first()
    
    app_name = config.value if config else "Qwipi AI"
    
    # 3. Update Cache (TTL: 1 hour)
    if redis_client:
        try:
            await redis_client.setex("app_name", 3600, app_name)
        except Exception:
            pass
        
    return AppConfig(app_name=app_name)


@app.patch("/api/v1/admin/config", response_model=SystemConfigResponse)
async def update_system_config(
    request: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Admin-only: Update system configuration.
    """
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "app_name"))
    config = result.scalars().first()
    
    if config:
        config.value = request.value
    else:
        config = SystemConfig(key="app_name", value=request.value)
        db.add(config)
        
    await db.commit()
    await db.refresh(config)
    
    # Invalidate Cache
    if redis_client:
        try:
            await redis_client.delete("app_name")
        except Exception:
            pass
        
    return config


# ============== Auth Endpoints ==============

@app.post("/auth/signup", response_model=Token)
@limiter.limit("5/minute")
async def signup(
    request: Request,
    user_data: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user.
    Auto-creates default settings for the new user.
    Auto-promotes to admin if matching FIRST_SUPERUSER_EMAIL.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if this user qualifies as initial superuser
    first_admin = os.getenv("FIRST_SUPERUSER_EMAIL", "").strip().lower()
    is_initial_admin = bool(first_admin and user_data.email.strip().lower() == first_admin)

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        is_admin=is_initial_admin
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Auto-create default settings for new user
    default_settings = Settings(user_id=new_user.id)
    db.add(default_settings)
    await db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            is_admin=new_user.is_admin,
            created_at=new_user.created_at
        )
    )


@app.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    user_data: UserLogin, 
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    """
    user = await authenticate_user(db, user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            is_admin=user.is_admin,
            created_at=user.created_at
        )
    )


@app.post("/auth/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Logout user by blacklisting the current token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        if jti and exp:
            now = datetime.utcnow()
            expires_in = int((datetime.fromtimestamp(exp) - now).total_seconds())
            
            if expires_in > 0:
                await blacklist_token(jti, expires_in)
                
    except JWTError:
        pass
        
    return {"message": "Successfully logged out"}


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info including admin role."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at
    )


# ============== Conversation Endpoints (User-Scoped) ==============

@app.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the authenticated user."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@app.get("/conversations/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation with strict user ownership verification."""
    result = await db.execute(
        select(Conversation)
        .where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id
            )
        )
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@app.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation with cascading message deletion."""
    result = await db.execute(
        select(Conversation)
        .where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id
            )
        )
    )
    conversation = result.scalars().first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db.delete(conversation)
    await db.commit()
    
    return {"message": "Conversation deleted successfully"}


# ============== Chat Endpoint (User-Scoped with Multi-Turn Context) ==============

@app.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat endpoint with multi-turn conversational context and resilient streaming.
    """
    # 1. Get or Create Conversation (scoped to user)
    if request.conversation_id:
        result = await db.execute(
            select(Conversation)
            .where(
                and_(
                    Conversation.id == request.conversation_id,
                    Conversation.user_id == current_user.id
                )
            )
        )
        conversation = result.scalars().first()
        if not conversation:
            conversation = Conversation(user_id=current_user.id)
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
    else:
        conversation = Conversation(user_id=current_user.id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    conversation_id = str(conversation.id)

    # 2. Save User Message
    user_msg = Message(
        conversation_id=conversation.id,
        user_id=current_user.id,
        role="user",
        content=request.prompt
    )
    db.add(user_msg)
    conversation.updated_at = datetime.utcnow()
    await db.commit()

    # 3. Fetch Multi-Turn Conversation History (Sliding window of last 20 messages)
    history_result = await db.execute(
        select(Message)
        .where(
            and_(
                Message.conversation_id == conversation.id,
                Message.user_id == current_user.id
            )
        )
        .order_by(Message.created_at.asc())
    )
    raw_history = history_result.scalars().all()
    
    # Format messages array for LLM
    formatted_messages = [
        {"role": m.role, "content": m.content}
        for m in raw_history[-20:]
        if m.role in ("user", "assistant", "system") and m.content
    ]

    # 4. Fetch User's Active Provider and Model Settings
    settings_res = await db.execute(
        select(Settings).where(Settings.user_id == current_user.id)
    )
    user_settings = settings_res.scalars().first()
    provider_name = user_settings.provider if user_settings else "groq"
    model_name = user_settings.model if user_settings else None

    llm_provider = await LLMFactory.get_provider(provider_name, model_name, db)
    user_id = current_user.id

    async def generate():
        full_response = ""
        try:
            async for chunk in llm_provider.client(formatted_messages):
                full_response += chunk
                yield chunk
        except Exception as e:
            error_chunk = f"\n\n[Stream Interrupted: {str(e)}]"
            full_response += error_chunk
            yield error_chunk
        finally:
            # Save Assistant Message (even if interrupted, to preserve partial work)
            if full_response.strip():
                try:
                    async with AsyncSessionLocal() as session:
                        result = await session.execute(
                            select(Conversation)
                            .where(
                                and_(
                                    Conversation.id == conversation_id,
                                    Conversation.user_id == user_id
                                )
                            )
                        )
                        conv = result.scalars().first()
                        if conv:
                            conv.updated_at = datetime.utcnow()
                            asst_msg = Message(
                                conversation_id=conv.id,
                                user_id=user_id,
                                role="assistant",
                                content=full_response
                            )
                            session.add(asst_msg)
                            await session.commit()
                except Exception as save_err:
                    print(f"Error saving assistant message: {save_err}")
                
    return StreamingResponse(
        generate(), 
        media_type="text/plain", 
        headers={"X-Conversation-Id": conversation_id}
    )


@app.post("/chat/title-stream")
async def stream_title_endpoint(
    request: TitleGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream-generate a short title for a conversation."""
    result = await db.execute(
        select(Conversation)
        .where(
            and_(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id
            )
        )
        .options(selectinload(Conversation.messages))
    )
    conversation = result.scalars().first()
    
    if not conversation or len(conversation.messages) < 1:
        existing_title = conversation.title if (conversation and conversation.title) else "New Chat"
        async def default_stream():
            yield existing_title
        return StreamingResponse(default_stream(), media_type="text/plain")

    msgs = [{"role": m.role, "content": m.content} for m in conversation.messages]
    
    settings_res = await db.execute(
        select(Settings).where(Settings.user_id == current_user.id)
    )
    user_settings = settings_res.scalars().first()
    provider_name = user_settings.provider if user_settings else "groq"
    model_name = user_settings.model if user_settings else None

    llm_provider = await LLMFactory.get_provider(provider_name, model_name, db)
    conv_id = str(conversation.id)
    user_id = current_user.id
    
    async def generate_and_update():
        full_title = ""
        try:
            async for token in llm_provider.generate_title_stream(msgs):
                full_title += token
                yield token
        except Exception as e:
            print(f"Error generating title stream in API: {e}")
            
        clean_title = full_title.strip()
        if clean_title:
            try:
                async with AsyncSessionLocal() as session:
                    res = await session.execute(
                        select(Conversation)
                        .where(
                            and_(
                                Conversation.id == conv_id,
                                Conversation.user_id == user_id
                            )
                        )
                    )
                    conv = res.scalars().first()
                    if conv:
                        conv.title = clean_title
                        await session.commit()
            except Exception as e:
                print(f"Error saving title: {e}")

    return StreamingResponse(generate_and_update(), media_type="text/plain")


# ============== Settings Endpoints (User-Scoped) ==============

@app.get("/settings", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get settings for the authenticated user (creates default if missing)."""
    result = await db.execute(
        select(Settings).where(Settings.user_id == current_user.id)
    )
    settings = result.scalars().first()
    
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
        
    return settings


@app.patch("/settings", response_model=SettingsResponse)
async def update_settings(
    update_data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update settings for the authenticated user."""
    result = await db.execute(
        select(Settings).where(Settings.user_id == current_user.id)
    )
    settings = result.scalars().first()
    
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
    
    if update_data.theme is not None:
        settings.theme = update_data.theme
    if update_data.provider is not None:
        settings.provider = update_data.provider
    if update_data.model is not None:
        settings.model = update_data.model
    if update_data.enable_glow is not None:
        settings.enable_glow = update_data.enable_glow
        
    if update_data.clear_all_chats:
        # Delete only this user's conversations
        subquery = select(Conversation.id).where(Conversation.user_id == current_user.id)
        await db.execute(
            delete(Message).where(Message.conversation_id.in_(subquery))
        )
        await db.execute(
            delete(Conversation).where(Conversation.user_id == current_user.id)
        )
        await db.commit()
    
    settings.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(settings)
    
    return settings


# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
