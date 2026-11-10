/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CandidateWorkspace Component — Comprehensive candidate personal space
 * - Independent application tracking with all 6 statuses
 * - Dedicated piece replacement on correction requests
 * - Reusable candidate profile management (civil & academic background)
 * - Integration with CIN OCR
 */

import React, { useState } from 'react';
import { 
  CandidateApplication, 
  CandidateProfile, 
  Language, 
  AppUser, 
  DocumentCategory,
  ApplicationDocument 
} from '../types';
import { ProfileService } from '../services/profileService';
import { ApplicationService } from '../services/thesisService';
import { AdmissionWaitlistService } from '../services/admissionWaitlistService';
import { DocumentUploadModal } from './DocumentUploadModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { CinOcrModal } from './CinOcrModal';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Layers, 
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  History,
  User,
  GraduationCap,
  Save,
  Scan,
  Edit3,
  Calendar,
  AlertTriangle,
  Trash2,
  Eye
} from 'lucide-react';
import { formatDate, formatDateTime } from '../services/dateUtils';

interface CandidateWorkspaceProps {
  user: AppUser;
  applications: CandidateApplication[];
  language: Language;
  onBrowseCatalog: () => void;
  onResumeDraft?: (app: CandidateApplication) => void;
  onApplicationUpdated?: (updated: CandidateApplication) => void;
  onApplicationDeleted?: () => void;
}

