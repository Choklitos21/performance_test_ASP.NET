# Short-Term Rental Platform — Technical Assessment

Full-stack short-term rental platform. Owners publish properties; guests browse, save to a wishlist, complete KYC identity verification, and make reservations. The project is containerised and starts with a single Docker Compose command.

---

## Project Structure

```
Prueba de desempeño/
├── docker-compose.yml          ← Orchestrates all three containers
├── README.md                   ← This file
│
├── performance_test/           ← ASP.NET Core Web API (backend)
│   ├── performance_test.Domain/
│   ├── performance_test.Application/
│   ├── performance_test.Infrastructure/
│   ├── performance_test.WebApi/
│   ├── docker-compose.yml      ← Backend-only compose (API + DB, no frontend)
│   └── README.md
│
└── FrontEnd/                   ← Next.js frontend
    ├── app/
    ├── components/
    ├── services/
    ├── Dockerfile
    └── README.md
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2 (included with Docker Desktop) |
| Git | any |

You do **not** need .NET or Node.js installed to run the project with Docker.

An **OpenAI API key** is required for KYC document verification. See the configuration section below.

---

## Quick Start

```bash
git clone <repository-url>
cd "Prueba de desempeño"

docker compose up --build
```

Wait for the database health check to pass and the API to print its startup banner (roughly 30–60 seconds on first run while images are pulled and the .NET project is compiled).

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger |
| PostgreSQL | localhost:5433 |

Stop everything:

```bash
docker compose down
```

Remove all data (database volume):

```bash
docker compose down -v
```

---

## OpenAI API Key Configuration

KYC document verification calls the **OpenAI GPT-4o Vision API**. You must supply a valid key before the KYC feature will work.

Open `docker-compose.yml` (at the project root) and replace the placeholder on the `OpenAI__ApiKey` line:

```yaml
environment:
  - OpenAI__ApiKey=your-openai-api-key-here
```

Alternatively, set it as a shell environment variable before running Compose:

```bash
export OPENAI_API_KEY=your-openai-api-key-here
```

Then reference it in `docker-compose.yml`:

```yaml
environment:
  - OpenAI__ApiKey=${OPENAI_API_KEY}
```

The backend also reads `OpenAI:ApiKey` from `appsettings.json` when running locally (without Docker).

---

## Seed Accounts

The database is seeded automatically on first startup.

| Role | Email | Password |
|---|---|---|
| Owner | `owner@test.com` | `Owner123!` |
| Guest | `guest@test.com` | `Guest123!` |

Both accounts start with KYC already approved. Two sample properties are created under the owner account (Bogotá and Cartagena).

---

## Architecture Overview

### Backend — ASP.NET Core Web API

Four-layer clean architecture:

- **Domain** — entities and enums only, no external dependencies
- **Application** — DTOs and business services; references Domain and Infrastructure
- **Infrastructure** — EF Core `AppDbContext`, `ApplicationUser`, migrations, and database seeding
- **WebApi** — controllers, middleware, JWT setup, entry point

Database: PostgreSQL 16. Migrations run automatically at startup.

See `performance_test/README.md` for the full API reference.

### Frontend — Next.js

Next.js 16 (App Router) with TypeScript and Tailwind CSS v4.

All `/api/*` requests are rewritten by Next.js to the backend URL. In Docker the backend hostname is `api:8080` and this is baked into the image at build time via `NEXT_PUBLIC_API_URL`. In local development the rewrite target is `http://localhost:8080`.

Authentication state is stored in `localStorage` (JWT token + user info). Route protection is handled client-side by an `AuthGuard` component.

See `FrontEnd/README.md` for the full frontend reference.

---

## Role Separation

| Capability | Guest | Owner |
|---|---|---|
| Browse properties | ✓ | ✓ |
| Save to wishlist | ✓ | — |
| Submit KYC | ✓ | — |
| Create reservation | ✓ (KYC required) | — (403) |
| View own reservations | ✓ | — |
| Create / manage properties | — | ✓ |
| View property reservations | — | ✓ |
| Owner dashboard & reports | — | ✓ |

Owners are blocked from creating reservations at both the API level (HTTP 403) and the UI level (reservation form and wishlist button are hidden).

---

## Container Architecture

```
┌──────────────┐        ┌─────────────────┐        ┌──────────────────┐
│   Browser    │──3000──│   frontend      │──8080──│       api        │
│              │        │  (Next.js)      │        │  (ASP.NET Core)  │
└──────────────┘        └─────────────────┘        └────────┬─────────┘
                                                            │ 5432
                                                   ┌────────▼─────────┐
                                                   │       db         │
                                                   │  (PostgreSQL 16) │
                                                   └──────────────────┘
```

The frontend never calls the backend directly from the browser. All API calls go through Next.js rewrites (`/api/*` → `http://api:8080/api/*`), keeping the backend off the public-facing port from the browser's perspective.
