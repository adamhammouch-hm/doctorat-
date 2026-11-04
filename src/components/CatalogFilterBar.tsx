/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Filter bar — Responsive, minimalist and collapsible multi-criteria filtering
 */

import React, { useState } from 'react';
import { Language, TopicFilters } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown,
  X,
  ChevronDown
} from 'lucide-react';

interface CatalogFilterBarProps {
  language: Language;
  filters: TopicFilters;
  onFilterChange: (newFilters: TopicFilters) => void;
  institutions: string[];
  laboratories: string[];
  domains: string[];
  academicYears: string[];
  professors: string[];
  totalResults: number;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  language,
  filters,
  onFilterChange,
  institutions,
  laboratories,
  domains,
  academicYears,
  professors,
  totalResults,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const handleReset = () => {
    onFilterChange({
      searchQuery: '',
      institution: '',
      laboratory: '',
      domain: '',
      academicYear: '',
      professor: '',
      onlyOpen: false,
      sortBy: 'deadline',
    });
  };

  // Count active filters (excluding default sort and empty search)
  const activeFiltersCount = [
    Boolean(filters.institution),
    Boolean(filters.laboratory),
    Boolean(filters.domain),
    Boolean(filters.academicYear),
    Boolean(filters.professor),
    Boolean(filters.onlyOpen),
  ].filter(Boolean).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Primary Bar: Search, Filter Toggle, Sort & Count */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search input with clear button */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-9 rtl:pl-9 rtl:pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Controls: Filter Drawer Toggle & Sort */}
        <div className="flex items-center gap-2">
          {/* Toggle advanced filters button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
              isExpanded || activeFiltersCount > 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            aria-expanded={isExpanded}
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
            <span>{language === 'ar' ? 'تصفية متقدمة' : 'Filtres'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0 hidden sm:inline" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as TopicFilters['sortBy'] })}
              className="w-full sm:w-auto py-2.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="deadline">{t('sortDeadline')}</option>
              <option value="title">{t('sortTitle')}</option>
              <option value="applicants">{t('sortApplicants')}</option>
              <option value="newest">{t('sortNewest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Filter Panel (Keeps mobile clean, organized on desktop) */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Institution filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {t('institutionLabel')}
              </label>
              <select
                value={filters.institution}
                onChange={(e) => onFilterChange({ ...filters, institution: e.target.value })}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none truncate"
              >
                <option value="">{t('filterAllInstitutions')}</option>
                {institutions.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            {/* Laboratory filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {t('laboratoryLabel')}
              </label>
              <select
                value={filters.laboratory}
                onChange={(e) => onFilterChange({ ...filters, laboratory: e.target.value })}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none truncate"
              >
                <option value="">{t('filterAllLabs')}</option>
                {laboratories.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {t('domainLabel')}
              </label>
              <select
                value={filters.domain}
                onChange={(e) => onFilterChange({ ...filters, domain: e.target.value })}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none truncate"
              >
                <option value="">{t('filterAllDomains')}</option>
                {domains.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            {/* Professor filter */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 block">
                {t('supervisorLabel')}
              </label>
              <select
                value={filters.professor}
                onChange={(e) => onFilterChange({ ...filters, professor: e.target.value })}
                className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none truncate"
              >
                <option value="">{t('filterAllProfessors')}</option>
                {professors.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sub-bar: Status toggle, Result count & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={filters.onlyOpen}
            onChange={(e) => onFilterChange({ ...filters, onlyOpen: e.target.checked })}
            className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600"
          />
          <span>{t('filterOnlyOpen')}</span>
        </label>

        <div className="flex items-center gap-3 ml-auto rtl:ml-0 rtl:mr-auto">
          <span className="font-semibold text-slate-600">
            {t('resultsCount', { count: totalResults })}
          </span>

          {(activeFiltersCount > 0 || filters.searchQuery) && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('btnResetFilters')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
