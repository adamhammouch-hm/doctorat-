/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Local IndexedDB File Storage for USMBA Doctoral Platform
 * Stores binary documents (PDF, JPG, PNG) locally in the browser IndexedDB
 * avoiding localStorage 5MB quota exhaustion without any external cloud service.
 */

const DB_NAME = 'usmba_doctoral_files_v1';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB maximum per document
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export interface StoredDocumentMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  uploadedAt: string;
  applicationId?: string;
  candidateEmail?: string;
}

export interface StoredDocumentRecord {
  metadata: StoredDocumentMetadata;
  blob?: Blob;
  pages?: string[];
}

class LocalFileStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeObjectUrls: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB non supporté par ce navigateur'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('category', 'metadata.category', { unique: false });
          store.createIndex('candidateEmail', 'metadata.candidateEmail', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Erreur d’ouverture de la base IndexedDB locale'));
      };
    });

    return this.dbPromise;
  }

  /**
   * Validate file size and type
   */
  validateFile(file: File | Blob, customName?: string): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Le fichier dépasse la limite autorisée de 5 Mo (taille actuelle : ${mbSize} Mo). Prière de compresser le document.`
      };
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Format non autorisé. Formats acceptés : PDF, JPEG, PNG, WebP.'
      };
    }

    return { valid: true };
  }

  /**
   * Store a document in IndexedDB
   */
  async saveDocument(
    id: string,
    file: File | Blob,
    metadata: Omit<StoredDocumentMetadata, 'id' | 'uploadedAt' | 'size'>
  ): Promise<StoredDocumentMetadata> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const db = await this.getDB();
    const docMeta: StoredDocumentMetadata = {
      id,
      name: metadata.name,
      type: file.type || 'application/pdf',
      size: file.size,
      category: metadata.category,
      uploadedAt: new Date().toISOString(),
      applicationId: metadata.applicationId,
      candidateEmail: metadata.candidateEmail,
    };

    const record: StoredDocumentRecord = {
      metadata: docMeta,
      blob: file,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, ...record });

      req.onerror = () => reject(req.error || new Error('Erreur lors de l’écriture du document'));
      tx.oncomplete = () => resolve(docMeta);
      tx.onerror = () => reject(tx.error || req.error || new Error('Échec de la transaction IndexedDB lors de l’enregistrement'));
      tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB interrompue ou annulée'));
    });
  }

  /**
   * Store multi-page data URLs or base64 document in IndexedDB
   */
  async saveDocumentPages(
    id: string,
    pages: string[],
    metadata: Omit<StoredDocumentMetadata, 'id' | 'uploadedAt' | 'size' | 'type'> & { size?: number; type?: string }
  ): Promise<StoredDocumentMetadata> {
    const db = await this.getDB();
    const isPdf = pages[0]?.startsWith('data:application/pdf');
    const estimatedSize = metadata.size || Math.round((pages.reduce((acc, p) => acc + p.length, 0) * 0.75));
    const docMeta: StoredDocumentMetadata = {
      id,
      name: metadata.name,
      type: metadata.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
      size: estimatedSize,
      category: metadata.category,
      uploadedAt: new Date().toISOString(),
      applicationId: metadata.applicationId,
      candidateEmail: metadata.candidateEmail,
    };

    const record: StoredDocumentRecord = {
      metadata: docMeta,
      pages,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, ...record });

      req.onerror = () => reject(req.error || new Error('Erreur lors de l’écriture du document'));
      tx.oncomplete = () => resolve(docMeta);
      tx.onerror = () => reject(tx.error || req.error || new Error('Échec de la transaction IndexedDB lors de l’enregistrement'));
      tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB interrompue ou annulée'));
    });
  }

  /**
   * Retrieve document pages array from IndexedDB
   */
  async getDocumentPages(id: string): Promise<string[] | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          if (req.result && req.result.pages && Array.isArray(req.result.pages) && req.result.pages.length > 0) {
            resolve(req.result.pages);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error || new Error('Erreur lors de la lecture des pages du document'));
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieve document blob by id
   */
  async getDocumentBlob(id: string): Promise<Blob | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error || new Error('Erreur lors de la lecture du document local'));
    });
  }

  /**
   * Get an Object URL or data URL for preview or download
   */
  async getDocumentUrl(id: string): Promise<string | null> {
    if (this.activeObjectUrls.has(id)) {
      return this.activeObjectUrls.get(id)!;
    }

    const pages = await this.getDocumentPages(id);
    if (pages && pages.length > 0) {
      return pages[0];
    }

    const blob = await this.getDocumentBlob(id);
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    this.activeObjectUrls.set(id, url);
    return url;
  }

  /**
   * Revoke cached Object URL to free memory
   */
  revokeUrl(id: string) {
    const url = this.activeObjectUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.activeObjectUrls.delete(id);
    }
  }

  /**
   * Delete document by id
   */
  async deleteDocument(id: string): Promise<void> {
    this.revokeUrl(id);
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onerror = () => reject(req.error || new Error('Erreur lors de la suppression du document'));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || req.error || new Error('Échec de la transaction IndexedDB lors de la suppression'));
      tx.onabort = () => reject(tx.error || new Error('Transaction de suppression IndexedDB interrompue'));
    });
  }

  /**
   * List all stored documents metadata
   */
  async listDocuments(): Promise<StoredDocumentMetadata[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result || []).map((r: any) => r.metadata);
          resolve(list);
        };
        req.onerror = () => reject(req.error || new Error('Impossible de lister les documents locaux'));
      });
    } catch {
      return [];
    }
  }

  /**
   * Calculate total bytes stored in IndexedDB
   */
  async getTotalStorageUsed(): Promise<{ totalBytes: number; fileCount: number }> {
    const docs = await this.listDocuments();
    const totalBytes = docs.reduce((acc, d) => acc + (d.size || 0), 0);
    return { totalBytes, fileCount: docs.length };
  }

  /**
   * Clear all stored documents
   */
  async clearAll(): Promise<void> {
    this.activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.activeObjectUrls.clear();

    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onerror = () => reject(req.error || new Error('Erreur lors de la réinitialisation du store'));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || req.error || new Error('Échec de la transaction IndexedDB lors du vidage'));
      tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB interrompue'));
    });
  }
}

export const LocalFileStorage = new LocalFileStorageService();
