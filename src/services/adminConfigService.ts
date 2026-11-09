/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Admin Configuration Service — Academic campaigns, institutions, laboratories, and required documents.
 * Includes complete architectural audit and transparency inspection metadata.
 */

import { 
  CampaignConfig, 
  InstitutionConfig, 
  LaboratoryConfig, 
  RequiredDocumentConfig,
  ThesisTopic 
} from '../types';

import { V5_KEYS } from './dataMigrationService';
import { getCurrentAcademicYear } from './dateUtils';

const CAMPAIGN_STORAGE_KEY = V5_KEYS.CAMPAIGN;
const DOCUMENTS_CONFIG_STORAGE_KEY = 'usmba_docs_config_v5';
const TOPICS_OVERRIDE_STORAGE_KEY = 'usmba_topics_overrides_v5';

const CURRENT_YEAR = getCurrentAcademicYear();

export const DEFAULT_CAMPAIGN: CampaignConfig = {
  id: `campaign-${CURRENT_YEAR.replace('/', '-')}`,
  academicYear: CURRENT_YEAR,
  title: `Campagne Doctorale USMBA ${CURRENT_YEAR} · Session Principale`,
  openingDate: '2026-10-01',
  closingDate: '2026-11-25',
  deliberationDate: '2026-12-05',
  resultsDate: '2026-12-10',
  registrationDeadline: '2026-12-20T23:59:59',
  registrationDaysAllowed: 10,
  physicalDepositDeadline: '2026-12-25',
  status: 'active',
  maxApplicationsPerCandidate: 3,
  deadlineHistory: [
    {
      date: '2026-10-10T09:00:00.000Z',
      previousDeadline: '2026-12-15T23:59:59',
      newDeadline: '2026-12-20T23:59:59',
      reason: 'Calendrier académique initial fixé par le conseil du CEDoc',
      modifiedBy: 'Pr. Mostafa Bennani (Directeur du CEDoc)',
    },
  ],
};

export const USMBA_INSTITUTIONS: InstitutionConfig[] = [
  {
    id: 'inst-fst',
    code: 'FST',
    name: 'Faculté des Sciences et Techniques de Fès',
    nameAr: 'كلية العلوم والتقنيات بفاس',
    cedocName: 'Centre d’Études Doctorales Sciences & Techniques',
    city: 'Fès',
  },
  {
    id: 'inst-fsdm',
    code: 'FSDM',
    name: 'Faculté des Sciences Dhar El Mahraz',
    nameAr: 'كلية العلوم ظهر المهراز',
    cedocName: 'Centre d’Études Doctorales Sciences Exactes & Naturelles',
    city: 'Fès',
  },
  {
    id: 'inst-flsh',
    code: 'FLSH',
    name: 'Faculté des Lettres et des Sciences Humaines',
    nameAr: 'كلية الآداب والعلوم الإنسانية ظهر المهراز',
    cedocName: 'Centre d’Études Doctorales Lettres, Sciences Humaines & Arts',
    city: 'Fès',
  },
  {
    id: 'inst-fsjes',
    code: 'FSJES',
    name: 'Faculté des Sciences Juridiques, Économiques et Sociales',
    nameAr: 'كلية العلوم القانونية والاقتصادية والاجتماعية',
    cedocName: 'Centre d’Études Doctorales Droit, Économie & Gestion',
    city: 'Fès',
  },
  {
    id: 'inst-fpt',
    code: 'FPT',
    name: 'Faculté Polydisciplinaire de Taza',
    nameAr: 'الكلية المتعددة التخصصات بتازة',
    cedocName: 'Centre d’Études Doctorales Pluridisciplinaire de Taza',
    city: 'Taza',
  },
  {
    id: 'inst-ensa',
    code: 'ENSA',
    name: 'École Nationale des Sciences Appliquées de Fès',
    nameAr: 'المدرسة الوطنية للعلوم التطبيقية بفاس',
    cedocName: 'Centre d’Études Doctorales Sciences de l’Ingénieur',
    city: 'Fès',
  },
  {
    id: 'inst-ens',
    code: 'ENS',
    name: 'École Normale Supérieure de Fès',
    nameAr: 'المدرسة العليا للأساتذة بفاس',
    cedocName: 'Centre d’Études Doctorales Sciences de l’Éducation',
    city: 'Fès',
  },
];

