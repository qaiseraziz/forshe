// v1.2.9 hotfix — polyfills MUST load before anything else (especially before
// @supabase/supabase-js is imported) so crypto.getRandomValues + URL are
// available on the RN global.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
