# Mehfil — local setup, step by step

Get the whole app running on your machine: the API, the database and the mobile app. Follow the
steps in order. Everything works with **Developer login**, so no Google, Agora or Firebase
account is needed to click around.

```
mehfil/
  backend/    ASP.NET Core API + EF Core (SQL Server)
  frontend/   React Native app (Android + iOS)
  docs/       this guide, the plan
```

---

## Step 0 — Install the tools

| Tool | Version | Needed for |
|---|---|---|
| .NET SDK | 10.x | the API |
| SQL Server | LocalDB, Express, or Docker | the database |
| Node.js | 22.11 or newer | the app |
| JDK | 17 | Android builds |
| Android Studio | with SDK 36+ and an emulator | Android |
| Xcode | 26+, macOS only | iOS |
| CocoaPods | via Homebrew Ruby, macOS only | iOS |

Check what you have:

```sh
dotnet --version     # 10.x
node --version       # v22.11+
java -version        # 17.x
```

On macOS, use Homebrew's Ruby for CocoaPods rather than the system one:

```sh
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
```

---

## Step 1 — Get the code

```sh
git clone https://github.com/Ashiq-jutt/mehfil.git
cd mehfil
git checkout dev
```

---

## Step 2 — Start the database and API

The API creates the database, applies every migration and seeds the catalogs on first start.
You do not run any SQL by hand.

### Option A — LocalDB (Windows, simplest)

```sh
cd backend
dotnet run --project src/Mehfil.Api
```

### Option B — Docker (any OS, database and API together)

```sh
cd backend
docker compose up --build
```

### Option C — your own SQL Server

Point the API at it, then run as in option A:

```sh
cd backend
export ConnectionStrings__Default="Server=localhost,1433;Database=Mehfil;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=True"
dotnet run --project src/Mehfil.Api
```

On Windows PowerShell use `$env:ConnectionStrings__Default = "..."` instead of `export`.

**Check it worked.** Open Swagger and expect the page to load:

| Started with | Swagger |
|---|---|
| `dotnet run` | <http://localhost:5080/swagger> |
| `docker compose` | <http://localhost:8080/swagger> |

The startup log ends with the migration and seeding lines. If the API exits immediately, the
database connection is wrong — see Troubleshooting below.

---

## Step 3 — Configure the app

```sh
cd frontend
cp .env.example .env
```

`.env` ships inside the app binary, so it holds no secrets. The only key you may need to change
is the API address.

| Where the app runs | How you started the API | `API_BASE_URL` |
|---|---|---|
| Android emulator | `dotnet run` | leave empty |
| iOS simulator | `dotnet run` | leave empty |
| Android emulator | `docker compose` | `http://10.0.2.2:8080` |
| iOS simulator | `docker compose` | `http://localhost:8080` |
| Physical phone | either | `http://<your-computer-LAN-IP>:5080` |

Leave `DEV_LOGIN_ENABLED=true`. Leave the Google, Agora and push keys empty for now.

`.env` is read at **build** time. After changing it, stop Metro and rebuild the app.

Find your LAN address for a physical device:

```sh
ipconfig getifaddr en0     # macOS
hostname -I                # Linux
ipconfig                   # Windows, look for IPv4 Address
```

---

## Step 4 — Install the app's dependencies

```sh
cd frontend
npm install
npm run fonts                    # links the bundled fonts
bundle install && npm run pods   # iOS only
```

---

## Step 5 — Run the app

Leave the API running and open a second terminal.

```sh
cd frontend
npm start            # Metro bundler, keep it running
```

A third terminal builds and installs onto the device:

```sh
cd frontend
npm run android      # emulator or attached device
npm run ios          # macOS only
```

For a physical Android device over USB, forward Metro's port:

```sh
adb reverse tcp:8081 tcp:8081
```

---

## Step 6 — Sign in and look around

1. Tap **Developer login**, type any email, continue. You land on Clubs Home.
2. Tap the plus on the hearts pill to open the Shop, then **+1,000 hearts (dev)**.
3. Go to the **My** tab and create a club.
4. Open the club to enter the room. Take a seat, send a message.
5. Tap the gift button, pick a gift and a receiver, and send it. The jar fills.
6. Tap the trophy on the top bar for the leaderboard, and the store icon for the Club Store.
7. The gear icon opens Settings, which has push toggles, blocked users and sign out.

