# Hitchr Communities Specification
## Location + Interest Based Social Groups

---

## Overview

Communities are the social fabric of Hitchr - organized groups where users discover companions, plan trips, and build identity through shared movement patterns. Communities bridge the gap between individual journeys and collective experiences.

**Core Principle:** "Communities transform strangers into companions through shared routes and destinations."

---

## Community Types

### 1. Location Communities (Auto-Suggested)

**Purpose:** Connect people who frequently travel to/from the same locations.

**Categories:**

**A. Campus Communities**
- Universities: DU, BITS Pilani, IIT Delhi, etc.
- Colleges: St. Stephen's, Miranda House, etc.
- Auto-detection: Based on frequent visits during academic

 hours

**Example:**
```
DU Campus Community
👥 2,400 members
🚗 145 journeys today
📍 North Campus, Delhi
```

**B. Workplace Communities**
- Corporate offices: Microsoft Hyderabad, Google Bangalore, etc.
- Tech parks: Whitefield Tech Park, Cyber City Gurgaon
- Co-working spaces: WeWork, 91Springboard
- Auto-detection: Weekday 9-6 travel patterns

**Example:**
```
Microsoft Hyderabad Community
👥 890 members
🚗 67 journeys today
📍 Gachibowli, Hyderabad
```

**C. Neighborhood Communities**
- Residential areas: Koramangala, Indiranagar, Hauz Khas
- Auto-detection: Consistent start/end point patterns
- Local area coordination

**Example:**
```
Koramangala Locals
👥 1,250 members
🚗 89 journeys today
📍 Koramangala, Bangalore
```

**Auto-Join Logic:**
```python
def suggest_location_communities(user):
    # Analyze user's journey history
    locations = analyze_frequent_locations(user, last_30_days=True)
    
    suggestions = []
    for location in locations:
        if location.visit_count >= 10:  # Visited 10+ times
            community = find_community_by_location(location)
            if community and not user_is_member(user, community):
                suggestions.append({
                    'community': community,
                    'reason': f"You've traveled here {location.visit_count} times"
                })
    
    return suggestions
```

### 2. Interest Communities (User-Joined)

**Purpose:** Connect people with shared travel interests and destinations.

**Categories:**

**A. Destination Communities**
- Popular trips: Spiti Valley, Ladakh, Kerala Backwaters
- Weekend getaways: Goa, Rishikesh, Manali
- International: Thailand, Nepal, Dubai

**Example:**
```
Spiti Travelers
👥 5,200 members
🏔️ 89 trips planned
📅 Active: Jun-Sep
```

**B. Activity Communities**
- Hiking & Trekking
- Foodie Tours
- Photography Journeys
- Night Owls (late night travelers)
- Fitness Enthusiasts (gym commuters)

**Example:**
```
Bangalore Foodies
👥 3,100 members
🍽️ 234 restaurant recommendations
📍 Active citywide
```

**C. Event Communities**
- Music festivals: Sunburn, NH7 Weekender
- Sports events: IPL matches, marathons
- Conferences: Tech conferences, startup events
- Temporary communities (event duration only)

**Example:**
```
Sunburn Goa 2026
👥 1,450 members
🎵 Dec 28-31, 2026
📍 Vagator, Goa
```

### 3. Trip Clusters (Temporary Communities)

**Purpose:** Organize specific group trips with defined itineraries.

**Lifecycle:**
1. **Planning:** Organizer creates trip, users express interest
2. **Active:** Trip dates arrive, coordination via Map
3. **Ongoing:** Real-time coordination during trip
4. **Completed:** Trip ends, becomes content (photos, stories)
5. **Archived:** Historical record, can be referenced

**Example:**
```
Spiti Road Trip - June 2026
👤 Organized by Sarah Mehta
📅 June 15-22, 2026
👥 12 interested • 4 committed
🚗 2 cars available

Itinerary:
Day 1: Delhi → Shimla
Day 2: Shimla → Kalpa
Day 3-5: Kaza exploration
Day 6-7: Return journey
```

---

## Community Structure

### Community Profile

