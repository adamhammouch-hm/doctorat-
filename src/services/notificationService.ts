/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Notification Service — Internal system event dispatcher and notification center
 * Distinguishes in-app internal events from real external SMTP email delivery.
 */

import { AppNotification, AppRole, NotificationType } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'usmba_notifications_v3';

const INITIAL_DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    recipientEmail: 'directeur.these.test@usmba.ma',
    recipientRole: 'thesis_director',
    title: 'Nouvelle candidature reçue',
    titleAr: 'تم استلام طلب ترشيح جديد',
    message: 'Le candidat Youssef El Amrani a soumis un dossier pour le sujet FST-LISIA-24-01.',
    messageAr: 'قدم المترشح يوسف العمراني ملف ترشيح للموضوع FST-LISIA-24-01.',
    type: 'submission',
    createdAt: '2024-10-18 14:35',
    read: false,
    relatedApplicationId: 'app-2024-001',
    relatedTopicId: 'usmba-topic-2024-001',
  },
  {
    id: 'notif-002',
    recipientEmail: 'directeur.these.test@usmba.ma',
    recipientRole: 'thesis_director',
    title: 'Pièce en attente de vérification',
    titleAr: 'وثيقة في انتظار التحقق',
    message: 'Salma Bennani (app-2024-002) a un dossier marqué avec demande de correction sur les relevés de notes.',
    messageAr: 'سلمى بناني ملفها موسوم بطلب تصحيح كشوف النقط.',
    type: 'correction',
    createdAt: '2024-10-21 09:35',
    read: false,
    relatedApplicationId: 'app-2024-002',
    relatedTopicId: 'usmba-topic-2024-001',
  },
  {
    id: 'notif-003',
    recipientEmail: 'candidat.test@usmba.ma',
    recipientRole: 'candidate',
    title: 'Félicitations : Vous êtes officiellement admis au Doctorat USMBA !',
    titleAr: 'تهانينا: تم قبولكم في سلك الدكتوراه بجامعة سيدي محمد بن عبد الله',
    message: 'Votre candidature pour "Arabic OCR using AI" a été retenue sur Liste Principale. Pensez à finaliser votre inscription avant la date limite.',
    messageAr: 'تم قبول ترشيحك لموضوع التعرف الضوئي في اللائحة الرئيسية.',
    type: 'decision',
    createdAt: '2024-10-25 11:00',
    read: false,
    relatedApplicationId: 'app-2024-001',
  },
  {
    id: 'notif-004',
    recipientEmail: 'directeur.structure.test@usmba.ma',
    recipientRole: 'structure_director',
    title: 'Campagne d’admission active & Suivi des délibérations',
    titleAr: 'حملة الانتقاء نشطة وتتبع المداولات',
    message: 'Campagne doctorale 2024/2025 active. 5 dossiers soumis, propositions de repêchage disponibles.',
    messageAr: 'حملة الدكتوراه 2024/2025 نشطة.',
    type: 'deadline',
    createdAt: '2024-10-27 08:00',
    read: false,
  },
];

export const NotificationService = {
  getNotifications(userEmail?: string, userRole?: AppRole): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      let list: AppNotification[] = raw ? JSON.parse(raw) : INITIAL_DEMO_NOTIFICATIONS;

      if (userEmail) {
        list = list.filter((n) => 
          n.recipientEmail.toLowerCase() === userEmail.toLowerCase() ||
          (userRole && n.recipientRole === userRole && (!n.recipientEmail || n.recipientEmail === 'all'))
        );
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_DEMO_NOTIFICATIONS;
    }
  },

  getAll(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : INITIAL_DEMO_NOTIFICATIONS;
    } catch {
      return INITIAL_DEMO_NOTIFICATIONS;
    }
  },

  saveNotifications(list: AppNotification[]): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist notifications', e);
    }
  },

  createNotification(data: {
    recipientEmail: string;
    recipientRole?: AppRole;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    type: NotificationType;
    relatedApplicationId?: string;
    relatedTopicId?: string;
  }): AppNotification {
    const all = this.getAll();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientEmail: data.recipientEmail,
      recipientRole: data.recipientRole,
      title: data.title,
      titleAr: data.titleAr,
      message: data.message,
      messageAr: data.messageAr,
      type: data.type,
      createdAt: new Date().toLocaleString('fr-FR'),
      read: false,
      relatedApplicationId: data.relatedApplicationId,
      relatedTopicId: data.relatedTopicId,
    };
    all.unshift(newNotif);
    this.saveNotifications(all);
    return newNotif;
  },

  /**
   * Alias for createNotification
   */
  send(data: {
    recipientEmail: string;
    recipientRole?: AppRole;
    title: string;
    titleAr?: string;
    message: string;
    messageAr?: string;
    type: NotificationType;
    relatedApplicationId?: string;
    relatedTopicId?: string;
  }): AppNotification {
    return this.createNotification(data);
  },

  markAsRead(notificationId: string): void {
    const all = this.getAll();
    const index = all.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      all[index].read = true;
      this.saveNotifications(all);
    }
  },

  markAllAsRead(userEmail?: string): void {
    const all = this.getAll();
    const updated = all.map((n) => {
      if (!userEmail || n.recipientEmail.toLowerCase() === userEmail.toLowerCase()) {
        return { ...n, read: true };
      }
      return n;
    });
    this.saveNotifications(updated);
  },

  /**
   * Honest architectural status check:
   * Clarifies whether an external SMTP service (Sendgrid, AWS SES, Gmail SMTP)
   * is attached, avoiding misleading claims about real emails being delivered.
   */
  getSmtpStatus() {
    return {
      connected: false,
      provider: 'Aucun (Envoi in-app actif · SMTP externe non branché)',
      notice: 'Service SMTP externe non configuré. Les alertes sont délivrées directement dans le Centre de Notifications interne.',
    };
  },
};
