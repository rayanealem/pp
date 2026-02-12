from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app import models, schemas
from app.api import deps
from app.database import get_session

router = APIRouter()

@router.get("/", response_model=List[schemas.CameraRead])
def read_cameras(
    session: Session = Depends(get_session),
    current_user: models.User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    statement = select(models.Camera).where(models.Camera.organization_id == current_user.organization_id).offset(skip).limit(limit)
    cameras = session.exec(statement).all()
    return cameras

@router.post("/connect", response_model=schemas.CameraRead)
def connect_camera(
    *,
    session: Session = Depends(get_session),
    camera_in: schemas.CameraCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Future: check plan limits here
    camera = models.Camera(
        **camera_in.dict(),
        organization_id=current_user.organization_id
    )
    session.add(camera)
    session.commit()
    session.refresh(camera)
    return camera
