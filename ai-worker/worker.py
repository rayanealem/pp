import time
import cv2
import redis
import json
import threading
import requests
import os
from detection import Detector
from config import config

# Configuration
API_URL = os.getenv("API_URL", "http://backend:8000/api/v1")
WORKER_EMAIL = os.getenv("WORKER_EMAIL", "admin@example.com")
WORKER_PASSWORD = os.getenv("WORKER_PASSWORD", "password")

# Connect to Redis
r = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)

detector = Detector()

def get_auth_token():
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={"username": WORKER_EMAIL, "password": WORKER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed: {response.text}")
        return None
    except Exception as e:
        print(f"Connection error to backend: {e}")
        return None

def fetch_cameras_and_spots(token):
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Fetch all cameras
        response = requests.get(f"{API_URL}/cameras/", headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch cameras: {response.text}")
            return []
        
        cameras = response.json()
        active_streams = []

        for cam in cameras:
            # We need spots for this camera. 
            # In our model, Camera -> Zone -> Spots.
            if not cam.get("zone_id"):
                continue
            
            # Fetch Zone details to get spots
            z_resp = requests.get(f"{API_URL}/zones/{cam['zone_id']}", headers=headers)
            if z_resp.status_code == 200:
                zone_data = z_resp.json()
                spots = zone_data.get("spots", [])
                
                # Format spots for detector: id, coords [x1, y1, x2, y2]
                formatted_spots = []
                for s in spots:
                    formatted_spots.append({
                        'id': s['id'],
                        'coords': [s['x1'], s['y1'], s['x2'], s['y2']]
                    })
                
                active_streams.append({
                    'id': cam['id'],
                    'rtsp_url': cam['rtsp_url'],
                    'spots': formatted_spots
                })
        
        return active_streams

    except Exception as e:
        print(f"Error fetching config: {e}")
        return []

def process_camera(camera_id, rtsp_url, spots):
    """
    Process a single camera stream.
    spots: List of spot dicts for this camera.
    """
    print(f"Starting worker for Camera {camera_id} at {rtsp_url} with {len(spots)} spots")
    cap = cv2.VideoCapture(rtsp_url)
    
    if not cap.isOpened():
        print(f"Error: Could not open stream {rtsp_url}")
        return

    last_process_time = 0
    interval = 1.0 / config.PROCESS_FPS # e.g. 0.5s

    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"Stream ended for Camera {camera_id}. Retrying...")
            cap.release()
            time.sleep(5)
            cap = cv2.VideoCapture(rtsp_url)
            continue

        current_time = time.time()
        if current_time - last_process_time > interval:
            # Run Detection
            vehicles = detector.detect_vehicles(frame)
            
            # Check Occupancy
            updates = detector.check_occupancy(spots, vehicles)
            
            # Update Redis
            for spot_id, status in updates:
                # Key: spot:{id}:status
                # We can also store history/log if status changed
                old_status = r.get(f"spot:{spot_id}:status")
                if old_status != status:
                    print(f"Spot {spot_id} changed to {status}")
                    r.set(f"spot:{spot_id}:status", status)
                    # Publish event
                    r.publish("spot_updates", json.dumps({"spot_id": spot_id, "status": status}))
            
            last_process_time = current_time
        
        # Sleep slightly to save CPU
        time.sleep(0.01)

def main():
    print("AI Worker Started. Waiting for backend...")
    
    # Wait for backend to be ready
    token = None
    while not token:
        token = get_auth_token()
        if not token:
            print("Waiting for backend/auth...")
            time.sleep(5)
    
    print("Authenticated. Fetching configuration...")
    
    streams = fetch_cameras_and_spots(token)
    
    if not streams:
        print("No active cameras found with zones/spots. Sleeping...")
        # In a real app, we might poll periodically.
        while True:
            time.sleep(60)
            
    # Start threads
    threads = []
    for stream in streams:
        t = threading.Thread(target=process_camera, args=(stream['id'], stream['rtsp_url'], stream['spots']))
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()

if __name__ == "__main__":
    main()
