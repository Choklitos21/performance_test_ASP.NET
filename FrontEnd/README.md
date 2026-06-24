# Rental Platform — Frontend

Next.js frontend for the short-term rental platform. Guests browse properties, manage a wishlist, complete KYC identity verification, and make reservations. Owners manage listings and view reservation analytics.

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Runtime | Node.js 20 |
| React | React 19 |

---

## Project Structure

```
FrontEnd/
├── app/                          ← Next.js App Router pages
│   ├── layout.tsx                ← Root layout with Navbar
│   ├── page.tsx                  ← Home (redirects to /properties)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── properties/
│   │   ├── page.tsx              ← Browse properties (search + filter)
│   │   └── [id]/page.tsx         ← Property detail + reservation form
│   ├── my-reservations/page.tsx  ← Guest reservation history
│   ├── wishlist/page.tsx         ← Guest saved properties
│   ├── kyc/page.tsx              ← KYC document upload + status
│   ├── notifications/page.tsx    ← In-app notifications
│   └── owner/
│       ├── dashboard/page.tsx    ← Revenue + occupancy metrics
│       └── properties/
│           ├── page.tsx          ← Property management (CRUD)
│           └── [id]/
│               └── reservations/page.tsx  ← Reservations for one property
│
├── components/
│   ├── AuthGuard.tsx             ← Client-side route protection
│   └── Navbar.tsx                ← Role-aware navigation header
│
├── services/
│   └── api.ts                    ← All fetch calls to the backend
│
├── lib/
│   └── auth.ts                   ← JWT storage + role helpers
│
├── types/
│   └── index.ts                  ← TypeScript interfaces
│
├── next.config.ts                ← API proxy rewrites
└── Dockerfile
```

---

## Prerequisites (running without Docker)

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |

The backend must be running and accessible. See `../performance_test/README.md`.

---

## Running with Docker (recommended)

From the **project root** (`Prueba de desempeño/`):

```bash
docker compose up --build
```

The frontend is available at `http://localhost:3000`.

The backend URL is baked into the Docker image at build time via the `NEXT_PUBLIC_API_URL` build argument (defaults to `http://api:8080`). To point to a different backend:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=http://your-api-host:8080 frontend
```

---

## Running Locally (development)

```bash
cd FrontEnd
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

In development mode, the backend is assumed to be at `http://localhost:8080`. This is set by the rewrite in `next.config.ts`:

```ts
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
```

Set `NEXT_PUBLIC_API_URL` in a `.env.local` file if the backend runs on a different port:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## API Proxy

The frontend never calls the backend directly from the browser. All requests go through Next.js rewrites defined in `next.config.ts`:

```
Browser → http://localhost:3000/api/*
       → (Next.js rewrite)
       → http://api:8080/api/*     (Docker)
       → http://localhost:8080/api/* (local dev)
```

The same applies to uploaded files served by the backend:

```
/uploads/* → backend /uploads/*
```

This means no CORS headers need to be set for the browser, since from the browser's perspective all requests are same-origin.

---

## Authentication

JWT tokens are stored in `localStorage` via `lib/auth.ts`. The helper functions are:

| Function | Purpose |
|---|---|
| `saveAuth(token, user)` | Store token + user info after login/register |
| `getToken()` | Read stored token (returns `null` if not set) |
| `getUser()` | Read stored user info (email, fullName, role) |
| `isLoggedIn()` | `true` if a token exists |
| `isOwner()` | `true` if role is `"Owner"` |
| `logout()` | Clear token and user info from localStorage |

The `request()` function in `api.ts` automatically attaches the Bearer token to every request. A `401` response triggers `logout()` and redirects to `/login`.

---

## Route Protection

The `AuthGuard` component wraps any page that requires authentication. It runs on the client after mount and redirects to `/login` if no token exists.

```tsx
<AuthGuard>
  <ProtectedContent />
</AuthGuard>
```

For owner-only pages, pass the `ownerOnly` prop, which redirects non-owners to `/properties`:

```tsx
<AuthGuard ownerOnly>
  <OwnerOnlyContent />
</AuthGuard>
```

---

## Role-Based UI

Navigation and page features adapt based on the user's role, which is read from `localStorage` on mount to avoid SSR hydration mismatches.

**Guest sees:**
- Properties, Wishlist, My Reservations, KYC, Notifications

**Owner sees:**
- Properties, My Properties, Dashboard, Notifications

**On property detail pages:**
- Guests see the reservation date picker and wishlist button.
- Owners see a notice that owner accounts cannot make reservations. The reservation form and wishlist button are hidden entirely.

---

## Key Pages

### `/properties` — Browse Properties
Search by location and filter by availability date range. Calls `GET /api/properties?location=...&checkIn=...&checkOut=...`.

### `/properties/[id]` — Property Detail
Shows full property info. For guests: date picker to create a reservation, wishlist save button. Handles KYC-required errors (403) with a link to the KYC page. For owners: informational message only (no booking actions).

### `/kyc` — KYC Verification
Upload an identity document (JPEG, PNG, GIF, WEBP). The backend sends the image to OpenAI Vision, extracts name fields, and compares them against the account name. Shows the returned status (Approved / Rejected), extracted fields, and similarity score.

### `/my-reservations` — Guest Reservations
Lists all reservations with status badges. Confirmed reservations show a Cancel button.

### `/wishlist` — Saved Properties
Lists saved properties with price and location. Remove button on each item.

### `/owner/dashboard` — Owner Analytics
Revenue, total reservations, occupancy rate, and a per-property breakdown table. Includes optional date range filter and an Excel export button.

### `/owner/properties` — Property Management
Full CRUD for the owner's property listings. Inline forms for creation and editing. Photo upload per property. Soft-delete (marks property inactive).

### `/owner/properties/[id]/reservations` — Property Reservations
Table of all reservations for a specific property. Shows **guest full name and email** (not just user ID). Summary cards for total reservations, confirmed count, and revenue.

---
