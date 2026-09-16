# Mehfil

Social voice-club app: live audio rooms with 10 seats, chat, hearts and gifts, club levels,
leaderboards and a cosmetics store.

| Part | Stack | Docs |
|---|---|---|
| `backend/` | ASP.NET Core 10 (MVC controllers), EF Core **Code First** + auto-migrate, SQL Server, SignalR, JWT | [backend/README.md](backend/README.md) |
| `frontend/` | React Native 0.87 (bare CLI), TypeScript, React Navigation, Zustand, TanStack Query | [frontend/README.md](frontend/README.md) |
| setup | Step-by-step guide to running both locally | [docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md) |
| plan | Screen inventory from `video/`, data model, API surface, phased delivery | [docs/PLAN.md](docs/PLAN.md) |

## Features

| Area | What it does |
|---|---|
| Accounts | Google Sign-In → JWT access + rotating refresh tokens, profile with gender-once and birthday, avatar upload, player cards, Royal/Prime tiers |
| Clubs | Explore / Hot / My feeds, country filter, enter-by-ID, create and edit a club, follow, admins (max 7), rules, reporting |
| Rooms | SignalR presence, 10 seats with an owner seat, chat with history, announcements, lock / mute / kick / ban, Agora voice with server-issued tokens |
| Economy | Hearts wallet with an append-only ledger, Shop with a welcome offer and store-receipt verification, gifting with atomic debits, club jar and levels |
| Leaderboards | Top Clubs weekly, Top Gifters / Top Receivers daily and weekly, podiums, frozen periods that grant rewards |
| Club Store | Frames, chat bubbles, entry styles, backgrounds, cards and club DPs with unlock rules, equipping and previews |
| Social | Notification inbox with FCM push, blocks, a moderator report queue, settings and account deletion |

## Quick start

```sh
# 1. backend — creates, migrates and seeds the database; Swagger on http://localhost:5080/swagger
cd backend && dotnet run --project src/Mehfil.Api

# 2. app — in a second terminal
cd frontend
cp .env.example .env
npm install
npm start
npm run android   # or: npm run ios (after: bundle install && npm run pods)
```

Sign in with **Developer login** on the login screen (debug builds, no Google setup needed).

The full walkthrough, including Docker, physical devices and troubleshooting, is in
[docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md). Voice, Google Sign-In and push notifications are
optional and documented there too.

## Checks

```sh
cd frontend && npm run check   # typecheck + lint + jest
cd backend && dotnet test
```

Both run on every push and pull request to `main`
([.github/workflows/ci.yml](.github/workflows/ci.yml)). The workflow also fails if the EF Core
model has drifted from the migrations. Integration tests need SQL Server and skip themselves
unless `MEHFIL_TEST_CONNECTION_STRING` is set.

## Layout

```
backend/     Mehfil.sln — Core · Infrastructure · Api · Tests   (see backend/README.md)
frontend/    React Native app — src/, android/, ios/            (see frontend/README.md)
docs/        LOCAL-SETUP.md (how to run it) · PLAN.md (design and delivery plan)
video/       reference recordings the design follows
.github/     CI workflow for both halves
```
