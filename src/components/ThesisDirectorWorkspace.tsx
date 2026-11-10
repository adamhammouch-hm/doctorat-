/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ThesisDirectorWorkspace Component — Dedicated academic space for Thesis Directors (Directeur de thèse & Encadrant)
 * 
 * Features:
 * 1. Gestion des sujets : création, modification, soumission, révision et signature
 * 2. Gestion des candidatures : isolation stricte aux sujets dont il est responsable
 * 3. Examen des dossiers et pièces, demandes de correction ciblées
 * 4. Évaluation scientifique (avis favorable/défavorable, note, appréciation)
 * 5. Décisions, classement par sujet et transmission de l'ordre de la liste d'attente
 */

import React, { useState, useMemo } from 'react';
import { 
  ThesisTopic, 
  CandidateApplication, 
  Language, 
  ScientificOpinion 
} from '../types';
import { formatDate } from '../services/dateUtils';
import { ApplicationReviewModal } from './ApplicationReviewModal';
import { TopicProposalModal } from './TopicProposalModal';
import { 
  Layers, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter, 
  ArrowRight,
  BookOpen, 
  Plus, 
  Edit3, 
  FileSignature, 
  AlertCircle,
  Award,
  ListOrdered,
  Calendar,
  Send,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface ThesisDirectorWorkspaceProps {
  topics: ThesisTopic[];
  applications: CandidateApplication[];
  onUpdateApplicationStatus: (
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ) => void;
  onRequestPieceCorrection?: (appId: string, category: string, note: string) => void;
  onSaveScientificOpinion?: (appId: string, opinion: ScientificOpinion) => void;
  onSaveTopic: (topicData: Partial<ThesisTopic>, topicId?: string) => void;
  currentUserName?: string;
  currentUserEmail?: string;
  language: Language;
}

export const ThesisDirectorWorkspace: React.FC<ThesisDirectorWorkspaceProps> = ({
  topics,
  applications,
  onUpdateApplicationStatus,
  onRequestPieceCorrection,
  onSaveScientificOpinion,
  onSaveTopic,
  currentUserName = '',
  currentUserEmail = '',
  language: _language,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'applications' | 'rankings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals state
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ThesisTopic | null>(null);

  // Topics strictly assigned to this thesis director
  const myTopics = useMemo(() => {
    const userEmailNorm = (currentUserEmail || '').toLowerCase().trim();
    const userNameNorm = (currentUserName || '').toLowerCase().trim();
    return topics.filter((t) => {
      const emailMatch = userEmailNorm && t.professorEmail && t.professorEmail.toLowerCase().trim() === userEmailNorm;
      const nameMatch = userNameNorm && t.professorName && t.professorName.toLowerCase().trim() === userNameNorm;
      return Boolean(emailMatch || nameMatch);
    });
  }, [topics, currentUserName, currentUserEmail]);

  // Topic IDs managed by this thesis director
  const myTopicIds = useMemo(() => myTopics.map((t) => t.id), [myTopics]);

  // Candidatures strictly isolated to this director's topics
  const myApplications = useMemo(() => {
    return applications.filter((app) => myTopicIds.includes(app.topicId));
  }, [applications, myTopicIds]);

  // Dashboard blocks
  const topicsCount = myTopics.length;
  const pendingReviewCount = myApplications.filter((a) => a.status === 'under_review' || a.status === 'pending_review').length;
  const incompleteCount = myApplications.filter((a) => a.status === 'incomplete').length;
  const pendingCorrectionsCount = myApplications.filter((a) => a.status === 'correction_requested').length;
  const revisionRequestedTopicsCount = myTopics.filter((t) => t.workflowStatus === 'revision_requested').length;
  const admittedCount = myApplications.filter((a) => a.status === 'admitted' || a.status === 'accepted').length;
  const waitlistCount = myApplications.filter((a) => a.status === 'waitlist' || a.status === 'waitlisted').length;

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
      return true;
    });
  }, [myApplications, searchQuery, selectedTopicFilter, selectedStatusFilter]);

  const handleCreateTopicClick = () => {
    setEditingTopic(null);
    setIsTopicModalOpen(true);
  };

  const handleEditTopicClick = (topic: ThesisTopic) => {
    setEditingTopic(topic);
    setIsTopicModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Gestion des sujets et candidatures
          </h1>
        </div>

        <button
          type="button"
          onClick={handleCreateTopicClick}
          className="px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-800 hover:bg-emerald-900 shadow-xs flex items-center gap-2 text-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Proposer un nouveau sujet</span>
        </button>
      </div>

      {/* Revision Notice Banner if Structure Director requested changes */}
      {revisionRequestedTopicsCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">
                {revisionRequestedTopicsCount} sujet(s) nécessite(nt) des modifications suite à l'examen du Directeur de structure.
              </span>
              <p className="text-[11px] text-amber-800">
                Consultez l'onglet « Mes sujets » pour corriger les remarques et soumettre à nouveau pour signature.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className="px-3 py-1.5 rounded-lg font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 text-[11px] shrink-0 cursor-pointer"
          >
            Voir les sujets à corriger
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tableau de bord
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topics')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'topics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Mes sujets proposés</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {topicsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Candidatures reçues</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
            {myApplications.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rankings')}
          className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rankings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Classements & Listes d'attente</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mes sujets</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{topicsCount}</div>
              <div className="text-[10px] text-slate-400 mt-1">Sujets de recherche</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">À examiner</div>
              <div className="text-2xl font-black text-amber-800 mt-1">{pendingReviewCount}</div>
              <div className="text-[10px] text-amber-600 mt-1">Dossiers en attente</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Dossiers incomplets</div>
              <div className="text-2xl font-black text-rose-800 mt-1">{incompleteCount}</div>
              <div className="text-[10px] text-rose-600 mt-1">Pièces manquantes</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Corrections</div>
              <div className="text-2xl font-black text-sky-800 mt-1">{pendingCorrectionsCount}</div>
              <div className="text-[10px] text-sky-600 mt-1">En attente candidat</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Admis</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">{admittedCount}</div>
              <div className="text-[10px] text-emerald-600 mt-1">Liste Principale</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Liste d'attente</div>
              <div className="text-2xl font-black text-indigo-800 mt-1">{waitlistCount}</div>
              <div className="text-[10px] text-indigo-600 mt-1">Candidats classés</div>
            </div>
          </div>

          {/* Quick List: Actionable Dossiers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dossiers prioritaires nécessitant votre intervention</h3>
                <p className="text-xs text-slate-500">Candidatures en cours d'examen ou avec demande de correction</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('applications')}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Voir tout ({myApplications.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {myApplications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucune candidature reçue pour l'instant pour vos sujets.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myApplications.slice(0, 4).map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{app.candidateName}</div>
                      <div className="text-slate-500 text-[11px]">
                        {app.topicCode} · {app.masterDegree} ({app.masterGrade}/20)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        app.status === 'admitted' || app.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'waitlist' || app.status === 'waitlisted'
                          ? 'bg-indigo-100 text-indigo-800'
                          : app.status === 'correction_requested'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {app.status === 'admitted' ? 'Admis' : app.status === 'waitlist' ? `Liste d'attente (Rang ${app.waitlistRank || 1})` : app.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedApplication(app)}
                        className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] cursor-pointer"
                      >
                        Examiner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY TOPICS */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600">
              {myTopics.length} sujet(s) de thèse sous votre direction
            </span>
            <button
              type="button"
              onClick={handleCreateTopicClick}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau sujet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTopics.map((topic) => {
              const isRevisionRequested = topic.workflowStatus === 'revision_requested';
              const isApproved = topic.workflowStatus === 'approved_signed';
              const isSubmitted = topic.workflowStatus === 'submitted';

              return (
                <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {topic.code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRevisionRequested
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : isSubmitted
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isApproved
                          ? 'Validé & Signé (Publié)'
                          : isRevisionRequested
                          ? 'Modifications demandées'
                          : isSubmitted
                          ? 'En attente de signature'
                          : 'Brouillon'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{topic.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {topic.scientificDescription}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <div><strong>Domaine :</strong> {topic.domain}</div>
                      <div><strong>Places :</strong> {topic.spotsAvailable} · <strong>Candidatures reçues :</strong> {topic.applicantsCount}</div>
                      <div><strong>Date limite :</strong> {formatDate(topic.submissionDeadline, _language)}</div>
                    </div>

                    {/* Electronic signature notice if approved */}
                    {topic.electronicSignature && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Signé électroniquement par la Direction de structure</span>
                        </div>
                        <div>Signataire : {topic.electronicSignature.signerName} ({topic.electronicSignature.signedAt})</div>
                      </div>
                    )}

                    {/* Revision notes if requested */}
                    {isRevisionRequested && topic.revisionRequests && topic.revisionRequests.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Remarques du Directeur de structure :</span>
                        </div>
                        <p className="italic">
                          "{topic.revisionRequests[topic.revisionRequests.length - 1].message}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {topic.institution}
                    </span>

                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleEditTopicClick(topic)}
                        className="px-3 py-1.5 rounded-lg font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isRevisionRequested ? 'Corriger et re-soumettre' : 'Modifier le sujet'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: APPLICATIONS RECEIVED */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par candidat, CNE, diplôme..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Tous mes sujets</option>
              {myTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.code}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Tous les statuts</option>
              <option value="admitted">Admis</option>
              <option value="waitlist">Liste d'attente</option>
              <option value="pending_review">À examiner</option>
              <option value="correction_requested">Correction demandée</option>
              <option value="rejected">Non retenu</option>
            </select>
          </div>

          {/* Applications Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Candidat</th>
                    <th className="py-3 px-4">Sujet</th>
                    <th className="py-3 px-4">Cursus & Note</th>
                    <th className="py-3 px-4">Avis Scientifique</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucune candidature ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{app.candidateName}</div>
                          <div className="text-[11px] text-slate-500">{app.candidateEmail} · CNE : {app.cne}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            {app.topicCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{app.masterDegree}</div>
                          <div className="text-[11px] text-slate-500">Note : <strong>{app.masterGrade}/20</strong> ({app.masterMention})</div>
                        </td>
                        <td className="py-3 px-4">
                          {app.scientificOpinion ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              app.scientificOpinion.recommendation === 'favorable'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.scientificOpinion.recommendation === 'defavorable'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              Avis {app.scientificOpinion.recommendation} ({app.scientificOpinion.score}/20)
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Non évalué</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.status === 'admitted' || app.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'waitlist' || app.status === 'waitlisted'
                              ? 'bg-indigo-100 text-indigo-800'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : app.status === 'correction_requested'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {app.status === 'admitted' ? 'Admis (LP)' : app.status === 'waitlist' ? `Attente (Rang ${app.waitlistRank})` : app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedApplication(app)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition-colors cursor-pointer text-xs"
                          >
                            Évaluer le dossier
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RANKINGS & WAITLISTS */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Classement académique et ordre des listes d'attente
            </h3>
            <p className="text-xs text-slate-500">
              Le directeur de thèse établit le classement au mérite pour chaque sujet. Les résultats sont transmis au Directeur de structure pour validation et notification officielle.
            </p>
          </div>

          <div className="space-y-4">
            {myTopics.map((topic) => {
              const topicApps = myApplications.filter((a) => a.topicId === topic.id);
              const admitted = topicApps.filter((a) => a.status === 'admitted' || a.status === 'accepted');
              const waitlisted = topicApps
                .filter((a) => a.status === 'waitlist' || a.status === 'waitlisted')
                .sort((a, b) => (a.waitlistRank || 99) - (b.waitlistRank || 99));

              return (
                <div key={topic.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded mr-2">
                        {topic.code}
                      </span>
                      <strong className="text-sm text-slate-900">{topic.title}</strong>
                    </div>
                    <span className="text-xs text-slate-500">
                      Capacité : <strong>{topic.spotsAvailable} place(s)</strong> · Candidats : {topicApps.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Main Admission List */}
                    <div className="space-y-2">
                      <div className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Liste Principale (Admis) — {admitted.length}/{topic.spotsAvailable}</span>
                      </div>
                      {admitted.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-400 italic text-center">
                          Aucun candidat admis pour le moment
                        </div>
                      ) : (
                        admitted.map((a) => (
                          <div key={a.id} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{a.candidateName}</div>
                              <div className="text-[11px] text-slate-500">Note: {a.masterGrade}/20 · Avis {a.scientificOpinion?.score || 17}/20</div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded text-[10px]">
                              Retenu
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Waitlist */}
                    <div className="space-y-2">
                      <div className="font-bold text-indigo-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ListOrdered className="w-4 h-4 text-indigo-700" />
                        <span>Ordre de la Liste d'Attente ({waitlisted.length})</span>
                      </div>
                      {waitlisted.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-lg text-slate-400 italic text-center">
                          Aucun candidat sur liste d'attente
                        </div>
                      ) : (
                        waitlisted.map((w, index) => (
                          <div key={w.id} className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">
                                #{w.waitlistRank || index + 1} · {w.candidateName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Note : {w.masterGrade}/20 · Avis scientifique : {w.scientificOpinion?.score || 16}/20
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 font-bold rounded text-[10px]">
                              Rang {w.waitlistRank || index + 1}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <ApplicationReviewModal
          application={selectedApplication}
          isOpen={Boolean(selectedApplication)}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={onUpdateApplicationStatus}
          onRequestPieceCorrection={onRequestPieceCorrection}
          onSaveScientificOpinion={onSaveScientificOpinion}
          currentUser={currentUserName}
          language="fr"
        />
      )}

      {/* Topic Proposal / Edit Modal */}
      {isTopicModalOpen && (
        <TopicProposalModal
          isOpen={isTopicModalOpen}
          onClose={() => {
            setIsTopicModalOpen(false);
            setEditingTopic(null);
          }}
          existingTopic={editingTopic}
          onSave={(topicData) => onSaveTopic(topicData, editingTopic?.id)}
          language="fr"
        />
      )}
    </div>
  );
};