```
┌─────────────────────────────────────────────────────┐
│  [Cover Photo: Mountain landscape]                  │
│                                                     │
│  🏔️  Spiti Travelers                              │
│                                                     │
│  👥 5,200 members • 234 active today               │
│  📍 Spiti Valley, Himachal Pradesh                 │
│  🗓️ Best season: June - September                 │
│                                                     │
│  [Joined ✓] [Invite] [Settings]                   │
├─────────────────────────────────────────────────────┤
│  📖 About                                          │
│  Community for travelers exploring Spiti Valley.   │
│  Share experiences, plan trips, find companions.   │
│                                                     │
│  📊 Stats                                          │
│  • 342 trips completed this year                   │
│  • 28 upcoming trips planned                        │
│  • 1,450 journeys shared                           │
│                                                     │
│  🏆 Top Contributors (This Month)                  │
│  [Avatar] Rahul S. • 12 trips organized            │
│  [Avatar] Priya K. • 45 helpful posts              │
│  [Avatar] Amit M. • 28 journey stories             │
│                                                     │
│  [Plan a Trip] [View Leaderboard]                  │
├─────────────────────────────────────────────────────┤
│  📱 Community Feed                                 │
│  [Tab: Recent] [Popular] [Trips] [Photos]         │
│                                                     │
│  [Feed content here...]                            │
└─────────────────────────────────────────────────────┘
```

### Community Features

**1. Community Feed**
- Posts from members
- Trip plans and updates
- Route recommendations
- Q&A discussions
- Photo galleries

**2. Trip Planning**
- Create trip clusters
- Find travel companions
- Share itineraries
- Coordinate logistics

**3. Leaderboard**
- Top contributors (monthly)
- Most active travelers
- Helpful members
- Recognition and badges

**4. Member Directory**
- Searchable member list
- Filter by badges, location
- View profiles
- Connect directly

**5. Resources**
- Pinned posts (important info)
- Route guides
- Safety tips
- Local contacts

**6. Events**
- Upcoming trips
- Meetups
- Group activities
- Calendar view

---

## Community Discovery & Joining

### Discovery Screen

```
┌─────────────────────────────────────────────────────┐
│  Communities         🔍         [+ Create]          │
├─────────────────────────────────────────────────────┤
│  Your Communities (3)                    [View all→]│
│  ┌─────┐  ┌─────┐  ┌─────┐                        │
│  │ DU  │  │ MS  │  │Spiti│                        │
│  │2.4K │  │890  │  │5.2K │                        │
│  └─────┘  └─────┘  └─────┘                        │
├─────────────────────────────────────────────────────┤
│  Suggested for You                                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🏢 Microsoft Hyderabad                        │ │
│  │ 890 members • 67 active today                 │ │
│  │ "You've traveled here 12 times"               │ │
│  │                                [Join]          │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🏫 Koramangala Locals                         │ │
│  │ 1,250 members • 89 active today               │ │
│  │ "You live in this area"                       │ │
│  │                                [Join]          │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Categories                                         │
│  [Location] [Destinations] [Activities] [Events]   │
│                                                     │
│  🏔️ Destinations                                  │
│                                                     │
│  [Card: Spiti Valley] [Card: Ladakh]              │
│  [Card: Kerala] [Card: Goa]                        │
│                                                     │
│  🎯 Activities                                     │
│                                                     │
│  [Card: Hiking] [Card: Foodies]                    │
│  [Card: Photography] [Card: Night Owls]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Join Flow

**Step 1: Discover Community**
- Browse categories
- Search by keyword
- View from suggestion
- Friend invite

**Step 2: View Community Profile**
- See member count, activity
- Read description
- View top posts
- Check trip clusters

**Step 3: Join**
- Tap "Join" button
- For private communities: Request sent
- For public communities: Instant join
- Welcome notification from community

**Step 4: Onboarding**
- "Welcome to [Community]!" message
- Quick tour of features
- Suggested first actions:
  - Introduce yourself
  - Browse recent trips
  - Plan your first journey

---

## Trip Cluster System

### Creating a Trip Cluster

**Flow:**
```
Tap "Plan a Trip" in Community or Profile
    ↓
Enter Trip Details
    ↓
Select Communities to Share
    ↓
Create Trip Cluster
    ↓
Posted to Feed + Communities
    ↓
Members express interest
    ↓
Coordinate logistics in discussion
    ↓
Trip dates arrive → Active coordination
    ↓
