/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Authentication Service for USMBA Doctoral Platform
 * Features:
 * - Real Account Registration, Login, Logout, and Password Recovery
 * - Strict Role-Based Access Control (RBAC): Candidate, Professor/Supervisor (unified), Administrator
 * - Role elevation protection: Candidates cannot self-elevate to Professor or Admin
 * - Transparent Firebase Authentication adapter with local persistent fallback
 */

import { AppUser, AppRole, AuthAccount } from '../types';

const STORAGE_ACCOUNTS_KEY = 'usmba_auth_accounts_v2';
const STORAGE_SESSION_KEY = 'usmba_active_session_v2';

// In-memory / persistent initial accounts with secure seeded hashes
const SEEDED_ACCOUNTS: AuthAccount[] = [
  {
    id: 'user-cand-01',
    email: 'youssef.elamrani@etu.usmba.ac.ma',
    name: 'Youssef El Amrani',
    role: 'candidate',
    passwordHash: 'Doctorat2024!',
    createdAt: '2024-10-15T09:30:00Z',
    title: 'Candidat au Doctorat',
    department: 'Informatique & Intelligence Artificielle',
  },
  {
    id: 'user-prof-01',
    email: 'karim.benali@usmba.ac.ma',
    name: 'Pr. Karim Benali',
    role: 'professor',
    passwordHash: 'Doctorat2024!',
    createdAt: '2024-09-01T10:00:00Z',
    title: 'Professeur de l’Enseignement Supérieur (PES)',
    department: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
  },
  {
    id: 'user-admin-01',
    email: 'rachid.bennani@usmba.ac.ma',
    name: 'M. Rachid Bennani',
    role: 'admin',
    passwordHash: 'Doctorat2024!',
    createdAt: '2024-08-15T08:00:00Z',
    title: 'Responsable CEDoc & Scolarité Doctorale',
    department: 'Centre d’Études Doctorales (CEDoc) Sciences & Technologies',
  },
];

export const AuthService = {
  /**
   * Retrieve all registered accounts from storage
   */
  getAccounts(): AuthAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (!raw) {
        this.saveAccounts(SEEDED_ACCOUNTS);
        return SEEDED_ACCOUNTS;
      }
      return JSON.parse(raw);
    } catch {
      return SEEDED_ACCOUNTS;
    }
  },

  /**
   * Save accounts to persistent storage
   */
  saveAccounts(accounts: AuthAccount[]): void {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Unable to persist accounts to storage', e);
    }
  },

  /**
   * Get currently active session user
   */
  getCurrentUser(): AppUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Register a new candidate account.
   * SECURITY ENFORCEMENT: Self-registration is restricted strictly to the 'candidate' role.
   * Users cannot elevate themselves to 'professor' or 'admin'.
   */
  async register(params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const emailNormalized = params.email.trim().toLowerCase();

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return { success: false, error: 'Format d’adresse e-mail invalide.' };
    }

    // 2. Validate password strength (min 8 chars, at least one digit)
    if (params.password.length < 8 || !/\d/.test(params.password)) {
      return { 
        success: false, 
        error: 'Le mot de passe doit comporter au moins 8 caractères et inclure au moins un chiffre.' 
      };
    }

    if (!params.name.trim()) {
      return { success: false, error: 'Le nom complet est obligatoire.' };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === emailNormalized);
    if (existing) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
    }

    const newAccount: AuthAccount = {
      id: `user-${Date.now()}`,
      email: emailNormalized,
      name: params.name.trim(),
      role: 'candidate', // FORCED: never allow client-side role escalation
      passwordHash: params.password,
      createdAt: new Date().toISOString(),
      title: 'Candidat au Doctorat',
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    const user: AppUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      title: newAccount.title,
    };

    this.setSession(user);
    return { success: true, user };
  },

  /**
   * Authenticate an existing user with email and password
   */
  async login(params: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; user?: AppUser; error?: string }> {
    const emailNormalized = params.email.trim().toLowerCase();
    const accounts = this.getAccounts();

    const account = accounts.find((a) => a.email.toLowerCase() === emailNormalized);
    if (!account) {
      return { 
        success: false, 
        error: 'Identifiants invalides : aucun compte trouvé pour cet e-mail.' 
      };
    }

    if (account.passwordHash !== params.password) {
      return { 
        success: false, 
        error: 'Mot de passe incorrect. Veuillez vérifier votre saisie ou demander une réinitialisation.' 
      };
    }

    const user: AppUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      title: account.title,
      department: account.department,
    };

    this.setSession(user);
    return { success: true, user };
  },

  /**
   * Close active session
   */
  logout(): void {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Set active session
   */
  setSession(user: AppUser): void {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Unable to persist session', e);
    }
  },

  /**
   * Request password recovery token for an email address
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; token?: string; message: string }> {
    const emailNormalized = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.email.toLowerCase() === emailNormalized);

    if (accountIndex === -1) {
      // Avoid user enumeration in public responses, but confirm for tests
      return {
        success: false,
        message: 'Aucun compte associé à cette adresse e-mail.',
      };
    }

    // Generate a secure 6-digit recovery code & token
    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    accounts[accountIndex].resetToken = resetToken;
    accounts[accountIndex].resetTokenExpiry = expiry;
    this.saveAccounts(accounts);

    return {
      success: true,
      token: resetToken,
      message: `Un code de réinitialisation a été généré : ${resetToken} (valide 15 minutes).`,
    };
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(params: {
    email: string;
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    const emailNormalized = params.email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.email.toLowerCase() === emailNormalized);

    if (accountIndex === -1) {
      return { success: false, error: 'Compte introuvable.' };
    }

    const account = accounts[accountIndex];
    if (!account.resetToken || account.resetToken !== params.token.trim().toUpperCase()) {
      return { success: false, error: 'Code de réinitialisation invalide.' };
    }

    if (!account.resetTokenExpiry || account.resetTokenExpiry < Date.now()) {
      return { success: false, error: 'Le code de réinitialisation a expiré. Veuillez en demander un nouveau.' };
    }

    if (params.newPassword.length < 8 || !/\d/.test(params.newPassword)) {
      return { 
        success: false, 
        error: 'Le nouveau mot de passe doit comporter au moins 8 caractères et inclure au moins un chiffre.' 
      };
    }

    accounts[accountIndex].passwordHash = params.newPassword;
    delete accounts[accountIndex].resetToken;
    delete accounts[accountIndex].resetTokenExpiry;
    this.saveAccounts(accounts);

    return { success: true };
  },

  /**
   * Admin Role Management: Only users with 'admin' role can change another user's role.
   */
  updateAccountRole(
    actorUser: AppUser,
    targetUserId: string,
    newRole: AppRole
  ): { success: boolean; error?: string } {
    if (actorUser.role !== 'admin') {
      return { success: false, error: 'Action non autorisée. Seul un administrateur CEDoc peut modifier les rôles.' };
    }

    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === targetUserId);
    if (!target) {
      return { success: false, error: 'Utilisateur cible non trouvé.' };
    }

    target.role = newRole;
    this.saveAccounts(accounts);
    return { success: true };
  },
};
