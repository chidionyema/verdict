This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment setup

Copy `env.example` to `.env.local` and fill in your Supabase and Stripe credentials:

```bash
cp env.example .env.local
```

The app requires valid values for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

You can find the Supabase keys in your project's **Settings → API** page.

Other variables in `env.example` already contain sensible local defaults but can be adjusted to match your deployment URLs.

### Development server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Testing

For a detailed overview of the test types and commands, see `TESTING_GUIDE.md`.

Quick reference:

- **Unit / domain tests (Vitest):**

```bash
npm run test:unit
```

- **Simulation (integration) tests:**

```bash
npm run test:sim
```

- **End-to-end tests (Playwright, requires `npm run dev` in another terminal):**

```bash
npm run test:e2e
```

### Local Stripe webhook testing (credits & payments)

To test credit purchases and Stripe webhooks **locally**, you need to forward Stripe events to your local app.

1. **Set required env vars**

   In `.env.local`:

   - `STRIPE_SECRET_KEY` – your Stripe **secret** key (e.g. `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` – the webhook signing secret from Stripe/Stripe CLI

2. **Run the dev server**

   ```bash
   npm run dev
   # app should be available at http://localhost:3000
   ```

3. **Use Stripe CLI to forward webhooks (recommended)**

   - Install and log in to the Stripe CLI, then run:

     ```bash
     stripe listen --forward-to localhost:3000/api/billing/webhook
     ```

   - The CLI will print a line like:

     ```text
     Ready! Your webhook signing secret is whsec_XXXX...
     ```

   - Copy that `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `.env.local` and **restart** the dev server.

4. **Trigger a test purchase**

   - In the app, go to the account/credits page and start a test purchase using a Stripe test card (e.g. `4242 4242 4242 4242`).
   - After completing checkout, Stripe will send a `checkout.session.completed` event to the CLI, which forwards it to `http://localhost:3000/api/billing/webhook`.

5. **Verify credits updated**

   - In your Supabase dashboard, check the `profiles` table for your user row and confirm `credits` increased.
   - Refresh the `/account` page in the app; the displayed credits should match the updated value from Supabase.

For deployed environments (e.g. Vercel), configure a webhook endpoint in the Stripe Dashboard pointing to `https://your-domain.com/api/billing/webhook` and use the dashboard-provided `whsec_...` as `STRIPE_WEBHOOK_SECRET`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
