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
for the account card and **Sign out**.

## 4. Checks

```sh
npm run check     # typecheck + lint + jest
```

## Renaming / identity

App name **Mehfil**, Android `applicationId` / Kotlin package `com.jalopy.mehfil`,
iOS bundle id `com.jalopy.mehfil` (target `Mehfil`).
