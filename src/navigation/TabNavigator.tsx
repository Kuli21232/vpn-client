import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', icon: 'globe-outline' as const, iconActive: 'globe' as const, labelRu: 'Главная', labelEn: 'Home' },
  { name: 'Profile', icon: 'person-outline' as const, iconActive: 'person' as const, labelRu: 'Профиль', labelEn: 'Profile' },
  { name: 'Settings', icon: 'settings-outline' as const, iconActive: 'settings' as const, labelRu: 'Настройки', labelEn: 'Settings' },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const { language } = useSettings();
  const anims = TAB_CONFIG.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: state.index === i ? 1 : 0,
        tension: 180,
        friction: 14,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={styles.barWrap}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? 'rgba(18,18,18,0.97)' : 'rgba(248,248,248,0.97)',
            borderColor: colors.glass12,
          },
        ]}
      >
        {TAB_CONFIG.map((tab, i) => {
          const focused = state.index === i;
          const anim = anims[i];

          const iconScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
          const dotOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
          const labelOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

          const label = language === 'ru' ? tab.labelRu : tab.labelEn;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }], alignItems: 'center', gap: 4 }}>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={focused ? tab.iconActive : tab.icon}
                    size={22}
                    color={focused ? colors.fg : colors.glass45}
                  />
                  <Animated.View
                    style={[styles.activeDot, { backgroundColor: colors.fg, opacity: dotOpacity }]}
                  />
                </View>
                <Animated.Text
                  style={[styles.tabLabel, { color: colors.fg, opacity: labelOpacity }]}
                >
                  {label}
                </Animated.Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface Props {
  onLogout: () => void;
}

export default function TabNavigator({ onLogout }: Props) {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 16 : 28,
    paddingTop: 8,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 0,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
});
