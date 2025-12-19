# 🚀 Expert Feature Quick Start Guide
## Immediate Action Items for £12 Professional Feedback Integration

**Goal:** Get Pro tier properly integrated into core workflows ASAP

---

## ⚡ QUICK WINS (This Week)

### 1. Make Pro Tier Visible in Create Flow
**File:** `app/create/page.tsx`

**Current:** Pro tier exists but buried, no visual differentiation

**Fix:**
```tsx
// In TIERS array, enhance Pro tier:
{
  id: 'premium' as Tier,
  title: 'Professional',
  subtitle: '8 verdicts from verified experts',
  price: '£12',
  verdictCount: 8,
  credits: 12, // Update to match pricing
  icon: Crown,
  features: [
    'Verified LinkedIn professionals only',
    'Industry-matched experts',
    'AI synthesis included',
    '1-hour turnaround',
    'Follow-up question included'
  ],
  turnaround: '1 hour',
  gradient: 'from-purple-500 via-pink-500 to-amber-500',
  badge: 'PROFESSIONAL',
  popular: false, // Make it stand out differently
  highlight: true, // NEW: Special highlighting
}
```

**Visual Changes:**
- Larger card size
- Animated border glow
- "PROFESSIONAL" badge
- Expert preview on hover

### 2. Add Expert Preview Component
**New File:** `components/expert/ExpertPreview.tsx`

**Purpose:** Show users WHO will review before purchase

**Implementation:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, CheckCircle, Star } from 'lucide-react';

interface ExpertPreviewProps {
  category: string;
  tier: 'pro';
  onClose: () => void;
}

export function ExpertPreview({ category, tier, onClose }: ExpertPreviewProps) {
  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpertPreview() {
      const supabase = createClient();
      // Fetch expert pool preview
      const { data } = await supabase
        .from('user_credits')
        .select(`
          user_id,
          reputation_score,
          profiles!inner(display_name, avatar_url),
          expert_verifications!inner(job_title, company, industry, verification_status)
        `)
        .eq('expert_verifications.verification_status', 'verified')
        .gte('reputation_score', 8.0)
        .limit(5);

      if (data) {
        setExperts(data);
      }
      setLoading(false);
    }

    if (tier === 'pro') {
      fetchExpertPreview();
    }
  }, [category, tier]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">👑 Professional Review Preview</h2>
        <p className="text-gray-600 mb-6">
          Your request will be reviewed by verified professionals matched to your category.
        </p>

        {loading ? (
          <div>Loading experts...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {experts.map((expert) => (
              <div key={expert.user_id} className="border rounded-lg p-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                  {expert.profiles?.display_name?.[0] || 'E'}
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold">Verified</span>
                </div>
                <p className="text-sm font-medium">{expert.profiles?.display_name}</p>
                <p className="text-xs text-gray-600">{expert.expert_verifications?.job_title}</p>
                <p className="text-xs text-gray-500">{expert.expert_verifications?.company}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs">{expert.reputation_score?.toFixed(1)}/10</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Why Professional?</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>✓ Industry-matched experts only</li>
            <li>✓ Average 8.5/10 rating</li>
            <li>✓ Faster turnaround (1 hour vs 2-4 hours)</li>
            <li>✓ AI synthesis included</li>
            <li>✓ Follow-up question included</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={() => {
              // Trigger Pro tier selection
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg"
          >
            Select Professional Tier
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Enhance Results Page with Expert Badges
**File:** `app/requests/[id]/page.tsx`

**Add Expert Badge Display:**
```tsx
// In verdict rendering section, add:
{verdict.reviewer_info?.is_expert && (
  <div className="flex items-center gap-2 mb-2">
    <Shield className="h-4 w-4 text-purple-600" />
    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
      Verified Professional
    </span>
    {verdict.reviewer_info?.expert_title && (
      <span className="text-xs text-gray-600">
        {verdict.reviewer_info.expert_title}
      </span>
    )}
  </div>
)}
```

### 4. Add Comparison Table to Create Page
**File:** `app/create/page.tsx`

**Add after tier selection:**
```tsx
{currentStep === 0 && (
  <div className="mt-8">
    <h4 className="text-lg font-semibold mb-4">Compare Tiers</h4>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Feature</th>
            <th className="text-center p-2">Community</th>
            <th className="text-center p-2">Standard</th>
            <th className="text-center p-2 bg-purple-50">Professional</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">Reviewers</td>
            <td className="text-center p-2">Community</td>
            <td className="text-center p-2">Verified</td>
            <td className="text-center p-2 bg-purple-50 font-semibold">Experts Only</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Count</td>
            <td className="text-center p-2">3</td>
            <td className="text-center p-2">5</td>
            <td className="text-center p-2 bg-purple-50 font-semibold">8</td>
          </tr>
          <tr className="border-b">
            <td className="p-2">Turnaround</td>
            <td className="text-center p-2">2-4 hours</td>
            <td className="text-center p-2">2 hours</td>
            <td className="text-center p-2 bg-purple-50 font-semibold">1 hour</td>
          </tr>
          <tr>
            <td className="p-2">Price</td>
            <td className="text-center p-2">1 credit</td>
            <td className="text-center p-2">2 credits</td>
            <td className="text-center p-2 bg-purple-50 font-semibold">£12</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)}
```

### 5. Add Upsell Banner After Standard Purchase
**New File:** `components/upsell/ProUpgradeBanner.tsx`

```tsx
'use client';

import { Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ProUpgradeBanner({ requestId }: { requestId: string }) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="bg-purple-600 text-white rounded-full p-2">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Upgrade to Professional for Expert-Only Reviews
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get feedback from verified LinkedIn professionals matched to your category. 
            Only £10 more.
          </p>
          <Link
            href={`/create?upgrade=${requestId}&tier=pro`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg text-sm font-medium"
          >
            Upgrade to Pro
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Add to:** `app/requests/[id]/page.tsx` (if request tier is 'standard')

---

## 🎯 MEDIUM PRIORITY (Next Week)

### 6. Expert Matching Animation
**New File:** `components/expert/ExpertMatchingAnimation.tsx`

Show real-time expert assignment after Pro purchase.

### 7. Enhanced Waiting Page
**File:** `app/waiting/page.tsx` (or create new)

Show expert avatars, matching status, turnaround timer.

### 8. Premium Results Treatment
**File:** `app/requests/[id]/page.tsx`

- Expert badges prominently displayed
- Expert profile cards (expandable)
- Visual differentiation (gold borders, elevated cards)
- "Professional Review" header

---

## 📊 METRICS TO TRACK

Add to analytics:
- Pro tier selection rate
- Expert preview modal views
- Pro tier conversion rate
- Upsell banner clicks
- Expert badge visibility

---

## ✅ CHECKLIST

- [ ] Pro tier visually distinct in create flow
- [ ] Expert preview modal functional
- [ ] Comparison table added
- [ ] Expert badges on results page
- [ ] Upsell banners implemented
- [ ] Analytics tracking added
- [ ] User testing completed

---

**Start with Quick Wins #1-5 this week for immediate impact!**

