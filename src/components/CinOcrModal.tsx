/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * CinOcrModal Component — Explicit consent, optical extraction preview, manual correction & confirmation
 */

import React, { useState } from 'react';
import { CinOcrResult, Language } from '../types';
import { CinOcrService } from '../services/ocrService';
import { 
  X, 
  Scan, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  ShieldCheck,
  Check
} from 'lucide-react';

interface CinOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcr: (data: {
    cin: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  }) => void;
  language: Language;
}

export const CinOcrModal: React.FC<CinOcrModalProps> = ({
  isOpen,
  onClose,
  onApplyOcr,
  language,
}) => {
  const isRtl = language === 'ar';
  const [hasConsent, setHasConsent] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<CinOcrResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable fields for manual verification & correction
  const [cinNumber, setCinNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!hasConsent) {
      setErrorMessage('Veuillez cocher la case de consentement avant d’importer la carte.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageBase64(dataUrl);
      triggerOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const triggerOcr = async (img: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const res = await CinOcrService.extractCinData(img, hasConsent);
      if (res.success && res.data) {
        setOcrResult(res.data);
        setCinNumber(res.data.cinNumber);
        setFirstName(res.data.firstNameFr);
        setLastName(res.data.lastNameFr);
        setBirthDate(res.data.birthDate);
      } else {
        setErrorMessage(res.error || 'Erreur lors de la lecture optique.');
      }
    } catch (err: any) {
      setErrorMessage('Le service OCR est temporairement indisponible.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (!cinNumber.trim()) {
      setErrorMessage('Le numéro de CIN est obligatoire.');
      return;
    }

    onApplyOcr({
      cin: cinNumber.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <Scan className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isRtl ? 'استخراج معلومات البطاقة الوطنية (OCR)' : 'Lecture Optique Assistée de la CIN / CNIE'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'مساعد القراءة البصرية مع التحقق البشري الإلزامي' : 'Assistance à la saisie avec consentement et vérification manuelle'}
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

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Explicit Legal & Consent Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Avertissement légal & Protection des données</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800">
              L’extraction optique (OCR) est une <strong>aide à la saisie</strong>. Elle ne constitue en aucun cas une preuve d’authenticité juridique de votre pièce d’identité. Toutes les données extraites doivent obligatoirement être relues et confirmées manuellement par vos soins avant transmission.
            </p>
            <label className="flex items-start gap-2 pt-1 font-semibold text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => {
                  setHasConsent(e.target.checked);
                  if (e.target.checked && errorMessage) setErrorMessage(null);
                }}
                className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span className="text-xs">
                {isRtl 
                  ? 'أوافق صراحة على معالجة صورة بطاقتي الوطنية لاستخراج المعطيات وتسهيل ملء الملف.'
                  : 'J’autorise le traitement optique de ma CIN pour pré-remplir mon profil académique.'}
              </span>
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload or Re-upload Section */}
          {!imageBase64 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
              <input
                type="file"
                id="cin-file-input"
                accept="image/jpeg,image/png,image/webp"
                disabled={!hasConsent}
                onChange={handleImageUpload}
                className="hidden"
              />
              <label 
                htmlFor="cin-file-input"
                className={`inline-flex flex-col items-center justify-center cursor-pointer ${
                  !hasConsent ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-8 h-8 text-emerald-700 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  Choisir une photo nette de votre CIN (Recto)
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  JPG ou PNG (assurez-vous d’un bon éclairage sans reflet)
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview & Status */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-semibold text-slate-800">Image de la CNIE chargée</span>
                </div>
                <label 
                  htmlFor="cin-file-input-reupload" 
                  className="text-emerald-800 hover:underline font-bold cursor-pointer text-xs"
                >
                  Remplacer l’image
                  <input
                    type="file"
                    id="cin-file-input-reupload"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {isScanning ? (
                <div className="p-6 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Analyse optique de la pièce en cours...</p>
                  <p className="text-[11px] text-slate-400">Reconnaissance des caractères et structure CNIE</p>
                </div>
              ) : ocrResult ? (
                <div className="space-y-3">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-center justify-between">
                    <span className="font-medium">{ocrResult.rawExtractionNotice}</span>
                    <span className="text-[10px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded">
                      Indice : {Math.round(ocrResult.confidenceScore * 100)}%
                    </span>
                  </div>

                  {/* Editable Fields for Human Correction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Numéro de CIN *</label>
                      <input
                        type="text"
                        value={cinNumber}
                        onChange={(e) => setCinNumber(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Date de naissance *</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Prénom (Français) *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nom de famille (Français) *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirmAndApply}
            disabled={!ocrResult || !cinNumber.trim()}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Valider et appliquer au profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};
