/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TopicCard Component — Clean, minimalist university thesis card with compact validation trail
 */

import React from 'react';
import { ThesisTopic, Language, ValidationStepStatus } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  Building2, 
  UserCheck, 
  Calendar, 
  Plus, 
  Check, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock
} from 'lucide-react';

interface TopicCardProps {
  topic: ThesisTopic;
  language: Language;
  isInCart: boolean;
  canAddToCart: boolean;
  maxCartLimit: number;
  onAddToCart: (topicId: string) => void;
  onRemoveFromCart: (topicId: string) => void;
  onViewDetails: (topic: ThesisTopic) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  language,
  isInCart,
  canAddToCart,
  maxCartLimit,
  onAddToCart,
  onRemoveFromCart,
  onViewDetails,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const isRtl = language === 'ar';
  const displayTitle = isRtl && topic.titleAr ? topic.titleAr : topic.title;
  const displayDomain = isRtl && topic.domainAr ? topic.domainAr : topic.domain;

  // Minimalist validation step indicator
  const renderMiniStep = (label: string, status: ValidationStepStatus) => {
    return (
      <span 
        key={label}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
          status === 'valid'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : status === 'revision_requested'
            ? 'bg-orange-50 text-orange-800 border-orange-200'
            : status === 'pending'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
        title={`${label} : ${status === 'valid' ? 'Validée' : status === 'revision_requested' ? 'Modifications demandées' : status === 'pending' ? 'En attente' : 'Non retenue'}`}
      >
        {status === 'valid' ? (
          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
        ) : (
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        )}
        <span>{label}</span>
      </span>
    );
  };

  return (
    <article 
      className={`bg-white rounded-xl border flex flex-col justify-between transition-all duration-150 overflow-hidden shadow-2xs hover:shadow-xs ${
        isInCart
          ? 'border-emerald-600 ring-1 ring-emerald-600/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Main card body */}
      <div className="p-5 space-y-3.5 flex-1 flex flex-col">
        {/* Top header: Code + Status */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            {topic.code}
          </span>

          <div>
            {topic.status === 'open' && topic.isOfficialPublication ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>{t('badgeOpen')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>{t('badgeUnderReview')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Domain */}
        <div className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
          {displayDomain}
        </div>

        {/* Title */}
        <h3 
          onClick={() => onViewDetails(topic)}
          className="text-base font-bold text-slate-900 hover:text-emerald-800 cursor-pointer transition-colors leading-snug line-clamp-2"
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        {/* Short metadata: Supervisor & Institution */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100 flex-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-medium truncate">{topic.professorName}</span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-600 truncate" title={`${topic.laboratory} — ${topic.institution}`}>
              {topic.institution}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{t('deadlineLabel')} : <strong className="text-slate-700">{topic.submissionDeadline}</strong></span>
          </div>
        </div>

        {/* Compact 3-Step Validation Indicator (Documented GCD) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Validation</span>
            </span>
            <span>Structure · Centre · Pôle</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {renderMiniStep('Structure', topic.workflow.structure.status)}
            {renderMiniStep('Centre', topic.workflow.centre.status)}
            {renderMiniStep('Pôle', topic.workflow.pole.status)}
          </div>
        </div>
      </div>

      {/* Card Footer: Clean single action row */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewDetails(topic)}
          className="text-xs font-semibold text-slate-600 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{t('btnViewDetails')}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>

        <div>
          {topic.status === 'open' && topic.isOfficialPublication ? (
            isInCart ? (
              <button
                type="button"
                onClick={() => onRemoveFromCart(topic.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('btnInCart')}</span>
              </button>
            ) : canAddToCart ? (
              <button
                type="button"
                onClick={() => onAddToCart(topic.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('btnAddToCart')}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-200 cursor-not-allowed"
                title={t('alertMaxReached', { max: maxCartLimit })}
              >
                <span>{t('btnLimitReached', { max: maxCartLimit })}</span>
              </button>
            )
          ) : (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-200/80 px-2 py-1 rounded">
              Clôturé
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
