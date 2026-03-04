# Hitchr Feed Specification
## Social Movement Content Platform

---

## Overview

The Feed is the primary engagement surface of Hitchr - a social content platform where movement creates stories, identity, and community. Users open Hitchr daily to consume journey stories before coordinating travel.

**Core Principle:** "When users talk about Hitchr, they share stories and community belonging, not ride coordination."

---

## Feed Architecture

### Tab Position
- **Primary Tab:** Feed is the home screen (leftmost tab)
- **Default Landing:** Opens to Feed on app launch
- **Daily Habit:** Designed for 10+ min/day engagement

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  ☰  HITCHR           🔍              🔔 [23]        │ Header
├─────────────────────────────────────────────────────┤
│  [+] [@You] [@Alice] [@DU] [Live🔴] [→]           │ Story Bar
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Journey Story Card                            │ │
│  │ User: Alice Kumar 🌟                          │ │
│  │ [Photo: Sunset mountain drive]                │ │
│  │ "Best drive ever! Koramangala → Nandi Hills" │ │
│  │ 42 km • 1.2h • 0.9kg CO₂ saved              │ │
│  │ ❤️ 24  💬 8  ⚡ 12  📤              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Live Activity Card                            │ │
│  │ 🟢 12 people heading to Whitefield now       │ │
│  │ [Mini map preview]                            │ │
│  │ [Join them →]                                 │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Trip Cluster Card                             │ │
│  │ Sarah is planning Spiti trip • June 15-22    │ │
│  │ 👥 12 interested • 4 committed               │ │
│  │ [I'm interested]                              │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Pull to refresh...]                             │
└─────────────────────────────────────────────────────┘
```

---

## Content Types

### 1. Journey Story Card

**Purpose:** Post-trip content showcasing completed journeys with photos, routes, and experiences.

**Components:**
- **User Header:**
  - Profile avatar (48px circular)
  - Username + community badge
  - Timestamp (relative: "2h ago")
  - Menu icon (⋮) for options

- **Visual Content:**
  - Photo/video (16:9 aspect ratio)
  - Swipeable carousel for multiple images
  - Route map overlay option
  - Auto-generated journey visualization

- **Journey Details:**
  - Route text: "Koramangala → Airport Terminal 1"
  - Caption (280 chars max)
  - @ mentions (travel companions)
  - # hashtags (communities, locations)

- **Stats Bar:**
  - Distance traveled (km)
  - Duration (formatted: "1h 24m" or "24m")
  - CO₂ saved vs. separate trips
  - Weather icon (optional)

- **Engagement Actions:**
  - ❤️ Like (1 point to creator)
  - 💬 Comment (2 points)
  - ⚡ Hit (5 points, opens connection modal)
  - 📤 Share (to feed, communities, external)
  - 🔖 Save (bookmark for later)

- **CTA:**
  - "Travel with Alice" button (if available for coordination)

**Data Structure:**
```json
{
  "type": "journey_story",
  "id": "journey_12345",
  "user": {
    "id": "user_abc",
    "name": "Alice Kumar",
    "avatar_url": "...",
    "badges": ["early_hitchr", "city_connector"]
  },
  "content": {
    "media": [
      {"type": "image", "url": "...", "alt": "Sunset drive"}
    ],
    "caption": "Best drive ever! Great conversations...",
    "route": {
      "origin": "Koramangala",
      "destination": "Nandi Hills",
      "waypoints": []
    }
  },
  "stats": {
    "distance_km": 42,
    "duration_minutes": 72,
    "co2_saved_kg": 0.9
  },
  "engagement": {
    "likes": 24,
    "comments": 8,
    "hits": 12,
    "shares": 3,
    "saves": 5
  },
  "mentions": ["user_xyz"],
  "communities": ["bangalore_explorers"],
  "timestamp": "2026-01-09T08:30:00Z",
  "visibility": "public"
}
```

### 2. Live Activity Card

**Purpose:** Real-time coordination opportunities showing active journeys happening now.

**Components:**
- **Status Indicator:** 🟢 Live Now badge
- **Activity Summary:** "12 people heading to Whitefield now"
- **Mini Map:** Shows live avatar positions
- **Route Preview:** Common destination visible
- **CTA:** "Join them" button → Opens Map tab filtered to this activity

**Behavior:**
- Updates every 30 seconds
- Only shows activities within 10km radius
- Prioritizes user's frequent routes
- Auto-hides when activity completes

**Data Structure:**
```json
{
  "type": "live_activity",
  "id": "activity_789",
  "destination": "Whitefield Tech Park",
  "participant_count": 12,
  "active_journeys": [
    {"user_id": "...", "location": {...}, "eta": 25}
  ],
  "map_preview": {
    "center": [12.9716, 77.7946],
    "zoom": 12
  },
  "cta_action": "open_map_filtered"
}
```

### 3. Upcoming Trip Card

**Purpose:** Promote planned trips and trip clusters for future coordination.

**Components:**
- **Trip Header:**
  - Organizer avatar + name
  - Trip title: "Spiti Road Trip"
  - Date range: "June 15-22, 2026"

- **Trip Details:**
  - Destination(s)
  - Duration
  - Trip type (road trip, hiking, exploration)

- **Social Proof:**
  - Interested count: "👥 12 interested"
  - Committed count: "4 committed"
  - Mutual friends indicator: "3 friends are interested"

- **Description Preview:**
  - First 2 lines of trip description
  - "Read more" link to full trip cluster

- **CTA:**
  - "I'm interested" (tentative)
  - "Join group" (committed)
  - Links to Communities > Trip Clusters

**Data Structure:**
```json
{
  "type": "trip_cluster",
  "id": "trip_456",
  "organizer": {
    "user_id": "user_sarah",
    "name": "Sarah Mehta"
  },
  "trip": {
    "title": "Spiti Road Trip",
    "destination": "Spiti Valley, HP",
    "start_date": "2026-06-15",
    "end_date": "2026-06-22",
    "type": "road_trip"
  },
  "participants": {
    "interested": 12,
    "committed": 4,
    "mutual_friends": 3
  },
  "description": "Epic high-altitude adventure...",
  "communities": ["spiti_travelers", "mountain_hikers"]
}
```

### 4. Community Highlight Card

**Purpose:** Showcase community milestones, growth, and engagement.

**Components:**
- **Community Info:**
  - Community icon/logo
  - Community name
  - Member count

- **Highlight Content:**
  - Milestone: "Just hit 500 travelers!"
  - Top contributor this week (avatar + stat)
  - Recent popular post preview

- **Visual:**
  - Community cover photo
  - Achievement graphic

- **CTA:**
  - "Join community" (if not member)
  - "View community" (if already member)

**Data Structure:**
```json
{
  "type": "community_highlight",
  "id": "highlight_321",
  "community": {
    "id": "comm_du_campus",
    "name": "DU Campus",
    "icon_url": "...",
    "member_count": 500
  },
  "highlight": {
    "type": "milestone",
    "title": "500 travelers milestone!",
    "description": "Our community is growing strong"
  },
  "top_contributor": {
    "user_id": "...",
    "name": "Rahul Sharma",
    "stat": "42 journeys this month"
  }
}
```

### 5. Achievement Card

**Purpose:** Celebrate user badge unlocks and milestones to motivate others.

**Components:**
- **User Info:**
  - Avatar + name
  - "just unlocked" text

- **Badge Display:**
  - Large badge icon
  - Badge name: "City Connector"
  - Badge description

- **Achievement Stats:**
  - What was accomplished
  - "25 journeys with 15 different people"

- **Celebration Visual:**
  - Confetti animation
  - Gradient background

- **Engagement:**
  - "Congratulate" button
  - Comment to celebrate

**Data Structure:**
```json
{
  "type": "achievement",
  "id": "achievement_999",
  "user": {
    "id": "user_david",
    "name": "David Patel"
  },
  "badge": {
    "id": "city_connector",
    "name": "City Connector",
    "icon": "🔗",
    "description": "25+ journeys with 15+ different people"
  },
  "timestamp": "2026-01-09T10:15:00Z"
}
```

### 6. Route Recommendation Post

**Purpose:** User-generated content sharing route tips, stops, and recommendations.

**Components:**
- **User Header:** Standard
- **Route Info:** "Best coffee stops on MG Road"
- **Location Tags:** Tagged places along route
- **Photos:** Multiple images of recommended spots
- **Description:** Tips and recommendations
- **Engagement:** Like, Save (high save rate), Comment

**Data Structure:**
```json
{
  "type": "route_recommendation",
  "id": "rec_555",
  "user": {...},
  "route": {
    "name": "MG Road Coffee Trail",
    "locations": [
      {"name": "Third Wave Coffee", "coords": [...]},
      {"name": "Blue Tokai", "coords": [...]}
    ]
  },
  "media": [...],
  "description": "Must-try coffee stops...",
  "engagement": {...}
}
```

### 7. Pre-Trip Planning Post

**Purpose:** Ask the community about upcoming travel plans.

**Components:**
- **User Header:** Standard
- **Question:** "Who's going to Goa next weekend?"
- **Trip Details:** Dates, destination, trip type
- **Responses:** "I'm going!" count
- **Discussion:** Comments with trip details
- **CTA:** Creates or links to trip cluster

**Data Structure:**
```json
{
  "type": "pre_trip_post",
  "id": "pretrip_777",
  "user": {...},
  "content": {
    "question": "Who's going to Goa next weekend?",
    "destination": "Goa",
    "dates": ["2026-01-18", "2026-01-20"]
  },
  "responses": {
    "interested": 8,
    "comments": 15
  },
  "trip_cluster_id": "trip_888"
}
```

---

## Story Bar

### Purpose
Instagram-style stories for ephemeral content and quick journey highlights.

### Components

**Your Story Circle:**
- Large circular avatar with gradient ring
- "+" icon overlay
- Tap to create story

**Following Users' Stories:**
- Circular avatars with gradient rings
- Unseen stories: Gradient ring (coral → blue)
- Seen stories: Gray ring
- Tap to view fullscreen story

**Community Stories:**
- Community icon in circle
- Shows aggregated stories from community members
- Badge indicator on ring

**Live Now Stories:**
- Special "🔴 Live" indicator
- Shows users currently on journeys
- Real-time updates
- Pulsing animation

### Story Types

1. **Journey Story:**
   - Photo/video of journey
   - Route overlay
   - Stats (distance, time)
   - 24-hour expiry

2. **Live Journey Story:**
   - Real-time journey in progress
   - ETA countdown
   - "Join me" CTA
   - Expires when journey ends

3. **Community Story:**
   - Aggregated content from community
   - Curated by community admins
   - Highlights events, milestones

### Story Interactions
- Tap left/right: Previous/next story
- Swipe down: Exit story view
- Swipe up: "Hit" or "Travel with"
- Tap profile: View full profile
- Reply: Opens DM

---

## Feed Algorithm

### Ranking Factors

**1. Recency (30% weight)**
- Newer content prioritized
- Time decay: Posts >24h decay faster
- Live activities always top

**2. Engagement Rate (25% weight)**
- Likes + comments + hits + shares
- Normalized by view count
- Recent engagement weighted higher

**3. Community Relevance (20% weight)**
- User's community posts prioritized
- Frequent travel routes
- Location-based relevance

**4. Creator Reputation (15% weight)**
- User's badge tier
- Leaderboard ranking
- Engagement history

**5. Content Type Variety (10% weight)**
- Mix different post types
- Avoid consecutive journey stories
- Intersperse live activities

**6. Connection Strength (10% weight)**
- Past travel companions higher
- Users traveled with 3+ times
- Mutual community members

### Algorithm Pseudocode

```python
def rank_feed_posts(user, posts):
    scored_posts = []
    
    for post in posts:
        score = 0
        
        # Recency score (0-30)
        hours_old = (now - post.timestamp).hours
        score += 30 * exp(-0.05 * hours_old)
        
        # Engagement score (0-25)
        engagement_rate = post.engagement_count / post.view_count
        score += 25 * min(engagement_rate / 0.1, 1.0)
        
        # Community relevance (0-20)
        if post.community in user.communities:
            score += 20
        if post.route in user.frequent_routes:
            score += 10
        
        # Creator reputation (0-15)
        creator_rank = get_leaderboard_rank(post.user)
        score += 15 * (1 - creator_rank / 1000)  # Top 1000
        
        # Content variety (0-10)
        recent_types = get_recent_feed_types(user, limit=5)
        if post.type not in recent_types:
            score += 10
        
        # Connection strength (0-10)
        if has_traveled_together(user, post.user, times=3):
            score += 10
        elif has_traveled_together(user, post.user, times=1):
            score += 5
        
        # Boost live activities
        if post.type == "live_activity":
            score *= 1.5
        
        scored_posts.append((post, score))
    
    # Sort by score descending
    scored_posts.sort(key=lambda x: x[1], reverse=True)
    
    # Apply diversity filter
    return apply_content_diversity(scored_posts)

def apply_content_diversity(scored_posts):
    """Ensure no 3 consecutive posts of same type"""
    result = []
    prev_types = []
    
    for post, score in scored_posts:
        if len(prev_types) >= 2 and all(t == post.type for t in prev_types[-2:]):
            # Skip if last 2 were same type
            continue
        
        result.append(post)
        prev_types.append(post.type)
        
        if len(result) >= 20:  # Initial load
            break
    
    return result
```

---

## Engagement Mechanics

### Like ❤️

**Action:**
- Single tap on heart icon
- Fills heart with red color
- Animation: Heart pops and scales

**Effect:**
- +1 to post's like count
- +1 point to creator
- Adds to user's "Liked" collection
- Creator gets notification (batched)

**Notification:**
- "Alice and 5 others liked your journey"
- Grouped by post
- Max 1 notification per hour

### Comment 💬

**Action:**
- Tap comment icon
- Opens comment bottom sheet
- Text input (280 chars)
- @ mentions enabled

**Effect:**
- +1 to post's comment count
- +2 points to creator
- Appears in comment thread
- Creator gets notification (immediate)

**Comment Thread:**
- Nested replies (1 level)
- Sort: Top / Recent
- Can like individual comments
- Report/flag option

### Hit ⚡

**Action:**
- Tap lightning bolt icon
- Opens connection modal
- Choose quick action

**Effect:**
- +5 points to creator
- Opens direct connection
- High engagement signal
- If creator is top 100 → counts toward brand rewards

**Modal Options:**
- 💬 Send message
- 🚗 Travel together next time
- ⭐ Just appreciate (notification only)

**Notification:**
- "David hit your journey story!"
- High priority notification
- Shows user profile preview
- Options: View profile / Start chat

### Share 📤

**Action:**
- Tap share icon
- Opens share modal

**Options:**
- Share to Feed (repost)
- Share to Community
- Share to WhatsApp
- Share to Instagram Story (with app link)
- Copy link

**Effect:**
- +2 points to creator (internal share)
- +5 points for external share (viral)
- Tracks referral if new user joins

### Save 🔖

**Action:**
- Tap bookmark icon
- Fills bookmark icon

**Effect:**
- Saves to user's "Saved" collection
- Accessible in Profile > Saved
- No points to creator (private action)
- Analytics: Save rate = quality signal

---

## Feed Interactions

### Pull to Refresh
- Standard gesture
- Shows new posts since last refresh
- "X new posts" indicator
- Smooth animation

### Infinite Scroll
- Loads 20 posts initially
- Loads 10 more on scroll to bottom
- Loading indicator
- "You're all caught up" end state

### Post Menu (⋮)
- Report post
- Not interested
- Save post
- Share post
- Hide this user
- Copy link

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│            🌍                       │
│                                     │
│    Your feed is waiting to          │
│       come alive!                   │
│                                     │
│  Complete your first journey or     │
│  join communities to see content    │
│                                     │
│  [Explore Communities]              │
│  [Start a Journey]                  │
│                                     │
└─────────────────────────────────────┘
```

---

## Performance Optimization

### Feed Loading
- Initial load: 20 posts
- Prefetch images for next 5 posts
- Lazy load images for posts 10+
- Video preview images, play on tap

### Caching
- Cache last 50 posts for offline viewing
- Cache user's community posts
- Invalidate cache on pull-to-refresh
- Cache expiry: 1 hour

### Real-time Updates
- WebSocket for live activities
- Poll for new posts every 60 seconds
- Show "New posts available" banner
- Don't auto-refresh (user control)

### Image Optimization
- CDN delivery
- Responsive sizes: thumbnail (400px), full (1080px)
- WebP format with JPEG fallback
- Lazy load with blur placeholder

### Video Handling
- Auto-play muted in feed
- Tap to unmute
- Pause when out of viewport
- Max 60 seconds per video

---

## Content Moderation

### User Reports
- Report reasons:
  - Inappropriate content
  - Spam
  - Fake journey
  - Harassment
  - Safety concern

- Review process:
  - Auto-hide if 5+ reports
  - Manual review within 24h
  - User notification of outcome

### Automated Filters
- Profanity detection
- NSFW image detection
- Spam pattern detection
- Fake location detection

### Community Guidelines
- Authentic journeys only
- Respectful content
- No spam or ads
- Safety first
- Inclusive community

---

## Analytics & Metrics

### Per-Post Metrics
- Views (impression count)
- Engagement rate (actions / views)
- Like / comment / hit / share counts
- Save rate (quality signal)
- Click-through rate (profile visits)

### Feed Health Metrics
- Average session duration
- Posts viewed per session
- Engagement rate
- Return rate (daily active users)
- Time to first engagement

### Content Performance
- Top performing post types
- Best posting times
- Engagement by community
- Creator leaderboard impact

### A/B Testing
- Algorithm variations
- Card layout changes
- CTA button copy
- Story bar position

---

## Future Enhancements

### Phase 2
- Feed filters (communities, content type)
- Following system (follow specific users)
- Hashtag exploration
- Trending posts
- Popular this week

### Phase 3
- AI-generated journey highlights
- Video editing tools
- Collaborative stories
- Feed customization
- Audio posts (voice notes)

---

## Technical Specifications

### API Endpoints

```
GET /api/feed
  - Query params: page, limit, filter
  - Returns: paginated feed posts
  - Auth: Required

POST /api/posts
  - Body: post data
  - Returns: created post
  - Auth: Required

POST /api/posts/:id/like
POST /api/posts/:id/comment
POST /api/posts/:id/hit
POST /api/posts/:id/share
POST /api/posts/:id/save

GET /api/stories
  - Returns: story circles for user

GET /api/stories/:user_id
  - Returns: stories for specific user

POST /api/stories
  - Body: story content
  - Returns: created story
```

### Database Schema

```sql
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  content JSONB,
  route JSONB,
  stats JSONB,
  engagement JSONB,
  visibility VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_feed_posts_user ON feed_posts(user_id);
CREATE INDEX idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_type ON feed_posts(type);

CREATE TABLE post_engagements (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES feed_posts(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20), -- like, comment, hit, share, save
  data JSONB,
  created_at TIMESTAMP
);

CREATE INDEX idx_engagements_post ON post_engagements(post_id);
CREATE INDEX idx_engagements_user ON post_engagements(user_id);
```

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** Ready for Implementation



