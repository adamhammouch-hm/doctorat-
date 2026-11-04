/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Footer Component — Minimalist, professional university footer
 */

import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';
import { GraduationCap } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenGuide?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="container-constrained py-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Brand & info */}
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0" />
              <strong className="text-white text-sm">
                {t('universityName')}
              </strong>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              {t('footerDisclaimer')}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500">
          <span>{t('footerCopyright', { year: new Date().getFullYear() })}</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Architecture 100% Locale &amp; Autonome (localStorage + IndexedDB) · Zéro Cloud Externe</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