export const USMBA_LABORATORIES: LaboratoryConfig[] = [
  {
    id: 'lab-lisia',
    code: 'LISIA',
    name: 'Laboratoire Systèmes Intelligents & Applications',
    institutionId: 'inst-fst',
    institutionCode: 'FST',
    directorName: 'Pr. Karim Benali',
    researchAxes: ['Intelligence Artificielle', 'Computer Vision & OCR', 'NLP Arabophone', 'Systèmes Embarqués'],
  },
  {
    id: 'lab-lsi',
    code: 'LSI',
    name: 'Laboratoire des Systèmes Intelligents et Réseaux',
    institutionId: 'inst-ensa',
    institutionCode: 'ENSA',
    directorName: 'Pr. Mostafa Belkasmi',
    researchAxes: ['Cybersécurité', 'Réseaux 5G/6G', 'IoT', 'Optimisation Distribuée'],
  },
  {
    id: 'lab-lim',
    code: 'LIM',
    name: 'Laboratoire d’Ingénierie des Matériaux et Environnement',
    institutionId: 'inst-fsdm',
    institutionCode: 'FSDM',
    directorName: 'Pr. Hassan Chehouani',
    researchAxes: ['Nanomatériaux', 'Traitement des Eaux', 'Énergies Renouvelables'],
  },
  {
    id: 'lab-lseg',
    code: 'LSEG',
    name: 'Laboratoire de Recherche en Sciences Économiques et Gestion',
    institutionId: 'inst-fsjes',
    institutionCode: 'FSJES',
    directorName: 'Pr. Khalid Daoudi',
    researchAxes: ['Finance Publique', 'Gouvernance Territoriale', 'Économie Numérique'],
  },
  {
    id: 'lab-llsh',
    code: 'LLSH',
    name: 'Laboratoire Langues, Discours et Espaces Pluriels',
    institutionId: 'inst-flsh',
    institutionCode: 'FLSH',
    directorName: 'Pr. Fatima Zahra Bouziane',
    researchAxes: ['Linguistique Contrastive', 'Traductologie', 'Patrimoine Immatériel Marocain'],
  },
];

export const DEFAULT_REQUIRED_DOCUMENTS: RequiredDocumentConfig[] = [
  {
    id: 'doc-cin',
    category: 'cin',
    label: 'Carte Nationale d’Identité Électronique (CNIE)',
    description: 'Copie recto-verso nette en couleur de la CNIE valide (ou Passeport pour les étrangers).',
    mandatory: true,
    allowedFormats: ['pdf', 'jpg', 'png'],
    maxSizeMb: 5,
  },
  {
    id: 'doc-master',
    category: 'master_diploma',
    label: 'Diplôme de Master ou Ingénieur d’État (ou Attestation)',
    description: 'Diplôme officiel ou attestation de réussite dûment signée par le Doyen ou Directeur.',
    mandatory: true,
    allowedFormats: ['pdf'],
    maxSizeMb: 10,
  },
  {
    id: 'doc-transcripts',
    category: 'transcripts',
    label: 'Relevés de notes universitaires complets (S1 à S4)',
    description: 'Relevés officiels comportant les moyennes semestrielles et les cachets originaux.',
    mandatory: true,
    allowedFormats: ['pdf'],
    maxSizeMb: 10,
  },
  {
    id: 'doc-cv',
    category: 'cv',
    label: 'Curriculum Vitae académique détaillé',
    description: 'Parcours complet, compétences techniques, publications ou stages significatifs.',
    mandatory: true,
    allowedFormats: ['pdf'],
    maxSizeMb: 5,
  },
  {
    id: 'doc-pfe',
    category: 'pfe_thesis',
    label: 'Mémoire ou Rapport de Projet de Fin d’Études (PFE)',
    description: 'Synthèse ou rapport complet du travail de fin d’études de Master / Ingénieur.',
    mandatory: true,
    allowedFormats: ['pdf'],
    maxSizeMb: 15,
  },
  {
    id: 'doc-motivation',
    category: 'motivation_letter',
    label: 'Lettre de motivation scientifique & projet de recherche',
    description: 'Exposé d’adéquation du candidat avec la problématique scientifique du sujet choisi.',
    mandatory: false,
    allowedFormats: ['pdf'],
    maxSizeMb: 5,
  },
];

export interface SystemAuditItem {
  component: string;
  status: 'online' | 'local_storage' | 'simulated' | 'pending_configuration';
  executionEnvironment: string;
  securityVerdict: string;
  serverConstraintNotice: string;
}

