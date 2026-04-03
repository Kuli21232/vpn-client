import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { refreshProfile } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  onLogout: () => void;
}

export default function ProfileScreen({ onLogout }: Props) {
  const { colors, isDark } = useTheme();
  const { profile, setProfile } = useApp();
  const { language, fontScale } = useSettings();
  const [refreshing, setRefreshing] = useState(false);

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const handleRefresh = async () => {
    if (!profile) return;
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const updated = await refreshProfile(profile.id, token);
        if (updated) {
          setProfile(updated);
          await AsyncStorage.setItem('user_profile', JSON.stringify(updated));
        }
      }
    } catch {}
    setRefreshing(false);
  };

  const daysColor =
    (profile?.daysLeft ?? 0) > 10
      ? colors.active
      : (profile?.daysLeft ?? 0) > 3
      ? colors.warning
      : colors.error;

  const trafficPercent = Math.min(((profile?.trafficLeft ?? 0) / 50) * 100, 100);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.fg, fontSize: 28 * fontScale, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            {t('ПРОФИЛЬ', 'PROFILE')}
          </Text>
        </View>

        {profile ? (
          <>
            <Text style={[styles.subtitle, { color: colors.glass45, fontSize: 13 * fontScale }]}>
              @{profile.username}
            </Text>

            <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
              <View style={styles.profileRow}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarFallback, { backgroundColor: colors.glass08, borderColor: colors.glass20 }]}>
                    <Ionicons name="person" size={28} color={colors.glass45} />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={[styles.username, { color: colors.fg, fontSize: 15 * fontScale, fontFamily: 'SpaceGrotesk_600SemiBold' }]}>
                    @{profile.username}
                  </Text>
                  <Text style={[styles.userId, { color: colors.glass45, fontSize: 12 * fontScale }]}>
                    ID: {profile.id}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
              <View style={styles.subHeader}>
                <Text style={[styles.sectionLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                  {t('ПОДПИСКА', 'SUBSCRIPTION')}
                </Text>
                <View style={[styles.activeBadge, {
                  backgroundColor: profile.isActive ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
                }]}>
                  <Text style={[styles.activeBadgeText, {
                    color: profile.isActive ? colors.active : colors.error,
                    fontSize: 11 * fontScale,
                  }]}>
                    {profile.isActive ? 'ACTIVE' : 'EXPIRED'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.glass08 }]} />

              <View style={styles.statsRow}>
                <View style={styles.statBlock}>
                  <Text style={[styles.statNum, { color: daysColor, fontSize: 34 * fontScale, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                    {profile.daysLeft}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                    {t('ДН. ОСТАЛОСЬ', 'DAYS LEFT')}
                  </Text>
                </View>

                <View style={[styles.vertDivider, { backgroundColor: colors.glass12 }]} />

                <View style={styles.statBlock}>
                  <Text style={[styles.statNum, { color: colors.fg, fontSize: 28 * fontScale, fontFamily: 'SpaceGrotesk_700Bold' }]}>
                    {profile.trafficLeft.toFixed(2)} GB
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                    {t('ТРАФИК', 'TRAFFIC')}
                  </Text>
                  <View style={[styles.trafficBar, { backgroundColor: colors.glass12 }]}>
                    <View style={[styles.trafficFill, { width: `${trafficPercent}%` as any, backgroundColor: colors.active }]} />
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.glass08 }]} />

              <View style={styles.expiryRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.glass45} />
                <Text style={[styles.expiryText, { color: colors.glass60, fontSize: 13 * fontScale }]}>
                  {t('до', 'until')} {profile.expiresAt}
                </Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.glass04, borderColor: colors.glass12, gap: 10 }]}>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.glass20 }]}
                activeOpacity={0.7}
              >
                <Ionicons name="qr-code-outline" size={16} color={colors.fg} />
                <Text style={[styles.btnText, { color: colors.fg, fontSize: 12 * fontScale }]}>
                  {t('СКАНИРУЙТЕ QR ДЛЯ ВХОДА НА ТВ', 'SCAN QR FOR TV LOGIN')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.glass20 }]}
                onPress={handleRefresh}
                activeOpacity={0.7}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={colors.fg} />
                ) : (
                  <Ionicons name="refresh-outline" size={16} color={colors.fg} />
                )}
                <Text style={[styles.btnText, { color: colors.fg, fontSize: 12 * fontScale }]}>
                  {t('ОБНОВИТЬ ПОДПИСКУ', 'REFRESH SUBSCRIPTION')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: 'rgba(255,59,48,0.07)', borderColor: 'rgba(255,59,48,0.22)' }]}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={16} color={colors.error} />
                <Text style={[styles.btnText, { color: colors.error, fontSize: 12 * fontScale }]}>
                  {t('ВЫЙТИ', 'LOGOUT')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noProfile}>
            <Ionicons name="person-circle-outline" size={64} color={colors.glass20} />
            <Text style={[styles.noProfileText, { color: colors.glass45, fontSize: 15 * fontScale }]}>
              {t('Не авторизован', 'Not authenticated')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 60, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontWeight: '700', letterSpacing: 1 },
  subtitle: { letterSpacing: 0.3, marginTop: -6 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  profileInfo: { gap: 4 },
  username: {},
  userId: {},
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { letterSpacing: 1.2, textTransform: 'uppercase' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeBadgeText: { fontWeight: '700', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { letterSpacing: 1.2, textTransform: 'uppercase' },
  trafficBar: { width: '80%', height: 3, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  trafficFill: { height: '100%', borderRadius: 2 },
  vertDivider: { width: 1, height: 54, marginHorizontal: 16 },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expiryText: {},
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1, paddingVertical: 14, gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1, paddingVertical: 14, gap: 8,
  },
  btnText: { fontWeight: '600', letterSpacing: 0.8 },
  noProfile: { alignItems: 'center', paddingTop: 60, gap: 12 },
  noProfileText: {},
});
