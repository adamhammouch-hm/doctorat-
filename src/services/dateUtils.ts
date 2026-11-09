/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Centralized Date & Academic Year Utilities for USMBA Doctoral Platform
 * Standardizes:
 * - ISO 8601 date storage
 * - Africa/Casablanca timezone formatting
 * - Dynamic academic year resolution (e.g. 2026/2027)
 * - Safe localized display for French and Arabic without "Invalid Date" errors
 */

import { Language } from '../types';

export const CASABLANCA_TIMEZONE = 'Africa/Casablanca';

/**
 * Calculates current dynamic academic year according to university calendar
 * (September to August cycle)
 */
export function getCurrentAcademicYear(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0-indexed: 0 = Jan, 7 = Aug, 8 = Sep
  if (month >= 7) {
    // August onwards belongs to upcoming/active academic year (e.g. 2026/2027)
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
}

/**
 * Safely parses any date string, timestamp, or Date into a valid Date object or null
 */
export function parseDateSafe(input: string | number | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    // Check if format is DD/MM/YYYY or DD/MM/YYYY HH:mm
    const frenchDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;
    const match = input.trim().match(frenchDateRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const d = new Date(year, month, day, hours, minutes);
      return isNaN(d.getTime()) ? null : d;
    }
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Formats a date for display (Fr / Ar) with Casablanca timezone
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  language: Language = 'fr',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!input) {
    return language === 'ar' ? 'غير محدد' : 'À définir';
  }

  const d = parseDateSafe(input);
  if (!d) {
    return typeof input === 'string' && input.trim() ? input : (language === 'ar' ? 'غير محدد' : 'À définir');
  }

  const locale = language === 'ar' ? 'ar-MA' : 'fr-FR';
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    timeZone: CASABLANCA_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString(locale);
  }
}

/**
 * Formats date and time (Fr / Ar) with Casablanca timezone
 */
export function formatDateTime(
  input: string | number | Date | null | undefined,
  language: Language = 'fr'
): string {
  if (!input) return language === 'ar' ? 'غير محدد' : 'À définir';
  const d = parseDateSafe(input);
  if (!d) return typeof input === 'string' ? input : '—';

  const locale = language === 'ar' ? 'ar-MA' : 'fr-FR';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: CASABLANCA_TIMEZONE,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toLocaleString(locale);
  }
}

/**
 * Returns clean standard ISO 8601 string for persistence
 */
export function toISOStringSafe(input?: Date | string | number | null): string {
  if (!input) return new Date().toISOString();
  const d = parseDateSafe(input);
  return d ? d.toISOString() : new Date().toISOString();
}

/**
 * Returns formatted relative time (e.g. "il y a 2 heures", "منذ ساعتين")
 */
export function formatRelativeTime(
  input: string | number | Date | null | undefined,
  language: Language = 'fr'
): string {
  const d = parseDateSafe(input);
  if (!d) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);

  if (diffSec < 60) {
    return language === 'ar' ? 'الآن' : 'À l’instant';
  }
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return language === 'ar' ? `منذ ${mins} دقيقة` : `Il y a ${mins} min`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return language === 'ar' ? `منذ ${hours} ساعة` : `Il y a ${hours} h`;
  }
  const days = Math.floor(diffSec / 86400);
  if (days < 30) {
    return language === 'ar' ? `منذ ${days} يوم` : `Il y a ${days} j`;
  }
  return formatDate(d, language);
}
