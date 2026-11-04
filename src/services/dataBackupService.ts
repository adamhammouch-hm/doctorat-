/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local Data Backup, Export & Restore Service for USMBA Doctoral Platform
 * Enables zero-cloud full data portability, local backup download,
 * backup restoration with schema validation, and demonstration state reset.
 */

import { AuthService } from './authService';
import { ThesisTopicService, ApplicationService, DEMO_TOPICS, DEMO_APPLICATIONS } from './thesisService';
import { NotificationService } from './notificationService';
import { AdminConfigService } from './adminConfigService';
import { AdmissionWaitlistService } from './admissionWaitlistService';
import { LocalFileStorage } from './localFileStorage';
import { 
  ThesisTopic, 
  CandidateApplication, 
  AuthAccount, 
  AppNotification, 
  WaitlistPromotionProposal, 
  CampaignConfig 
} from '../types';

export interface PlatformBackupPayload {
  format: 'USMBA_DOCTORAT_BACKUP_V1';
  exportedAt: string;
  appVersion: string;
  summary: {
    topicsCount: number;
    applicationsCount: number;
    usersCount: number;
    notificationsCount: number;
    proposalsCount: number;
  };
  data: {
    accounts: AuthAccount[];
    topics: ThesisTopic[];
    applications: CandidateApplication[];
    notifications: AppNotification[];
    campaignConfig: CampaignConfig;
    waitlistProposals: WaitlistPromotionProposal[];
  };
  disclaimer: string;
}

export interface StorageStatistics {
  topicsCount: number;
  userCreatedTopicsCount: number;
  applicationsCount: number;
  usersCount: number;
  notificationsCount: number;
  proposalsCount: number;
  localStorageApproxBytes: number;
  indexedDbBytes: number;
  indexedDbFilesCount: number;
}

