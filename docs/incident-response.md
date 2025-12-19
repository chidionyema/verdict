# Incident Response Runbook
## AskVerdict Production Emergency Procedures

### 🚨 Emergency Contacts
- **On-call Engineer**: [TBD - Primary contact]
- **Technical Lead**: [TBD - Secondary contact]  
- **Product Manager**: [TBD - Business decisions]
- **Legal/Compliance**: [TBD - Data breach/legal issues]

### 📞 Communication Channels
- **Primary**: Slack #incidents
- **Secondary**: Phone/SMS escalation
- **External**: Status page updates

---

## 🔥 Severity Levels

### P0 - CRITICAL (< 15 min response)
- **Complete site outage** 
- **Payment system failure**
- **Data breach/security incident**
- **Mass user data corruption**

### P1 - HIGH (< 1 hour response)
- **Core feature degradation** (verdict creation/submission)
- **Database connectivity issues**
- **Authentication system problems**
- **Significant API rate limit issues**

### P2 - MEDIUM (< 4 hours response)
- **Non-critical feature issues**
- **Performance degradation**
- **Email delivery problems**
- **Moderation system delays**

### P3 - LOW (< 24 hours response)
- **Minor UI bugs**
- **Analytics/reporting issues**
- **Non-essential integrations**

---

## 🎯 Response Procedures

