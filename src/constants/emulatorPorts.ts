// Must match "emulators" in firebase.json
export const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199,
} as const;
