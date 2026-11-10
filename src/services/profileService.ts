/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Profile Service — Manages reusable candidate profiles for multi-topic applications
 */

import { CandidateProfile } from '../types';

const STORAGE_PROFILES_KEY = 'usmba_candidate_profiles_v2';

// Seeded profile for Youssef El Amrani
const SEEDED_PROFILES: Record<string, CandidateProfile> = {
  'user-cand-01': {
    id: 'prof-01',
    userId: 'user-cand-01',
    firstName: 'Youssef',
    lastName: 'El Amrani',
    firstNameAr: 'يوسف',
    lastNameAr: 'العمراني',
    cin: 'CD718293',
    cne: 'N138294012',
    birthDate: '1999-04-12',
    nationality: 'Marocaine',
    gender: 'M',
    phone: '+212 661 234 567',
    email: 'youssef.elamrani@etu.usmba.ac.ma',
    address: 'Avenue des F.A.R, Quartier Atlas',
    city: 'Fès',
    bacType: 'Sciences Mathématiques B',
    bacYear: '2017',
    bacMention: 'Très Bien',
    licenseDegree: 'Licence Fondamentale en Sciences Mathématiques et Informatique (SMI)',
    licenseUniversity: 'Faculté des Sciences Dhar El Mahraz — Fès',
    licenseYear: '2020',
    licenseGrade: 15.25,
    masterDegree: 'Master Recherche en Informatique et Systèmes Intelligents',
    masterUniversity: 'Faculté des Sciences et Techniques (FST) de Fès',
    masterYear: '2023',
    masterGrade: 16.20,
    masterMention: 'Très Bien',
    pfeTitle: 'Segmentation et transcription de textes arabes manuscrits par réseaux CNN-LSTM',
    pfeSupervisor: 'Pr. Karim Benali',
    updatedAt: new Date().toISOString(),
  },
};

export const ProfileService = {
  getAllProfiles(): Record<string, CandidateProfile> {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (!raw) {
        this.saveAllProfiles(SEEDED_PROFILES);
        return SEEDED_PROFILES;
      }
      return JSON.parse(raw);
    } catch {
      return SEEDED_PROFILES;
    }
  },

  saveAllProfiles(profiles: Record<string, CandidateProfile>): void {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Unable to persist profiles', e);
    }
  },

  getProfile(userId: string): CandidateProfile | null {
    const profiles = this.getAllProfiles();
    return profiles[userId] || null;
  },

  saveProfile(profile: CandidateProfile): void {
    const profiles = this.getAllProfiles();
    profiles[profile.userId] = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    this.saveAllProfiles(profiles);
  },

  createEmptyProfile(userId: string, email: string, name: string): CandidateProfile {
    const parts = name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    return {
      id: `prof-${Date.now()}`,
      userId,
      firstName,
      lastName,
      cin: '',
      cne: '',
      birthDate: '',
      nationality: 'Marocaine',
      gender: 'M',
      phone: '',
      email,
      address: '',
      city: 'Fès',
      bacType: '',
      bacYear: '',
      bacMention: '',
      licenseDegree: '',
      licenseUniversity: '',
      licenseYear: '',
      licenseGrade: 14,
      masterDegree: '',
      masterUniversity: '',
      masterYear: '',
      masterGrade: 14,
      masterMention: 'Bien',
      pfeTitle: '',
      updatedAt: new Date().toISOString(),
    };
  },
};
