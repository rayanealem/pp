from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "CHANGE_THIS_TO_A_STRONG_SECRET"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = "postgresql://cloudpark:password@db:5432/cloudpark"
    REDIS_URL: str = "redis://redis:6379/0"
    
    class Config:
        case_sensitive = True

settings = Settings()
