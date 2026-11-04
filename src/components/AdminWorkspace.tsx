/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AdminWorkspace Component — Central Administration CEDoc / Pôle Doctoral USMBA
 * Features:
 * - Dossier oversight across all faculties & laboratories
 * - Supervision & validation of Topics GCD Workflow (Structure -> CEDoc -> Pôle)
 * - Campaign & Academic Year Configuration
 * - USMBA Institutions & Laboratories Directory
 * - Mandatory Documents Checklist Configuration
 * - Physical Documents Verification & Official Counter Stamping
 * - Role-Based Access Control (RBAC) & User Accounts Management
 * - Real Security & Architectural Audit Transparency Report
 */

import React, { useState, useMemo } from 'react';
import { 
  ThesisTopic, 
  CandidateApplication, 
  Language, 
  AuthAccount, 
  AppRole, 
  AppUser,
  CampaignConfig,
  RequiredDocumentConfig,
  ScientificOpinion
} from '../types';
import { ApplicationReviewModal } from './ApplicationReviewModal';
import { AuthService } from '../services/authService';
import { 
  AdminConfigService, 
  DEFAULT_CAMPAIGN, 
  REAL_SECURITY_AUDIT 
} from '../services/adminConfigService';
import { NotificationService } from '../services/notificationService';
import { 
  Shield, 
  Search, 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Building2,
  Calendar,
  Layers,
  FileText,
  Lock,
  Check,
  Cpu,
  Info,
  Server,
  Cloud,
  Mail,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AdminWorkspaceProps {
  topics: ThesisTopic[];
  applications: CandidateApplication[];
  onUpdateApplicationStatus: (
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ) => void;
  onMarkPhysicalReception: (appId: string, agentName: string, verifiedOriginals: string[]) => void;
  onSaveScientificOpinion?: (appId: string, opinion: ScientificOpinion) => void;
  language: Language;
}

const ADMIN_AGENT_NAME = 'M. Rachid Bennani (Chef de Service CEDoc)';

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  topics,
  applications,
  onUpdateApplicationStatus,
  onMarkPhysicalReception,
  onSaveScientificOpinion,
  language: _language,
}) => {
  const [activeTab, setActiveTab] = useState<
    'stalled' | 'all' | 'reception' | 'topics_workflow' | 'campaign' | 'institutions_labs' | 'documents_config' | 'accounts' | 'security_audit'
  >('stalled');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);

  // Accounts management state
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => AuthService.getAccounts());
  const [roleChangeFeedback, setRoleChangeFeedback] = useState<string | null>(null);

  // Campaign management state
  const [campaign, setCampaign] = useState<CampaignConfig>(() => AdminConfigService.getCampaign());
  const [campaignSavedNotice, setCampaignSavedNotice] = useState(false);

  // Documents requirements state
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocumentConfig[]>(() => 
    AdminConfigService.getRequiredDocuments()
  );

  // Institutions & Laboratories
  const institutions = AdminConfigService.getInstitutions();
  const laboratories = AdminConfigService.getLaboratories();

  // Topic workflow overrides
  const [topicWorkflowOverrides, setTopicWorkflowOverrides] = useState<Record<string, any>>(() => 
    AdminConfigService.getTopicOverrides()
  );

  // Stats
  const totalApplications = applications.length;
  const stalledCount = applications.filter((a) => a.status === 'correction_requested' || a.status === 'incomplete').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
  const physicallyVerifiedCount = applications.filter((a) => a.physicalReception?.received).length;

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = app.candidateName.toLowerCase().includes(q) ||
          app.cne.toLowerCase().includes(q) ||
          app.topicCode.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (activeTab === 'stalled') {
        return app.status === 'correction_requested' || app.status === 'incomplete';
      }
      if (activeTab === 'reception') {
        return app.status === 'accepted';
      }
      return true;
    });
  }, [applications, searchQuery, activeTab]);

  const handleQuickPhysicalReception = (app: CandidateApplication) => {
    const originals = ['Baccalauréat original', 'Diplôme de Master original', 'Relevés de notes officiels'];
    onMarkPhysicalReception(app.id, ADMIN_AGENT_NAME, originals);
  };

  const handleRoleChange = (accountId: string, newRole: AppRole) => {
    const adminUser: AppUser = {
      id: 'user-admin-01',
      name: 'M. Rachid Bennani',
      email: 'rachid.bennani@usmba.ac.ma',
      role: 'admin',
    };

    const res = AuthService.updateAccountRole(adminUser, accountId, newRole);
    if (res.success) {
      setAccounts(AuthService.getAccounts());
      setRoleChangeFeedback(`Rôle mis à jour avec succès : attribué à ${newRole.toUpperCase()}.`);
      setTimeout(() => setRoleChangeFeedback(null), 3500);
    }
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    AdminConfigService.saveCampaign(campaign);
    setCampaignSavedNotice(true);
    setTimeout(() => setCampaignSavedNotice(false), 3000);
  };

  const handleToggleDoc = (docId: string) => {
    const updated = AdminConfigService.toggleDocumentMandatory(docId);
    setRequiredDocs(updated);
  };

  const handleApproveTopicStep = (topicId: string, step: 'structure' | 'centre' | 'pole') => {
    AdminConfigService.updateTopicWorkflowStep(topicId, step, 'valid', ADMIN_AGENT_NAME, 'Validation confirmée par le CEDoc');
    setTopicWorkflowOverrides(AdminConfigService.getTopicOverrides());
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Centre d’Études Doctorales (CEDoc) · Administration Centrale USMBA
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-800" />
            <span>Portail d’Administration & Gouvernance Doctorale</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision académique, circuit GCD, calendrier des campagnes et sécurité réelle.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2 self-start sm:self-auto">
          <ShieldAlert className="w-4 h-4 text-emerald-800" />
          <span>Habilitation : <strong>{ADMIN_AGENT_NAME}</strong></span>
        </div>
      </div>

      {/* 4 Summary Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all space-y-1 ${
            activeTab === 'all' ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total candidatures</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalApplications}</div>
          <div className="text-[11px] text-slate-400">Toutes structures confondues</div>
        </div>

        <div 
          onClick={() => setActiveTab('stalled')}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all space-y-1 ${
            activeTab === 'stalled' ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-amber-300 hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Dossiers à débloquer</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{stalledCount}</div>
          <div className="text-[11px] text-amber-700">Corrections ou pièces manquantes</div>
        </div>

        <div 
          onClick={() => setActiveTab('reception')}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all space-y-1 ${
            activeTab === 'reception' ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-white border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
            <span>Originaux vérifiés</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">{physicallyVerifiedCount} / {acceptedCount}</div>
          <div className="text-[11px] text-emerald-700">Admis avec contrôle au guichet</div>
        </div>

        <div 
          onClick={() => setActiveTab('topics_workflow')}
          className={`p-4 rounded-xl border shadow-2xs cursor-pointer transition-all space-y-1 ${
            activeTab === 'topics_workflow' ? 'bg-slate-100 border-slate-700 ring-1 ring-slate-700' : 'bg-white border-slate-200 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-600 text-xs font-medium">
            <span>Sujets & Circuit GCD</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{topics.length}</div>
          <div className="text-[11px] text-slate-400">Validation 3 niveaux</div>
        </div>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('stalled')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stalled'
              ? 'border-b-2 border-amber-600 text-amber-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Dossiers à corriger ({stalledCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Toutes candidatures ({totalApplications})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reception')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'reception'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Guichet CEDoc (Originaux)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('topics_workflow')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'topics_workflow'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Circuit Sujets (GCD)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('campaign')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'campaign'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Campagne & Année
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('institutions_labs')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'institutions_labs'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Établissements & Labos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents_config')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'documents_config'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Pièces exigées
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Comptes & Rôles ({accounts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security_audit')}
          className={`pb-2.5 px-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'security_audit'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-700" />
          <span>Audit & Sécurité Réelle</span>
        </button>
      </div>

      {/* TAB 1 & 2: DOSSIERS (STALLED & ALL) */}
      {(activeTab === 'stalled' || activeTab === 'all' || activeTab === 'reception') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par candidat, CNE, code sujet..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="text-xs text-slate-500">
              {filteredApplications.length} dossier(s) affiché(s)
            </div>
          </div>

          <div className="space-y-2">
            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Aucun dossier dans cette catégorie.
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{app.candidateName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">CNE : {app.cne}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">CIN : {app.cin}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'correction_requested' ? 'bg-amber-100 text-amber-900' :
                        app.status === 'incomplete' ? 'bg-purple-100 text-purple-900' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-900' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status === 'accepted' ? 'Admis (LP)' :
                         app.status === 'waitlisted' ? `Liste d'Attente (Rang ${app.waitlistRank || 1})` :
                         app.status === 'correction_requested' ? 'Correction demandée' :
                         app.status === 'incomplete' ? 'Dossier incomplet' :
                         app.status === 'rejected' ? 'Non retenu' : 'À examiner'}
                      </span>
                    </div>

                    <div className="text-slate-600">
                      Sujet : <strong className="text-slate-800">{app.topicCode}</strong> — {app.topicTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Cursus : {app.masterDegree} ({app.masterGrade.toFixed(2)}/20)</span>
                      <span>·</span>
                      <span>Déposé le {app.submissionDate}</span>
                      {app.physicalReception?.received && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Originaux vérifiés au guichet ({app.physicalReception.date})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {activeTab === 'reception' && !app.physicalReception?.received && (
                      <button
                        type="button"
                        onClick={() => handleQuickPhysicalReception(app)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs"
                      >
                        Estampiller guichet
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedApplication(app)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs"
                    >
                      Examiner
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CIRCUIT GCD VALIDATION WORKFLOW */}
      {activeTab === 'topics_workflow' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Supervision du circuit officiel GCD (Guide page 7 à 12) :</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chaque sujet de thèse doit être visé successivement par le Directeur du Laboratoire (Structure), le Conseil du CEDoc (Établissement) et le Pôle Doctoral (Présidence) avant publication officielle.
            </p>
          </div>

          <div className="space-y-3">
            {topics.map((t) => {
              const overrides = topicWorkflowOverrides[t.id] || {};
              const structureStatus = overrides.structure?.status || t.workflow.structure.status;
              const centreStatus = overrides.centre?.status || t.workflow.centre.status;
              const poleStatus = overrides.pole?.status || t.workflow.pole.status;

              return (
                <div key={t.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {t.code}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Encadrant : <strong>{t.professorName}</strong>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{t.title}</h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.laboratory} · {t.institution}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        t.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status === 'open' ? 'Publié au concours' : 'En examen'}
                      </span>
                    </div>
                  </div>

                  {/* 3 Steps Control */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    {/* Step 1 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                        <span>1. Structure (Labo)</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          structureStatus === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {structureStatus === 'valid' ? 'Validé' : 'En attente'}
                        </span>
                      </div>
                      {structureStatus !== 'valid' && (
                        <button
                          type="button"
                          onClick={() => handleApproveTopicStep(t.id, 'structure')}
                          className="w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                        >
                          Viser comme Directeur Labo
                        </button>
                      )}
                    </div>

                    {/* Step 2 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                        <span>2. Conseil du CEDoc</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          centreStatus === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {centreStatus === 'valid' ? 'Validé' : 'En attente'}
                        </span>
                      </div>
                      {centreStatus !== 'valid' && (
                        <button
                          type="button"
                          onClick={() => handleApproveTopicStep(t.id, 'centre')}
                          className="w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                        >
                          Viser au nom du CEDoc
                        </button>
                      )}
                    </div>

                    {/* Step 3 */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                        <span>3. Pôle Doctoral Central</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          poleStatus === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {poleStatus === 'valid' ? 'Validé' : 'En attente'}
                        </span>
                      </div>
                      {poleStatus !== 'valid' && (
                        <button
                          type="button"
                          onClick={() => handleApproveTopicStep(t.id, 'pole')}
                          className="w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 cursor-pointer"
                        >
                          Autoriser publication
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CAMPAGNE & ANNEE UNIVERSITAIRE */}
      {activeTab === 'campaign' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Paramétrage du Calendrier Officiel du Cycle Doctoral USMBA :</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Régule les dates d'ouverture/fermeture des candidatures, des délibérations des commissions et de la date butoir de dépôt physique des originaux.
            </p>
          </div>

          {campaignSavedNotice && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Calendrier de la campagne mis à jour et sauvegardé.</span>
            </div>
          )}

          <form onSubmit={handleSaveCampaign} className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Intitulé de la campagne *</label>
                <input
                  type="text"
                  value={campaign.title}
                  onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Année universitaire *</label>
                <input
                  type="text"
                  value={campaign.academicYear}
                  onChange={(e) => setCampaign({ ...campaign, academicYear: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date d’ouverture des candidatures</label>
                <input
                  type="date"
                  value={campaign.openingDate}
                  onChange={(e) => setCampaign({ ...campaign, openingDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date limite de dépôt dématérialisé</label>
                <input
                  type="date"
                  value={campaign.closingDate}
                  onChange={(e) => setCampaign({ ...campaign, closingDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date des délibérations des commissions</label>
                <input
                  type="date"
                  value={campaign.deliberationDate}
                  onChange={(e) => setCampaign({ ...campaign, deliberationDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date butoir de dépôt physique des originaux au guichet</label>
                <input
                  type="date"
                  value={campaign.physicalDepositDeadline}
                  onChange={(e) => setCampaign({ ...campaign, physicalDepositDeadline: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre maximal de sujets par candidat (Panier)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={campaign.maxApplicationsPerCandidate}
                  onChange={(e) => setCampaign({ ...campaign, maxApplicationsPerCandidate: parseInt(e.target.value, 10) || 3 })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">État de la session</label>
                <select
                  value={campaign.status}
                  onChange={(e) => setCampaign({ ...campaign, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="active">Active (Candidatures ouvertes)</option>
                  <option value="upcoming">À venir (En préparation)</option>
                  <option value="closed">Clôturée (Sélection terminée)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs cursor-pointer"
              >
                Enregistrer la configuration de la campagne
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: ETABLISSEMENTS & LABORATOIRES */}
      {activeTab === 'institutions_labs' && (
        <div className="space-y-5">
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Répertoire Institutionnel de l’Université Sidi Mohamed Ben Abdellah :</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cartographie des établissements (Facultés & Écoles) et de leurs structures de recherche affiliées habilitées pour les thèses de doctorat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Institutions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-800" />
                <span>Établissements & CEDocs ({institutions.length})</span>
              </h3>

              <div className="space-y-2">
                {institutions.map((inst) => (
                  <div key={inst.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{inst.name}</strong>
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {inst.code}
                      </span>
                    </div>
                    {inst.nameAr && <div className="text-[11px] text-slate-500 font-arabic text-right">{inst.nameAr}</div>}
                    <div className="text-[11px] text-slate-500">{inst.cedocName} · {inst.city}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Laboratories */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-800" />
                <span>Structures de Recherche ({laboratories.length})</span>
              </h3>

              <div className="space-y-2">
                {laboratories.map((lab) => (
                  <div key={lab.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{lab.name}</strong>
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {lab.code} ({lab.institutionCode})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">Directeur : <strong>{lab.directorName}</strong></div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {lab.researchAxes.map((axe, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                          {axe}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PIECES EXIGEES */}
      {activeTab === 'documents_config' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Configuration de la Liste des Pièces Justificatives Exigées :</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Activez ou désactivez le caractère obligatoire des pièces pour la session active. Tout dossier déposé sans pièce obligatoire sera classé "Incomplet".
            </p>
          </div>

          <div className="space-y-2.5">
            {requiredDocs.map((doc) => (
              <div 
                key={doc.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{doc.label}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.mandatory ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {doc.mandatory ? 'Obligatoire' : 'Facultatif'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{doc.description}</p>
                  <div className="text-[10px] text-slate-400">
                    Formats autorisés : {doc.allowedFormats.join(', ').toUpperCase()} · Taille max : {doc.maxSizeMb} Mo
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleDoc(doc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      doc.mandatory 
                        ? 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200' 
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {doc.mandatory ? 'Rendre facultatif' : 'Rendre obligatoire'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: GESTION DES COMPTES & RBAC */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Contrôle d'Accès Basé sur les Rôles (RBAC) :</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Seuls les administrateurs CEDoc habilités peuvent élever un compte au rôle d'Encadrant ou d'Administrateur. Tout compte créé par un candidat reste strictement isolé dans l'espace candidat.
            </p>
          </div>

          {roleChangeFeedback && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{roleChangeFeedback}</span>
            </div>
          )}

          <div className="space-y-2">
            {accounts.map((acc) => (
              <div 
                key={acc.id}
                className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">{acc.name}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      acc.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      acc.role === 'professor' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {acc.role === 'admin' ? 'Administration CEDoc' :
                       acc.role === 'professor' ? 'Professeur / Encadrant' :
                       'Candidat'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.email}</div>
                  <div className="text-[10px] text-slate-400">Inscrit le {acc.createdAt}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-[11px] text-slate-500">Attribuer rôle :</span>
                  <select
                    value={acc.role}
                    onChange={(e) => handleRoleChange(acc.id, e.target.value as AppRole)}
                    className="p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                  >
                    <option value="candidate">Candidat</option>
                    <option value="professor">Professeur / Encadrant</option>
                    <option value="admin">Administrateur CEDoc</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT & SECURITE REELLE (TRANSPARENCE ARCHITECTURALE) */}
      {activeTab === 'security_audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>Rapport de Transparence Architecturale & Sécurité Réelle</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Conformément aux directives de qualité technique, ce rapport distingue rigoureusement les composants reliés à un serveur réel, 
              ceux exécutés dans le navigateur du client (localStorage), les flux simulés et les configurations externes nécessaires pour un déploiement institutionnel complet.
            </p>
          </div>

          <div className="space-y-3">
            {REAL_SECURITY_AUDIT.map((item, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <strong className="text-slate-900 text-sm flex items-center gap-1.5">
                    {item.status === 'online' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {item.status === 'local_storage' && <Cpu className="w-4 h-4 text-blue-600" />}
                    {item.status === 'simulated' && <Mail className="w-4 h-4 text-amber-600" />}
                    {item.component}
                  </strong>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.status === 'online' ? 'bg-emerald-100 text-emerald-800' :
                    item.status === 'local_storage' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'online' ? 'Connecté Serveur' :
                     item.status === 'local_storage' ? 'Exécution Locale (Navigateur)' :
                     'Simulation Transparente'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 font-semibold block">Environnement d’exécution :</span>
                    <span className="text-slate-700">{item.executionEnvironment}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-slate-400 font-semibold block">Diagnostic de sécurité :</span>
                    <span className="text-slate-700">{item.securityVerdict}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                  <strong>Contrainte serveur :</strong> {item.serverConstraintNotice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal for Selected Application */}
      {selectedApplication && (
        <ApplicationReviewModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={onUpdateApplicationStatus}
          onSaveScientificOpinion={onSaveScientificOpinion}
          currentUser={ADMIN_AGENT_NAME}
          language="fr"
        />
      )}
    </div>
  );
};
