from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, engine
from .initial_data import init_data
from .core.config import settings
from sqlmodel import Session
from app.models import Spot
from contextlib import asynccontextmanager
import redis.asyncio as aioredis
import asyncio
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with Session(engine) as session:
        init_data(session)
    yield

app = FastAPI(title="CloudPark API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to CloudPark API"}

def update_spot_status(spot_id: int, status: str):
    """Updates the spot status in the database."""
    with Session(engine) as session:
        spot = session.get(Spot, spot_id)
        if spot:
            spot.status = status
            session.add(spot)
            session.commit()
            print(f"Updated spot {spot_id} to {status} in DB")
        else:
            print(f"Spot {spot_id} not found in DB")


# ── WebSocket: Real-time spot updates ──────────────────────────────
class ConnectionManager:
    """Manages active WebSocket connections."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/spots")
async def websocket_spot_updates(websocket: WebSocket):
    """
    WebSocket endpoint that subscribes to Redis 'spot_updates' channel
    and forwards messages to the connected client in real-time.
    """
    await manager.connect(websocket)
    
    # Connect to Redis pub/sub
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.subscribe("spot_updates")
    
    async def redis_listener():
        """Listen for Redis pub/sub messages and broadcast to WebSocket."""
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                await manager.broadcast(data)
                
                # Persist to DB
                try:
                    msg_json = json.loads(data)
                    spot_id = msg_json.get("spot_id")
                    status = msg_json.get("status")
                    if spot_id is not None and status:
                        await asyncio.to_thread(update_spot_status, spot_id, status)
                except Exception as e:
                    print(f"Error persisting spot status: {e}")
    
    listener_task = asyncio.create_task(redis_listener())
    
    try:
        # Keep connection alive; listen for client messages (e.g. pings)
        while True:
            data = await websocket.receive_text()
            # Client can send "ping" to keep alive
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        listener_task.cancel()
        await pubsub.unsubscribe("spot_updates")
        await r.aclose()
