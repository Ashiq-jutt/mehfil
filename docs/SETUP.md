# VoxNest — Local Setup

## Prerequisites
- Node ≥ 22.11, Java 17, Android SDK (API 36+), Xcode 26+
- **Ruby: use Homebrew Ruby, not macOS system Ruby 2.6**
  ```sh
  echo 'export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"' >> ~/.zshrc
  ```
- Firebase CLI (`npm i -g firebase-tools`), logged in

## 1. Firebase project (Blaze plan required)
Cloud Functions and Secret Manager need the **Blaze** plan.

1. Create/select a project → set its ID in `.firebaserc`.
2. Enable **Authentication → Sign-in method → Google**.
3. Create **Firestore** (production mode) and **Storage**.
4. Register apps:
   - Android package `com.voxnest.app` → add debug **SHA-1** and **SHA-256** (below) →
     download `google-services.json` → `android/app/google-services.json`
   - iOS bundle ID `com.voxnest.app` → download `GoogleService-Info.plist` →
     `ios/VoxNest/GoogleService-Info.plist` **and add it to the VoxNest target in Xcode**
5. Debug keystore fingerprints:
   ```sh
   keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA
   ```

## 2. Environment
```sh
cp .env.example .env   # fill in values; never put secrets here
```

## 3. Install
```sh
npm install
npm --prefix functions install
bundle install && npm run pods
```

## 4. Deploy backend config
```sh
firebase deploy --only firestore:rules,firestore:indexes,storage
```
(Functions are deployed once the first callable exists.)

## 5. Run
```sh
npm start
npm run android   # or: npm run ios
```

## Local emulators (optional)
```sh
npm run functions:build
npm run emulators         # UI at http://localhost:4000
```
Set `USE_FIREBASE_EMULATOR=true` in `.env` and rebuild the app.
Note: Google Sign-In against the Auth emulator still needs real OAuth client config.

## Changing the app name / bundle ID
`VoxNest` / `com.voxnest.app` are placeholders. To rename, change
`applicationId` + `namespace` in `android/app/build.gradle`, the Kotlin package
directory, and `PRODUCT_BUNDLE_IDENTIFIER` in Xcode — before registering apps in Firebase.
