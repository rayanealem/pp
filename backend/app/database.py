from sqlmodel import SQLModel, create_engine, Session
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://cloudpark:password@db:5432/cloudpark"
    REDIS_URL: str = "redis://redis:6379/0"

settings = Settings()

engine = create_engine(settings.DATABASE_URL)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
