# Financial Model - Critical Action Plan

## 🚨 CRITICAL ISSUE IDENTIFIED

**Your current business model is losing money on every request.**

### Current Economics:
- **Revenue per request:** ~$0.85 (1 credit)
- **Cost per request:** $5.00 (10 verdicts × $0.50)
- **Loss per request:** -$4.15 ❌

**At 100 requests/month: You lose $415/month**

## Immediate Actions Required

### Option 1: Increase Prices (RECOMMENDED)

**Target: $2.99/credit minimum**

Update `lib/validations.ts`:
```typescript
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 2995, name: 'Starter' },    // $29.95 (was $4.99)
  popular: { credits: 10, price_cents: 5990, name: 'Popular' },   // $59.90 (was $8.99)
  value: { credits: 25, price_cents: 14975, name: 'Value' },     // $149.75 (was $19.99)
  pro: { credits: 50, price_cents: 29950, name: 'Pro' },         // $299.50 (was $34.99)
};
```

**New Economics:**
- Revenue: $2.99 per request
- Cost: $5.00 (10 verdicts × $0.50)
- **Still losing: -$2.01 per request** ⚠️

### Option 2: Reduce Verdicts + Moderate Price Increase (BEST BALANCE)

**Target: $2.99/credit + 5 verdicts per request**

1. **Update pricing** (same as Option 1)
2. **Update verdict count** in `app/api/requests/route.ts`:
   - Change `target_verdict_count` from 10 to 5

**New Economics:**
- Revenue: $2.99 per request
- Cost: $2.50 (5 × $0.50)
- **Profit: $0.49 per request (16.4% margin)** ✅

### Option 3: Aggressive Price Increase (Break Even)

**Target: $5.99/credit to break even with 10 verdicts**

Update `lib/validations.ts`:
```typescript
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price_cents: 2995, name: 'Starter' },    // $29.95
  popular: { credits: 10, price_cents: 5990, name: 'Popular' },  // $59.90
  value: { credits: 25, price_cents: 14975, name: 'Value' },     // $149.75
  pro: { credits: 50, price_cents: 29950, name: 'Pro' },          // $299.50
};
```

**New Economics:**
- Revenue: $5.99 per request
- Cost: $5.00 (10 verdicts × $0.50)
- **Profit: $0.99 per request (16.5% margin)** ✅

## Recommended Implementation

### Phase 1: Quick Fix (This Week)
1. **Reduce verdicts to 5** (immediate cost reduction)
2. **Increase prices to $2.99/credit** (3.5x increase)
3. **Monitor conversion rates**

### Phase 2: Optimization (Next Month)
1. A/B test $3.99 and $4.99 price points
2. Test verdict counts: 3, 5, 7
3. Gather user feedback on value perception

### Phase 3: Scale (Month 3+)
1. Introduce premium tiers (faster turnaround)
2. Add subscription model
3. Enterprise pricing

## Files to Update

1. **`lib/validations.ts`** - Update CREDIT_PACKAGES prices
2. **`app/api/requests/route.ts`** - Update target_verdict_count (if reducing)
3. **`app/api/judge/respond/route.ts`** - Verify judge payout ($0.50)
4. **Database** - Update any existing credit_packages table records

## Financial Calculator

Access the interactive calculator at: `/admin/financial-model`

This tool lets you:
- Adjust pricing in real-time
- See unit economics instantly
- Calculate monthly/annual projections
- Get recommendations based on current model

## Key Metrics to Monitor

After implementing changes:
- **Conversion rate** (signups → purchases)
- **Request completion rate**
- **Judge retention** (are they happy with $0.50?)
- **Customer acquisition cost (CAC)**
- **Lifetime value (LTV)**
- **Gross margin %**

## Risk Mitigation

1. **Price Sensitivity:** 
   - Start with Option 2 (moderate increase + fewer verdicts)
   - Test messaging: "5 expert verdicts" vs "10 verdicts"
   - Emphasize quality over quantity

2. **Judge Retention:**
   - Keep $0.50 payout (competitive)
   - Consider bonus for quality scores
   - Faster payout cycles

3. **User Perception:**
   - Update marketing copy
   - Emphasize expert feedback
   - Show value: "Get 5 professional opinions for $2.99"

## Expected Outcomes

### Current Model (Broken)
- 100 requests/month
- Revenue: $85
- Costs: $500
- **Loss: -$415/month** ❌

### Recommended Model (Option 2)
- 100 requests/month
- Revenue: $299
- Costs: $250
- **Profit: $49/month (16.4% margin)** ✅

### At Scale (1,000 requests/month)
- Revenue: $2,990
- Costs: $2,500
- **Profit: $490/month**
- **Annual: $5,880 profit**

## Next Steps

1. ✅ Review financial calculator at `/admin/financial-model`
2. ✅ Decide on pricing strategy (Option 1, 2, or 3)
3. ✅ Update pricing in `lib/validations.ts`
4. ✅ Update verdict count if choosing Option 2
5. ✅ Update marketing copy to reflect new value prop
6. ✅ Monitor metrics closely for first month
7. ✅ Adjust based on data

---

**Remember:** It's better to have fewer customers at a viable price point than many customers at a loss-making price point.



