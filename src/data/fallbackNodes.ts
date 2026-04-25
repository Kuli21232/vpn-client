import { VpnNode } from '../types/app';
import { countryFlagFromCode } from '../utils/countryFlag';

function makeNode(
  id: string,
  name: string,
  countryCode: string,
  pingMs: number,
  isPinned = false
): VpnNode {
  return {
    id,
    name,
    address: `${id}.spacyvpn.net`,
    port: 443,
    uuid: `${id}-demo`,
    protocol: 'vless',
    rawLink: '',
    countryCode,
    flag: countryFlagFromCode(countryCode),
    sourceURL: 'demo://fallback',
    pingMs,
    isPinned,
  };
}

export const FALLBACK_NODES: VpnNode[] = [
  makeNode('pl-1', 'Польша #1', 'PL', 30, true),
  makeNode('pl-2', 'Польша #2', 'PL', 30),
  makeNode('pl-3', 'Польша #3', 'PL', 30),
  makeNode('pl-4', 'Польша #4', 'PL', 30),
  makeNode('de-1', 'Германия #1', 'DE', 34),
  makeNode('de-2', 'Германия #2', 'DE', 36),
];
