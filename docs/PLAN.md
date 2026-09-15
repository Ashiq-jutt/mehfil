# Mehfil — Redesign + C#/.NET Backend Plan

Status: **Approved 2026-09-15 with the §7 defaults** (SQL Server, .NET 10, Hearts, `com.jalopy.mehfil`).
Branch: `dev` (all work is developed and pushed here).

Progress: Phase 1 (backend skeleton) delivered in `backend/` — see `backend/README.md`.
Phase 2 (app foundation: Firebase removed, Mehfil identity, theme, navigation, auth flow) delivered — see `docs/SETUP.md`.

This plan replaces the Firebase-only backend described in `detailed-command.txt`
with a **C# / ASP.NET Core (MVC controllers) backend using EF Core Code First,
migrations and automatic database creation**, and redesigns the app UI to match
the two reference recordings in `video/`.

---

## 1. Audit — what exists today

| Area | Current state |
|---|---|
| App | React Native 0.87.1 (bare CLI, TypeScript, New Architecture on), app name `VoxNest`, package `com.voxnest.app` |
| Backend | Nothing real yet. Firebase scaffolding only: `functions/` (empty index), default-deny `firestore.rules` / `storage.rules`, emulator config |
| Firebase packages | `@react-native-firebase/{app,auth,firestore,functions,messaging,storage,app-check}` installed, initialised in `src/services/firebase/app.ts` |
| Screens | One dev screen (`FirebaseStatusScreen`) shown from `App.tsx` |
| Navigation / state | None installed |
| Theme | `src/styles/{colors,metrics,typography}.ts` — a dark teal + saffron palette that does **not** match the videos |
| Components | `AppText` only |
| Agora / Google Sign-In | Not installed (only `.env.example` placeholders) |
| Native | Android/iOS projects generated, `google-services.json` / `GoogleService-Info.plist` gitignored |

Conclusion: the codebase is a clean skeleton. Nothing worth preserving except
the RN project setup, `metrics.ts` scaling helpers and the `.env` plumbing.

---

## 2. Target design — what the videos show

Both recordings are of the **"Mehfil" (Clubs) feature inside Ludo Titan**:
`video/mehfil1.mp4` (14 s) shows the entry point (lobby → *Mehfil* tile → Clubs
Explore); `video/mehfil.mp4` (4 min) walks through every Clubs screen.

Visual language: deep violet / night-sky backgrounds, magenta panels, gold
titles and rings, green primary buttons, red circular close buttons, purple
card tiles, "hearts" as the currency, hanging-lantern header decoration.

Screen inventory (timestamps are in `video/mehfil.mp4` unless marked V2):

