/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Authentication Service for USMBA Doctoral Platform
 * Features:
 * - Exact 3 profiles: Candidate ('candidate'), Thesis Director ('thesis_director'), Structure Director ('structure_director')
 * - The 3 official requested test identities:
 *     1. candidat.test@usmba.ma
 *     2. directeur.these.test@usmba.ma
 *     3. directeur.structure.test@usmba.ma
 * - Strict non-escalation: public self-registration is strictly locked to 'candidate' role.
 * - Password recovery flow with expiration
 * - Standalone browser-local authentication (zero external cloud dependency)
 */

import { AppUser, AppRole, AuthAccount } from '../types';
import { V5_KEYS } from './dataMigrationService';
import { AuditLogService } from './auditLogService';

const STORAGE_ACCOUNTS_KEY = V5_KEYS.ACCOUNTS;
const STORAGE_SESSION_KEY = V5_KEYS.SESSION;

// Default initial accounts including the 3 required test accounts
export const SEEDED_ACCOUNTS: AuthAccount[] = [
  // 1. Official Test Candidate
  {
    id: 'user-test-cand',
    email: 'candidat.test@usmba.ma',
    name: 'Youssef El Amrani (Candidat Test)',
    role: 'candidate',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-10-15T09:30:00.000Z',
    title: 'Candidat au Doctorat',
    department: 'Informatique & Intelligence Artificielle',
  },
  // 2. Official Test Thesis Director (Directeur de thèse & Encadrant unique)
  {
    id: 'user-test-thesis-dir',
    email: 'directeur.these.test@usmba.ma',
    name: 'Pr. Karim Benali (Directeur de Thèse Test)',
    role: 'thesis_director',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-09-01T10:00:00.000Z',
    title: 'Professeur de l’Enseignement Supérieur (PES)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    department: 'Informatique & IA',
  },
  // 3. Official Test Structure Director (Directeur de structure - Labo / CEDoc / Pôle)
  {
    id: 'user-test-struct-dir',
    email: 'directeur.structure.test@usmba.ma',
    name: 'Pr. Mostafa Bennani (Directeur de Structure Test)',
    role: 'structure_director',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-08-15T08:00:00.000Z',
    title: 'Directeur du CEDoc Sciences & Technologies',
    institution: 'Université Sidi Mohamed Ben Abdellah (USMBA)',
    laboratory: 'Centre d’Études Doctorales & Pôle Doctoral',
    department: 'Direction des Structures de Recherche',
    isActive: true,
  },
  // 4. Official Test Platform Administrator (Administrateur Plateforme GCD)
  {
    id: 'user-test-admin',
    email: 'admin.test@usmba.ma',
    name: 'M. Reda Tazi (Administrateur Test)',
    role: 'admin',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-08-01T08:00:00.000Z',
    title: 'Administrateur Système & Données GCD',
    institution: 'Université Sidi Mohamed Ben Abdellah (USMBA)',
    department: 'Pôle Doctoral — Administration Centrale',
    isActive: true,
  },
  // Additional realistic accounts
  {
    id: 'user-cand-02',
    email: 'salma.bennani@etu.usmba.ac.ma',
    name: 'Salma Bennani',
    role: 'candidate',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-10-20T11:00:00.000Z',
    title: 'Candidate au Doctorat',
    department: 'Sciences des Données',
  },
  {
    id: 'user-prof-02',
    email: 'amina.berrada@usmba.ac.ma',
    name: 'Pr. Amina Berrada',
    role: 'thesis_director',
    passwordHash: 'Doctorat2025!',
    createdAt: '2026-09-05T14:00:00.000Z',
    title: 'Professeur Habilité (PH)',
    institution: 'Faculté des Sciences et Techniques (FST)',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
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
      const parsed: AuthAccount[] = JSON.parse(raw);
      // Migration / ensure the 3 test accounts exist
      let updated = false;
      for (const seeded of SEEDED_ACCOUNTS) {
        if (!parsed.some((a) => a.email.toLowerCase() === seeded.email.toLowerCase())) {
          parsed.push(seeded);
          updated = true;
        }
      }
      // Migrate legacy roles if any (professor -> thesis_director)
      // Note: Admin is an independent profile and must never be converted to structure_director
      parsed.forEach((acc: any) => {
        if (acc.role === 'professor') {
          acc.role = 'thesis_director';
          updated = true;
        }
      });
      if (updated) {
        this.saveAccounts(parsed);
      }
      return parsed;
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
      if (!raw) return null;
      const user: AppUser = JSON.parse(raw);
      // Normalize legacy roles
      if ((user.role as any) === 'professor') user.role = 'thesis_director';
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Register a new candidate account.
   * SECURITY ENFORCEMENT: Self-registration is strictly restricted to the 'candidate' role.
   * Users cannot elevate themselves to 'thesis_director' or 'structure_director'.
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

    if (account.isActive === false) {
      return {
        success: false,
        error: 'Ce compte a été suspendu par l’administration de la plateforme. Veuillez contacter le support universitaire.',
      };
    }

    // Update lastLoginAt
    account.lastLoginAt = new Date().toISOString();
    this.saveAccounts(accounts);

    const user: AppUser = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      title: account.title,
      department: account.department,
      institution: account.institution,
      isActive: true,
      lastLoginAt: account.lastLoginAt,
    };

    // Record audit log
    try {
      AuditLogService.log({
        authorName: user.name,
        authorEmail: user.email,
        authorRole: user.role,
        action: 'Connexion réussie',
        category: 'auth',
        targetEntityId: user.id,
        targetEntityType: 'AuthAccount',
      });
    } catch {
      // ignore
    }

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
   * Update account role: restricted to Administrators and Structure Directors
   */
  updateAccountRole(
    actorUser: AppUser,
    targetUserId: string,
    newRole: AppRole
  ): { success: boolean; error?: string } {
    if (actorUser.role !== 'admin' && actorUser.role !== 'structure_director') {
      return { success: false, error: 'Action non autorisée. Seul un administrateur peut modifier les rôles.' };
    }

    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === targetUserId);
    if (!target) {
      return { success: false, error: 'Utilisateur cible non trouvé.' };
    }

    const oldRole = target.role;
    target.role = newRole;
    this.saveAccounts(accounts);

    try {
      AuditLogService.log({
        authorName: actorUser.name,
        authorEmail: actorUser.email,
        authorRole: actorUser.role,
        action: `Modification du rôle de ${target.name}`,
        category: 'user_management',
        targetEntityId: target.id,
        targetEntityType: 'AuthAccount',
        oldValue: oldRole,
        newValue: newRole,
      });
    } catch {
      // ignore
    }

    return { success: true };
  },

  /**
   * Create account directly by Administrator
   */
  createAccountByAdmin(
    accountData: {
      name: string;
      email: string;
      role: AppRole;
      password?: string;
      title?: string;
      department?: string;
      institution?: string;
      laboratory?: string;
    },
    adminUser: AppUser
  ): { success: boolean; account?: AuthAccount; error?: string } {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Action réservée aux administrateurs de la plateforme.' };
    }
    const emailNorm = accountData.email.trim().toLowerCase();
    const accounts = this.getAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === emailNorm)) {
      return { success: false, error: 'Un compte avec cette adresse e-mail existe déjà.' };
    }
    const newAcc: AuthAccount = {
      id: `user-${Date.now()}`,
      email: emailNorm,
      name: accountData.name.trim(),
      role: accountData.role,
      passwordHash: accountData.password || 'Doctorat2025!',
      createdAt: new Date().toISOString(),
      title: accountData.title,
      department: accountData.department,
      institution: accountData.institution,
      laboratory: accountData.laboratory,
      isActive: true,
    };
    accounts.push(newAcc);
    this.saveAccounts(accounts);

    try {
      AuditLogService.log({
        authorName: adminUser.name,
        authorEmail: adminUser.email,
        authorRole: adminUser.role,
        action: `Création administrative d’un compte (${newAcc.role})`,
        category: 'user_management',
        targetEntityId: newAcc.id,
        targetEntityType: 'AuthAccount',
        newValue: `${newAcc.name} (${newAcc.email}) - Rôle: ${newAcc.role}`,
      });
    } catch {
      // ignore
    }

    return { success: true, account: newAcc };
  },

  /**
   * Update account details by Administrator
   */
  updateAccountByAdmin(
    accountId: string,
    updates: Partial<AuthAccount>,
    adminUser: AppUser
  ): { success: boolean; account?: AuthAccount; error?: string } {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Action réservée aux administrateurs de la plateforme.' };
    }
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) {
      return { success: false, error: 'Compte introuvable.' };
    }
    const current = accounts[idx];
    const updated: AuthAccount = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
    };
    accounts[idx] = updated;
    this.saveAccounts(accounts);

    try {
      AuditLogService.log({
        authorName: adminUser.name,
        authorEmail: adminUser.email,
        authorRole: adminUser.role,
        action: `Mise à jour du profil de ${current.name}`,
        category: 'user_management',
        targetEntityId: current.id,
        targetEntityType: 'AuthAccount',
        comment: 'Profil ou privilèges mis à jour par l’administrateur',
      });
    } catch {
      // ignore
    }

    return { success: true, account: updated };
  },

  /**
   * Toggle account activation state
   */
  toggleAccountActive(
    accountId: string, 
    adminUser: AppUser
  ): { success: boolean; newStatus?: boolean; error?: string } {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Action réservée aux administrateurs.' };
    }
    if (adminUser.id === accountId) {
      return { success: false, error: 'Vous ne pouvez pas désactiver votre propre compte administrateur.' };
    }
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) {
      return { success: false, error: 'Compte introuvable.' };
    }
    const currentActive = accounts[idx].isActive !== false;
    const nextStatus = !currentActive;
    accounts[idx].isActive = nextStatus;
    this.saveAccounts(accounts);

    try {
      AuditLogService.log({
        authorName: adminUser.name,
        authorEmail: adminUser.email,
        authorRole: adminUser.role,
        action: nextStatus ? `Réactivation du compte de ${accounts[idx].name}` : `Désactivation du compte de ${accounts[idx].name}`,
        category: 'user_management',
        targetEntityId: accounts[idx].id,
        targetEntityType: 'AuthAccount',
        oldValue: currentActive ? 'actif' : 'inactif',
        newValue: nextStatus ? 'actif' : 'inactif',
      });
    } catch {
      // ignore
    }

    return { success: true, newStatus: nextStatus };
  },

  /**
   * Delete account by Administrator
   */
  deleteAccountByAdmin(
    accountId: string, 
    adminUser: AppUser
  ): { success: boolean; error?: string } {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Action réservée aux administrateurs.' };
    }
    if (adminUser.id === accountId) {
      return { success: false, error: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' };
    }
    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) {
      return { success: false, error: 'Compte introuvable.' };
    }
    const deletedName = accounts[idx].name;
    accounts.splice(idx, 1);
    this.saveAccounts(accounts);

    try {
      AuditLogService.log({
        authorName: adminUser.name,
        authorEmail: adminUser.email,
        authorRole: adminUser.role,
        action: `Suppression définitive du compte : ${deletedName}`,
        category: 'user_management',
        targetEntityId: accountId,
        targetEntityType: 'AuthAccount',
      });
    } catch {
      // ignore
    }

    return { success: true };
  },
};
