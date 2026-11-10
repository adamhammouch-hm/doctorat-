/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DOCTORAT USMBA — Plateforme de Gestion du Cycle Doctoral (Phase 2)
 * Navigation épurée avec accès authentifié aux 3 espaces privés :
 * 1. Espace Candidat (Profil réutilisable, 5 étapes de candidature, gestion des pièces)
 * 2. Espace Professeur / Encadrant (Supervision unifiée, demandes de correction de pièces ciblées)
 * 3. Espace Administrateur CEDoc (Gestion des habilitations RBAC, registre originaux, déblocage)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Language, 
  ThesisTopic, 
  TopicFilters, 
  CandidateApplication,
  AppUser,
  ScientificOpinion,
  AppNotification
} from './types';
import { 
  DEMO_TOPICS, 
  ApplicationService, 
  ThesisTopicService,
  filterAndSortTopics 
} from './services/thesisService';
import { AuthService } from './services/authService';
import { NotificationService } from './services/notificationService';
import { AdmissionWaitlistService } from './services/admissionWaitlistService';
import { DataMigrationService } from './services/dataMigrationService';
import { getTranslation } from './services/i18n';

// Ensure data schema migration to v5 runs synchronously before application state initialization
DataMigrationService.runMigrationIfNeeded();
import { Header } from './components/Header';
import { CatalogFilterBar } from './components/CatalogFilterBar';
import { TopicCard } from './components/TopicCard';
import { TopicDetailModal } from './components/TopicDetailModal';
import { AuthModal } from './components/AuthModal';
import { ProcedureGuideModal } from './components/ProcedureGuideModal';
import { ThesisDirectorWorkspace } from './components/ThesisDirectorWorkspace';
import { StructureDirectorWorkspace } from './components/StructureDirectorWorkspace';
import { CandidateWorkspace } from './components/CandidateWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';
import { PortalLanding } from './components/PortalLanding';
import { ApplicationFormModal } from './components/ApplicationFormModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { Footer } from './components/Footer';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Info,
  LayoutDashboard,
  ArrowRight,
  LogIn
} from 'lucide-react';

const INITIAL_FILTERS: TopicFilters = {
  searchQuery: '',
  institution: '',
  laboratory: '',
  domain: '',
  academicYear: '',
  professor: '',
  onlyOpen: false,
  sortBy: 'deadline',
};

