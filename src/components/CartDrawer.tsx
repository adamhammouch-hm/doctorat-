/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CartDrawer Component — Responsive slide-over cart with configurable limit
 */

import React from 'react';
import { ThesisTopic, Language } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Calendar, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  Settings2
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartTopics: ThesisTopic[];
  maxLimit: number;
  onSetMaxLimit: (limit: number) => void;
  onRemoveTopic: (topicId: string) => void;
  onClearCart: () => void;
  onStartApplication: () => void;
  onViewDetails: (topic: ThesisTopic) => void;
  language: Language;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartTopics,
  maxLimit,
  onSetMaxLimit,
  onRemoveTopic,
  onClearCart,
  onStartApplication,
  onViewDetails,
  language,
}) => {
  if (!isOpen) return null;

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const isRtl = language === 'ar';
  const isFull = cartTopics.length >= maxLimit;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 rtl:right-auto rtl:left-0 max-w-full flex">
        <div className="w-screen max-w-xs sm:max-w-md bg-white shadow-xl flex flex-col border-l rtl:border-l-0 rtl:border-r border-slate-200">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{t('cartTitle')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-700 text-white">
                    {cartTopics.length}/{maxLimit}
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label={t('btnClose')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* USMBA Single Topic Rule Notice */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Règle USMBA : 1 candidature par session</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              1 sujet max.
            </span>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartTopics.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3 text-slate-500">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">
                  {t('cartEmptyTitle')}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {t('cartEmptyDesc', { max: maxLimit })}
                </p>
              </div>
            ) : (
              <>
                {isFull && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t('alertMaxReached', { max: maxLimit })}</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  {cartTopics.map((topic, index) => {
                    const title = isRtl && topic.titleAr ? topic.titleAr : topic.title;
                    return (
                      <div
                        key={topic.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-slate-500 font-medium">
                            #{index + 1} · {topic.code}
                          </span>
                          <button
                            onClick={() => onRemoveTopic(topic.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title={t('btnRemove')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4
                          onClick={() => {
                            onClose();
                            onViewDetails(topic);
                          }}
                          className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-2 leading-snug"
                        >
                          {title}
                        </h4>

                        <div className="space-y-1 text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <UserCheck className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{topic.professorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{topic.institution}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>Date limite : {topic.submissionDeadline}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <button
                            onClick={() => {
                              onClose();
                              onViewDetails(topic);
                            }}
                            className="text-emerald-700 hover:underline font-medium"
                          >
                            Fiche détaillée
                          </button>
                          <button
                            onClick={() => onRemoveTopic(topic.id)}
                            className="text-rose-600 hover:underline font-medium"
                          >
                            {t('btnRemove')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Drawer Actions */}
          {cartTopics.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
              <button
                onClick={() => {
                  onClose();
                  onStartApplication();
                }}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <span>{t('btnStartApplication')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {cartTopics.length} sujet(s)
                </span>
                <button
                  onClick={onClearCart}
                  className="text-slate-400 hover:text-rose-600 font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t('btnClearCart')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
