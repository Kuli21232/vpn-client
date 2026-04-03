import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Linking,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useApp, UserProfile } from '../context/AppContext';
import { useSettings } from '../context/SettingsContext';
import { verifyTelegramAuth } from '../services/api';

const BOT_USERNAME = 'SpacyVPN_bot';

interface Props {
  onAuth: () => void;
}

type AuthStep = 'idle' | 'waiting' | 'checking' | 'error';

export default function AuthScreen({ onAuth }: Props) {
  const { colors, isDark } = useTheme();
  const { setProfile, setIsAuthenticated } = useApp();
  const { language, fontScale } = useSettings();
  const [step, setStep] = useState<AuthStep>('idle');
  const [token, setToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (step === 'waiting' || step === 'checking') {
      const anim = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.2, duration: 300, useNativeDriver: true }),
            Animated.delay(600 - delay),
          ])
        );
      dotAnims.forEach((d, i) => anim(d, i * 150).start());

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnims.forEach((d) => { d.stopAnimation(); d.setValue(0); });
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [step]);

  const t = (ru: string, en: string) => (language === 'ru' ? ru : en);

  const generateToken = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleTelegramAuth = async () => {
    const newToken = generateToken();
    setToken(newToken);
    setStep('waiting');
    setErrorMsg('');

    try {
      const url = `https://t.me/${BOT_USERNAME}?start=${newToken}`;
      await Linking.openURL(url);
      pollForAuth(newToken);
    } catch {
      setStep('error');
      setErrorMsg(t('Не удалось открыть Telegram', 'Failed to open Telegram'));
    }
  };

  const pollForAuth = (tok: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(() => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setStep('error');
        setErrorMsg(t('Время ожидания истекло', 'Authentication timeout'));
        return;
      }

      checkAuth(tok, interval);
    }, 2000);
  };

  const checkAuth = async (tok: string, interval: ReturnType<typeof setInterval>) => {
    try {
      setStep('checking');
      const profile = await verifyTelegramAuth(tok);
      if (profile) {
        clearInterval(interval);
        setProfile(profile);
        setIsAuthenticated(true);
        onAuth();
      } else {
        setStep('waiting');
      }
    } catch {
      setStep('waiting');
    }
  };

  const handleRetry = () => {
    setStep('idle');
    setErrorMsg('');
    setToken('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.logoCircle,
            {
              backgroundColor: colors.glass04,
              borderColor: colors.glass20,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.logoText}>⚡</Text>
        </Animated.View>

        <Text style={[styles.appName, { color: colors.fg, fontSize: 32 * fontScale }]}>SPACY VPN</Text>
        <Text style={[styles.tagline, { color: colors.glass45, fontSize: 14 * fontScale }]}>
          {t('Вход через Telegram', 'Sign in with Telegram')}
        </Text>

        {step === 'idle' && (
          <TouchableOpacity
            style={[styles.tgBtn, { backgroundColor: colors.fg }]}
            onPress={handleTelegramAuth}
            activeOpacity={0.85}
          >
            <Text style={[styles.tgBtnIcon, { color: colors.bg }]}>✈</Text>
            <Text style={[styles.tgBtnText, { color: colors.bg, fontSize: 15 * fontScale }]}>
              {t('Войти через Telegram', 'Continue with Telegram')}
            </Text>
          </TouchableOpacity>
        )}

        {(step === 'waiting' || step === 'checking') && (
          <View style={styles.waitingBlock}>
            <View style={[styles.tokenBox, { backgroundColor: colors.glass08, borderColor: colors.glass20 }]}>
              <Text style={[styles.tokenLabel, { color: colors.glass45, fontSize: 11 * fontScale }]}>
                {t('КОД АВТОРИЗАЦИИ', 'AUTH CODE')}
              </Text>
              <Text style={[styles.tokenValue, { color: colors.fg, fontSize: 22 * fontScale }]}>
                {token}
              </Text>
            </View>

            <View style={styles.dotsRow}>
              {dotAnims.map((d, i) => (
                <Animated.View
                  key={i}
                  style={[styles.dot, { backgroundColor: colors.fg, opacity: d }]}
                />
              ))}
            </View>

            <Text style={[styles.waitText, { color: colors.glass60, fontSize: 13 * fontScale }]}>
              {step === 'checking'
                ? t('Проверка...', 'Verifying...')
                : t('Ожидание подтверждения в боте', 'Waiting for bot confirmation')}
            </Text>

            <TouchableOpacity onPress={handleRetry} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.glass45, fontSize: 13 * fontScale }]}>
                {t('Отмена', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'error' && (
          <View style={styles.errorBlock}>
            <Text style={[styles.errorMsg, { color: colors.error, fontSize: 14 * fontScale }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: colors.glass20 }]}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryText, { color: colors.fg, fontSize: 14 * fontScale }]}>
                {t('Попробовать снова', 'Try again')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.hint, { color: colors.glass30, fontSize: 12 * fontScale }]}>
          {t(
            `Откроется Telegram с ботом @${BOT_USERNAME}.\nОтправьте /start для входа.`,
            `Telegram will open with @${BOT_USERNAME}.\nSend /start to authenticate.`
          )}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 4,
  },
  tagline: {
    letterSpacing: 0.5,
    marginTop: -8,
  },
  tgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  tgBtnIcon: {
    fontSize: 18,
  },
  tgBtnText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  waitingBlock: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  tokenBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  tokenLabel: {
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tokenValue: {
    fontWeight: '700',
    letterSpacing: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  waitText: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cancelText: {
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  errorBlock: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  errorMsg: {
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryText: {
    fontWeight: '500',
  },
  hint: {
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
