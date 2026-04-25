import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { FALLBACK_NODES } from '../data/fallbackNodes';
import { VpnNode } from '../types/app';
import { countryFlagFromCode } from '../utils/countryFlag';

const STORAGE_KEY = 'spacy.subscription.snapshot';
const DEVICE_ID_KEY = 'spacy.device.hwid';

export interface SubscriptionSnapshot {
  activeURL: string | null;
  urls: string[];
  names: Record<string, string>;
  nodes: VpnNode[];
}

export interface ImportedSubscription {
  subscriptionURL: string;
  subscriptionName: string | null;
  nodes: VpnNode[];
}

const EMPTY_SNAPSHOT: SubscriptionSnapshot = {
  activeURL: null,
  urls: [],
  names: {},
  nodes: [],
};

const COUNTRY_GUESSES: Array<[string, string]> = [
  ['poland', 'PL'],
  ['warsaw', 'PL'],
  ['krakow', 'PL'],
  ['germany', 'DE'],
  ['berlin', 'DE'],
  ['frankfurt', 'DE'],
  ['netherlands', 'NL'],
  ['amsterdam', 'NL'],
  ['finland', 'FI'],
  ['helsinki', 'FI'],
  ['russia', 'RU'],
  ['moscow', 'RU'],
  ['turkey', 'TR'],
  ['istanbul', 'TR'],
  ['japan', 'JP'],
  ['tokyo', 'JP'],
  ['usa', 'US'],
  ['united states', 'US'],
  ['new york', 'US'],
  ['uk', 'GB'],
  ['london', 'GB'],
];

function normalizeBase64(value: string) {
  const normalized = value.trim().replace(/-/g, '+').replace(/_/g, '/');
  const targetLength = Math.ceil(normalized.length / 4) * 4;
  return normalized.padEnd(targetLength, '=');
}

function decodeBase64Utf8(value: string) {
  return Buffer.from(normalizeBase64(value), 'base64').toString('utf8');
}

function createNodeId(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }

  return `node-${Math.abs(hash).toString(16)}`;
}

