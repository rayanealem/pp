from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app import models, schemas
from app.api import deps
from app.database import get_session

router = APIRouter()

@router.get("/", response_model=List[schemas.ZoneRead])
def read_zones(
    session: Session = Depends(get_session),
    current_user: models.User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    statement = select(models.Zone).where(models.Zone.organization_id == current_user.organization_id).offset(skip).limit(limit)
    zones = session.exec(statement).all()
    return zones

@router.get("/{zone_id}", response_model=schemas.ZoneRead)
def read_zone(
    *,
    session: Session = Depends(get_session),
    zone_id: int,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    zone = session.get(models.Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if zone.organization_id != current_user.organization_id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return zone

@router.post("/", response_model=schemas.ZoneRead)
def create_zone(
    *,
    session: Session = Depends(get_session),
    zone_in: schemas.ZoneCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    zone = models.Zone(
        **zone_in.dict(),
        organization_id=current_user.organization_id
    )
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone

@router.post("/{zone_id}/spots", response_model=schemas.SpotRead)
def create_spot(
    *,
    session: Session = Depends(get_session),
    zone_id: int,
    spot_in: schemas.SpotCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    zone = session.get(models.Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    if zone.organization_id != current_user.organization_id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    spot = models.Spot(
        **spot_in.dict(),
        zone_id=zone_id
    )
    session.add(spot)
    session.commit()
    session.refresh(spot)
    return spot
