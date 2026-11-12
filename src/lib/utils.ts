import type { Room } from './supabase';
import type { Language } from './translations';

export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export const ITEM_PRESETS: { name: Record<Language, string>; emoji: string }[] = [
  { name: { pt: 'Elefante', en: 'Elephant' }, emoji: '🐘' },
  { name: { pt: 'Maçã', en: 'Apple' }, emoji: '🍎' },
  { name: { pt: 'Chave', en: 'Key' }, emoji: '🔑' },
  { name: { pt: 'Melancia', en: 'Watermelon' }, emoji: '🍉' },
  { name: { pt: 'Bola de Futebol', en: 'Soccer Ball' }, emoji: '⚽' },
  { name: { pt: 'Carrinho', en: 'Toy Car' }, emoji: '🚗' },
  { name: { pt: 'Celular', en: 'Phone' }, emoji: '📱' },
  { name: { pt: 'Garrafa', en: 'Bottle' }, emoji: '🍾' },
  { name: { pt: 'Patinho', en: 'Rubber Duck' }, emoji: '🦆' },
  { name: { pt: 'Ovo Cru', en: 'Raw Egg' }, emoji: '🥚' },
  { name: { pt: 'Pedra', en: 'Rock' }, emoji: '🪨' },
  { name: { pt: 'Barco', en: 'Boat' }, emoji: '⛵' },
  { name: { pt: 'Tijolo', en: 'Brick' }, emoji: '🧱' },
  { name: { pt: 'Balão', en: 'Balloon' }, emoji: '🎈' },
  { name: { pt: 'Pena', en: 'Feather' }, emoji: '🪶' },
];

export function calculatePoints(room: Room, reactionMs: number): number {
  const totalTimeMs = room.timer_seconds * 1000;
  const timeRemaining = Math.max(0, totalTimeMs - reactionMs);
  const ratio = timeRemaining / totalTimeMs;
  return Math.round(500 + 500 * ratio);
}

export function getRelativeTime(isoString: string | null): number {
  if (!isoString) return 0;
  return new Date(isoString).getTime();
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isSmallScreen = window.innerWidth < 768;
  return isMobileUA || isSmallScreen;
}
