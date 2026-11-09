/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bilingual i18n dictionary and helpers (French & Arabic with RTL)
 */

import { Language } from '../types';

export const translations = {
  fr: {
    // Top banner & branding
    universityName: 'Université Sidi Mohamed Ben Abdellah de Fès',
    universityNameShort: 'USMBA — Fès',
    platformTitle: 'Portail du Cycle Doctoral',
    platformSubtitle: 'Plateforme moderne d’accès aux sujets de thèse, pré-candidature et cycle doctoral',
    academicYearCurrent: 'Année Universitaire 2026/2027',
    tagDemoData: 'Données de simulation prototype',
    demoNoticeTitle: 'Environnement de prévisualisation et maquettage',
    demoNoticeBody: 'Les sujets présentés ci-dessous sont des exemples réalistes conçus pour valider l’ergonomie et les fonctionnalités du catalogue. Ils ne constituent pas une publication officielle définitive de l’USMBA.',

    // Navigation
    navHome: 'Accueil',
    navCatalog: 'Catalogue des Sujets',
    navProcedure: 'Procédure & Guide',
    navCart: 'Mon Panier de Sujets',
    navLogin: 'Se Connecter',
    navRegister: 'S’inscrire',

    // Hero Section
    heroBadge: 'Campagne de Recrutement Doctoral 2026–2027',
    heroTitle: 'Explorez les sujets de thèse & préparez votre candidature',
    heroDescription: 'Consultez librement les thématiques de recherche validées par les laboratoires, CEDoc et le Pôle Doctoral de l’USMBA. Sélectionnez vos sujets d’intérêt sans création préalable de compte.',
    btnExploreTopics: 'Découvrir les sujets de thèse',
    btnHowItWorks: 'Comment candidater ?',
    statTopicsCount: 'Sujets répertoriés',
    statLabsCount: 'Laboratoires & Équipes',
    statInstitutionsCount: 'Établissements USMBA',
    statOpenCampaign: 'Campagne active',

    // Search & Filter
    searchPlaceholder: 'Rechercher par mot-clé, titre, thématique, encadrant...',
    filterAllInstitutions: 'Tous les établissements',
    filterAllLabs: 'Toutes les structures de recherche',
    filterAllDomains: 'Tous les domaines scientifiques',
    filterAllYears: 'Toutes les années',
    filterAllProfessors: 'Tous les professeurs',
    filterOnlyOpen: 'Sujets ouverts uniquement',
    sortByLabel: 'Trier par',
    sortDeadline: 'Date limite (proche en premier)',
    sortTitle: 'Titre alphabétique',
    sortApplicants: 'Nombre de candidats',
    sortNewest: 'Récemment ajoutés',
    btnResetFilters: 'Réinitialiser les filtres',
    resultsCount: '{count} sujet(s) trouvé(s)',
    noResultsTitle: 'Aucun sujet ne correspond à vos critères',
    noResultsHint: 'Essayez d’élargir vos filtres ou de modifier votre terme de recherche.',

    // Topic Card
    badgeOpen: 'Candidatures Ouvertes',
    badgeClosed: 'Candidatures Clôturées',
    badgeUnderReview: 'En arbitrage',
    supervisorLabel: 'Directeur de thèse',
    laboratoryLabel: 'Structure de recherche',
    institutionLabel: 'Établissement',
    domainLabel: 'Domaine',
    deadlineLabel: 'Date limite',
    applicantsLabel: 'Candidats enregistrés',
    btnViewDetails: 'Voir la fiche détaillée',
    btnAddToCart: 'Ajouter au panier',
    btnInCart: 'Dans votre sélection',
    btnLimitReached: 'Limite atteinte (max {max})',

    // Workflow Stepper (Documented: Structure -> Centre -> Pôle)
    workflowTitle: 'Chaîne de validation institutionnelle',
    stepStructure: 'Structure (Laboratoire)',
    stepCentre: 'Centre (CEDoc / Faculté)',
    stepPole: 'Pôle Doctoral (Présidence)',
    statusValid: 'Validée',
    statusPending: 'En attente de confirmation',
    statusRejected: 'Non validée',

    // Detail Modal
    modalTitle: 'Fiche Scientifique Détaillée',
    sectionContext: 'Contexte et description scientifique du sujet',
    sectionObjectives: 'Objectifs de recherche & livrables attendus',
    sectionSkills: 'Compétences requises & prérequis techniques',
    sectionEligibility: 'Critères d’éligibilité administrative',
    sectionSupervision: 'Direction de thèse & Structure d’accueil',
    sectionFunding: 'Type de financement / Bourse',
    fundingCnrst: 'Bourse d’excellence CNRST',
    fundingProject: 'Projet de recherche financé (PRD/PPR)',
    fundingIndustrial: 'Partenariat industriel / Thèse CIFRE',
    fundingNone: 'Financement personnel / Non rémunéré',
    spotsLabel: 'Capacité d’accueil pour ce sujet',
    spotsValue: '{count} place(s)',
    eligibleForApplication: 'Ce sujet est officiellement validé par le Pôle doctoral et ouvert aux candidatures.',
    notEligibleForApplication: 'Ce sujet n’est pas encore ouvert ou a été clôturé pour cette session.',
    btnClose: 'Fermer',

    // Cart Drawer
    cartTitle: 'Mon Panier de Candidature',
    cartSubtitle: 'Sélection temporaire de sujets avant formalisation du dossier',
    cartEmptyTitle: 'Votre panier est vide',
    cartEmptyDesc: 'Parcourez le catalogue public et ajoutez jusqu’à {max} sujets à votre sélection d’intérêt.',
    cartLimitInfo: 'Règle de sélection : maximum {max} candidatures simultanées (limite recommandée en cours d’arbitrage par l’USMBA).',
    cartConfigLimit: 'Modifier la limite pour test :',
    btnStartApplication: 'Commencer ma candidature',
    btnRemove: 'Retirer',
    btnClearCart: 'Vider le panier',
    alertMaxReached: 'Vous avez atteint le quota maximal de {max} sujets dans votre sélection.',

    // Auth Prep Modal (Phase 2 Preview)
    authModalTitle: 'Authentification — Plateforme GCD',
    authModalSubtitle: 'Préparation du compte pour la soumission officielle des candidatures (Phase 2)',
    tabCandidate: 'Espace Candidat',
    tabProfessor: 'Espace Enseignant / Évaluateur',
    authCandidateDesc: 'Connectez-vous pour formaliser votre dossier académique unique et déposer vos pièces justificatives.',
    authProfessorDesc: 'Connexion réservée aux enseignants-chercheurs via le compte institutionnel @usmba.ac.ma.',
    btnGoogleLogin: 'Se connecter avec Google académique (@usmba.ac.ma)',
    orDivider: 'ou avec vos identifiants',
    emailLabel: 'Adresse e-mail',
    passwordLabel: 'Mot de passe',
    rememberMe: 'Se souvenir de moi',
    forgotPassword: 'Mot de passe oublié ?',
    btnLoginSubmit: 'Se connecter',
    noAccountYet: 'Vous n’avez pas encore de compte candidat ?',
    btnRegisterPrompt: 'Créer mon compte candidat',
    authPhaseNotice: 'Information Phase 1 : Cette modale préfigure l’accès authentifié qui sera activé en Phase 2 (gestion de profil et dépôt de pièces).',

    // Footer
    footerDisclaimer: 'Plateforme officielle de l’Université Sidi Mohamed Ben Abdellah de Fès — Gestion du Cycle Doctoral (GCD).',
    footerLinksTitle: 'Liens institutionnels',
    linkUsmba: 'Portail USMBA',
    linkCedoc: 'Centres d’Études Doctorales (CEDoc)',
    linkCnrst: 'Portail CNRST',
    linkGuide: 'Guide d’utilisation professeurs (PDF)',
    footerCopyright: '© {year} Université Sidi Mohamed Ben Abdellah de Fès. Tous droits réservés.',
  },
  ar: {
    // Top banner & branding
    universityName: 'جامعة سيدي محمد بن عبد الله بفاس',
    universityNameShort: 'جامعة فاس — USMBA',
    platformTitle: 'بوابة سلك الدكتوراه',
    platformSubtitle: 'المنصة الحديثة للاطلاع على مواضيع الأطروحة والترشح المسبق وسلك الدكتوراه',
    academicYearCurrent: 'السنة الجامعية 2026/2027',
    tagDemoData: 'بيانات تجريبية للنموذج الأولي',
    demoNoticeTitle: 'بيئة عرض واختبار تجريبية',
    demoNoticeBody: 'المواضيع المعروضة أدناه هي أمثلة واقعية تهدف لاختبار سهولة الاستخدام ووظائف الدليل. ولا تشكل نشراً رسمياً نهائياً صادراً عن جامعة سيدي محمد بن عبد الله.',

    // Navigation
    navHome: 'الرئيسية',
    navCatalog: 'دليل المواضيع',
    navProcedure: 'المسطرة والدليل',
    navCart: 'سلة المواضيع المختارة',
    navLogin: 'تسجيل الدخول',
    navRegister: 'إنشاء حساب',

    // Hero Section
    heroBadge: 'حملة الترشح لسلك الدكتوراه 2026–2027',
    heroTitle: 'استكشف مواضيع الأطروحة وجهّز ترشيحك بكل سهولة',
    heroDescription: 'اطّلع بحرية تامة على مواضيع البحث المصادق عليها من طرف المختبرات، ومراكز الدراسات، والقطب الجامعي. اختر المواضيع التي تهمك دون الحاجة المسبقة لإنشاء حساب.',
    btnExploreTopics: 'استكشاف مواضيع الأطروحة',
    btnHowItWorks: 'كيفية الترشح ؟',
    statTopicsCount: 'موضوع مسجل',
    statLabsCount: 'مختبر وفرقة بحث',
    statInstitutionsCount: 'مؤسسة جامعية',
    statOpenCampaign: 'الحملة مفتوحة',

    // Search & Filter
    searchPlaceholder: 'ابحث بالكلمات المفتاحية، العنوان، التخصص، الأستاذ المشرف...',
    filterAllInstitutions: 'جميع المؤسسات الجامعية',
    filterAllLabs: 'جميع بنيات ومختبرات البحث',
    filterAllDomains: 'جميع المجالات العلمية',
    filterAllYears: 'جميع السنوات',
    filterAllProfessors: 'جميع الأساتذة',
    filterOnlyOpen: 'المواضيع المفتوحة فقط',
    sortByLabel: 'ترتيب حسب',
    sortDeadline: 'آخر أجل (الأقرب أولاً)',
    sortTitle: 'العنوان أبجدياً',
    sortApplicants: 'عدد المترشحين',
    sortNewest: 'المضافة حديثاً',
    btnResetFilters: 'إعادة ضبط المعايير',
    resultsCount: 'تم العثور على {count} موضوع(اً)',
    noResultsTitle: 'لا توجد نتائج مطابقة لمعايير البحث',
    noResultsHint: 'يرجى توسيع خيارات البحث أو تعديل الكلمات المفتاحية.',

    // Topic Card
    badgeOpen: 'الترشيحات مفتوحة',
    badgeClosed: 'الترشيحات مغلقة',
    badgeUnderReview: 'قيد المراجعة',
    supervisorLabel: 'الأستاذ المشرف',
    laboratoryLabel: 'بنية البحث (المختبر)',
    institutionLabel: 'المؤسسة',
    domainLabel: 'المجال العلمي',
    deadlineLabel: 'آخر أجل',
    applicantsLabel: 'عدد المترشحين',
    btnViewDetails: 'عرض البطاقة المفصلة',
    btnAddToCart: 'إضافة إلى السلة',
    btnInCart: 'ضمن اختياراتك',
    btnLimitReached: 'تم بلوغ الحد الأقصى ({max})',

    // Workflow Stepper
    workflowTitle: 'مسار المصادقة المؤسساتي',
    stepStructure: 'بنية البحث (المختبر)',
    stepCentre: 'المركز (CEDoc / الكلية)',
    stepPole: 'قطب الدراسات (الرئاسة)',
    statusValid: 'تمت المصادقة',
    statusPending: 'في انتظار التأكيد',
    statusRejected: 'غير مصادق عليه',

    // Detail Modal
    modalTitle: 'البطاقة العلمية المفصلة للموضوع',
    sectionContext: 'السياق والوصف العلمي للموضوع',
    sectionObjectives: 'الأهداف العلمية والنتائج المنتظرة',
    sectionSkills: 'الكفاءات المطلوبة والمتطلبات المسبقة',
    sectionEligibility: 'شروط الأهلية الإدارية',
    sectionSupervision: 'التأطير العلمي والمؤسسة المحتضنة',
    sectionFunding: 'نوع التمويل / المنحة',
    fundingCnrst: 'منحة التميز CNRST',
    fundingProject: 'مشروع بحث ممول (PRD/PPR)',
    fundingIndustrial: 'شراكة صناعية / أطروحة مهنية',
    fundingNone: 'تمويل ذاتي / بدون منحة',
    spotsLabel: 'المقاعد المتاحة لهذا الموضوع',
    spotsValue: '{count} مقعد/مقاعد',
    eligibleForApplication: 'هذا الموضوع مصادق عليه رسمياً من طرف القطب الجامعي ومفتوح لتلقي الترشيحات.',
    notEligibleForApplication: 'هذا الموضوع غير مفتوح حالياً أو تم إغلاق فترة الترشح الخاصة به.',
    btnClose: 'إغلاق',

    // Cart Drawer
    cartTitle: 'سلة ترشيحاتي',
    cartSubtitle: 'اختيار أولي للمواضيع قبل اعتماد الملف الرسمي',
    cartEmptyTitle: 'سلتك فارغة حالياً',
    cartEmptyDesc: 'تصفح الدليل العام وأضف حتى {max} مواضيع إلى قائمتك المفضلة.',
    cartLimitInfo: 'قاعدة الاختيار: حد أقصى {max} ترشيحات متزامنة (قيد الاعتماد النهائي من طرف الجامعة).',
    cartConfigLimit: 'تعديل الحد التجريبي :',
    btnStartApplication: 'بدء ملف الترشح',
    btnRemove: 'حذف',
    btnClearCart: 'إفراغ السلة',
    alertMaxReached: 'لقد بلغت الحد الأقصى المسموح به وهو {max} مواضيع في سلتك.',

    // Auth Prep Modal
    authModalTitle: 'تسجيل الدخول — منصة إدارة سلك الدكتوراه',
    authModalSubtitle: 'إعداد الحساب لتقديم ملف الترشيح الرسمي (المرحلة 2)',
    tabCandidate: 'فضاء المترشح',
    tabProfessor: 'فضاء الأستاذ / المقيم',
    authCandidateDesc: 'سجل دخولك لتعبئة ملفك الأكاديمي الموحد ورفع الوثائق المطلوبة.',
    authProfessorDesc: 'ولوج مخصص للأساتذة الباحثين عبر البريد المؤسساتي @usmba.ac.ma.',
    btnGoogleLogin: 'تسجيل الدخول عبر Google الأكاديمي (@usmba.ac.ma)',
    orDivider: 'أو باستخدام بيانات الاعتماد',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotPassword: 'نسيت كلمة المرور؟',
    btnLoginSubmit: 'تسجيل الدخول',
    noAccountYet: 'ليس لديك حساب مترشح بعد؟',
    btnRegisterPrompt: 'إنشاء حساب مترشح جديد',
    authPhaseNotice: 'تنبيه المرحلة 1: هذه النافذة تمهد لآلية التحقق التي ستفعل بالكامل في المرحلة 2.',

    // Footer
    footerDisclaimer: 'المنصة الرسمية لجامعة سيدي محمد بن عبد الله بفاس — تدبير سلك الدكتوراه (GCD).',
    footerLinksTitle: 'روابط مؤسساتية',
    linkUsmba: 'بوابة جامعة فاس',
    linkCedoc: 'مراكز دراسات الدكتوراه (CEDoc)',
    linkCnrst: 'بوابة المركز الوطني CNRST',
    linkGuide: 'دليل استخدام المنصة للأساتذة (PDF)',
    footerCopyright: '© {year} جامعة سيدي محمد بن عبد الله بفاس. جميع الحقوق محفوظة.',
  },
};

export function getTranslation(lang: Language, key: keyof typeof translations['fr'], vars?: Record<string, string | number>): string {
  let text = translations[lang][key] || translations['fr'][key] || String(key);
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}
