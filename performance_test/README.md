# Performance Test — Backend API

ASP.NET Core Web API for a short-term rental platform. Owners publish properties; guests complete KYC identity verification and make reservations.

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | .NET 10 |
| Web Framework | ASP.NET Core Web API |
| ORM | Entity Framework Core 9 |
| Database | PostgreSQL 16 |
| Authentication | ASP.NET Core Identity + JWT Bearer |
| KYC AI | OpenAI GPT-4o Vision API |
| Excel Export | EPPlus 7 (NonCommercial) |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
performance_test/
├── performance_test.Domain/
│   ├── Entities/
│   │   ├── Property.cs
│   │   ├── PropertyPhoto.cs
│   │   ├── Reservation.cs
│   │   ├── Wishlist.cs
│   │   ├── KycDocument.cs
│   │   └── Notification.cs
│   └── Enums/
│       ├── ReservationStatus.cs    # Confirmed | Cancelled | Completed
│       └── KycStatus.cs            # Pending | Approved | Rejected
│
├── performance_test.Application/
│   ├── DTOs/
│   │   ├── Auth/
│   │   ├── Property/
│   │   ├── Reservation/
│   │   ├── Wishlist/
│   │   ├── Kyc/
│   │   ├── Dashboard/
│   │   └── Notification/
│   └── Services/
│       ├── AuthService.cs
│       ├── PropertyService.cs
│       ├── ReservationService.cs
│       ├── WishlistService.cs
│       ├── KycService.cs
│       ├── OpenAiClient.cs
│       ├── NotificationService.cs
│       ├── ReportService.cs
│       └── DashboardService.cs
│
├── performance_test.Infrastructure/
│   ├── Migrations/
│   └── Persistence/
│       ├── ApplicationUser.cs      # IdentityUser + FullName + KycStatus
│       ├── AppDbContext.cs         # IdentityDbContext<ApplicationUser>
│       └── DbSeeder.cs             # MigrateAsync + seed test users/properties
│
├── performance_test.WebApi/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── PropertiesController.cs
│   │   ├── ReservationsController.cs
│   │   ├── WishlistController.cs
│   │   ├── KycController.cs
│   │   ├── ReportsController.cs
│   │   ├── DashboardController.cs
│   │   └── NotificationsController.cs
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs
│   ├── Program.cs
│   ├── appsettings.json
│   └── Dockerfile
│
├── docker-compose.yml              # Backend + DB only (no frontend)
└── performance_test.sln
```

---

## Architecture

The project uses a four-layer architecture with a strict dependency rule:

```
Domain  ←  Application  ←  Infrastructure  ←  WebApi
```

**Domain** — Pure entities and enums. No external dependencies. Defines `Reservation`, `Property`, `KycDocument`, `Wishlist`, `Notification`, and their status enums.

**Application** — Business logic services and DTOs. Services reference `AppDbContext` from Infrastructure directly (no repository abstraction). This keeps the code straightforward for an MVP.

**Infrastructure** — EF Core context (`AppDbContext`), Identity user (`ApplicationUser`), migrations, and the database seeder. `ApplicationUser` extends `IdentityUser` with `FullName` and `KycStatus`.

**WebApi** — Controllers thin-wrap service calls. One piece of global middleware (`ExceptionMiddleware`) catches unhandled exceptions and returns consistent JSON errors. JWT authentication is configured with `ClockSkew = TimeSpan.Zero`.

Design choices:
- No CQRS, no MediatR, no repository pattern.
- Soft-deletes on properties (`IsActive = false`). No hard deletes through the API.
- All `DateTime` values stored as UTC. Reservation dates are converted with `DateTime.SpecifyKind(..., DateTimeKind.Utc)` before persistence to satisfy Npgsql's `timestamp with time zone` requirement.
- Migrations run automatically on startup via `DbSeeder.SeedAsync`.
- Enum values serialised as strings (`JsonStringEnumConverter`).

---

## Running with Docker (recommended)

From the **project root** (`Prueba de desempeño/`) to start both the API and PostgreSQL:

```bash
docker compose up --build
```

From **this directory** (`performance_test/`) to start the API and database without the frontend:

```bash
docker compose -f docker-compose.yml up --build
```

The API listens on `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger`.  
PostgreSQL is exposed on `localhost:5433` (mapped from container port 5432).

```bash
docker compose down        # stop containers
docker compose down -v     # stop and remove data volumes
```

---

## Running Locally (without Docker)

Prerequisites: .NET 10 SDK, PostgreSQL running locally.

1. Update `performance_test.WebApi/appsettings.json` with your local connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=performance_test;Username=postgres;Password=postgres123"
}
```

