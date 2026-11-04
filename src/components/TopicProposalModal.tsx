/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TopicProposalModal Component — Thesis Topic Creation & Modification by Thesis Director
 * Allows proposing a new topic or correcting an existing one following structure director review.
 */

import React, { useState } from 'react';
import { ThesisTopic, Language } from '../types';
import { 
  X, 
  BookOpen, 
  Save, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface TopicProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTopic?: ThesisTopic | null;
  onSave: (topicData: Partial<ThesisTopic>) => void;
  language: Language;
}

export const TopicProposalModal: React.FC<TopicProposalModalProps> = ({
  isOpen,
  onClose,
  existingTopic,
  onSave,
  language: _language,
}) => {
  const [title, setTitle] = useState(existingTopic?.title || '');
  const [titleAr, setTitleAr] = useState(existingTopic?.titleAr || '');
  const [scientificDescription, setScientificDescription] = useState(existingTopic?.scientificDescription || '');
  const [scientificDescriptionAr, setScientificDescriptionAr] = useState(existingTopic?.scientificDescriptionAr || '');
  const [domain, setDomain] = useState(existingTopic?.domain || 'Informatique & Intelligence Artificielle');
  const [specialty, setSpecialty] = useState(existingTopic?.specialty || 'Systèmes Intelligents');
  const [academicYear, setAcademicYear] = useState(existingTopic?.academicYear || '2024/2025');
  const [spotsAvailable, setSpotsAvailable] = useState<number>(existingTopic?.spotsAvailable || 1);
  const [fundingType, setFundingType] = useState<ThesisTopic['fundingType']>(existingTopic?.fundingType || 'projet_recherche');
  const [submissionDeadline, setSubmissionDeadline] = useState(existingTopic?.submissionDeadline || '2024-12-15');

  // Criteria & Skills
  const [criteria, setCriteria] = useState<string[]>(
    existingTopic?.eligibilityCriteria || [
      'Master de recherche ou Diplôme d’Ingénieur d’État en Informatique',
      'Mention minimale requise en Master : Assez Bien',
    ]
  );
  const [newCriterion, setNewCriterion] = useState('');

  const [skills, setSkills] = useState<string[]>(
    existingTopic?.requiredSkills || ['Python / PyTorch', 'Apprentissage automatique', 'Traitement de données']
  );
  const [newSkill, setNewSkill] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddCriterion = () => {
    if (newCriterion.trim() && !criteria.includes(newCriterion.trim())) {
      setCriteria([...criteria, newCriterion.trim()]);
      setNewCriterion('');
    }
  };

  const handleRemoveCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !scientificDescription.trim()) {
      setErrorMessage('Le titre et la description scientifique détaillée sont obligatoires.');
      return;
    }

    if (spotsAvailable < 1 || spotsAvailable > 5) {
      setErrorMessage('Le nombre de places disponibles doit être compris entre 1 et 5.');
      return;
    }

    onSave({
      title: title.trim(),
      titleAr: titleAr.trim() || undefined,
      scientificDescription: scientificDescription.trim(),
      scientificDescriptionAr: scientificDescriptionAr.trim() || undefined,
      domain,
      specialty,
      academicYear,
      spotsAvailable,
      fundingType,
      submissionDeadline,
      eligibilityCriteria: criteria,
      requiredSkills: skills,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {existingTopic ? `Modifier le sujet : ${existingTopic.code}` : 'Proposer un nouveau sujet de thèse'}
              </h2>
              <p className="text-xs text-slate-500">
                Directeur de thèse · Soumission au Directeur de structure pour validation et signature
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

        {/* Existing Revision Request Alert if any */}
        {existingTopic?.revisionRequests && existingTopic.revisionRequests.length > 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 shrink-0">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Remarques du Directeur de structure (Modifications demandées) :</span>
            </div>
            <p className="italic bg-white p-2.5 rounded-lg border border-amber-200 text-slate-800">
              "{existingTopic.revisionRequests[existingTopic.revisionRequests.length - 1].message}"
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Title (FR and AR) */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Intitulé officiel du sujet de thèse (Français) *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Architectures de Deep Learning pour l'optimisation des Smart Grids"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Intitulé du sujet en Arabe (Optionnel)</label>
            <input
              type="text"
              dir="rtl"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="عنوان موضوع الأطروحة باللغة العربية"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-arabic focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Scientific Description */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Description scientifique détaillée, problématique et objectifs de recherche *
            </label>
            <textarea
              required
              rows={5}
              value={scientificDescription}
              onChange={(e) => setScientificDescription(e.target.value)}
              placeholder="Décrivez les hypothèses scientifiques, les verrous technologiques, la méthodologie et l'impact attendu des travaux de thèse..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Discipline / Domaine *</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="Informatique & Intelligence Artificielle">Informatique & IA</option>
                <option value="Sciences de l’Ingénieur & Énergie">Sciences de l’Ingénieur</option>
                <option value="Cybersécurité & Réseaux">Cybersécurité & Réseaux</option>
                <option value="Biotechnologie & Agro-ressources">Biotechnologie</option>
                <option value="Géosciences & Environnement">Géosciences & Environnement</option>
                <option value="Économie & Gestion">Économie & Gestion</option>
                <option value="Lettres, Histoire & Patrimoine">Lettres & Patrimoine</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nombre de places disponibles *</label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={spotsAvailable}
                onChange={(e) => setSpotsAvailable(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Type de financement *</label>
              <select
                value={fundingType}
                onChange={(e) => setFundingType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              >
                <option value="bourse_cnrst">Bourse CNRST</option>
                <option value="projet_recherche">Projet de Recherche (Laboratoire)</option>
                <option value="partenariat_industriel">Partenariat Industriel (Convention)</option>
                <option value="non_remunere">Sans financement institutionnel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Année universitaire *</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Date limite de candidature *</label>
              <input
                type="date"
                required
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-semibold text-slate-700">Conditions d’accès et prérequis d’éligibilité</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCriterion(); } }}
                placeholder="Ex: Mention minimale Bien en Master"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
            <div className="space-y-1">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span>• {c}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriterion(i)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="font-semibold text-slate-700">Compétences scientifiques & techniques requises</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Ex: PyTorch, Docker, Analyse statistique"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(i)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-800 hover:bg-emerald-900 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{existingTopic ? 'Enregistrer et soumettre au Directeur de structure' : 'Soumettre le sujet pour validation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
