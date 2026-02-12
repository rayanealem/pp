from fastapi import APIRouter
from app.api.v1.endpoints import auth, orgs, zones, cameras, analytics, navigation

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(orgs.router, prefix="/org", tags=["orgs"])
api_router.include_router(zones.router, prefix="/zones", tags=["zones"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["cameras"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(navigation.router, prefix="/navigation", tags=["navigation"])
