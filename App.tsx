import React from 'react';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProviders } from './src/providers/AppProviders';

function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
