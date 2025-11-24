# Quick Fix Summary

## THE IMMEDIATE PROBLEM

**Dev server is locked! There's already a Next.js instance running:**
```
⨯ Unable to acquire lock at .next/dev/lock
```

## SOLUTION

### Windows:
```bash
# Kill all node processes
taskkill /F /IM node.exe

# OR find the specific process on port 3000
netstat -ano | findstr :3000
# Then kill it:
taskkill /F /PID <process_id>

# Clean Next.js cache
rmdir /s /q .next

# Restart fresh
npm run dev
```

### Then Test:
1. Open http://localhost:3000/judge/dashboard
2. Press F12 → Console
3. You should see: `[Judge Dashboard] 🚀 Component mounted!`
4. Wait 3 seconds
5. You should see: `[Judge Dashboard] ⏱️ POLLING TICK`

## If Still No Logs After Clean Restart:

The component might not be rendering at all. Add this at the very top of the function:

```typescript
export default function JudgeDashboard() {
  console.log('🔴 DASHBOARD COMPONENT RENDERING'); // Add this line

  const router = useRouter();
  // ... rest
```

If you don't see `🔴 DASHBOARD COMPONENT RENDERING`, the issue is:
- Route not matching
- Component not being imported
- Parent component blocking render
- Authentication guard redirecting

## The Core Issue We're Trying to Fix

**File:** `app/judge/dashboard/page.tsx`

**Problem:** Polling interval never runs, so judges must manually refresh to see new requests.

**Root cause:** One of these:
1. Stale dev server (most likely - see lock error above)
2. Component not mounting
3. useEffect not running
4. setInterval being cleared immediately

**Expected:** Every 3 seconds, fetch new requests from `/api/judge/queue`
