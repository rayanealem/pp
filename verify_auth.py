import requests
import json
import random
import string
import time

BASE_URL = "http://backend:8000/api/v1"

def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def create_zone(token, zone_name):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"name": zone_name, "total_spots": 50}
    try:
        resp = requests.post(f"{BASE_URL}/zones/", json=payload, headers=headers)
        if resp.status_code == 200:
            print(f"Zone '{zone_name}' created. ID: {resp.json().get('id')}")
            return resp.json().get('id')
        else:
            print(f"Failed to create zone: {resp.text}")
            return None
    except Exception as e:
        print(f"Create Zone Exception: {e}")
        return None

def create_camera(token, zone_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": f"Cam-{random_string(4)}",
        "rtsp_url": "rtsp://dummy/stream",
        "zone_id": zone_id
    }
    try:
        resp = requests.post(f"{BASE_URL}/cameras/connect", json=payload, headers=headers)
        if resp.status_code == 200:
            print(f"Camera created. ID: {resp.json().get('id')}")
            return resp.json().get('id')
        else:
            print(f"Failed to create camera: {resp.text}")
            return None
    except Exception as e:
        print(f"Create Camera Exception: {e}")
        return None

def create_spot(token, zone_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": f"Spot-{random_string(3)}",
        "x1": 0, "y1": 0, "x2": 100, "y2": 100,
        "is_occupied": False
    }
    try:
        resp = requests.post(f"{BASE_URL}/zones/{zone_id}/spots", json=payload, headers=headers)
        if resp.status_code == 200:
            print(f"Spot created. ID: {resp.json().get('id')}")
            return resp.json().get('id')
        else:
            print(f"Failed to create spot: {resp.text}")
            return None
    except Exception as e:
        print(f"Create Spot Exception: {e}")
        return None

def main():
    email = f"test_{random_string()}@example.com"
    password = "password123"
    name = "Test Org"
    admin_name = "Test Admin"

    print(f"Testing with email: {email}")

    # 1. Register
    reg_payload = {
        "name": name,
        "admin_email": email,
        "admin_password": password,
        "admin_name": admin_name,
        "plan_tier": "free"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/org/register", json=reg_payload)
        if resp.status_code != 200:
            print(f"Registration Failed: {resp.text}")
            exit(1)
        
        org_data = resp.json()
        print(f"Registration Success! Org ID: {org_data.get('id')}")

    except Exception as e:
        print(f"Registration Exception: {e}")
        exit(1)

    # 2. Login
    login_payload = {
        "username": email,
        "password": password
    }
    
    token = None
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
        if resp.status_code != 200:
            print(f"Login Failed: {resp.text}")
            exit(1)
            
        token_data = resp.json()
        token = token_data.get("access_token")
        print("Login Success! Access Token obtained.")

    except Exception as e:
        print(f"Login Exception: {e}")
        exit(1)

    # 3. Create Zone
    zone_id = create_zone(token, "Main Lot")
    if not zone_id: exit(1)

    # 4. Create Camera
    cam_id = create_camera(token, zone_id)
    if not cam_id: exit(1)

    # 5. Create Spot
    spot_id = create_spot(token, zone_id)
    if not spot_id: exit(1)

    print("VERIFICATION SUCCESSFUL: Auth, Zone, Camera, and Spot creation working.")

if __name__ == "__main__":
    main()
