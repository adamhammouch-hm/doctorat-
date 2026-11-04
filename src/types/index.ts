/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Type definitions for USMBA Doctoral Platform (Doctorat USMBA)
 * Exact 3 profiles:
 * 1. candidate (Candidat)
 * 2. thesis_director (Directeur de thèse / Encadrant unifié)
 * 3. structure_director (Directeur de structure - Labo / CEDoc / Pôle)
 */

export type Language = 'fr' | 'ar';

/**
 * EXACT THREE PROFILES REQUIRED:
 * - candidate: Candidat au doctorat
 * - thesis_director: Directeur de thèse & Encadrant (rôle unique)
 * - structure_director: Directeur de structure (Laboratoire, CEDoc, Pôle doctoral)
 */
export type AppRole = 'candidate' | 'thesis_director' | 'structure_director';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  title?: string;
  department?: string;
  institution?: string;
  laboratory?: string;
}

export interface AuthAccount {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  passwordHash: string;
  createdAt: string;
  title?: string;
  department?: string;
  institution?: string;
  laboratory?: string;
  resetToken?: string;
  resetTokenExpiry?: number;
}

export type ValidationStepStatus = 'valid' | 'pending' | 'revision_requested' | 'rejected';

export interface ValidationStep {
  name: string;
  status: ValidationStepStatus;
  date?: string;
  validatedBy?: string;
  comments?: string;
}

export interface ValidationWorkflow {
  structure: ValidationStep; // Laboratoire / Équipe de recherche
  centre: ValidationStep;    // Faculté / CEDoc (Centre d'Études Doctorales)
  pole: ValidationStep;      // Présidence / Pôle Doctoral central
}

/**
 * Internal Electronic Signature for Thesis Topics & Official Decisions
 * Note: Internal university electronic validation stamp, not 3P eIDAS certified.
 */
export interface InternalElectronicSignature {
  signerName: string;
  signerEmail: string;
  signerRole: string; // e.g. "Directeur de Structure (CEDoc)"
  signedAt: string;
  signatureFingerprint: string; // SHA-256 integrity hash simulation
  comments?: string;
}

export type TopicWorkflowStatus = 
  | 'draft'               // En cours de rédaction par le Directeur de thèse
  | 'submitted'           // Soumis au Directeur de structure pour validation
  | 'revision_requested'  // Modifications demandées par le Directeur de structure
  | 'approved_signed'     // Validé et signé électroniquement par le Directeur de structure
  | 'published'           // Publié officiellement au catalogue des candidats
  | 'rejected';           // Rejeté avec motif motivé

export type TopicAvailability = 'open' | 'closed' | 'under_review';

export interface ThesisTopic {
  id: string;
  code: string;
  title: string;
  titleAr?: string;
  scientificDescription: string;
  scientificDescriptionAr?: string;
  academicYear: string;
  domain: string;
  domainAr?: string;
  specialty?: string;
  professorName: string;
  professorTitle: string;
  professorEmail: string;
  laboratory: string; // Structure de recherche
  institution: string; // Établissement (ex: Faculté des Sciences et Techniques)
  eligibilityCriteria: string[];
  requiredSkills: string[];
  fundingType?: 'bourse_cnrst' | 'projet_recherche' | 'partenariat_industriel' | 'non_remunere';
  spotsAvailable: number;
  applicantsCount: number;
  submissionDeadline: string;
  status: TopicAvailability;
  workflowStatus: TopicWorkflowStatus;
  workflow: ValidationWorkflow;
  electronicSignature?: InternalElectronicSignature;
  revisionRequests?: {
    date: string;
    requestedBy: string;
    message: string;
    resolved: boolean;
  }[];
  isOfficialPublication: boolean; // Must be true & approved_signed/published to accept applications
}

export interface TopicFilters {
  searchQuery: string;
  institution: string;
  laboratory: string;
  domain: string;
  academicYear: string;
  professor: string;
  onlyOpen: boolean;
  sortBy: 'deadline' | 'title' | 'applicants' | 'newest';
}

export interface CartConfig {
  maxSelectableTopics: number; // Configurable limit (default: 3)
}

/**
 * Official application statuses required for doctoral management:
 * 1. draft: Brouillon
 * 2. incomplete: Dossier incomplet
 * 3. pending_verification: En attente de vérification
 * 4. correction_requested: Correction demandée
 * 5. complete: Dossier complet
 * 6. under_review: En cours d'examen
 * 7. pending_decision: En attente de décision
 * 8. admitted: Admis (Liste Principale)
 * 9. rejected: Rejeté (Motif obligatoire)
 * 10. waitlist: Liste d'attente
 * 11. registration_pending: Inscription à effectuer
 * 12. registration_confirmed: Inscription confirmée
 * 13. deadline_exceeded: Délai d'inscription dépassé
 * 14. admission_cancelled: Admission annulée
 */
export type ApplicationStatus = 
  | 'draft'
  | 'incomplete'
  | 'pending_verification'
  | 'correction_requested'
  | 'complete'
  | 'under_review'
  | 'pending_decision'
  | 'admitted'
  | 'rejected'
  | 'waitlist'
  | 'registration_pending'
  | 'registration_confirmed'
  | 'deadline_exceeded'
  | 'admission_cancelled'
  // Backward compatibility aliases
  | 'accepted'
  | 'waitlisted'
  | 'pending_review';

