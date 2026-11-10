/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * NotificationCenterModal — In-app system alerts and event notifications
 * Transparently indicates internal dispatch status vs external SMTP delivery.
 */

import React, { useState } from 'react';
import { AppNotification, Language, AppUser } from '../types';
import { NotificationService } from '../services/notificationService';
import { 
  X, 
  Bell, 
  Check, 
  CheckCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Mail,
  ShieldCheck,
  Info
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  notifications: AppNotification[];
  onRefreshNotifications: () => void;
  language: Language;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  notifications,
  onRefreshNotifications,
  language,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const isRtl = language === 'ar';
  const smtpStatus = NotificationService.getSmtpStatus();

  const userNotifications = notifications.filter((n) => {
    if (!currentUser) return true;
    const matchesRecipient = 
      !n.recipientEmail || 
      n.recipientEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      (n.recipientRole && n.recipientRole === currentUser.role);
    if (!matchesRecipient) return false;
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => {
    if (!currentUser) return !n.read;
    return (
      !n.recipientEmail || 
      n.recipientEmail.toLowerCase() === currentUser.email.toLowerCase() ||
      (n.recipientRole && n.recipientRole === currentUser.role)
    ) && !n.read;
  }).length;

  const handleMarkAsRead = (id: string) => {
    NotificationService.markAsRead(id);
    onRefreshNotifications();
  };

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead(currentUser?.email);
    onRefreshNotifications();
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'correction':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'decision':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'submission':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'deadline':
        return <Clock className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'validation':
        return <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {isRtl ? 'مركز الإشعارات الأكاديمية' : 'Centre de Notifications & Alertes'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {unreadCount > 0 
                  ? `${unreadCount} notification(s) non lue(s)` 
                  : 'Toutes les notifications sont à jour'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Honest SMTP Architecture Banner */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-slate-700">Acheminement interne :</span> {smtpStatus.notice}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 text-xs bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filter === 'unread' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
          {userNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucune notification pour le moment.
            </div>
          ) : (
            userNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-3 rounded-xl border transition-all text-xs space-y-1 cursor-pointer ${
                  notif.read 
                    ? 'bg-white border-slate-200 text-slate-600' 
                    : 'bg-emerald-50/60 border-emerald-300 text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    {getIconForType(notif.type)}
                    <span>{isRtl && notif.titleAr ? notif.titleAr : notif.title}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {notif.createdAt}
                  </span>
                </div>

                <p className="text-slate-700 text-[11px] pl-6 rtl:pl-0 rtl:pr-6 leading-relaxed">
                  {isRtl && notif.messageAr ? notif.messageAr : notif.message}
                </p>

                {!notif.read && (
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Cliquer pour marquer comme lu</span>
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
