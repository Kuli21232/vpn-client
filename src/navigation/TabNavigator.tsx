import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { mono } from '../theme/typography';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Home', icon: 'language' as const, labelRu: 'Главная', labelEn: 'Home' },
  { name: 'Profile', icon: 'account-circle' as const, labelRu: 'Профиль', labelEn: 'Profile' },
  { name: 'Settings', icon: 'settings' as const, labelRu: 'Настройки', labelEn: 'Settings' },
];

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const { language } = useSettings();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.barWrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 24) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: isDark ? 'rgba(22,22,24,0.98)' : 'rgba(245,245,245,0.98)',
            borderColor: colors.glass08,
          },
        ]}
      >
        {TAB_CONFIG.map((tab, index) => {
          const focused = state.index === index;
          const label = language === 'ru' ? tab.labelRu : tab.labelEn;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.itemPill,
                  {
                    backgroundColor: focused ? colors.glass12 : 'transparent',
                  },
                ]}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={25}
                  color={focused ? colors.fg : colors.glass45}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused ? colors.fg : colors.glass60,
                    },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
    paddingHorizontal: 18,
    paddingTop: 6,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,
  },
  itemPill: {
    alignItems: 'center',
    gap: 3,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 88,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.4,
    fontFamily: mono.bold,
  },
});
