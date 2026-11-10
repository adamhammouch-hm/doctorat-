/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ApplicationFormModal Component — 5-Step doctoral application wizard with auto-saved drafts
 * Steps:
 * 1. Profil civil & coordonnées
 * 2. Parcours académique
 * 3. Motivations & projet spécifique au sujet
 * 4. Dépôt des pièces justificatives (Caméra & Fichiers)
 * 5. Vérification finale & Soumission
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ThesisTopic, 
  CandidateApplication, 
  CandidateProfile, 
  ApplicationDocument, 
  Language, 
  AppUser,
  DocumentCategory
} from '../types';
import { ProfileService } from '../services/profileService';
import { ApplicationService } from '../services/thesisService';
import { DocumentUploadModal } from './DocumentUploadModal';
import { CinOcrModal } from './CinOcrModal';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Save, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  GraduationCap, 
  Scan,
  ShieldAlert,
  Send
} from 'lucide-react';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: ThesisTopic;
  user: AppUser;
  existingApplication?: CandidateApplication | null;
  onApplicationSubmitted: (app: CandidateApplication) => void;
  language: Language;
}

const REQUIRED_DOCUMENTS: { category: DocumentCategory; name: string; required: boolean }[] = [
  { category: 'cin', name: 'Carte Nationale d’Identité (CIN / CNIE)', required: true },
  { category: 'master_diploma', name: 'Diplôme de Master ou Attestation de Réussite', required: true },
  { category: 'transcripts', name: 'Relevés de notes semestriels du Master (S1 à S4)', required: true },
  { category: 'pfe_thesis', name: 'Mémoire ou Rapport du Projet de Fin d’Études (PFE)', required: true },
  { category: 'cv', name: 'Curriculum Vitae académique détaillé', required: true },
  { category: 'motivation_letter', name: 'Projet de recherche & Lettre d’intention scientifique', required: false },
];

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  topic,
  user,
  existingApplication,
  onApplicationSubmitted,
  language,
}) => {
  const isRtl = language === 'ar';

  // Step state: 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(() => existingApplication?.draftStep || 1);

  // Profile data (auto-populated from ProfileService)
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    const existing = ProfileService.getProfile(user.id);
    return existing || ProfileService.createEmptyProfile(user.id, user.email, user.name);
  });

  // Step 3 Specific Data
  const [statementOfPurpose, setStatementOfPurpose] = useState<string>(() => existingApplication?.statementOfPurpose || '');
  const [scientificAlignment, setScientificAlignment] = useState<string>(() => existingApplication?.scientificAlignment || '');

  // Step 4 Documents state
  const [documents, setDocuments] = useState<ApplicationDocument[]>(() => existingApplication?.documents || []);
  const [activeUploadDoc, setActiveUploadDoc] = useState<{ category: DocumentCategory; name: string } | null>(null);

  // OCR Modal state
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  // Honor Declaration checkbox (Step 5)
  const [honorCertified, setHonorCertified] = useState(false);

  // Stable Draft ID resolution:
  // 1. If existingApplication has an id, reuse it.
  // 2. Otherwise look up if an existing draft exists in storage for this candidate and topic.
  // 3. Otherwise generate a stable deterministic draft id tied to (user.id, topic.id).
  const [draftId, setDraftId] = useState<string>(() => {
    if (existingApplication?.id) return existingApplication.id;
    const existing = ApplicationService.getDraftForCandidateAndTopic(user.id, topic.id, topic.academicYear);
    if (existing?.id) return existing.id;
    return `app-draft-${user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-${topic.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`;
  });

  // Track voluntary candidate modification: opening modal without edits does NOT create a draft
  const isDirtyRef = useRef<boolean>(Boolean(existingApplication && (existingApplication.isDraft || existingApplication.status === 'draft')));
  const isInitialMountRef = useRef<boolean>(true);

  // Auto-save state
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check candidature eligibility (maximum 3 official applications per session)
  const [eligibility, setEligibility] = useState(() => 
    ApplicationService.canCandidateApply({
      id: user.id,
      email: user.email,
      cin: profile.cin,
      cne: profile.cne,
      targetTopicId: topic.id,
      currentApplicationId: existingApplication?.id,
    })
  );

  const isOfficialExisting = Boolean(
    existingApplication && !existingApplication.isDraft && existingApplication.status !== 'draft'
  );

  const isEditingCurrentApp = Boolean(
    !isOfficialExisting &&
    existingApplication &&
    (!existingApplication.candidateId || existingApplication.candidateId === user.id) &&
    (existingApplication.id === eligibility.existingDraftId ||
     existingApplication.topicId === topic.id)
  );

  const isBlocked = isOfficialExisting ||
    (!isEditingCurrentApp && !eligibility.canApply) ||
    Boolean(existingApplication && existingApplication.candidateId && existingApplication.candidateId !== user.id);

  const handleDeleteOldDraftAndContinue = () => {
    if (eligibility.existingDraftId) {
      ApplicationService.deleteDraft(eligibility.existingDraftId, user.id);
      setEligibility({ canApply: true });
    }
  };

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save debounced whenever fields change AFTER initial mount
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (!isOpen || isBlocked) return;
    isDirtyRef.current = true;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraftSilently();
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [profile, statementOfPurpose, scientificAlignment, documents, currentStep, isBlocked]);

  if (!isOpen) return null;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Réglementation USMBA — Candidature Unique
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {eligibility.reason}
            </p>
          </div>
          {eligibility.existingApplication && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="font-mono font-bold text-slate-700">
                {eligibility.existingApplication.topicCode}
              </div>
              <div className="text-slate-900 font-medium">
                {eligibility.existingApplication.topicTitle}
              </div>
              <div className="text-[11px] text-slate-500">
                Statut : {eligibility.hasDraft ? 'Brouillon en cours' : 'Dossier transmis'} · Date : {eligibility.existingApplication.submissionDate}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            {eligibility.hasDraft && eligibility.existingDraftId && (
              <button
                type="button"
                onClick={handleDeleteOldDraftAndContinue}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
              >
                Supprimer l'ancien brouillon et postuler ici
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-slate-800 hover:bg-slate-900 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const saveDraftSilently = () => {
    if (isBlocked || !isDirtyRef.current) return;
    if (existingApplication && existingApplication.candidateId && existingApplication.candidateId !== user.id) {
      return;
    }
    ProfileService.saveProfile(profile);

    const draftApp: CandidateApplication = {
      id: draftId,
      topicId: topic.id,
      topicCode: topic.code,
      topicTitle: topic.title,
      candidateId: user.id,
      candidateName: `${profile.firstName} ${profile.lastName}`.trim() || user.name,
      candidateEmail: profile.email || user.email,
      candidatePhone: profile.phone || '',
      academicYear: topic.academicYear || existingApplication?.academicYear || '2026/2027',
      cne: profile.cne || '',
      cin: profile.cin || '',
      masterDegree: profile.masterDegree || '',
      masterUniversity: profile.masterUniversity || '',
      masterGrade: profile.masterGrade || 0,
      masterMention: profile.masterMention || 'Bien',
      pfeTitle: profile.pfeTitle || '',
      statementOfPurpose,
      scientificAlignment,
      submissionDate: existingApplication?.submissionDate || new Date().toISOString().split('T')[0],
      status: 'draft',
      isDraft: true,
      draftStep: currentStep,
      documents,
      history: existingApplication?.history || [
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleDateString('fr-FR'),
          action: 'Brouillon initialisé et sauvegardé automatiquement',
          author: user.name,
        },
      ],
    };

    ApplicationService.saveDraft(draftApp);
    setLastAutoSave(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setValidationError('Veuillez renseigner vos prénom et nom.');
      return false;
    }
    if (!profile.cin.trim()) {
      setValidationError('Le numéro de Carte Nationale d’Identité (CIN) est obligatoire.');
      return false;
    }
    if (!profile.cne.trim()) {
      setValidationError('Le code CNE / Massar est obligatoire.');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!profile.masterDegree.trim()) {
      setValidationError('L’intitulé du diplôme de Master ou d’Ingénieur est requis.');
      return false;
    }
    if (!profile.masterUniversity.trim()) {
      setValidationError('L’université / établissement d’obtention est obligatoire.');
      return false;
    }
    if (!profile.masterGrade || profile.masterGrade < 10 || profile.masterGrade > 20) {
      setValidationError('Veuillez indiquer une moyenne de Master valide (entre 10.00 et 20.00).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    if (!statementOfPurpose.trim() || statementOfPurpose.length < 30) {
      setValidationError('Veuillez expliciter vos motivations et objectifs scientifiques (minimum 30 caractères).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  // Step 4 Validation (Documents Checklist)
  const validateStep4 = () => {
    const missingDocs = REQUIRED_DOCUMENTS.filter(
      (req) => req.required && !documents.some((d) => d.category === req.category && d.status !== 'needs_correction')
    );

    if (missingDocs.length > 0) {
      setValidationError(`Pièces obligatoires manquantes : ${missingDocs.map((m) => m.name).join(', ')}.`);
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    setValidationError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 5));
    saveDraftSilently();
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Save document from upload modal
  const handleSaveDocument = (doc: ApplicationDocument) => {
    const updated = [...documents.filter((d) => d.category !== doc.category), doc];
    setDocuments(updated);
    setActiveUploadDoc(null);
    saveDraftSilently();
  };

  // Final submission
  const handleFinalSubmit = () => {
    if (!honorCertified) {
      setValidationError('Vous devez obligatoirement certifier sur l’honneur l’exactitude de vos déclarations.');
      return;
    }

    const check = ApplicationService.canCandidateApply({
      id: user.id,
      email: user.email,
      cin: profile.cin,
      cne: profile.cne,
      targetTopicId: topic.id,
      currentApplicationId: existingApplication?.id,
    });

    if (!check.canApply) {
      setValidationError(check.reason || 'Dépôt impossible : quota atteint ou candidature en double.');
      return;
    }

    if (existingApplication && existingApplication.candidateId && existingApplication.candidateId !== user.id) {
      setValidationError('Action non autorisée : ce dossier ne vous appartient pas.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Save profile permanently
      ProfileService.saveProfile(profile);

      const finalApp: CandidateApplication = {
        id: draftId,
        topicId: topic.id,
        topicCode: topic.code,
        topicTitle: topic.title,
        candidateId: user.id,
        candidateName: `${profile.firstName} ${profile.lastName}`.trim(),
        candidateEmail: profile.email || user.email,
        candidatePhone: profile.phone,
        academicYear: topic.academicYear || existingApplication?.academicYear || '2026/2027',
        cne: profile.cne,
        cin: profile.cin,
        masterDegree: profile.masterDegree,
        masterUniversity: profile.masterUniversity,
        masterGrade: Number(profile.masterGrade),
        masterMention: profile.masterMention,
        pfeTitle: profile.pfeTitle,
        statementOfPurpose,
        scientificAlignment,
        submissionDate: new Date().toISOString().split('T')[0],
        status: 'pending_review',
        isDraft: false,
        documents,
        history: [
          ...(existingApplication?.history || []),
          {
            id: `h-${Date.now()}`,
            date: new Date().toLocaleDateString('fr-FR'),
            action: 'Dossier de candidature formalisé et officiellement transmis pour instruction',
            author: user.name,
          },
        ],
      };

      const res = ApplicationService.submitApplication(finalApp);
      setIsSubmitting(false);
      if (!res.success) {
        setValidationError(res.error || 'Erreur lors de la soumission de la candidature.');
        return;
      }
      onApplicationSubmitted(finalApp);
      onClose();
    }, 400);
  };

  const stepLabels = [
    'Profil & Identité',
    'Parcours Académique',
    'Projet & Motivation',
    'Pièces Justificatives',
    'Synthèse & Dépôt',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  {topic.code}
                </span>
                <span className="text-xs text-slate-500">· Campagne Doctorale USMBA</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                {topic.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastAutoSave && (
              <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
                Sauvegardé à {lastAutoSave}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-800">
              Étape {currentStep} / 5 : {stepLabels[currentStep - 1]}
            </span>
            <span className="text-slate-500 font-bold">{currentStep * 20}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-700 h-full transition-all duration-300"
              style={{ width: `${currentStep * 20}%` }}
            />
          </div>
        </div>

        {/* Form Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: PROFIL & IDENTITÉ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Informations d’identité et coordonnées du candidat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ces informations sont automatiquement enregistrées dans votre profil réutilisable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOcrOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Scan className="w-4 h-4 text-emerald-700" />
                  <span>Remplir via OCR CIN</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: Youssef"
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
                    placeholder="Ex: El Amrani"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Carte Nationale d’Identité (CIN) *</label>
                  <input
                    type="text"
                    required
                    value={profile.cin}
                    onChange={(e) => setProfile({ ...profile, cin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: CD718293"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Code National de l’Étudiant (CNE / Massar) *</label>
                  <input
                    type="text"
                    required
                    value={profile.cne}
                    onChange={(e) => setProfile({ ...profile, cne: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Ex: N138294012"
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
                  <label className="font-semibold text-slate-700">Numéro de téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="+212 6..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Adresse de résidence *</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="Rue, quartier, ville..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PARCOURS ACADÉMIQUE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Parcours universitaire et diplômes d’accès
                </h3>
                <p className="text-xs text-slate-500">
                  Renseignez vos cursus du Baccalauréat au Master / Diplôme d’Ingénieur d’État.
                </p>
              </div>

              {/* Master / Diplôme d'accès principal */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span>Diplôme d’accès principal (Master ou Diplôme d’Ingénieur) *</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Intitulé exact du diplôme *</label>
                    <input
                      type="text"
                      required
                      value={profile.masterDegree}
                      onChange={(e) => setProfile({ ...profile, masterDegree: e.target.value })}
                      placeholder="Ex: Master Recherche en Systèmes Intelligents"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Université / Établissement *</label>
                    <input
                      type="text"
                      required
                      value={profile.masterUniversity}
                      onChange={(e) => setProfile({ ...profile, masterUniversity: e.target.value })}
                      placeholder="Ex: FST Fès, USMBA"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Année d’obtention *</label>
                    <input
                      type="text"
                      value={profile.masterYear}
                      onChange={(e) => setProfile({ ...profile, masterYear: e.target.value })}
                      placeholder="2023"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Moyenne générale (sur 20) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      max="20"
                      required
                      value={profile.masterGrade || ''}
                      onChange={(e) => setProfile({ ...profile, masterGrade: parseFloat(e.target.value) || 0 })}
                      placeholder="15.80"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mention</label>
                    <select
                      value={profile.masterMention}
                      onChange={(e) => setProfile({ ...profile, masterMention: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                    >
                      <option value="Passable">Passable</option>
                      <option value="Assez Bien">Assez Bien</option>
                      <option value="Bien">Bien</option>
                      <option value="Très Bien">Très Bien</option>
                    </select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700">Titre du Mémoire de Fin d’Études (PFE)</label>
                    <input
                      type="text"
                      value={profile.pfeTitle}
                      onChange={(e) => setProfile({ ...profile, pfeTitle: e.target.value })}
                      placeholder="Sujet de votre mémoire de master..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Licence et Baccalauréat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Licence / Diplôme Bac+3</label>
                  <input
                    type="text"
                    value={profile.licenseDegree}
                    onChange={(e) => setProfile({ ...profile, licenseDegree: e.target.value })}
                    placeholder="Licence SMI, SMA..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Moyenne Licence (sur 20)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={profile.licenseGrade || ''}
                    onChange={(e) => setProfile({ ...profile, licenseGrade: parseFloat(e.target.value) || 0 })}
                    placeholder="14.50"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Série du Baccalauréat</label>
                  <input
                    type="text"
                    value={profile.bacType}
                    onChange={(e) => setProfile({ ...profile, bacType: e.target.value })}
                    placeholder="Ex: Sciences Mathématiques"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Année du Bac</label>
                  <input
                    type="text"
                    value={profile.bacYear}
                    onChange={(e) => setProfile({ ...profile, bacYear: e.target.value })}
                    placeholder="2018"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: INFORMATIONS SPÉCIFIQUES AU SUJET */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Motivation et adéquation scientifique avec ce sujet
                </h3>
                <p className="text-xs text-slate-500">
                  Ces informations sont propres à cette candidature ({topic.code}) et ne seront pas partagées avec d’autres sujets.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Sujet sélectionné :</div>
                <div className="text-slate-600 font-medium">{topic.title}</div>
                <div className="text-slate-500 text-[11px] pt-1">
                  Directeur de thèse : <strong className="text-slate-700">{topic.professorName}</strong> · Laboratoire : {topic.laboratory}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Lettre de motivation & Projet de recherche doctoral *
                </label>
                <textarea
                  rows={6}
                  required
                  value={statementOfPurpose}
                  onChange={(e) => setStatementOfPurpose(e.target.value)}
                  placeholder="Expliquez votre intérêt pour ce sujet, vos compétences en lien avec la problématique, et vos objectifs de contribution scientifique..."
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none leading-relaxed"
                />
                <span className="text-[11px] text-slate-400">
                  {statementOfPurpose.length} caractères saisis (minimum 30 recommandés)
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Compétences techniques et adéquation avec les prérequis du laboratoire
                </label>
                <textarea
                  rows={3}
                  value={scientificAlignment}
                  onChange={(e) => setScientificAlignment(e.target.value)}
                  placeholder="Précisez votre maîtrise des outils listés dans le sujet (ex: NLP, PyTorch, LangChain, etc.)..."
                  className="w-full p-3 rounded-lg bg-slate-50 border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 4: DÉPÔT DES PIÈCES JUSTIFICATIVES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Checklist des pièces justificatives demandées
                </h3>
                <p className="text-xs text-slate-500">
                  Vous pouvez photographier vos originaux avec la caméra ou importer des fichiers PDF/JPG multipages.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {REQUIRED_DOCUMENTS.map((req) => {
                  const uploaded = documents.find((d) => d.category === req.category);
                  const isUploaded = Boolean(uploaded);
                  const needsCorrection = uploaded?.status === 'needs_correction';

                  return (
                    <div 
                      key={req.category}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          needsCorrection
                            ? 'bg-rose-100 text-rose-800'
                            : isUploaded
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {needsCorrection ? (
                            <AlertCircle className="w-4 h-4 text-rose-700" />
                          ) : isUploaded ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{req.name}</span>
                            {req.required && (
                              <span className="text-rose-600 font-bold">*</span>
                            )}
                          </div>
                          {isUploaded ? (
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-semibold text-emerald-800">
                                {uploaded?.pages?.length || 1} page(s) déposée(s)
                              </span>
                              <span>·</span>
                              <span>{uploaded?.fileSize}</span>
                              {uploaded?.uploadedAt && <span>· le {uploaded.uploadedAt}</span>}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {req.required ? 'Obligatoire pour la recevabilité du dossier' : 'Document facultatif recommandé'}
                            </div>
                          )}

                          {needsCorrection && uploaded?.note && (
                            <div className="mt-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Motif de correction : {uploaded.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setActiveUploadDoc({ category: req.category, name: req.name })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            needsCorrection
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                              : isUploaded
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{needsCorrection ? 'Remplacer la pièce' : isUploaded ? 'Modifier' : 'Déposer'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: VÉRIFICATION FINALE & SOUMISSION */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Récapitulatif général avant soumission officielle
                </h3>
                <p className="text-xs text-slate-500">
                  Vérifiez attentivement les informations renseignées. Une fois soumise, votre candidature sera transmise à l’encadrant et au CEDoc.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Identité</span>
                  <div className="font-bold text-slate-900">{profile.firstName} {profile.lastName}</div>
                  <div className="text-slate-600 font-mono">CIN: {profile.cin} · CNE: {profile.cne}</div>
                  <div className="text-slate-500">{profile.email} · {profile.phone}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cursus Master / Ingénieur</span>
                  <div className="font-bold text-slate-900">{profile.masterDegree}</div>
                  <div className="text-slate-600">{profile.masterUniversity}</div>
                  <div className="font-bold text-emerald-800">Moyenne : {profile.masterGrade} / 20 ({profile.masterMention})</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Sujet de thèse postulé</span>
                <div className="font-bold text-emerald-950">{topic.code} : {topic.title}</div>
                <div className="text-emerald-800 text-[11px]">
                  Encadrant : {topic.professorName} · {topic.institution}
                </div>
              </div>

              {/* Uploaded Documents Summary */}
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Pièces prêtes pour transmission ({documents.length}) :</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {documents.map((d) => (
                    <span 
                      key={d.id}
                      className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{d.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Legal Honor Certification */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Attestation sur l’honneur & Engagement</span>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={honorCertified}
                    onChange={(e) => setHonorCertified(e.target.value !== undefined ? e.target.checked : false)}
                    className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span className="text-[11px] text-amber-950 font-medium leading-relaxed">
                    Je soussigné(e) certifie sur l’honneur l’exactitude absolue des informations fournies ainsi que l’authenticité des pièces justificatives déposées. Je reconnais que toute fausse déclaration entraînera l’annulation automatique de ma candidature et des poursuites disciplinaires conformément aux règlements de l’USMBA.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>Précédent</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Fermer
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                saveDraftSilently();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Enregistrer brouillon</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={!honorCertified || isSubmitting}
                className="px-6 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Check className="w-4 h-4 animate-spin" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Soumettre ma candidature</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Upload Modal for Camera / File Upload */}
      {activeUploadDoc && (
        <DocumentUploadModal
          isOpen={Boolean(activeUploadDoc)}
          onClose={() => setActiveUploadDoc(null)}
          documentCategory={activeUploadDoc.category}
          documentName={activeUploadDoc.name}
          existingDocument={documents.find((d) => d.category === activeUploadDoc.category)}
          onSaveDocument={handleSaveDocument}
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
    </div>
  );
};
