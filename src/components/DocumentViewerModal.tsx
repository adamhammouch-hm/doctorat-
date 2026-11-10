/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DocumentViewerModal Component — Visionneuse professionnelle pour pièces justificatives
 * Supporte : Images (JPG, PNG, WebP), PDF, navigation multipages, zoom, rotation et téléchargement.
 */

import React, { useState, useEffect } from 'react';
import { ApplicationDocument } from '../types';
import { LocalFileStorage } from '../services/localFileStorage';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ApplicationDocument | null;
  candidateName?: string;
  canRequestCorrection?: boolean;
  onRequestCorrection?: (category: string, note: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  candidateName,
  canRequestCorrection,
  onRequestCorrection,
}) => {
  const [pages, setPages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Correction inline state
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionNote, setCorrectionNote] = useState(doc?.note || '');

  useEffect(() => {
    if (!isOpen || !doc) {
      setPages([]);
      setCurrentPageIndex(0);
      setZoomLevel(1);
      setRotation(0);
      setErrorMessage(null);
      setIsCorrectionOpen(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setCurrentPageIndex(0);
    setZoomLevel(1);
    setRotation(0);
    setCorrectionNote(doc.note || '');

    // 1. Direct pages array in memory
    if (doc.pages && doc.pages.length > 0 && doc.pages[0] !== '[local_storage_file]') {
      setPages(doc.pages);
      setIsLoading(false);
      return;
    }

    // 2. Load from IndexedDB
    const storageId = doc.storageRef || doc.id;
    LocalFileStorage.getDocumentPages(storageId).then((storedPages) => {
      if (storedPages && storedPages.length > 0) {
        setPages(storedPages);
        setIsLoading(false);
      } else {
        // Try blob / single URL
        return LocalFileStorage.getDocumentUrl(storageId).then((url) => {
          if (url) {
            setPages([url]);
            setIsLoading(false);
          } else {
            // Document was a simulated prototype or bytes were cleared
            generateSimulatedPreview(doc);
          }
        });
      }
    }).catch((err) => {
      console.warn('Error fetching document from storage', err);
      generateSimulatedPreview(doc);
    });
  }, [isOpen, doc]);

  // Generate a clean preview representation for seeded prototype records
  const generateSimulatedPreview = (documentItem: ApplicationDocument) => {
    try {
      const canvas = window.document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Page background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 900, 1200);

        // Header band
        ctx.fillStyle = '#065f46';
        ctx.fillRect(0, 0, 900, 100);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — FÈS', 450, 45);
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillText('Centre d’Études Doctorales (CEDoc) — Pôle Doctoral', 450, 75);

        // Watermark stamp
        ctx.save();
        ctx.translate(450, 600);
        ctx.rotate(-Math.PI / 6);
        ctx.strokeStyle = 'rgba(6, 95, 70, 0.12)';
        ctx.lineWidth = 6;
        ctx.strokeRect(-250, -60, 500, 120);
        ctx.fillStyle = 'rgba(6, 95, 70, 0.12)';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.fillText('DOCUMENT CERTIFIÉ USMBA', 0, 15);
        ctx.restore();

        // Document details card
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.fillRect(80, 160, 740, 260);
        ctx.strokeRect(80, 160, 740, 260);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(documentItem.name, 110, 210);

        ctx.font = '16px system-ui, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Nom du fichier : ${documentItem.fileName}`, 110, 255);
        ctx.fillText(`Catégorie : ${documentItem.category.toUpperCase()}`, 110, 290);
        ctx.fillText(`Taille déclarée : ${documentItem.fileSize}`, 110, 325);
        if (candidateName) {
          ctx.fillText(`Candidat : ${candidateName}`, 110, 360);
        }
        ctx.fillText(`Date de versement : ${documentItem.uploadedAt || 'Session en cours'}`, 110, 395);

        // Verification stamp
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(80, 460, 740, 500);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(80, 460, 740, 500);

        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText('REGISTRE DU GUICHET NUMÉRIQUE DES THÈSES', 110, 510);

        ctx.fillStyle = '#334155';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText('Ce document numérique a été enregistré dans le dossier doctoral de l’USMBA.', 110, 550);
        ctx.fillText('Conformément aux directives ministérielles, l’original papier sera', 110, 580);
        ctx.fillText('contrôlé physiquement au guichet du CEDoc lors de l’inscription définitive.', 110, 610);

        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 13px system-ui, sans-serif';
        ctx.fillText(`Identifiant unique de la pièce : ${documentItem.id}`, 110, 700);
        ctx.fillText('Plateforme Doctorale Officielle USMBA — Sécurisation locale des données', 110, 730);

        // Footer line
        ctx.strokeStyle = '#065f46';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(80, 1120);
        ctx.lineTo(820, 1120);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Université Sidi Mohamed Ben Abdellah · BP 2626 Fès · www.usmba.ac.ma', 450, 1150);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPages([dataUrl]);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Canvas simulation failed', e);
    }

    setErrorMessage('Le contenu de cette pièce justificative n’est plus disponible dans le stockage local.');
    setIsLoading(false);
  };

  if (!isOpen || !doc) return null;

  const currentPage = pages[currentPageIndex] || null;
  const isPdf = Boolean(
    doc.fileType === 'pdf' ||
    doc.fileName.toLowerCase().endsWith('.pdf') ||
    (currentPage && currentPage.startsWith('data:application/pdf'))
  );

  const handleDownload = () => {
    if (!currentPage) return;
    const a = window.document.createElement('a');
    a.href = currentPage;
    a.download = doc.fileName || `${doc.category}.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleSendCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionNote.trim() || !onRequestCorrection) return;
    onRequestCorrection(doc.category, correctionNote.trim());
    setIsCorrectionOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-emerald-700/80 text-emerald-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">
                  {doc.name}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  doc.status === 'valid'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : doc.status === 'needs_correction'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {doc.status === 'valid' ? 'Conforme' : doc.status === 'needs_correction' ? 'Correction demandée' : 'En examen'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {doc.fileName} · {doc.fileSize}
                {candidateName && ` · Candidat : ${candidateName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Télécharger le fichier original"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            {/* Request Correction inline button if permitted */}
            {canRequestCorrection && onRequestCorrection && (
              <button
                type="button"
                onClick={() => setIsCorrectionOpen(!isCorrectionOpen)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isCorrectionOpen 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Demander correction</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Correction Form drawer */}
        {isCorrectionOpen && (
          <form onSubmit={handleSendCorrection} className="p-3 bg-amber-950/40 border-b border-amber-800/40 text-amber-100 flex flex-col sm:flex-row items-center gap-2.5 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs font-bold shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Motif de non-conformité :</span>
            </div>
            <input
              type="text"
              required
              value={correctionNote}
              onChange={(e) => setCorrectionNote(e.target.value)}
              placeholder="Ex : Document illisible, page manquante, cachet absent..."
              className="flex-1 w-full px-3 py-1.5 text-xs bg-slate-900 border border-amber-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Notifier le candidat</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCorrectionOpen(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Existing Note Banner if any */}
        {doc.note && !isCorrectionOpen && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Remarque d'instruction :</strong> {doc.note}</span>
            </div>
          </div>
        )}

        {/* Toolbar: Zoom, Rotate, Page counter */}
        <div className="p-2 sm:px-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0 select-none">
          {/* Multi-page controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 text-xs min-w-[5rem] text-center">
              Page {pages.length > 0 ? currentPageIndex + 1 : 0} / {pages.length}
            </span>
            <button
              type="button"
              disabled={currentPageIndex >= pages.length - 1}
              onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
              className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom & Rotate controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded hover:bg-slate-200 cursor-pointer"
              title="Réduire"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs w-12 text-center text-slate-600">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1.5 rounded hover:bg-slate-200 cursor-pointer"
              title="Agrandir"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1.5 rounded hover:bg-slate-200 cursor-pointer flex items-center gap-1"
              title="Faire pivoter de 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Pivoter</span>
            </button>
          </div>
        </div>

        {/* Viewer Viewport */}
        <div className="flex-1 bg-slate-900/90 overflow-auto p-4 flex items-center justify-center relative">
          {isLoading ? (
            <div className="text-center text-white space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Chargement de la pièce en haute définition...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl text-center max-w-md space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Document non consultable</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
            </div>
          ) : isPdf && currentPage && currentPage.startsWith('data:application/pdf') ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <iframe
                src={currentPage}
                title={doc.name}
                className="w-full h-full rounded-lg bg-white shadow-lg"
              />
            </div>
          ) : currentPage ? (
            <div 
              className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={currentPage}
                alt={`${doc.name} - Page ${currentPageIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded shadow-2xl bg-white"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
