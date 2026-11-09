/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ProcedureGuideModal — Clean guide to USMBA doctoral application roadmap
 */

import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  X, 
  BookOpen, 
  FileText, 
  Download, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface ProcedureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onGoToCatalog: () => void;
}

export const ProcedureGuideModal: React.FC<ProcedureGuideModalProps> = ({
  isOpen,
  onClose,
  language,
  onGoToCatalog,
}) => {
  if (!isOpen) return null;

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const steps = [
    {
      num: '01',
      title: 'Consultation libre du catalogue',
      desc: 'Découvrez les sujets validés par les laboratoires et le Pôle Doctoral de l’USMBA sans compte préalable.',
    },
    {
      num: '02',
      title: 'Sélection d’intérêt dans le panier',
      desc: 'Ajoutez jusqu’à 3 sujets à votre panier temporaire pour comparer les exigences scientifiques.',
    },
    {
      num: '03',
      title: 'Création du dossier académique unique',
      desc: 'Renseignez votre état civil, vos diplômes et vos relevés de notes en une seule saisie réutilisable.',
    },
    {
      num: '04',
      title: 'Dépôt des pièces & contrôle de lisibilité',
      desc: 'Téléversez vos justificatifs avec contrôle guidé pour éviter les rejets pour documents illisibles.',
    },
    {
      num: '05',
      title: 'Soumission & suivi chronologique',
      desc: 'Chaque candidature reste strictement indépendante avec suivi transparent sur votre espace.',
    },
    {
      num: '06',
      title: 'Inscription physique au guichet CEDoc',
      desc: 'En cas d’admission, présentez votre convocation officielle au guichet pour le contrôle des diplômes originaux.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Guide des Candidatures Doctorales
              </h2>
              <p className="text-xs text-slate-500">
                USMBA · Cycle Doctoral 2026–2027
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
          {/* Reference to official Guide */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block text-xs">
                  Guide officiel GCD pour Professeurs
                </strong>
                <span className="text-[11px] text-slate-500">
                  Consultez le document institutionnel décrivant les validations Structure, Centre et Pôle.
                </span>
              </div>
            </div>

            <a
              href="/public/assets/aistudio/Guide_dUtilisation_pour_Professeurs__1__5c5f779c.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Officiel</span>
            </a>
          </div>

          {/* Stepper list */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {steps.map((st) => (
                <div key={st.num} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {st.num}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {st.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                    {st.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Principles box */}
          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Règles de sélection :</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-5">
              Chaque candidature est examinée de façon strictement indépendante par le jury du laboratoire. Aucune décision n’est automatisée.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {t('btnClose')}
          </button>

          <button
            onClick={() => {
              onClose();
              onGoToCatalog();
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Accéder au catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
