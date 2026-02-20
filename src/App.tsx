import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';
import { Colors } from './constants/theme';

SplashScreen.preventAutoHideAsync();

export function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Any global asset loading can go here
    SplashScreen.hideAsync().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
