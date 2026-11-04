/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DocumentUploadModal Component — Camera capture, cropping, rotation, multi-page reordering & file upload
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ApplicationDocument, DocumentCategory, Language } from '../types';
import { 
  X, 
  Camera, 
  Upload, 
  RotateCw, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  AlertCircle, 
  FileText,
  RefreshCw,
  Crop
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentCategory: DocumentCategory;
  documentName: string;
  existingDocument?: ApplicationDocument;
  onSaveDocument: (doc: ApplicationDocument) => void;
  language: Language;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  documentCategory,
  documentName,
  existingDocument,
  onSaveDocument,
  language,
}) => {
  const isRtl = language === 'ar';
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('file');

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Multi-page state
  const [pages, setPages] = useState<string[]>(() => existingDocument?.pages || []);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Edit tools: Rotation and crop on current captured/previewed page
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La capture par caméra n’est pas supportée par ce navigateur.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable', err);
      const msg = err.name === 'NotAllowedError'
        ? 'Accès à la caméra refusé. Veuillez autoriser l’accès ou importer un fichier.'
        : 'Caméra indisponible ou non détectée sur cet appareil.';
      setCameraError(msg);
      setIsCameraActive(false);
      // Auto-fallback to file upload tab
      setActiveTab('file');
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Snap photo from video feed
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const newPages = [...pages, dataUrl];
    setPages(newPages);
    setSelectedPageIndex(newPages.length - 1);
    stopCamera();
    setActiveTab('file'); // return to preview page list
  };

  // Rotate selected page by 90 degrees
  const handleRotateCurrentPage = () => {
    if (pages.length === 0) return;
    const currentRot = pageRotations[selectedPageIndex] || 0;
    const newRot = (currentRot + 90) % 360;

    // Apply rotation on canvas
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      if (newRot === 90 || newRot === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((newRot * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const updatedPages = [...pages];
      updatedPages[selectedPageIndex] = rotatedDataUrl;
      setPages(updatedPages);
      setPageRotations((prev) => ({ ...prev, [selectedPageIndex]: newRot }));
    };
    img.src = pages[selectedPageIndex];
  };

  // Crop / Auto-enhance current page (trims 5% borders for clean academic scanning)
  const handleCropCurrentPage = () => {
    if (pages.length === 0) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const cropMarginX = Math.round(img.width * 0.04);
      const cropMarginY = Math.round(img.height * 0.04);
      const targetW = img.width - cropMarginX * 2;
      const targetH = img.height - cropMarginY * 2;

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, cropMarginX, cropMarginY, targetW, targetH, 0, 0, targetW, targetH);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const updatedPages = [...pages];
      updatedPages[selectedPageIndex] = croppedDataUrl;
      setPages(updatedPages);
    };
    img.src = pages[selectedPageIndex];
  };

  // Handle local file uploads (PDF, JPG, PNG)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    Array.from(files).forEach((file) => {
      // Validate file size (10 MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`Le fichier "${file.name}" dépasse la limite autorisée de 10 Mo.`);
        return;
      }

      // Check format
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrorMessage(`Format non supporté pour "${file.name}". Seuls les PDF, JPG et PNG sont admis.`);
        return;
      }

      if (file.type === 'application/pdf') {
        // Read as data URL / blob representation
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = event.target?.result as string;
          const newPages = [...pages, res];
          setPages(newPages);
          setSelectedPageIndex(newPages.length - 1);
        };
        reader.readAsDataURL(file);
      } else {
        // Compress image via canvas
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1800;
            let w = img.width;
            let h = img.height;
            if (w > MAX_DIM || h > MAX_DIM) {
              if (w > h) {
                h = Math.round((h * MAX_DIM) / w);
                w = MAX_DIM;
              } else {
                w = Math.round((w * MAX_DIM) / h);
                h = MAX_DIM;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const compressed = canvas.toDataURL('image/jpeg', 0.82);
              setPages((prev) => [...prev, compressed]);
              setSelectedPageIndex(pages.length);
            }
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reordering helpers
  const handleMovePageUp = (index: number) => {
    if (index === 0) return;
    const updated = [...pages];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setPages(updated);
    setSelectedPageIndex(index - 1);
  };

  const handleMovePageDown = (index: number) => {
    if (index >= pages.length - 1) return;
    const updated = [...pages];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setPages(updated);
    setSelectedPageIndex(index + 1);
  };

  const handleDeletePage = (index: number) => {
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated);
    if (selectedPageIndex >= updated.length) {
      setSelectedPageIndex(Math.max(0, updated.length - 1));
    }
  };

  // Final document submission
  const handleSaveAndConfirm = () => {
    if (pages.length === 0) {
      setErrorMessage('Veuillez photographier ou importer au moins une page avant de valider.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const isPdf = pages[0].startsWith('data:application/pdf');
      const estimatedSizeKo = Math.round((pages.reduce((acc, p) => acc + p.length, 0) * 0.75) / 1024);
      const displaySize = estimatedSizeKo > 1024 
        ? `${(estimatedSizeKo / 1024).toFixed(1)} Mo` 
        : `${estimatedSizeKo} Ko`;

      const doc: ApplicationDocument = {
        id: existingDocument?.id || `doc-${Date.now()}`,
        name: documentName,
        category: documentCategory,
        fileName: `${documentCategory.toUpperCase()}_Candidat_USMBA.${isPdf ? 'pdf' : 'pdf'}`,
        fileSize: displaySize,
        fileType: isPdf ? 'pdf' : pages.length > 1 ? 'multi_image' : 'image',
        status: 'valid',
        pages,
        uploadedAt: new Date().toLocaleDateString('fr-FR'),
      };

      onSaveDocument(doc);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {documentName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'إيداع الوثائق المطلوبة (كاميرا أو ملف PDF/JPG)' : 'Dépôt sécurisé avec options caméra, rotation et multipages'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Method Tabs: Camera vs File Upload */}
        <div className="px-4 pt-3 border-b border-slate-100 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'file'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isRtl ? 'تحميل ملف (PDF / صورة)' : 'Importer un fichier (PDF / JPG / PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isRtl ? 'التقاط بالكاميرا' : 'Photographier avec la caméra'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cameraError && activeTab === 'camera' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{cameraError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className="px-3 py-1.5 rounded-md bg-emerald-800 text-white text-xs font-bold cursor-pointer"
              >
                Passer à l’importation de fichier
              </button>
            </div>
          )}

          {/* VIEW: CAMERA ACTIVE */}
          {activeTab === 'camera' && !cameraError && (
            <div className="space-y-3">
              <div className="relative aspect-4/3 sm:aspect-16/9 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-300">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Visual Document Framing Guide */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-white/60 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="bg-slate-900/60 text-white text-[11px] px-3 py-1 rounded backdrop-blur-xs">
                    Alignez votre document à l’intérieur du cadre
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Prendre la photo</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: FILE UPLOAD & PREVIEW / EDIT */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-emerald-700 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Glissez-déposez ou cliquez pour ajouter une page / document
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Formats acceptés : PDF, JPG, PNG (Max 10 Mo par document)
                </p>
              </div>

              {/* Multi-page Manager & Preview */}
              {pages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                    <span>Pages du document ({pages.length} page{pages.length > 1 ? 's' : ''})</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRotateCurrentPage}
                        title="Faire pivoter la page actuelle de 90°"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Pivoter</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCropCurrentPage}
                        title="Recadrer les bordures"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Recadrer</span>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Row & Reordering */}
                  <div className="flex items-center gap-3 overflow-x-auto p-1">
                    {pages.map((page, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedPageIndex(index)}
                        className={`relative w-20 h-28 rounded-lg border-2 overflow-hidden shrink-0 cursor-pointer transition-all ${
                          selectedPageIndex === index
                            ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                            : 'border-slate-200 hover:border-slate-300 opacity-80'
                        }`}
                      >
                        {page.startsWith('data:application/pdf') ? (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-1 text-center">
                            <FileText className="w-6 h-6 text-rose-600" />
                            <span className="text-[10px] font-bold text-slate-600 mt-1">PDF Page</span>
                          </div>
                        ) : (
                          <img
                            src={page}
                            alt={`Page ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}

                        <span className="absolute bottom-1 left-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                          {index + 1}
                        </span>

                        {/* Quick action buttons for thumbnail */}
                        <div className="absolute top-1 right-1 flex flex-col gap-0.5 opacity-90">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePageUp(index);
                              }}
                              className="w-4 h-4 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
                              title="Déplacer vers la gauche"
                            >
                              <ChevronUp className="w-3 h-3 rotate-270" />
                            </button>
                          )}
                          {index < pages.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMovePageDown(index);
                              }}
                              className="w-4 h-4 rounded bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
                              title="Déplacer vers la droite"
                            >
                              <ChevronDown className="w-3 h-3 rotate-270" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(index);
                            }}
                            className="w-4 h-4 rounded bg-rose-700 text-white flex items-center justify-center hover:bg-rose-800"
                            title="Supprimer cette page"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Page Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-28 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-600 text-slate-500 hover:text-emerald-700 flex flex-col items-center justify-center gap-1 shrink-0 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {/* High-res Preview of Currently Selected Page */}
                  {pages[selectedPageIndex] && (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center max-h-60 overflow-hidden">
                      {pages[selectedPageIndex].startsWith('data:application/pdf') ? (
                        <div className="p-8 text-center text-xs text-slate-600">
                          <FileText className="w-12 h-12 text-rose-600 mx-auto mb-2" />
                          <p className="font-bold">Document PDF prêt à être associé</p>
                          <p className="text-[11px] text-slate-400">Page sélectionnée : {selectedPageIndex + 1}</p>
                        </div>
                      ) : (
                        <img
                          src={pages[selectedPageIndex]}
                          alt="Aperçu page"
                          className="max-h-56 max-w-full object-contain rounded"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {pages.length > 0 ? (
              <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {pages.length} page(s) prête(s) pour le dossier
              </span>
            ) : (
              <span>Aucune page enregistrée</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSaveAndConfirm}
              disabled={pages.length === 0 || isProcessing}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Compression & Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Valider et Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
