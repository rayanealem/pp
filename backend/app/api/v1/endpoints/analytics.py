from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app import models
from app.api import deps
from app.database import get_session

router = APIRouter()

@router.get("/occupancy")
def get_occupancy(
    session: Session = Depends(get_session),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Get all zones for the org
    zones = session.exec(select(models.Zone).where(models.Zone.organization_id == current_user.organization_id)).all()
    zone_ids = [z.id for z in zones]
    
    if not zone_ids:
        return {"total_spots": 0, "occupied_spots": 0, "free_spots": 0, "occupancy_rate": 0}

    # Count spots
    total_spots = session.exec(select(func.count(models.Spot.id)).where(models.Spot.zone_id.in_(zone_ids))).one()
    occupied_spots = session.exec(select(func.count(models.Spot.id)).where(models.Spot.zone_id.in_(zone_ids), models.Spot.status == "occupied")).one()
    
    return {
        "total_spots": total_spots,
        "occupied_spots": occupied_spots,
        "free_spots": total_spots - occupied_spots,
        "occupancy_rate": (occupied_spots / total_spots) * 100 if total_spots > 0 else 0
    }
