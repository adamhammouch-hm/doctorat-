/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PortalLanding Component — Official USMBA Doctoral Cycle Portal & Authentication Gateway
 * 
 * Strict compliance with USMBA specifications:
 * - Direct landing & login on first entry.
 * - Unified authentication with email & password (no role picker).
 * - Automatic role detection and redirection after authentication.
 * - 4 official demo identities accessible in one click.
 * - Candidate self-registration.
 * - Public catalog discovery link.
 */

import React, { useState } from 'react';
import { AppUser, Language } from '../types';
import { AuthService } from '../services/authService';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ShieldCheck,
  Search,
  Zap
} from 'lucide-react';

// Demo test accounts for 1-click development login
const TEST_ACCOUNTS = [
  {
    email: 'candidat.test@usmba.ma',
    password: 'Doctorat2025!',
    label: 'Candidat',
    role: 'candidate',
    color: 'emerald',
  },
  {
    email: 'directeur.these.test@usmba.ma',
    password: 'Doctorat2025!',
    label: 'Dir. Thèse',
    role: 'thesis_director',
    color: 'blue',
  },
  {
    email: 'directeur.structure.test@usmba.ma',
    password: 'Doctorat2025!',
    label: 'Dir. Structure',
    role: 'structure_director',
    color: 'purple',
  },
  {
    email: 'admin.test@usmba.ma',
    password: 'Doctorat2025!',
    label: 'Administrateur',
    role: 'admin',
    color: 'slate',
  },
];

interface PortalLandingProps {
  language: Language;
  onLoginSuccess: (user: AppUser) => void;
}

export const PortalLanding: React.FC<PortalLandingProps> = ({
  language,
  onLoginSuccess,
}) => {
  const isRtl = language === 'ar';
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  // Form states - empty credentials without pre-filling
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1-click test account quick-login
  const handleQuickLogin = async (testEmail: string, testPassword: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const res = await AuthService.login({ email: testEmail, password: testPassword });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Connexion test échouée.');
      }
    } catch {
      setErrorMessage('Erreur lors de la connexion test.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.login({ email, password });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Identifiants invalides. Veuillez vérifier votre e-mail et mot de passe.');
      }
    } catch {
      setErrorMessage('Une erreur de connexion est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Impossible de créer le compte.');
      }
    } catch {
      setErrorMessage('Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.requestPasswordReset(email);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Erreur lors de la demande de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await AuthService.confirmPasswordReset({
        email,
        token: resetToken,
        newPassword,
      });
      if (res.success) {
        setSuccessMessage('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          setViewMode('login');
          setPassword(newPassword);
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Erreur lors de la réinitialisation du mot de passe.');
      }
    } catch {
      setErrorMessage('Erreur lors de la confirmation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 py-4 sm:py-8">
      {/* Hero Presentation & Login Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: University Presentation & Credentials Access */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Portail Officiel du Cycle Doctoral · USMBA Fès</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Gestion du Cycle Doctoral de l’Université Sidi Mohamed Ben Abdellah
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Plateforme académique unifiée pour l’orientation, la candidature, l’évaluation scientifique et l’admission au sein des Centres d’Études Doctorales (CEDoc) de l’USMBA.
            </p>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div className="text-xs font-bold text-slate-900">3 Candidatures Max par Session</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Jusqu'à 3 sujets de thèse différents par candidat et par session doctorale.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div className="text-xs font-bold text-slate-900">Évaluation Rigoureuse</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Avis scientifique par le Directeur de thèse et signature du Directeur de structure.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div className="text-xs font-bold text-slate-900">Contrôle des Délais</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Gestion automatisée des désistements et propositions sur liste d’attente.
              </p>
            </div>
          </div>

          {/* Institutional Portal Notice */}
          <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
            <div className="font-bold text-slate-800 mb-1">
              Accès réservé aux membres de la communauté doctorale
            </div>
            L'accès aux espaces professionnels (Directeurs de thèse, Direction de structure, Administration) s'effectue via vos identifiants institutionnels. Les nouveaux candidats peuvent créer leur compte ci-contre pour accéder au catalogue et soumettre leur dossier.
          </div>
        </div>

        {/* Right Column: Unified Authentication Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {viewMode === 'login' && 'Connexion à votre espace'}
                  {viewMode === 'register' && 'Création d’un compte candidat'}
                  {viewMode === 'forgot' && 'Récupération de mot de passe'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewMode === 'login' && 'Authentification unique — Détection automatique de votre rôle'}
                  {viewMode === 'register' && 'Réservé aux nouveaux candidats au doctorat'}
                  {viewMode === 'forgot' && 'Génération d’un code de réinitialisation sécurisé'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
                <Lock className="w-5 h-5 text-emerald-700" />
              </div>
            </div>

            {/* Error or Success Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {viewMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Adresse e-mail institutionnelle ou personnelle
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@usmba.ma"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Vérification en cours...' : 'Se connecter à mon espace'}</span>
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Nouveau candidat sans compte ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Créer un compte
                  </button>
                </div>

                {/* Quick Test Login - collapsible */}
                <div className="pt-1 border-t border-dashed border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowTestAccounts((v) => !v)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Accès rapide – Comptes de démonstration
                    </span>
                    {showTestAccounts ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {showTestAccounts && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {TEST_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleQuickLogin(acc.email, acc.password)}
                          className={`px-2.5 py-2 rounded-lg text-[11px] font-semibold text-left border transition-colors cursor-pointer disabled:opacity-50 ${
                            acc.color === 'emerald'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : acc.color === 'blue'
                              ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                              : acc.color === 'purple'
                              ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <div className="font-bold">{acc.label}</div>
                          <div className="truncate opacity-70 text-[10px] mt-0.5">{acc.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* REGISTER FORM (Locked to candidate) */}
            {viewMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom complet (Prénom et Nom)
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Fatima Zahra Alami"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse e-mail valide
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidat@usmba.ma"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mot de passe (minimum 8 caractères dont 1 chiffre)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                  />
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                  Le compte créé sera automatiquement associé au profil <strong>Candidat au Doctorat</strong>. Les rôles académiques sont affectés par l'administration.
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Création...' : 'Créer mon compte candidat'}</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {viewMode === 'forgot' && (
              <div className="space-y-4">
                {!successMessage ? (
                  <form onSubmit={handleRequestReset} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adresse e-mail du compte
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="exemple@usmba.ma"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{isLoading ? 'Génération...' : 'Demander le code de réinitialisation'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Code de vérification (affiché ci-dessus)
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Ex: 839201"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 caractères dont 1 chiffre"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isLoading ? 'Confirmation...' : 'Valider le nouveau mot de passe'}</span>
                    </button>
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
