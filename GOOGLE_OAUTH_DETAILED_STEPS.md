# Detailed Google OAuth Setup Steps

## 🎯 **Step 1: Create Google OAuth Credentials**

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Sign in with your Google account

### 1.2 Create or Select Project
- Click the project dropdown at the top
- Either select an existing project or create new one
- Name it something like "Verdict App"

### 1.3 Enable Google+ API (if needed)
- Go to **APIs & Services** → **Library**
- Search for "Google+ API" 
- Click on it and hit **Enable** (if not already enabled)

### 1.4 Create OAuth Consent Screen (First Time Only)
- Go to **APIs & Services** → **OAuth consent screen**
- Choose **External** (for most cases)
- Fill in required fields:
  - **App name**: "Verdict"
  - **User support email**: your email
  - **Developer contact**: your email
- Click **Save and Continue** through the steps
- Add yourself as a **Test User** if you want to test before going live

### 1.5 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Choose **Web application**
4. Name it: "Verdict App"

### 1.6 Configure Authorized URLs
**Important**: You need to add these exact URLs:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-supabase-project-id.supabase.co
```

**Authorized redirect URIs:**
```
https://your-supabase-project-id.supabase.co/auth/v1/callback
```

Replace `your-supabase-project-id` with your actual Supabase project ID (found in your Supabase URL).

### 1.7 Get Your Credentials
After creating, you'll see:
```
Client ID: 123456789-abcdef.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

**SAVE BOTH** - you'll need them in the next step.

---

## 🎯 **Step 2: Configure Supabase**

### 2.1 Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your Verdict project

### 2.2 Configure Google OAuth
1. **Navigate to**: Authentication → Settings → Auth Providers
2. **Find Google** in the providers list
3. **Toggle it ON** (enable it)
4. **Enter your Google credentials**:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console ← **THIS IS THE SECRET**
5. **Click Save**

### 2.3 Set Site URL
1. **Stay in Authentication** → Settings → **General**
2. **Find "Site URL"**
3. **Set it to**: `http://localhost:3000` (for development)
4. **Click Save**

---

## 🎯 **Step 3: Update Your Environment Variables**

Now update your `.env.local` file:

```bash
# Get these from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key

# This should match your current environment
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Your existing Stripe keys (keep as is)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# Demo mode
NEXT_PUBLIC_DEMO_MODE=false
```

### How to get Supabase keys:
1. **Supabase Dashboard** → **Settings** → **API**
2. Copy the values:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧪 **Step 4: Test the Setup**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test the flow**:
   - Go to: http://localhost:3000/auth/login
   - Click "Sign in with Google"
   - Should redirect to Google
   - After signing in, should redirect back to your app

---

## 🚨 **Common Issues & Solutions**

### Issue: "Error 400: redirect_uri_mismatch"
**Cause**: Your redirect URI doesn't match what's configured in Google Cloud Console
**Solution**: Make sure you added this EXACT URL to Google Cloud Console:
```
https://your-supabase-project-id.supabase.co/auth/v1/callback
```

### Issue: "OAuth exchange error"
**Cause**: Either wrong Client ID/Secret or they're not saved in Supabase
**Solution**: 
1. Double-check your Client ID and Secret in Supabase
2. Make sure they match exactly what's shown in Google Cloud Console

### Issue: "Invalid client: no registered origin"
**Cause**: Your localhost URL isn't registered
**Solution**: Add `http://localhost:3000` to **Authorized JavaScript origins**

### Issue: Blank page or infinite loading
**Cause**: Wrong environment variables
**Solution**: 
1. Check your `.env.local` file has correct Supabase values
2. Restart your development server after changing env vars

---

## 📝 **Quick Checklist**

Before testing, make sure:

- ✅ Google Cloud Console has OAuth client with correct URLs
- ✅ Google OAuth is ENABLED in Supabase
- ✅ Client ID and Secret are saved in Supabase
- ✅ Site URL is set in Supabase (http://localhost:3000)
- ✅ Environment variables are correct in `.env.local`
- ✅ Development server restarted after env changes

---

## 📞 **Need Help?**

If you run into issues:

1. **Check browser console** for error messages
2. **Check your terminal** for server errors
3. **Verify all URLs match exactly** between Google Cloud Console and Supabase
4. **Test in incognito mode** to avoid cached auth states

The most common issue is mismatched URLs between Google Cloud Console and Supabase settings.