"""Pydantic schemas for authentication endpoints."""

from pydantic import BaseModel, Field


class SendCodeRequest(BaseModel):
    phone: str = Field(min_length=11, max_length=20)


class RegisterRequest(BaseModel):
    phone: str = Field(min_length=11, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    code: str = Field(min_length=6, max_length=6)


class LoginRequest(BaseModel):
    phone: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    phone: str | None
    role: str
    is_active: bool
    created_at: str
