from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Any
from datetime import datetime


# ============== Auth Schemas ==============

class UserCreate(BaseModel):
    """Schema for user registration with password validation."""
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        # bcrypt has a 72-byte limit for passwords
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must be 72 bytes or fewer (approximately 72 ASCII characters)')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: str
    password: str


class UserResponse(BaseModel):
    """Schema for user data in responses (no password)."""
    id: str
    email: str
    is_admin: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> str:
        return str(v) if v else ''


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============== Message Schemas ==============

class MessageBase(BaseModel):
    role: str
    content: str


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('id', 'conversation_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> str:
        return str(v) if v else ''


# ============== Conversation Schemas ==============

class ConversationBase(BaseModel):
    title: Optional[str] = None


class ConversationCreate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    title: str

    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> str:
        return str(v) if v else ''


class ConversationDetail(ConversationResponse):
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ============== Chat Schemas ==============

class ChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[str] = None


class TitleGenerationRequest(BaseModel):
    conversation_id: str
    prompt: Optional[str] = ""


# ============== Settings Schemas ==============

class SettingsBase(BaseModel):
    theme: Optional[str] = "dark"
    provider: Optional[str] = "groq"
    model: Optional[str] = "openai/gpt-oss-120b"
    enable_glow: Optional[bool] = True

    model_config = ConfigDict(validate_by_name=True)


class SettingsResponse(SettingsBase):
    id: str
    user_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> str:
        return str(v) if v else ''


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    enable_glow: Optional[bool] = None
    clear_all_chats: Optional[bool] = False


# ============== System Config Schemas ==============

class SystemConfigBase(BaseModel):
    key: str
    value: str

class SystemConfigUpdate(BaseModel):
    value: str

class SystemConfigResponse(SystemConfigBase):
    model_config = ConfigDict(from_attributes=True)

class AppConfig(BaseModel):
    """Public configuration exposed to frontend."""
    app_name: str

