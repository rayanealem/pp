from typing import List, Optional
from pydantic import BaseModel

class CameraBase(BaseModel):
    name: str
    rtsp_url: str
    type: str = "parking"
    zone_id: Optional[int] = None

class CameraCreate(CameraBase):
    pass

class CameraRead(CameraBase):
    id: int
    organization_id: int
    
    class Config:
        orm_mode = True

class SpotBase(BaseModel):
    name: str
    x1: int
    y1: int
    x2: int
    y2: int

class SpotCreate(SpotBase):
    pass

class SpotUpdate(BaseModel):
    status: Optional[str] = None
    x1: Optional[int] = None
    y1: Optional[int] = None
    x2: Optional[int] = None
    y2: Optional[int] = None

class SpotRead(SpotBase):
    id: int
    status: str
    zone_id: int
    
    class Config:
        orm_mode = True

class ZoneBase(BaseModel):
    name: str
    total_spots: int
    map_grid_data: Optional[str] = None

class ZoneCreate(ZoneBase):
    pass

class ZoneRead(ZoneBase):
    id: int
    organization_id: int
    spots: List[SpotRead] = []
    camera: Optional[CameraRead] = None
    
    class Config:
        orm_mode = True
