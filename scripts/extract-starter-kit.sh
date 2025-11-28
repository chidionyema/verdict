#!/bin/bash

# Next.js SaaS Starter Kit Extraction Script
# Usage: ./extract-starter-kit.sh /path/to/new-project

set -e

if [ -z "$1" ]; then
    echo "Usage: ./extract-starter-kit.sh /path/to/new-project"
    exit 1
fi

TARGET_DIR="$1"
SOURCE_DIR="$(dirname "$0")/.."

echo "Creating SaaS Starter Kit at: $TARGET_DIR"
echo "Source: $SOURCE_DIR"
echo ""

# Create target directory structure
mkdir -p "$TARGET_DIR"/{app,components/ui,lib/supabase,supabase/migrations,public}

echo "1/10 Copying core library files..."
# Core libraries (direct copy)
cp "$SOURCE_DIR/lib/rate-limiter.ts" "$TARGET_DIR/lib/"
cp "$SOURCE_DIR/lib/logger.ts" "$TARGET_DIR/lib/"
cp "$SOURCE_DIR/lib/api-utils.ts" "$TARGET_DIR/lib/"
cp "$SOURCE_DIR/lib/env.ts" "$TARGET_DIR/lib/"

echo "2/10 Copying Supabase integration..."
cp "$SOURCE_DIR/lib/supabase/client.ts" "$TARGET_DIR/lib/supabase/"
cp "$SOURCE_DIR/lib/supabase/server.ts" "$TARGET_DIR/lib/supabase/"

echo "3/10 Copying email service..."
cp "$SOURCE_DIR/lib/email.ts" "$TARGET_DIR/lib/"

echo "4/10 Copying Stripe integration..."
cp "$SOURCE_DIR/lib/stripe.ts" "$TARGET_DIR/lib/"

echo "5/10 Copying validation utilities..."
cp "$SOURCE_DIR/lib/validations.ts" "$TARGET_DIR/lib/"

echo "6/10 Copying core components..."
cp "$SOURCE_DIR/components/analytics-provider.tsx" "$TARGET_DIR/components/"
cp "$SOURCE_DIR/components/cookie-consent.tsx" "$TARGET_DIR/components/"
cp "$SOURCE_DIR/components/ErrorBoundary.tsx" "$TARGET_DIR/components/"

echo "7/10 Copying UI component library..."
cp "$SOURCE_DIR/components/ui/"*.tsx "$TARGET_DIR/components/ui/" 2>/dev/null || true

echo "8/10 Copying database migrations..."
cp "$SOURCE_DIR/supabase/migrations/20250124_atomic_credit_operations.sql" "$TARGET_DIR/supabase/migrations/" 2>/dev/null || echo "  (migration not found, skipping)"

echo "9/10 Copying configuration files..."
cp "$SOURCE_DIR/next.config.ts" "$TARGET_DIR/"
cp "$SOURCE_DIR/tailwind.config.ts" "$TARGET_DIR/" 2>/dev/null || true
cp "$SOURCE_DIR/tsconfig.json" "$TARGET_DIR/"
cp "$SOURCE_DIR/postcss.config.mjs" "$TARGET_DIR/" 2>/dev/null || true

echo "10/10 Creating template files..."

# Create .env.example
cat > "$TARGET_DIR/.env.example" << 'EOF'
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Connection pooler for production
# DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Stripe (Optional - enables payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Email (Optional - enables transactional email)
RESEND_API_KEY=re_xxx

# Analytics (Optional)
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxx
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXX
NEXT_PUBLIC_POSTHOG_KEY=xxx

# Logging (Optional - enables production logging)
LOGTAIL_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
EOF

# Create package.json template
cat > "$TARGET_DIR/package.json" << 'EOF'
{
  "name": "saas-starter",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "@supabase/ssr": "^0.5.0",
    "stripe": "^14.0.0",
    "resend": "^2.0.0",
    "zod": "^3.23.0",
    "zustand": "^4.5.0",
    "@vercel/analytics": "^1.4.0",
    "@vercel/speed-insights": "^1.1.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@logtail/node": "^0.5.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
EOF

# Create basic app/layout.tsx
cat > "$TARGET_DIR/app/layout.tsx" << 'EOF'
import './globals.css';
import { AnalyticsProvider } from '@/components/analytics-provider';
import { CookieConsentBanner } from '@/components/cookie-consent';

export const metadata = {
  title: 'Your SaaS App',
  description: 'Built with Next.js SaaS Starter Kit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsProvider />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
EOF

# Create globals.css
cat > "$TARGET_DIR/app/globals.css" << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Create basic page.tsx
cat > "$TARGET_DIR/app/page.tsx" << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Your SaaS App</h1>
      <p className="text-gray-600">Built with Next.js SaaS Starter Kit</p>
    </main>
  );
}
EOF

# Create health check API
mkdir -p "$TARGET_DIR/app/api/health"
cat > "$TARGET_DIR/app/api/health/route.ts" << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
EOF

echo ""
echo "Starter kit extracted successfully!"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. npm install"
echo "3. Copy .env.example to .env.local and fill in your values"
echo "4. Update lib/env.ts with your environment variables"
echo "5. Run: npm run dev"
echo ""
echo "See STARTER_KIT_EXTRACTION.md for detailed customization guide."