Complete trip → Share stories
```

### Trip Creation Form

```
┌─────────────────────────────────────────────────────┐
│  ←  Create Trip Plan                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🎯 Trip Destination                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ Search location... (e.g., Spiti Valley)       │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  📅 Dates                                          │
│  [June 15, 2026] → [June 22, 2026]                │
│  Duration: 7 days                                   │
│                                                     │
│  🚗 Trip Type                                      │
│  [●] Road Trip  [ ] Hiking  [ ] Exploration        │
│  [ ] Event      [ ] Other                          │
│                                                     │
│  📝 Description                                    │
│  ┌───────────────────────────────────────────────┐ │
│  │ Epic high-altitude adventure through Spiti... │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  👥 Max Participants                               │
│  [8] people                                         │
│                                                     │
│  🗺️ Route Planning (Optional)                     │
│  [Add Stops/Waypoints]                             │
│  • Delhi → Shimla → Kalpa → Kaza → Delhi          │
│                                                     │
│  💰 Budget Estimate (Optional)                     │
│  ₹[15,000] per person                              │
│                                                     │
│  🏘️ Share with Communities                        │
│  [✓] Spiti Travelers                               │
│  [✓] Mountain Hikers                               │
│  [ ] Delhi Explorers                               │
│                                                     │
│  [Create Trip Cluster]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Trip Cluster Phases

**Phase 1: Planning (Before Trip)**

Features:
- Discussion thread
- Participant list (interested vs. committed)
- Itinerary collaboration
- Logistics planning
- Resource sharing (gear, vehicles, contacts)

UI:
```
┌─────────────────────────────────────────────────────┐
│  Spiti Road Trip - June 2026                       │
│  📅 15 days until departure                        │
├─────────────────────────────────────────────────────┤
│  👥 Participants                                   │
│  Committed (4): [Sarah] [Rahul] [Priya] [Amit]    │
│  Interested (8): [Alice] [David] [+6 more]        │
│                                                     │
│  [I'm Interested] [Commit to Join]                 │
├─────────────────────────────────────────────────────┤
│  📋 Itinerary (Tap to discuss)                     │
│  Day 1: Delhi → Shimla (350km, 8h)                │
│  Day 2: Shimla → Kalpa (220km, 7h)                │
│  Day 3: Kalpa → Kaza (200km, 8h)                  │
│  Day 4-5: Kaza exploration                         │
│  Day 6: Kaza → Kalpa (200km, 8h)                  │
│  Day 7: Kalpa → Delhi (570km, 12h)                │
│                                                     │
│  [Edit Itinerary] [Suggest Changes]                │
├─────────────────────────────────────────────────────┤
│  💬 Discussion (24 messages)                       │
│  [View all discussions →]                          │
└─────────────────────────────────────────────────────┘
```

**Phase 2: Active (During Trip)**

Features:
- Real-time location sharing (opt-in)
- Live coordination on Map
- Check-in system
- Photo/story sharing
- Emergency coordination

UI Enhancement:
```
🔴 TRIP IN PROGRESS
4 travelers currently in Kaza
[View on Map] [Share Update]
```

**Phase 3: Completed (After Trip)**

Features:
- Trip summary
- Photo gallery
- Story compilation
- Feedback and ratings
- Archive for future reference

UI:
```
┌─────────────────────────────────────────────────────┐
│  Spiti Road Trip - Completed ✓                     │
│  June 15-22, 2026                                   │
├─────────────────────────────────────────────────────┤
│  📊 Trip Summary                                   │
│  👥 4 travelers completed                          │
│  🚗 1,540 km traveled                              │
│  📸 142 photos shared                              │
│  ⭐ 4.8/5 trip rating                             │
│                                                     │
│  📷 Photo Gallery                                  │
│  [View all 142 photos →]                           │
│                                                     │
│  📖 Trip Stories                                   │
│  [4 journey stories posted]                        │
│                                                     │
│  💭 Reflections                                    │
│  Sarah: "Best trip ever! Amazing group..."         │
│  Rahul: "The high passes were incredible..."       │
│                                                     │
│  🔄 Plan Similar Trip                              │
│  [Create New Trip Based on This]                   │
└─────────────────────────────────────────────────────┘
```

---

## Community Management

### Community Roles

**1. Founder**
- Created the community
- Full admin rights
- Can delete community

**2. Admin**
- Appointed by founder
- Moderate content
- Manage members
- Pin posts
- Edit community info

**3. Moderator**
- Can remove posts
- Can warn members
- Limited admin rights

**4. Member**
- Post content
- Join trips
- Engage with community

**5. Contributor Badge**
- Top 10% most active
- Special badge display
- Priority in trip clusters

### Admin Tools

