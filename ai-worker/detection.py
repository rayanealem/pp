import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR
from config import config

class Detector:
    def __init__(self):
        # Load YOLO model (downloads on first run)
        self.model = YOLO(config.YOLO_MODEL)
        # Load PaddleOCR
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')
        # Class IDs for vehicles in COCO dataset
        self.vehicle_classes = [2, 3, 5, 7] # car, motorcycle, bus, truck

    def detect_vehicles(self, frame):
        """
        Detects vehicles in the frame.
        Returns a list of bounding boxes [x1, y1, x2, y2].
        """
        results = self.model(frame, verbose=False, conf=config.CONFIDENCE_THRESHOLD)
        vehicles = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls = int(box.cls[0])
                if cls in self.vehicle_classes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    vehicles.append((int(x1), int(y1), int(x2), int(y2)))
        return vehicles

    def read_license_plate(self, frame, vehicle_box):
        """
        Crops the vehicle and attempts to read text (license plate).
        In a real scenario, a secondary YOLO model for plates is better.
        Here we try OCR on the vehicle crop (less accurate but sufficient for demo code structure).
        """
        x1, y1, x2, y2 = vehicle_box
        # Ensure crop is within frame
        h, w, _ = frame.shape
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        crop = frame[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        # Preprocessing for OCR (Grayscale + Threshold)
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        
        # Run OCR
        result = self.ocr.ocr(gray, cls=False)
        if not result or not result[0]:
            return None
            
        # Extract text with highest confidence
        text = ""
        max_conf = 0
        for line in result[0]:
            txt = line[1][0]
            conf = line[1][1]
            if conf > max_conf and len(txt) > 4: # Assume plate > 4 chars
                text = txt
                max_conf = conf
        return text if text else None

    def check_occupancy(self, spots, vehicle_boxes):
        """
        Maps vehicle boxes to spots.
        spots: List of dicts {'id': 1, 'coords': [x1, y1, x2, y2]}
        Returns list of (spot_id, status, license_plate_text)
        """
        updates = []
        # Simple IoU or Center-point logic
        for spot in spots:
            sx1, sy1, sx2, sy2 = spot['coords']
            spot_center = ((sx1+sx2)//2, (sy1+sy2)//2)
            
            is_occupied = False
            for box in vehicle_boxes:
                vx1, vy1, vx2, vy2 = box
                # Check if spot center is inside vehicle box
                if vx1 < spot_center[0] < vx2 and vy1 < spot_center[1] < vy2:
                    is_occupied = True
                    break
            
            status = 'occupied' if is_occupied else 'free'
            updates.append((spot['id'], status))
        return updates
