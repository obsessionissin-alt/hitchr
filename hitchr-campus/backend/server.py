from fastapi import FastAPI, APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from enum import Enum
import random
import string
import asyncio
import requests

# Earth radius in km for haversine
EARTH_RADIUS_KM = 6371.0

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= ENUMS =============

class RideStatus(str, Enum):
    POSTED = "posted"  # Pilot posted, accepting requests
    WAITING = "waiting"  # Rider accepted, waiting for pickup
    ACTIVE = "active"  # Ride in progress
    COMPLETED = "completed"  # Ride finished

class JoinRequestStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class ContributionStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    WAIVED = "waived"

# ============= MODELS =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    college: str
    email: Optional[str] = None
    invite_code: Optional[str] = None
    campus_verified: bool = True
    role: str = "rider"  # rider or pilot
    avatar: Optional[str] = None
    badges: List[str] = Field(default_factory=list)
    trust_score: int = 100
    fcm_token: Optional[str] = None
    fcm_updated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    college: str
    email: Optional[str] = None
    invite_code: Optional[str] = None

class UserFcmTokenUpdate(BaseModel):
    token: str

class Waypoint(BaseModel):
    lat: float
    lng: float
    address: str
    name: str

class RoutePost(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    pilot_id: str
    pilot_name: str
    pilot_college: str
    from_point: Waypoint
    to_point: Waypoint
    departure_time: datetime
    time_window_mins: int = 15  # Leaving in 15-30 mins
    seats_available: int
    total_seats: int
    distance_km: float
    duration_mins: int
    note: Optional[str] = None
    status: RideStatus = RideStatus.POSTED
    active_riders: List[str] = Field(default_factory=list)  # User IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RoutePostCreate(BaseModel):
    pilot_id: str
    pilot_name: str
    pilot_college: str
    from_point: Waypoint
    to_point: Waypoint
    departure_time: datetime
    time_window_mins: int = 15
    seats_available: int
    distance_km: float
    duration_mins: int
    note: Optional[str] = None

class JoinRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    route_id: str
    rider_id: str
    rider_name: str
    rider_college: str
    pickup: Waypoint
    dropoff: Waypoint
    status: JoinRequestStatus = JoinRequestStatus.PENDING
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None

class JoinRequestCreate(BaseModel):
    route_id: str
    rider_id: str
    rider_name: str
    rider_college: str
    pickup: Waypoint
    dropoff: Waypoint

class RideInstance(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    route_id: str
    pilot_id: str
    pilot_name: str
    rider_id: str
    rider_name: str
    pickup: Waypoint
    dropoff: Waypoint
    pilot_destination: Waypoint
    status: RideStatus = RideStatus.WAITING
    shared_distance_km: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    contribution_status: ContributionStatus = ContributionStatus.PENDING
    suggested_contribution: float = 0
    actual_contribution: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CompleteRideRequest(BaseModel):
    rider_id: str
    shared_distance_km: float

class ContributionRequest(BaseModel):
    ride_id: str
    rider_id: str
    amount: float
    payment_method: Optional[str] = None

# ============= LIVE INTERCEPTION (parallel system, do not modify route/ride models) =============

class LiveStartRequest(BaseModel):
    pilot_id: str
    seats_available: int

class LiveStopRequest(BaseModel):
    pilot_id: str

class LiveLocationUpdateRequest(BaseModel):
    pilot_id: str
    lat: float
    lng: float

class LiveRequestRequest(BaseModel):
    rider_id: str
    pilot_id: str

class LiveAcceptRequest(BaseModel):
    pilot_id: str
    rider_id: str

# ============= HELPER FUNCTIONS =============

def generate_invite_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def calculate_suggested_contribution(distance_km: float) -> float:
    return round(distance_km * 5)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in km."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def _bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Initial bearing from point 1 to point 2 in degrees [0, 360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dlon = math.radians(lon2 - lon1)
    y = math.sin(dlon) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlon)
    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360) % 360


def _angle_diff_deg(a: float, b: float) -> float:
    """Smallest angle between two bearings in degrees."""
    d = abs(a - b) % 360
    return min(d, 360 - d)


# In-memory cache for previous pilot coords (for speed/heading). Single-process only.
_live_prev: Dict[str, tuple] = {}  # pilot_id -> (lat, lng, updated_at)


