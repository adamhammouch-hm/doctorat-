/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * StructureDirectorWorkspace Component — Structure Director Academic Supervision Space
 * 
 * Complies with USMBA GCD Specifications:
 * 1. Validation & Electronic Signature of Thesis Topics proposed by Thesis Directors.
 * 2. Supervision of Admissions, Rankings, and Candidate Decisions.
 * 3. Configuration of the Admission Campaign & Common Registration Deadline (with change history).
 * 4. AUTOMATED WAITLIST ARBITRATION:
 *    - Automatically detects registration deadline expirations.
 *    - Replaces expired candidates with the next eligible candidate from the waitlist.
 *    - Mandatory Director confirmation before any promotion.
 *    - Spot capacity enforcement (never exceed spotsAvailable).
 *    - Interactive 1-click test simulation for instant verification!
 * 5. Standalone Local Data & Backup Management (Export/Restore/Reset).
 */

import React, { useState, useMemo } from 'react';
import { 
  ThesisTopic, 
  CandidateApplication, 
  Language, 
  CampaignConfig, 
  WaitlistPromotionProposal,
  ScientificOpinion
} from '../types';
import { TopicValidationModal } from './TopicValidationModal';
import { ApplicationReviewModal } from './ApplicationReviewModal';
import { AdminConfigService } from '../services/adminConfigService';
import { AdmissionWaitlistService } from '../services/admissionWaitlistService';
import { DataBackupService, StorageStatistics } from '../services/dataBackupService';
import { LocalFileStorage } from '../services/localFileStorage';
import { 
  Building2, 
  FileSignature, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Calendar, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Send, 
  AlertCircle, 
  Award, 
  ListOrdered, 
  RefreshCw,
  Sparkles,
  Info,
  Check,
  X,
  Play,
  Database,
  Download,
  Upload,
  HardDrive,
  Trash2
} from 'lucide-react';

interface StructureDirectorWorkspaceProps {
  topics: ThesisTopic[];
  applications: CandidateApplication[];
  onUpdateApplicationStatus: (
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ) => void;
  onRequestPieceCorrection?: (appId: string, category: string, note: string) => void;
  onSignAndApproveTopic: (topicId: string, comments?: string) => void;
  onRequestTopicRevision: (topicId: string, message: string) => void;
  onRejectTopic: (topicId: string, reason: string) => void;
  onRefreshApplications: () => void;
  currentUserName?: string;
  currentUserEmail?: string;
  language: Language;
}

