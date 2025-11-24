# Debug Guide: Judge Dashboard Real-Time Updates

## Problem
Judges have to manually refresh the page to see new requests appear.

## What I Changed

### 1. Removed Supabase Realtime (Over-engineered)
**Why:** You asked a great question - "why are we using Supabase for realtime?"
- Supabase Realtime adds complexity and requires specific setup
- It may not be enabled on your Supabase project
- Simple polling is more reliable and easier to debug
- Most judge dashboards don't need sub-second updates

**Result:** Removed all Supabase Realtime code and switched to simple polling.

### 2. Added Comprehensive Logging
The dashboard now logs everything to the browser console:
- `[Judge Dashboard] Fetching requests...` - When API call starts
- `[Judge Dashboard] Received data:` - Raw API response
- `[Judge Dashboard] Number of requests: X` - Count of requests
- `[Judge Dashboard] 🔄 Polling tick...` - Every 3 seconds
- `[Judge Dashboard] ✅ Store updated` - When Zustand store is updated

The API also logs:
- `[Judge Queue API] Querying for requests...`
- `[Judge Queue API] ✅ Found X requests`
- `[Judge Queue API] Excluded request IDs: X`

### 3. Fixed Status Filter
The API now checks for ALL active request statuses:
```typescript
.in('status', ['open', 'in_progress', 'pending'])
```

Your database might be using 'open' instead of 'in_progress'.

### 4. Polling Every 3 Seconds
Changed from 5 seconds to 3 seconds for better UX.

## How to Debug

### Step 1: Open Browser Console
1. Go to the Judge Dashboard
2. Open DevTools (F12)
3. Go to Console tab
4. Look for log messages starting with `[Judge Dashboard]`

### Step 2: Check What You See
Look for these patterns:

**If polling is working:**
```
[Judge Dashboard] 🔄 Polling tick...
[Judge Dashboard] Fetching requests...
[Judge Dashboard] Received data: {requests: [...]}
[Judge Dashboard] Number of requests: 0  <-- This is the key number
```

**If requests exist but don't show:**
- Check if `Number of requests:` is > 0
- If yes, but dashboard shows empty, it's a display/store issue
- If no, check the API logs (server console)

**If polling isn't running:**
- You won't see `🔄 Polling tick...` every 3 seconds
- This means the useEffect isn't running properly

### Step 3: Check Server Logs
In your terminal where `npm run dev` is running, look for:
```
[Judge Queue API] Querying for requests...
[Judge Queue API] ✅ Found 2 requests
```

### Step 4: Check Database Status Values
Run this SQL query in Supabase:
```sql
SELECT id, status, created_at, category
FROM verdict_requests
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

Check what status values you actually have. Common values:
- `open` - New request waiting for judges
- `in_progress` - Being worked on
- `closed` - Completed
- `pending` - Legacy status

If your requests have a different status, let me know.

## Common Issues

### Issue 1: No Requests in Database
**Symptom:** API returns 0 requests
**Solution:** Create a test request as a seeker first

### Issue 2: Wrong Status Value
**Symptom:** Requests exist but API returns 0
**Solution:** Check what status your requests actually have (see Step 4)

### Issue 3: Judge Already Responded
**Symptom:** Request disappears after judging once
**Solution:** This is correct behavior - judges can't judge the same request twice

### Issue 4: UseEffect Not Running
**Symptom:** No polling logs in console
**Solution:** Check if component is actually mounting (look for initial fetch log)

## Next Steps

1. Open the Judge Dashboard
2. Open browser console (F12)
3. Tell me what you see in the logs
4. If no requests show, run the SQL query and tell me what statuses you see

This will help me identify the exact issue!
