/**
 * GoEvee Explore — locale formatting (en-IN, IST). Pure functions.
 * Values and units are joined with a non-breaking space so "2.4 km"
 * never splits across lines.
 */
import type { Station } from './types';

export const NBSP = '\u00A0';
export const IST = 'Asia/Kolkata';

const hasFraction = (value: number) => Math.round(value * 100) % 100 !== 0;

/** ₹14, ₹14.50, ₹1,25,000 — whole rupees drop decimals, paise always show two. */
export function formatINR(amount: number): string {
  const fraction = hasFraction(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: fraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** The number part of a price without the ₹ sign: "14", "14.50". */
export function formatPriceValue(amount: number): string {
  const fraction = hasFraction(amount);
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: fraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "650 m" under 1 km, "2.4 km" up to 100 km, "1,150 km" beyond. */
export function formatDistance(km: number): string {
  if (km < 1) {
    const metres = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${metres}${NBSP}m`;
  }
  if (km < 100) {
    const value = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(km);
    return `${value}${NBSP}km`;
  }
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(km)}${NBSP}km`;
}

/** "6 min", "1 hr 5 min", "2 hr". */
export function formatEta(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  if (total < 60) return `${total}${NBSP}min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}${NBSP}hr` : `${hours}${NBSP}hr ${rest}${NBSP}min`;
}

/** Spoken ETA for screen-reader summaries: "6 minutes", "1 hour 5 minutes". */
export function formatEtaSpoken(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (total < 60) return plural(total, 'minute');
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? plural(hours, 'hour') : `${plural(hours, 'hour')} ${plural(rest, 'minute')}`;
}

/** "07:00" → "7 AM", "22:30" → "10:30 PM", "00:00" → "12 AM". */
export function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${NBSP}${period}` : `${hour}:${String(m).padStart(2, '0')}${NBSP}${period}`;
}

/** Wall-clock time in IST: "10:42 AM". */
export function formatClockIST(date: Date | number): string {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(date));
  const hour = parts.find(part => part.type === 'hour')?.value ?? '';
  const minute = parts.find(part => part.type === 'minute')?.value ?? '';
  const period = (parts.find(part => part.type === 'dayPeriod')?.value ?? '').toUpperCase().replace(/\./g, '');
  return `${hour}:${minute}${NBSP}${period}`;
}

/** Minutes since midnight in IST, regardless of the device's time zone. */
export function minutesSinceMidnightIST(now: number): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(now));
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  return (hour % 24) * 60 + minute;
}

/** Landmark first, without repeating a city the line already names. */
export function formatAddress(address: Station['address']): string {
  const parts: string[] = [];
  for (const raw of [address.line, address.locality, address.city]) {
    const part = raw.trim();
    if (!part) continue;
    if (parts.some(existing => existing.toLowerCase().includes(part.toLowerCase()))) continue;
    parts.push(part);
  }
  return parts.join(', ');
}

/** "60 kW" with tabular-friendly integers; decimals only when meaningful. */
export function formatPower(kw: number): string {
  const value = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(kw);
  return `${value}${NBSP}kW`;
}
