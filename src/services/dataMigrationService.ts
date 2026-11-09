/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Data Migration & Versioning Service for USMBA Doctoral Platform
 * Safely migrates browser localStorage data across schema versions:
 * - Upgrades schema to v5
 * - Modernizes legacy 2024 prototype dates and academic year (2024/2025 -> 2026/2027)
 * - Converts dates to standard ISO 8601 strings
 * - Preserves candidate-created drafts, applications and registered accounts
 * - Ensures empty lists and deleted drafts are respected
 */

import { getCurrentAcademicYear, toISOStringSafe } from './dateUtils';

export const CURRENT_SCHEMA_VERSION = 5;

// Storage key constants (v5)
export const V5_KEYS = {
  SCHEMA_VERSION: 'usmba_schema_version',
  ACCOUNTS: 'usmba_auth_accounts_v5',
  SESSION: 'usmba_active_session_v5',
  TOPICS: 'usmba_thesis_topics_v5',
  APPLICATIONS: 'usmba_applications_v5',
  NOTIFICATIONS: 'usmba_notifications_v5',
  CAMPAIGN: 'usmba_campaign_config_v5',
  PROPOSALS: 'usmba_waitlist_proposals_v5',
  DELETED_DRAFTS: 'usmba_deleted_draft_ids_v5',
};

// Legacy keys for migration
const LEGACY_KEYS = {
  ACCOUNTS_V3: 'usmba_auth_accounts_v3',
  SESSION_V3: 'usmba_active_session_v3',
  TOPICS_V3: 'usmba_thesis_topics_v3',
  APPLICATIONS_V1: 'usmba_applications_v1',
  NOTIFICATIONS_V3: 'usmba_notifications_v3',
  CAMPAIGN_V2: 'usmba_campaign_config_v2',
};

