from typing import Optional, List
from pydantic import BaseModel, EmailStr
from .schemas_entities import *

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    organization_id: Optional[int] = None
    
    class Config:
        orm_mode = True

class OrganizationBase(BaseModel):
    name: str
    plan_tier: str = "free"

class OrganizationCreate(OrganizationBase):
    admin_email: EmailStr
    admin_password: str
    admin_name: str

class OrganizationRead(OrganizationBase):
    id: int
    
    class Config:
        orm_mode = True