class NotificationHub:
    """In-memory websocket registry by user_id."""

    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, []).append(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            conns = self._connections.get(user_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns and user_id in self._connections:
                del self._connections[user_id]

    async def send_user(self, user_id: str, payload: Dict[str, Any]) -> None:
        async with self._lock:
            conns = list(self._connections.get(user_id, []))

        stale: List[WebSocket] = []
        for conn in conns:
            try:
                await conn.send_json(payload)
            except Exception:
                stale.append(conn)

        for conn in stale:
            await self.disconnect(user_id, conn)


notification_hub = NotificationHub()


async def send_push_notification(user_id: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> None:
    """Best-effort FCM legacy send; no-op when env vars/token are missing."""
    server_key = os.getenv("FCM_SERVER_KEY")
    if not server_key:
        return

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "fcm_token": 1})
    if not user or not user.get("fcm_token"):
        return

    headers = {
        "Authorization": f"key={server_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "to": user["fcm_token"],
        "priority": "high",
        "notification": {
            "title": title,
            "body": body,
        },
        "data": data or {},
    }

    def _send():
        return requests.post(
            "https://fcm.googleapis.com/fcm/send",
            headers=headers,
            json=payload,
            timeout=5,
        )

    try:
        response = await asyncio.to_thread(_send)
        if response.status_code >= 300:
            logger.warning("FCM send failed (%s): %s", response.status_code, response.text)
    except Exception as e:
        logger.warning("FCM send exception: %s", e)

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Hitchr Campus MVP v0 - Travel Together 🚗"}


@api_router.get("/health")
async def health():
    """Quick liveness check for smoke tests and Load Balancers."""
    try:
        await client.admin.command("ping")
        return {"status": "ok", "mongo": "connected"}
    except Exception as e:
        logger.error("Health check failed: %s", e)
        raise HTTPException(status_code=503, detail="MongoDB unreachable")

# ===== USER ROUTES =====

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Check if user already exists by email OR by name+college
    existing_user = None
    
    # First try email (if provided)
    if user_data.email:
        existing_user = await db.users.find_one({"email": user_data.email})
    
    # If no email match, try name+college (case-insensitive for robustness)
    if not existing_user:
        existing_user = await db.users.find_one({
            "name": {"$regex": f"^{user_data.name}$", "$options": "i"},
            "college": {"$regex": f"^{user_data.college}$", "$options": "i"}
        })
    
    if existing_user:
        logger.info(f"Returning existing user: {existing_user['id']} ({existing_user['name']})")
        return User(**existing_user)
    
    # Create new user
    user = User(
        **user_data.dict(),
        campus_verified=True,
        badges=["New Member", "Campus Verified"]
    )
    logger.info(f"Creating new user: {user.id} ({user.name})")
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)


@api_router.post("/users/{user_id}/fcm-token")
async def update_user_fcm_token(user_id: str, token_data: UserFcmTokenUpdate):
    result = await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "fcm_token": token_data.token,
                "fcm_updated_at": datetime.utcnow(),
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}

@api_router.patch("/users/{user_id}/role")
async def toggle_user_role(user_id: str, role: str):
    if role not in ["rider", "pilot"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"role": role}

# ===== ROUTE POST (PILOT) =====

@api_router.post("/routes", response_model=RoutePost)
async def create_route_post(route_data: RoutePostCreate):
    route = RoutePost(
        **route_data.dict(),
        total_seats=route_data.seats_available
    )
    await db.route_posts.insert_one(route.dict())
    return route