2. Set your OpenAI API key:

```json
"OpenAI": {
  "ApiKey": "your-openai-api-key-here"
}
```

3. Run:

```bash
dotnet run --project performance_test.WebApi
```

Migrations and seed data apply automatically on first start.

---

## Environment Variables

All values in `appsettings.json` can be overridden by environment variables (Docker uses double-underscore notation for nested keys):

| Variable | Description | Default (appsettings) |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=localhost;Port=5433;...` |
| `JwtSettings__Secret` | JWT signing secret (min 32 chars) | set in appsettings |
| `JwtSettings__Issuer` | JWT issuer claim | `performance_test` |
| `JwtSettings__Audience` | JWT audience claim | `performance_test` |
| `JwtSettings__ExpiryMinutes` | Token lifetime | `1440` (24 hours) |
| `Storage__KycPath` | Directory for uploaded KYC images | `uploads/kyc` |
| `OpenAI__ApiKey` | OpenAI API key for KYC Vision calls | *(must be set)* |

---

## OpenAI Configuration

KYC verification calls `https://api.openai.com/v1/chat/completions` using the `gpt-4o` model with vision. A valid API key with access to that model is required.

**In Docker** — edit `docker-compose.yml` (either the root or this directory):

```yaml
environment:
  - OpenAI__ApiKey=your-openai-api-key-here
```

**Locally** — set `OpenAI.ApiKey` in `appsettings.json` or export the environment variable:

```bash
export OpenAI__ApiKey=your-openai-api-key-here
dotnet run --project performance_test.WebApi
```

If the key is missing, the KYC submit endpoint returns `500` with a descriptive error message.

---

## Seed Data

`DbSeeder` runs `MigrateAsync` then creates the following if they do not exist:

| Role | Email | Password | KYC Status |
|---|---|---|---|
| Owner | `owner@test.com` | `Owner123!` | Approved |
| Guest | `guest@test.com` | `Guest123!` | Approved |

Two properties are seeded under the owner:
- *Cozy Apartment in City Center* — Bogotá, COP 150,000/night
- *Beach House in Cartagena* — Cartagena, COP 280,000/night

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a Guest or Owner account |
| POST | `/api/auth/login` | Public | Login, receive JWT |

**Register body:**
```json
{
  "fullName": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Pass123!",
  "role": "Guest"
}
```
`role` accepts `"Guest"` or `"Owner"`.

**Login response:**
```json
{
  "token": "eyJ...",
  "email": "juan@example.com",
  "fullName": "Juan Pérez",
  "role": "Guest"
}
```

---

### Properties — `/api/properties`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/properties` | Public | List active properties |
| GET | `/api/properties/{id}` | Public | Get property by ID |
| GET | `/api/properties/my` | Owner | Owner's property list |
| POST | `/api/properties` | Owner | Create property |
| PUT | `/api/properties/{id}` | Owner | Update property |
| DELETE | `/api/properties/{id}` | Owner | Soft-delete (`isActive = false`) |
| POST | `/api/properties/{id}/photos` | Owner | Upload photo (`multipart/form-data`, field: `file`) |

**Availability filter:**
```
GET /api/properties?location=Bogotá&checkIn=2025-08-01&checkOut=2025-08-05
```
`checkIn` and `checkOut` must be provided together. Only properties with no confirmed overlapping reservations are returned.

---

### Reservations — `/api/reservations`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | Guest | Create reservation |
| GET | `/api/reservations/my` | Any authenticated | Own reservations |
| GET | `/api/reservations/property/{id}` | Owner | Reservations for a property (includes guest name + email) |
| DELETE | `/api/reservations/{id}` | Any authenticated | Cancel reservation |

