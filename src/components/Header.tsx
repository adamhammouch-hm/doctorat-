/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Header Component — Minimalist, professional university header with account-gated space access
 */

import React, { useState } from 'react';
import { Language, AppUser } from '../types';
import { getTranslation } from '../services/i18n';
import { 
  GraduationCap, 
  ShoppingBag, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Layers, 
  LayoutDashboard,
  Bell
} from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  cartCount: number;
  maxCartLimit: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenGuide: () => void;
  onNavigateHome: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  activeView: 'login' | 'catalog' | 'workspace';
  onToggleView: (view: 'login' | 'catalog' | 'workspace') => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  cartCount,
  maxCartLimit,
  onOpenCart,
  onOpenAuth,
  onOpenGuide: _onOpenGuide,
  onNavigateHome,
  currentUser,
  onLogout,
  activeView,
  onToggleView,
  unreadNotificationsCount = 0,
  onOpenNotifications,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isRtl = language === 'ar';

  const t = (key: Parameters<typeof getTranslation>[1], vars?: Record<string, string | number>) =>
    getTranslation(language, key, vars);

  const getRoleLabel = (role: AppUser['role']) => {
    switch (role) {
      case 'admin':
        return isRtl ? 'مدير النظام' : 'Administrateur';
      case 'thesis_director':
      case 'professor' as any:
        return isRtl ? 'مدير الأطروحة / مشرف' : 'Directeur de thèse';
      case 'structure_director':
        return isRtl ? 'مدير البنية / القطب' : 'Directeur de structure';
      case 'candidate':
      default:
        return isRtl ? 'مترشح للدكتوراه' : 'Candidat';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main navigation bar */}
      <div className="container-constrained py-3">
        <div className="flex justify-between items-center gap-4">
          {/* USMBA Logo / Brand */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-800 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                USMBA · Fès
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Doctorat USMBA
              </div>
            </div>
          </div>

          {/* Actions: Language, Cart & Auth State */}
          <div className="flex items-center gap-2">
            {/* Language toggle button */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => onLanguageChange('fr')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  language === 'fr'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors font-arabic ${
                  language === 'ar'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                عربي
              </button>
            </div>

            {/* Cart trigger button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg transition-all cursor-pointer"
              aria-label="Mon panier"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">{t('navCart')}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-700 text-white">
                {cartCount}/{maxCartLimit}
              </span>
            </button>

            {/* Notification Bell (internal alerts) */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Centre de notifications & alertes"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Authenticated user control or login button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* View Switcher: Between Catalog & Workspace */}
                {activeView === 'workspace' ? (
                  <button
                    type="button"
                    onClick={() => onToggleView('catalog')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isRtl ? 'دليل المواضيع' : 'Catalogue'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleView('workspace')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isRtl ? 'فضائي الخاص' : 'Mon Espace'}</span>
                  </button>
                )}

                {/* User Info Capsule */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-800">
                      {getRoleLabel(currentUser.role)}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  title={isRtl ? 'تسجيل الخروج' : 'Se déconnecter'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                {activeView === 'catalog' ? (
                  <button
                    type="button"
                    onClick={() => onToggleView('login')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Se connecter</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleView('catalog')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Catalogue des Sujets</span>
                  </button>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 animate-in slide-in-from-top duration-150">
          {currentUser ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] font-semibold text-emerald-800">{getRoleLabel(currentUser.role)}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
              </div>

              {activeView === 'workspace' ? (
                <button
                  type="button"
                  onClick={() => {
                    onToggleView('catalog');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 text-left rtl:text-right text-xs font-bold text-slate-800 hover:bg-slate-50 rounded-lg flex items-center gap-2 border border-slate-200"
                >
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>{isRtl ? 'تصفح الدليل العام' : 'Consulter le Catalogue'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onToggleView('workspace');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 text-left rtl:text-right text-xs font-bold text-emerald-800 bg-emerald-50 rounded-lg flex items-center gap-2 border border-emerald-200"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                  <span>{isRtl ? 'الولوج إلى فضائي الخاص' : 'Accéder à Mon Espace'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>{isRtl ? 'تسجيل الخروج' : 'Se déconnecter'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onToggleView('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold text-white bg-slate-900 rounded-lg flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Portail de Connexion</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleView('catalog');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Catalogue des Sujets de Thèse</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
