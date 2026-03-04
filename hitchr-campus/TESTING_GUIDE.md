# Hitchr Testing Guide

## Quick Backend Tests (via curl)

### 1. Health Check
```bash
curl http://localhost:8001/api/
# Expected: {"message":"Hitchr API - Travel Together 🚗"}
```

### 2. Seed Database
```bash
curl -X POST http://localhost:8001/api/seed
# Expected: {"message":"Seed data created successfully","rides":3,"communities":4}
```

### 3. Get All Rides
```bash
curl http://localhost:8001/api/rides | jq
```

### 4. Get Live Rides Only
```bash
curl "http://localhost:8001/api/rides?status=live" | jq
```

### 5. Create User
```bash
curl -X POST http://localhost:8001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul Sharma", "phone": "9876543210"}'
```

### 6. Get Communities
```bash
curl http://localhost:8001/api/communities | jq
```

## Frontend Manual Testing Flow

### Test 1: Onboarding
1. Open the app at the preview URL
2. You should see the onboarding screen with "Hitchr" logo
3. Enter your name (e.g., "Rahul")
4. Click "Join Hitchr"
5. **Expected**: Navigate to Feed screen with sample rides

### Test 2: Feed & Discovery
1. Verify 3 sample rides are displayed
2. Check each ride card shows:
   - Pilot name and avatar
   - Vehicle type (car/auto)
   - Status badge (LIVE/PLANNED)
   - Route (From → To)
   - Distance and duration
   - Available seats
3. Test filter buttons:
   - Click "Live Now" → Should show only live rides
   - Click "Planned" → Should show only planned rides
   - Click "All Rides" → Should show all rides
4. Test pull-to-refresh (drag down on feed)

### Test 3: Ride Details & Join
1. Tap any ride card from the feed
2. **Expected**: Navigate to ride detail screen
3. Verify displayed information:
   - Back button in header
   - Status badge
   - Pilot info with avatar
   - Full route with addresses
   - Distance and duration stats
   - Current riders list
   - Description
4. Tap "Join Ride" button
5. **Expected**: Modal opens
6. Enter pickup location (e.g., "Connaught Place")
7. Enter dropoff location (e.g., "Noida")
8. Verify info message: "No payment required now..."
9. Tap "Confirm & Join"
10. **Expected**: Navigate to "Riding" screen

### Test 4: While Riding
1. Verify riding screen displays:
   - Green status banner "Ride in Progress"
   - Pilot info with call button
   - Journey section showing pickup → dropoff
   - Distance and duration stats
   - Co-travelers (if any)
   - Safety info card
2. Tap "Complete Ride" button
3. **Expected**: Navigate to Complete Ride screen

### Test 5: Complete Ride - Core Flow ⭐
This is the most critical test for Hitchr!

**Part A: Route Explanation (A→B→C)**
1. Verify "Ride Complete!" success header
2. Check "Your Journey" section displays:
   - Point A (orange) - Start point
   - Point B (yellow) - Pilot's turn / Dropoff
   - Point C (gray/muted) - Your original goal
3. Verify arrows:
   - Green solid arrow from A → B (completed)
   - Gray dashed arrow from B → C (remaining)
4. Check distance info:
   - ✅ "Shared distance (A→B): X.X km" (green)
   - ⊖ "Remaining (B→C): X.X km" (muted)

**Part B: Flexible Contribution**
1. Verify suggested contribution displays:
   - Large rupee amount (e.g., ₹75)
   - Calculation text "Based on 15.0 km @ ₹5/km"
2. Test amount options:
   - Tap "Suggested" → Amount updates to suggested value
   - Tap "Lower" → Amount reduces by ~30%
   - Tap "Higher" → Amount increases by ~20%
3. Test custom amount:
   - Tap "Custom Amount" → Input field appears
   - Enter custom value (e.g., 100)
   - Tap "Apply" → Amount updates to 100
4. Test waive option:
   - Tap "Waive (₹0)" → Amount becomes ₹0
5. Verify community message: "Pay what feels right. Community first ❤️"

**Part C: Payment Flow (Non-Zero Amount)**
1. Select any non-zero amount
2. Tap "Pay ₹XX" button at bottom
3. **Expected**: Payment method modal opens
4. Verify display shows "Amount: ₹XX"
5. Test payment method selection:
   - Tap "UPI" → Shows checkmark, border highlights
   - Tap "Card" → Shows checkmark, border highlights
6. Tap "Confirm Payment"
7. **Expected**: 
   - Loading indicator appears
   - ~90% chance: Success modal
   - ~10% chance: Failure alert (can retry)

