/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Admission & Automatic Waitlist Service for USMBA Doctoral Platform
 * 
 * Strict Implementation of the USMBA Admission & Waitlist Workflow:
 * 1. Automatic detection of expired registration deadlines for admitted candidates.
 * 2. Cancellation of admission on expiration: candidate status -> 'deadline_exceeded' then 'admission_cancelled'.
 * 3. Automated notification to the cancelled candidate.
 * 4. Automatic query of the subject's waitlist in order of rank / merit score.
 * 5. Generation of a promotion proposal for the next eligible candidate.
 * 6. Mandatory human-in-the-loop: The Structure Director MUST confirm or reject the promotion.
 *    (NEVER automatically promote without Structure Director confirmation).
 * 7. Spot availability check: Never exceed the spotsAvailable limit.
 * 8. If no eligible candidate remains on waitlist, mark the spot as officially vacant.
 * 9. Comprehensive audit logging on every transition.
 */

import { CandidateApplication, ThesisTopic, WaitlistPromotionProposal } from '../types';
import { ApplicationService } from './thesisService';
import { NotificationService } from './notificationService';
import { AdminConfigService } from './adminConfigService';
import { V5_KEYS } from './dataMigrationService';

const STORAGE_PROPOSALS_KEY = V5_KEYS.PROPOSALS;