async function getDeviceId() {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    return stored;
  }

  const generated = `spacy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

function extractFlagFromName(name: string) {
  let countryCode: string | null = null;
  const cleaned: string[] = [];
  const chars = Array.from(name);

  for (let index = 0; index < chars.length; index += 1) {
    const current = chars[index];
    const next = chars[index + 1];
    const currentCode = current.codePointAt(0) ?? 0;
    const nextCode = next?.codePointAt(0) ?? 0;

    if (
      currentCode >= 0x1f1e6 &&
      currentCode <= 0x1f1ff &&
      nextCode >= 0x1f1e6 &&
      nextCode <= 0x1f1ff
    ) {
      if (!countryCode) {
        countryCode = String.fromCharCode(currentCode - 127397, nextCode - 127397).toUpperCase();
      }

      index += 1;
      continue;
    }

    cleaned.push(current);
  }

  const cleanName = cleaned.join('').trim();

  return {
    cleanName: cleanName || name,
    countryCode,
  };
}

function guessCountryCode(name: string) {
  const lower = name.toLowerCase();

  for (const [needle, code] of COUNTRY_GUESSES) {
    if (lower.includes(needle)) {
      return code;
    }
  }

  return 'XX';
}

function parseHostPort(raw: string) {
  const value = raw.trim();

  if (value.startsWith('[')) {
    const closingBracket = value.indexOf(']');
    if (closingBracket === -1) {
      return null;
    }

    const host = value.slice(1, closingBracket);
    const port = Number(value.slice(closingBracket + 2));
    return Number.isFinite(port) ? { host, port } : null;
  }

  const pieces = value.split(':');
  if (pieces.length < 2) {
    return null;
  }

  const port = Number(pieces.pop());
  const host = pieces.join(':');
  return Number.isFinite(port) ? { host, port } : null;
}

function finalizeNode(base: Omit<VpnNode, 'id' | 'flag' | 'pingMs'>): VpnNode {
  const extracted = extractFlagFromName(base.name);
  const countryCode = extracted.countryCode ?? base.countryCode ?? guessCountryCode(extracted.cleanName);

  return {
    ...base,
    id: createNodeId(`${base.protocol}:${base.address}:${base.port}:${extracted.cleanName}`),
    name: extracted.cleanName,
    countryCode,
    flag: countryFlagFromCode(countryCode),
    pingMs: null,
  };
}

function parseVless(link: string): VpnNode | null {
  const stripped = link.slice('vless://'.length);
  const [mainPart, rawName = 'Unknown'] = stripped.split('#', 2);
  const connectionPart = mainPart.split('?', 1)[0];
  const [uuid, hostPort] = connectionPart.split('@', 2);
  if (!uuid || !hostPort) {
    return null;
  }

  const parsed = parseHostPort(hostPort);
  if (!parsed) {
    return null;
  }

  return finalizeNode({
    name: decodeURIComponent(rawName),
    address: parsed.host,
    port: parsed.port,
    uuid,
    protocol: 'vless',
    rawLink: link,
    countryCode: guessCountryCode(rawName),
    sourceURL: '',
    isPinned: false,
  });
}

function parseTrojan(link: string): VpnNode | null {
  const stripped = link.slice('trojan://'.length);
  const [mainPart, rawName = 'Unknown'] = stripped.split('#', 2);
  const connectionPart = mainPart.split('?', 1)[0];
  const [uuid, hostPort] = connectionPart.split('@', 2);
  if (!uuid || !hostPort) {
    return null;
  }

  const parsed = parseHostPort(hostPort);
  if (!parsed) {
    return null;
  }

  return finalizeNode({
    name: decodeURIComponent(rawName),
    address: parsed.host,
    port: parsed.port,
    uuid,
    protocol: 'trojan',
    rawLink: link,
    countryCode: guessCountryCode(rawName),
    sourceURL: '',
    isPinned: false,
  });
}

function parseShadowsocks(link: string): VpnNode | null {
  const stripped = link.slice('ss://'.length);
  const [mainPart, rawName = 'Unknown'] = stripped.split('#', 2);
  const withoutParams = mainPart.split('?', 1)[0];

  if (withoutParams.includes('@')) {
    const [encodedSecret, hostPort] = withoutParams.split('@', 2);
    const parsed = parseHostPort(hostPort);
    if (!parsed) {
      return null;
    }

    let uuid = encodedSecret;
    try {
      uuid = decodeBase64Utf8(encodedSecret);
    } catch {
      uuid = decodeURIComponent(encodedSecret);
    }

    return finalizeNode({
      name: decodeURIComponent(rawName),
      address: parsed.host,
      port: parsed.port,
      uuid,
      protocol: 'ss',
      rawLink: link,
      countryCode: guessCountryCode(rawName),
      sourceURL: '',
      isPinned: false,
    });
  }

  try {
    const decoded = decodeBase64Utf8(withoutParams);
    const [uuid, hostPort] = decoded.split('@', 2);
    const parsed = parseHostPort(hostPort);
    if (!uuid || !parsed) {
      return null;
    }

    return finalizeNode({
      name: decodeURIComponent(rawName),
      address: parsed.host,
      port: parsed.port,
      uuid,
      protocol: 'ss',
      rawLink: link,
      countryCode: guessCountryCode(rawName),
      sourceURL: '',
      isPinned: false,
    });
  } catch {
    return null;
  }
}

function parseVmess(link: string): VpnNode | null {
  try {
    const payload = decodeBase64Utf8(link.slice('vmess://'.length));
    const json = JSON.parse(payload) as Record<string, string | number>;
    const portValue = typeof json.port === 'number' ? json.port : Number(json.port);

    if (!json.add || !json.id || !Number.isFinite(portValue)) {
      return null;
    }

    return finalizeNode({
      name: String(json.ps ?? 'Unknown'),
      address: String(json.add),
      port: portValue,
      uuid: String(json.id),
      protocol: 'vmess',
      rawLink: link,
      countryCode: guessCountryCode(String(json.ps ?? '')),
      sourceURL: '',
      isPinned: false,
    });
  } catch {
    return null;
  }
}

export function parseVpnLink(link: string): VpnNode | null {
  const value = link.trim();
  const lower = value.toLowerCase();

  if (lower.startsWith('vless://')) {
    return parseVless(value);
  }

  if (lower.startsWith('trojan://')) {
    return parseTrojan(value);
  }

  if (lower.startsWith('vmess://')) {
    return parseVmess(value);
  }

  if (lower.startsWith('ss://')) {
    return parseShadowsocks(value);
  }

  return null;
}

function decodeSubscriptionTitle(rawTitle: string | null) {
  if (!rawTitle) {
    return null;
  }

  const trimmed = rawTitle.trim();

  if (trimmed.toLowerCase().startsWith('base64:')) {
    try {
      return decodeBase64Utf8(trimmed.slice(7));
    } catch {
      return trimmed;
    }
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function parseLinksFromResponse(raw: string) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const decoded = decodeBase64Utf8(trimmed);
    if (decoded.includes('://')) {
      return decoded
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.includes('://'));
    }
  } catch {
    // Fall back to plain text parsing below.
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes('://'));
}

function buildHeaders(deviceId: string) {
  return {
    'User-Agent': 'v2rayNG/1.8.29',
    'X-HWID': deviceId,
    'X-Device-OS': Platform.OS,
    'X-Ver-OS': String(Platform.Version),
    'X-Device-Model': 'ReactNative',
  };
}

export async function loadSubscriptionSnapshot() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_SNAPSHOT;
    }

    const parsed = JSON.parse(raw) as SubscriptionSnapshot;
    return {
      activeURL: parsed.activeURL ?? null,
      urls: parsed.urls ?? [],
      names: parsed.names ?? {},
      nodes: parsed.nodes ?? [],
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export async function saveSubscriptionSnapshot(snapshot: SubscriptionSnapshot) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export async function clearSubscriptionSnapshot() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function mergeImportedSubscription(
  snapshot: SubscriptionSnapshot,
  imported: ImportedSubscription
): SubscriptionSnapshot {
  const nextNodes = [
    ...snapshot.nodes.filter((node) => node.sourceURL !== imported.subscriptionURL),
    ...imported.nodes,
  ];

  return {
    activeURL: imported.subscriptionURL,
    urls: snapshot.urls.includes(imported.subscriptionURL)
      ? snapshot.urls
      : [...snapshot.urls, imported.subscriptionURL],
    names: imported.subscriptionName
      ? {
          ...snapshot.names,
          [imported.subscriptionURL]: imported.subscriptionName,
        }
      : snapshot.names,
    nodes: sortNodes(nextNodes),
  };
}

export async function importRemnawaveSubscription(subscriptionURL: string): Promise<ImportedSubscription> {
  const trimmedURL = subscriptionURL.trim();
  if (!trimmedURL) {
    throw new Error('Пустой URL подписки.');
  }

  const deviceId = await getDeviceId();
  const response = await fetch(trimmedURL, {
    method: 'GET',
    headers: buildHeaders(deviceId),
  });

  const body = await response.text();
  if (!response.ok) {
    if (response.status === 403 || body.toLowerCase().includes('limit')) {
      throw new Error('Сервер отклонил устройство: превышен лимит привязок.');
    }

    throw new Error(`Ошибка загрузки подписки: HTTP ${response.status}`);
  }

  const links = parseLinksFromResponse(body);
  const nodes: VpnNode[] = [];

  for (const link of links) {
    const node = parseVpnLink(link);
    if (!node) {
      continue;
    }

    nodes.push({
      ...node,
      sourceURL: trimmedURL,
    });
  }

  return {
    subscriptionURL: trimmedURL,
    subscriptionName: decodeSubscriptionTitle(response.headers.get('profile-title')),
    nodes: sortNodes(nodes),
  };
}

export function estimatePing(node: VpnNode, salt = 0, protocol: 'tcp' | 'udp' = 'tcp') {
  const basis = `${node.id}:${node.address}:${salt}`;
  let hash = 0;
  for (let index = 0; index < basis.length; index += 1) {
    hash = (hash * 33 + basis.charCodeAt(index)) | 0;
  }

  const absolute = Math.abs(hash);
  const regionFloor =
    node.countryCode === 'PL'
      ? 28
      : node.countryCode === 'DE'
      ? 34
      : node.countryCode === 'NL'
      ? 39
      : node.countryCode === 'FI'
      ? 43
      : 48;

  const protocolOffset = protocol === 'udp' ? 4 : 0;
  return regionFloor + protocolOffset + (absolute % 16);
}

export function sortNodes(nodes: VpnNode[]) {
  return [...nodes].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    if (left.pingMs !== null && right.pingMs !== null && left.pingMs !== right.pingMs) {
      return left.pingMs - right.pingMs;
    }

    return left.name.localeCompare(right.name, 'ru');
  });
}

export function nodesOrFallback(nodes: VpnNode[]) {
  return nodes.length ? sortNodes(nodes) : FALLBACK_NODES;
}
