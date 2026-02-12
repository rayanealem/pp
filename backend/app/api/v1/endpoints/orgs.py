from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app import models, schemas
from app.database import get_session
from app.core import security

router = APIRouter()

@router.post("/register", response_model=schemas.OrganizationRead)
def register_organization(
    *,
    session: Session = Depends(get_session),
    org_in: schemas.OrganizationCreate,
) -> Any:
    # Check if user exists
    user = session.exec(select(models.User).where(models.User.email == org_in.admin_email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
        
    # Create Org
    org = models.Organization(name=org_in.name, plan_tier=org_in.plan_tier)
    session.add(org)
    session.commit()
    session.refresh(org)
    
    # Create Admin User
    user = models.User(
        email=org_in.admin_email,
        hashed_password=security.get_password_hash(org_in.admin_password),
        full_name=org_in.admin_name,
        role="admin",
        organization_id=org.id
    )
    session.add(user)
    session.commit()
    
    return org