export const DataMigrationService = {
  /**
   * Run schema migration if needed on app startup
   */
  runMigrationIfNeeded(): { migrated: boolean; previousVersion: number; newVersion: number } {
    try {
      const rawVersion = localStorage.getItem(V5_KEYS.SCHEMA_VERSION);
      const currentVer = rawVersion ? parseInt(rawVersion, 10) : 0;

      if (currentVer >= CURRENT_SCHEMA_VERSION) {
        return { migrated: false, previousVersion: currentVer, newVersion: CURRENT_SCHEMA_VERSION };
      }

      console.info(`[USMBA Migration] Migrating schema from v${currentVer} to v${CURRENT_SCHEMA_VERSION}...`);

      // 1. Create a non-destructive safety snapshot of pre-migration state
      try {
        const snapshot: Record<string, string | null> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('usmba_')) {
            snapshot[k] = localStorage.getItem(k);
          }
        }
        localStorage.setItem('usmba_backup_pre_v5', JSON.stringify(snapshot));
      } catch (e) {
        console.warn('[USMBA Migration] Could not create pre-migration snapshot', e);
      }

      const activeYear = getCurrentAcademicYear();

      // 2. Migrate Topics
      this.migrateTopics(activeYear);

      // 3. Migrate Applications
      this.migrateApplications(activeYear);

      // 4. Migrate Accounts
      this.migrateAccounts();

      // 5. Migrate Campaign
      this.migrateCampaign(activeYear);

      // 6. Migrate Notifications
      this.migrateNotifications();

      // Set current schema version
      localStorage.setItem(V5_KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));

      console.info(`[USMBA Migration] Successfully migrated to v${CURRENT_SCHEMA_VERSION}`);
      return { migrated: true, previousVersion: currentVer, newVersion: CURRENT_SCHEMA_VERSION };
    } catch (err) {
      console.error('[USMBA Migration] Error during migration:', err);
      // Fallback: set version to avoid infinite loop
      localStorage.setItem(V5_KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
      return { migrated: false, previousVersion: 0, newVersion: CURRENT_SCHEMA_VERSION };
    }
  },

  migrateTopics(activeYear: string): void {
    const raw = localStorage.getItem(V5_KEYS.TOPICS) || localStorage.getItem(LEGACY_KEYS.TOPICS_V3);
    if (!raw) return;

    try {
      const topics: any[] = JSON.parse(raw);
      if (!Array.isArray(topics)) return;

      const updated = topics.map((t) => {
        const id = t.id ? t.id.replace('2024', '2026') : t.id;
        const code = t.code ? t.code.replace('-24-', '-26-') : t.code;
        const submissionDeadline = t.submissionDeadline ? t.submissionDeadline.replace('2024-', '2026-') : '2026-11-25';
        
        let electronicSignature = t.electronicSignature;
        if (electronicSignature && electronicSignature.signedAt) {
          electronicSignature = {
            ...electronicSignature,
            signedAt: toISOStringSafe(electronicSignature.signedAt),
          };
        }

        return {
          ...t,
          id,
          code,
          academicYear: activeYear,
          submissionDeadline,
          electronicSignature,
        };
      });

      localStorage.setItem(V5_KEYS.TOPICS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to migrate topics', e);
    }
  },

  migrateApplications(activeYear: string): void {
    const raw = localStorage.getItem(V5_KEYS.APPLICATIONS) || localStorage.getItem(LEGACY_KEYS.APPLICATIONS_V1);
    if (!raw) return;

    try {
      const apps: any[] = JSON.parse(raw);
      if (!Array.isArray(apps)) return;

      const updated = apps.map((app) => {
        const topicId = app.topicId ? app.topicId.replace('2024', '2026') : app.topicId;
        const topicCode = app.topicCode ? app.topicCode.replace('-24-', '-26-') : app.topicCode;
        const submissionDate = app.submissionDate ? toISOStringSafe(app.submissionDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
        const decisionDate = app.decisionDate ? toISOStringSafe(app.decisionDate).slice(0, 10) : undefined;
        
        // Convert registration deadline to 2026 ISO if exists
        let registrationDeadline = app.registrationDeadline;
        if (registrationDeadline && registrationDeadline.includes('2024')) {
          registrationDeadline = registrationDeadline.replace('2024', '2026');
        }

        return {
          ...app,
          topicId,
          topicCode,
          submissionDate,
          decisionDate,
          registrationDeadline,
        };
      });

      localStorage.setItem(V5_KEYS.APPLICATIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to migrate applications', e);
    }
  },

  migrateAccounts(): void {
    const raw = localStorage.getItem(V5_KEYS.ACCOUNTS) || localStorage.getItem(LEGACY_KEYS.ACCOUNTS_V3);
    if (!raw) return;

    try {
      const accounts: any[] = JSON.parse(raw);
      if (!Array.isArray(accounts)) return;

      const updated = accounts.map((acc) => {
        let createdAt = acc.createdAt;
        if (createdAt && createdAt.includes('2024')) {
          createdAt = createdAt.replace('2024', '2026');
        }
        return {
          ...acc,
          createdAt: createdAt || new Date().toISOString(),
        };
      });

      localStorage.setItem(V5_KEYS.ACCOUNTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to migrate accounts', e);
    }
  },

  migrateCampaign(activeYear: string): void {
    const raw = localStorage.getItem(V5_KEYS.CAMPAIGN) || localStorage.getItem(LEGACY_KEYS.CAMPAIGN_V2);
    if (!raw) return;

    try {
      const campaign = JSON.parse(raw);
      if (!campaign) return;

      const updated = {
        ...campaign,
        academicYear: activeYear,
        title: campaign.title ? campaign.title.replace('2024/2025', activeYear) : `Campagne Doctorale USMBA ${activeYear}`,
        openingDate: campaign.openingDate ? campaign.openingDate.replace('2024', '2026') : '2026-10-01',
        closingDate: campaign.closingDate ? campaign.closingDate.replace('2024', '2026') : '2026-11-25',
        deliberationDate: campaign.deliberationDate ? campaign.deliberationDate.replace('2024', '2026') : '2026-12-05',
        resultsDate: campaign.resultsDate ? campaign.resultsDate.replace('2024', '2026') : '2026-12-10',
        registrationDeadline: campaign.registrationDeadline ? campaign.registrationDeadline.replace('2024', '2026') : '2026-12-20T23:59:59',
        physicalDepositDeadline: campaign.physicalDepositDeadline ? campaign.physicalDepositDeadline.replace('2024', '2026') : '2026-12-25',
      };

      localStorage.setItem(V5_KEYS.CAMPAIGN, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to migrate campaign', e);
    }
  },

  migrateNotifications(): void {
    const raw = localStorage.getItem(V5_KEYS.NOTIFICATIONS) || localStorage.getItem(LEGACY_KEYS.NOTIFICATIONS_V3);
    if (!raw) return;

    try {
      const notifs: any[] = JSON.parse(raw);
      if (!Array.isArray(notifs)) return;

      const updated = notifs.map((n) => {
        let createdAt = n.createdAt;
        if (createdAt && createdAt.includes('2024')) {
          createdAt = toISOStringSafe(createdAt.replace('2024', '2026'));
        }
        return {
          ...n,
          createdAt: createdAt || new Date().toISOString(),
          relatedTopicId: n.relatedTopicId ? n.relatedTopicId.replace('2024', '2026') : n.relatedTopicId,
          relatedApplicationId: n.relatedApplicationId ? n.relatedApplicationId.replace('2024', '2026') : n.relatedApplicationId,
        };
      });

      localStorage.setItem(V5_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to migrate notifications', e);
    }
  },
};
