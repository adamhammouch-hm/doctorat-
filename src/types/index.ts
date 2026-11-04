/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Type definitions for USMBA Doctoral Platform (GCD Refonte) — Phase 2
 */

export type Language = 'fr' | 'ar';

export type AppRole = 'candidate' | 'professor' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  title?: string;
  department?: string;
  institution?: string;
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
  resetToken?: string;
  resetTokenExpiry?: number;
}

export type ValidationStepStatus = 'valid' | 'pending' | 'rejected';

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
  professorName: string;
  professorTitle: string;
  professorEmail?: string;
  laboratory: string; // Structure de recherche
  institution: string; // Établissement (ex: Faculté des Sciences et Techniques)
  eligibilityCriteria: string[];
  requiredSkills: string[];
  fundingType?: 'bourse_cnrst' | 'projet_recherche' | 'partenariat_industriel' | 'non_remunere';
  spotsAvailable: number;
  applicantsCount: number;
  submissionDeadline: string;
  status: TopicAvailability;
  workflow: ValidationWorkflow;
  isOfficialPublication: boolean; // Must be true & status 'open' to accept applications
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
 * - draft: Brouillon en cours de saisie
 * - incomplete: Dossier incomplet (manque de pièces obligatoires)
 * - pending_review: En cours d'examen par l'encadrant et le CEDoc
 * - correction_requested: Correction d'une ou plusieurs pièces demandée
 * - waitlisted: Classé sur Liste d'Attente
 * - accepted: Admis sur Liste Principale
 * - rejected: Non retenu (avec motif obligatoire motivé)
 */
export type ApplicationStatus = 
  | 'draft'
  | 'incomplete'
  | 'pending_review'
  | 'correction_requested'
  | 'waitlisted'
  | 'accepted'
  | 'rejected';

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
  pages?: string[]; // Base64 data URLs for camera captures or page bundles
  uploadedAt?: string;
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
 * Allows doctoral applicants to define their personal, civil, and academic
 * background once and reuse it across multiple thesis topics without retyping.
 */
export interface CandidateProfile {
  id: string;
  userId: string;
  // Identité civile
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
  // Specific motivation
  statementOfPurpose?: string;
  scientificAlignment?: string;
  submissionDate: string;
  status: ApplicationStatus;
  isDraft?: boolean;
  draftStep?: number;
  correctionMessage?: string;
  rejectionReason?: string; // Obligatoire lors du rejet
  waitlistRank?: number;
  decisionDate?: string;
  decisionBy?: string;
  scientificOpinion?: ScientificOpinion; // Avis scientifique distinct de la décision administrative
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
  academicYear: string; // e.g. "2024/2025"
  title: string;
  openingDate: string;
  closingDate: string;
  deliberationDate: string;
  resultsDate: string;
  physicalDepositDeadline: string;
  status: 'active' | 'upcoming' | 'closed';
  maxApplicationsPerCandidate: number;
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
  allowedFormats: string[]; // e.g. ['pdf', 'jpg', 'png']
  maxSizeMb: number;
}

export type NotificationType = 
  | 'submission' 
  | 'correction' 
  | 'decision' 
  | 'deadline' 
  | 'validation' 
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
 * Future Module Extension Stubs (Prepared for next phases without breaking existing workflows)
 */
export interface ReRegistrationRequest {
  id: string;
  candidateId: string;
  topicId: string;
  yearOfDoctorate: number; // 2, 3, 4 (dérogatoire)
  academicYear: string;
  progressReportSummary: string;
  supervisorApproval: boolean;
  cedocApproval: boolean;
  submittedAt: string;
}

export interface DefenseRequest {
  id: string;
  candidateId: string;
  topicId: string;
  articlesPublishedCount: number;
  communicationsCount: number;
  preReviewers: string[];
  defenseStatus: 'draft' | 'under_review' | 'authorized' | 'completed';
  defenseDate?: string;
}
