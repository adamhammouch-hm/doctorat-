/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ApplicationReviewModal — Candidate file examination, documents check & academic decision actions
 * Features:
 * - Clear separation between Supervisor Scientific Opinion (Avis Scientifique) and Final Administrative Decision
 * - Strict mandatory rejection reason validation
 * - Inline targeted piece correction request without browser prompt
 * - Full audit history timeline
 */

import React, { useState } from 'react';
import { CandidateApplication, Language, ScientificOpinion, ApplicationDocument } from '../types';
import { DocumentViewerModal } from './DocumentViewerModal';
import { 
  X, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  UserCheck, 
  Award, 
  History, 
  AlertTriangle,
  ListOrdered,
  BookOpen,
  Sparkles,
  Send,
  Eye,
  Check
} from 'lucide-react';

interface ApplicationReviewModalProps {
  application: CandidateApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ) => void;
  onRequestPieceCorrection?: (appId: string, category: string, note: string) => void;
  onSaveScientificOpinion?: (appId: string, opinion: ScientificOpinion) => void;
  currentUser: string;
  language: Language;
}

const NORMALIZED_REJECTION_REASONS = [
  'Prérequis méthodologiques et théoriques insuffisants pour ce sujet',
  'Profil académique hors du champ de spécialité du sujet de thèse',
  'Capacité d’accueil maximale du laboratoire atteinte',
  'Classement inférieur au seuil d’admissibilité de la commission',
  'Dossier académique incomplet après expiration du délai accordé',
  'Note de Master inférieure au seuil minimal requis par le laboratoire',
];

