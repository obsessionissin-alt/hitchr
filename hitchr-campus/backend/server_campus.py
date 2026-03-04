from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from bson import ObjectId
from enum import Enum
import random
import string

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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    college: str
    email: Optional[str] = None
    invite_code: Optional[str] = None

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

# ============= HELPER FUNCTIONS =============

def generate_invite_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def calculate_suggested_contribution(distance_km: float) -> float:
    return round(distance_km * 5)

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Hitchr Campus MVP v0 - Travel Together 🚗"}

# ===== USER ROUTES =====

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Validate college email OR invite code
    if not user_data.email and not user_data.invite_code:
        raise HTTPException(status_code=400, detail="Either college email or invite code required")
    
    # Check if user already exists
    existing_user = None
    if user_data.email:
        existing_user = await db.users.find_one({"email": user_data.email})
    
    if existing_user:
        return User(**existing_user)
    
    # Create new user
    user = User(
        **user_data.dict(),
        campus_verified=True,
        badges=["New Member", "Campus Verified"]
    )
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

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
        # Simulate payment
        success = random.random() > 0.1  # 90% success rate
        if success:
            status = ContributionStatus.PAID
            # Store payment record
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
        else:
            raise HTTPException(status_code=400, detail="Payment failed. Please try again.")
    
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

# ===== SEED DATA =====

@api_router.post("/seed-campus")
async def seed_campus_data():
    # Clear existing data
    await db.route_posts.delete_many({})
    await db.users.delete_many({})
    await db.join_requests.delete_many({})
    await db.ride_instances.delete_many({})
    
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
    
    # Create sample route posts
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
            note="Quick trip to station. Join!",
            status=RideStatus.POSTED
        )
    ]
    
    for route in routes:
        await db.route_posts.insert_one(route.dict())
    
    return {
        "message": "Campus seed data created successfully",
        "users": len(users),
        "routes": len(routes)
    }

# Include router
app.include_router(api_router)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
