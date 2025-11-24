# 🚀 Production Launch Checklist

## **CRITICAL (Must Complete Before Launch)**

### Database Setup ✅
- [ ] Run `scripts/complete-database-setup.sql` in Supabase SQL Editor
- [ ] Verify all tables exist: `profiles`, `verdict_requests`, `verdicts`, `judge_demographics`, `payments`, etc.
- [ ] Enable RLS policies on all tables
- [ ] Create storage bucket named `requests` for image uploads

### Environment Variables ⚠️
**Required for app to function:**
```bash
# Supabase (CRITICAL)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Storage Configuration 📁
**Create Supabase Storage Bucket:**
1. Go to Storage in Supabase dashboard
2. Create bucket named `requests`
3. Set to Public
4. Add policy: `Users can upload to their own folder`

### TypeScript Safety 🔧
- [ ] Remove remaining `@ts-nocheck` from:
  - `app/judge/page.tsx`
  - `app/api/requests/[id]/route.ts`
  - `app/api/billing/create-checkout-session/route.ts`
  - `app/api/profile/route.ts`
  - `app/api/judge/*.ts` files

### Payment System 💳
- [ ] Configure Stripe webhook endpoint: `/api/billing/webhook`
- [ ] Test payment flow end-to-end
- [ ] Verify credit deduction/addition works

## **HIGH PRIORITY**

### Security Hardening 🔒
- [ ] Verify all API routes have authentication
- [ ] Check RLS policies prevent data leaks
- [ ] Remove console.log statements from production code
- [ ] Add rate limiting to API endpoints

### Error Handling 🚨
- [ ] Add proper error boundaries to React components
- [ ] Implement graceful failures for external services
- [ ] Add monitoring/alerting for critical errors

## **MEDIUM PRIORITY**

### Scalability
- [ ] Implement queue system for judge assignment
- [ ] Add Redis for session management
- [ ] Set up auto-scaling rules
- [ ] Configure database backups

### User Experience
- [ ] Add offline support
- [ ] Implement push notifications
- [ ] Add real-time updates
- [ ] Create mobile PWA

## 📊 Performance Targets

### Page Load Times
- Landing page: < 2s
- Dashboard: < 3s
- API responses: < 500ms

### Database Queries
- User requests: < 200ms
- Verdicts fetch: < 300ms
- Judge queue: < 150ms

### Uptime
- Target: 99.9%
- Max downtime: 8.7 hours/year
- Recovery time: < 5 minutes

## 🛠️ Monitoring Commands

```bash
# Check database performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;

# Monitor API response times
grep "X-Response-Time" /var/log/nginx/access.log | tail -100

# Check memory usage
free -h && ps aux --sort=-%mem | head -10
```

## 🚨 Emergency Contacts

- **Database Issues**: Supabase Support
- **CDN Issues**: Vercel Support  
- **Payment Issues**: Stripe Support
- **DNS Issues**: Domain Provider

---
✅ **Complete this checklist before going live**