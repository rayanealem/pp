from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app import models, schemas
from app.core import security
from app.database import get_session
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    session: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    statement = select(models.User).where(models.User.email == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