export const DataBackupService = {
  /**
   * Generates the complete backup payload object
   */
  generateBackupPayload(): PlatformBackupPayload {
    const accounts = AuthService.getAccounts();
    const topics = ThesisTopicService.getTopics();
    const applications = ApplicationService.getApplications();
    const notifications = NotificationService.getNotifications();
    const campaignConfig = AdminConfigService.getCampaign();
    const waitlistProposals = AdmissionWaitlistService.getProposals();

    return {
      format: 'USMBA_DOCTORAT_BACKUP_V1',
      exportedAt: new Date().toISOString(),
      appVersion: '2024.1.0-local-standalone',
      summary: {
        topicsCount: topics.length,
        applicationsCount: applications.length,
        usersCount: accounts.length,
        notificationsCount: notifications.length,
        proposalsCount: waitlistProposals.length,
      },
      data: {
        accounts,
        topics,
        applications,
        notifications,
        campaignConfig,
        waitlistProposals,
      },
      disclaimer: 'Sauvegarde locale USMBA Doctorat — Architecture 100% navigateur sans dépendance cloud ni abonnement payant.',
    };
  },

  /**
   * Triggers a browser download of the full backup JSON file
   */
  exportBackupToFile(): void {
    try {
      const payload = this.generateBackupPayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `usmba-doctorat-sauvegarde-${dateStr}.json`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Échec de l’export de sauvegarde', err);
      throw new Error('Impossible de générer le fichier de sauvegarde.');
    }
  },

  /**
   * Validates and restores a backup from a JSON string
   */
  async restoreBackupFromJSON(jsonString: string): Promise<{
    success: boolean;
    message: string;
    counts?: { topics: number; applications: number; users: number };
  }> {
    try {
      const parsed = JSON.parse(jsonString) as PlatformBackupPayload;

      // Schema sanity checks
      if (!parsed || parsed.format !== 'USMBA_DOCTORAT_BACKUP_V1' || !parsed.data) {
        return {
          success: false,
          message: 'Format de fichier non reconnu. Veuillez importer un fichier exporté depuis cette plateforme (USMBA_DOCTORAT_BACKUP_V1).',
        };
      }

      const { data } = parsed;

      if (Array.isArray(data.accounts)) {
        AuthService.saveAccounts(data.accounts);
      }

      if (Array.isArray(data.topics)) {
        ThesisTopicService.saveTopics(data.topics);
      }

      if (Array.isArray(data.applications)) {
        ApplicationService.saveApplications(data.applications);
      }

      if (Array.isArray(data.notifications)) {
        NotificationService.saveNotifications(data.notifications);
      }

      if (data.campaignConfig) {
        AdminConfigService.updateCampaign(data.campaignConfig);
      }

      if (Array.isArray(data.waitlistProposals)) {
        AdmissionWaitlistService.saveProposals(data.waitlistProposals);
      }

      return {
        success: true,
        message: 'Sauvegarde restaurée avec succès dans le stockage local du navigateur.',
        counts: {
          topics: Array.isArray(data.topics) ? data.topics.length : 0,
          applications: Array.isArray(data.applications) ? data.applications.length : 0,
          users: Array.isArray(data.accounts) ? data.accounts.length : 0,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erreur lors de la lecture du fichier : ${err?.message || 'JSON invalide'}`,
      };
    }
  },

  /**
   * Resets all collections to the initial demo seeds
   */
  async resetToDemoSeeds(): Promise<void> {
    // 1. Reset accounts
    AuthService.saveAccounts([
      {
        id: 'user-test-cand',
        email: 'candidat.test@usmba.ma',
        name: 'Youssef El Amrani (Candidat Test)',
        role: 'candidate',
        passwordHash: 'Doctorat2025!',
        createdAt: '2024-10-15T09:30:00Z',
        title: 'Candidat au Doctorat',
        department: 'Informatique & Intelligence Artificielle',
      },
      {
        id: 'user-test-thesis-dir',
        email: 'directeur.these.test@usmba.ma',
        name: 'Pr. Karim Benali (Directeur de Thèse Test)',
        role: 'thesis_director',
        passwordHash: 'Doctorat2025!',
        createdAt: '2024-09-01T10:00:00Z',
        title: 'Professeur de l’Enseignement Supérieur (PES)',
        institution: 'Faculté des Sciences et Techniques (FST) de Fès',
        laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
        department: 'Informatique & IA',
      },
      {
        id: 'user-test-structure-dir',
        email: 'directeur.structure.test@usmba.ma',
        name: 'Pr. Mostafa Bennani (Directeur de Structure Test)',
        role: 'structure_director',
        passwordHash: 'Doctorat2025!',
        createdAt: '2024-09-01T08:00:00Z',
        title: 'Directeur du CEDoc Sciences & Technologies',
        institution: 'Université Sidi Mohamed Ben Abdellah (USMBA)',
        laboratory: 'Direction des Centres d’Études Doctorales',
      },
    ]);

    // 2. Reset topics to demo list
    ThesisTopicService.saveTopics(DEMO_TOPICS);

    // 3. Reset applications to demo list
    ApplicationService.saveApplications(DEMO_APPLICATIONS);

    // 4. Reset waitlist proposals
    AdmissionWaitlistService.saveProposals([]);

    // 5. Clean up IndexedDB documents
    try {
      await LocalFileStorage.clearAll();
    } catch (e) {
      console.warn('Nettoyage IndexedDB partiel', e);
    }
  },

  /**
   * Computes live storage statistics for auditing
   */
  async getStorageStatistics(): Promise<StorageStatistics> {
    const topics = ThesisTopicService.getTopics();
    const demoTopicIds = new Set(DEMO_TOPICS.map((d) => d.id));
    const userCreatedTopics = topics.filter((t) => !demoTopicIds.has(t.id));

    const apps = ApplicationService.getApplications();
    const accounts = AuthService.getAccounts();
    const notifs = NotificationService.getNotifications();
    const proposals = AdmissionWaitlistService.getProposals();

    // Approximate localStorage usage
    let totalChars = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('usmba_')) {
          const val = localStorage.getItem(key) || '';
          totalChars += key.length + val.length;
        }
      }
    } catch {}

    const indexedDbStats = await LocalFileStorage.getTotalStorageUsed();

    return {
      topicsCount: topics.length,
      userCreatedTopicsCount: userCreatedTopics.length,
      applicationsCount: apps.length,
      usersCount: accounts.length,
      notificationsCount: notifs.length,
      proposalsCount: proposals.length,
      localStorageApproxBytes: totalChars * 2, // UTF-16 approx
      indexedDbBytes: indexedDbStats.totalBytes,
      indexedDbFilesCount: indexedDbStats.fileCount,
    };
  },
};
