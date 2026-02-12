from sqlmodel import Session, select
from app.models import User, Organization
from app.core.security import get_password_hash
from app.core.config import settings

def init_data(session: Session):
    # Check for admin user
    statement = select(User).where(User.email == "admin@example.com")
    user = session.exec(statement).first()
    
    if not user:
        # Create default organization
        org = Organization(name="Default Org", plan_tier="enterprise")
        session.add(org)
        session.commit()
        session.refresh(org)
        
        # Create admin user
        user = User(
            email="admin@example.com",
            hashed_password=get_password_hash("password"),
            full_name="Admin User",
            role="admin",
            organization_id=org.id
        )
        session.add(user)
        session.commit()
        print("Created default user: admin@example.com / password")
    else:
        print("Default user already exists.")
