import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Animated } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AuthScreen from './src/screens/AuthScreen';
import TabNavigator from './src/navigation/TabNavigator';

function AppContent() {
  const { colors, fadeAnim } = useTheme();
  const { isAuthenticated, setIsAuthenticated, setProfile } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const profileRaw = await AsyncStorage.getItem('user_profile');
        if (token && profileRaw) {
          setProfile(JSON.parse(profileRaw));
          setIsAuthenticated(true);
        }
      } catch {}
      setReady(true);
    };
    restore();
  }, []);

  const handleAuth = async () => {
    const profile = {
      username: 'unknwnyoshi',
      id: '6 656 416 431',
      daysLeft: 29,
      trafficLeft: 11.75,
      expiresAt: '27 Apr 2026',
      isActive: true,
    };
    await AsyncStorage.setItem('auth_token', 'mock_token');
    await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
    setProfile(profile);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_profile');
    setProfile(null);
    setIsAuthenticated(false);
  };

  if (!ready) {
    return <Animated.View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: colors.bg }}>
      <NavigationContainer>
        {isAuthenticated ? (
          <TabNavigator onLogout={handleLogout} />
        ) : (
          <AuthScreen onAuth={handleAuth} />
        )}
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

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
