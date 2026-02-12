import os

class Config:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    # Processing settings
    PROCESS_FPS = 2  # Process 1 frame every 0.5 seconds
    CONFIDENCE_THRESHOLD = 0.5
    
    # Model paths (auto-downloaded by libraries usually)
    YOLO_MODEL = "yolov8n.pt" # Nano model for speed

config = Config()
