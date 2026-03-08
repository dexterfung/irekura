# Irekura

A Progressive Web App (PWA) for tracking your coffee inventory and getting personalised brew recommendations based on your mood and flavour preferences.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Convex** — real-time backend and database
- **NextAuth v5** — Google OAuth authentication
- **Tailwind CSS v4** + shadcn/ui components
- **Serwist** — PWA service worker

## Getting Started

### Prerequisites

- Node.js LTS 22+
- A [Convex](https://convex.dev) account
- A Google OAuth app ([Google Cloud Console](https://console.cloud.google.com))

### 1. Clone and install

```bash
git clone <repo-url>
cd irekura
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

Follow the prompts to create or link a Convex project. This will populate `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT` in `.env.local` automatically.

### 3. Generate RSA keys for Convex JWT auth

```bash
node scripts/generate-auth-keys.js
```

Copy the output values into `.env.local`, then register the public key with your Convex deployment:

```bash
npx convex env set CONVEX_AUTH_PUBLIC_KEY "<your-base64-public-key>"
```

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `NEXTAUTH_URL` | App URL (use `http://localhost:3000` for local dev) |
| `NEXT_PUBLIC_CONVEX_URL` | Auto-set by `npx convex dev` |
| `CONVEX_DEPLOYMENT` | Auto-set by `npx convex dev` |
| `CONVEX_SITE_URL` | Your Convex site URL, e.g. `https://your-deployment.convex.site` |
| `CONVEX_AUTH_PRIVATE_KEY` | Base64-encoded RSA private key (from step 3) |
| `CONVEX_AUTH_PUBLIC_KEY` | Base64-encoded RSA public key (from step 3) |

### 5. Configure Google OAuth

In [Google Cloud Console](https://console.cloud.google.com):

- **Authorised redirect URI**: `http://localhost:3000/api/auth/callback/google`
- If the OAuth consent screen is in **Testing** mode, add your Google account as a test user under _OAuth consent screen → Test users_

### 6. Run the app

In two separate terminals:

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development Commands

```bash
npm test          # Run unit tests (Vitest)
npm run lint      # ESLint
npm run type-check  # TypeScript
npm run build     # Production build
```

## How Auth Works

NextAuth handles Google sign-in and issues sessions. When the client needs to query Convex, it fetches a short-lived RS256 JWT from `/api/auth/convex-token`. Convex verifies that JWT using the public JWKS served from the Convex site URL at `/.well-known/jwks.json`.

This means the RSA key pair must be consistent across your Next.js app and Convex deployment — regenerating keys requires updating both `.env.local` and `npx convex env set`.
