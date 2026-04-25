import React from 'react';
import { Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  JetBrainsMono_100Thin,
  JetBrainsMono_300Light,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/jetbrains-mono';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AuthScreen from './src/screens/AuthScreen';
import TabNavigator from './src/navigation/TabNavigator';

function AppContent() {
  const { colors, fadeAnim } = useTheme();
  const { isAuthenticated, isReady } = useApp();

  if (!isReady) {
    return <Animated.View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: colors.bg }}>
      <NavigationContainer>
        {isAuthenticated ? <TabNavigator /> : <AuthScreen />}
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_100Thin,
    JetBrainsMono_300Light,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
