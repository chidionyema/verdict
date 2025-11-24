# Judge vs Seeker Journey Separation - Solution

## Problem Analysis

### Current Issues:
1. **Terminology Confusion:**
   - Judges see "Your Submission" but they didn't submit anything
   - Judges see "Back to My Requests" but they don't have requests
   - Same page used for both roles without context switching

2. **Navigation Confusion:**
   - From "My Verdicts" → View Request → "Back to My Requests" (wrong for judges)
   - Judges viewing requests see seeker-focused language

3. **"My Verdicts" Page Issues:**
   - Feels like an afterthought
   - Limited functionality
   - Doesn't show judge-specific context

## Solution: Role-Based Context Switching

### 1. Detect User Role in Request Detail Page
- Check if user is the request owner (seeker) or a judge viewing it
- Show different UI, terminology, and navigation based on role

### 2. Terminology Changes

**For Seekers (Request Owners):**
- "Your Submission" ✓
- "Back to My Requests" ✓
- "Your Verdicts" ✓

**For Judges (Viewing Requests):**
- "Request to Review" or "Seeker's Submission"
- "Back to My Verdicts" or "Back to Judge Dashboard"
- "Your Verdict" (the one they gave)
- "Other Verdicts" (from other judges)

### 3. Enhanced "My Verdicts" Page
- Make it more prominent in navigation
- Add better stats and insights
- Show request context for each verdict
- Add quick actions (view request, edit verdict if allowed)

### 4. Navigation Flow

**Seeker Flow:**
- Dashboard → My Requests → Request Detail → Back to My Requests

**Judge Flow:**
- Judge Dashboard → My Verdicts → Request Detail (as judge) → Back to My Verdicts
- Judge Dashboard → Queue → Request Detail (to judge) → Back to Queue

## Implementation Plan

1. Create role detection utility
2. Update request detail page with role-based rendering
3. Enhance "My Verdicts" page
4. Update navigation terminology
5. Add judge-specific request view component

