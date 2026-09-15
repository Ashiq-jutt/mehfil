# Mehfil — Local Setup

Two parts: the **backend** (ASP.NET Core + SQL Server, see `backend/README.md`) and the
**app** (React Native 0.87, bare CLI, TypeScript).

## Prerequisites

- Node ≥ 22.11, Java 17, Android SDK (API 36+), Xcode 26+ (macOS)
- Ruby via Homebrew for CocoaPods (not macOS system Ruby):
  ```sh
  echo 'export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
  ```
- .NET 10 SDK + SQL Server (LocalDB / Express / Docker) for the backend

## 1. Backend

```sh
cd backend
dotnet run --project src/Mehfil.Api      # creates + migrates + seeds the DB, Swagger on :5080
```

`DevLogin:Enabled` is on in Development, so the app's **Developer login** button works
without any Google configuration.

## 2. App configuration

```sh
cp .env.example .env
```

| Key | Value |
|---|---|
| `API_BASE_URL` | Leave empty for emulators (`10.0.2.2:5080` Android / `localhost:5080` iOS). Physical device: `http://<your-LAN-IP>:5080` |
| `DEV_LOGIN_ENABLED` | `true` to show the Developer login button in debug builds |
| `GOOGLE_WEB_CLIENT_ID` | Web OAuth client id (see below) — optional until you test real Google sign-in |
| `GOOGLE_IOS_CLIENT_ID` | iOS OAuth client id — optional |

### Google Sign-In (when you are ready)

In Google Cloud Console → *APIs & Services → Credentials* create:

1. **Web application** client → copy its id into `GOOGLE_WEB_CLIENT_ID` **and** into the
   backend `Google:ClientIds`.
2. **Android** client → package `com.jalopy.mehfil`, debug SHA-1 from:
   ```sh
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```
3. **iOS** client → bundle id `com.jalopy.mehfil` → copy its id into `GOOGLE_IOS_CLIENT_ID`,
   and replace `com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID` in
   `ios/Mehfil/Info.plist` with the client's *reversed* id.

## 3. Install & run

```sh
npm install
npm run fonts                 # links src/assets/fonts (already committed for both platforms)
bundle install && npm run pods  # iOS only
npm start
npm run android   # or: npm run ios
```

Sign in with **Developer login** (any email) → you land on Clubs Home. Tap the gear icon
for **Settings** (push preferences, blocked users, sign out).

## 4. Checks

```sh
npm run check              # typecheck + lint + jest
cd backend && dotnet test  # unit tests; integration tests need SQL Server
```

`.github/workflows/ci.yml` runs both on every push and pull request to `main` and `dev`, and
fails if the EF Core model has drifted from the committed migrations. Backend integration
tests skip themselves unless `MEHFIL_TEST_CONNECTION_STRING` points at a SQL Server instance:

```sh
export MEHFIL_TEST_CONNECTION_STRING="Server=localhost,1433;Database=MehfilTests;User Id=sa;Password=...;TrustServerCertificate=true"
```

## 5. Push notifications (optional)

Notifications are always stored in the database and listed in the app. Delivering them as
push messages needs a Firebase project (Cloud Messaging only — Mehfil uses no other Firebase
service):

1. Backend: create a service account in the Firebase console, download its JSON and point
   `Firebase:CredentialsPath` at it (user-secrets or the `Firebase__CredentialsPath`
   environment variable). Leave it empty to run without push.
2. Android: put `google-services.json` in `android/app/`. The Google Services Gradle plugin is
   applied only when that file exists.
3. iOS: add `GoogleService-Info.plist` to the Xcode project (target *Mehfil*), enable the
   *Push Notifications* capability and upload your APNs key in the Firebase console.
   `FirebaseApp.configure()` runs only when the plist is bundled.
4. App: set `PUSH_ENABLED=true` in `.env`. Both config files are git-ignored.

Taps on a notification open the club room or leaderboard it refers to; foreground messages show
as toasts and refresh the inbox.

## Renaming / identity

App name **Mehfil**, Android `applicationId` / Kotlin package `com.jalopy.mehfil`,
iOS bundle id `com.jalopy.mehfil` (target `Mehfil`).