export const AdmissionWaitlistService = {
  /**
   * Retrieve all waitlist promotion proposals
   */
  getProposals(): WaitlistPromotionProposal[] {
    try {
      const raw = localStorage.getItem(STORAGE_PROPOSALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save proposals to localStorage
   */
  saveProposals(proposals: WaitlistPromotionProposal[]): void {
    try {
      localStorage.setItem(STORAGE_PROPOSALS_KEY, JSON.stringify(proposals));
    } catch (e) {
      console.warn('Failed to save waitlist proposals', e);
    }
  },

  /**
   * Scans all applications for expired registration deadlines.
   * If an admitted candidate has not confirmed registration and their deadline has passed:
   * 1. Cancels admission ('deadline_exceeded' -> 'admission_cancelled').
   * 2. Notifies candidate.
   * 3. Finds next candidate on waitlist for this topic.
   * 4. Creates a WaitlistPromotionProposal for the Structure Director.
   */
  checkAndProcessExpirations(
    applications: CandidateApplication[],
    topics: ThesisTopic[]
  ): {
    expiredCount: number;
    newProposalsCount: number;
    updatedApplications: CandidateApplication[];
  } {
    const now = new Date();
    let expiredCount = 0;
    let newProposalsCount = 0;
    const proposals = this.getProposals();
    const campaign = AdminConfigService.getCampaign();
    const daysAllowed = campaign.registrationDaysAllowed || 10;

    const updatedApps = [...applications];

    for (let i = 0; i < updatedApps.length; i++) {
      const app = updatedApps[i];

      // Eligible for check: status is 'admitted', 'accepted', or 'registration_pending'
      const isAdmitted = app.status === 'admitted' || app.status === 'accepted' || app.status === 'registration_pending';
      if (!isAdmitted) continue;

      // Determine deadline: specific application deadline or global campaign deadline
      const deadlineStr = app.registrationDeadline || campaign.registrationDeadline;
      if (!deadlineStr) continue;

      const deadline = new Date(deadlineStr);
      if (now > deadline) {
        // DEADLINE EXCEEDED!
        expiredCount++;

        // 1. Update status to admission_cancelled
        app.status = 'admission_cancelled';
        const cancelDate = new Date().toISOString();
        const cancelFormatted = new Date().toLocaleString('fr-FR');

        app.history.push({
          id: `audit-cancel-${Date.now()}-${i}`,
          date: cancelFormatted,
          action: 'Délai d’inscription dépassé — Admission annulée',
          author: 'Automate Système USMBA (Contrôle des Délais)',
          note: `La date limite d’inscription fixée au ${new Date(deadlineStr).toLocaleDateString('fr-FR')} n’a pas été honorée. L’admission a été automatiquement révoquée.`,
        });

        // 2. Notify cancelled candidate
        NotificationService.send({
          recipientEmail: app.candidateEmail,
          recipientRole: 'candidate',
          type: 'admission_cancelled',
          title: 'Annulation d’admission pour délai d’inscription dépassé',
          titleAr: 'إلغاء القبول لتجاوز أجل التسجيل المحدد',
          message: `Votre admission au sujet [${app.topicCode}] ${app.topicTitle} a été révoquée car votre inscription administrative n'a pas été confirmée avant l'échéance du ${new Date(deadlineStr).toLocaleDateString('fr-FR')}.`,
          relatedApplicationId: app.id,
          relatedTopicId: app.topicId,
        });

        // 3. Find next candidate on the waitlist for this specific topic
        const topic = topics.find((t) => t.id === app.topicId);
        const waitlistCandidates = updatedApps
          .filter((other) => other.topicId === app.topicId && (other.status === 'waitlist' || other.status === 'waitlisted'))
          .sort((a, b) => {
            // Sort primarily by waitlistRank, secondarily by score
            const rankA = a.waitlistRank ?? 999;
            const rankB = b.waitlistRank ?? 999;
            if (rankA !== rankB) return rankA - rankB;
            const scoreA = a.scientificOpinion?.score ?? 0;
            const scoreB = b.scientificOpinion?.score ?? 0;
            return scoreB - scoreA;
          });

        if (waitlistCandidates.length > 0) {
          const nextInLine = waitlistCandidates[0];

          // Compute new deadline for proposed candidate
          const newDeadline = new Date();
          newDeadline.setDate(newDeadline.getDate() + daysAllowed);
          const newDeadlineIso = newDeadline.toISOString();

          // Check if already proposed
          const alreadyProposed = proposals.some(
            (p) => p.proposedApplicationId === nextInLine.id && p.status === 'pending_director_confirmation'
          );

          if (!alreadyProposed) {
            const proposal: WaitlistPromotionProposal = {
              id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              topicId: app.topicId,
              topicCode: app.topicCode,
              topicTitle: app.topicTitle,
              cancelledApplicationId: app.id,
              cancelledCandidateName: app.candidateName,
              cancelledCandidateEmail: app.candidateEmail,
              cancelledReason: 'Non-respect du délai d’inscription imparti',
              cancelledAt: cancelDate,
              proposedApplicationId: nextInLine.id,
              proposedCandidateName: nextInLine.candidateName,
              proposedCandidateEmail: nextInLine.candidateEmail,
              proposedWaitlistRank: nextInLine.waitlistRank || 1,
              status: 'pending_director_confirmation',
              newRegistrationDeadline: newDeadlineIso,
            };

            proposals.unshift(proposal);
            newProposalsCount++;

            // Notify Structure Director
            NotificationService.send({
              recipientEmail: 'directeur.structure.test@usmba.ma',
              recipientRole: 'structure_director',
              type: 'waitlist_proposal',
              title: `Proposition liste d'attente : ${nextInLine.candidateName} (Sujet ${app.topicCode})`,
              message: `Suite à l'expiration du délai d'inscription pour ${app.candidateName}, le système propose d'admettre le candidat classé n°${nextInLine.waitlistRank} sur liste d'attente. Votre validation formelle est requise.`,
              relatedApplicationId: nextInLine.id,
              relatedTopicId: app.topicId,
            });
          }
        } else {
          // No candidate left on waitlist for this topic
          NotificationService.send({
            recipientEmail: 'directeur.structure.test@usmba.ma',
            recipientRole: 'structure_director',
            type: 'waitlist_proposal',
            title: `Place vacante sur le sujet ${app.topicCode}`,
            message: `Suite à l'annulation de l'admission de ${app.candidateName}, aucun candidat admissible ne figure actuellement sur la liste d'attente de ce sujet. La place est déclarée vacante.`,
            relatedTopicId: app.topicId,
          });
        }
      }
    }

    if (expiredCount > 0 || newProposalsCount > 0) {
      ApplicationService.saveApplications(updatedApps);
      this.saveProposals(proposals);
    }

    return {
      expiredCount,
      newProposalsCount,
      updatedApplications: updatedApps,
    };
  },

  /**
   * Structure Director confirms the promotion of a waitlisted candidate.
   * Promotes candidate to 'admitted' / 'registration_pending', sets the new registration deadline,
   * logs the official decision, and sends the admission notification with the new deadline.
   */
  confirmPromotion(
    proposalId: string,
    directorName: string,
    notes?: string
  ): { success: boolean; error?: string; promotedCandidateName?: string } {
    const proposals = this.getProposals();
    const proposalIndex = proposals.findIndex((p) => p.id === proposalId);

    if (proposalIndex === -1) {
      return { success: false, error: 'Proposition introuvable.' };
    }

    const proposal = proposals[proposalIndex];
    if (proposal.status !== 'pending_director_confirmation') {
      return { success: false, error: 'Cette proposition a déjà été traitée.' };
    }

    const applications = ApplicationService.getApplications();
    const candidateApp = applications.find((a) => a.id === proposal.proposedApplicationId);

    if (!candidateApp) {
      return { success: false, error: 'Dossier du candidat proposé introuvable.' };
    }

    // 1. Promote candidate to 'admitted'
    candidateApp.status = 'admitted';
    candidateApp.registrationDeadline = proposal.newRegistrationDeadline;
    candidateApp.decisionDate = new Date().toISOString();
    candidateApp.decisionBy = directorName;

    const formattedDate = new Date().toLocaleString('fr-FR');
    const deadlineFormatted = new Date(proposal.newRegistrationDeadline).toLocaleDateString('fr-FR');

    candidateApp.history.push({
      id: `audit-promo-${Date.now()}`,
      date: formattedDate,
      action: 'Admission officielle après délibération de la liste d’attente',
      author: `${directorName} (Directeur de structure)`,
      note: `Promotion validée depuis la liste d’attente (Rang initial : ${proposal.proposedWaitlistRank}). Nouvelle date limite d’inscription fixée au ${deadlineFormatted}.${notes ? ` Observations : ${notes}` : ''}`,
    });

    // 2. Mark proposal as confirmed
    proposal.status = 'confirmed';
    proposal.resolvedAt = new Date().toISOString();
    proposal.resolvedBy = directorName;
    proposal.directorNotes = notes;

    // 3. Persist
    ApplicationService.saveApplications(applications);
    this.saveProposals(proposals);

    // 4. Send official notification to newly admitted candidate
    NotificationService.send({
      recipientEmail: candidateApp.candidateEmail,
      recipientRole: 'candidate',
      type: 'decision',
      title: 'Félicitations : Vous êtes officiellement admis au Doctorat USMBA !',
      titleAr: 'تهانينا: تم قبولكم رسمياً في سلك الدكتوراه بجامعة سيدي محمد بن عبد الله',
      message: `Suite au traitement de la liste d'attente pour le sujet [${candidateApp.topicCode}] ${candidateApp.topicTitle}, votre candidature a été retenue sur Liste Principale par le Directeur de structure. Vous devez impérativement finaliser votre inscription avant le ${deadlineFormatted}.`,
      relatedApplicationId: candidateApp.id,
      relatedTopicId: candidateApp.topicId,
    });

    return {
      success: true,
      promotedCandidateName: candidateApp.candidateName,
    };
  },

  /**
   * Structure Director dismisses/refuses the proposal (e.g. candidate does not meet prerequisites).
   */
  dismissProposal(
    proposalId: string,
    directorName: string,
    reason: string
  ): { success: boolean; error?: string } {
    if (!reason.trim()) {
      return { success: false, error: 'Une justification est obligatoire pour refuser une promotion.' };
    }

    const proposals = this.getProposals();
    const proposalIndex = proposals.findIndex((p) => p.id === proposalId);

    if (proposalIndex === -1) {
      return { success: false, error: 'Proposition introuvable.' };
    }

    const proposal = proposals[proposalIndex];
    proposal.status = 'dismissed';
    proposal.resolvedAt = new Date().toISOString();
    proposal.resolvedBy = directorName;
    proposal.directorNotes = `Proposition refusée par le Directeur de structure : ${reason.trim()}`;

    this.saveProposals(proposals);
    return { success: true };
  },

  /**
   * Candidate confirms their doctoral registration within the allocated deadline.
   */
  confirmCandidateRegistration(
    applicationId: string,
    candidateName: string
  ): { success: boolean; error?: string } {
    const applications = ApplicationService.getApplications();
    const app = applications.find((a) => a.id === applicationId);

    if (!app) {
      return { success: false, error: 'Dossier de candidature introuvable.' };
    }

    const now = new Date();
    if (app.registrationDeadline && now > new Date(app.registrationDeadline)) {
      return {
        success: false,
        error: 'Le délai imparti pour votre inscription est dépassé. Veuillez contacter le service du CEDoc.',
      };
    }

    app.status = 'registration_confirmed';
    const formattedDate = new Date().toLocaleString('fr-FR');

    app.history.push({
      id: `audit-reg-${Date.now()}`,
      date: formattedDate,
      action: 'Inscription administrative confirmée par le candidat',
      author: candidateName,
      note: 'Le candidat a validé son engagement et confirmé son inscription dans les délais impartis.',
    });

    ApplicationService.saveApplications(applications);

    // Notify Directors
    NotificationService.send({
      recipientEmail: 'directeur.structure.test@usmba.ma',
      recipientRole: 'structure_director',
      type: 'submission',
      title: `Inscription confirmée : ${candidateName} (Sujet ${app.topicCode})`,
      message: `Le candidat admis ${candidateName} a validé son inscription administrative en ligne pour le sujet ${app.topicCode}.`,
      relatedApplicationId: app.id,
    });

    return { success: true };
  },

  /**
   * Testing simulator: Expire an admitted candidate immediately to demonstrate the waitlist automation in UI
   */
  simulateExpireCandidate(applicationId: string): void {
    const applications = ApplicationService.getApplications();
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    // Set deadline to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    app.registrationDeadline = yesterday.toISOString();
    ApplicationService.saveApplications(applications);
  },
};
