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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    phone: Optional[str] = None
    badges: List[str] = Field(default_factory=list)
    trust_score: int = 100
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    phone: Optional[str] = None

class Waypoint(BaseModel):
    lat: float
    lng: float
    address: str
    name: str

class RideRoute(BaseModel):
    origin: Waypoint
    destination: Waypoint
    waypoints: List[Waypoint] = Field(default_factory=list)
    distance_km: float
    duration_mins: int

class Rider(BaseModel):
    user_id: str
    name: str
    pickup: Waypoint
    dropoff: Waypoint
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "joined"  # joined, riding, completed

class Ride(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    pilot_id: str
    pilot_name: str
    route: RideRoute
    status: str = "planned"  # planned, live, completed
    riders: List[Rider] = Field(default_factory=list)
    max_riders: int = 3
    departure_time: Optional[datetime] = None
    vehicle_type: str = "car"  # car, bike, auto
    created_at: datetime = Field(default_factory=datetime.utcnow)
    description: Optional[str] = None

class RideCreate(BaseModel):
    pilot_id: str
    pilot_name: str
    route: RideRoute
    departure_time: Optional[datetime] = None
    vehicle_type: str = "car"
    max_riders: int = 3
    description: Optional[str] = None

class JoinRideRequest(BaseModel):
    user_id: str
    user_name: str
    pickup: Waypoint
    dropoff: Waypoint

class CompleteRideRequest(BaseModel):
    rider_id: str
    actual_dropoff: Waypoint
    shared_distance_km: float

class PaymentRequest(BaseModel):
    ride_id: str
    rider_id: str
    amount: float
    payment_method: str  # upi, card
    
class PaymentResponse(BaseModel):
    success: bool
    transaction_id: str
    amount: float
    message: str

class Community(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    name: str
    description: str
    member_count: int = 0
    icon: str = "users"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Hitchr API - Travel Together 🚗"}

# ===== USER ROUTES =====
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    user = User(**user_data.dict())
    result = await db.users.insert_one(user.dict())
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_data = await db.users.find_one({"id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_data)

# ===== RIDE ROUTES =====
@api_router.post("/rides", response_model=Ride)
async def create_ride(ride_data: RideCreate):
    ride = Ride(**ride_data.dict())
    await db.rides.insert_one(ride.dict())
    return ride

@api_router.get("/rides", response_model=List[Ride])
async def get_rides(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    query = {}
    if status:
        query["status"] = status
    
    rides = await db.rides.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    return [Ride(**ride) for ride in rides]

@api_router.get("/rides/{ride_id}", response_model=Ride)
async def get_ride(ride_id: str):
    ride_data = await db.rides.find_one({"id": ride_id})
    if not ride_data:
        raise HTTPException(status_code=404, detail="Ride not found")
    return Ride(**ride_data)

@api_router.post("/rides/{ride_id}/join", response_model=Ride)
async def join_ride(ride_id: str, join_request: JoinRideRequest):
    ride_data = await db.rides.find_one({"id": ride_id})
    if not ride_data:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride = Ride(**ride_data)
    
    # Check if already joined
    if any(r.user_id == join_request.user_id for r in ride.riders):
        raise HTTPException(status_code=400, detail="Already joined this ride")
    
    # Check capacity
    if len(ride.riders) >= ride.max_riders:
        raise HTTPException(status_code=400, detail="Ride is full")
    
    # Add rider
    new_rider = Rider(
        user_id=join_request.user_id,
        name=join_request.user_name,
        pickup=join_request.pickup,
        dropoff=join_request.dropoff
    )
    ride.riders.append(new_rider)
    
    # Update status to live if it was planned
    if ride.status == "planned":
        ride.status = "live"
    
    await db.rides.update_one(
        {"id": ride_id},
        {"$set": {"riders": [r.dict() for r in ride.riders], "status": ride.status}}
    )
    
    return ride

@api_router.post("/rides/{ride_id}/complete", response_model=Dict)
async def complete_ride(ride_id: str, complete_request: CompleteRideRequest):
    ride_data = await db.rides.find_one({"id": ride_id})
    if not ride_data:
        raise HTTPException(status_code=404, detail="Ride not found")
    
    ride = Ride(**ride_data)
    
    # Find rider
    rider = next((r for r in ride.riders if r.user_id == complete_request.rider_id), None)
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found in this ride")
    
    # Update rider status
    for r in ride.riders:
        if r.user_id == complete_request.rider_id:
            r.status = "completed"
    
    # Calculate suggested contribution (₹5 per km)
    suggested_amount = round(complete_request.shared_distance_km * 5)
    
    await db.rides.update_one(
        {"id": ride_id},
        {"$set": {"riders": [r.dict() for r in ride.riders]}}
    )
    
    return {
        "success": True,
        "rider": rider.dict(),
        "actual_dropoff": complete_request.actual_dropoff.dict(),
        "shared_distance_km": complete_request.shared_distance_km,
        "suggested_contribution": suggested_amount
    }

@api_router.post("/payments/simulate", response_model=PaymentResponse)
async def simulate_payment(payment: PaymentRequest):
    # Simulate payment processing
    import random
    
    # 90% success rate for demo
    success = random.random() > 0.1
    
    if success:
        transaction_id = f"TXN{ObjectId()}"
        
        # Store payment record
        payment_record = {
            "transaction_id": transaction_id,
            "ride_id": payment.ride_id,
            "rider_id": payment.rider_id,
            "amount": payment.amount,
            "payment_method": payment.payment_method,
            "status": "success",
            "created_at": datetime.utcnow()
        }
        await db.payments.insert_one(payment_record)
        
        return PaymentResponse(
            success=True,
            transaction_id=transaction_id,
            amount=payment.amount,
            message="Payment successful!"
        )
    else:
        return PaymentResponse(
            success=False,
            transaction_id="",
            amount=payment.amount,
            message="Payment failed. Please try again."
        )

# ===== COMMUNITY ROUTES =====
@api_router.get("/communities", response_model=List[Community])
async def get_communities():
    communities = await db.communities.find().to_list(100)
    return [Community(**c) for c in communities]

@api_router.post("/communities", response_model=Community)
async def create_community(community: Community):
    await db.communities.insert_one(community.dict())
    return community

# ===== SEED DATA =====
@api_router.post("/seed")
async def seed_data():
    # Clear existing data
    await db.rides.delete_many({})
    await db.communities.delete_many({})
    
    # Seed rides
    sample_rides = [
        Ride(
            pilot_id="pilot1",
            pilot_name="Rahul",
            route=RideRoute(
                origin=Waypoint(lat=28.6139, lng=77.2090, address="Connaught Place", name="CP"),
                destination=Waypoint(lat=28.5355, lng=77.3910, address="Noida Sector 62", name="Noida"),
                distance_km=25.5,
                duration_mins=45
            ),
            status="live",
            vehicle_type="car",
            max_riders=3,
            description="Going to office, happy to share ride!"
        ),
        Ride(
            pilot_id="pilot2",
            pilot_name="Priya",
            route=RideRoute(
                origin=Waypoint(lat=28.7041, lng=77.1025, address="GTB Nagar", name="GTB Nagar Metro"),
                destination=Waypoint(lat=28.4595, lng=77.0266, address="Cyber City Gurgaon", name="Cyber City"),
                distance_km=32.0,
                duration_mins=55
            ),
            status="planned",
            vehicle_type="car",
            max_riders=2,
            departure_time=datetime.utcnow(),
            description="Daily commute to Gurgaon"
        ),
        Ride(
            pilot_id="pilot3",
            pilot_name="Amit",
            route=RideRoute(
                origin=Waypoint(lat=28.6289, lng=77.2065, address="Kashmere Gate", name="Kashmere Gate"),
                destination=Waypoint(lat=28.6692, lng=77.4538, address="Ghaziabad", name="Ghaziabad"),
                distance_km=18.5,
                duration_mins=35
            ),
            status="live",
            vehicle_type="auto",
            max_riders=2,
            description="Auto ride to Ghaziabad"
        )
    ]
    
    for ride in sample_rides:
        await db.rides.insert_one(ride.dict())
    
    # Seed communities
    sample_communities = [
        Community(name="Delhi NCR Commuters", description="Daily travelers in Delhi NCR", member_count=1250, icon="building"),
        Community(name="Weekend Travelers", description="Weekend trip enthusiasts", member_count=850, icon="sun"),
        Community(name="College Students", description="Student community", member_count=2100, icon="book"),
        Community(name="Tech Park Riders", description="IT professionals", member_count=950, icon="laptop")
    ]
    
    for community in sample_communities:
        await db.communities.insert_one(community.dict())
    
    return {"message": "Seed data created successfully", "rides": len(sample_rides), "communities": len(sample_communities)}

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