export const CandidateWorkspace: React.FC<CandidateWorkspaceProps> = ({
  user,
  applications,
  language,
  onBrowseCatalog,
  onResumeDraft,
  onApplicationUpdated,
  onApplicationDeleted,
}) => {
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<'applications' | 'profile'>('applications');

  // Candidate applications filtered strictly to this user (strictly candidateId === user.id)
  const userApplications = applications.filter(
    (app) => Boolean(app.candidateId && user?.id && app.candidateId.trim() === user.id.trim())
  );

  const [selectedAppId, setSelectedAppId] = useState<string>(
    userApplications[0]?.id || ''
  );

  const activeApp = userApplications.find((a) => a.id === selectedAppId) || userApplications[0];

  // Draft deletion modal and toast feedback state
  const [draftToDelete, setDraftToDelete] = useState<CandidateApplication | null>(null);
  const [deleteDraftFeedback, setDeleteDraftFeedback] = useState<string | null>(null);

  const handleConfirmDeleteDraft = () => {
    if (!draftToDelete) return;
    const targetId = draftToDelete.id;
    const res = ApplicationService.deleteDraft(targetId, user.id);
    if (res.success) {
      setDeleteDraftFeedback(isRtl ? 'تم حذف المسودة بنجاح' : 'Brouillon supprimé avec succès.');
      setTimeout(() => setDeleteDraftFeedback(null), 4000);
      const remaining = userApplications.filter((a) => a.id !== targetId);
      if (selectedAppId === targetId) {
        setSelectedAppId(remaining[0]?.id || '');
      }
      if (onApplicationDeleted) {
        onApplicationDeleted();
      } else if (onApplicationUpdated) {
        const dummy: CandidateApplication = {
          ...draftToDelete,
          id: targetId,
          status: 'draft',
          isDraft: true,
        };
        onApplicationUpdated(dummy);
      }
    }
    setDraftToDelete(null);
  };

  // Reusable Profile State
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    const existing = ProfileService.getProfile(user.id);
    return existing || ProfileService.createEmptyProfile(user.id, user.email, user.name);
  });
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Single Document Replacement modal state (for correction requests)
  const [correctionTargetDoc, setCorrectionTargetDoc] = useState<{
    appId: string;
    category: DocumentCategory;
    name: string;
  } | null>(null);

  // OCR Modal for profile
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Document viewer modal state
  const [viewingDocument, setViewingDocument] = useState<ApplicationDocument | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: CandidateApplication['status'], isDraft?: boolean) => {
    if (isDraft || status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span>Brouillon en cours</span>
        </span>
      );
    }
    switch (status) {
      case 'registration_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Inscription confirmée</span>
          </span>
        );
      case 'admitted':
      case 'accepted':
      case 'registration_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Admis — Inscription à effectuer</span>
          </span>
        );
      case 'waitlist':
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Clock className="w-3.5 h-3.5 text-indigo-700" />
            <span>Liste d’Attente</span>
          </span>
        );
      case 'deadline_exceeded':
      case 'admission_cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Admission Annulée (Délai dépassé)</span>
          </span>
        );
      case 'correction_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Correction Demandée</span>
          </span>
        );
      case 'incomplete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Dossier Incomplet</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Non Retenu</span>
          </span>
        );
      case 'pending_review':
      case 'under_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>En Cours d’Examen</span>
          </span>
        );
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    ProfileService.saveProfile(profile);
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 3000);
  };

  const handleDocumentReplaced = (doc: ApplicationDocument) => {
    if (!correctionTargetDoc) return;
    const res = ApplicationService.replaceDocument(correctionTargetDoc.appId, doc, user.id);
    if (res && onApplicationUpdated) {
      onApplicationUpdated(res);
    }
    setCorrectionTargetDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {isRtl ? 'فضاء المترشح' : 'Espace Candidat'}
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {profile.firstName || user.name}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {isRtl ? 'فضاء المترشح' : 'Mon espace candidat'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRtl 
              ? 'تتبع ملفات الترشيح، الوثائق، وإجراءات التسجيل' 
              : "Suivez vos candidatures, vos documents et vos démarches d'inscription"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Consulter le Catalogue des Sujets</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Mes Candidatures vs Mon Profil Réutilisable */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mes Candidatures ({userApplications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-emerald-700 text-emerald-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Mon Profil Réutilisable</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS LIST & DETAIL */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Applications List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Dossiers enregistrés
            </h3>

            {userApplications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Vous n’avez pas encore déposé de candidature formelle.
                </p>
                <button
                  type="button"
                  onClick={onBrowseCatalog}
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 cursor-pointer"
                >
                  Choisir un sujet dans le catalogue
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {userApplications.map((app) => {
                  const isSelected = activeApp?.id === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-mono font-bold text-slate-700">{app.topicCode}</span>
                        <span>{formatDate(app.submissionDate, language)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-2">
                        {app.topicTitle}
                      </h4>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {getStatusBadge(app.status, app.isDraft)}
                        <div className="flex items-center gap-1.5">
                          {(app.isDraft || app.status === 'draft') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDraftToDelete(app);
                              }}
                              title={isRtl ? 'حذف المسودة' : 'Supprimer le brouillon'}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Application Overview */}
          {activeApp ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {activeApp.topicCode}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {activeApp.topicTitle}
                    </h3>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(activeApp.status, activeApp.isDraft)}
                  </div>
                </div>

                {/* Draft Resumption Alert */}
                {(activeApp.isDraft || activeApp.status === 'draft') && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-amber-600" />
                        <span>Brouillon non soumis</span>
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Vous vous êtes arrêté à l’étape {activeApp.draftStep || 1} / 5. Les informations saisies sont enregistrées localement.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setDraftToDelete(activeApp)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Supprimer le brouillon</span>
                      </button>
                      {onResumeDraft && (
                        <button
                          type="button"
                          onClick={() => onResumeDraft(activeApp)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                        >
                          Reprendre la saisie
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ADMISSION & REGISTRATION ALERT */}
                {(activeApp.status === 'admitted' || activeApp.status === 'accepted' || activeApp.status === 'registration_pending') && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div>
                        <div className="font-bold text-sm text-emerald-900">
                          Félicitations : Votre candidature est retenue sur Liste Principale !
                        </div>
                        <div className="text-xs text-emerald-800">
                          Votre dossier a été validé par la commission académique et le Directeur de structure.
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-600">Date limite impérative d'inscription : </span>
                        <strong className="font-mono text-emerald-900 font-bold">
                          {activeApp.registrationDeadline 
                            ? formatDate(activeApp.registrationDeadline, language)
                            : (isRtl ? 'تاريخ يحدد لاحقاً' : 'À définir')}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = AdmissionWaitlistService.confirmCandidateRegistration(activeApp.id, user.name);
                          if (res.success && onApplicationUpdated) {
                            const updated = ApplicationService.getApplications().find((a) => a.id === activeApp.id);
                            if (updated) onApplicationUpdated(updated);
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmer mon inscription administrative en ligne</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* REGISTRATION CONFIRMED ALERT */}
                {activeApp.status === 'registration_confirmed' && (
                  <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span>Inscription administrative confirmée avec succès.</span>
                      <p className="text-[11px] font-normal text-emerald-800 mt-0.5">
                        Votre attestation d’inscription au cycle doctoral USMBA sera mise à votre disposition au guichet du CEDoc lors du dépôt physique des originaux.
                      </p>
                    </div>
                  </div>
                )}

                {/* ADMISSION CANCELLED / DEADLINE EXCEEDED ALERT */}
                {(activeApp.status === 'admission_cancelled' || activeApp.status === 'deadline_exceeded') && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1.5 text-xs">
                    <div className="font-bold flex items-center gap-1.5 text-rose-900 text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>Admission révoquée pour non-respect du délai d'inscription</span>
                    </div>
                    <p className="text-rose-800">
                      Conformément à la réglementation du cycle doctoral de l'USMBA, l'inscription administrative en ligne n'a pas été confirmée avant la date d'échéance fixée. La place a été réaffectée à la liste d'attente.
                    </p>
                  </div>
                )}

                {/* WAITLIST ALERT */}
                {(activeApp.status === 'waitlist' || activeApp.status === 'waitlisted') && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1 text-xs">
                    <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Clock className="w-4 h-4 text-indigo-700" />
                      <span>Candidature classée sur Liste d'Attente (Rang #{activeApp.waitlistRank || 1})</span>
                    </div>
                    <p className="text-indigo-800 text-[11px]">
                      En cas de désistement ou de dépassement du délai d'inscription par un candidat admis sur Liste Principale, le système proposera automatiquement votre repêchage au Directeur de structure. Vous recevrez alors une alerte par e-mail et sur cette plateforme.
                    </p>
                  </div>
                )}

                {/* Status Alert: Correction Requested */}
                {activeApp.status === 'correction_requested' && (
                  <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>Demande de correction transmise par l’encadrant ou le CEDoc :</span>
                    </div>
                    <p className="text-xs bg-white/90 p-2.5 rounded border border-rose-100 font-medium">
                      {activeApp.correctionMessage || 'Veuillez téléverser à nouveau les pièces signalées non conformes.'}
                    </p>
                  </div>
                )}

                {/* Status Alert: Rejected */}
                {activeApp.status === 'rejected' && (
                  <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 space-y-1 text-xs">
                    <div className="font-bold flex items-center gap-1.5 text-slate-900">
                      <XCircle className="w-4 h-4 text-slate-600" />
                      <span>Motif officiel et motivé du refus :</span>
                    </div>
                    <p className="text-xs bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                      {activeApp.rejectionReason || 'Capacité d’accueil atteinte ou inadéquation des prérequis techniques.'}
                    </p>
                    {activeApp.decisionBy && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        Décision notifiée par {activeApp.decisionBy} le {formatDate(activeApp.decisionDate || activeApp.submissionDate, language)}
                      </div>
                    )}
                  </div>
                )}

                {/* Academic Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[11px]">CNE / Massar</span>
                    <span className="font-mono font-bold text-slate-800">{activeApp.cne}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CIN</span>
                    <span className="font-mono font-bold text-slate-800">{activeApp.cin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Moyenne Master</span>
                    <span className="font-bold text-slate-900">{activeApp.masterGrade} / 20</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mention</span>
                    <span className="font-bold text-slate-900">{activeApp.masterMention}</span>
                  </div>
                </div>

                {/* Submitted Documents Section with Isolated Piece Replacement */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Pièces justificatives de cette candidature</span>
                  </h4>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {activeApp.documents.map((doc) => {
                      const needsCorrection = doc.status === 'needs_correction';
                      return (
                        <div key={doc.id} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <FileText className={`w-4 h-4 shrink-0 ${needsCorrection ? 'text-rose-600' : 'text-slate-400'}`} />
                            <div>
                              <div className="font-semibold text-slate-800">{doc.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {doc.pages?.length || 1} page(s) · {doc.fileSize}
                                {doc.uploadedAt && ` · déposé le ${doc.uploadedAt}`}
                              </div>
                              {needsCorrection && doc.note && (
                                <div className="text-[11px] font-bold text-rose-700 mt-0.5">
                                  À corriger : {doc.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              needsCorrection
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {needsCorrection ? 'À rectifier' : 'Conforme'}
                            </span>

                            <button
                              type="button"
                              onClick={() => setViewingDocument(doc)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-slate-200"
                              title="Visualiser et examiner le document"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Consulter</span>
                            </button>

                            {needsCorrection && (
                              <button
                                type="button"
                                onClick={() => setCorrectionTargetDoc({
                                  appId: activeApp.id,
                                  category: doc.category,
                                  name: doc.name,
                                })}
                                className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <UploadCloud className="w-3 h-3" />
                                <span>Remplacer cette pièce</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit Trail */}
                {activeApp.history && activeApp.history.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>Historique d’audit officiel du dossier</span>
                    </h4>
                    <div className="space-y-1.5">
                      {activeApp.history.map((h) => (
                        <div key={h.id} className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200/60 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-800">{h.action}</span>
                            <span className="text-slate-400 text-[11px] block">{h.author}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 shrink-0">{h.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: REUSABLE CANDIDATE PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Profil Académique & Civil Réutilisable
              </h3>
              <p className="text-xs text-slate-500">
                Ces informations communes sont automatiquement injectées dans chacune de vos candidatures pour vous éviter toute ressaisie.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOcrOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Scan className="w-4 h-4 text-emerald-700" />
                <span>Remplir via OCR CIN</span>
              </button>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer mon profil</span>
              </button>
            </div>
          </div>

          {profileSavedFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Profil académique réutilisable enregistré avec succès.</span>
            </div>
          )}

          {/* Section 1: Civil Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700" />
              <span>1. Identité Civile & Coordonnées</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Prénom *</label>
                <input
                  type="text"
                  required
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nom de famille *</label>
                <input
                  type="text"
                  required
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">الاسم والنسب بالعربية</label>
                <input
                  type="text"
                  dir="rtl"
                  value={profile.firstNameAr ? `${profile.firstNameAr} ${profile.lastNameAr || ''}` : ''}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    setProfile({ ...profile, firstNameAr: parts[0] || '', lastNameAr: parts.slice(1).join(' ') || '' });
                  }}
                  placeholder="الاسم العائلي والشخصي"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-arabic font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Numéro de CIN *</label>
                <input
                  type="text"
                  required
                  value={profile.cin}
                  onChange={(e) => setProfile({ ...profile, cin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">CNE / Code Massar *</label>
                <input
                  type="text"
                  required
                  value={profile.cne}
                  onChange={(e) => setProfile({ ...profile, cne: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date de naissance *</label>
                <input
                  type="date"
                  required
                  value={profile.birthDate}
                  onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Téléphone *</label>
                <input
                  type="tel"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Adresse e-mail institutionnelle / personnelle</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ville de résidence</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Background */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>2. Parcours Académique (Master & Licences)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="font-semibold text-slate-700">Intitulé du Master ou Diplôme d’Ingénieur *</label>
                <input
                  type="text"
                  required
                  value={profile.masterDegree}
                  onChange={(e) => setProfile({ ...profile, masterDegree: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Université / Établissement *</label>
                <input
                  type="text"
                  required
                  value={profile.masterUniversity}
                  onChange={(e) => setProfile({ ...profile, masterUniversity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Année d’obtention *</label>
                <input
                  type="text"
                  value={profile.masterYear}
                  onChange={(e) => setProfile({ ...profile, masterYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Moyenne générale Master (sur 20) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={profile.masterGrade || ''}
                  onChange={(e) => setProfile({ ...profile, masterGrade: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mention</label>
                <select
                  value={profile.masterMention}
                  onChange={(e) => setProfile({ ...profile, masterMention: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Passable">Passable</option>
                  <option value="Assez Bien">Assez Bien</option>
                  <option value="Bien">Bien</option>
                  <option value="Très Bien">Très Bien</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <label className="font-semibold text-slate-700">Intitulé du Mémoire / Projet de Fin d’Études (PFE)</label>
                <input
                  type="text"
                  value={profile.pfeTitle}
                  onChange={(e) => setProfile({ ...profile, pfeTitle: e.target.value })}
                  placeholder="Titre de votre travail de recherche de master..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications de mon profil</span>
            </button>
          </div>
        </form>
      )}

      {/* Target Document Replacement Modal (Targeting ONLY the requested piece) */}
      {correctionTargetDoc && (
        <DocumentUploadModal
          isOpen={Boolean(correctionTargetDoc)}
          onClose={() => setCorrectionTargetDoc(null)}
          documentCategory={correctionTargetDoc.category}
          documentName={correctionTargetDoc.name}
          onSaveDocument={handleDocumentReplaced}
          language={language}
        />
      )}

      {/* CIN OCR Modal */}
      {isOcrOpen && (
        <CinOcrModal
          isOpen={isOcrOpen}
          onClose={() => setIsOcrOpen(false)}
          onApplyOcr={(data) => {
            setProfile((prev) => ({
              ...prev,
              cin: data.cin,
              firstName: data.firstName || prev.firstName,
              lastName: data.lastName || prev.lastName,
              birthDate: data.birthDate || prev.birthDate,
            }));
          }}
          language={language}
        />
      )}

      {/* Confirmation Modal: Delete Draft */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {isRtl ? 'حذف المسودة' : 'Supprimer le brouillon'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isRtl
                    ? 'هل أنت متأكد من رغبتك في حذف هذه المسودة؟ سيتم حذف جميع المعلومات المدخلة في هذا الترشيح نهائياً.'
                    : 'Voulez-vous vraiment supprimer ce brouillon ? Toutes les informations saisies dans cette candidature seront définitivement supprimées.'}
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  <span className="font-mono font-bold text-slate-900">{draftToDelete.topicCode}</span>
                  <div className="line-clamp-1 text-[11px] text-slate-600 mt-0.5">{draftToDelete.topicTitle}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDraft}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'حذف نهائي' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewerModal
          isOpen={Boolean(viewingDocument)}
          onClose={() => setViewingDocument(null)}
          document={viewingDocument}
          candidateName={activeApp?.candidateName}
        />
      )}

      {/* Temporary Toast Feedback */}
      {deleteDraftFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-800 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteDraftFeedback}</span>
        </div>
      )}
    </div>
  );
};