export type DocumentCategory = 
  | 'cin' 
  | 'master_diploma' 
  | 'transcripts' 
  | 'cv' 
  | 'pfe_thesis' 
  | 'motivation_letter';

export interface ApplicationDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  fileType?: 'pdf' | 'image' | 'multi_image';
  status: 'valid' | 'needs_correction' | 'pending';
  note?: string;
  pages?: string[]; // Base64 or cloud storage URL references
  uploadedAt?: string;
  storageRef?: string; // Local storage reference or IndexedDB document id
  isStoredInIndexedDb?: boolean;
}

export interface ApplicationAuditEntry {
  id: string;
  date: string;
  action: string;
  author: string;
  note?: string;
}

/**
 * Reusable Candidate Profile
 */
export interface CandidateProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  cin: string;
  cne: string;
  birthDate: string;
  nationality: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  address: string;
  city: string;
  // Parcours Bac & Licence
  bacType: string;
  bacYear: string;
  bacMention: string;
  licenseDegree: string;
  licenseUniversity: string;
  licenseYear: string;
  licenseGrade: number;
  // Parcours Master / Ingénieur
  masterDegree: string;
  masterUniversity: string;
  masterYear: string;
  masterGrade: number;
  masterMention: string;
  pfeTitle: string;
  pfeSupervisor?: string;
  updatedAt: string;
}

export interface ScientificOpinion {
  recommendation: 'favorable' | 'defavorable' | 'reserve';
  score?: number; // Note sur 20
  academicAppraisal: string;
  evaluatorName: string;
  evaluatedAt: string;
}

export interface CandidateApplication {
  id: string;
  topicId: string;
  topicCode: string;
  topicTitle: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  cne: string;
  cin: string;
  masterDegree: string;
  masterUniversity: string;
  masterGrade: number;
  masterMention: string;
  pfeTitle: string;
  statementOfPurpose?: string;
  scientificAlignment?: string;
  submissionDate: string;
  status: ApplicationStatus;
  isDraft?: boolean;
  draftStep?: number;
  correctionMessage?: string;
  rejectionReason?: string; // Mandatory on rejection
  waitlistRank?: number;    // Rank on waitlist
  officialRanking?: number; // Merit ranking by thesis director
  decisionDate?: string;
  decisionBy?: string;
  registrationDeadline?: string; // e.g. "2024-12-05T23:59:59"
  scientificOpinion?: ScientificOpinion;
  documents: ApplicationDocument[];
  history: ApplicationAuditEntry[];
  physicalReception?: {
    received: boolean;
    date?: string;
    agentName?: string;
    verifiedOriginals: string[];
  };
}

export interface CinOcrResult {
  cinNumber: string;
  firstNameFr: string;
  lastNameFr: string;
  birthDate: string;
  validityDate?: string;
  confidenceScore: number;
  rawExtractionNotice: string;
}

export interface CampaignConfig {
  id: string;
  academicYear: string;
  title: string;
  openingDate: string;
  closingDate: string;
  deliberationDate: string;
  resultsDate: string;
  registrationDeadline: string; // Common registration deadline
  registrationDaysAllowed: number; // e.g. 10 business days for waitlist promoted candidate
  physicalDepositDeadline: string;
  status: 'active' | 'upcoming' | 'closed';
  maxApplicationsPerCandidate: number;
  deadlineHistory?: {
    date: string;
    previousDeadline: string;
    newDeadline: string;
    reason: string;
    modifiedBy: string;
  }[];
}

export interface InstitutionConfig {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  cedocName: string;
  city: string;
}

export interface LaboratoryConfig {
  id: string;
  code: string;
  name: string;
  institutionId: string;
  institutionCode: string;
  directorName: string;
  researchAxes: string[];
}

export interface RequiredDocumentConfig {
  id: string;
  category: DocumentCategory;
  label: string;
  description: string;
  mandatory: boolean;
  allowedFormats: string[];
  maxSizeMb: number;
}

export type NotificationType = 
  | 'submission' 
  | 'correction' 
  | 'decision' 
  | 'deadline' 
  | 'validation' 
  | 'waitlist_proposal'
  | 'admission_cancelled'
  | 'security';

export interface AppNotification {
  id: string;
  recipientEmail: string;
  recipientRole?: AppRole;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  relatedApplicationId?: string;
  relatedTopicId?: string;
}

/**
 * Automatic Waitlist Promotion Proposal
 * Created when a candidate's registration deadline expires.
 * Requires explicit confirmation by the Structure Director.
 */
export interface WaitlistPromotionProposal {
  id: string;
  topicId: string;
  topicCode: string;
  topicTitle: string;
  cancelledApplicationId: string;
  cancelledCandidateName: string;
  cancelledCandidateEmail: string;
  cancelledReason: string;
  cancelledAt: string;
  proposedApplicationId: string;
  proposedCandidateName: string;
  proposedCandidateEmail: string;
  proposedWaitlistRank: number;
  status: 'pending_director_confirmation' | 'confirmed' | 'dismissed';
  newRegistrationDeadline: string;
  directorNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
