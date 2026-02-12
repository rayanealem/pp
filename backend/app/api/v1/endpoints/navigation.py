from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app import models, schemas
from app.api import deps
from app.database import get_session
from app.algorithms.pathfinding import astar, path_to_instructions
import json

router = APIRouter()

@router.get("/route")
def get_route(
    target_spot_id: int,
    start_x: int = 0,
    start_y: int = 0,
    session: Session = Depends(get_session),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Get Spot
    spot = session.get(models.Spot, target_spot_id)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
        
    # Get Zone (Grid)
    zone = session.get(models.Zone, spot.zone_id)
    if not zone or not zone.map_grid_data:
        raise HTTPException(status_code=404, detail="Zone specific grid data not found")
        
    try:
        grid = json.loads(zone.map_grid_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid grid data")
        
    # A* Algorithm
    # Note: Grid should be row-major, so coords are (y, x) usually, or (row, col)
    # Database stores x, y. Let's assume grid[y][x].
    start_pos = (start_y, start_x)
    end_pos = (spot.y1, spot.x1)
    
    path = astar(grid, start_pos, end_pos)
    
    if not path:
        return {"error": "No path found"}
        
    instructions = path_to_instructions(path)
    
    return {
        "path": path,
        "instructions": instructions
    }

@router.post("/assign")
def assign_spot(
    session: Session = Depends(get_session),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Logic: Find the first 'free' spot in any of the user's organization's zones
    if not current_user.organization_id:
         raise HTTPException(status_code=400, detail="User not part of an organization")

    # Get Organization Zones
    org = session.get(models.Organization, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Iterate through zones and spots
    # In a real app, we would query Redis for "free" spots directly to avoid DB overhead
    # For now, we iterate DB spots and check Redis status
    
    import redis
    import os
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    r = redis.Redis.from_url(redis_url, decode_responses=True)

    for zone in org.zones:
        for spot in zone.spots:
            # Check Redis status first (real-time)
            status = r.get(f"spot:{spot.id}:status")
            
            # If no status in Redis, fallback to DB status (default 'free')
            if not status:
                status = spot.status
            
            if status == 'free':
                # Found a free spot!
                # We could "reserve" it here to prevent race conditions
                # r.set(f"spot:{spot.id}:status", "reserved")
                return {
                    "spot_id": spot.id, 
                    "spot_name": spot.name,
                    "zone_name": zone.name,
                    "message": "Spot assigned successfully"
                }
    
    raise HTTPException(status_code=404, detail="No free spots available")
