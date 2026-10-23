import type { Room } from './supabase';

export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export const ITEM_PRESETS: { name: string; emoji: string }[] = [
  { name: 'Elefante', emoji: '🐘' },
  { name: 'Maçã', emoji: '🍎' },
  { name: 'Chave', emoji: '🔑' },
  { name: 'Melancia', emoji: '🍉' },
  { name: 'Bola de Futebol', emoji: '⚽' },
  { name: 'Carrinho', emoji: '🚗' },
  { name: 'Celular', emoji: '📱' },
  { name: 'Garrafa', emoji: '🍾' },
  { name: 'Patinho', emoji: '🦆' },
  { name: 'Ovo Cru', emoji: '🥚' },
  { name: 'Pedra', emoji: '🪨' },
  { name: 'Barco', emoji: '⛵' },
  { name: 'Tijolo', emoji: '🧱' },
  { name: 'Balão', emoji: '🎈' },
  { name: 'Pena', emoji: '🪶' },
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