export default function App() {
  // 1. Language state with persistent preference
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('usmba_lang');
      return saved === 'ar' ? 'ar' : 'fr';
    } catch {
      return 'fr';
    }
  });

  // Handle document direction (LTR / RTL)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('usmba_lang', language);
    } catch {
      // ignore storage failure
    }
  }, [language]);

  // 2. Authentication state (restores active session from AuthService)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => AuthService.getCurrentUser());
  const [activeView, setActiveView] = useState<'login' | 'catalog' | 'workspace'>(() => 
    AuthService.getCurrentUser() ? 'workspace' : 'login'
  );

  // Strict route protection guard:
  // 1. Unauthenticated users are strictly confined to login ('login')
  // 2. Non-candidates can NEVER access the candidate catalog ('catalog')
  useEffect(() => {
    if (!currentUser && activeView !== 'login') {
      setActiveView('login');
    } else if (currentUser && currentUser.role !== 'candidate' && activeView === 'catalog') {
      setActiveView('workspace');
    }
  }, [currentUser, activeView]);

  // 3. Application Wizard and Target Topic state
  const [pendingApplicationTopic, setPendingApplicationTopic] = useState<ThesisTopic | null>(null);
  const [activeApplicationModal, setActiveApplicationModal] = useState<{
    isOpen: boolean;
    topic: ThesisTopic | null;
    existingApp?: CandidateApplication | null;
  }>({
    isOpen: false,
    topic: null,
    existingApp: null,
  });

  // 4. Data states: Topics and Applications
  const [topics, setTopics] = useState<ThesisTopic[]>(() => ThesisTopicService.getTopics());
  const [applications, setApplications] = useState<CandidateApplication[]>(() => 
    ApplicationService.getApplications()
  );
  const [filters, setFilters] = useState<TopicFilters>(INITIAL_FILTERS);

  const refreshTopics = () => setTopics(ThesisTopicService.getTopics());

  // Automatic scan of admission deadlines, waitlist promotion & safe document migration on startup
  useEffect(() => {
    ApplicationService.migrateHistoricalDocuments().catch(() => {});

    const res = AdmissionWaitlistService.checkAndProcessExpirations(
      ApplicationService.getApplications(),
      ThesisTopicService.getTopics()
    );
    if (res.expiredCount > 0 || res.newProposalsCount > 0) {
      setApplications(ApplicationService.getApplications());
      setNotifications(NotificationService.getNotifications(currentUser?.email, currentUser?.role));
    }
  }, []);

  // 5. Modal and drawer states
  const [detailTopic, setDetailTopic] = useState<ThesisTopic | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // 7. System notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    NotificationService.getNotifications(currentUser?.email, currentUser?.role)
  );

  const refreshNotifications = () => {
    setNotifications(NotificationService.getNotifications(currentUser?.email, currentUser?.role));
  };

  useEffect(() => {
    refreshNotifications();
  }, [currentUser]);

  // 8. Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const catalogSectionRef = useRef<HTMLDivElement>(null);

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  // Facet extraction for filter dropdowns
  const institutions = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.institution))).sort();
  }, [topics]);

  const laboratories = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.laboratory))).sort();
  }, [topics]);

  const domains = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.domain))).sort();
  }, [topics]);

  const academicYears = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.academicYear))).sort();
  }, [topics]);

  const professors = useMemo(() => {
    return Array.from(new Set(topics.map((t) => t.professorName))).sort();
  }, [topics]);

  // Filtered and sorted topics
  const filteredTopics = useMemo(() => {
    return filterAndSortTopics(topics, filters);
  }, [topics, filters]);

  // Applications of current candidate (if role is candidate, strictly candidateId === currentUser.id)
  const candidateApplications = useMemo(() => {
    if (!currentUser || currentUser.role !== 'candidate' || !currentUser.id) return [];
    const currentUserId = currentUser.id.trim();
    return applications.filter(
      (a) => Boolean(a.candidateId && a.candidateId.trim() === currentUserId)
    );
  }, [applications, currentUser]);

  const candidateSubmittedApps = useMemo(() => {
    return candidateApplications.filter((a) => !a.isDraft && a.status !== 'draft');
  }, [candidateApplications]);

  // Start Application workflow: direct access for authenticated candidate
  const handleStartApplication = (targetTopic: ThesisTopic) => {
    if (!currentUser) {
      setActiveView('login');
      showToast('Veuillez vous connecter pour postuler à ce sujet.', 'info');
      return;
    }

    if (currentUser.role !== 'candidate') {
      showToast(
        'Seuls les candidats au doctorat peuvent formaliser un dossier de candidature.',
        'warning'
      );
      return;
    }

    // Check if candidate already has an application for THIS topic
    const existingAppForTopic = candidateApplications.find((a) => a.topicId === targetTopic.id);
    if (existingAppForTopic && !existingAppForTopic.isDraft && existingAppForTopic.status !== 'draft') {
      showToast(
        'Vous avez déjà déposé votre candidature officielle pour ce sujet. Consultez votre espace pour suivre son examen.',
        'warning'
      );
      setActiveView('workspace');
      return;
    }

    // Check 3 applications limit for the target topic's session
    const targetSession = targetTopic.academicYear || '2026/2027';
    const submittedInSession = candidateSubmittedApps.filter((a) => {
      const aSession = a.academicYear || topics.find((t) => t.id === a.topicId)?.academicYear || '2026/2027';
      return aSession === targetSession;
    });
    if (!existingAppForTopic && submittedInSession.length >= 3) {
      showToast(
        `Vous avez atteint le plafond réglementaire de 3 candidatures officielles pour la session doctorale ${targetSession}.`,
        'warning'
      );
      setActiveView('workspace');
      return;
    }

    setActiveApplicationModal({
      isOpen: true,
      topic: targetTopic,
      existingApp: existingAppForTopic || null,
    });
  };

  // Resume existing draft
  const handleResumeDraft = (draftApp: CandidateApplication) => {
    if (!currentUser || !draftApp.candidateId || draftApp.candidateId.trim() !== currentUser.id.trim()) {
      showToast('Action non autorisée : ce brouillon ne vous appartient pas.', 'warning');
      return;
    }
    const topic = topics.find((t) => t.id === draftApp.topicId) || topics[0];
    setActiveApplicationModal({
      isOpen: true,
      topic,
      existingApp: draftApp,
    });
  };

  // Decision handling (Professor & Admin workspaces)
  const handleUpdateApplicationStatus = (
    applicationId: string,
    newStatus: CandidateApplication['status'],
    options?: {
      rejectionReason?: string;
      correctionMessage?: string;
      waitlistRank?: number;
      authorName?: string;
    }
  ) => {
    ApplicationService.updateStatus(applicationId, newStatus, {
      reason: options?.rejectionReason,
      correctionMessage: options?.correctionMessage,
      waitlistRank: options?.waitlistRank,
      author: options?.authorName || currentUser?.name || 'Commission académique',
    });
    setApplications(ApplicationService.getApplications());
    refreshNotifications();

    const statusLabels: Record<string, string> = {
      admitted: 'Admis (Liste Principale)',
      accepted: 'Admis (Liste Principale)',
      waitlist: 'Classé sur Liste d’Attente',
      waitlisted: 'Classé sur Liste d’Attente',
      rejected: 'Non Retenu (Refus motivé)',
      correction_requested: 'Demande de correction transmise au candidat',
      pending_review: 'Remis en attente d’examen',
      under_review: 'En cours d’examen',
      pending_decision: 'En attente de décision',
      complete: 'Dossier complet',
      incomplete: 'Dossier incomplet',
      draft: 'Brouillon',
      registration_pending: 'Inscription à effectuer',
      registration_confirmed: 'Inscription confirmée',
      deadline_exceeded: 'Délai d’inscription dépassé',
      admission_cancelled: 'Admission annulée',
    };

    showToast(
      `Statut du dossier mis à jour : ${statusLabels[newStatus] || newStatus}`,
      newStatus === 'admitted' || newStatus === 'accepted' ? 'success' : newStatus === 'rejected' ? 'warning' : 'info'
    );
  };

  // Single Piece Correction Request (Professor / Admin)
  const handleRequestPieceCorrection = (appId: string, category: string, note: string) => {
    ApplicationService.requestDocumentCorrection(
      appId,
      category,
      note,
      currentUser?.name || 'Encadrant'
    );
    setApplications(ApplicationService.getApplications());
    refreshNotifications();
    showToast(`Demande de correction enregistrée pour la pièce "${category}".`, 'warning');
  };

  // Supervisor Scientific Opinion
  const handleSaveScientificOpinion = (appId: string, opinion: ScientificOpinion) => {
    ApplicationService.saveScientificOpinion(appId, opinion);
    setApplications(ApplicationService.getApplications());
    refreshNotifications();
    showToast(`Avis scientifique enregistré pour le dossier #${appId}.`, 'success');
  };

  // Topic Workflow Handlers (Creation, Modification, Revision, Signature)
  const handleSaveTopic = (topicData: Partial<ThesisTopic>, topicId?: string) => {
    if (topicId) {
      ThesisTopicService.updateTopic(topicId, topicData, currentUser?.name || 'Directeur de thèse');
      showToast('Sujet de thèse mis à jour avec succès.', 'success');
    } else {
      ThesisTopicService.createTopic(topicData, {
        name: currentUser?.name || 'Pr. Karim Benali',
        email: currentUser?.email || 'directeur.these.test@usmba.ma',
        title: currentUser?.title,
        institution: currentUser?.institution,
        laboratory: currentUser?.laboratory,
      });
      showToast('Nouveau sujet proposé et soumis au Directeur de structure pour signature.', 'success');
    }
    refreshTopics();
    refreshNotifications();
  };

  const handleSignAndApproveTopic = (topicId: string, comments?: string) => {
    ThesisTopicService.signAndApproveTopic(
      topicId,
      {
        name: currentUser?.name || 'Pr. Mostafa Bennani',
        email: currentUser?.email || 'directeur.structure.test@usmba.ma',
        role: 'Directeur du CEDoc & Pôle Doctoral',
      },
      comments
    );
    refreshTopics();
    refreshNotifications();
    showToast('Sujet signé électroniquement et publié au catalogue officiel !', 'success');
  };

  const handleRequestTopicRevision = (topicId: string, message: string) => {
    ThesisTopicService.requestTopicRevision(topicId, message, currentUser?.name || 'Directeur de structure');
    refreshTopics();
    refreshNotifications();
    showToast('Demande de modification transmise au Directeur de thèse.', 'warning');
  };

  const handleRejectTopic = (topicId: string, reason: string) => {
    ThesisTopicService.rejectTopic(topicId, reason, currentUser?.name || 'Directeur de structure');
    refreshTopics();
    refreshNotifications();
    showToast('Sujet refusé avec motif notifié.', 'info');
  };

  // Physical reception handling (Structure Director workspace)
  const handleMarkPhysicalReception = (
    applicationId: string,
    agentName: string,
    verifiedOriginals: string[]
  ) => {
    ApplicationService.markPhysicalReception(
      applicationId,
      agentName,
      verifiedOriginals
    );
    setApplications(ApplicationService.getApplications());
    refreshNotifications();
    showToast('Réception physique et conformité des originaux enregistrées au guichet CEDoc.', 'success');
  };

  // User Authentication Handlers
  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);

    // If candidate was initiating an application, launch form wizard
    if (pendingApplicationTopic && user.role === 'candidate') {
      setActiveApplicationModal({
        isOpen: true,
        topic: pendingApplicationTopic,
        existingApp: null,
      });
      setPendingApplicationTopic(null);
      showToast(
        `Bienvenue, ${user.name}. Vous pouvez débuter votre candidature.`,
        'success'
      );
    } else {
      setActiveView('workspace');
      showToast(
        `Connecté avec succès en tant que ${user.name} (${user.title || user.role}).`,
        'success'
      );
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setActiveView('login');
    showToast('Session fermée avec succès. Retour à la page de connexion.', 'info');
  };

  const scrollToCatalog = () => {
    setActiveView('catalog');
    setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const isRtl = language === 'ar';

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-x-hidden ${language === 'ar' ? 'font-arabic' : ''}`}>
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50 animate-in slide-in-from-bottom duration-200 max-w-[calc(100vw-2.5rem)]">
          <div className={`p-3.5 sm:p-4 rounded-xl shadow-lg border flex items-center gap-3 text-xs sm:text-sm font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/40'
              : toastMessage.type === 'warning'
              ? 'bg-slate-900 text-white border-amber-500/40'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="truncate">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header with Account-Gated Space Access & Notification Bell */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onNavigateHome={() => {
          setActiveView(currentUser ? 'workspace' : 'login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onToggleView={setActiveView}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 container-constrained py-6 sm:py-8 space-y-6" ref={catalogSectionRef}>
        {/* VIEW 1: Portal Landing & Authentication Gateway */}
        {!currentUser || activeView === 'login' ? (
          <PortalLanding
            language={language}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : activeView === 'workspace' ? (
          /* VIEW 2: Dedicated Role Workspaces */
          <div>
            {(currentUser.role === 'thesis_director' || (currentUser.role as any) === 'professor') && (
              <ThesisDirectorWorkspace
                topics={topics}
                applications={applications}
                onUpdateApplicationStatus={handleUpdateApplicationStatus}
                onRequestPieceCorrection={handleRequestPieceCorrection}
                onSaveScientificOpinion={handleSaveScientificOpinion}
                onSaveTopic={handleSaveTopic}
                currentUserName={currentUser.name}
                currentUserEmail={currentUser.email}
                language={language}
              />
            )}

            {currentUser.role === 'structure_director' && (
              <StructureDirectorWorkspace
                topics={topics}
                applications={applications}
                onUpdateApplicationStatus={handleUpdateApplicationStatus}
                onRequestPieceCorrection={handleRequestPieceCorrection}
                onSignAndApproveTopic={handleSignAndApproveTopic}
                onRequestTopicRevision={handleRequestTopicRevision}
                onRejectTopic={handleRejectTopic}
                onRefreshApplications={() => setApplications(ApplicationService.getApplications())}
                currentUserName={currentUser.name}
                currentUserEmail={currentUser.email}
                language={language}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminWorkspace
                currentUser={currentUser}
                topics={topics}
                applications={applications}
                language={language}
                onRefreshData={() => {
                  refreshTopics();
                  setApplications(ApplicationService.getApplications());
                }}
              />
            )}

            {currentUser.role === 'candidate' && (
              <CandidateWorkspace
                user={currentUser}
                applications={applications}
                language={language}
                onBrowseCatalog={() => setActiveView('catalog')}
                onResumeDraft={handleResumeDraft}
                onApplicationUpdated={(_updated) => setApplications(ApplicationService.getApplications())}
                onApplicationDeleted={() => setApplications(ApplicationService.getApplications())}
              />
            )}
          </div>
        ) : (
          /* VIEW 3: Candidate Thesis Topics Catalog (EXCLUSIVELY for authenticated candidate) */
          currentUser.role === 'candidate' && (
            <div className="space-y-6">
              {/* Return to My Application space button */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-slate-600">
                    {isRtl
                      ? `دليل مواضيع الدكتوراه المفتوحة للترشيح · المترشح: ${currentUser.name}`
                      : `Catalogue des sujets de thèse ouverts à candidature · Candidat : ${currentUser.name}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('workspace')}
                  className="px-3 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'العودة إلى فضائي الخاص' : 'Retour à mon dossier'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              {/* Filter Bar */}
              <CatalogFilterBar
                language={language}
                filters={filters}
                onFilterChange={setFilters}
                institutions={institutions}
                laboratories={laboratories}
                domains={domains}
                academicYears={academicYears}
                professors={professors}
                totalResults={filteredTopics.length}
              />

              {/* Topics Grid */}
              {filteredTopics.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-700">
                    {t('noResultsTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('noResultsHint')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters(INITIAL_FILTERS)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                  >
                    {t('btnResetFilters')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredTopics.map((topic) => {
                    const appForTopic = candidateApplications.find((a) => a.topicId === topic.id);
                    const isThisTopic = Boolean(appForTopic);
                    const isSubmittedForTopic = Boolean(appForTopic && !appForTopic.isDraft && appForTopic.status !== 'draft');
                    const isDraftForTopic = Boolean(appForTopic?.isDraft || appForTopic?.status === 'draft');
                    const topicSession = topic.academicYear || '2026/2027';
                    const submittedForSession = candidateSubmittedApps.filter((a) => {
                      const aSession = a.academicYear || topics.find((t) => t.id === a.topicId)?.academicYear || '2026/2027';
                      return aSession === topicSession;
                    });
                    const reachedMax = submittedForSession.length >= 3;

                    return (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        language={language}
                        onViewDetails={setDetailTopic}
                        onApply={handleStartApplication}
                        hasActiveApplication={isSubmittedForTopic || (reachedMax && !isDraftForTopic)}
                        isCurrentApplicationTopic={isThisTopic}
                        isDraft={isDraftForTopic}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* Topic Detail Modal */}
      {(() => {
        const appForDetail = detailTopic ? candidateApplications.find((a) => a.topicId === detailTopic.id) : null;
        const isSubmittedForDetail = Boolean(appForDetail && !appForDetail.isDraft && appForDetail.status !== 'draft');
        const isDraftForDetail = Boolean(appForDetail?.isDraft || appForDetail?.status === 'draft');
        const detailSession = detailTopic?.academicYear || '2026/2027';
        const submittedForDetailSession = candidateSubmittedApps.filter((a) => {
          const aSession = a.academicYear || topics.find((t) => t.id === a.topicId)?.academicYear || '2026/2027';
          return aSession === detailSession;
        });
        const reachedMaxDetail = submittedForDetailSession.length >= 3;

        return (
          <TopicDetailModal
            topic={detailTopic}
            language={language}
            isOpen={Boolean(detailTopic)}
            onClose={() => setDetailTopic(null)}
            onApply={handleStartApplication}
            hasActiveApplication={isSubmittedForDetail || (reachedMaxDetail && !isDraftForDetail)}
            isCurrentApplicationTopic={Boolean(appForDetail)}
            isDraft={isDraftForDetail}
          />
        );
      })()}

      {/* 5-Step Application Form Wizard Modal */}
      {activeApplicationModal.isOpen && activeApplicationModal.topic && currentUser && (
        <ApplicationFormModal
          isOpen={activeApplicationModal.isOpen}
          onClose={() => setActiveApplicationModal({ isOpen: false, topic: null, existingApp: null })}
          topic={activeApplicationModal.topic}
          user={currentUser}
          existingApplication={activeApplicationModal.existingApp}
          onApplicationSubmitted={(app) => {
            setApplications(ApplicationService.getApplications());
            setActiveView('workspace');
            showToast(`Candidature pour "${app.topicCode}" enregistrée avec succès.`, 'success');
          }}
          language={language}
        />
      )}

      {/* Auth Modal with Real Authentication, Registration & Password Recovery */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        selectedTopicsCount={pendingApplicationTopic ? 1 : 0}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Procedure Guide Modal */}
      <ProcedureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        language={language}
        onGoToCatalog={scrollToCatalog}
      />

      {/* In-App Notification Center & Internal Alerts */}
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        currentUser={currentUser}
        notifications={notifications}
        onRefreshNotifications={refreshNotifications}
        language={language}
      />

      {/* Minimalist Footer */}
      <Footer 
        language={language}
      />
    </div>
  );
}