export const StructureDirectorWorkspace: React.FC<StructureDirectorWorkspaceProps> = ({
  topics,
  applications,
  onUpdateApplicationStatus,
  onRequestPieceCorrection,
  onSignAndApproveTopic,
  onRequestTopicRevision,
  onRejectTopic,
  onRefreshApplications,
  currentUserName = '',
  currentUserEmail = '',
  language: _language,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'topics_validation' | 'admissions' | 'waitlist_automation' | 'campaign' | 'data_management'
  >('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicForValidation, setSelectedTopicForValidation] = useState<ThesisTopic | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);

  // Campaign management
  const [campaign, setCampaign] = useState<CampaignConfig>(() => AdminConfigService.getCampaign());
  const [editDeadlineDate, setEditDeadlineDate] = useState(campaign.registrationDeadline.substring(0, 10));
  const [deadlineChangeReason, setDeadlineChangeReason] = useState('');
  const [campaignSavedNotice, setCampaignSavedNotice] = useState(false);

  // Waitlist proposals state
  const [proposals, setProposals] = useState<WaitlistPromotionProposal[]>(() => 
    AdmissionWaitlistService.getProposals()
  );
  const [proposalActionFeedback, setProposalActionFeedback] = useState<string | null>(null);

  // Local storage & backup management state (100% browser standalone)
  const [storageStats, setStorageStats] = useState<StorageStatistics | null>(null);
  const [backupFeedback, setBackupFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const refreshStorageStats = React.useCallback(() => {
    DataBackupService.getStorageStatistics().then(setStorageStats);
  }, []);

  React.useEffect(() => {
    if (activeTab === 'data_management') {
      refreshStorageStats();
    }
  }, [activeTab, refreshStorageStats]);

  // Counts & stats
  const submittedTopicsCount = topics.filter((t) => t.workflowStatus === 'submitted').length;
  const approvedTopicsCount = topics.filter((t) => t.workflowStatus === 'approved_signed').length;
  const revisionRequestedTopicsCount = topics.filter((t) => t.workflowStatus === 'revision_requested').length;

  const totalApplications = applications.length;
  const admittedCount = applications.filter((a) => a.status === 'admitted' || a.status === 'accepted').length;
  const registrationConfirmedCount = applications.filter((a) => a.status === 'registration_confirmed').length;
  const waitlistedCount = applications.filter((a) => a.status === 'waitlist' || a.status === 'waitlisted').length;
  const cancelledCount = applications.filter((a) => a.status === 'admission_cancelled' || a.status === 'deadline_exceeded').length;
  const pendingProposalsCount = proposals.filter((p) => p.status === 'pending_director_confirmation').length;

  // Filtered topics awaiting validation
  const topicsAwaitingValidation = useMemo(() => {
    return topics.filter((t) => t.workflowStatus === 'submitted' || t.workflowStatus === 'revision_requested');
  }, [topics]);

  // Check deadline expirations automatically
  const handleRunExpirationScan = () => {
    const res = AdmissionWaitlistService.checkAndProcessExpirations(applications, topics);
    setProposals(AdmissionWaitlistService.getProposals());
    onRefreshApplications();
    setProposalActionFeedback(
      `Scan automatique terminé : ${res.expiredCount} délai(s) expiré(s) détecté(s), ${res.newProposalsCount} nouvelle(s) proposition(s) de repêchage soumise(s).`
    );
    setTimeout(() => setProposalActionFeedback(null), 5000);
  };

  // Test simulation: expire test candidate
  const handleSimulateExpiration = (appId: string) => {
    AdmissionWaitlistService.simulateExpireCandidate(appId);
    handleRunExpirationScan();
  };

  // Confirm promotion of a waitlisted candidate
  const handleConfirmPromotion = (proposalId: string) => {
    const res = AdmissionWaitlistService.confirmPromotion(proposalId, currentUserName);
    if (res.success) {
      setProposals(AdmissionWaitlistService.getProposals());
      onRefreshApplications();
      setProposalActionFeedback(
        `Félicitations : La promotion de ${res.promotedCandidateName} a été validée avec succès sur Liste Principale.`
      );
      setTimeout(() => setProposalActionFeedback(null), 5000);
    }
  };

  // Dismiss promotion proposal
  const handleDismissProposal = (proposalId: string) => {
    const res = AdmissionWaitlistService.dismissProposal(
      proposalId,
      currentUserName,
      'Capacité maximale du laboratoire réajustée ou prérequis non conformes.'
    );
    if (res.success) {
      setProposals(AdmissionWaitlistService.getProposals());
      setProposalActionFeedback('Proposition de repêchage rejetée.');
      setTimeout(() => setProposalActionFeedback(null), 4000);
    }
  };

  // Save new campaign deadline
  const handleSaveDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeadlineDate) return;

    const updated = AdminConfigService.updateRegistrationDeadline(
      `${editDeadlineDate}T23:59:59`,
      deadlineChangeReason || 'Ajustement officiel par la Direction de structure',
      currentUserName
    );

    setCampaign(updated);
    setCampaignSavedNotice(true);
    setDeadlineChangeReason('');
    setTimeout(() => setCampaignSavedNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Supervision et arbitrage des candidatures
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunExpirationScan}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            title="Vérifier les dépassements de date limite d'inscription"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Contrôler les délais d'inscription</span>
          </button>
        </div>
      </div>

      {/* Global Alert Feedback if any */}
      {proposalActionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{proposalActionFeedback}</span>
        </div>
      )}

      {/* Pending Waitlist Proposals Alert */}
      {pendingProposalsCount > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-700 shrink-0" />
            <div>
              <span className="font-bold">
                {pendingProposalsCount} proposition(s) de repêchage automatique sur liste d'attente en attente de votre confirmation.
              </span>
              <p className="text-[11px] text-indigo-800">
                Des candidats admis ont dépassé le délai imparti. Le système a calculé les remplaçants admissibles au mérite.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('waitlist_automation')}
            className="px-3.5 py-1.5 rounded-lg font-bold text-white bg-indigo-800 hover:bg-indigo-900 text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Arbitrer les propositions
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Vue d'ensemble
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('topics_validation')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'topics_validation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          <span>Sujets à valider & signer</span>
          {submittedTopicsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
              {submittedTopicsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admissions')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admissions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Admissions & Inscriptions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {admittedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('waitlist_automation')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'waitlist_automation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Gestion de la Liste d'Attente</span>
          {pendingProposalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold animate-pulse">
              {pendingProposalsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'campaign'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Campagne & Délais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data_management')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'data_management'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Données & Sauvegardes Locales</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Sujets à signer</div>
              <div className="text-2xl font-black text-amber-800 mt-1">{submittedTopicsCount}</div>
              <div className="text-[10px] text-amber-600 mt-1">En attente d'arbitrage</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sujets publiés</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{approvedTopicsCount}</div>
              <div className="text-[10px] text-emerald-600 mt-1">Signés électroniquement</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Candidatures</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalApplications}</div>
              <div className="text-[10px] text-slate-500 mt-1">Tous sujets confondus</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Admis officiels</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{admittedCount}</div>
              <div className="text-[10px] text-emerald-600 mt-1">Liste Principale</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Inscrits confirmés</div>
              <div className="text-2xl font-black text-blue-800 mt-1">{registrationConfirmedCount}</div>
              <div className="text-[10px] text-blue-600 mt-1">Dossiers finalisés</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Délais dépassés</div>
              <div className="text-2xl font-black text-rose-800 mt-1">{cancelledCount}</div>
              <div className="text-[10px] text-rose-600 mt-1">Admissions révoquées</div>
            </div>
          </div>

          {/* Quick Review Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sujets à signer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-emerald-700" />
                  <span>Sujets nécessitant votre signature ({topicsAwaitingValidation.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('topics_validation')}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Voir tout
                </button>
              </div>

              {topicsAwaitingValidation.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  Aucun sujet en attente de signature.
                </div>
              ) : (
                <div className="space-y-2">
                  {topicsAwaitingValidation.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{topic.code} · {topic.professorName}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{topic.title}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTopicForValidation(topic)}
                        className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-900 cursor-pointer shrink-0"
                      >
                        Examiner & Signer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Délais d'inscription & Alertes */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Délai d'inscription officiel en cours</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('campaign')}
                  className="text-xs font-bold text-emerald-800 hover:underline"
                >
                  Modifier le délai
                </button>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Échéance commune fixée :</span>
                  <strong className="text-emerald-950 font-mono">
                    {new Date(campaign.registrationDeadline).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Délai accordé aux candidats repêchés :</span>
                  <strong className="text-emerald-950">{campaign.registrationDaysAllowed} jours ouvrés</strong>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between text-[11px]">
                  <span>Inscriptions finalisées : {registrationConfirmedCount}/{admittedCount}</span>
                  <span className="font-bold text-emerald-800">
                    {admittedCount > 0 ? Math.round((registrationConfirmedCount / admittedCount) * 100) : 0}% complété
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOPICS VALIDATION & SIGNATURE */}
      {activeTab === 'topics_validation' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Circuit de validation et signature électronique des sujets de thèse
            </h3>
            <p className="text-xs text-slate-500">
              En tant que Directeur de structure, vous contrôlez la conformité des prérequis, demandez des modifications au Directeur de thèse ou apposez votre signature électronique certifiée pour autoriser la publication officielle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {topics.map((topic) => {
              const isApproved = topic.workflowStatus === 'approved_signed';
              const isSubmitted = topic.workflowStatus === 'submitted';
              const isRevision = topic.workflowStatus === 'revision_requested';

              return (
                <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {topic.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        Proposé par : <strong>{topic.professorName}</strong> ({topic.laboratory})
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRevision
                        ? 'bg-amber-100 text-amber-800'
                        : isSubmitted
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isApproved ? 'Signé & Publié' : isRevision ? 'Révision en attente de l’enseignant' : isSubmitted ? 'À valider & signer' : topic.workflowStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{topic.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {topic.scientificDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span><strong>Places :</strong> {topic.spotsAvailable}</span>
                    <span><strong>Financement :</strong> {topic.fundingType || 'Non spécifié'}</span>
                    <span><strong>Établissement :</strong> {topic.institution}</span>
                    <span><strong>Date limite :</strong> {topic.submissionDeadline}</span>
                  </div>

                  {topic.electronicSignature && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Signature Électronique Validée (Horodatage certifié interne)</span>
                      </div>
                      <div>Signataire : {topic.electronicSignature.signerName} ({topic.electronicSignature.signerRole})</div>
                      <div className="font-mono text-[10px] text-emerald-800">Empreinte : {topic.electronicSignature.signatureFingerprint}</div>
                      <div className="italic text-emerald-800">"{topic.electronicSignature.comments}"</div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTopicForValidation(topic)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>{isApproved ? 'Consulter la signature' : 'Examiner, Réviser ou Signer'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ADMISSIONS & INSCRIPTIONS */}
      {activeTab === 'admissions' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Supervision des résultats d'admission et suivi des inscriptions
            </h3>
            <p className="text-xs text-slate-500">
              Consultez les résultats transmis par les directeurs de thèse, supervisez les candidats retenus et surveillez le respect des délais d'inscription.
            </p>
          </div>

          {/* Table of Candidates */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidat</th>
                    <th className="py-3 px-4">Sujet & Directeur</th>
                    <th className="py-3 px-4">Classement / Statut</th>
                    <th className="py-3 px-4">Date limite d'inscription</th>
                    <th className="py-3 px-4">État de l'inscription</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const isAdmitted = app.status === 'admitted' || app.status === 'accepted';
                    const isConfirmed = app.status === 'registration_confirmed';
                    const isCancelled = app.status === 'admission_cancelled' || app.status === 'deadline_exceeded';
                    const isWaitlist = app.status === 'waitlist' || app.status === 'waitlisted';

                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{app.candidateName}</div>
                          <div className="text-[11px] text-slate-500">{app.candidateEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800">{app.topicCode}</span>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{app.topicTitle}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAdmitted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWaitlist
                              ? 'bg-indigo-100 text-indigo-800'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isAdmitted ? 'Admis (LP)' : isWaitlist ? `Liste d'Attente (Rang ${app.waitlistRank || 1})` : isCancelled ? 'Admission annulée' : app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {app.registrationDeadline ? (
                            <span className="font-mono text-[11px] text-slate-800">
                              {new Date(app.registrationDeadline).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Non fixé</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Inscription validée</span>
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Délai forclos</span>
                            </span>
                          ) : isAdmitted ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>En attente de finalisation</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmitted && !isConfirmed && (
                              <button
                                type="button"
                                onClick={() => handleSimulateExpiration(app.id)}
                                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[10px] cursor-pointer"
                                title="Simuler l'expiration de la date limite pour déclencher le repêchage"
                              >
                                Simuler dépassement délai
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedApplication(app)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
                            >
                              Dossier
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTOMATIC WAITLIST MANAGEMENT */}
      {activeTab === 'waitlist_automation' && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <span>Moteur automatique de gestion de la liste d'attente</span>
              </h3>
              <button
                type="button"
                onClick={handleRunExpirationScan}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Exécuter le scan des délais</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lorsqu'un candidat admis ne réalise pas son inscription avant la date limite, le système révoque son admission, consulte le classement et propose automatiquement le candidat suivant sur liste d'attente. <strong>La promotion requiert obligatoirement votre confirmation formelle</strong> avant que le candidat ne reçoive sa notification et son nouveau délai d'inscription.
            </p>
          </div>

          {/* Pending Proposals Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Propositions soumises à votre arbitrage</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                {pendingProposalsCount}
              </span>
            </h4>

            {pendingProposalsCount === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-sm font-bold text-slate-800">Aucune proposition en attente</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tous les candidats admis sont dans leurs délais d'inscription ou ont déjà été confirmés. Vous pouvez tester le mécanisme en simulant un dépassement de délai dans l'onglet « Admissions ».
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.filter((p) => p.status === 'pending_director_confirmation').map((prop) => (
                  <div key={prop.id} className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded mr-2">
                          {prop.topicCode}
                        </span>
                        <strong className="text-sm text-slate-900">{prop.topicTitle}</strong>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Confirmation du Directeur requise
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Left: Cancelled Candidate */}
                      <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                        <div className="font-bold text-rose-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>Admission révoquée (Délai dépassé)</span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{prop.cancelledCandidateName}</div>
                        <div className="text-[11px] text-slate-600">{prop.cancelledCandidateEmail}</div>
                        <div className="text-[11px] text-rose-800 italic pt-1">
                          Motif : {prop.cancelledReason}
                        </div>
                      </div>

                      {/* Right: Proposed Replacement Candidate */}
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                        <div className="font-bold text-emerald-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Candidat suivant proposé au repêchage</span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {prop.proposedCandidateName} (Liste d'Attente Rang #{prop.proposedWaitlistRank})
                        </div>
                        <div className="text-[11px] text-slate-600">{prop.proposedCandidateEmail}</div>
                        <div className="text-[11px] text-emerald-800 pt-1">
                          Nouveau délai d'inscription qui sera alloué : <strong>{new Date(prop.newRegistrationDeadline).toLocaleDateString('fr-FR')}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500">
                        La promotion est conforme au classement du jury et respecte la capacité d'accueil.
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDismissProposal(prop.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                        >
                          Refuser la proposition
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmPromotion(prop.id)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmer l'admission officielle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Proposals History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Historique des arbitrages de listes d'attente
            </h4>
            {proposals.filter((p) => p.status !== 'pending_director_confirmation').length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs italic">
                Aucun arbitrage archivé.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {proposals.filter((p) => p.status !== 'pending_director_confirmation').map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-slate-800 mr-2">{p.topicCode}</span>
                      <span>Promotion de <strong>{p.proposedCandidateName}</strong> (Remplaçant de {p.cancelledCandidateName})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status === 'confirmed' ? 'Confirmé par Directeur' : 'Rejeté'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CAMPAIGN & DEADLINE SETTINGS */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fixation et révision de la date limite d'inscription administrative
              </h3>
              <p className="text-xs text-slate-500">
                En tant que Directeur de structure, vous pouvez modifier l'échéance commune accordée aux candidats admis. Tout ajustement est automatiquement archivé avec sa date et son motif réglementaire.
              </p>
            </div>

            {campaignSavedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>La nouvelle date limite a été enregistrée avec succès dans l'historique officiel.</span>
              </div>
            )}

            <form onSubmit={handleSaveDeadline} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date limite d'inscription commune *</label>
                  <input
                    type="date"
                    required
                    value={editDeadlineDate}
                    onChange={(e) => setEditDeadlineDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Délai accordé aux candidats repêchés (Jours ouvrés) *</label>
                  <input
                    type="number"
                    min={3}
                    max={30}
                    value={campaign.registrationDaysAllowed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 10;
                      AdminConfigService.updateCampaign({ registrationDaysAllowed: val });
                      setCampaign(AdminConfigService.getCampaign());
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Motif de la modification (Archivé dans l'historique) *</label>
                <input
                  type="text"
                  required
                  value={deadlineChangeReason}
                  onChange={(e) => setDeadlineChangeReason(e.target.value)}
                  placeholder="Ex: Prorogation exceptionnelle accordée par le conseil du CEDoc suite à la session de rattrapage"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-800 hover:bg-emerald-900 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Enregistrer la nouvelle date limite et notifier les candidats</span>
              </button>
            </form>

            {/* Deadline modification history */}
            {campaign.deadlineHistory && campaign.deadlineHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Historique des modifications de dates limites
                </h4>
                <div className="space-y-2">
                  {campaign.deadlineHistory.map((h, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Échéance portée au {new Date(h.newDeadline).toLocaleDateString('fr-FR')} (Initialement : {new Date(h.previousDeadline).toLocaleDateString('fr-FR')})</span>
                        <span className="text-slate-400 font-normal">{h.date}</span>
                      </div>
                      <div className="text-slate-600">Par : {h.modifiedBy} · Motif : "{h.reason}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DATA MANAGEMENT & LOCAL BACKUP (100% STANDALONE BROWSER) */}
      {activeTab === 'data_management' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Données & Sauvegardes Locales (Architecture 100% Autonome)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stockage local dans le navigateur (localStorage &amp; IndexedDB) — Zéro dépendance cloud, zéro abonnement, aucun coût externe.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Mode Autonome Actif</span>
              </div>
            </div>

            {/* Feedback alert */}
            {backupFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  backupFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : backupFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {backupFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{backupFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBackupFeedback(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Storage Statistics Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Statistiques du Stockage Local</span>
                </h4>
                <button
                  type="button"
                  onClick={refreshStorageStats}
                  className="text-[11px] text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualiser</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Sujets de thèse</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats ? storageStats.topicsCount : topics.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {storageStats ? `${storageStats.userCreatedTopicsCount} créés localement` : 'Catalogue complet'}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Candidatures</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats ? storageStats.applicationsCount : applications.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dossiers et pièces</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Comptes utilisateurs</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats ? storageStats.usersCount : 3}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">3 profils distincts</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Notifications in-app</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats ? storageStats.notificationsCount : 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Historique local</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">Volume localStorage</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats
                      ? `${(storageStats.localStorageApproxBytes / 1024).toFixed(1)} Ko`
                      : 'Calcul en cours...'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">États &amp; métadonnées</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] text-slate-500 font-medium">IndexedDB (Pièces)</div>
                  <div className="text-lg font-bold text-slate-900 mt-1">
                    {storageStats
                      ? `${(storageStats.indexedDbBytes / (1024 * 1024)).toFixed(2)} Mo`
                      : '0.0 Mo'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {storageStats ? `${storageStats.indexedDbFilesCount} fichier(s)` : '0 fichier'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Tools: Export, Restore, Reset */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Opérations de Sauvegarde et Portabilité
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Export */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>Exporter une Sauvegarde (JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Télécharge l'intégralité des sujets, dossiers de candidatures, évaluations, décisions et comptes dans un fichier JSON horodaté.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        DataBackupService.exportBackupToFile();
                        setBackupFeedback({
                          type: 'success',
                          message: 'Fichier de sauvegarde exporté avec succès dans vos téléchargements.',
                        });
                      } catch (e: any) {
                        setBackupFeedback({
                          type: 'error',
                          message: e?.message || 'Erreur lors de l’export',
                        });
                      }
                    }}
                    className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger la Sauvegarde</span>
                  </button>
                </div>

                {/* 2. Import / Restore */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-sky-700" />
                      <span>Restaurer une Sauvegarde (JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Charge un fichier de sauvegarde précédemment exporté et rétablit l'état complet de l'application dans ce navigateur.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          const res = await DataBackupService.restoreBackupFromJSON(text);
                          if (res.success) {
                            setBackupFeedback({
                              type: 'success',
                              message: `${res.message} (${res.counts?.topics} sujets, ${res.counts?.applications} candidatures, ${res.counts?.users} comptes).`,
                            });
                            refreshStorageStats();
                            onRefreshApplications();
                            // Optional reload to refresh all views cleanly
                            setTimeout(() => window.location.reload(), 1200);
                          } else {
                            setBackupFeedback({
                              type: 'error',
                              message: res.message,
                            });
                          }
                        } catch (err: any) {
                          setBackupFeedback({
                            type: 'error',
                            message: `Erreur d'import : ${err?.message || 'Fichier invalide'}`,
                          });
                        }
                        // Reset input
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Choisir un Fichier JSON</span>
                    </button>
                  </div>
                </div>

                {/* 3. Reset Demo Seeds */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-amber-700" />
                      <span>Réinitialiser aux Données Initiales</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Remet à zéro l'ensemble des données pour retrouver l'état initial officiel de la démonstration universitaire.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réinitialiser la Démo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Technical Disclaimers & Integrity Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-600">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Transparence Technique et Règles d'Exécution Locale</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>
                  <strong>Authentification locale :</strong> Les sessions et mots de passe sont validés directement dans le bac à sable de votre navigateur (ne constitue pas un serveur d'authentification d'entreprise).
                </li>
                <li>
                  <strong>Stockage des documents :</strong> Les pièces jointes sont conservées dans la base IndexedDB locale du navigateur avec une limite recommandée de 5 Mo par document, évitant tout dépassement du quota localStorage.
                </li>
                <li>
                  <strong>Notifications internes :</strong> Les alertes générées par le système (validation de sujet, avis d'admission, proposition de liste d'attente) sont des notifications in-app locales, et non des emails SMTP expédiés sur internet.
                </li>
                <li>
                  <strong>Zéro coût :</strong> Cette plateforme fonctionne de manière totalement autonome sans aucun service externe ni abonnement payant.
                </li>
              </ul>
            </div>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Confirmer la réinitialisation ?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Toutes les modifications locales seront remplacées par les données de démonstration initiales.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Les 3 comptes officiels, les 10 sujets de recherche initiaux et les candidatures de test seront réinitialisés. Pensez à exporter une sauvegarde JSON si vous souhaitez conserver vos saisies.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowResetModal(false);
                      await DataBackupService.resetToDemoSeeds();
                      setBackupFeedback({
                        type: 'success',
                        message: 'Plateforme réinitialisée avec succès aux données initiales de démonstration.',
                      });
                      refreshStorageStats();
                      onRefreshApplications();
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-lg cursor-pointer"
                  >
                    Confirmer la Réinitialisation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Topic Validation Modal */}
      {selectedTopicForValidation && (
        <TopicValidationModal
          isOpen={Boolean(selectedTopicForValidation)}
          onClose={() => setSelectedTopicForValidation(null)}
          topic={selectedTopicForValidation}
          onSignAndApprove={(topicId, comments) => onSignAndApproveTopic(topicId, comments)}
          onRequestRevision={(topicId, msg) => onRequestTopicRevision(topicId, msg)}
          onRejectTopic={(topicId, reason) => onRejectTopic(topicId, reason)}
          signerName={currentUserName}
          signerEmail={currentUserEmail}
          language="fr"
        />
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <ApplicationReviewModal
          application={selectedApplication}
          isOpen={Boolean(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={onUpdateApplicationStatus}
          onRequestPieceCorrection={onRequestPieceCorrection}
          currentUser={currentUserName}
          language="fr"
        />
      )}
    </div>
  );
};