@api_router.get("/routes", response_model=List[RoutePost])
async def get_route_posts(
    status: Optional[RideStatus] = Query(None),
    destination: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    query = {}
    
    if status:
        query["status"] = status
    else:
        # By default, only show posted routes (not completed)
        query["status"] = {"$in": [RideStatus.POSTED, RideStatus.WAITING, RideStatus.ACTIVE]}
    
    if destination:
        # Simple destination search
        query["$or"] = [
            {"to_point.name": {"$regex": destination, "$options": "i"}},
            {"to_point.address": {"$regex": destination, "$options": "i"}}
        ]
    
    routes = await db.route_posts.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [RoutePost(**route) for route in routes]

@api_router.get("/routes/{route_id}", response_model=RoutePost)
async def get_route_post(route_id: str):
    route_data = await db.route_posts.find_one({"id": route_id})
    if not route_data:
        raise HTTPException(status_code=404, detail="Route not found")
    return RoutePost(**route_data)

@api_router.get("/routes/pilot/{pilot_id}", response_model=List[RoutePost])
async def get_pilot_routes(pilot_id: str):
    routes = await db.route_posts.find({"pilot_id": pilot_id}).sort("created_at", -1).to_list(100)
    return [RoutePost(**route) for route in routes]

@api_router.patch("/routes/{route_id}/status")
async def update_route_status(route_id: str, status: RideStatus):
    await db.route_posts.update_one(
        {"id": route_id},
        {"$set": {"status": status}}
    )
    route_data = await db.route_posts.find_one({"id": route_id})
    return RoutePost(**route_data)

# ===== JOIN REQUESTS =====

@api_router.post("/join-requests", response_model=JoinRequest)
async def create_join_request(request_data: JoinRequestCreate):
    # Check if route exists and has seats
    route_data = await db.route_posts.find_one({"id": request_data.route_id})
    if not route_data:
        raise HTTPException(status_code=404, detail="Route not found")
    
    route = RoutePost(**route_data)
    if route.seats_available <= 0:
        raise HTTPException(status_code=400, detail="No seats available")
    
    # Check if already requested
    existing_request = await db.join_requests.find_one({
        "route_id": request_data.route_id,
        "rider_id": request_data.rider_id,
        "status": {"$in": [JoinRequestStatus.PENDING, JoinRequestStatus.ACCEPTED]}
    })
    
    if existing_request:
        return JoinRequest(**existing_request)
    
    # Create join request
    join_request = JoinRequest(**request_data.dict())
    await db.join_requests.insert_one(join_request.dict())
    await notification_hub.send_user(
        route.pilot_id,
        {
            "type": "join_request",
            "route_id": join_request.route_id,
            "request_id": join_request.id,
            "rider_id": join_request.rider_id,
            "requested_at": join_request.requested_at.isoformat(),
        },
    )
    return join_request

@api_router.get("/join-requests/route/{route_id}", response_model=List[JoinRequest])
async def get_route_join_requests(route_id: str, status: Optional[JoinRequestStatus] = Query(None)):
    query = {"route_id": route_id}
    if status:
        query["status"] = status
    
    requests = await db.join_requests.find(query).sort("requested_at", -1).to_list(100)
    return [JoinRequest(**req) for req in requests]

@api_router.get("/join-requests/rider/{rider_id}", response_model=List[JoinRequest])
async def get_rider_join_requests(rider_id: str):
    requests = await db.join_requests.find({"rider_id": rider_id}).sort("requested_at", -1).to_list(100)
    return [JoinRequest(**req) for req in requests]

@api_router.patch("/join-requests/{request_id}/respond")
async def respond_to_join_request(request_id: str, action: str):
    if action not in ["accept", "decline"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    request_data = await db.join_requests.find_one({"id": request_id})
    if not request_data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    join_request = JoinRequest(**request_data)
    
    if action == "accept":
        # Update request status
        await db.join_requests.update_one(
            {"id": request_id},
            {"$set": {"status": JoinRequestStatus.ACCEPTED, "responded_at": datetime.utcnow()}}
        )
        
        # Update route seats and add rider
        route_data = await db.route_posts.find_one({"id": join_request.route_id})
        route = RoutePost(**route_data)
        
        await db.route_posts.update_one(
            {"id": join_request.route_id},
            {
                "$set": {"seats_available": route.seats_available - 1},
                "$push": {"active_riders": join_request.rider_id}
            }
        )
        
        # Create ride instance
        ride_instance = RideInstance(
            route_id=join_request.route_id,
            pilot_id=route.pilot_id,
            pilot_name=route.pilot_name,
            rider_id=join_request.rider_id,
            rider_name=join_request.rider_name,
            pickup=join_request.pickup,
            dropoff=join_request.dropoff,
            pilot_destination=route.to_point,
            shared_distance_km=route.distance_km * 0.6,  # Demo: 60% overlap
            suggested_contribution=calculate_suggested_contribution(route.distance_km * 0.6)
        )
        await db.ride_instances.insert_one(ride_instance.dict())
        logger.info(f"Ride created: {ride_instance.id} (pilot={route.pilot_name}, rider={join_request.rider_name})")
        await notification_hub.send_user(
            join_request.rider_id,
            {
                "type": "join_request_accepted",
                "ride_id": ride_instance.id,
                "route_id": join_request.route_id,
                "request_id": request_id,
            },
        )
        await send_push_notification(
            join_request.rider_id,
            "You're in",
            f"{route.pilot_name} accepted your request.",
            {"ride_id": ride_instance.id, "event": "join_request_accepted"},
        )
        
        # Return the request + ride_id so the app can navigate to the ride
        updated_request = await db.join_requests.find_one({"id": request_id})
        result = JoinRequest(**updated_request).dict()
        result["ride_id"] = ride_instance.id
        return result

    else:  # decline
        await db.join_requests.update_one(
            {"id": request_id},
            {"$set": {"status": JoinRequestStatus.DECLINED, "responded_at": datetime.utcnow()}}
        )
    
    updated_request = await db.join_requests.find_one({"id": request_id})
    return JoinRequest(**updated_request)

# ===== RIDE INSTANCES =====

@api_router.get("/rides/rider/{rider_id}", response_model=List[RideInstance])
async def get_rider_rides(rider_id: str):
    rides = await db.ride_instances.find({"rider_id": rider_id}).sort("created_at", -1).to_list(100)
    return [RideInstance(**ride) for ride in rides]

@api_router.get("/rides/pilot/{pilot_id}", response_model=List[RideInstance])
async def get_pilot_rides(pilot_id: str):
    rides = await db.ride_instances.find({"pilot_id": pilot_id}).sort("created_at", -1).to_list(100)
    return [RideInstance(**ride) for ride in rides]

@api_router.get("/rides/{ride_id}", response_model=RideInstance)
async def get_ride_instance(ride_id: str):
    ride_data = await db.ride_instances.find_one({"id": ride_id})
    if not ride_data:
        raise HTTPException(status_code=404, detail="Ride not found")
    return RideInstance(**ride_data)

@api_router.patch("/rides/{ride_id}/start")
async def start_ride(ride_id: str):
    await db.ride_instances.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.ACTIVE, "started_at": datetime.utcnow()}}
    )
    
    ride_data = await db.ride_instances.find_one({"id": ride_id})
    if ride_data:
        await notification_hub.send_user(
            ride_data["rider_id"],
            {
                "type": "ride_started",
                "ride_id": ride_id,
            },
        )
        await send_push_notification(
            ride_data["rider_id"],
            "Ride started",
            "Your pilot has started the journey. Head to pickup.",
            {"ride_id": ride_id, "event": "ride_started"},
        )
    return RideInstance(**ride_data)

