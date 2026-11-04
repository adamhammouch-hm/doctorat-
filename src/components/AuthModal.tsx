/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AuthModal Component — Real Authentication, Account Creation & Password Recovery
 * Features:
 * - Real login with credential verification
 * - Candidate account registration with validation and forced non-elevation
 * - Password recovery flow (email request, token verification, password update)
 * - Quick test shortcuts for evaluation
 */

import React, { useState } from 'react';
import { Language, AppRole, AppUser } from '../types';
import { AuthService } from '../services/authService';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  UserCheck, 
  GraduationCap, 
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  selectedTopicsCount?: number;
  initialMode?: 'login' | 'register';
  onLoginSuccess?: (user: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  selectedTopicsCount = 0,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const isRtl = language === 'ar';
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot' | 'resetConfirm'>(initialMode);

  // Form states
  const [email, setEmail] = useState('youssef.elamrani@etu.usmba.ac.ma');
  const [password, setPassword] = useState('Doctorat2024!');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Recovery state
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.login({ email, password });
      if (res.success && res.user) {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.error || 'Erreur lors de la connexion.');
      }
    } catch {
      setErrorMessage('Une erreur est survenue lors de la tentative de connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.register({
        email,
        password,
        name: fullName,
      });

      if (res.success && res.user) {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.error || 'Impossible de créer le compte.');
      }
    } catch {
      setErrorMessage('Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.requestPasswordReset(email);
      if (res.success && res.token) {
        setResetToken(res.token);
        setSuccessMessage(res.message);
        setViewMode('resetConfirm');
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Erreur lors de l’envoi de la demande.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Confirmation
  const handleResetConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.confirmPasswordReset({
        email,
        token: resetToken,
        newPassword,
      });

      if (res.success) {
        setSuccessMessage('Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
        setPassword(newPassword);
        setViewMode('login');
      } else {
        setErrorMessage(res.error || 'Code de réinitialisation invalide.');
      }
    } catch {
      setErrorMessage('Erreur lors de la réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Preset Account Switcher for Test Reviewers
  const fillPresetAccount = (role: AppRole) => {
    setErrorMessage(null);
    if (role === 'candidate') {
      setEmail('youssef.elamrani@etu.usmba.ac.ma');
      setPassword('Doctorat2024!');
    } else if (role === 'professor') {
      setEmail('karim.benali@usmba.ac.ma');
      setPassword('Doctorat2024!');
    } else {
      setEmail('rachid.bennani@usmba.ac.ma');
      setPassword('Doctorat2024!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              {viewMode === 'register' ? (
                <UserPlus className="w-5 h-5 text-emerald-200" />
              ) : viewMode === 'forgot' || viewMode === 'resetConfirm' ? (
                <KeyRound className="w-5 h-5 text-emerald-200" />
              ) : (
                <LogIn className="w-5 h-5 text-emerald-200" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {viewMode === 'register'
                  ? 'Créer mon compte Candidat'
                  : viewMode === 'forgot'
                  ? 'Récupération du mot de passe'
                  : viewMode === 'resetConfirm'
                  ? 'Nouveau mot de passe'
                  : 'Connexion — Portail Doctorat USMBA'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Université Sidi Mohamed Ben Abdellah de Fès
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restore Cart Notice if starting application */}
        {selectedTopicsCount > 0 && viewMode === 'login' && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Vos <strong>{selectedTopicsCount} sujet(s)</strong> en panier seront automatiquement restaurés après connexion pour débuter votre candidature.
            </span>
          </div>
        )}

        {/* Error / Success Alerts */}
        <div className="p-4 pb-0 space-y-2">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* VIEW 1: SIGN IN FORM */}
        {viewMode === 'login' && (
          <div className="p-5 space-y-4">
            {/* Quick 1-Click Test Credentials Bar */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Comptes de test pour évaluation :</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillPresetAccount('candidate')}
                  className="px-2 py-1 text-[11px] rounded bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 font-semibold text-center cursor-pointer"
                >
                  Candidat
                </button>
                <button
                  type="button"
                  onClick={() => fillPresetAccount('professor')}
                  className="px-2 py-1 text-[11px] rounded bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 font-semibold text-center cursor-pointer"
                >
                  Professeur
                </button>
                <button
                  type="button"
                  onClick={() => fillPresetAccount('admin')}
                  className="px-2 py-1 text-[11px] rounded bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 font-semibold text-center cursor-pointer"
                >
                  Admin CEDoc
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Adresse e-mail institutionnelle ou personnelle *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom.prenom@usmba.ac.ma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">Mot de passe *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setViewMode('forgot');
                    }}
                    className="text-emerald-800 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs mt-2"
              >
                {isLoading ? (
                  <span>Vérification des accès...</span>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 text-center text-xs text-slate-600">
              <span>Vous candidatez pour la première fois ? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setViewMode('register');
                }}
                className="text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Créer un compte candidat
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: REGISTER FORM */}
        {viewMode === 'register' && (
          <div className="p-5 space-y-4">
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-700" />
                <span>Inscription réservée aux candidats doctorants</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Les comptes enseignants et administrateurs sont délivrés par le Pôle doctoral central.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nom et prénom complets *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Salma Bennani"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Adresse e-mail valide *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="salma.bennani@email.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mot de passe (min 8 car. dont 1 chiffre) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs mt-3"
              >
                {isLoading ? (
                  <span>Création du compte...</span>
                ) : (
                  <span>Créer mon compte et continuer</span>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-600">
              <span>Vous avez déjà un compte ? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setViewMode('login');
                }}
                className="text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {viewMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="p-5 space-y-4 text-xs">
            <p className="text-slate-600">
              Saisissez l’adresse e-mail associée à votre compte USMBA. Un code sécurisé de réinitialisation vous sera délivré.
            </p>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Adresse e-mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@usmba.ac.ma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs"
            >
              {isLoading ? <span>Recherche du compte...</span> : <span>Générer le code de réinitialisation</span>}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="text-slate-600 hover:text-slate-900 underline text-[11px]"
              >
                Retour à la connexion
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: RESET CONFIRM */}
        {viewMode === 'resetConfirm' && (
          <form onSubmit={handleResetConfirmSubmit} className="p-5 space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Code de réinitialisation (6 caractères) *</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                placeholder="Ex: A9X2B4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-center tracking-widest text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nouveau mot de passe (min 8 caractères) *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg font-bold text-white bg-emerald-800 hover:bg-emerald-900 flex items-center justify-center gap-2 shadow-xs cursor-pointer text-xs"
            >
              {isLoading ? <span>Mise à jour...</span> : <span>Valider mon nouveau mot de passe</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
