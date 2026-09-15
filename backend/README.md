# Mehfil API (ASP.NET Core · EF Core Code First · SQL Server)

Backend for the Mehfil social voice-club app. MVC controllers, EF Core **Code First** with
migrations in source control, and **automatic database creation/upgrade + seeding on startup**.

## Prerequisites

- .NET 10 SDK (`dotnet --version` → 10.x)
- SQL Server: LocalDB (ships with Visual Studio), SQL Express, or Docker
- `dotnet tool install -g dotnet-ef` (only needed to add new migrations)

## Run locally (LocalDB)

```sh
cd backend
dotnet run --project src/Mehfil.Api
```

On first start the API creates the `Mehfil` database, applies every migration and seeds the
catalogs (countries, categories, gifts, hearts packages, store items). Then open
<http://localhost:5080/swagger>.

Default connection string (override in `appsettings.Development.json`, user-secrets or the
`ConnectionStrings__Default` environment variable):

```
Server=(localdb)\MSSQLLocalDB;Database=Mehfil;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=True
```

## Run with Docker (SQL Server + API)

```sh
cd backend
docker compose up --build      # Swagger at http://localhost:8080/swagger
```

## Sign in from Swagger without the app (Development only)

`DevLogin:Enabled` is `true` in `appsettings.Development.json`, which exposes
`POST /api/v1/auth/dev`:

```json
{ "email": "you@example.com", "displayName": "Mobile Developer" }
```

Copy `accessToken` from the response, click **Authorize**, paste it, then call
`GET /api/v1/users/me`. Refresh with `POST /api/v1/auth/refresh { "refreshToken": "..." }`.

Real sign-in is `POST /api/v1/auth/google { "idToken": "<Google ID token from the device>" }`.
Set the accepted OAuth client IDs in `Google:ClientIds` (the Web client ID the app uses, plus
the iOS client ID).

## Configuration & secrets

| Key | Purpose |
|---|---|
| `ConnectionStrings:Default` | SQL Server connection string |
| `Database:AutoMigrate` | Apply migrations on startup (default `true`) |
| `Database:SeedData` | Upsert catalog seed data on startup (default `true`) |
| `Jwt:Secret` | ≥ 32 chars. **Required**; empty in `appsettings.json` on purpose |
| `Jwt:AccessTokenMinutes` / `Jwt:RefreshTokenDays` | Token lifetimes (15 min / 30 days) |
| `Google:ClientIds` | Accepted audiences for Google ID tokens |
| `DevLogin:Enabled` | Dev-only email login endpoint (ignored outside Development) |
| `Agora:AppId` / `Agora:AppCertificate` | Agora project credentials for voice tokens. The certificate is **server-side only**; set it with user-secrets or `Agora__AppCertificate` |
| `Agora:TokenMinutes` | RTC token lifetime (default 60) |

Never commit real secrets. Locally use user-secrets:

```sh
dotnet user-secrets set "Jwt:Secret" "<random 48+ chars>" --project src/Mehfil.Api
```

In production set `Jwt__Secret`, `ConnectionStrings__Default`, `Google__ClientIds__0` … as
environment variables (or Key Vault / IIS configuration).

## Migrations (Code First)

Add a migration after changing entities or configurations:

```sh
cd backend
dotnet ef migrations add <Name> -p src/Mehfil.Infrastructure -s src/Mehfil.Api -o Data/Migrations
```

Migrations apply automatically on the next start. To apply manually or produce a script for a DBA:

```sh
dotnet ef database update -p src/Mehfil.Infrastructure -s src/Mehfil.Api
dotnet ef migrations script -p src/Mehfil.Infrastructure -s src/Mehfil.Api -o migrate.sql --idempotent
```

## Project layout

```
src/Mehfil.Core            entities, enums, DTOs, service interfaces, options (no EF, no web)
src/Mehfil.Infrastructure  MehfilDbContext, Fluent configurations, Migrations, seeding, auth services
src/Mehfil.Api             Program.cs, controllers, filters, ProblemDetails handler, Swagger
tests/Mehfil.Tests         xUnit unit tests + SQL Server integration tests
```

## Tests

```sh
cd backend
dotnet test
```

Unit tests always run. Integration tests need SQL Server: they use
`MEHFIL_TEST_CONNECTION_STRING` if set (any SQL Server; a throwaway database is created and
dropped), otherwise a Testcontainers SQL Server if Docker is running, otherwise they are skipped.

## Errors

All errors are RFC 7807 `application/problem+json`. `title` is a stable machine code
(e.g. `auth.invalid_refresh_token`), `detail` is human readable, `traceId` correlates with logs.