| # | Screen | Where | Key elements |
|---|---|---|---|
| S1 | **Clubs Home** | 1:30, 1:52, 2:12–2:30, 3:12–4:03; V2 0:06 | Top bar: avatar, hearts balance (+), Store, Leaderboard, close. Tabs **Explore / Hot / My** + search button. *Welcome Offer* banner carousel. Country chips (Global, Pakistan, Bangladesh, UK, India, Saudi Arabia, USA, More ≫ → *Select Country* modal with search). 2-column grid of **club cards**: cover, live-signal + member count badge, club level badge, name, category tag (Friends / Fun / Family / Game), country flag, follow-heart. *My* tab has **Followed / Recents** sub-tabs and a "MY CLUB" ribbon. Search → **Enter a Club** modal (paste Club ID → GO). *Top Clubs* podium banner. |
| S2 | **Club Room (live voice)** | 2:06–2:20, 2:24–3:00, 3:28–3:50 | Header: club DP, name, ID, follow-heart, share, exit, member count. **10 seats in 2 rows** (numbered, mic icon, lock icon on locked seats, Owner seat with frame + green *Owner* tag, level badge, avatar + name, speaking ring). *Announcement* box. Chat feed (system "X entered the room" pills, user bubbles with avatar/name). Right rail: trophy + club hearts count, gift jar (club level), *Offer* countdown, *Activity*, gift button. Bottom bar: speaker toggle, mic toggle, "Tap here to type…", gift. Exit → **EXIT?** confirm dialog. Tap seat user → mini profile. **Invite Friends** modal (tabs). Follow / unfollow toasts. |
| S3 | **Clubs Levels** (jar) | 2:40 | Modal over room: shield badge, "Resets in 15 hrs 37 mins", jar fill 435/500 hearts, "Collect jars to level up" progress 20 → 21 (61/150), Rewards ≫. |
| S4 | **Club Info** | 3:00–3:12 | Cover DP with level badge, name, country, ID (copy), follow + share. Tabs **Highlights / Info**. Highlights: Records (Weekly Top Club ×N, Highest Active Time), Top Gifter etc. Info: Owner card, Admins count (→ **ADMIN (7/7)** list with search), announcement text, language / category tags, **Rules** and **Report** buttons. Rules modal (INFO / RULES toggle) with 5 rules. |
| S5 | **Leaderboard** | 1:52–2:08, 2:42 | Title, INFO, tabs **Top Clubs / Top Gifters / Top Receivers**. *Last Week* podium (1/2/3 + Results). *This Week* countdown + WIN REWARD banner. Table RANK / CLUB / HEARTS with medal badges. Sticky bottom row = my own rank. Gifters: **Daily / Weekly** toggle, *Yesterday* podium, *Today* list. INFO → **Rewards** modal (per tab: Rank #1–#3 → Background / Frame / Chat Bubble). |
| S6 | **Shop (Hearts)** | 1:32–1:50, 2:36 | Balance, *Welcome Offer* card (350 hearts + gifts, countdown, price, 5X VALUE ribbon), grid of hearts packs (amount, image, royalty points, price, BEST ribbon). Purchase via store IAP sheet. *Royalty* promo card. |
| S7 | **Club Store** | 0:50–1:25 | Balance, red *CLUB STORE* banner, tabs **Frames / Chat Bubbles / Entry Style / Backgrounds / Cards / Clubs DP** (badge counts). Grid items: selected (green) / **Use** / locked with reason (*Leaderboard*, *Royal N*, *Prime N*, *Club Level N*). Tap → preview carousel (name, item, unlock rule e.g. "Win via Leaderboard – Top Gifters Rank #2"). Background preview shows the room with "Unlocks at Club Level 20". |
| S8 | **Profile** | 0:00–0:36, 1:28; V2 0:07–0:13 | Gift/mail icon with badge, close. Gold-ring avatar, name, badge row: flag, ID (copy), Gender, Birthday. Hearts count. **Achievements**: Current / Highest Royalty / Royal Streak; Celebrity of the Month, Top Gifter ×N, Top Receiver ×N. **Stats** panel. Gender → *Personal Info* modal (Male / Female / Undisclosed, "Gender can be updated only once"). Birthday → date + month pickers. Avatar → **Player card** (level, signature, totals, stats). |
| S9 | **Royalty** | 0:32–0:44 | Sheet: *Royal Levels* R6…R1, *Prime Levels* P3…P1, tooltip "Royal status is achieved by earning Royal points". |
| S10 | Auth / entry | V2 0:02 | In Ludo Titan the feature is a tile. In our standalone app: **Splash → Google Login → Clubs Home**. |

### Copyright note
We reproduce the **layout, flows, information architecture and colour mood**.
All artwork (frames, backgrounds, gift icons, lanterns, trophies, badges) will be
**original assets** (vector/SVG or generated placeholders). No Ludo Titan images,
logos or names ship in this app. Rules text will be rewritten for Mehfil.

---

## 3. Backend — ASP.NET Core + EF Core Code First (auto-migrate)

### 3.1 Stack (assumptions — see §7 to override)

| Choice | Default | Why |
|---|---|---|
| Runtime | **.NET 10 (LTS)** | current LTS; `.NET 8` is a one-line change if Jalopy is on VS 2022 |
| Web | **ASP.NET Core Web API on the MVC framework** (`[ApiController]` controllers, attribute routing, filters) — no Razor views | matches "C#/MVC.NET"; a Razor admin area can be added later |
| ORM | **EF Core, Code First**, migrations in source control, `Database.Migrate()` on startup (guarded by `Database:AutoMigrate=true`, default on for Dev/Staging) plus idempotent seeding | this is the "second" approach you asked for |
| Database | **SQL Server** (LocalDB / Express / Docker) — provider swap to PostgreSQL is one package + regenerating the migration | typical for a .NET shop; **please confirm** |
| Realtime | **SignalR** (`ClubHub`) — seats, chat, presence, gifts, announcements | replaces Firestore listeners |
| Voice | **Agora RTC** — token generated server-side (`AgoraTokenService`), App Certificate only in server config | unchanged from spec |
| Auth | Google Sign-In on device → API validates the Google ID token (`Google.Apis.Auth`) → issues **JWT access (15 min) + rotating refresh token (30 d)** | no Firebase Auth dependency |
| Push | **FCM via `FirebaseAdmin` SDK** (server) + `@react-native-firebase/messaging` (app) — the only Firebase pieces that remain | best cross-platform push |
| Files | `IFileStorage` → local disk (`wwwroot/uploads`) now, Azure Blob / S3 later | avatars, club covers |
| Validation / errors | FluentValidation, `ProblemDetails` middleware, no entities over the wire (DTO records) | |
| Logging / ops | Serilog, `/healthz`, Swagger (Dev), rate limiting, CORS | |
| Tests | xUnit; unit tests for services; integration tests with `WebApplicationFactory` + Testcontainers SQL Server | |

### 3.2 Solution layout

```
backend/
  Mehfil.sln
  src/
    Mehfil.Api/            Program.cs, Controllers/, Hubs/, Middleware/, Filters/, appsettings*.json
    Mehfil.Core/           Entities/, Enums/, DTOs/, Interfaces/, Services/ (business logic, no EF)
    Mehfil.Infrastructure/ Data/MehfilDbContext.cs, Configurations/ (Fluent API), Migrations/,
                           Seed/, Repositories (only where needed), Agora/, Push/, Storage/
  tests/
    Mehfil.Tests/
  docker-compose.yml       (SQL Server + API for local dev)
```

### 3.3 Data model (EF Core entities → tables)

```
Users            Id, GoogleSubject, Email, DisplayName, PublicId ("MOBI4875"-style), AvatarUrl,
                 CountryCode, Gender (enum, set-once flag), BirthDay/BirthMonth, Level, Xp,
                 HeartsBalance, RoyaltyPoints, RoyalLevel (R0–R6), PrimeLevel (P0–P3),
                 RoyalStreakMonths, IsOnline, LastSeenAt, Status, CreatedAt, UpdatedAt
RefreshTokens    Id, UserId, TokenHash, ExpiresAt, RevokedAt, ReplacedByTokenHash
DeviceTokens     Id, UserId, Platform, FcmToken, UpdatedAt
Countries        Code, Name, FlagEmoji, SortOrder            (seeded)
ClubCategories   Id, Name (Friends, Fun, Family, Game), SortOrder (seeded)
Clubs            Id, PublicId (8-digit), Name, CoverUrl, CountryCode, CategoryId, Language,
                 OwnerId, Announcement, Level, JarHearts, JarTarget, JarResetsAt, LevelProgress,
                 TotalHearts, MemberCount, IsActive, BackgroundItemId, CreatedAt
ClubMembers      ClubId, UserId, Role (Owner/Admin/Member), JoinedAt, LastActiveAt
ClubFollows      ClubId, UserId, CreatedAt                    (drives "My → Followed")
ClubVisits       ClubId, UserId, LastVisitedAt                (drives "My → Recents")
ClubSeats        ClubId, SeatIndex (1–10), UserId?, IsLocked, IsMuted, TakenAt
ClubBans         ClubId, UserId, ByUserId, Reason, CreatedAt
ClubMessages     Id, ClubId, SenderId, Type (Text/System/Gift), Text, CreatedAt
Gifts            Id, Name, IconUrl, HeartsPrice, IsActive, SortOrder (seeded: rose, bouquet, chocolates…)
GiftTransactions Id, ClubId, SenderId, ReceiverId?, GiftId, Qty, Hearts, CreatedAt
HeartsPackages   Id, Hearts, PriceMinor, Currency, RoyaltyPoints, StoreProductId, IsBest, IsWelcomeOffer (seeded)
Purchases        Id, UserId, PackageId, Platform, StoreTransactionId, Status, CreatedAt
WalletLedger     Id, UserId, Delta, BalanceAfter, Reason (Purchase/GiftSent/Reward/Admin), RefId, CreatedAt
StoreItems       Id, Kind (Frame/ChatBubble/EntryStyle/Background/Card/ClubDp), Name, AssetUrl,
                 UnlockRule (Default/Leaderboard/RoyalLevel/PrimeLevel/ClubLevel/Purchase), UnlockValue, SortOrder (seeded)
UserItems        UserId, ItemId, AcquiredAt, IsEquipped
ClubItems        ClubId, ItemId, AcquiredAt, IsEquipped        (backgrounds, club DP)
LeaderboardSnapshots  Id, Board (TopClubs/TopGifters/TopReceivers), Period (Daily/Weekly),
                 PeriodStart, Rank, SubjectId, Score, RewardItemId?, CreatedAt
Achievements     UserId, Kind (TopGifter/TopReceiver/CelebrityOfMonth/WeeklyTopClub…), Count, LastAt
Reports          Id, ReporterId, TargetType (User/Club/Message), TargetId, Reason, Status, CreatedAt
Blocks           BlockerId, BlockedId, CreatedAt
Notifications    Id, UserId, Type, Title, Body, Data(json), IsRead, CreatedAt
```

Wallet rule: the client never changes a balance. Every hearts movement is a
`WalletLedger` row written inside a transaction with the balance update
(row-versioned via `RowVersion` on `Users` to prevent double-spend).

Leaderboards: "this week / today" is computed from `GiftTransactions` (indexed
on `CreatedAt`) with a 60-second memory cache; "last week / yesterday" is
persisted lazily into `LeaderboardSnapshots` on first request after the period
ends (idempotent, under a lock) and the rewards (`StoreItems`) are granted in
the same step. No cron infrastructure needed for v1.

### 3.4 API surface (all `/api/v1/...`, JWT bearer unless noted)

| Controller | Endpoints |
|---|---|
| `AuthController` | `POST /auth/google` (anon) · `POST /auth/refresh` (anon) · `POST /auth/logout` |
| `UsersController` | `GET /users/me` · `PATCH /users/me` (name, signature) · `PUT /users/me/gender` (once) · `PUT /users/me/birthday` · `POST /users/me/avatar` (multipart) · `GET /users/{publicId}` (player card) · `PUT /users/me/device-token` |
| `ClubsController` | `GET /clubs?tab=explore|hot&country=PK&page=` · `GET /clubs/my?filter=followed|recents` · `GET /clubs/top` · `GET /clubs/by-public-id/{id}` · `POST /clubs` · `GET /clubs/{id}` (info + highlights) · `PATCH /clubs/{id}` (owner/admin) · `POST/DELETE /clubs/{id}/follow` · `GET /clubs/{id}/admins` · `PUT/DELETE /clubs/{id}/admins/{userId}` · `POST /clubs/{id}/bans` · `POST /clubs/{id}/report` |
| `ClubRoomController` | `POST /clubs/{id}/join` (returns room state + Agora token) · `POST /clubs/{id}/leave` · `GET /clubs/{id}/messages?before=` · `POST /clubs/{id}/messages` · `DELETE /clubs/{id}/messages/{msgId}` · `POST /clubs/{id}/seats/{n}/take|leave|lock|unlock|mute|kick` · `PUT /clubs/{id}/announcement` · `GET /clubs/{id}/level` |
| `GiftsController` | `GET /gifts` · `POST /clubs/{id}/gifts` (send; ledger + jar + leaderboard) |
| `WalletController` | `GET /wallet` (balance + ledger page) · `GET /wallet/packages` · `POST /wallet/purchases/verify` (store receipt) |
| `StoreController` | `GET /store/items?kind=` · `POST /store/items/{id}/equip` · `POST /clubs/{id}/store/items/{itemId}/equip` |
| `LeaderboardController` | `GET /leaderboard/{board}?period=weekly|daily&which=current|previous` · `GET /leaderboard/rewards` |
| `RoyaltyController` | `GET /royalty` (levels, my points, benefits) |
| `NotificationsController` | `GET /notifications?page=` · `POST /notifications/{id}/read` |
| `ModerationController` | `POST /reports` · `POST/DELETE /blocks/{userId}` · `GET /blocks` |
| `AgoraController` | `POST /clubs/{id}/agora-token` (refresh before expiry) |
| `ClubHub` (SignalR) | client→server: `JoinClub`, `LeaveClub`, `SendMessage`, `SetSpeaking` · server→client: `RoomState`, `SeatChanged`, `MemberJoined`, `MemberLeft`, `MessageReceived`, `GiftReceived`, `AnnouncementChanged`, `ClubLevelChanged`, `Kicked` |

Authorization is policy-based (`ClubOwner`, `ClubAdmin`, `SeatHolder`) and
re-checked inside the service queries (row-level), never only in the app.

### 3.5 Config & startup

- `appsettings.json` holds only non-secrets; `ConnectionStrings:Default`,
  `Jwt:Secret`, `Agora:AppCertificate`, `Google:ClientIds`, Firebase service
  account come from user-secrets (dev) / environment (prod).
- Startup: `Migrate()` → `Seed` (countries, categories, gifts, packages, store
  items, default frames) → run. Migrations are added with
  `dotnet ef migrations add <Name> -p src/Mehfil.Infrastructure -s src/Mehfil.Api`.
- `docker-compose.yml` brings up SQL Server 2022 + the API for local testing.

---

## 4. App redesign (React Native)

### 4.1 Theme tokens (sampled from the videos, tuned during build)

```
bg.sky        #0B1A5C → #2A0D54 (top gradient, night sky + lanterns)
bg.deep       #2A0D54 / #310F3B      screens
bg.panel      #481236 / #4C0F39      tab bars, lists
panel.magenta #6C144B / #771A52      tabs, headers
panel.rose    #8A3067 / #961E60      cards, modals
tile.violet   #5E23B9 → #935FE9      profile / store tiles (gradient)
tile.soft     #9A6DF5 / #A67FF6      stat panels
accent.gold   #F6AC19 / #DDA535      titles, rings, rank #1
accent.green  #5CC240 / #72A344      primary CTA (Confirm, GO, Rs price)
accent.red    #D51B54 / #E0313B      close buttons, banners
hearts.pink   #FF5C9E                currency
text.primary  #FFFFFF · text.muted #D9C7E8 · text.gold #FFD66B
radius 12/18/28 · gold 2px borders on modals · soft drop shadows
```

### 4.2 Libraries to add

`@react-navigation/native` + `native-stack` + `material-top-tabs` (+ `react-native-pager-view`, `react-native-screens`),
`zustand` (session/room state), `@tanstack/react-query` (server state, pagination),
`axios` ≥ 1.16 (JWT refresh interceptor), `@microsoft/signalr`, `react-native-agora`,
`@react-native-google-signin/google-signin`, `react-native-keychain` (tokens), `react-native-mmkv` (cache/settings),
`react-native-svg`, `react-native-linear-gradient`, `react-native-reanimated`, `react-native-gesture-handler`,
`@shopify/flash-list`, `react-native-image-picker`, `@react-native-clipboard/clipboard`, `react-native-share`,
`react-native-iap` (Shop, later phase), `dayjs`. Keep `react-native-config`, `react-native-safe-area-context`,
`@react-native-firebase/app` + `messaging` (push only).

Remove: `@react-native-firebase/{auth,firestore,functions,storage,app-check}`, the
`functions/` project, `firestore.rules`, `firestore.indexes.json`, `storage.rules`,
emulator scripts; trim `firebase.json` to messaging only.

### 4.3 Structure

```
src/
  api/           axios client, endpoints per feature, DTO types (mirrors backend)
  realtime/      signalr client, hub event typings
  voice/         agora service (join/leave/mute/speaking)
  store/         zustand slices (auth, room)
  navigation/    RootStack (Splash, Login, Main), MainStack (ClubsHome(top tabs), ClubRoom, ClubInfo,
                 Leaderboard, Shop, ClubStore, Profile, Royalty, Settings), typed params
  theme/         tokens, gradients, typography
  components/    ui/ (GoldTitle, PillTabs, CloseButton, GreenButton, Panel, Modal, Badge, AvatarRing,
                 HeartsPill, CountryChip, SectionRibbon, LockLabel, Podium, RankRow, Seat, ChatBubble, …)
  features/      clubs/, room/, leaderboard/, shop/, store/, profile/, royalty/, notifications/
  assets/        original svg/png (lanterns, trophy, jar, frames, gifts, badges)
  utils/, hooks/, config/, constants/
```

Styling rules from the spec stay: separate `*.styles.ts`, no inline styles,
`metrics.ts` scaling, FlashList for grids/lists, loading/empty/error states.

### 4.4 Screen → feature mapping

Every screen in §2 is built 1:1. Differences from Ludo Titan because we are a
standalone social app (assumptions, see §7):
- No game lobby; app opens on **Clubs Home** after login.
- Profile "Game Stats" (Game Level / Win Rate / League) becomes **Mehfil Stats**
  (Level / Hours in clubs / Clubs followed).
- "Facebook Friends" in *Invite Friends* becomes **Contacts / Share link**.
- Rules text and item names are original.

---

## 5. Implementation phases (each = one push to `dev`, then you test)

| Phase | Deliverable | You test |
|---|---|---|
| **0** | This plan (`docs/PLAN.md`) | Approve / change decisions in §7 |
| **1 Backend skeleton** | Solution, 3 projects, `MehfilDbContext`, full entity model + Fluent configs, **initial migration**, auto-migrate + seed on startup, Google→JWT auth, refresh tokens, Swagger, Serilog, ProblemDetails, docker-compose, README | `dotnet run` creates the DB and seeds it; log in via Swagger with a Google ID token |
| **2 App foundation** | Remove Firebase backend, new theme tokens, design-system components, navigation, API client with token refresh, Splash → Google Login → Clubs Home shell, app renamed to *Mehfil* | Login on Android/iOS, tokens persist, logout |
| **3 Profile + Royalty** | S8 + S9 + player card + gender/birthday modals; users endpoints, avatar upload | Edit profile, gender-once rule, birthday, view another user |
| **4 Clubs Home** | S1: Explore/Hot/My, country filter, search-by-ID, club cards, create/edit club, follow; clubs endpoints | Browse, filter, follow, create a club |
| **5 Club Info** | S4: Highlights/Info, admins, rules, report | Manage admins, announcement, report |
| **6 Club Room realtime** | S2 without voice: SignalR hub, seats, join/leave, chat with pagination, announcements, presence, exit dialog, kick/ban/mute | Two devices see each other take seats and chat live |
| **7 Voice (Agora)** | Token endpoint, join channel, mic/speaker, speaking rings, locked seats | Two devices talk; mute; lock seat |
| **8 Hearts economy** | S6 Shop (packages, welcome offer, IAP verify — sandbox), wallet ledger, gifts in room, S3 club jar/levels | Buy sandbox pack, send gift, jar fills, level up |
| **9 Leaderboards** | S5 boards, daily/weekly, podiums, my-rank row, rewards modal + reward granting | Rankings update after gifting; rollover grants items |
| **10 Club Store** | S7 items, unlock rules, equip frames/bubbles/entry/backgrounds/cards/DP, previews | Equip items; locked reasons correct |
| **11 Notifications + moderation + settings** | FCM push, notification list, blocks, reports admin endpoints, settings screen | Push on gift/follow; block user |
| **12 Polish** | Animations (gift, entry style), skeletons, error/empty states, tests (xUnit + Jest), CI workflow, docs | Full regression on both platforms |

Estimated size: backend ≈ 60 files, app ≈ 120 files. Phases 1–2 first; after
each phase I stop, summarise, and wait for your test result before continuing.

---

## 6. Sandbox notes (this environment)

- .NET SDK is being installed from the Microsoft apt feed (dot.net installer is
  blocked by the egress policy). NuGet and npm are reachable.
- **Docker is not available here**, so SQL Server cannot run in this session.
  PostgreSQL 16 is available locally. Migrations for SQL Server are generated
  from the model without a live DB; applying them is verified on your machine.
  If you choose PostgreSQL, everything (migrate + seed + integration tests) is
  verified here before each push.
- Android/iOS builds cannot run here; you build and test on your machine after
  each phase.

---

## 7. Decisions needed from you (defaults apply if you just say "go")

1. **Database**: SQL Server (default) or PostgreSQL?
2. **.NET version**: 10 LTS (default) or 8 to match Jalopy / VS 2022?
3. **Jalopy conventions**: if the Jalopy backend has a folder layout, base
   classes, response envelope or naming standard you want mirrored, share the
   repo or a sample controller/entity and I will match it exactly.
4. **App identity**: rename `VoxNest` → **Mehfil** with package
   `com.jalopy.mehfil` (default) — or a different id?
5. **Currency name**: "Hearts" as in the video (default) instead of "coins".
6. **Profile stats section**: "Mehfil Stats" mapping in §4.4 (default) or drop it.
7. **IAP**: implement store purchases with sandbox verification in phase 8
   (default) or leave purchases as "coming soon" with admin-granted hearts.
8. **Hosting target** for the API (IIS / Azure App Service / Linux Docker) —
   affects only deployment scripts, not code.
