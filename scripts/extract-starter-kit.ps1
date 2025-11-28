# Next.js SaaS Starter Kit Extraction Script (PowerShell)
# Usage: .\extract-starter-kit.ps1 -TargetDir "C:\path\to\new-project"

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetDir
)

$ErrorActionPreference = "Stop"

$SourceDir = Split-Path -Parent $PSScriptRoot

Write-Host "Creating SaaS Starter Kit at: $TargetDir" -ForegroundColor Cyan
Write-Host "Source: $SourceDir" -ForegroundColor Gray
Write-Host ""

# Create target directory structure
$dirs = @(
    "$TargetDir\app\api\health",
    "$TargetDir\components\ui",
    "$TargetDir\lib\supabase",
    "$TargetDir\supabase\migrations",
    "$TargetDir\public"
)
foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Host "1/10 Copying core library files..." -ForegroundColor Yellow
Copy-Item "$SourceDir\lib\rate-limiter.ts" "$TargetDir\lib\" -Force
Copy-Item "$SourceDir\lib\logger.ts" "$TargetDir\lib\" -Force
Copy-Item "$SourceDir\lib\api-utils.ts" "$TargetDir\lib\" -Force
Copy-Item "$SourceDir\lib\env.ts" "$TargetDir\lib\" -Force

Write-Host "2/10 Copying Supabase integration..." -ForegroundColor Yellow
Copy-Item "$SourceDir\lib\supabase\client.ts" "$TargetDir\lib\supabase\" -Force
Copy-Item "$SourceDir\lib\supabase\server.ts" "$TargetDir\lib\supabase\" -Force

Write-Host "3/10 Copying email service..." -ForegroundColor Yellow
Copy-Item "$SourceDir\lib\email.ts" "$TargetDir\lib\" -Force

Write-Host "4/10 Copying Stripe integration..." -ForegroundColor Yellow
Copy-Item "$SourceDir\lib\stripe.ts" "$TargetDir\lib\" -Force

Write-Host "5/10 Copying validation utilities..." -ForegroundColor Yellow
Copy-Item "$SourceDir\lib\validations.ts" "$TargetDir\lib\" -Force

Write-Host "6/10 Copying core components..." -ForegroundColor Yellow
Copy-Item "$SourceDir\components\analytics-provider.tsx" "$TargetDir\components\" -Force
Copy-Item "$SourceDir\components\cookie-consent.tsx" "$TargetDir\components\" -Force
Copy-Item "$SourceDir\components\ErrorBoundary.tsx" "$TargetDir\components\" -Force

Write-Host "7/10 Copying UI component library..." -ForegroundColor Yellow
Get-ChildItem "$SourceDir\components\ui\*.tsx" -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item $_.FullName "$TargetDir\components\ui\" -Force
}

Write-Host "8/10 Copying database migrations..." -ForegroundColor Yellow
if (Test-Path "$SourceDir\supabase\migrations\20250124_atomic_credit_operations.sql") {
    Copy-Item "$SourceDir\supabase\migrations\20250124_atomic_credit_operations.sql" "$TargetDir\supabase\migrations\" -Force
}

Write-Host "9/10 Copying configuration files..." -ForegroundColor Yellow
Copy-Item "$SourceDir\next.config.ts" "$TargetDir\" -Force
if (Test-Path "$SourceDir\tailwind.config.ts") {
    Copy-Item "$SourceDir\tailwind.config.ts" "$TargetDir\" -Force
}
Copy-Item "$SourceDir\tsconfig.json" "$TargetDir\" -Force
if (Test-Path "$SourceDir\postcss.config.mjs") {
    Copy-Item "$SourceDir\postcss.config.mjs" "$TargetDir\" -Force
}

Write-Host "10/10 Creating template files..." -ForegroundColor Yellow

# Create .env.example
@"
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
"@ | Out-File -FilePath "$TargetDir\.env.example" -Encoding UTF8

# Create package.json
@"
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
"@ | Out-File -FilePath "$TargetDir\package.json" -Encoding UTF8

# Create app/layout.tsx
@"
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
"@ | Out-File -FilePath "$TargetDir\app\layout.tsx" -Encoding UTF8

# Create globals.css
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Out-File -FilePath "$TargetDir\app\globals.css" -Encoding UTF8

# Create page.tsx
@"
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Your SaaS App</h1>
      <p className="text-gray-600">Built with Next.js SaaS Starter Kit</p>
    </main>
  );
}
"@ | Out-File -FilePath "$TargetDir\app\page.tsx" -Encoding UTF8

# Create health check API
@"
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
"@ | Out-File -FilePath "$TargetDir\app\api\health\route.ts" -Encoding UTF8

Write-Host ""
Write-Host "Starter kit extracted successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd $TargetDir"
Write-Host "2. npm install"
Write-Host "3. Copy .env.example to .env.local and fill in your values"
Write-Host "4. Update lib/env.ts with your environment variables"
Write-Host "5. Run: npm run dev"
Write-Host ""
Write-Host "See STARTER_KIT_EXTRACTION.md for detailed customization guide." -ForegroundColor Gray
