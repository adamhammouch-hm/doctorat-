/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AdminWorkspace Component — Comprehensive administrative space for USMBA Doctoral Platform
 * - User and credentials management (RBAC, active status toggle, account creation)
 * - Formal RBAC privilege matrix
 * - Data supervision & duplicate application auditor
 * - Immutable Audit Trail & activity log
 * - Campaign parameters & local compliance overview
 */

import React, { useState } from 'react';
import { 
  AppUser, 
  AuthAccount,
  AppRole, 
  Language, 
  ThesisTopic, 
  CandidateApplication,
  AuditLogEntry 
} from '../types';
import { AuthService } from '../services/authService';
import { AuditLogService } from '../services/auditLogService';
import { ApplicationService } from '../services/thesisService';
import { formatDateTime } from '../services/dateUtils';
import { 
  Users, 
  Shield, 
  Activity, 
  Settings, 
  Search, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Filter, 
  Trash2,
  Clock,
  Database,
  Info,
  Check,
  X
} from 'lucide-react';

interface AdminWorkspaceProps {
  currentUser: AppUser;
  topics: ThesisTopic[];
  applications: CandidateApplication[];
  language: Language;
  onRefreshData?: () => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  currentUser,
  topics,
  applications,
  language,
  onRefreshData: _onRefreshData,
}) => {
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<'users' | 'matrix' | 'supervision' | 'audit' | 'settings'>('users');

  // Accounts state
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => AuthService.getAccounts());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal create user
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate' as AppRole,
    institution: '',
    laboratory: '',
    title: '',
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => AuditLogService.getLogs());
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshAccounts = () => {
    setAccounts(AuthService.getAccounts());
  };

  const refreshLogs = () => {
    setAuditLogs(AuditLogService.getLogs());
  };

  // Toggle user active status
  const handleToggleActive = (account: AuthAccount) => {
    if (account.id === currentUser.id) {
      showFeedback('Impossible de désactiver votre propre compte administrateur.');
      return;
    }
    const res = AuthService.toggleAccountActive(account.id, currentUser);
    if (res.success) {
      refreshAccounts();
      refreshLogs();
      showFeedback(`Compte de ${account.name} ${res.newStatus ? 'activé' : 'désactivé'}.`);
    } else {
      showFeedback(res.error || 'Erreur lors de la modification du statut.');
    }
  };

  // Change user role
  const handleChangeRole = (account: AuthAccount, newRole: AppRole) => {
    if (account.id === currentUser.id && newRole !== 'admin') {
      showFeedback('Impossible de révoquer vos propres privilèges d’administrateur.');
      return;
    }
    const res = AuthService.updateAccountRole(account.id, newRole, currentUser);
    if (res.success) {
      refreshAccounts();
      refreshLogs();
      showFeedback(`Rôle de ${account.name} mis à jour : ${newRole}.`);
    } else {
      showFeedback(res.error || 'Erreur lors de la mise à jour du rôle.');
    }
  };

  // Create new account
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim() || !newUserData.password.trim()) {
      showFeedback('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const res = AuthService.createAccountByAdmin(
      {
        name: newUserData.name.trim(),
        email: newUserData.email.trim(),
        role: newUserData.role,
        password: newUserData.password.trim(),
        institution: newUserData.institution.trim() || undefined,
        laboratory: newUserData.laboratory.trim() || undefined,
        title: newUserData.title.trim() || undefined,
      },
      currentUser
    );

    if (res.success) {
      refreshAccounts();
      refreshLogs();
      setIsCreateUserOpen(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        role: 'candidate',
        institution: '',
        laboratory: '',
        title: '',
      });
      showFeedback(`Compte créé avec succès pour ${res.account?.name}.`);
    } else {
      showFeedback(res.error || 'Erreur lors de la création du compte.');
    }
  };

  // Delete account
  const handleDeleteAccount = (account: AuthAccount) => {
    if (account.id === currentUser.id) {
      showFeedback('Impossible de supprimer votre propre compte administrateur.');
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression définitive du compte de ${account.name} (${account.email}) ?`)) {
      const res = AuthService.deleteAccountByAdmin(account.id, currentUser);
      if (res.success) {
        refreshAccounts();
        refreshLogs();
        showFeedback(`Compte de ${account.name} supprimé avec succès.`);
      } else {
        showFeedback(res.error || 'Erreur lors de la suppression du compte.');
      }
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (userRoleFilter !== 'all' && acc.role !== userRoleFilter) return false;
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase().trim();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.institution && acc.institution.toLowerCase().includes(q)) ||
        (acc.laboratory && acc.laboratory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      const email = (log.authorEmail || log.userEmail || '').toLowerCase();
      const text = (log.comment || log.details || '').toLowerCase();
      const act = (log.action || '').toLowerCase();
      return email.includes(q) || text.includes(q) || act.includes(q);
    }
    return true;
  });

  // Duplicate applications check
  const duplicateCandidates = ApplicationService.getDuplicateApplicationsForAudit();

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'candidate':
        return 'Candidat';
      case 'thesis_director':
        return 'Directeur de thèse';
      case 'structure_director':
        return 'Directeur de structure';
      case 'admin':
        return 'Administrateur';
      default:
        return role;
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Administrateur</span>;
      case 'structure_director':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Directeur de structure</span>;
      case 'thesis_director':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Directeur de thèse</span>;
      case 'candidate':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Candidat</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900">
              Espace Administration USMBA
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
              Campagne 2026/2027
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Gouvernance & Supervision Système
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des accès, matrice des privilèges, conformité de la candidature unique et traçabilité intégrale
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Compte</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilisateurs & Comptes ({accounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'matrix'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Matrice Rôles & Privilèges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supervision')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'supervision'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Supervision & Doublons {duplicateCandidates.length > 0 && `(${duplicateCandidates.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Journal d'Activité ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-purple-700 text-purple-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres & Conformité</span>
        </button>
      </div>

      {/* TAB 1: USERS & ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email, laboratoire..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-slate-50/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
              >
                <option value="all">Tous les rôles ({accounts.length})</option>
                <option value="candidate">Candidats</option>
                <option value="thesis_director">Directeurs de thèse</option>
                <option value="structure_director">Directeurs de structure</option>
                <option value="admin">Administrateurs</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle Système</th>
                    <th className="py-3 px-4">Affiliation / Titre</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Dernière Connexion</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{account.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{account.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(account.role)}
                          {account.id !== currentUser.id && (
                            <select
                              value={account.role}
                              onChange={(e) => handleChangeRole(account, e.target.value as AppRole)}
                              className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 hover:border-slate-400 cursor-pointer"
                            >
                              <option value="candidate">Candidat</option>
                              <option value="thesis_director">Dir. Thèse</option>
                              <option value="structure_director">Dir. Structure</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {account.laboratory || account.institution || '—'}
                        </div>
                        {account.title && (
                          <div className="text-[10px] text-slate-500">{account.title}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(account)}
                          disabled={account.id === currentUser.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            account.isActive !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          } ${account.id === currentUser.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                          title="Cliquer pour basculer actif/inactif"
                        >
                          {account.isActive !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Actif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Inactif</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {account.lastLoginAt ? formatDateTime(account.lastLoginAt, language) : 'Jamais'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {account.id !== currentUser.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(account)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                            Session actuelle
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Matrice Académique des Privilèges (RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Règles d’isolation et de contrôle d’accès strictes appliquées sur la plateforme USMBA
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-4 border-r border-slate-200">Fonctionnalité / Droit</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Candidat</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Directeur de thèse</th>
                  <th className="py-3 px-4 border-r border-slate-200 text-center">Directeur de structure</th>
                  <th className="py-3 px-4 text-center">Administrateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Consultation du catalogue public des sujets</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-50/40">
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Sélection panier & candidature unique (1 sujet)</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Gestion et suppression de ses propres brouillons</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-50/40">
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Proposition et modification de sujets de recherche</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Avis scientifique et classement des candidatures affiliées</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-50/40">
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Signature électronique & validation institutionnelle</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Contrôle physique des pièces au guichet CEDoc</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-50/40">
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Gestion des comptes, des rôles et des accès</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium border-r border-slate-200">Supervision globale, détection des doublons & audit logs</td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center border-r border-slate-200"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  <td className="py-2.5 px-4 text-center"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA SUPERVISION & DUPLICATE AUDITOR */}
      {activeTab === 'supervision' && (
        <div className="space-y-6">
          {/* Key Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Sujets au Catalogue</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{topics.length}</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                {topics.filter((t) => t.workflowStatus === 'approved_signed').length} signés & validés
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Total Candidatures</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {applications.filter((a) => !a.isDraft && a.status !== 'draft').length} dossiers soumis
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Brouillons Actifs</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {applications.filter((a) => a.isDraft || a.status === 'draft').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">En cours de constitution</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Audit Doublons</div>
              <div className={`text-2xl font-bold mt-1 ${duplicateCandidates.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {duplicateCandidates.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {duplicateCandidates.length === 0 ? 'Conformité 100%' : 'Anomalies détectées'}
              </div>
            </div>
          </div>

          {/* Duplicate Detection Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Supervision de la Règle « Une Candidature Unique par Candidat »</span>
                  {duplicateCandidates.length === 0 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Règle respectée
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {duplicateCandidates.length} doublon(s) identifié(s)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Détection automatique de tout candidat ayant initié plusieurs dossiers (brouillons ou candidatures multiples issus de jeux de données antérieurs)
                </p>
              </div>
            </div>

            {duplicateCandidates.length === 0 ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <strong>Aucune anomalie détectée.</strong> Tous les candidats enregistrés sur la session actuelle possèdent au maximum une seule candidature.
                </div>
              </div>
            ) : (
              <div className="border border-rose-200 rounded-lg overflow-hidden">
                <div className="bg-rose-50 px-4 py-2 border-b border-rose-200 text-xs font-bold text-rose-900">
                  Dossiers multiples nécessitant un arbitrage :
                </div>
                <div className="divide-y divide-rose-100">
                  {duplicateCandidates.map((dup) => (
                    <div key={dup.candidateKey} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{dup.candidateName}</div>
                        <div className="text-xs text-slate-500 font-mono">{dup.candidateEmail}</div>
                        <div className="text-xs text-rose-700 font-semibold mt-1">
                          {dup.count} dossiers rattachés : {dup.applications.map((a) => a.topicCode).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          Signalé pour revue de commission
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Filtrer l'audit par email, action, dossier..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-slate-50/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600 cursor-pointer"
              >
                <option value="all">Toutes les actions ({auditLogs.length})</option>
                <option value="CONNEXION">Connexion</option>
                <option value="SOUMISSION_CANDIDATURE">Soumission candidature</option>
                <option value="SUPPRESSION_BROUILLON">Suppression brouillon</option>
                <option value="ENREGISTREMENT_BROUILLON">Sauvegarde brouillon</option>
                <option value="SIGNATURE_ELECTRONIQUE">Signature électronique</option>
                <option value="CREATION_COMPTE">Création compte</option>
                <option value="MODIFICATION_ROLE">Modification rôle</option>
                <option value="DESACTIVATION_COMPTE">Désactivation compte</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Horodatage (Casablanca)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Auteur & Rôle</th>
                    <th className="py-3 px-4">Détails de l'événement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(log.timestamp, language)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.authorEmail || log.userEmail}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{getRoleLabel(log.authorRole || log.userRole || 'admin')}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.details || log.comment || log.newValue || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS & COMPLIANCE */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Paramètres Institutionnels & Architecture Locale
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configuration de la campagne doctorale USMBA et règles techniques en vigueur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-purple-700" />
                <span>Architecture 100% Locale & Hors-Ligne</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toutes les données de l’application (comptes, profils, sujets, candidatures, pièces justificatives et logs) sont stockées dans le navigateur via <strong>localStorage</strong> et <strong>IndexedDB</strong>. Aucun service tiers payant ni Firebase n'est requis.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-lg space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-700" />
                <span>Règle de Candidature Unique</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le plafond de candidatures par candidat est strictement verrouillé à <strong>1 sujet maximum</strong> (au panier comme à la soumission finale). Tout brouillon existant doit être validé ou supprimé avant de postuler à un autre sujet.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">Transparence Technique & Démonstration :</div>
            <p>
              Ce prototype fonctionnel applique les règles de gestion du guide GCD de l’USMBA. Les 4 comptes de démonstration officiels permettent d'éprouver l'intégralité du cycle doctoral en conditions réelles sans risque de fuite de données.
            </p>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-purple-700" />
                <span>Créer un Nouveau Compte</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="Ex: Pr. Ahmed Mansouri"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse email institutionnelle *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="Ex: a.mansouri@usmba.ac.ma"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mot de passe temporaire *</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rôle Système *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as AppRole })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
                >
                  <option value="candidate">Candidat</option>
                  <option value="thesis_director">Directeur de thèse</option>
                  <option value="structure_director">Directeur de structure</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Établissement (Optionnel)</label>
                <input
                  type="text"
                  value={newUserData.institution}
                  onChange={(e) => setNewUserData({ ...newUserData, institution: e.target.value })}
                  placeholder="Ex: Faculté des Sciences et Techniques (FST) de Fès"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Laboratoire (Optionnel)</label>
                <input
                  type="text"
                  value={newUserData.laboratory}
                  onChange={(e) => setNewUserData({ ...newUserData, laboratory: e.target.value })}
                  placeholder="Ex: Laboratoire LISIA"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-purple-700 hover:bg-purple-800 font-bold cursor-pointer"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