export const ApplicationReviewModal: React.FC<ApplicationReviewModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdateStatus,
  onRequestPieceCorrection,
  onSaveScientificOpinion,
  currentUser,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'scientific' | 'decision' | 'history'>('profile');
  
  // Scientific Opinion Form
  const [recommendation, setRecommendation] = useState<'favorable' | 'defavorable' | 'reserve'>(
    application?.scientificOpinion?.recommendation || 'favorable'
  );
  const [score, setScore] = useState<string>(
    application?.scientificOpinion?.score ? String(application?.scientificOpinion?.score) : '16'
  );
  const [scientificComments, setScientificComments] = useState<string>(
    application?.scientificOpinion?.academicAppraisal || ''
  );
  const [scientificSavedFeedback, setScientificSavedFeedback] = useState(false);

  // Administrative Decision Form
  const [activeDecision, setActiveDecision] = useState<'none' | 'accept' | 'waitlist' | 'reject'>('none');
  const [selectedRejectionReason, setSelectedRejectionReason] = useState(NORMALIZED_REJECTION_REASONS[0]);
  const [customRejectionNote, setCustomRejectionNote] = useState('');
  const [waitlistRank, setWaitlistRank] = useState(1);

  // Piece Correction Form (inline, no prompt)
  const [correctingDocCategory, setCorrectingDocCategory] = useState<string | null>(null);
  const [pieceCorrectionReason, setPieceCorrectionReason] = useState('');

  // Document viewer modal state
  const [viewingDocument, setViewingDocument] = useState<ApplicationDocument | null>(null);

  if (!isOpen || !application) return null;

  const isRtl = language === 'ar';

  const handleSaveScientificOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scientificComments.trim()) return;

    const parsedScore = parseFloat(score);
    const opinion: ScientificOpinion = {
      recommendation,
      score: !isNaN(parsedScore) ? Math.min(20, Math.max(0, parsedScore)) : undefined,
      academicAppraisal: scientificComments.trim(),
      evaluatorName: currentUser,
      evaluatedAt: new Date().toLocaleString('fr-FR'),
    };

    if (onSaveScientificOpinion) {
      onSaveScientificOpinion(application.id, opinion);
    } else {
      // Fallback
      application.scientificOpinion = opinion;
    }

    setScientificSavedFeedback(true);
    setTimeout(() => setScientificSavedFeedback(false), 3000);
  };

  const handleConfirmDecision = () => {
    if (activeDecision === 'accept') {
      onUpdateStatus(application.id, 'accepted', { author: currentUser });
      onClose();
    } else if (activeDecision === 'waitlist') {
      onUpdateStatus(application.id, 'waitlisted', { waitlistRank, author: currentUser });
      onClose();
    } else if (activeDecision === 'reject') {
      const fullReason = customRejectionNote.trim()
        ? `${selectedRejectionReason} — Note complémentaire : ${customRejectionNote.trim()}`
        : selectedRejectionReason;
      
      if (!fullReason.trim()) return;
      onUpdateStatus(application.id, 'rejected', { reason: fullReason, author: currentUser });
      onClose();
    }
  };

  const handleSendPieceCorrection = (category: string) => {
    if (!pieceCorrectionReason.trim()) return;

    if (onRequestPieceCorrection) {
      onRequestPieceCorrection(application.id, category, pieceCorrectionReason.trim());
    } else {
      onUpdateStatus(application.id, 'correction_requested', {
        correctionMessage: pieceCorrectionReason.trim(),
        author: currentUser,
      });
    }

    setCorrectingDocCategory(null);
    setPieceCorrectionReason('');
  };

  const getStatusBadge = (status: CandidateApplication['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Admis (Liste Principale)</span>
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Liste d’Attente (Rang {application.waitlistRank || 1})</span>
          </span>
        );
      case 'correction_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Correction demandée</span>
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Dossier incomplet</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Non retenu</span>
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>En attente d’examen</span>
          </span>
        );
    }
  };

  const isRejectDisabled = activeDecision === 'reject' && !selectedRejectionReason && !customRejectionNote.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                Dossier #{application.id}
              </span>
              {getStatusBadge(application.status)}
              <span className="text-xs text-slate-500">
                Déposé le {application.submissionDate}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {application.candidateName}
            </h2>
            <p className="text-xs text-slate-600 font-medium line-clamp-1">
              Sujet de thèse : <span className="font-semibold text-slate-800">{application.topicCode} — {application.topicTitle}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Cursus & Identité
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pièces ({application.documents.length})</span>
            {application.documents.some((d) => d.status === 'needs_correction') && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('scientific')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scientific'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Avis Scientifique Encadrant</span>
            {application.scientificOpinion && (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'decision'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Décision Administrative</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-700 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Historique & Audit ({application.history.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 flex-1">
          {/* Active status alerts */}
          {application.status === 'correction_requested' && application.correctionMessage && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <strong>Demande de correction en cours :</strong> {application.correctionMessage}
            </div>
          )}

          {application.status === 'rejected' && application.rejectionReason && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
              <strong>Motif obligatoire de non-retenue :</strong> {application.rejectionReason}
              {application.decisionDate && (
                <span className="block text-rose-700 mt-0.5">Décision enregistrée le {application.decisionDate} par {application.decisionBy}</span>
              )}
            </div>
          )}

          {/* TAB 1: PROFILE & ACADEMIC CREDENTIALS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Diplôme de Master / Ingénieur</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{application.masterDegree}</strong>
                  <span className="text-slate-600 block">{application.masterUniversity}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Moyenne générale & Mention</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-extrabold text-emerald-800">
                      {application.masterGrade.toFixed(2)} / 20
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                      Mention {application.masterMention}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Mémoire de Fin d’Études (PFE)</span>
                  <p className="text-slate-800 italic mt-0.5 font-medium">« {application.pfeTitle} »</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Identité & Coordonnées</span>
                  <div className="text-slate-700 space-y-0.5 mt-1">
                    <div>CNE / Massar : <strong>{application.cne}</strong></div>
                    <div>CIN : <strong>{application.cin}</strong></div>
                    <div>Email : <a href={`mailto:${application.candidateEmail}`} className="text-emerald-700 underline">{application.candidateEmail}</a></div>
                    <div>Tél : <strong>{application.candidatePhone}</strong></div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold uppercase">Dépôt physique des originaux</span>
                  <div className="mt-1">
                    {application.physicalReception?.received ? (
                      <div className="text-emerald-800 text-xs bg-emerald-50 border border-emerald-200 p-2 rounded">
                        <div>Vérifié et estampillé au guichet CEDoc</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Par : {application.physicalReception.agentName} ({application.physicalReception.date})</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs italic">Originaux physiques non encore déposés au guichet CEDoc</span>
                    )}
                  </div>
                </div>
              </div>

              {application.statementOfPurpose && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Lettre de motivation scientifique & adéquation
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {application.statementOfPurpose}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENTS CHECKLIST */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Vérification des pièces dématérialisées pour le sujet {application.topicCode}</span>
                <span className="font-semibold text-slate-700">{application.documents.length} pièces jointes</span>
              </div>

              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-xs space-y-2 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900 block truncate">{doc.name}</span>
                          <span className="text-[11px] text-slate-500">{doc.fileName} ({doc.fileSize})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.status === 'valid' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Conforme
                          </span>
                        ) : (
                          <span className="text-[11px] text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            À corriger
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewingDocument(doc)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-200 bg-slate-100 rounded border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Visualiser et examiner la pièce en haute définition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Consulter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCorrectingDocCategory(doc.category);
                            setPieceCorrectionReason(doc.note || '');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-white hover:bg-rose-700 bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                        >
                          Demander correction
                        </button>
                      </div>
                    </div>

                    {doc.note && (
                      <div className="text-[11px] text-rose-700 bg-rose-50/60 p-2 rounded border border-rose-100">
                        <strong>Remarque émise :</strong> {doc.note}
                      </div>
                    )}

                    {/* Inline Correction Form for this specific piece */}
                    {correctingDocCategory === doc.category && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 space-y-2 animate-in fade-in">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Motif obligatoire de rejet ou correction pour « {doc.name} » :</span>
                        </div>
                        <textarea
                          value={pieceCorrectionReason}
                          onChange={(e) => setPieceCorrectionReason(e.target.value)}
                          placeholder="Exemple : Document tronqué, scan illisible ou cachet officiel du doyen manquant au verso."
                          rows={2}
                          className="w-full p-2 bg-white border border-amber-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectingDocCategory(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={!pieceCorrectionReason.trim()}
                            onClick={() => handleSendPieceCorrection(doc.category)}
                            className="px-3 py-1 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded shadow-2xs"
                          >
                            Enregistrer et notifier le candidat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SUPERVISOR SCIENTIFIC OPINION */}
          {activeTab === 'scientific' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Avis Scientifique & Évaluation Académique de l’Encadrant</span>
                </div>
                <p className="text-slate-600">
                  L’avis scientifique constitue l’appréciation académique portée par le directeur de thèse sur la qualité du dossier, l’adéquation du cursus et le potentiel de recherche. 
                  Il est archivé dans le dossier et distinct de la décision administrative formelle.
                </p>
              </div>

              {scientificSavedFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Avis scientifique enregistré avec succès et consigné dans le journal d’audit.</span>
                </div>
              )}

              <form onSubmit={handleSaveScientificOpinion} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recommandation scientifique de l’encadrant *
                    </label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="favorable">Avis Favorable (Recommandé pour admission)</option>
                      <option value="reserve">Avis Réservé (Sous réserve de classement/entretien)</option>
                      <option value="defavorable">Avis Défavorable (Profil inadapté au sujet)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Note d’évaluation académique (sur 20)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="20"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="Ex : 16.5"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rapport d’évaluation et motivation scientifique détaillée *
                  </label>
                  <textarea
                    rows={4}
                    value={scientificComments}
                    onChange={(e) => setScientificComments(e.target.value)}
                    placeholder="Précisez l'adéquation du sujet de Master/PFE avec les problématiques de la thèse, la maîtrise des outils requis (Deep Learning, Vision, NLP, etc.) et les publications éventuelles..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    Évaluateur : <strong>{currentUser}</strong>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enregistrer l’avis scientifique</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: OFFICIAL ADMINISTRATIVE DECISION */}
          {activeTab === 'decision' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Décision Administrative & Juridique de la Commission</span>
                </div>
                <p className="text-slate-600">
                  La décision finale engage l’Université Sidi Mohamed Ben Abdellah et le CEDoc. Tout rejet doit faire l’objet d’une motivation explicite conformément aux règles universitaires.
                </p>
              </div>

              {/* Action selection buttons */}
              {activeDecision === 'none' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveDecision('accept')}
                    className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/70 text-left transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between font-bold text-emerald-900 text-xs">
                      <span>Admettre (Liste Principale)</span>
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug">
                      Retient définitivement le candidat au titre de la session active.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDecision('waitlist')}
                    className="p-4 rounded-xl border border-blue-300 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between font-bold text-blue-900 text-xs">
                      <span>Liste d’Attente</span>
                      <ListOrdered className="w-4 h-4 text-blue-700" />
                    </div>
                    <p className="text-[11px] text-blue-800 leading-snug">
                      Attribue un rang de classement en cas de désistement sur Liste Principale.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDecision('reject')}
                    className="p-4 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-left transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-900 text-xs">
                      <span>Non retenu (Refus motivé)</span>
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                    </div>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      Rejet avec notification du motif réglementaire obligatoire.
                    </p>
                  </button>
                </div>
              ) : (
                /* Form for confirmed action */
                <div className="p-4 rounded-xl border bg-white space-y-4 animate-in fade-in duration-150">
                  {activeDecision === 'accept' && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        <span>Confirmation d’Admission sur la Liste Principale</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Vous vous apprêtez à déclarer <strong>{application.candidateName}</strong> admis pour le sujet <strong>{application.topicCode}</strong>.
                        Une notification sera expédiée sur son espace personnel pour engager le dépôt physique des originaux au guichet CEDoc.
                      </p>
                    </div>
                  )}

                  {activeDecision === 'waitlist' && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <ListOrdered className="w-4 h-4 text-blue-700" />
                        <span>Classement sur la Liste d’Attente</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-700">Rang de classement sur liste d’attente :</label>
                        <select
                          value={waitlistRank}
                          onChange={(e) => setWaitlistRank(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          <option value={1}>Rang 1 (Prioritaire)</option>
                          <option value={2}>Rang 2</option>
                          <option value={3}>Rang 3</option>
                          <option value={4}>Rang 4</option>
                          <option value={5}>Rang 5</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeDecision === 'reject' && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-700" />
                        <span>Motif réglementaire obligatoire de non-retenue :</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Motif principal réglementé *
                        </label>
                        <select
                          value={selectedRejectionReason}
                          onChange={(e) => setSelectedRejectionReason(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500"
                        >
                          {NORMALIZED_REJECTION_REASONS.map((r, i) => (
                            <option key={i} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Précision ou motivation pédagogique complémentaire (facultatif)
                        </label>
                        <input
                          type="text"
                          value={customRejectionNote}
                          onChange={(e) => setCustomRejectionNote(e.target.value)}
                          placeholder="Exemple : Insuffisance constatée en programmation GPU / PyTorch lors de l'examen du cursus"
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>

                      {isRejectDisabled && (
                        <p className="text-[11px] text-rose-600 font-semibold">
                          Veuillez renseigner un motif non vide pour valider le rejet.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveDecision('none')}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isRejectDisabled}
                      onClick={handleConfirmDecision}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 shadow-2xs"
                    >
                      Confirmer et notifier le candidat
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 font-medium">
                Traçabilité horodatée de toutes les opérations intervenues sur ce dossier :
              </div>
              <div className="space-y-1.5">
                {application.history.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-800">{h.action}</span>
                      {h.note && <p className="text-slate-500 italic mt-0.5">« {h.note} »</p>}
                    </div>
                    <div className="text-right shrink-0 text-slate-400 text-[11px]">
                      <div>{h.date}</div>
                      <div className="text-slate-600 font-medium">{h.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
          >
            Fermer
          </button>
          <span className="text-[11px] text-slate-500">
            Évaluateur habilité : <strong>{currentUser}</strong>
          </span>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          document={viewingDocument}
          candidateName={application.candidateName}
          canRequestCorrection={true}
          onRequestCorrection={(category, note) => {
            setPieceCorrectionReason(note);
            handleSendPieceCorrection(category);
            setViewingDocument(null);
          }}
        />
      )}
    </div>
  );
};
