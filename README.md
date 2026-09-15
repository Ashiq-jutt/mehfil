# Mehfil

Social voice-club app: live audio rooms with 10 seats, chat, hearts and gifts, club levels,
leaderboards and a cosmetics store.

| Part | Stack | Docs |
|---|---|---|
| `backend/` | ASP.NET Core 10 (MVC controllers), EF Core **Code First** + auto-migrate, SQL Server, SignalR, JWT | [backend/README.md](backend/README.md) |
| app (this folder) | React Native 0.87 (bare CLI), TypeScript, React Navigation, Zustand, TanStack Query | [docs/SETUP.md](docs/SETUP.md) |
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
# 1. backend (creates + migrates + seeds the database, Swagger on http://localhost:5080/swagger)
cd backend && dotnet run --project src/Mehfil.Api

# 2. app
cp .env.example .env
npm install
npm start
npm run android   # or: npm run ios (after: bundle install && npm run pods)
```

Sign in with **Developer login** on the login screen (debug builds, no Google setup needed).

Optional: push notifications and real store purchases need extra setup — see
[docs/SETUP.md](docs/SETUP.md).

## Checks

```sh
npm run check            # typecheck + lint + jest
cd backend && dotnet test
```

Both run on every push and pull request to `main` and `dev`
([.github/workflows/ci.yml](.github/workflows/ci.yml)). The workflow also fails if the EF Core
model has drifted from the migrations. Integration tests need SQL Server and skip themselves
unless `MEHFIL_TEST_CONNECTION_STRING` is set.

## Layout

```
src/
  api/          axios client (JWT refresh), endpoint modules, DTO types
  auth/         keychain session storage, Google Sign-In wrapper
  store/        zustand stores (auth, room, toasts, filters)
  realtime/     SignalR club-hub connection
  voice/        Agora engine wrapper and speaking detection
  push/         FCM registration and notification routing
  iap/          store purchase adapter (sandbox today)
  navigation/   root / main / tab navigators (typed params), notification deep links
  theme/        palette, semantic colours, gradients, typography, metrics
  components/   ui kit (buttons, panels, pill tabs, chips, dialogs, skeletons …), icons, badges, decor
  hooks/        TanStack Query hooks per domain
  features/     auth, clubs, room, economy, leaderboard, store, notifications, settings, profile
  assets/fonts  Fredoka (display) and Nunito (body), linked via react-native-asset
backend/        Mehfil.sln (Core · Infrastructure · Api · Tests)
video/          reference recordings the design follows
```
