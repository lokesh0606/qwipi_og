import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://postgres:lokeshpassword@localhost:5432/qwipi_db"
)

# Production-ready engine with connection pooling
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",  # Only echo in debug mode
    pool_size=10,           # Maintain 10 connections in pool
    max_overflow=20,        # Allow up to 20 additional connections under load
    pool_pre_ping=True,     # Verify connections before use (handles stale connections)
    pool_recycle=3600,      # Recycle connections after 1 hour
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    """FastAPI dependency for database sessions."""
    async with AsyncSessionLocal() as session:
        yield session
