import { setGlobalOptions } from 'firebase-functions/v2';

import './admin.js';

// Applies to every function in this codebase.
// Keep region in sync with FIREBASE_FUNCTIONS_REGION in the app's .env.
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
});

// Callable/trigger exports are added feature by feature, e.g.:
// export { onUserCreated } from './users/onUserCreated.js';
