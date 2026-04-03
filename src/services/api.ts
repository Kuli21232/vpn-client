import { UserProfile } from '../context/AppContext';

const API_BASE = 'https://api.spacyvpn.net/v1';

interface AuthVerifyResponse {
  ok: boolean;
  user?: {
    telegram_id: string;
    username: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
  subscription?: {
    days_left: number;
    traffic_left_gb: number;
    expires_at: string;
    is_active: boolean;
  };
  token?: string;
}

export async function verifyTelegramAuth(token: string): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/auth/verify?token=${token}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) return null;

  const data: AuthVerifyResponse = await res.json();
  if (!data.ok || !data.user || !data.subscription) return null;

  const username =
    data.user.username ||
    [data.user.first_name, data.user.last_name].filter(Boolean).join(' ');

  return {
    username,
    id: data.user.telegram_id,
    avatar: data.user.photo_url,
    daysLeft: data.subscription.days_left,
    trafficLeft: data.subscription.traffic_left_gb,
    expiresAt: data.subscription.expires_at,
    isActive: data.subscription.is_active,
  };
}

export async function refreshProfile(userId: string, sessionToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'X-User-Id': userId,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      username: data.username,
      id: data.telegram_id,
      avatar: data.photo_url,
      daysLeft: data.days_left,
      trafficLeft: data.traffic_gb,
      expiresAt: data.expires_at,
      isActive: data.is_active,
    };
  } catch {
    return null;
  }
}