To see live features properly, run two emulators (or one emulator and one phone) and sign in
with a different email on each. Seats, chat, gifts and presence all update in both.

---

## Step 7 — Run the checks

```sh
cd frontend && npm run check      # typecheck, lint, tests
cd backend && dotnet test         # unit tests
```

The same checks run in GitHub Actions on every push to `main` and `dev`
(`.github/workflows/ci.yml`), which also fails if the EF Core model has drifted from the
committed migrations.

Backend integration tests need a real SQL Server and skip themselves without one:

```sh
export MEHFIL_TEST_CONNECTION_STRING="Server=localhost,1433;Database=MehfilTests;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=true"
cd backend && dotnet test
```

---

## Optional — voice, Google Sign-In, push

Skip these until you need them. Everything above works without them.

### Voice (Agora)

Rooms show seats and chat without Agora; only the audio is missing.

1. Create a project at <https://console.agora.io> and copy the **App ID** and **App Certificate**.
2. App: put the App ID in `frontend/.env` as `AGORA_APP_ID`.
3. Backend: set the certificate as a secret, never in a committed file.

```sh
cd backend
dotnet user-secrets set "Agora:AppId" "<app id>" --project src/Mehfil.Api
dotnet user-secrets set "Agora:AppCertificate" "<app certificate>" --project src/Mehfil.Api
```

The app never sees the certificate. It asks the API for a short-lived channel token.

### Google Sign-In

In Google Cloud Console, under APIs and Services then Credentials, create:

1. A **Web application** client. Put its id in `frontend/.env` as `GOOGLE_WEB_CLIENT_ID` and in
   the backend's `Google:ClientIds`.
2. An **Android** client for package `com.jalopy.mehfil` with your debug SHA-1:
   ```sh
   cd frontend
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
   ```
3. An **iOS** client for bundle id `com.jalopy.mehfil`. Put its id in `GOOGLE_IOS_CLIENT_ID` and
   replace `com.googleusercontent.apps.REPLACE_WITH_REVERSED_IOS_CLIENT_ID` in
   `frontend/ios/Mehfil/Info.plist` with the reversed client id.

### Push notifications (Firebase Cloud Messaging)

Notifications are always stored and listed in the app's inbox. This adds delivery to the device.

1. Backend: create a service account in the Firebase console, download its JSON, and point
   `Firebase:CredentialsPath` at it (user-secrets or the `Firebase__CredentialsPath`
   environment variable). Empty means notifications are stored but not pushed.
2. Android: put `google-services.json` in `frontend/android/app/`. The Google Services Gradle
   plugin is applied only when that file exists.
3. iOS: add `GoogleService-Info.plist` to the Xcode project (target *Mehfil*), enable the
   Push Notifications capability, and upload your APNs key in the Firebase console.
4. App: set `PUSH_ENABLED=true` in `frontend/.env` and rebuild.

Both Firebase config files are git-ignored. Tapping a notification opens the club room or
leaderboard it refers to.

---

## Troubleshooting

**The API exits with a login or network error.** The connection string is wrong or SQL Server
is not running. LocalDB exists only on Windows; on macOS and Linux use Docker or option C.

**The app shows "Network error" on every screen.** `API_BASE_URL` does not reach the API.
Emulators cannot use `localhost` to mean your computer: Android needs `10.0.2.2`. Confirm the
API answers from the same machine with `curl http://localhost:5080/swagger/index.html`, then
rebuild the app after editing `.env`.

**Changes to `.env` do nothing.** It is read at build time. Stop Metro and run
`npm run android` or `npm run ios` again.

**Metro serves a stale bundle.** `npm run cache-reset`.

**Port 8081 is busy.** `npm run kill-port`.

**Android build fails after pulling changes.** `npm run clean` then rebuild.

**iOS build fails after pulling changes.** `cd frontend/ios && pod install`.

**Sign-in says the account is suspended or banned.** A moderator action set that status. Use a
different email with Developer login.

**Two devices do not see each other.** Both must point at the same API and be in the same club
room. Check that both builds have the same `API_BASE_URL`.

---

## Identity

App name **Mehfil**. Android `applicationId` and Kotlin package `com.jalopy.mehfil`. iOS bundle
id `com.jalopy.mehfil`, target `Mehfil`.
