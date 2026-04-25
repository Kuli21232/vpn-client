import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { SessionSnapshot, SubscriptionInfo, UserProfile } from '../types/app';
import { getSecureItem, removeSecureItem, setSecureItem } from './secureStorage';

const PROFILE_KEY = 'spacy.auth.profile';
const TOKEN_KEY = 'spacy.auth.token';
const AUTH_TIMEOUT_MS = 5 * 60 * 1000;
const AUTH_POLL_INTERVAL_MS = 2000;

const BACKEND_BASE_URL = (
  process.env.EXPO_PUBLIC_SPACY_BACKEND_URL ??
  'http://192.168.3.10:8080'
).replace(/\/$/, '');

export const SPACY_BOT_USERNAME = process.env.EXPO_PUBLIC_SPACY_BOT_USERNAME ?? 'SpacyVPN_bot';
export const SPACY_SUPPORT_URL = `https://t.me/${SPACY_BOT_USERNAME}`;

interface BotInitResponse {
  code: string;
  bot_url: string;
}

interface BotCheckResponse {
  status: string;
  token?: string;
  id?: number;
  first_name?: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
  subscription?: unknown;
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSubscription(raw: unknown): SubscriptionInfo {
  const source = (raw ?? {}) as Record<string, unknown>;

  return {
    daysLeft: getNumber(source.days_left ?? source.daysLeft) ?? 0,
    trafficLeftGb:
      getNumber(source.traffic_left_gb ?? source.trafficLeftGb ?? source.traffic_gb ?? source.trafficLeft),
    expiresAt: getString(source.expires_at ?? source.expiresAt),
    isActive: Boolean(source.is_active ?? source.isActive ?? source.active ?? false),
    subscriptionUrl: getString(source.subscription_url ?? source.subscriptionUrl ?? source.url),
  };
}

function normalizeProfile(raw: Record<string, unknown>) {
  const subscription = normalizeSubscription(raw.subscription);
  const username = getString(raw.username) ?? `user${raw.id ?? ''}`.trim();
  const displayName =
    [getString(raw.first_name), getString(raw.last_name)].filter(Boolean).join(' ') ||
    username ||
    'Spacy User';

  return {
    id: String(raw.id ?? ''),
    username,
    displayName,
    avatar: getString(raw.photo_url ?? raw.photoURL),
    ...subscription,
  } satisfies UserProfile;
}

function normalizeBotURL(rawURL: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawURL);
  } catch {
    throw new Error('Backend вернул некорректную ссылку Telegram.');
  }

  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'https' && scheme !== 'tg') {
    throw new Error('Backend вернул небезопасную ссылку Telegram.');
  }

  if (scheme === 'https') {
    const host = parsed.hostname.toLowerCase();
    if (host !== 't.me' && host !== 'telegram.me') {
      throw new Error('Ссылка авторизации ведет не в Telegram.');
    }
  }

  if (!parsed.searchParams.get('start')) {
    throw new Error('В ссылке авторизации отсутствует start-параметр.');
  }

  return parsed.toString();
}

function isLocalBackend(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url);
}

function describeNetworkFailure(input: string) {
  const backendHint = isLocalBackend(BACKEND_BASE_URL)
    ? ` Проверьте, что backend запущен и устройство действительно видит ${BACKEND_BASE_URL}. Если это Android-эмулятор и backend работает на этом же компьютере, обычно нужен адрес 10.0.2.2 вместо localhost.`
    : '';

  return `Не удалось подключиться к backend: ${input}.${backendHint}`;
}

async function fetchJSON<T>(input: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`${describeNetworkFailure(input)} Исходная ошибка: ${message}`);
  }

  const text = await response.text();
  let payload: T;
  try {
    payload = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(`Backend вернул некорректный JSON для ${input}.`);
  }

  if (!response.ok) {
    throw new Error(`Ошибка backend ${input}: HTTP ${response.status}`);
  }

  return payload;
}

export async function initTelegramBotAuth() {
  const response = await fetchJSON<BotInitResponse>(`${BACKEND_BASE_URL}/auth/bot/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.code || !response.bot_url) {
    throw new Error('Backend не вернул код авторизации Telegram.');
  }

  return {
    code: response.code,
    botURL: normalizeBotURL(response.bot_url),
  };
}

export async function openTelegramBot(botURL: string) {
  const supported = await Linking.canOpenURL(botURL);
  if (!supported) {
    throw new Error('Не удалось открыть Telegram на устройстве.');
  }

  await Linking.openURL(botURL);
}

export async function fetchUserProfile(token: string) {
  const payload = await fetchJSON<Record<string, unknown>>(`${BACKEND_BASE_URL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return normalizeProfile(payload);
}

export async function pollTelegramBotAuth(
  code: string,
  shouldCancel?: () => boolean
): Promise<SessionSnapshot> {
  const deadline = Date.now() + AUTH_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (shouldCancel?.()) {
      throw new Error('Авторизация отменена.');
    }

    const url = new URL(`${BACKEND_BASE_URL}/auth/bot/check`);
    url.searchParams.set('code', code);

    const result = await fetchJSON<BotCheckResponse>(url.toString());
    if (result.status === 'pending') {
      await delay(AUTH_POLL_INTERVAL_MS);
      continue;
    }

    if (result.status === 'expired') {
      throw new Error('Время ожидания авторизации истекло.');
    }

    if (result.status !== 'done' || !result.token) {
      throw new Error('Backend вернул неизвестный статус авторизации.');
    }

    let profile: UserProfile;
    if (result.id) {
      profile = normalizeProfile({
        id: result.id,
        first_name: result.first_name ?? result.username ?? 'Spacy User',
        last_name: result.last_name,
        username: result.username,
        photo_url: result.photo_url,
        subscription: result.subscription,
      });
    } else {
      profile = await fetchUserProfile(result.token);
    }

    const session = {
      token: result.token,
      profile,
    } satisfies SessionSnapshot;

    await saveSession(session);
    return session;
  }

  throw new Error('Время ожидания авторизации истекло.');
}

export async function loadSession() {
  const [token, profileRaw] = await Promise.all([
    getSecureItem(TOKEN_KEY),
    AsyncStorage.getItem(PROFILE_KEY),
  ]);

  if (!token || !profileRaw) {
    return null;
  }

  try {
    const profile = JSON.parse(profileRaw) as UserProfile;
    return {
      token,
      profile,
    } satisfies SessionSnapshot;
  } catch {
    return null;
  }
}

export async function saveSession(session: SessionSnapshot) {
  await Promise.all([
    setSecureItem(TOKEN_KEY, session.token),
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(session.profile)),
  ]);
}

export async function clearSession() {
  await Promise.all([
    removeSecureItem(TOKEN_KEY),
    AsyncStorage.removeItem(PROFILE_KEY),
  ]);
}
