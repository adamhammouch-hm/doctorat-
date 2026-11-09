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
  CartService, 
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
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { ProcedureGuideModal } from './components/ProcedureGuideModal';
import { ThesisDirectorWorkspace } from './components/ThesisDirectorWorkspace';
import { StructureDirectorWorkspace } from './components/StructureDirectorWorkspace';
import { CandidateWorkspace } from './components/CandidateWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';
import { ApplicationFormModal } from './components/ApplicationFormModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { Footer } from './components/Footer';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Info,
  LayoutDashboard,
  ArrowRight
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
  const [activeView, setActiveView] = useState<'catalog' | 'workspace'>(() => 
    AuthService.getCurrentUser() ? 'workspace' : 'catalog'
  );

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

  // Automatic scan of admission deadlines & waitlist promotion on startup
  useEffect(() => {
    const res = AdmissionWaitlistService.checkAndProcessExpirations(
      ApplicationService.getApplications(),
      ThesisTopicService.getTopics()
    );
    if (res.expiredCount > 0 || res.newProposalsCount > 0) {
      setApplications(ApplicationService.getApplications());
      setNotifications(NotificationService.getNotifications(currentUser?.email, currentUser?.role));
    }
  }, []);

  // 5. Cart state with localStorage synchronization
  const [cartTopicIds, setCartTopicIds] = useState<string[]>(() => CartService.getCartTopics());
  const [maxCartLimit, setMaxCartLimit] = useState<number>(() => CartService.getMaxLimit());

  // 6. Modal and drawer states
  const [detailTopic, setDetailTopic] = useState<ThesisTopic | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
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

  // Topics currently in cart
  const cartTopics = useMemo(() => {
    return topics.filter((t) => cartTopicIds.includes(t.id));
  }, [topics, cartTopicIds]);

  // Cart operations
  const handleAddToCart = (topicId: string) => {
    const res = CartService.addTopic(topicId, maxCartLimit);
    if (res.success) {
      const updated = CartService.getCartTopics();
      setCartTopicIds(updated);
      const addedTopic = topics.find((t) => t.id === topicId);
      showToast(
        language === 'ar'
          ? `تمت إضافة الموضوع إلى سلتك (${updated.length}/${maxCartLimit})`
          : `Sujet ajouté à votre sélection (${updated.length}/${maxCartLimit}) : ${addedTopic?.code}`,
        'success'
      );
    } else {
      showToast(
        language === 'ar'
          ? `تم بلوغ الحد الأقصى (${maxCartLimit} مواضيع)`
          : `Quota maximal atteint (${maxCartLimit} sujets autorisés).`,
        'warning'
      );
    }
  };

  const handleRemoveFromCart = (topicId: string) => {
    CartService.removeTopic(topicId);
    setCartTopicIds(CartService.getCartTopics());
    showToast(
      language === 'ar' ? 'تم حذف الموضوع من السلة' : 'Sujet retiré de votre sélection',
      'info'
    );
  };

  const handleClearCart = () => {
    CartService.clearCart();
    setCartTopicIds([]);
    showToast(
      language === 'ar' ? 'تم تفريغ السلة بنجاح' : 'Votre sélection a été réinitialisée',
      'info'
    );
  };

  const handleSetMaxLimit = (limit: number) => {
    CartService.setMaxLimit(limit);
    setMaxCartLimit(limit);
    const updated = CartService.getCartTopics();
    setCartTopicIds(updated);
    showToast(
      language === 'ar'
        ? `تم تحديث الحد الأقصى للاختيار: ${limit} موضوع`
        : `Quota de sélection fixé à ${limit} sujet(s) maximum.`,
      'info'
    );
  };

  // Start Application workflow: gates through login and restores selection
  const handleStartApplication = (targetTopic: ThesisTopic) => {
    if (!currentUser) {
      setPendingApplicationTopic(targetTopic);
      setIsCartOpen(false);
      setIsAuthOpen(true);
      showToast(
        'Veuillez vous connecter ou créer votre compte candidat pour postuler. Votre sélection est sauvegardée.',
        'info'
      );
      return;
    }

    if (currentUser.role !== 'candidate') {
      showToast(
        'Seuls les candidats au doctorat peuvent formaliser un dossier de candidature.',
        'warning'
      );
      return;
    }

    setIsCartOpen(false);
    setActiveApplicationModal({
      isOpen: true,
      topic: targetTopic,
      existingApp: null,
    });
  };

  // Resume existing draft
  const handleResumeDraft = (draftApp: CandidateApplication) => {
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

    // If candidate was initiating an application, restore topic and launch form wizard
    if (pendingApplicationTopic && user.role === 'candidate') {
      setActiveApplicationModal({
        isOpen: true,
        topic: pendingApplicationTopic,
        existingApp: null,
      });
      setPendingApplicationTopic(null);
      showToast(
        `Bienvenue, ${user.name}. Votre panier a été restauré pour débuter votre candidature.`,
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
    setActiveView('catalog');
    showToast('Session fermée. Retour au catalogue public.', 'info');
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
        cartCount={cartTopicIds.length}
        maxCartLimit={maxCartLimit}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onNavigateHome={() => {
          setActiveView(currentUser ? 'workspace' : 'catalog');
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
        {/* If user is logged in and viewing their private workspace */}
        {currentUser && activeView === 'workspace' ? (
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
                onOpenCart={() => setIsCartOpen(true)}
                cartCount={cartTopicIds.length}
                onResumeDraft={handleResumeDraft}
                onApplicationUpdated={(_updated) => setApplications(ApplicationService.getApplications())}
                onApplicationDeleted={() => setApplications(ApplicationService.getApplications())}
              />
            )}
          </div>
        ) : (
          /* PUBLIC CATALOG VIEW (Accessible to all unauthenticated visitors and logged-in users) */
          <div className="space-y-6">
            {/* If logged in but browsing catalog, show clean return banner */}
            {currentUser && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-slate-600">
                    {isRtl
                      ? `أنت تتصفح دليل المواضيع بحساب: ${currentUser.name}`
                      : `Vous consultez le catalogue public avec le compte : ${currentUser.name}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('workspace')}
                  className="px-3 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'العودة إلى فضائي الخاص' : 'Retour à mon espace'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}

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
                {filteredTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    language={language}
                    isInCart={cartTopicIds.includes(topic.id)}
                    canAddToCart={cartTopicIds.length < maxCartLimit}
                    maxCartLimit={maxCartLimit}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onViewDetails={setDetailTopic}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Topic Detail Modal */}
      <TopicDetailModal
        topic={detailTopic}
        language={language}
        isOpen={Boolean(detailTopic)}
        onClose={() => setDetailTopic(null)}
        isInCart={detailTopic ? cartTopicIds.includes(detailTopic.id) : false}
        canAddToCart={cartTopicIds.length < maxCartLimit}
        maxCartLimit={maxCartLimit}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onStartApplication={handleStartApplication}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartTopics={cartTopics}
        maxLimit={maxCartLimit}
        onSetMaxLimit={handleSetMaxLimit}
        onRemoveTopic={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onStartApplication={() => {
          if (cartTopics.length > 0) {
            handleStartApplication(cartTopics[0]);
          } else {
            showToast('Votre panier est vide. Sélectionnez un sujet de thèse.', 'info');
          }
        }}
        onViewDetails={setDetailTopic}
        language={language}
      />

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
            // Remove from cart once submitted
            handleRemoveFromCart(app.topicId);
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
        selectedTopicsCount={pendingApplicationTopic ? 1 : cartTopicIds.length}
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