export const REAL_SECURITY_AUDIT: SystemAuditItem[] = [
  {
    component: 'Gestion des Rôles & Autorisations (RBAC)',
    status: 'local_storage',
    executionEnvironment: 'Contrôles dans le client React + simulation de session',
    securityVerdict: 'Non infalsifiable côté navigateur. La véritable sécurité exige des règles Firestore (firestore.rules) ou un token JWT serveur signé.',
    serverConstraintNotice: 'Le client bloque l’accès UI aux espaces protégés et empêche l’auto-attribution de rôles non-candidat lors de l’inscription.',
  },
  {
    component: 'Base de Données des Candidatures & Profils',
    status: 'local_storage',
    executionEnvironment: 'LocalStorage du navigateur (clés usmba_applications_v1, usmba_candidate_profile_v2)',
    securityVerdict: 'Isolé par navigateur/poste local. Pour un partage multi-postes, le déploiement Firestore cloud est requis.',
    serverConstraintNotice: 'Règles firestore.rules préparées pour isoler la lecture des dossiers aux seuls encadrants responsables du sujet.',
  },
  {
    component: 'Stockage des Fichiers & Pièces Justificatives',
    status: 'local_storage',
    executionEnvironment: 'Encodage Data URLs Base64 dans le navigateur / IndexedDB',
    securityVerdict: 'Limité à la mémoire locale de l’appareil du candidat. Aucun document n’est transmis à un serveur distant sans Cloud Storage.',
    serverConstraintNotice: 'Pour une production institutionnelle, relier un bucket Cloud Storage sécurisé avec jetons d’accès signés.',
  },
  {
    component: 'Envoi d’E-mails & Notifications (SMTP)',
    status: 'simulated',
    executionEnvironment: 'Centre d’alertes interne au portail (NotificationService)',
    securityVerdict: 'Transparent : aucun e-mail réel n’est envoyé. Les notifications sont délivrées dans le centre interne.',
    serverConstraintNotice: 'Un serveur SMTP ou un fournisseur transactionnel (Sendgrid, Mailgun) doit être configuré pour l’envoi réel.',
  },
  {
    component: 'Extraction Optique CNIE (OCR)',
    status: 'simulated',
    executionEnvironment: 'Traitement client heuristique avec vérification humaine obligatoire',
    securityVerdict: 'Conforme au principe de consentement explicite. Ne transmet aucune donnée biométrique à l’extérieur.',
    serverConstraintNotice: 'Extraction locale d’aide à la saisie ; validation finale sous la responsabilité du candidat et de l’agent CEDoc.',
  },
];

export const AdminConfigService = {
  getCampaign(): CampaignConfig {
    try {
      const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_CAMPAIGN;
    } catch {
      return DEFAULT_CAMPAIGN;
    }
  },

  saveCampaign(config: CampaignConfig): void {
    try {
      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save campaign config', e);
    }
  },

  updateCampaign(partial: Partial<CampaignConfig>): CampaignConfig {
    const current = this.getCampaign();
    const updated = { ...current, ...partial };
    this.saveCampaign(updated);
    return updated;
  },

  updateRegistrationDeadline(newDeadline: string, reason: string, authorName: string): CampaignConfig {
    const current = this.getCampaign();
    const history = current.deadlineHistory || [];
    history.push({
      date: new Date().toLocaleString('fr-FR'),
      previousDeadline: current.registrationDeadline,
      newDeadline,
      reason,
      modifiedBy: authorName,
    });

    const updated: CampaignConfig = {
      ...current,
      registrationDeadline: newDeadline,
      deadlineHistory: history,
    };
    this.saveCampaign(updated);
    return updated;
  },

  getRequiredDocuments(): RequiredDocumentConfig[] {
    try {
      const raw = localStorage.getItem(DOCUMENTS_CONFIG_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_REQUIRED_DOCUMENTS;
    } catch {
      return DEFAULT_REQUIRED_DOCUMENTS;
    }
  },

  saveRequiredDocuments(docs: RequiredDocumentConfig[]): void {
    try {
      localStorage.setItem(DOCUMENTS_CONFIG_STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
      console.warn('Failed to save docs config', e);
    }
  },

  toggleDocumentMandatory(docId: string): RequiredDocumentConfig[] {
    const list = this.getRequiredDocuments();
    const updated = list.map((d) => d.id === docId ? { ...d, mandatory: !d.mandatory } : d);
    this.saveRequiredDocuments(updated);
    return updated;
  },

  getInstitutions(): InstitutionConfig[] {
    return USMBA_INSTITUTIONS;
  },

  getLaboratories(institutionId?: string): LaboratoryConfig[] {
    if (institutionId) {
      return USMBA_LABORATORIES.filter((l) => l.institutionId === institutionId);
    }
    return USMBA_LABORATORIES;
  },

  getSecurityAudit(): SystemAuditItem[] {
    return REAL_SECURITY_AUDIT;
  },

  /**
   * Topic validation workflow override by Administration
   */
  updateTopicWorkflowStep(
    topicId: string,
    step: 'structure' | 'centre' | 'pole',
    status: 'valid' | 'pending' | 'rejected',
    validatorName: string,
    comments?: string
  ): void {
    try {
      const raw = localStorage.getItem(TOPICS_OVERRIDE_STORAGE_KEY);
      const overrides: Record<string, Partial<ThesisTopic['workflow']>> = raw ? JSON.parse(raw) : {};
      
      const current = overrides[topicId] || {};
      overrides[topicId] = {
        ...current,
        [step]: {
          name: step === 'structure' ? 'Structure de Recherche' : step === 'centre' ? 'Conseil du CEDoc' : 'Pôle Doctoral USMBA',
          status,
          date: new Date().toLocaleDateString('fr-FR'),
          validatedBy: validatorName,
          comments: comments || (status === 'valid' ? 'Validation officielle confirmée' : 'Réserves émises'),
        },
      };

      localStorage.setItem(TOPICS_OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.warn('Failed to persist topic workflow update', e);
    }
  },

  getTopicOverrides(): Record<string, Partial<ThesisTopic['workflow']>> {
    try {
      const raw = localStorage.getItem(TOPICS_OVERRIDE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
};