@api_router.patch("/rides/{ride_id}/complete")
async def complete_ride(ride_id: str):
    await db.ride_instances.update_one(
        {"id": ride_id},
        {"$set": {"status": RideStatus.COMPLETED, "completed_at": datetime.utcnow()}}
    )
    
    ride_data = await db.ride_instances.find_one({"id": ride_id})
    return RideInstance(**ride_data)

# ===== CONTRIBUTION & PAYMENT =====

@api_router.post("/contributions")
async def submit_contribution(contribution: ContributionRequest):
    ride_data = await db.ride_instances.find_one({"id": contribution.ride_id})
    if not ride_data:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    # Update ride with contribution
    if contribution.amount == 0:
        status = ContributionStatus.WAIVED
    else:
        status = ContributionStatus.PAID
        # Store payment record (deterministic for testing — no random failures)
        payment_record = {
            "transaction_id": f"HTR{ObjectId()}",
            "ride_id": contribution.ride_id,
            "rider_id": contribution.rider_id,
            "amount": contribution.amount,
            "payment_method": contribution.payment_method,
            "status": "success",
            "created_at": datetime.utcnow()
        }
        await db.payments.insert_one(payment_record)
    
    await db.ride_instances.update_one(
        {"id": contribution.ride_id},
        {
            "$set": {
                "contribution_status": status,
                "actual_contribution": contribution.amount
            }
        }
    )
    
    updated_ride = await db.ride_instances.find_one({"id": contribution.ride_id})
    return RideInstance(**updated_ride)

# ===== COMMUNITY ROUTES =====
@api_router.get("/communities")
async def get_communities():
    # Exclude Mongo _id (ObjectId) to keep responses JSON-serializable
    communities = await db.communities.find({}, {"_id": 0}).to_list(100)
    return communities

