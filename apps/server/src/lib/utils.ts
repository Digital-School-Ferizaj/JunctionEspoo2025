import { randomUUID } from 'crypto';
import { env } from '../env.js';

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phoneRegex = /\+?\d{7,15}/g;

export function stripPii(text: string): string {
  return text.replace(emailRegex, '[email]').replace(phoneRegex, '[number]');
}

export function ensureDurationMs(input?: string | number): number | undefined {
  if (!input) return undefined;
  const parsed = typeof input === 'number' ? input : Number(input);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

export function generateAudioPath(kind: 'entries' | 'memories' | 'messages'): string {
  return `audio/${kind}/${randomUUID()}.mp3`;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function minutesToMs(minutes: number) {
  return minutes * 60 * 1000;
}

export function hoursToMs(hours: number) {
  return hours * 60 * 60 * 1000;
}

export function signedLink(path: string) {
  return `${env.APP_BASE_URL}/media/stream/${encodeURIComponent(path)}`;
}
