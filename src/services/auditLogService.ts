/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Audit Log Service — Platform Governance, Traceability & Activity Logging
 * Records all critical administrative, academic and candidate actions.
 */

import { AuditLogEntry, AppRole } from '../types';
import { V5_KEYS } from './dataMigrationService';

const AUDIT_STORAGE_KEY = V5_KEYS.AUDIT_LOGS;

const SEEDED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-01T08:00:00.000Z',
    authorName: 'M. Reda Tazi',
    authorEmail: 'admin.test@usmba.ma',
    authorRole: 'admin',
    action: 'Ouverture de la campagne doctorale 2026/2027',
    category: 'campaign',
    targetEntityId: 'camp-2026-01',
    targetEntityType: 'CampaignConfig',
    newValue: 'Campagne Doctorale USMBA 2026/2027 active',
    comment: 'Initialisation des paramètres réglementaires et de la règle stricte de candidature unique.',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-15T09:30:00.000Z',
    authorName: 'Youssef El Amrani',
    authorEmail: 'candidat.test@usmba.ma',
    authorRole: 'candidate',
    action: 'Création du compte candidat',
    category: 'auth',
    targetEntityId: 'user-test-cand',
    targetEntityType: 'AuthAccount',
    comment: 'Auto-inscription candidat avec email institutionnel validé.',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-18T14:32:00.000Z',
    authorName: 'Youssef El Amrani',
    authorEmail: 'candidat.test@usmba.ma',
    authorRole: 'candidate',
    action: 'Dépôt formel de candidature unique',
    category: 'application',
    targetEntityId: 'app-2026-001',
    targetEntityType: 'CandidateApplication',
    oldValue: 'draft',
    newValue: 'pending_review',
    comment: 'Sujet ciblé : FST-LISIA-26-01 (Arabic OCR using AI).',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-24T15:30:00.000Z',
    authorName: 'Pr. Karim Benali',
    authorEmail: 'directeur.these.test@usmba.ma',
    authorRole: 'thesis_director',
    action: 'Émission d’avis scientifique favorable',
    category: 'decision',
    targetEntityId: 'app-2026-001',
    targetEntityType: 'CandidateApplication',
    oldValue: 'pending_review',
    newValue: 'scientific_opinion: favorable (17.5/20)',
    comment: 'Évaluation scientifique terminée. Profil d’excellence en adéquation avec les axes du laboratoire LISIA.',
  },
  {
    id: 'log-005',
    timestamp: '2026-10-25T11:00:00.000Z',
    authorName: 'Pr. Mostafa Bennani',
    authorEmail: 'directeur.structure.test@usmba.ma',
    authorRole: 'structure_director',
    action: 'Validation officielle de l’admission sur Liste Principale',
    category: 'decision',
    targetEntityId: 'app-2026-001',
    targetEntityType: 'CandidateApplication',
    oldValue: 'pending_review',
    newValue: 'admitted',
    comment: 'Décision administrative entérinée. Délai d’inscription fixé à 7 jours calendaires.',
  },
  {
    id: 'log-006',
    timestamp: '2026-10-28T10:15:00.000Z',
    authorName: 'M. Reda Tazi',
    authorEmail: 'admin.test@usmba.ma',
    authorRole: 'admin',
    action: 'Audit de conformité des candidatures uniques',
    category: 'system',
    targetEntityType: 'PlatformIntegrity',
    comment: 'Vérification de l’unicité des dossiers candidats : 100% de conformité.',
  },
];

export const AuditLogService = {
  getLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      this.saveLogs(SEEDED_AUDIT_LOGS);
      return SEEDED_AUDIT_LOGS;
    } catch {
      return SEEDED_AUDIT_LOGS;
    }
  },

  saveLogs(logs: AuditLogEntry[]): void {
    try {
      // Keep maximum 300 entries to protect localStorage
      const trimmed = logs.slice(0, 300);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to persist audit logs', e);
    }
  },

  log(entry: {
    authorName?: string;
    authorEmail?: string;
    authorRole?: AppRole;
    action: string;
    category?: AuditLogEntry['category'];
    targetEntityId?: string;
    targetEntityType?: string;
    oldValue?: string;
    newValue?: string;
    comment?: string;
    details?: string;
    userEmail?: string;
    userRole?: AppRole;
    targetId?: string;
  }): AuditLogEntry {
    const logs = this.getLogs();
    const effectiveEmail = entry.authorEmail || entry.userEmail || 'system@usmba.ma';
    const effectiveRole = entry.authorRole || entry.userRole || 'candidate';
    const effectiveName = entry.authorName || effectiveEmail.split('@')[0];
    const effectiveDetails = entry.details || entry.comment || entry.action;
    const effectiveCategory = entry.category || 'application';

    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      authorName: effectiveName,
      authorEmail: effectiveEmail,
      authorRole: effectiveRole,
      action: entry.action,
      category: effectiveCategory,
      targetEntityId: entry.targetEntityId || entry.targetId,
      targetEntityType: entry.targetEntityType,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      comment: effectiveDetails,
      details: effectiveDetails,
      userEmail: effectiveEmail,
      userRole: effectiveRole,
    };

    logs.unshift(newEntry);
    this.saveLogs(logs);
    return newEntry;
  },

  clearLogs(): void {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
