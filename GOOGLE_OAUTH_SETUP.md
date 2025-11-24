# Google OAuth Setup Guide

This guide will help you configure Google OAuth authentication for your Verdict app. I've implemented an improved OAuth system based on your working Reyaq project.

## 📋 Prerequisites

1. A Google Cloud Platform account
2. A Supabase project
3. Your app running locally or deployed

## 🔧 Step 1: Google Cloud Console Setup

### 1.1 Create a new project (or select existing)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Create OAuth 2.0 credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it "Verdict App" (or your preferred name)

### 1.3 Configure authorized origins and redirect URIs

**For Local Development:**
- **Authorized JavaScript origins:**
  - `http://localhost:3000`
  - `https://[your-supabase-project-id].supabase.co`

- **Authorized redirect URIs:**
  - `https://[your-supabase-project-id].supabase.co/auth/v1/callback`

**For Production:**
- **Authorized JavaScript origins:**
  - `https://your-domain.com`
  - `https://[your-supabase-project-id].supabase.co`

- **Authorized redirect URIs:**
  - `https://[your-supabase-project-id].supabase.co/auth/v1/callback`

### 1.4 Save your credentials
- Copy the **Client ID** and **Client Secret**

## 🔧 Step 2: Supabase Configuration

### 2.1 Configure Google OAuth in Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Settings** → **Auth Providers**
4. Find **Google** and toggle it ON
5. Enter your **Client ID** and **Client Secret** from Step 1.4
6. Click **Save**

### 2.2 Update Site URL (Important!)
1. Still in **Authentication** → **Settings** → **General**
2. Set **Site URL** to:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`

## 🔧 Step 3: Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Site URL for OAuth redirects (REQUIRED)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (your existing values)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Demo mode
NEXT_PUBLIC_DEMO_MODE=false
```

### How to find your Supabase credentials:
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 🔧 Step 4: OAuth Consent Screen (If needed)

If you get a "This app isn't verified" warning:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill in the required fields:
   - App name: "Verdict"
   - User support email: your email
   - Developer contact information: your email
3. Add yourself as a test user in the **Test users** section
4. Save and continue

## 🧪 Step 5: Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the OAuth flow:**
   - Go to `http://localhost:3000/auth/login`
   - Click "Sign in with Google"
   - You should be redirected to Google's OAuth page
   - After authentication, you should be redirected back to your app

## 🚨 Common Issues and Solutions

### Issue: "Error 400: redirect_uri_mismatch"
**Solution:** Make sure your redirect URI in Google Cloud Console exactly matches Supabase's callback URL:
- `https://[your-project-id].supabase.co/auth/v1/callback`

### Issue: "Invalid client: no registered origin"
**Solution:** Add your domain to **Authorized JavaScript origins** in Google Cloud Console

### Issue: "OAuth exchange error" in logs
**Solution:** 
1. Check your environment variables are correct
2. Make sure Google OAuth is enabled in Supabase
3. Verify your Client ID and Secret in Supabase

### Issue: User gets stuck in auth flow
**Solution:** Check your `NEXT_PUBLIC_SITE_URL` is set correctly

## 🔍 Debugging Tips

1. **Check browser console** for JavaScript errors
2. **Check server logs** for OAuth exchange errors
3. **Verify environment variables** are loaded correctly
4. **Test with incognito mode** to avoid cached issues

## 🚀 Production Deployment

Before deploying:

1. **Update Google Cloud Console:**
   - Add your production domain to authorized origins
   - Add your production Supabase callback URL

2. **Update Supabase:**
   - Set Site URL to your production domain

3. **Update environment variables:**
   - Set `NEXT_PUBLIC_SITE_URL` to your production URL

## ✅ What's Implemented

The OAuth implementation includes:

- ✅ **Robust error handling** - Shows helpful error messages
- ✅ **Session storage** - Preserves redirect after OAuth
- ✅ **Loading states** - Clear UI feedback during auth
- ✅ **New user onboarding** - Redirects to welcome page for first-time users
- ✅ **Fallback redirects** - Sensible defaults if redirects fail
- ✅ **Mobile-friendly** - Responsive OAuth button design

The new `GoogleOAuthButton` component is reusable and handles all OAuth logic automatically.