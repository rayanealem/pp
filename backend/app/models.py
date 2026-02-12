from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
from pydantic import ConfigDict

class Organization(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    plan_tier: str = Field(default="free") # free, pro, enterprise
    config_settings: Optional[str] = None # JSON string for flexibility
    
    users: List["User"] = Relationship(back_populates="organization")
    zones: List["Zone"] = Relationship(back_populates="organization")
    cameras: List["Camera"] = Relationship(back_populates="organization")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None
    role: str = Field(default="user") # admin, guard, driver
    organization_id: Optional[int] = Field(default=None, foreign_key="organization.id")
    
    organization: Optional[Organization] = Relationship(back_populates="users")

class Zone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    total_spots: int
    map_grid_data: Optional[str] = None # JSON string representing the grid
    organization_id: int = Field(foreign_key="organization.id")
    
    organization: Organization = Relationship(back_populates="zones")
    spots: List["Spot"] = Relationship(back_populates="zone")
    camera: Optional["Camera"] = Relationship(back_populates="zone")

class Spot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str # e.g. A-01
    status: str = Field(default="free") # free, occupied, reserved
    x1: int
    y1: int
    x2: int
    y2: int
    zone_id: int = Field(foreign_key="zone.id")
    
    zone: Zone = Relationship(back_populates="spots")

class Log(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    license_plate: str = Field(index=True)
    entry_time: datetime = Field(default_factory=datetime.utcnow)
    exit_time: Optional[datetime] = None
    image_url: Optional[str] = None
    spot_id: Optional[int] = Field(default=None, foreign_key="spot.id")

class Camera(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    rtsp_url: str
    type: str = Field(default="parking") # parking, portal
    organization_id: int = Field(foreign_key="organization.id")
    zone_id: Optional[int] = Field(default=None, foreign_key="zone.id")
    
    organization: Organization = Relationship(back_populates="cameras")
    zone: Optional[Zone] = Relationship(back_populates="camera")
