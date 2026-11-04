/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TopicValidationModal Component — Topic Examination, Modification Requests & Electronic Signature
 * Used exclusively by the Structure Director (Directeur de structure).
 */

import React, { useState } from 'react';
import { ThesisTopic, Language } from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  BookOpen, 
  UserCheck, 
  Building2, 
  Send,
  AlertCircle,
  FileSignature,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';

interface TopicValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: ThesisTopic | null;
  onSignAndApprove: (topicId: string, comments?: string) => void;
  onRequestRevision: (topicId: string, message: string) => void;
  onRejectTopic: (topicId: string, reason: string) => void;
  signerName: string;
  signerEmail: string;
  language: Language;
}

export const TopicValidationModal: React.FC<TopicValidationModalProps> = ({
  isOpen,
  onClose,
  topic,
  onSignAndApprove,
  onRequestRevision,
  onRejectTopic,
  signerName,
  signerEmail,
  language: _language,
}) => {
  const [activeAction, setActiveAction] = useState<'view' | 'sign' | 'request_revision' | 'reject'>('view');
  const [signatureComments, setSignatureComments] = useState('Sujet doctoral conforme aux axes de recherche prioritaires et validé pour la campagne.');
  const [revisionMessage, setRevisionMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !topic) return null;

  const handleConfirmSignature = () => {
    onSignAndApprove(topic.id, signatureComments);
    onClose();
  };

  const handleConfirmRevision = () => {
    if (!revisionMessage.trim()) {
      setErrorMessage('Veuillez préciser la nature exacte des modifications requises.');
      return;
    }
    onRequestRevision(topic.id, revisionMessage.trim());
    onClose();
  };

  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      setErrorMessage('Une justification formelle est obligatoire pour rejeter un sujet.');
      return;
    }
    onRejectTopic(topic.id, rejectionReason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <FileSignature className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {topic.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Directeur : {topic.professorName}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                Examen & Signature du sujet de thèse
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Topic Title & Lab */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-900">{topic.title}</h3>
            {topic.titleAr && (
              <p className="text-xs font-arabic text-slate-700 text-right" dir="rtl">{topic.titleAr}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <span><strong>Laboratoire :</strong> {topic.laboratory}</span>
              <span><strong>Établissement :</strong> {topic.institution}</span>
              <span><strong>Places :</strong> {topic.spotsAvailable}</span>
              <span><strong>Financement :</strong> {topic.fundingType || 'Non spécifié'}</span>
            </div>
          </div>

          {/* Detailed Scientific Description */}
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Description scientifique détaillée
            </h4>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed text-xs max-h-40 overflow-y-auto">
              {topic.scientificDescription}
            </div>
          </div>

          {/* Criteria & Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-[11px]">Conditions d’accès définies</h4>
              <ul className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {topic.eligibilityCriteria.map((c, i) => (
                  <li key={i} className="text-slate-700 text-[11px] flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-[11px]">Compétences requises</h4>
              <div className="flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {topic.requiredSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[10px] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Prior revisions history if any */}
          {topic.revisionRequests && topic.revisionRequests.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 text-[11px]">Historique des demandes de révision</h4>
              <div className="space-y-1.5">
                {topic.revisionRequests.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <div className="flex justify-between font-semibold">
                      <span>{r.requestedBy}</span>
                      <span className="text-amber-800 text-[10px]">{r.date}</span>
                    </div>
                    <p className="mt-0.5">{r.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTION PANEL: SIGNATURE FORM */}
          {activeAction === 'sign' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Apposer la signature électronique interne & Publier le sujet</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Cette signature atteste de la validation administrative et pédagogique par la Direction de structure. Le sujet passera immédiatement au statut <strong>Ouvert (Publié)</strong> et sera consultable par tous les candidats.
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] space-y-1">
                <div><strong>Signataire :</strong> {signerName}</div>
                <div><strong>E-mail :</strong> {signerEmail}</div>
                <div><strong>Rôle académique :</strong> Directeur de structure (CEDoc / Pôle doctoral)</div>
                <div><strong>Horodatage :</strong> {new Date().toLocaleString('fr-FR')}</div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-[11px]">Mentions & observations de validation</label>
                <input
                  type="text"
                  value={signatureComments}
                  onChange={(e) => setSignatureComments(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction('view')}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Confirmer la signature et publier</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTION PANEL: REVISION REQUEST FORM */}
          {activeAction === 'request_revision' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Demander des modifications au Directeur de thèse</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Précisez les points à corriger ou compléter (prérequis, formulation du sujet, livrables attendus). Le sujet sera renvoyé à l'enseignant pour modification.
              </p>
              <textarea
                required
                rows={3}
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="Ex: Prière d'ajuster les conditions d'accès en Master et de préciser la méthodologie de test..."
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction('view')}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevision}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la demande de modification</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTION PANEL: REJECTION FORM */}
          {activeAction === 'reject' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>Refuser définitivement le sujet de thèse</span>
              </div>
              <p className="text-[11px] text-rose-800">
                Cette décision est définitive et notifiera le directeur de thèse avec la justification institutionnelle obligatoire ci-dessous.
              </p>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motif formel du refus du sujet..."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveAction('view')}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-800 hover:bg-rose-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Confirmer le refus définitif</span>
                </button>
              </div>
            </div>
          )}

          {/* DEFAULT ACTION BUTTONS (WHEN NO FORM OPEN) */}
          {activeAction === 'view' && (
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveAction('reject')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Refuser le sujet
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAction('request_revision')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-50 border border-amber-300 transition-colors cursor-pointer"
                >
                  Demander une modification
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAction('sign')}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Accepter et signer électroniquement</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