@api_router.get("/communities/{community_id}/memories")
async def get_community_memories(community_id: str):
    memories = await db.memories.find({"community_id": community_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return memories

@api_router.get("/communities/{community_id}/planned-trips")
async def get_community_planned_trips(community_id: str):
    trips = await db.planned_trips.find({"community_id": community_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return trips

# ===== PLANNED TRIPS =====
@api_router.post("/planned-trips")
async def create_planned_trip(data: dict):
    data["id"] = str(ObjectId())
    data["created_at"] = datetime.utcnow()
    await db.planned_trips.insert_one(data)
    return data

@api_router.get("/planned-trips")
async def get_planned_trips():
    trips = await db.planned_trips.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return trips

# ===== MEMORIES =====
@api_router.post("/memories")
async def create_memory(data: dict):
    data["id"] = str(ObjectId())
    data["created_at"] = datetime.utcnow()
    await db.memories.insert_one(data)
    return data

@api_router.get("/memories")
async def get_memories():
    memories = await db.memories.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return memories

# ===== DEBUG ENDPOINTS =====

@api_router.get("/debug/route/{route_id}")
async def debug_route(route_id: str):
    """Debug endpoint: shows a route, its pilot, and all join requests in one response."""
    route = await db.route_posts.find_one({"id": route_id}, {"_id": 0})
    if not route:
        return {"error": "Route not found", "route_id": route_id}

    requests = await db.join_requests.find({"route_id": route_id}, {"_id": 0}).to_list(100)
    rides = await db.ride_instances.find({"route_id": route_id}, {"_id": 0}).to_list(100)

    return {
        "route": route,
        "pilot_id": route.get("pilot_id"),
        "total_join_requests": len(requests),
        "join_requests": requests,
        "total_ride_instances": len(rides),
        "ride_instances": rides,
    }


@api_router.get("/debug/user/{user_id}")
async def debug_user(user_id: str):
    """Debug endpoint: shows a user, their routes, requests, and rides."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"error": "User not found", "user_id": user_id}

    routes = await db.route_posts.find({"pilot_id": user_id}, {"_id": 0}).to_list(100)
    join_requests_made = await db.join_requests.find({"rider_id": user_id}, {"_id": 0}).to_list(100)
    rides_as_pilot = await db.ride_instances.find({"pilot_id": user_id}, {"_id": 0}).to_list(100)
    rides_as_rider = await db.ride_instances.find({"rider_id": user_id}, {"_id": 0}).to_list(100)

    # Count pending requests on their routes
    pending_inbox = 0
    for route in routes:
        cnt = await db.join_requests.count_documents({"route_id": route["id"], "status": "pending"})
        pending_inbox += cnt

    return {
        "user": user,
        "routes_created": len(routes),
        "pending_inbox_requests": pending_inbox,
        "join_requests_made": len(join_requests_made),
        "rides_as_pilot": len(rides_as_pilot),
        "rides_as_rider": len(rides_as_rider),
    }


@api_router.get("/debug/overview")
async def debug_overview():
    """Debug endpoint: high-level stats for all collections — useful for smoke tests."""
    return {
        "users": await db.users.count_documents({}),
        "routes": await db.route_posts.count_documents({}),
        "join_requests": await db.join_requests.count_documents({}),
        "ride_instances": await db.ride_instances.count_documents({}),
        "communities": await db.communities.count_documents({}),
        "memories": await db.memories.count_documents({}),
        "planned_trips": await db.planned_trips.count_documents({}),
        "live_sessions": await db.live_sessions.count_documents({}),
        "intercept_requests": await db.intercept_requests.count_documents({}),
    }


# ===== SEED DATA =====

@api_router.post("/reset-database")
async def reset_database():
    """DANGER: Completely wipes all data. Use for testing only."""
    await db.users.delete_many({})
    await db.route_posts.delete_many({})
    await db.join_requests.delete_many({})
    await db.ride_instances.delete_many({})
    await db.communities.delete_many({})
    await db.memories.delete_many({})
    await db.planned_trips.delete_many({})
    await db.payments.delete_many({})
    await db.live_sessions.delete_many({})
    await db.intercept_requests.delete_many({})
    _live_prev.clear()

    return {
        "message": "Database completely reset. All collections empty.",
        "warning": "You need to run /seed-campus to add test data"
    }


@api_router.post("/seed-campus")
async def seed_campus_data():
    # Clear existing data
    await db.route_posts.delete_many({})
    await db.users.delete_many({})
    await db.join_requests.delete_many({})
    await db.ride_instances.delete_many({})
    await db.communities.delete_many({})
    await db.memories.delete_many({})
    await db.planned_trips.delete_many({})
    
    # Create sample users
    users = [
        User(
            name="Priya Sharma",
            college="Delhi University",
            email="priya@du.ac.in",
            campus_verified=True,
            role="pilot",
            badges=["Campus Verified", "Top Pilot", "5+ Rides"]
        ),
        User(
            name="Rohan Kapoor",
            college="BITS Pilani",
            email="rohan@bits.ac.in",
            campus_verified=True,
            role="pilot",
            badges=["Campus Verified", "Friendly", "New Pilot"]
        ),
        User(
            name="Aditi Menon",
            college="IIT Bombay",
            email="aditi@iitb.ac.in",
            campus_verified=True,
            role="rider",
            badges=["Campus Verified", "Great Co-rider"]
        )
    ]
    
    for user in users:
        await db.users.insert_one(user.dict())
    
    # Create sample route posts (Live Now)
    now = datetime.utcnow()
    routes = [
        RoutePost(
            pilot_id=users[0].id,
            pilot_name=users[0].name,
            pilot_college=users[0].college,
            from_point=Waypoint(lat=28.6901, lng=77.2197, address="North Campus", name="Main Gate"),
            to_point=Waypoint(lat=28.6139, lng=77.2090, address="Connaught Place", name="CP Metro"),
            departure_time=now + timedelta(minutes=10),
            time_window_mins=15,
            seats_available=3,
            total_seats=3,
            distance_km=8.5,
            duration_mins=25,
            note="Going for class at CP. Happy to share!",
            status=RideStatus.POSTED
        ),
        RoutePost(
            pilot_id=users[1].id,
            pilot_name=users[1].name,
            pilot_college=users[1].college,
            from_point=Waypoint(lat=28.3636, lng=75.5861, address="BITS Campus", name="Campus Gate"),
            to_point=Waypoint(lat=28.3670, lng=75.5967, address="Pilani Station", name="Railway Station"),
            departure_time=now + timedelta(minutes=5),
            time_window_mins=10,
            seats_available=2,
            total_seats=2,
            distance_km=3.2,
            duration_mins=10,
            note="Quick trip to station!",
            status=RideStatus.POSTED
        )
    ]
    
    for route in routes:
        await db.route_posts.insert_one(route.dict())
    
    # Create communities
    communities = [
        {
            "id": str(ObjectId()),
            "name": "Delhi NCR Campus Riders",
            "description": "Daily commuters across Delhi colleges",
            "member_count": 847,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(ObjectId()),
            "name": "Weekend Travelers",
            "description": "Plan trips together on weekends",
            "member_count": 523,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(ObjectId()),
            "name": "Late Night Campus",
            "description": "Late night safety rides",
            "member_count": 312,
            "created_at": datetime.utcnow()
        }
    ]
    
    for community in communities:
        await db.communities.insert_one(community)
    
    # Create planned trips
    planned_trips = [
        {
            "id": str(ObjectId()),
            "user_id": users[0].id,
            "user_name": users[0].name,
            "user_college": users[0].college,
            "from_point": {"lat": 28.7041, "lng": 77.1025, "address": "GTB Nagar", "name": "GTB Nagar"},
            "to_point": {"lat": 28.4089, "lng": 77.3178, "address": "Noida", "name": "Noida Sector 15"},
            "planned_date": (now + timedelta(days=2)).isoformat(),
            "seats_needed": 2,
            "description": "Looking for co-travelers to Noida this Saturday",
            "community_id": communities[0]["id"],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(ObjectId()),
            "user_id": users[2].id,
            "user_name": users[2].name,
            "user_college": users[2].college,
            "from_point": {"lat": 19.0760, "lng": 72.8777, "address": "Mumbai", "name": "IIT Bombay"},
            "to_point": {"lat": 18.5204, "lng": 73.8567, "address": "Pune", "name": "Pune"},
            "planned_date": (now + timedelta(days=3)).isoformat(),
            "seats_needed": 3,
            "description": "Weekend trip to Pune, split fuel costs",
            "community_id": communities[1]["id"],
            "created_at": datetime.utcnow()
        }
    ]
    
    for trip in planned_trips:
        await db.planned_trips.insert_one(trip)
    
    # Create memories
    memories = [
        {
            "id": str(ObjectId()),
            "user_id": users[0].id,
            "user_name": users[0].name,
            "user_college": users[0].college,
            "from_point": {"lat": 28.6901, "lng": 77.2197, "address": "North Campus", "name": "North Campus"},
            "to_point": {"lat": 28.6139, "lng": 77.2090, "address": "CP", "name": "Connaught Place"},
            "story": "Amazing ride with fellow students. We talked about exams and shared music. Made new friends!",
            "tags": ["safe", "fun", "friendly"],
            "distance_km": 8.5,
            "community_id": communities[0]["id"],
            "created_at": (now - timedelta(days=2))
        },
        {
            "id": str(ObjectId()),
            "user_id": users[1].id,
            "user_name": users[1].name,
            "user_college": users[1].college,
            "from_point": {"lat": 28.3636, "lng": 75.5861, "address": "BITS Campus", "name": "Campus"},
            "to_point": {"lat": 28.3670, "lng": 75.5967, "address": "Pilani", "name": "Railway Station"},
            "story": "Quick ride to catch my train. Grateful for the campus community!",
            "tags": ["helpful", "quick"],
            "distance_km": 3.2,
            "community_id": communities[0]["id"],
            "created_at": (now - timedelta(days=5))
        },
        {
            "id": str(ObjectId()),
            "user_id": users[2].id,
            "user_name": users[2].name,
            "user_college": users[2].college,
            "from_point": {"lat": 19.0760, "lng": 72.8777, "address": "IIT Bombay", "name": "Main Gate"},
            "to_point": {"lat": 19.1197, "lng": 72.9047, "address": "Powai", "name": "Powai Lake"},
            "story": "Late night ride back to campus. Felt safe and secure. This is what community means!",
            "tags": ["safe", "night", "grateful"],
            "distance_km": 4.5,
            "community_id": communities[2]["id"],
            "created_at": (now - timedelta(days=1))
        }
    ]
    
    for memory in memories:
        await db.memories.insert_one(memory)
    
    return {
        "message": "Campus seed data created successfully",
        "users": len(users),
        "routes": len(routes),
        "communities": len(communities),
        "planned_trips": len(planned_trips),
        "memories": len(memories)
    }

# ============= LIVE INTERCEPTION ROUTES =============
# (Must be defined and included in api_router BEFORE app.include_router(api_router))

live_router = APIRouter(prefix="/live", tags=["live"])


async def _ensure_live_indexes() -> None:
    """Create indexes for live_sessions and intercept_requests. Safe to run on every startup."""
    try:
        # live_sessions
        await db.live_sessions.create_index("pilot_id")
        await db.live_sessions.create_index("is_live")
        await db.live_sessions.create_index([("location", "2dsphere")])
        await db.live_sessions.create_index(
            "last_updated_at",
            expireAfterSeconds=60,
            name="ttl_last_updated",
        )
        # intercept_requests
        await db.intercept_requests.create_index("pilot_id")
        await db.intercept_requests.create_index("rider_id")
        await db.intercept_requests.create_index(
            "expires_at",
            expireAfterSeconds=0,
            name="ttl_expires_at",
        )
        logger.info("Live interception indexes created/verified")
    except Exception as e:
        logger.warning("Live index creation (non-fatal): %s", e)


@live_router.post("/start")
async def live_start(body: LiveStartRequest):
    """Pilot goes live. Upserts session with is_live=true."""
    now = datetime.utcnow()
    doc = {
        "pilot_id": body.pilot_id,
        "seats_available": body.seats_available,
        "is_live": True,
        "location": {"type": "Point", "coordinates": [0.0, 0.0]},  # placeholder until first location update
        "heading": None,
        "speed_kmh": None,
        "last_updated_at": now,
        "created_at": now,
    }
    await db.live_sessions.update_one(
        {"pilot_id": body.pilot_id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, "pilot_id": body.pilot_id}


@live_router.post("/stop")
async def live_stop(body: LiveStopRequest):
    """Pilot stops live. Sets is_live=false."""
    await db.live_sessions.update_one(
        {"pilot_id": body.pilot_id},
        {"$set": {"is_live": False}},
    )
    _live_prev.pop(body.pilot_id, None)
    return {"ok": True, "pilot_id": body.pilot_id}


@live_router.post("/location-update")
async def live_location_update(body: LiveLocationUpdateRequest):
    """Update pilot location, compute heading and speed from previous position."""
    now = datetime.utcnow()
    session = await db.live_sessions.find_one({"pilot_id": body.pilot_id, "is_live": True})
    if not session:
        # Keep this endpoint resilient: if client sends updates before/after
        # live-session transitions, recreate the active session instead of 404.
        logger.warning(
            "live_location_update without active session; auto-recovering pilot_id=%s",
            body.pilot_id,
        )
        await db.live_sessions.update_one(
            {"pilot_id": body.pilot_id},
            {
                "$set": {
                    "pilot_id": body.pilot_id,
                    "is_live": True,
                    "location": {"type": "Point", "coordinates": [body.lng, body.lat]},
                    "heading": None,
                    "speed_kmh": None,
                    "last_updated_at": now,
                    "created_at": now,
                },
                "$setOnInsert": {"seats_available": 3},
            },
            upsert=True,
        )
        _live_prev[body.pilot_id] = (body.lat, body.lng, now)
        return {"ok": True, "recovered": True}

    heading: Optional[float] = None
    speed_kmh: Optional[float] = None
    prev = _live_prev.get(body.pilot_id)
    if prev:
        plat, plon, ptime = prev
        heading = _bearing_deg(plat, plon, body.lat, body.lng)
        dist_km = _haversine_km(plat, plon, body.lat, body.lng)
        dt_h = (now - ptime).total_seconds() / 3600.0
        speed_kmh = round(dist_km / dt_h, 2) if dt_h > 0 else 0.0

    _live_prev[body.pilot_id] = (body.lat, body.lng, now)

    update: Dict[str, Any] = {
        "location": {"type": "Point", "coordinates": [body.lng, body.lat]},
        "last_updated_at": now,
    }
    if heading is not None:
        update["heading"] = heading
    if speed_kmh is not None:
        update["speed_kmh"] = speed_kmh

    await db.live_sessions.update_one(
        {"pilot_id": body.pilot_id},
        {"$set": update},
    )
    return {"ok": True}


@live_router.get("/radar")
async def live_radar(
    lat: float = Query(..., description="Center latitude"),
    lng: float = Query(..., description="Center longitude"),
    radius_km: float = Query(5.0, description="Search radius in km"),
    heading: Optional[float] = Query(None, description="Optional rider heading for corridor filter (±45°)"),
):
    """Find live pilots within radius. Optional heading filter."""
    radius_m = radius_km * 1000.0
    query = {
        "is_live": True,
        "seats_available": {"$gt": 0},
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius_m,
            }
        },
    }
    cursor = db.live_sessions.find(
        query,
        {"pilot_id": 1, "location": 1, "heading": 1, "seats_available": 1, "_id": 0},
    )
    results = []
    async for doc in cursor:
        coords = doc.get("location", {}).get("coordinates", [0, 0])
        plng, plat = coords[0], coords[1]
        pilot_heading = doc.get("heading")
        if heading is not None and pilot_heading is not None:
            if _angle_diff_deg(heading, pilot_heading) > 45:
                continue
        results.append({
            "pilot_id": doc["pilot_id"],
            "lat": plat,
            "lng": plng,
            "heading": pilot_heading,
            "seats_available": doc.get("seats_available", 0),
        })
    return results


@live_router.post("/request")
async def live_request(body: LiveRequestRequest):
    """Rider requests intercept. Creates pending request, notifies pilot, schedules expiry."""
    session = await db.live_sessions.find_one({"pilot_id": body.pilot_id, "is_live": True})
    if not session:
        raise HTTPException(status_code=404, detail="Pilot not live")
    if session.get("seats_available", 0) <= 0:
        raise HTTPException(status_code=400, detail="No seats available")

    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=15)
    # Dedupe: if a pending request already exists for this rider/pilot, reuse it.
    existing = await db.intercept_requests.find_one(
        {"pilot_id": body.pilot_id, "rider_id": body.rider_id, "status": "pending"},
        {"_id": 0, "id": 1, "created_at": 1, "expires_at": 1},
    )
    if existing:
        return {"ok": True, "request_id": existing.get("id"), "deduped": True}

    req = {
        "id": str(ObjectId()),
        "rider_id": body.rider_id,
        "pilot_id": body.pilot_id,
        "status": "pending",
        "created_at": now,
        "expires_at": expires_at,
    }
    await db.intercept_requests.insert_one(req)

    await notification_hub.send_user(
        body.pilot_id,
        {"type": "intercept_request", "rider_id": body.rider_id},
    )

    rider_id = body.rider_id
    request_id = req["id"]

    async def _notify_expired() -> None:
        await asyncio.sleep(15)
        result = await db.intercept_requests.update_one(
            {"id": request_id, "status": "pending"},
            {"$set": {"status": "expired"}},
        )
        if result.modified_count > 0:
            await notification_hub.send_user(rider_id, {"type": "intercept_expired"})

    asyncio.create_task(_notify_expired())
    return {"ok": True, "request_id": req["id"]}


@live_router.post("/accept")
async def live_accept(body: LiveAcceptRequest):
    """Pilot accepts intercept. Decrements seats, notifies rider."""
    req = await db.intercept_requests.find_one(
        {"pilot_id": body.pilot_id, "rider_id": body.rider_id, "status": "pending"},
    )
    if not req:
        raise HTTPException(status_code=404, detail="No pending intercept request")

    # Atomically claim a seat if available
    seat_update = await db.live_sessions.update_one(
        {"pilot_id": body.pilot_id, "seats_available": {"$gt": 0}, "is_live": True},
        {"$inc": {"seats_available": -1}},
    )
    if seat_update.modified_count != 1:
        # No seats available or session not live; do not accept request
        raise HTTPException(status_code=409, detail="No seats available")

    req_update = await db.intercept_requests.update_one(
        {"id": req["id"], "status": "pending"},
        {"$set": {"status": "accepted"}},
    )
    if req_update.modified_count != 1:
        # Roll back seat claim if request was not pending
        await db.live_sessions.update_one(
            {"pilot_id": body.pilot_id},
            {"$inc": {"seats_available": 1}},
        )
        raise HTTPException(status_code=409, detail="Request not pending")
    await notification_hub.send_user(
        body.rider_id,
        {"type": "intercept_accepted", "pilot_id": body.pilot_id},
    )
    return {"ok": True, "pilot_id": body.pilot_id, "rider_id": body.rider_id}


# Must include live_router in api_router BEFORE mounting api_router on app
api_router.include_router(live_router)

# Include api_router (with live routes) on app
app.include_router(api_router)


async def _notifications_ws_handler(websocket: WebSocket):
    user_id = websocket.query_params.get("user_id")
    if not user_id:
        await websocket.close(code=1008)
        return

    await notification_hub.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive; clients may send pings/no-op text.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await notification_hub.disconnect(user_id, websocket)


@app.websocket("/ws/notifications")
async def notifications_ws(websocket: WebSocket):
    await _notifications_ws_handler(websocket)


@app.websocket("/api/ws/notifications")
async def notifications_ws_api(websocket: WebSocket):
    # Compatibility endpoint for clients configured with /api prefix.
    await _notifications_ws_handler(websocket)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_indexes():
    await _ensure_live_indexes()
    logger.info(
        "Registered routes: %s",
        ", ".join(sorted(route.path for route in app.routes)),
    )


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
