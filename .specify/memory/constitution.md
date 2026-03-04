<!--
=== Sync Impact Report ===

Version change:       1.0.0 → 1.1.0 (MINOR: Vercel added as the mandatory deployment
                      platform; new row in Technology Stack, new bullet in Principle I)

Modified principles:
  - I. Stack Conformance — added Vercel deployment requirement

Added sections:       None (row added to existing Technology Stack table)
Removed sections:     None

Templates status:
  ✅ .specify/templates/plan-template.md    — Constitution Check gate is generic; compatible
  ✅ .specify/templates/spec-template.md    — Generic structure; fully compatible
  ✅ .specify/templates/tasks-template.md   — Generic structure; adjust paths to Next.js/Convex layout in each plan.md
  ✅ .specify/templates/checklist-template.md — Generic; fully compatible
  ✅ .specify/templates/agent-file-template.md — Generic; fully compatible

Deferred TODOs:       None
===
-->

# Irekura Constitution

## Core Principles

### I. Stack Conformance

The Irekura stack is fixed and MUST NOT be extended with additional frameworks or services.
Permitted technologies are: TypeScript, Next.js (App Router), Convex, NextAuth v5, Tailwind CSS v4,
Vercel (hosting), and their officially-maintained ecosystem packages (e.g., Zod, date-fns).
Any proposed addition MUST be vetted against Principle VI (Simplicity) before adoption.

- All application code MUST be written in TypeScript with strict mode enabled.
- React Server Components and the Next.js App Router conventions MUST be followed.
- The PWA MUST be deployed exclusively to Vercel. No alternative hosting platforms
  (AWS, GCP, Cloudflare Pages, self-hosted, etc.) are permitted without a constitution amendment.
- No alternative state management libraries (Redux, Zustand, Jotai, etc.) unless Principle VI
  is satisfied with a concrete current justification.

**Rationale**: A fixed, well-chosen stack keeps the codebase predictable and maintainable
for a solo developer with zero onboarding overhead. Vercel is the natural deployment target for
Next.js PWAs and requires zero additional infrastructure configuration.

### II. Convex as Sole Backend

Convex is the only backend layer. All data persistence, queries, mutations, real-time
subscriptions, and scheduled jobs MUST be implemented through Convex.

- No custom REST API route handlers for data access (Next.js `route.ts` files MUST NOT
  duplicate Convex responsibilities).
- No secondary databases (SQLite, PostgreSQL, Redis, etc.).
- No custom serverless functions that bypass Convex.
- Business logic requiring data access MUST reside in Convex functions
  (queries / mutations / actions).

**Rationale**: A single backend eliminates operational overhead. Convex's type-safe
generated client removes the need for a separate ORM or data-access layer.

### III. Mobile-First Interface

All UI MUST be designed and implemented mobile-first.

- Tailwind CSS v4 utility classes are the exclusive styling mechanism. No custom CSS files,
  no CSS-in-JS, and no inline `style` props (except for dynamic values not expressible in
  Tailwind utilities).
- Responsive breakpoints MUST be additive: base styles target mobile (≤640 px); `sm:`,
  `md:`, `lg:` breakpoints progressively enhance for wider viewports.
- Interactive touch targets MUST meet a minimum of 44 × 44 px on mobile viewports.
- Desktop layout is a progressive enhancement, not the primary design target.

**Rationale**: Irekura is a personal coffee inventory used primarily on a phone.
Desktop-first CSS creates unnecessary rework and mobile UX debt.

### IV. Pure Functional Recommendation Engine

The recommendation engine MUST be implemented as pure functions only.

- Recommendation functions MUST be deterministic: identical inputs MUST always produce
  identical outputs.
- No side effects are permitted within recommendation logic (no database calls, no network
  I/O, no unseeded randomness).
- All recommendation logic MUST live in a dedicated module (e.g., `lib/recommendations/`)
  with zero runtime dependencies on Convex or Next.js internals.
- Every recommendation function MUST have unit tests that run without mocking any
  database, network, or framework layer.

**Rationale**: Pure functions are trivially unit-testable, independently refactorable,
and straightforward to debug. Isolating this logic prevents coupling it to infrastructure.

### V. Google OAuth via NextAuth v5

Authentication MUST use NextAuth v5 with the Google OAuth provider exclusively.

- No credentials-based authentication (username / password) is permitted.
- No custom session storage; NextAuth v5 session management is the only mechanism.
- Protected routes MUST use NextAuth middleware or server-side session checks—client-side
  guards alone MUST NOT be the sole protection.
- Irekura is a single-owner application; multi-user or role-based access control MUST NOT
  be added unless explicitly re-specified via a constitution amendment.

**Rationale**: Google OAuth covers all authentication needs for a single-user personal
utility. Custom auth code is a security liability with no benefit at this scope.

### VI. Simplicity Over Engineering

Every piece of code MUST justify its complexity by a current, concrete requirement.

- No abstractions, utilities, or patterns created for hypothetical future use (YAGNI).
- No additional npm packages without a clear, immediate need satisfying an existing
  requirement.
- No feature flags, configuration toggles, or multi-tenancy scaffolding.
- Duplication is preferred over premature abstraction when a pattern appears fewer than
  three times in the codebase.
- When two approaches satisfy the same requirement, the simpler one MUST be chosen.

**Rationale**: Irekura is a solo personal utility. Engineering overhead has no return
on investment; simplicity reduces maintenance burden and cognitive load.

## Technology Stack

Authoritative list of permitted technologies:

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript | Strict mode required |
| Framework | Next.js (App Router) | Latest stable |
| Backend / DB | Convex | Sole backend; latest stable |
| Auth | NextAuth v5 | Google OAuth provider only |
| Styling | Tailwind CSS v4 | Utility-only; no custom CSS |
| Hosting | Vercel | Sole deployment target for the PWA |
| Runtime | Node.js | LTS |
| Package Manager | npm or pnpm | Project default |

New dependencies MUST pass the Principle VI gate before being added to `package.json`.
Any exception requires a Complexity Tracking entry in the relevant `plan.md`.

## Development Workflow

- **Testing**: Unit tests are REQUIRED for all recommendation engine functions
  (Principle IV). Integration and E2E tests are OPTIONAL and added only when
  complexity warrants them.
- **Linting**: ESLint with TypeScript rules and Prettier MUST be configured and
  pass before committing.
- **Branching**: Feature branches named `###-short-description` per speckit conventions.
- **Self-review**: Each `plan.md` MUST include a Constitution Check section verified
  against these principles before implementation begins.

## Governance

This constitution supersedes all other project conventions. Any amendment MUST:

1. Be recorded in `.specify/memory/constitution.md` with an incremented version number.
2. Follow semantic versioning:
   - **MAJOR**: Removal or backward-incompatible redefinition of an existing principle.
   - **MINOR**: New principle or section added, or materially expanded guidance.
   - **PATCH**: Clarifications, wording fixes, or non-semantic refinements.
3. Update `LAST_AMENDED_DATE` to the ISO date of the change.
4. Propagate relevant changes to dependent templates (plan, spec, tasks) and update
   the Sync Impact Report comment at the top of this file.

Compliance is verified per feature via the **Constitution Check** gate in each `plan.md`.
Any violation MUST be documented in the plan's **Complexity Tracking** table with
explicit justification before work begins.

**Version**: 1.1.0 | **Ratified**: 2026-03-02 | **Last Amended**: 2026-03-02
