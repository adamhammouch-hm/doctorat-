/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TopicDetailModal — Minimalist, readable scientific sheet modal for doctoral subjects
 */

import React from 'react';
import { ThesisTopic, Language } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  X, 
  Building2, 
  UserCheck, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Check, 
  BookOpen, 
  Layers, 
  Mail,
  ShieldCheck,
  Send
} from 'lucide-react';

interface TopicDetailModalProps {
  topic: ThesisTopic | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (topic: ThesisTopic) => void;
  hasActiveApplication?: boolean;
  isCurrentApplicationTopic?: boolean;
  isDraft?: boolean;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  language,
  isOpen,
  onClose,
  onApply,
  hasActiveApplication = false,
  isCurrentApplicationTopic = false,
  isDraft = false,
}) => {
  if (!isOpen || !topic) return null;

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const isRtl = language === 'ar';
  const displayTitle = isRtl && topic.titleAr ? topic.titleAr : topic.title;
  const secondaryTitle = isRtl ? topic.title : topic.titleAr;
  const displayDesc = isRtl && topic.scientificDescriptionAr ? topic.scientificDescriptionAr : topic.scientificDescription;
  const displayDomain = isRtl && topic.domainAr ? topic.domainAr : topic.domain;

  const getFundingLabel = (type?: ThesisTopic['fundingType']) => {
    switch (type) {
      case 'bourse_cnrst':
        return t('fundingCnrst');
      case 'projet_recherche':
        return t('fundingProject');
      case 'partenariat_industriel':
        return t('fundingIndustrial');
      case 'non_remunere':
      default:
        return t('fundingNone');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="space-y-1 pr-2 rtl:pr-0 rtl:pl-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-200 text-slate-800">
                {topic.code}
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                {displayDomain}
              </span>
              <span className="text-xs text-slate-500">
                · {topic.academicYear}
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-snug">
              {displayTitle}
            </h2>
            {secondaryTitle && (
              <p className="text-xs text-slate-500 italic">
                {secondaryTitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
            aria-label={t('btnClose')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* 1. Context & Scientific Description */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('sectionContext')}</span>
            </h3>
            <p className="leading-relaxed text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs sm:text-sm">
              {displayDesc}
            </p>
          </section>

          {/* 2. Supervision and Research Laboratory */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('sectionSupervision')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">{t('supervisorLabel')}</span>
                <strong className="text-slate-900 text-sm block">{topic.professorName}</strong>
                <span className="text-slate-600 block">{topic.professorTitle}</span>
                {topic.professorEmail && (
                  <div className="text-emerald-700 flex items-center gap-1 pt-1">
                    <Mail className="w-3 h-3" />
                    <span>{topic.professorEmail}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500 block">{t('laboratoryLabel')}</span>
                <strong className="text-slate-900 text-sm block">{topic.laboratory}</strong>
                <span className="text-slate-600 block">{topic.institution}</span>
              </div>
            </div>
          </section>

          {/* 3. Skills and Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Required Skills */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('sectionSkills')}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {topic.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Administrative Eligibility */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('sectionEligibility')}</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {topic.eligibilityCriteria.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* 4. Funding, Deadlines & Spots */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">{t('sectionFunding')}</span>
              <strong className="text-slate-900 block">{getFundingLabel(topic.fundingType)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('deadlineLabel')}</span>
              <strong className="text-emerald-800 block">{topic.submissionDeadline}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t('spotsLabel')}</span>
              <strong className="text-slate-900 block">{t('spotsValue', { count: topic.spotsAvailable })}</strong>
            </div>
          </div>

          {/* 5. 3-Level Validation History */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('workflowTitle')} (Structure $\rightarrow$ Centre $\rightarrow$ Pôle)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* Structure */}
              <div className="p-2.5 rounded-lg border bg-white border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{t('stepStructure')}</span>
                  {topic.workflow.structure.status === 'valid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className="text-emerald-700 font-medium block">
                  {topic.workflow.structure.status === 'valid' ? t('statusValid') : t('statusPending')}
                </span>
                {topic.workflow.structure.date && (
                  <span className="text-[11px] text-slate-400 block">{topic.workflow.structure.date}</span>
                )}
              </div>

              {/* Centre */}
              <div className="p-2.5 rounded-lg border bg-white border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{t('stepCentre')}</span>
                  {topic.workflow.centre.status === 'valid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className="text-emerald-700 font-medium block">
                  {topic.workflow.centre.status === 'valid' ? t('statusValid') : t('statusPending')}
                </span>
                {topic.workflow.centre.date && (
                  <span className="text-[11px] text-slate-400 block">{topic.workflow.centre.date}</span>
                )}
              </div>

              {/* Pôle */}
              <div className="p-2.5 rounded-lg border bg-white border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{t('stepPole')}</span>
                  {topic.workflow.pole.status === 'valid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className={topic.workflow.pole.status === 'valid' ? 'text-emerald-700 font-medium block' : 'text-amber-700 font-medium block'}>
                  {topic.workflow.pole.status === 'valid' ? t('statusValid') : t('statusPending')}
                </span>
                {topic.workflow.pole.date && (
                  <span className="text-[11px] text-slate-400 block">{topic.workflow.pole.date}</span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            {t('btnClose')}
          </button>

          <div className="flex items-center gap-2">
            {topic.status === 'open' && topic.isOfficialPublication ? (
              onApply && (
                isCurrentApplicationTopic ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApply(topic);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isDraft ? 'Reprendre le brouillon' : 'Voir ma candidature'}</span>
                  </button>
                ) : hasActiveApplication ? (
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs cursor-not-allowed"
                    title="Vous avez déjà un dossier actif. Un candidat ne peut postuler qu'à un seul sujet."
                  >
                    <span>Candidature unique déjà déposée</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApply(topic);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Postuler à ce sujet</span>
                  </button>
                )
              )
            ) : (
              <span className="text-xs text-slate-500 bg-slate-200 px-3 py-1.5 rounded-md font-medium">
                Candidatures fermées
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