```
┌─────────────────────────────────────────────────────┐
│  Community Settings                                 │
├─────────────────────────────────────────────────────┤
│  🎨 Appearance                                     │
│  • Edit cover photo                                 │
│  • Edit community icon                              │
│  • Update description                               │
│                                                     │
│  👥 Members                                        │
│  • View all members (5,200)                        │
│  • Approve join requests (for private)             │
│  • Remove members                                   │
│  • Assign roles (admin, moderator)                 │
│                                                     │
│  📌 Content Management                             │
│  • Pin important posts                              │
│  • Remove inappropriate content                     │
│  • Feature top contributors                         │
│                                                     │
│  🔔 Notifications                                  │
│  • Send community announcements                     │
│  • Schedule event reminders                         │
│                                                     │
│  📊 Analytics                                      │
│  • Member growth                                    │
│  • Engagement metrics                               │
│  • Top posts                                        │
│  • Trip completion rate                             │
│                                                     │
│  ⚙️ Settings                                       │
│  • Privacy (Public / Private)                       │
│  • Member permissions                               │
│  • Content guidelines                               │
│  • Community rules                                  │
└─────────────────────────────────────────────────────┘
```

### Content Moderation

**Automated:**
- Spam detection
- Inappropriate content filter
- Duplicate post detection

**Manual:**
- Admin/mod review queue
- Member reports
- Post approval (for private communities)

**Actions:**
- Remove post
- Warn member
- Temporary ban
- Permanent ban
- Report to Hitchr team

---

## Community Badges

### Community-Specific Badges

**Campus Hero**
- Requirements: Top 10 in campus community leaderboard
- Visible on profile and in community
- Monthly reset

**Workplace Connector**
- Requirements: 50+ journeys coordinated to workplace
- Permanent badge

**Destination Expert**
- Requirements: 10+ trips to destination, 100+ helpful posts
- Recognized as community expert

**Trip Organizer**
- Requirements: Successfully organized 5+ trip clusters
- Special badge display

**Community Builder**
- Requirements: Invited 10+ members to community
- Permanent recognition

---

## Community Analytics

### For Members

**Personal Stats in Community:**
- Journeys completed within community
- Rank in leaderboard
- Contributions (posts, trips organized)
- Engagement received
- Badge progress

**Community Insights:**
- Peak travel times
- Popular routes
- Upcoming trips
- Active members

### For Admins

**Growth Metrics:**
- New members (daily/weekly/monthly)
- Member retention rate
- Active member percentage

**Engagement Metrics:**
- Posts per day
- Comments per post
- Trip clusters created
- Trip completion rate

**Content Performance:**
- Top posts (by engagement)
- Top contributors
- Most viewed discussions

---

## Technical Specifications

### Database Schema

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  type VARCHAR(50), -- location, interest, trip_cluster
  category VARCHAR(50), -- campus, workplace, destination, etc.
  cover_photo_url TEXT,
  icon_url TEXT,
  location GEOGRAPHY(POINT),
  member_count INT DEFAULT 0,
  privacy VARCHAR(20), -- public, private
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE community_members (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20), -- member, moderator, admin, founder
  joined_at TIMESTAMP,
  contribution_score INT DEFAULT 0,
  UNIQUE(community_id, user_id)
);

CREATE TABLE trip_clusters (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),
  organizer_id UUID REFERENCES users(id),
  title VARCHAR(200),
  destination VARCHAR(200),
  start_date DATE,
  end_date DATE,
  trip_type VARCHAR(50),
  description TEXT,
  max_participants INT,
  itinerary JSONB,
  budget_estimate DECIMAL,
  status VARCHAR(20), -- planning, active, completed, cancelled
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE trip_participants (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trip_clusters(id),
  user_id UUID REFERENCES users(id),
  status VARCHAR(20), -- interested, committed, confirmed, completed
  joined_at TIMESTAMP
);

CREATE TABLE community_posts (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  media JSONB,
  post_type VARCHAR(50),
  engagement JSONB,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

### API Endpoints

```
GET /api/communities
  - Returns: list of communities (with filters)

GET /api/communities/:id
  - Returns: community details

POST /api/communities
  - Body: community data
  - Returns: created community

POST /api/communities/:id/join
  - Joins user to community

GET /api/communities/:id/members
  - Returns: community members

GET /api/communities/:id/feed
  - Returns: community feed posts

POST /api/trip-clusters
  - Body: trip data
  - Returns: created trip cluster

GET /api/trip-clusters/:id
  - Returns: trip cluster details

POST /api/trip-clusters/:id/interest
  - Express interest in trip

POST /api/trip-clusters/:id/commit
  - Commit to joining trip
```

---

## Future Enhancements

### Phase 2
- Verified communities (official campus/workplace verification)
- Community partnerships (brand sponsorships)
- Community events calendar
- Community challenges (monthly goals)

### Phase 3
- Sub-communities (within larger communities)
- Community merchandise
- Virtual meetups
- Cross-community collaborations

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** Ready for Implementation



