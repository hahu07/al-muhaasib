# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common commands

Setup and dev

```bash
# Install deps (copies Juno auth workers to public/workers via postinstall)
npm install

# Start dev server (Next.js 15 with Turbopack)
npm run dev
```

Lint/format/typecheck

```bash
npm run lint
npm run format
npx tsc --noEmit
```

Build and run

```bash
# Build static export to out/
npm run build

# Start production server
npm start
```

Juno (hosting, emulator, functions)

```bash
# Local emulator
juno emulator start

# Deploy static site defined in juno.config.mjs (source: out)
juno hosting deploy

# Serverless functions (CI uses these)
juno functions build
juno functions publish
```

Useful scripts and demos

```bash
# Reset seed/dev data (TypeScript runner)
npx tsx scripts/reset-dev-data.ts

# Clear classes utility (Node)
node scripts/clear-classes.js

# Run single demo/test scripts (tsx shebang)
npx tsx tests/test-juno-validation.ts
npx tsx tests/enhanced-expense-validation-demo.ts
npx tsx tests/example-dynamic-categories.ts
```

Notes

- Node 22 is used in CI.
- Production satellite ID is configured in juno.config.mjs; GitHub Actions use JUNO_TOKEN for deploy.

## High-level architecture

Frontend (Next.js 15, CSR-only)

- App Router in src/app with RootLayout wiring providers: JunoProvider (initializes @junobuild/core) and ThemeProvider.
- Static export configured in next.config.mjs via withJuno({ output: 'export', trailingSlash: true, images.unoptimized: true }).
- UI built with Tailwind CSS v4 (globals.css imports tailwindcss) and Lucide icons.

State and context

- AuthContext integrates Internet Identity via @junobuild/core onAuthStateChange; first authenticated user is provisioned as super_admin with default permissions.
- SchoolContext loads/persists school configuration (branding, currency, session/term, enabled modules) and exposes helpers (formatCurrency, getCurrentSession/Term).
- ThemeContext manages light/dark classes on <html> and persists preference to localStorage.

Service layer (business logic)

- BaseDataService in src/services/dataService.ts wraps @junobuild/core setDoc/getDoc/listDocs/countDocs/deleteDoc with a 3‑minute, 50‑entry in‑memory cache and bigint serialization helpers.
- Domain services in src/services: classes, fees (categories/structures/assignments), payments (enhanced analytics and receipts), expenses (approval/status flows), staff/payroll, assets/capex/depreciation, and accounting (chart of accounts, journal entries, trial balance). All persist to Juno collections defined in COLLECTIONS.
- Public API for components/hooks is re‑exported via src/services/index.ts.

Juno satellite (server-side validation)

- src/satellite is a Rust crate using junobuild-satellite and macros (on_set_doc, on_delete_doc, assert_set_doc, etc.).
- Enforces datastore rules before write: expense field validation (amount > 0, ISO dates, allowed payment methods), status‑transition policies (pending→approved→paid), uniqueness checks (e.g., references), referential integrity (category exists), high‑value requirements (purpose/approval), anti‑fraud duplicate detection, and payroll safeguards (one paid salary per staff/month, approval for > ₦1M net).
- TypeScript bindings for the satellite DID live in src/declarations/satellite/.

Build/deploy pipeline

- next.config.mjs wraps config with withJuno; juno.config.mjs sets source: out and predeploy: ["npm run build"].
- GitHub Actions: .github/workflows/deploy.yml runs npm ci then juno deploy; publish.yml builds and publishes serverless functions.

Testing and demos

- No formal test runner is configured yet; tests/ contains tsx‑executed demo scripts that exercise the service layer and satellite validations. Ensure the Juno emulator or a development satellite is available when running them.