### Initial Response (First 5 minutes)
1. **Acknowledge** the incident in #incidents
2. **Assess severity** using levels above
3. **Create incident channel** (#incident-YYYYMMDD-HHMM)
4. **Notify stakeholders** based on severity
5. **Start investigation** immediately

### Investigation Checklist
- [ ] Check status page alerts
- [ ] Review monitoring dashboards (Sentry, health endpoints)
- [ ] Examine recent deployments
- [ ] Check external service status (Supabase, Stripe, OpenAI)
- [ ] Review error logs and metrics
- [ ] Test core user flows

---

## 🔧 Common Incident Scenarios

### Database Connectivity Issues
**Symptoms**: 500 errors, authentication failures, data loading issues

**Immediate Actions**:
```bash
# Check Supabase status
curl https://[PROJECT].supabase.co/rest/v1/health

# Check connection pool
# Review proxy.ts connection settings

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Resolution Steps**:
1. Check Supabase dashboard for outages
2. Verify connection strings and credentials
3. Review connection pool settings
4. Check RLS policies for access issues
5. Consider read-only mode if writes are failing

---

### Payment System Failure
**Symptoms**: Checkout failures, webhook processing errors, credit issues

**Immediate Actions**:
```bash
# Check Stripe dashboard
# Review webhook delivery status
# Verify webhook signature validation

# Check payment reconciliation
curl -H "Authorization: Bearer $SYSTEM_TOKEN" \
  POST /api/billing/reconcile
```

**Resolution Steps**:
1. Check Stripe dashboard for service issues
2. Verify webhook endpoints are reachable
3. Review payment reconciliation logs
4. Check for failed/pending transactions
5. Consider disabling payments if data integrity at risk

---

### Authentication System Problems
**Symptoms**: Login failures, session issues, token errors

**Immediate Actions**:
```bash
# Check auth flow manually
# Verify Supabase Auth settings
# Review JWT secret configuration
```

**Resolution Steps**:
1. Check Supabase Auth dashboard
2. Verify email/password providers
3. Review RLS policies on profiles table
4. Check JWT secret rotation
5. Test password reset flow

---

### Performance Degradation
**Symptoms**: Slow page loads, API timeouts, high response times

**Immediate Actions**:
```bash
# Check health endpoint
curl /api/health

# Review monitoring metrics
# Check rate limiting logs
# Examine database query performance
```

**Resolution Steps**:
1. Identify bottleneck (frontend, API, database)
2. Check for traffic spikes or DDoS
3. Review database query performance
4. Consider scaling resources
5. Enable aggressive rate limiting if needed

---

### Content Moderation Issues
**Symptoms**: Inappropriate content visible, moderation API failures

**Immediate Actions**:
```bash
# Check OpenAI API status
# Review moderation confidence scores
# Verify fallback systems active
```

**Resolution Steps**:
1. Check OpenAI service status
2. Review moderation logs for patterns
3. Verify rule-based fallback working
4. Consider manual review queue
5. Temporarily strict moderation if needed

---

## 📋 Incident Management

### Communication Templates

#### P0 Incident Alert
```
🚨 P0 INCIDENT DECLARED 🚨

Issue: [Brief description]
Impact: [User/business impact]
Started: [Timestamp]
Incident Lead: @[username]

Next update in 15 minutes.
```

#### Status Update
```
📢 INCIDENT UPDATE

Status: [Investigating/Identified/Monitoring/Resolved]
Summary: [What we know]
Actions: [What we're doing]
ETA: [If available]

Next update: [Timeframe]
```

#### Resolution Notice
```
✅ INCIDENT RESOLVED

Duration: [Start - End time]
Root cause: [Brief explanation]
Resolution: [What fixed it]

Post-mortem: [Link when available]
```

---

## 🛠️ Recovery Procedures

### Database Recovery
```bash
# If data corruption detected
# 1. Stop write operations
# 2. Enable read-only mode
# 3. Restore from backup
# 4. Verify data integrity
# 5. Resume normal operations
```

### Application Recovery
```bash
# Quick deployment rollback
# Review last known good deployment
# Deploy previous version
# Verify functionality restored
# Monitor for stability
```

### Cache Invalidation
```bash
# Clear Redis/Upstash cache
# Reset rate limiting counters
# Invalidate CDN cache if needed
```

---

## 📊 Monitoring & Alerting

### Key Metrics to Watch
- **Error Rate**: > 5% for 5+ minutes
- **Response Time**: > 2s p95 for 10+ minutes  
- **Database Connections**: > 80% pool usage
- **Payment Success Rate**: < 95% for 5+ minutes
- **Uptime**: Health check failures

### Dashboard URLs
- **Sentry**: [Production error tracking]
- **Vercel**: [Deployment and performance]
- **Supabase**: [Database and auth metrics]
- **Stripe**: [Payment monitoring]

---

## 📝 Post-Incident Process

### Within 24 Hours
1. **Preliminary timeline** posted in incident channel
2. **Customer communication** if external impact
3. **Immediate improvements** identified and implemented

### Within 1 Week
1. **Full post-mortem** document created
2. **Root cause analysis** completed
3. **Action items** assigned with owners
4. **Prevention measures** implemented

### Post-Mortem Template
```markdown
# Post-Mortem: [Incident Date]

## Summary
[Brief description of incident]

## Timeline
[Detailed chronological events]

## Root Cause
[Technical and process causes]

## Impact
- Users affected: [number/percentage]
- Duration: [total time]
- Revenue impact: [if applicable]

## What Went Well
- [Positive aspects of response]

## What Went Wrong  
- [Areas for improvement]

## Action Items
- [ ] [Specific improvement with owner and due date]
- [ ] [Process change with owner and due date]
- [ ] [Technical fix with owner and due date]

## Prevention
[How we'll prevent similar issues]
```

---

## 🔒 Security Incident Procedures

### Data Breach Response
1. **Immediate isolation** of affected systems
2. **Preserve evidence** for investigation
3. **Notify legal team** immediately
4. **Document everything** with timestamps
5. **Prepare customer notification** (within 72 hours for GDPR)

### Compromise Indicators
- Unusual admin activity
- Unexpected data exports
- Failed authentication spikes
- Suspicious payment patterns
- Moderation system bypasses

### Security Contacts
- **Security Team**: [TBD]
- **Legal Counsel**: [TBD]  
- **Compliance Officer**: [TBD]

---

## 📱 On-Call Procedures

### Escalation Path
1. **Primary On-Call** (15 min response SLA)
2. **Secondary On-Call** (if no response in 20 min)
3. **Engineering Lead** (if no response in 35 min)
4. **CTO/Founder** (if no response in 50 min)

### On-Call Responsibilities
- Monitor alerts 24/7 during assigned week
- Respond within SLA for severity level
- Escalate appropriately if unable to resolve
- Document all incident response actions
- Hand off cleanly to next on-call

---

## ⚡ Quick Reference Commands

### Health Checks
```bash
# Application health
curl https://askverdict.com/api/health

# Database connectivity
curl https://askverdict.com/api/monitoring/health

# External services
curl https://status.stripe.com/api/v2/summary.json
```

### Emergency Actions
```bash
# Enable maintenance mode
# [Deploy maintenance page]

# Scale down traffic
# [Adjust rate limits via Redis]

# Disable features
# [Toggle feature flags]
```

### Log Access
```bash
# Application logs
# [Vercel Functions logs]

# Error tracking  
# [Sentry dashboard]

# Database logs
# [Supabase logs]
```

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Review Frequency: Quarterly*