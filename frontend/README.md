# Mehfil app (React Native · TypeScript)

The mobile client for Mehfil: club feeds, live voice rooms, hearts and gifts, leaderboards,
the Club Store, notifications and settings. Talks to `../backend` over REST and SignalR.

## Prerequisites

- Node ≥ 22.11 and npm
- JDK 17, Android Studio with SDK 36+ and an emulator
- Xcode 26+ and CocoaPods (macOS, for iOS)
- The API running — see [../backend/README.md](../backend/README.md)

Full walkthrough: [../docs/LOCAL-SETUP.md](../docs/LOCAL-SETUP.md).

## Run locally

```sh
cp .env.example .env
npm install
npm run fonts                    # links the bundled fonts
bundle install && npm run pods   # iOS only
npm start                        # Metro, keep running
npm run android                  # or: npm run ios
```

Sign in with **Developer login** (any email) — no Google setup needed in debug builds.

## Configuration

`.env` is read by `react-native-config` at **build** time, so rebuild after editing it.
Everything here ships inside the binary and is public — never put secrets in it.

| Key | Purpose |
|---|---|
| `API_BASE_URL` | API address. Empty uses `10.0.2.2:5080` on Android and `localhost:5080` on iOS. A physical device needs your LAN address |
| `DEV_LOGIN_ENABLED` | Shows the Developer login button (debug builds only) |
| `GOOGLE_WEB_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` | OAuth client ids for real Google Sign-In |
| `AGORA_APP_ID` | Agora App ID for voice. The App **Certificate** belongs to the backend only |
| `PUSH_ENABLED` | Registers for FCM push; needs the Firebase config files in the native projects |

## Scripts

```sh
npm run check         # typecheck + lint + jest
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm test              # jest
npm run cache-reset   # Metro with a clean cache
npm run kill-port     # free port 8081
npm run clean         # gradlew clean
npm run pods          # pod install --repo-update
npm run fonts         # link assets via react-native-asset
```

## Project layout

```
src/
  api/          axios client (JWT refresh), endpoint modules, DTO types
  auth/         keychain session storage, Google Sign-In wrapper
  store/        zustand stores (auth, room, toasts, filters)
  realtime/     SignalR club-hub connection
  voice/        Agora engine wrapper and speaking detection
  push/         FCM registration and notification routing
  iap/          store purchase adapter (sandbox today)
  navigation/   navigators with typed params, notification deep links
  theme/        palette, semantic colours, gradients, typography, metrics
  components/   ui kit (buttons, panels, tabs, dialogs, skeletons), icons, badges, decor
  hooks/        TanStack Query hooks per domain
  features/     auth, clubs, room, economy, leaderboard, store, notifications, settings, profile
  utils/        formatting and asset URL helpers
android/        Android project (applicationId com.jalopy.mehfil)
ios/            iOS project (bundle id com.jalopy.mehfil, target Mehfil)
```

## Architecture notes

- **Server state** lives in TanStack Query; **session and room state** live in Zustand. The
  room store owns the SignalR subscription so screens stay declarative.
- **Auth**: the axios client refreshes an expired access token once, in a single flight, and
  retries the original request. Tokens are stored in the Keychain / Keystore.
- **Errors**: the API returns RFC 7807 problems; `toApiError` maps them to a stable `code` and a
  message safe to show, so screens branch on the code rather than the text.
- **Design**: colours, spacing and typography come from `src/theme`. Components never use raw
  palette values. Icons, badges and backdrops are original SVGs drawn for the app.

## Tests

```sh
npm test
```

Jest with React Native Testing Library. Native modules are mocked in `jest.setup.js`, so no
device or emulator is needed. Pure logic (formatters, unlock rules, ranking helpers, the room
feed) is tested directly; screens are tested through their visible behaviour.
