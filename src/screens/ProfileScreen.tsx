import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { SPACY_SUPPORT_URL } from '../services/telegramAuth';
import { mono } from '../theme/typography';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { isRefreshingProfile, logout, profile, refreshProfile } = useApp();
  const { language, fontScale } = useSettings();

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const openTelegram = async () => {
    try {
      await Linking.openURL(SPACY_SUPPORT_URL);
    } catch {
      // Ignore linking failures on unsupported platforms.
    }
  };

  const ActionRow = ({
    icon,
    label,
    color = colors.fg,
    onPress,
  }: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.actionRow, { borderBottomColor: colors.glass08 }]}
      activeOpacity={0.72}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={[styles.actionText, { color, fontSize: 17 * fontScale }]}>
        {label}
      </Text>
      <MaterialIcons name="chevron-right" size={22} color={color === colors.fg ? colors.glass20 : color} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.fg, fontSize: 28 * fontScale }]}>
          {t('ПРОФИЛЬ', 'PROFILE')}
        </Text>

        {profile ? (
          <>
            <View style={styles.headerRow}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.glass08 }]}>
                  <MaterialIcons name="account-circle" size={78} color={colors.glass45} />
                </View>
              )}

              <View style={styles.headerInfo}>
                <Text style={[styles.displayName, { color: colors.fg, fontSize: 18 * fontScale }]}>
                  @{profile.username}
                </Text>
                <Text style={[styles.handle, { color: colors.glass45, fontSize: 13 * fontScale }]}>
                  {profile.displayName}
                </Text>
              </View>
            </View>

            <View style={styles.statusGrid}>
              <View style={[styles.infoCard, { backgroundColor: colors.glass04 }]}>
                <Text style={[styles.infoLabel, { color: colors.glass45, fontSize: 12 * fontScale }]}>
                  {t('СТАТУС', 'STATUS')}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: profile.isActive ? colors.active : colors.error,
                      fontSize: 18 * fontScale,
                    },
                  ]}
                >
                  {profile.isActive ? t('АКТИВЕН', 'ACTIVE') : t('НЕАКТИВЕН', 'INACTIVE')}
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.glass04 }]}>
                <Text style={[styles.infoLabel, { color: colors.glass45, fontSize: 12 * fontScale }]}>
                  {t('ИСТЕКАЕТ', 'EXPIRES')}
                </Text>
                <Text style={[styles.expiryValue, { color: colors.fg, fontSize: 18 * fontScale }]}>
                  {profile.daysLeft} {t('ДН.', 'DAYS')}
                </Text>
              </View>
            </View>

            <View style={styles.actionList}>
              <ActionRow icon="flash-on" label={t('КУПИТЬ', 'BUY')} onPress={openTelegram} />
              <ActionRow icon="qr-code-2" label={t('СКАН QR', 'SCAN QR')} />
              <ActionRow
                icon="refresh"
                label={isRefreshingProfile ? t('ОБНОВЛЯЕМ', 'SYNCING') : t('ОБНОВИТЬ', 'REFRESH')}
                onPress={() => {
                  void refreshProfile();
                }}
              />
              <ActionRow icon="help-outline" label={t('ПОДДЕРЖКА', 'SUPPORT')} onPress={openTelegram} />
              <ActionRow
                icon="power-settings-new"
                label={t('ВЫЙТИ', 'LOG OUT')}
                color={colors.error}
                onPress={() => {
                  void logout();
                }}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="account-circle" size={88} color={colors.glass20} />
            <Text style={[styles.emptyText, { color: colors.glass45, fontSize: 15 * fontScale }]}>
              {t('Профиль пока не загружен', 'Profile is not available')}
            </Text>
          </View>
        )}

        <View style={{ height: 130 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 18,
  },
  title: {
    fontFamily: mono.light,
    letterSpacing: 2.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 10,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  displayName: {
    fontFamily: mono.bold,
  },
  handle: {
    fontFamily: mono.regular,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  infoLabel: {
    fontFamily: mono.bold,
    letterSpacing: 1.6,
  },
  infoValue: {
    fontFamily: mono.extraBold,
  },
  expiryValue: {
    fontFamily: mono.bold,
  },
  actionList: {
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontFamily: mono.regular,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: mono.regular,
  },
});
