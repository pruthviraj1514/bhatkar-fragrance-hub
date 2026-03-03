# Project Structure & Technology Stack

This document provides an overview of the repository layout and the technologies used throughout the project. It is intended to help new contributors quickly understand how the codebase is organized and what tools/frameworks are involved.

---

## 📁 Top-Level Directory

The root contains a large collection of markdown documentation, scripts, configuration files, and a full frontend + backend codebase.

### Key files and folders

- `.env.example` / `.gitignore` – environment/sample configuration and ignore rules.
- `package.json`, `bun.lockb`, `package-lock.json` – project dependencies and package managers (npm/bun).
- `docker-compose.yml`, `render.yaml`, `netlify.toml` – deployment configurations.
- `src/` – main frontend application written in TypeScript (Vite + React).
- `backend/` – separate backend service including Node.js utilities, migrations, and API code.
- `public/` – static assets for the frontend.
- `test-*`, `tmp/` – assorted test scripts used during development and debugging.

There are also many markdown guides and checklists covering implementation notes, fixes, and deployment instructions (e.g. `FRONTEND_DEPLOYMENT.md`, `RAZORPAY_INTEGRATION_GUIDE.md`, etc.).

## 🧱 Directory Tree (top 2 levels)

```
.                    # root of repository
├── .env.example
├── .gitignore
├── ACTION_PLAN.md
├── ... many docs ...
├── backend/          # backend service code & utilities
├── public/           # static files used by frontend
├── src/              # frontend source (React + Vite + TypeScript)
├── package.json
├── bun.lockb
├── tsconfig.json
├── vite.config.ts
└── ...
```

> *For a full listing of files and deeper directories, run `tree` from the repository root.*

## 🛠 Technology Stack

### Frontend

- **Framework**: React (via TypeScript) with Vite as the bundler.
- **Styling**: Tailwind CSS (`tailwind.config.ts`) + custom CSS.
- **State & Data**: React contexts, hooks, utility libraries.
- **Tests**: `vitest` configuration present (`vitest.config.ts`).

### Backend

- **Runtime**: Node.js (`package.json` lists dependencies).
- **Scripts**: multiple `.js` and `.cjs` helper scripts for database checks, migration, testing, and image operations.
- **Database**: MySQL/SQL scripts (see `MIGRATION_SQL_COMMANDS.sql`) and integration guides (supabase/railway docs).

### Deployment & Operations

- **Containerization**: `docker-compose.yml` for local stack.
- **Hosting**: configuration for Netlify (`netlify.toml`) and Render (`render.yaml`).
- **CI/CD**: various guides hint at pipeline steps (e.g. `DEPLOYMENT_STATUS.md`).

### Utilities & Tooling

- **TypeScript**: config files (`tsconfig.*.json`).
- **Linting/Formatting**: `eslint.config.js`.
- **Package Managers**: npm (`package-lock.json`) and Bun (`bun.lockb`).
- **Environment**: `.env` templates for both frontend and backend.

## 📘 Documentation

A vast library of Markdown files documents almost every aspect of the project, including:

- Fix guides (e.g., `PAYMENT_FIX_DEPLOYMENT_CHECKLIST.md`).
- Implementation summaries and status trackers.
- Integration guides for third-party services (e.g., Razorpay, Supabase, Railway).
- Quick-start and troubleshooting instructions.

> These docs are aimed at both developers and operations personnel, capturing past decisions and future action items.

---

> **Tip:** Whenever working on a specific area, start by reading the relevant guide in the root directory; the names are generally descriptive.

This `PROJECT_STRUCTURE.md` should serve as a starting point for understanding the layout and technologies powering the Bhatkar Fragrance Hub.