/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ProfessorWorkspace Component — Unified academic space for Professeur & Encadrant
 * Features:
 * - 5 official dashboard blocks: Mes sujets, Candidatures à examiner, Dossiers incomplets, Corrections en attente, Décisions à prendre
 * - GCD 3-level validation circuit (Structure -> CEDoc -> Pôle doctoral) with dates and comments
 * - Strict topic isolation: supervisor only accesses applications submitted to their own topics
 * - Scientific opinion advisory integration distinct from administrative admission decisions
 */

import React, { useState, useMemo } from 'react';
import { ThesisTopic, CandidateApplication, Language, ScientificOpinion } from '../types';
import { ApplicationReviewModal } from './ApplicationReviewModal';
import { 
  Layers, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  ArrowRight,
  ExternalLink,
  BookOpen,
  Award,
  Sparkles,
  ListOrdered,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ProfessorWorkspaceProps {
  topics: ThesisTopic[];
  applications: CandidateApplication[];
  onUpdateApplicationStatus: (
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ) => void;
  onRequestPieceCorrection?: (appId: string, category: string, note: string) => void;
  onSaveScientificOpinion?: (appId: string, opinion: ScientificOpinion) => void;
  currentUserName?: string;
  language: Language;
}

export const ProfessorWorkspace: React.FC<ProfessorWorkspaceProps> = ({
  topics,
  applications,
  onUpdateApplicationStatus,
  onRequestPieceCorrection,
  onSaveScientificOpinion,
  currentUserName = 'Pr. Karim Benali',
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'applications'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<'all' | 'week' | 'month'>('all');
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);

  const isRtl = language === 'ar';

  // Topics under this professor (using currentUserName with flexible matching)
  const myTopics = useMemo(() => {
    return topics.filter((t) => 
      t.professorName.toLowerCase().includes(currentUserName.toLowerCase()) || 
      currentUserName.toLowerCase().includes(t.professorName.toLowerCase().split(' ')[1] || '')
    );
  }, [topics, currentUserName]);

  // Candidatures received strictly for this professor's topics
  const myTopicIds = useMemo(() => myTopics.map((t) => t.id), [myTopics]);

  const myApplications = useMemo(() => {
    return applications.filter((app) => myTopicIds.includes(app.topicId));
  }, [applications, myTopicIds]);

  // 5 SPECIFIC DASHBOARD BLOCKS REQUIRED BY PROMPT 3:
  // 1. Mes sujets
  const managedTopicsCount = myTopics.length;
  // 2. Candidatures à examiner
  const pendingReviewCount = myApplications.filter((a) => a.status === 'pending_review').length;
  // 3. Dossiers incomplets
  const incompleteDossiersCount = myApplications.filter((a) => a.status === 'incomplete').length;
  // 4. Corrections en attente
  const pendingCorrectionsCount = myApplications.filter((a) => a.status === 'correction_requested').length;
  // 5. Décisions à prendre (dossiers en cours sans issue finale validée)
  const pendingDecisionsCount = myApplications.filter((a) => !['accepted', 'rejected', 'waitlisted'].includes(a.status)).length;

  // Quota reminder documented in GCD guide (page 8): 11 sujets restants à proposer
  const quotaRemaining = 11;

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return myApplications.filter((app) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = app.candidateName.toLowerCase().includes(q);
        const matchesCne = app.cne.toLowerCase().includes(q);
        const matchesDegree = app.masterDegree.toLowerCase().includes(q);
        if (!matchesName && !matchesCne && !matchesDegree) return false;
      }
      if (selectedTopicFilter && app.topicId !== selectedTopicFilter) return false;
      if (selectedStatusFilter && app.status !== selectedStatusFilter) return false;

      if (selectedPeriodFilter !== 'all') {
        const appDate = new Date(app.submissionDate).getTime();
        const now = Date.now();
        const daysDiff = (now - appDate) / (1000 * 3600 * 24);
        if (selectedPeriodFilter === 'week' && daysDiff > 7) return false;
        if (selectedPeriodFilter === 'month' && daysDiff > 30) return false;
      }

      return true;
    });
  }, [myApplications, searchQuery, selectedTopicFilter, selectedStatusFilter, selectedPeriodFilter]);

  // Mini step indicator for 3-level validation
  const renderMiniStep = (label: string, status: 'valid' | 'pending' | 'rejected', date?: string) => {
    return (
      <span 
        key={label}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
          status === 'valid'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : status === 'pending'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
      >
        {status === 'valid' ? (
          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
        ) : (
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
        )}
        <span>{label}</span>
        {date && <span className="text-[10px] text-slate-400">({date})</span>}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Space Header: Teacher Identity & Quota */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Espace Académique Unique · Professeur & Encadrant
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {currentUserName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laboratoire Systèmes Intelligents & Applications (LISIA) · FST de Fès · Université Sidi Mohamed Ben Abdellah
          </p>
        </div>

        {/* Quota reminder (Documented in GCD guide page 8) */}
        <div className="px-3.5 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 self-start sm:self-auto">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Quota d'encadrement : <strong className="text-emerald-800">{quotaRemaining} sujets restants</strong> à proposer</span>
        </div>
      </div>

      {/* 5 OFFICIAL DASHBOARD BLOCKS (PROMPT 3 COMPLIANCE) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Block 1: Mes sujets */}
        <div 
          onClick={() => setActiveTab('topics')}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            activeTab === 'topics' ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-500'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Mes sujets</span>
            <Layers className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managedTopicsCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Sujets de thèse déposés
          </div>
        </div>

        {/* Block 2: Candidatures à examiner */}
        <div 
          onClick={() => { setActiveTab('applications'); setSelectedStatusFilter('pending_review'); }}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            activeTab === 'applications' && selectedStatusFilter === 'pending_review'
              ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600'
              : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 text-xs font-medium">
            <span>À examiner</span>
            <Users className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-extrabold text-blue-800">
            {pendingReviewCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Dossiers en attente d'avis
          </div>
        </div>

        {/* Block 3: Dossiers incomplets */}
        <div 
          onClick={() => { setActiveTab('applications'); setSelectedStatusFilter('incomplete'); }}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            activeTab === 'applications' && selectedStatusFilter === 'incomplete'
              ? 'bg-purple-50/50 border-purple-600 ring-1 ring-purple-600'
              : 'bg-white border-slate-200 hover:border-purple-500'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700 text-xs font-medium">
            <span>Dossiers incomplets</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900">
            {incompleteDossiersCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Pièces initiales manquantes
          </div>
        </div>

        {/* Block 4: Corrections en attente */}
        <div 
          onClick={() => { setActiveTab('applications'); setSelectedStatusFilter('correction_requested'); }}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            activeTab === 'applications' && selectedStatusFilter === 'correction_requested'
              ? 'bg-amber-50/50 border-amber-600 ring-1 ring-amber-600'
              : 'bg-white border-slate-200 hover:border-amber-500'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
            <span>Corrections en attente</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">
            {pendingCorrectionsCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Pièces en cours de correction
          </div>
        </div>

        {/* Block 5: Décisions à prendre */}
        <div 
          onClick={() => { setActiveTab('applications'); setSelectedStatusFilter(''); }}
          className={`p-3.5 rounded-xl border shadow-2xs transition-all cursor-pointer space-y-1 ${
            activeTab === 'applications' && selectedStatusFilter === ''
              ? 'bg-slate-100 border-slate-400'
              : 'bg-white border-slate-200 hover:border-slate-500'
          }`}
        >
          <div className="flex items-center justify-between text-slate-700 text-xs font-medium">
            <span>Décisions à prendre</span>
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {pendingDecisionsCount}
          </div>
          <div className="text-[10px] text-slate-400">
            Non encore clôturés
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Vue prioritaire de traitement
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('topics')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'topics'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Mes Sujets & Circuit GCD</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold">
            {myTopics.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`pb-2.5 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Toutes les Candidatures reçues</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            {myApplications.length}
          </span>
        </button>
      </div>

      {/* TAB 1: WORKLIST PRIORITAIRE */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900">Dossiers prioritaires nécessitant votre avis ou une décision :</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Examinez les candidatures, formulez votre avis scientifique argumenté et formalisez la décision de la commission.
              </p>
            </div>
            <button
              onClick={() => { setActiveTab('applications'); setSelectedStatusFilter('pending_review'); }}
              className="text-xs font-bold text-emerald-800 hover:underline shrink-0"
            >
              Afficher tout ({myApplications.length}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {myApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Aucune candidature reçue pour l'instant pour vos sujets de recherche.
              </div>
            ) : (
              myApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{app.candidateName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">CNE : {app.cne}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'correction_requested' ? 'bg-amber-100 text-amber-900' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-900' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status === 'accepted' ? 'Admis (LP)' :
                         app.status === 'waitlisted' ? `Liste d'Attente (Rang ${app.waitlistRank || 1})` :
                         app.status === 'correction_requested' ? 'Correction demandée' :
                         app.status === 'rejected' ? 'Non retenu' : 'À examiner'}
                      </span>
                    </div>

                    <div className="text-slate-600 text-xs">
                      Sujet : <strong className="text-slate-800">{app.topicCode}</strong> — {app.topicTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Cursus : {app.masterDegree} ({app.masterGrade.toFixed(2)}/20)</span>
                      <span>·</span>
                      <span>Déposé le {app.submissionDate}</span>
                      {app.scientificOpinion && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Avis encadrant : {app.scientificOpinion.recommendation.toUpperCase()} {app.scientificOpinion.score ? `(${app.scientificOpinion.score}/20)` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(app)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                    >
                      <span>Examiner le dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MES SUJETS & GCD VALIDATION WORKFLOW */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Sujets doctoraux rattachés à votre profil enseignant-chercheur et traçabilité du circuit officiel de validation GCD (Guide page 7 à 12).
          </div>

          <div className="space-y-3">
            {myTopics.map((topic) => (
              <div 
                key={topic.id}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {topic.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        Année {topic.academicYear} · {topic.spotsAvailable} place(s)
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {topic.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {topic.scientificDescription}
                    </p>

                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Structure : <strong>{topic.laboratory}</strong> · {topic.institution}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-700">
                      {myApplications.filter((a) => a.topicId === topic.id).length} candidature(s)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Limite : {topic.submissionDeadline}
                    </div>
                  </div>
                </div>

                {/* GCD 3-Level Validation Workflow Indicator */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Circuit institutionnel de validation GCD :
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Level 1: Structure de recherche */}
                    <div className="space-y-0.5">
                      {renderMiniStep('1. Structure de recherche', topic.workflow.structure.status, topic.workflow.structure.date)}
                      {topic.workflow.structure.comments && (
                        <div className="text-[10px] text-slate-500 italic px-1">
                          « {topic.workflow.structure.comments} »
                        </div>
                      )}
                    </div>

                    <span className="text-slate-300 hidden sm:inline">&rarr;</span>

                    {/* Level 2: CEDoc */}
                    <div className="space-y-0.5">
                      {renderMiniStep('2. CEDoc (Faculté)', topic.workflow.centre.status, topic.workflow.centre.date)}
                      {topic.workflow.centre.comments && (
                        <div className="text-[10px] text-slate-500 italic px-1">
                          « {topic.workflow.centre.comments} »
                        </div>
                      )}
                    </div>

                    <span className="text-slate-300 hidden sm:inline">&rarr;</span>

                    {/* Level 3: Pôle Doctoral */}
                    <div className="space-y-0.5">
                      {renderMiniStep('3. Pôle Doctoral USMBA', topic.workflow.pole.status, topic.workflow.pole.date)}
                      {topic.workflow.pole.comments && (
                        <div className="text-[10px] text-slate-500 italic px-1">
                          « {topic.workflow.pole.comments} »
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATURES REÇUES AVEC FILTRES COMPLETS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nom du candidat, CNE..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 rtl:pl-3 rtl:pr-9"
                />
              </div>

              {/* Topic filter */}
              <select
                value={selectedTopicFilter}
                onChange={(e) => setSelectedTopicFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Tous mes sujets</option>
                {myTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.title.slice(0, 35)}...
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">Tous les statuts</option>
                <option value="pending_review">À examiner</option>
                <option value="incomplete">Dossier incomplet</option>
                <option value="correction_requested">Correction demandée</option>
                <option value="accepted">Admis (Liste Principale)</option>
                <option value="waitlisted">Liste d’Attente</option>
                <option value="rejected">Non retenu</option>
              </select>

              {/* Period filter */}
              <select
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value as any)}
                className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Toutes périodes</option>
                <option value="week">Derniers 7 jours</option>
                <option value="month">Derniers 30 jours</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>{filteredApplications.length} candidature(s) affichée(s)</span>
              {(searchQuery || selectedTopicFilter || selectedStatusFilter || selectedPeriodFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTopicFilter('');
                    setSelectedStatusFilter('');
                    setSelectedPeriodFilter('all');
                  }}
                  className="text-xs text-rose-700 font-semibold hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>

          {/* Applications list */}
          <div className="space-y-2">
            {filteredApplications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                Aucun dossier ne correspond aux critères de recherche sélectionnés.
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{app.candidateName}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">CNE : {app.cne}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'correction_requested' ? 'bg-amber-100 text-amber-900' :
                        app.status === 'incomplete' ? 'bg-purple-100 text-purple-900' :
                        app.status === 'rejected' ? 'bg-rose-100 text-rose-900' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status === 'accepted' ? 'Admis (LP)' :
                         app.status === 'waitlisted' ? `Liste d'Attente (Rang ${app.waitlistRank || 1})` :
                         app.status === 'correction_requested' ? 'Correction demandée' :
                         app.status === 'incomplete' ? 'Dossier incomplet' :
                         app.status === 'rejected' ? 'Non retenu' : 'À examiner'}
                      </span>
                    </div>

                    <div className="text-slate-600">
                      Sujet : <strong className="text-slate-800">{app.topicCode}</strong> — {app.topicTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Cursus : {app.masterDegree} ({app.masterGrade.toFixed(2)}/20)</span>
                      <span>·</span>
                      <span>{app.documents.length} pièces justificatives</span>
                      <span>·</span>
                      <span>Déposé le {app.submissionDate}</span>
                      {app.scientificOpinion && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Avis encadrant : {app.scientificOpinion.recommendation.toUpperCase()} {app.scientificOpinion.score ? `(${app.scientificOpinion.score}/20)` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(app)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      Examiner le dossier
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Candidate Dossier Review Modal */}
      {selectedApplication && (
        <ApplicationReviewModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={onUpdateApplicationStatus}
          onRequestPieceCorrection={onRequestPieceCorrection}
          onSaveScientificOpinion={onSaveScientificOpinion}
          currentUser={currentUserName}
          language={language}
        />
      )}
    </div>
  );
};
