/**
 * UTILS — Tailwind CSS class name merger.
 * Moved from src/lib/utils.ts for consistent organisation.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
