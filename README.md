# Mehfil

Social voice-club app: live audio rooms with 10 seats, chat, hearts and gifts, club levels,
leaderboards and a cosmetics store.

| Part | Stack | Docs |
|---|---|---|
| `backend/` | ASP.NET Core 10 (MVC controllers), EF Core **Code First** + auto-migrate, SQL Server, SignalR, JWT | [backend/README.md](backend/README.md) |
| app (this folder) | React Native 0.87 (bare CLI), TypeScript, React Navigation, Zustand, TanStack Query | [docs/SETUP.md](docs/SETUP.md) |
| plan | Screen inventory from `video/`, data model, API surface, phased delivery | [docs/PLAN.md](docs/PLAN.md) |

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

## Checks

```sh
npm run check            # typecheck + lint + jest
cd backend && dotnet test
```

## Layout

```
src/
  api/          axios client (JWT refresh), endpoint modules, DTO types
  auth/         keychain session storage, Google Sign-In wrapper
  store/        zustand auth store
  navigation/   root / main / tab navigators (typed params)
  theme/        palette, semantic colours, gradients, typography, metrics
  components/   ui kit (buttons, panels, pill tabs, chips, dialogs …), icons, decor
  features/     auth, clubs, account … (screens + *.styles.ts)
  assets/fonts  Fredoka (display) and Nunito (body), linked via react-native-asset
backend/        Mehfil.sln (Core · Infrastructure · Api · Tests)
video/          reference recordings the design follows
```