**Business rules enforced:**
- Owners receive **HTTP 403** — reservation creation is guest-only.
- Guest must have `KycStatus == Approved` — returns `403` otherwise.
- Check-in is normalised to **14:00 UTC**; check-out to **12:00 UTC**.
- Overlapping confirmed reservations are rejected with `400`.
- Both the owner and the guest receive an in-app notification on creation and cancellation.

**Owner reservation response includes full guest identity:**
```json
{
  "id": 1,
  "guestId": "...",
  "guestName": "John Smith",
  "guestEmail": "john@example.com",
  "checkIn": "2025-08-01T14:00:00Z",
  "checkOut": "2025-08-05T12:00:00Z",
  "totalPrice": 600000,
  "status": "Confirmed"
}
```

---

### KYC Verification — `/api/kyc`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/kyc/submit` | Any authenticated | Upload identity document |
| GET | `/api/kyc/status` | Any authenticated | Get verification status |

**Submit:** `multipart/form-data`, field name `document`. Accepted file types: JPEG, PNG, GIF, WEBP.

**Validation flow:**
1. Image is sent to OpenAI GPT-4o Vision, which extracts `firstName`, `lastName`, `documentNumber`, and `dateOfBirth`.
2. Extracted full name (`firstName + lastName`) is compared against the account's `FullName` using **Levenshtein distance with a word-sorted fallback** (handles reversed name order, e.g. "Morales Diego" matches "Diego Morales").
3. Similarity threshold: **70%**. Below that the document is rejected even if readable.
4. Status (`Approved` / `Rejected`) is stored on both `KycDocument` and `ApplicationUser.KycStatus`.

**Submit response:**
```json
{
  "status": "Approved",
  "extractedName": "Diego",
  "extractedSurname": "Morales",
  "extractedDocumentNumber": "123456789",
  "extractedBirthDate": "1990-05-15",
  "similarityScore": 0.95,
  "message": null
}
```

On rejection caused by name mismatch:
```json
{
  "status": "Rejected",
  "similarityScore": 0.18,
  "message": "Document name does not sufficiently match the account holder."
}
```

---

### Owner Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Owner | Revenue, occupancy, reservation counts |

```
GET /api/dashboard?from=2025-01-01&to=2025-12-31
```

Defaults to last 12 months when no range is provided. Returns portfolio totals and a per-property breakdown with occupancy rates.

---

### Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/excel` | Owner | Download reservations as `.xlsx` |

```
GET /api/reports/excel?propertyId=1&from=2025-01-01&to=2025-12-31
```

All parameters are optional. Without `propertyId`, all owner properties are included. Columns: ID, Property, Guest Name, Guest Email, Check-In, Check-Out, Total Price, Status.

---

### Wishlist — `/api/wishlist`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/wishlist` | Any authenticated | Saved properties |
| POST | `/api/wishlist/{propertyId}` | Any authenticated | Add property |
| DELETE | `/api/wishlist/{propertyId}` | Any authenticated | Remove property |

Adding an already-saved property is idempotent.

---

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any authenticated | List in-app notifications |
| PATCH | `/api/notifications/{id}/read` | Any authenticated | Mark as read |

Notifications are created automatically on reservation creation and cancellation (for both guest and owner).

---

## Creating a New Migration

```bash
dotnet ef migrations add <MigrationName> \
  --project performance_test.Infrastructure \
  --startup-project performance_test.WebApi
```

---

## Known Limitations

- **No payment integration.** Reservations are confirmed immediately with no payment step.
- **Flat in-app notifications only.** No email or push notification delivery.
- **No review or rating system.**
- **Soft-delete only.** Deactivated properties remain in the database.
- **Single photo ordering.** Photos are stored with an `Order` field but no UI for reordering.
- **KYC name comparison is approximate.** Levenshtein distance at the character level can produce imperfect results for names with unusual middle names or non-Latin characters.
- **OpenAI API cost.** Each KYC submission sends an image to GPT-4o Vision, which incurs API usage charges.