**Part D: Receipt (Success Case)**
1. Verify receipt modal displays:
   - Large green checkmark icon
   - "Payment Successful!" title
   - "Paid to Pilot" label
   - Large amount (₹XX)
   - Transaction details:
     - Transaction ID
     - Pilot name
     - Distance
     - Payment method
2. Tap "Done" button
3. **Expected**: Return to Feed screen

**Part E: Waive Flow (₹0)**
1. From complete ride screen, tap "Waive (₹0)"
2. Verify amount shows ₹0
3. Tap "Complete (No Payment)" button
4. **Expected**: Receipt modal opens immediately (no payment modal)
5. Verify displays:
   - "Ride Complete!" title
   - "Thanks for being part of the Hitchr community! 🙏"
6. Tap "Done"
7. **Expected**: Return to Feed

### Test 6: Communities
1. Navigate to Communities tab
2. Verify 4 sample communities display:
   - Delhi NCR Commuters (1250 members)
   - Weekend Travelers (850 members)
   - College Students (2100 members)
   - Tech Park Riders (950 members)
3. Each card should show icon, name, description, member count

### Test 7: Profile
1. Navigate to Profile tab
2. Verify displays:
   - User name you entered
   - Trust Score: 100
   - Badges (New Member, Community)
   - Stats (0 rides taken, 0 rides given)
   - Menu items (History, Settings, Help, About)
3. Tap "Logout"
4. **Expected**: Return to onboarding screen

### Test 8: Navigation Flow
1. Test back navigation:
   - From ride detail → back to feed
   - Modal close buttons work
2. Test tab switching:
   - Switch between Feed, Map, Communities, Profile
   - Verify tab highlights correctly
3. Test deep navigation:
   - Feed → Ride Detail → Join → Riding → Complete → Receipt → Feed

## Acceptance Criteria Checklist

### Functional Requirements
- [ ] "Join Ride" never asks for payment upfront
- [ ] "Complete Ride" always shows the contribution modal
- [ ] Suggested amount is calculated based on shared distance (A→B)
- [ ] A→B→C visualization is clear and accurate
- [ ] Rider can select ₹0 and complete without payment
- [ ] Payment simulation works (both success and failure)
- [ ] Receipt shows correct post-ride wording
- [ ] No "seat confirmation" messaging anywhere

### UX Requirements
- [ ] User can understand the flow in < 60 seconds
- [ ] Copy feels community-first (no guilt, no corporate tone)
- [ ] All modals can be closed
- [ ] No dead ends in navigation
- [ ] Loading states show for all async operations
- [ ] Error messages are user-friendly
- [ ] App feels "Indian and modern"

### Design Requirements
- [ ] Colors match Indian street-smart aesthetic
- [ ] Orange primary, blue secondary, yellow accent
- [ ] Dark theme with good contrast
- [ ] Icons are clear and meaningful
- [ ] Spacing is consistent (8pt grid)
- [ ] Touch targets are adequate (44px minimum)

## Common Issues & Fixes

### Issue: Expo not loading
**Fix**: 
```bash
sudo supervisorctl restart expo
sleep 5
curl http://localhost:3000
```

### Issue: Backend not responding
**Fix**:
```bash
sudo supervisorctl restart backend
sleep 3
curl http://localhost:8001/api/
```

### Issue: No rides in feed
**Fix**:
```bash
curl -X POST http://localhost:8001/api/seed
# Refresh the app
```

### Issue: User not authenticated
**Fix**: Clear app data and restart from onboarding

## Test Data

### Sample Rides (After Seeding)
1. **Rahul** - Car - CP to Noida (25.5 km, Live)
2. **Priya** - Car - GTB Nagar to Cyber City (32 km, Planned)
3. **Amit** - Auto - Kashmere Gate to Ghaziabad (18.5 km, Live)

### Sample Communities
1. Delhi NCR Commuters (1250 members)
2. Weekend Travelers (850 members)
3. College Students (2100 members)
4. Tech Park Riders (950 members)

## Performance Benchmarks

- Feed load: < 2 seconds
- Navigation transitions: < 300ms
- Payment simulation: < 2 seconds
- Backend API response: < 500ms

## Browser Testing

Test on:
- Chrome (desktop & mobile view)
- Safari (desktop & mobile view)
- Firefox (desktop)

## Mobile Testing (via Expo Go)

1. Install Expo Go app on iOS/Android
2. Scan QR code from Expo dev server
3. Test all flows on physical device
4. Verify touch interactions feel natural
5. Check that keyboard doesn't overlap inputs

## Success Criteria

A tester should be able to say:
- "I understand this helps me share rides with people going my way"
- "I like that I pay after, not before"
- "The A→B→C explanation makes sense"
- "I can adjust or waive the payment - that's cool"
- "It feels Indian, not like a corporate taxi app"

---

**Happy Testing! Travel Together. साथ चलें। 🚗**
