import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { SPACY_BOT_USERNAME } from '../services/telegramAuth';
import { mono } from '../theme/typography';

export default function AuthScreen() {
  const { colors, isDark } = useTheme();
  const { authState, cancelAuth, enterDemoMode, loginWithTelegram } = useApp();
  const { language, fontScale } = useSettings();

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);
  const isPending = authState.stage === 'opening' || authState.stage === 'polling';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <View style={styles.content}>
        <View style={[styles.logoCircle, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <MaterialIcons name="send" size={46} color={colors.fg} />
        </View>

        <View style={styles.heading}>
          <Text style={[styles.appName, { color: colors.fg, fontSize: 32 * fontScale }]}>SPACY VPN</Text>
          <Text style={[styles.tagline, { color: colors.glass45, fontSize: 14 * fontScale }]}>
            {t('Авторизация через Telegram', 'Telegram authentication')}
          </Text>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.glass04, borderColor: colors.glass12 }]}>
          <Text style={[styles.panelTitle, { color: colors.fg, fontSize: 13 * fontScale }]}>
            {t('СИСТЕМНЫЙ ВХОД', 'SYSTEM LOGIN')}
          </Text>
          <Text style={[styles.panelCopy, { color: colors.glass60, fontSize: 14 * fontScale }]}>
            {t(
              'Приложение откроет Telegram-бота, получит стартовый код и дождется подтверждения от backend.',
              'The app opens the Telegram bot, requests a start code, and waits for backend confirmation.'
            )}
          </Text>

          {authState.code ? (
            <View style={[styles.codeCard, { backgroundColor: colors.glass08, borderColor: colors.glass12 }]}>
              <Text style={[styles.codeLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                {t('КОД АВТОРИЗАЦИИ', 'AUTH CODE')}
              </Text>
              <Text style={[styles.codeValue, { color: colors.fg, fontSize: 22 * fontScale }]}>
                {authState.code}
              </Text>
            </View>
          ) : null}

          {authState.errorMessage ? (
            <Text style={[styles.errorText, { color: colors.error, fontSize: 13 * fontScale }]}>
              {authState.errorMessage}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.fg }]}
            onPress={loginWithTelegram}
            activeOpacity={0.86}
            disabled={isPending}
          >
            <MaterialIcons name="telegram" size={18} color={colors.bg} />
            <Text style={[styles.actionLabel, { color: colors.bg, fontSize: 14 * fontScale }]}>
              {isPending
                ? t('ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ', 'WAITING FOR CONFIRMATION')
                : t('ВОЙТИ ЧЕРЕЗ TELEGRAM', 'CONTINUE WITH TELEGRAM')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.glass04, borderColor: colors.glass12 },
            ]}
            onPress={() => {
              void enterDemoMode();
            }}
            activeOpacity={0.82}
          >
            <MaterialIcons name="visibility" size={18} color={colors.fg} />
            <Text style={[styles.secondaryLabel, { color: colors.fg, fontSize: 14 * fontScale }]}>
              {t('ОТКРЫТЬ DEMO РЕЖИМ', 'OPEN DEMO MODE')}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.demoHint, { color: colors.glass45, fontSize: 12 * fontScale }]}>
            {t(
              'Demo режим открывает локальный профиль и тестовые серверы без Telegram и backend.',
              'Demo mode opens a local profile and test servers without Telegram or backend.'
            )}
          </Text>

          {isPending ? (
            <TouchableOpacity onPress={cancelAuth} activeOpacity={0.7}>
              <Text style={[styles.cancelLabel, { color: colors.glass45, fontSize: 13 * fontScale }]}>
                {t('Отменить попытку входа', 'Cancel sign-in')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.hint, { color: colors.glass30, fontSize: 12 * fontScale }]}>
          {t(
            `После нажатия откроется @${SPACY_BOT_USERNAME}. Подтверждение пройдет автоматически, когда backend получит ответ от Telegram.`,
            `After tapping, @${SPACY_BOT_USERNAME} opens. The app completes sign-in as soon as the backend receives Telegram confirmation.`
          )}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  logoCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontFamily: mono.light,
    letterSpacing: 3.6,
  },
  tagline: {
    fontFamily: mono.regular,
    letterSpacing: 0.4,
  },
  panel: {
    width: '100%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    gap: 16,
  },
  panelTitle: {
    fontFamily: mono.bold,
    letterSpacing: 2.1,
  },
  panelCopy: {
    lineHeight: 21,
    fontFamily: mono.regular,
  },
  codeCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: mono.bold,
  },
  codeValue: {
    letterSpacing: 4,
    fontFamily: mono.extraBold,
  },
  errorText: {
    lineHeight: 20,
    fontFamily: mono.regular,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 10,
  },
  actionLabel: {
    fontFamily: mono.extraBold,
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 10,
  },
  secondaryLabel: {
    fontFamily: mono.bold,
    letterSpacing: 0.9,
  },
  demoHint: {
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: mono.regular,
  },
  cancelLabel: {
    textAlign: 'center',
    fontFamily: mono.regular,
    textDecorationLine: 'underline',
  },
  hint: {
    width: '100%',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: mono.regular,
  },
});
