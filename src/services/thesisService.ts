/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Thesis Data Service & Cart Persistence for USMBA Doctoral Platform
 */

import { ThesisTopic, TopicFilters, CartConfig } from '../types';

// Default configuration based on debate consensus (configurable by university)
export const DEFAULT_CART_CONFIG: CartConfig = {
  maxSelectableTopics: 3,
};

const CART_STORAGE_KEY = 'usmba_gcd_cart_v1';
const CART_LIMIT_STORAGE_KEY = 'usmba_gcd_cart_limit_v1';

/**
 * Realistic demonstration dataset based on official USMBA entities and the GCD guide
 * Explicitly labeled as prototype simulation data to avoid any confusion with official postings.
 */
export const DEMO_TOPICS: ThesisTopic[] = [
  {
    id: 'usmba-topic-2024-001',
    code: 'FST-LISIA-24-01',
    title: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    titleAr: 'التعرف الضوئي على الحروف العربية بالذكاء الاصطناعي: بنى التعلم العميق لرقمنة المخطوطات التاريخية',
    scientificDescription:
      'Ce projet doctoral vise à concevoir et évaluer de nouvelles architectures de réseaux de neurones profonds (Vision Transformers et modèles hybrides CNN-RNN) capables de transcrire avec haute fidélité des manuscrits arabes anciens présentant des variations calligraphiques complexes, dégradations physiques et ligatures multiples.',
    scientificDescriptionAr:
      'يهدف هذا المشروع البحثي إلى تصميم وتقييم بنى عصبية عميقة مبتكرة لفك وترجمة المخطوطات العربية القديمة ذات الخطوط المعقدة والتشابكات الصعبة والتلف المادي.',
    academicYear: '2024/2025',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'karim.benali@usmba.ac.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: [
      'Titulaire d’un Master de recherche ou diplôme d’Ingénieur d’État en Informatique ou Data Science',
      'Mention minimale requise en Master : Assez Bien',
      'Validation sans compensation des modules d’apprentissage automatique et vision par ordinateur',
    ],
    requiredSkills: ['Python / PyTorch / TensorFlow', 'Computer Vision & OCR', 'NLP pour la langue arabe', 'Traitement d’images numériques'],
    fundingType: 'bourse_cnrst',
    spotsAvailable: 1,
    applicantsCount: 2, // As documented in guide screenshot page 17
    submissionDeadline: '2024-11-20',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: {
        name: 'Laboratoire LISIA',
        status: 'valid',
        date: '17/08/2024',
        validatedBy: 'Directeur de Laboratoire',
        comments: 'Avis très favorable. Adéquation parfaite avec l’axe IA & Patrimoine.',
      },
      centre: {
        name: 'CEDoc Sciences & Techniques',
        status: 'valid',
        date: '17/08/2024',
        validatedBy: 'Conseil du CEDoc FST',
        comments: 'Validation du quota d’accueil et des prérequis pédagogiques.',
      },
      pole: {
        name: 'Pôle Doctoral USMBA',
        status: 'valid',
        date: '28/08/2024',
        validatedBy: 'Commission Centrale de la Recherche',
        comments: 'Publication officielle autorisée pour la session 2024/2025.',
      },
    },
  },
  {
    id: 'usmba-topic-2024-002',
    code: 'FST-LISIA-24-02',
    title: 'Topic Labelling and Hierarchical Semantic Discovery in Unstructured Academic Texts',
    titleAr: 'تسمية المواضيع واستكشاف الدلالات الهرمية في النصوص الأكاديمية غير المهيكلة',
    scientificDescription:
      'Développement de modèles sémantiques non supervisés et semi-supervisés pour l’extraction automatique de thématiques de recherche à partir de corpus scientifiques pluridisciplinaires, avec application au catalogage des thèses marocaines.',
    scientificDescriptionAr:
      'تطوير نماذج دلالية غير خاضعة للإشراف للاستخراج التلقائي للمواضيع البحثية من المتون العلمية متعددة التخصصات وتصنيف الأطروحات الجامعية.',
    academicYear: '2024/2025',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Amina Berrada',
    professorTitle: 'Professeur Habilité (PH)',
    professorEmail: 'amina.berrada@usmba.ac.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: [
      'Master de recherche en Informatique, Sciences des Données ou Mathématiques Appliquées',
      'Excellente maîtrise des techniques d’indexation sémantique et des plongements de mots (embeddings)',
    ],
    requiredSkills: ['NLP & Large Language Models', 'HuggingFace, Transformers', 'Graphes de connaissances', 'Python / Scikit-learn'],
    fundingType: 'projet_recherche',
    spotsAvailable: 1,
    applicantsCount: 1,
    submissionDeadline: '2024-11-22',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: {
        name: 'Laboratoire LISIA',
        status: 'valid',
        date: '17/08/2024',
        validatedBy: 'Directeur de Laboratoire',
      },
      centre: {
        name: 'CEDoc Sciences & Techniques',
        status: 'valid',
        date: '17/08/2024',
        validatedBy: 'Conseil du CEDoc',
      },
      pole: {
        name: 'Pôle Doctoral USMBA',
        status: 'valid',
        date: '28/08/2024',
        validatedBy: 'Pôle Doctoral Central',
      },
    },
  },
  {
    id: 'usmba-topic-2024-003',
    code: 'FST-LISIA-24-03',
    title: 'Detecting Public Security Threats on Social Media: A Multimodal NLP & Graph Neural Network Approach',
    titleAr: 'رصد التهديدات الأمنية في وسائل التواصل الاجتماعي: مقاربة متعددة الوسائط بالمعالجة اللغوية والشبكات البيانية',
    scientificDescription:
      'Conception de pipelines d’analyse en temps réel combinant analyse textuelle multilingue (Darija, Arabe standard, Français) et analyse structurelle des réseaux sociaux via Graph Neural Networks pour détecter la diffusion coordonnée de désinformation.',
    scientificDescriptionAr:
      'بناء منصة تحليل فوري تجمع بين معالجة النصوص متعددة اللغات (الدارجة، الفصحى، الفرنسية) وشبكات الرسوم البيانية العصبية لرصد التضليل والمحتوى التخريبي.',
    academicYear: '2024/2025',
    domain: 'Cybersécurité & Réseaux',
    domainAr: 'الأمن السيبراني والشبكات',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'karim.benali@usmba.ac.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: [
      'Diplôme d’Ingénieur ou Master en Télécommunications, Sécurité des Systèmes ou Informatique',
      'Solides bases théoriques en théorie des graphes et apprentissage automatique',
    ],
    requiredSkills: ['Graph Neural Networks (PyG / DGL)', 'Multimodal Learning', 'Cybersécurité', 'Docker / Big Data Streaming'],
    fundingType: 'projet_recherche',
    spotsAvailable: 2,
    applicantsCount: 3,
    submissionDeadline: '2024-11-25',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LISIA', status: 'valid', date: '18/08/2024' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '19/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '29/08/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-004',
    code: 'ENSA-LSI-24-04',
    title: 'Optimisation Énergétique des Réseaux Électriques Intelligents (Smart Grids) par IA Distribuée',
    titleAr: 'التحسين الطاقي للشبكات الكهربائية الذكية باستخدام الذكاء الاصطناعي الموزع',
    scientificDescription:
      'Étude et implémentation d’algorithmes d’apprentissage par renforcement multi-agents pour la gestion dynamique des micro-réseaux intégrant des sources photovoltaïques et éoliennes dans la région Fès-Meknès.',
    scientificDescriptionAr:
      'دراسة وتطبيق خوارزميات التعلم المعزز متعدد الوكلاء للإدارة الديناميكية للشبكات الكهربائية المصغرة المعتمدة على الطاقات المتجددة بجهة فاس-مكناس.',
    academicYear: '2024/2025',
    domain: 'Sciences de l’Ingénieur & Énergie',
    domainAr: 'علوم المهندس والطاقة',
    professorName: 'Pr. Mohammed Alami',
    professorTitle: 'Professeur de l’Enseignement Supérieur',
    professorEmail: 'mohammed.alami@usmba.ac.ma',
    laboratory: 'Laboratoire d’Ingénierie, Management Industriel et Innovation (LIMII)',
    institution: 'École Nationale des Sciences Appliquées (ENSA) de Fès',
    eligibilityCriteria: [
      'Ingénieur d’État ou Master en Génie Électrique, Énergies Renouvelables ou Automatique',
      'Recommandation académique forte du directeur de stage PFE',
    ],
    requiredSkills: ['Matlab / Simulink', 'Reinforcement Learning', 'Smart Grids & Microgrids', 'Systèmes Temps Réel'],
    fundingType: 'partenariat_industriel',
    spotsAvailable: 1,
    applicantsCount: 1,
    submissionDeadline: '2024-11-20',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LIMII', status: 'valid', date: '15/08/2024' },
      centre: { name: 'CEDoc Sciences de l’Ingénieur', status: 'valid', date: '19/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '30/08/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-005',
    code: 'FS-GEO-24-05',
    title: 'Modélisation Hydrogéologique et Gestion Durable des Nappes Phréatiques du Bassin du Saïss',
    titleAr: 'النمذجة الهيدروجيولوجية والتدبير المستدام للمياه الجوفية بحوض سايس',
    scientificDescription:
      'Caractérisation spatio-temporelle de la recharge des aquifères et simulation des impacts du changement climatique sur les ressources hydriques souterraines à l’aide de couplages SIG et modèles hydrodynamiques.',
    scientificDescriptionAr:
      'التوصيف الزماني والمكاني لتغذية الفرشات المائية ومحاكاة آثار التغيرات المناخية على الموارد المائية الجوفية بحوض سايس.',
    academicYear: '2024/2025',
    domain: 'Géosciences & Environnement',
    domainAr: 'علوم الأرض والبيئة',
    professorName: 'Pr. Fatima Zahra Chraibi',
    professorTitle: 'Professeur de l’Enseignement Supérieur',
    professorEmail: 'fz.chraibi@usmba.ac.ma',
    laboratory: 'Laboratoire Géorisques, Environnement et Développement Durable',
    institution: 'Faculté des Sciences Dhar El Mahraz (FSDM) de Fès',
    eligibilityCriteria: [
      'Master en Géosciences, Hydrologie ou Gestion de l’Environnement',
      'Aptitude avérée aux travaux de terrain et à la modélisation géoscientifique',
    ],
    requiredSkills: ['Modflow / HydroGeoSphere', 'ArcGIS / QGIS', 'Télédétection spatiale', 'Statistiques environnementales'],
    fundingType: 'bourse_cnrst',
    spotsAvailable: 2,
    applicantsCount: 4,
    submissionDeadline: '2024-11-28',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Géorisques', status: 'valid', date: '16/08/2024' },
      centre: { name: 'CEDoc Sciences Exactes et Naturelles', status: 'valid', date: '21/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '01/09/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-006',
    code: 'FSJES-ECO-24-06',
    title: 'Impact de la Digitalisation Bancaire et de la FinTech sur l’Inclusion Financière au Maroc',
    titleAr: 'أثر الرقمنة البنكية والتكنولوجيا المالية على الشمول المالي في المغرب',
    scientificDescription:
      'Analyse économétrique des déterminants de l’adoption des services financiers numériques auprès des TPME et des ménages ruraux, et évaluation des réformes réglementaires de Bank Al-Maghrib.',
    scientificDescriptionAr:
      'تحليل قياسي لمحددات تبني الخدمات المالية الرقمية لدى المقاولات الصغرى والمتوسطة والأسر القروية في المغرب.',
    academicYear: '2024/2025',
    domain: 'Économie & Gestion',
    domainAr: 'الاقتصاد والتدبير',
    professorName: 'Pr. Hassan Idrissi',
    professorTitle: 'Professeur Habilité',
    professorEmail: 'hassan.idrissi@usmba.ac.ma',
    laboratory: 'Laboratoire de Recherche en Économie Appliquée et Gouvernance (LREAG)',
    institution: 'Faculté des Sciences Juridiques, Économiques et Sociales (FSJES) de Fès',
    eligibilityCriteria: [
      'Master en Économie Appliquée, Finance ou Économétrie',
      'Solide maîtrise des logiciels d’analyse de données de panel (Stata, R ou EViews)',
    ],
    requiredSkills: ['Économétrie appliquée', 'Stata / R', 'Enquêtes quantitatives', 'FinTech & Régulation bancaire'],
    fundingType: 'non_remunere',
    spotsAvailable: 2,
    applicantsCount: 2,
    submissionDeadline: '2024-11-30',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LREAG', status: 'valid', date: '14/08/2024' },
      centre: { name: 'CEDoc Droit, Économie et Gestion', status: 'valid', date: '22/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '02/09/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-007',
    code: 'FLSH-LIT-24-07',
    title: 'Patrimoine Manuscrit de la Médina de Fès : Conservation Numérique et Analyse Philologique',
    titleAr: 'التراث المخطوط بمدينة فاس القديمة: الحفظ الرقمي والتحليل الفيلولوجي',
    scientificDescription:
      'Inventaire raisonné, étude codicologique et édition critique de manuscrits inédits conservés dans les bibliothèques traditionnelles de Fès, avec proposition d’un corpus numérique interrogeable.',
    scientificDescriptionAr:
      'فهرسة وتحقيق نقدي لمخطوطات نادرة محفوظة في الخزانات التراثية بفاس، مع اقتراح منصة رقمية مفهرسة للباحثين.',
    academicYear: '2024/2025',
    domain: 'Lettres, Histoire & Patrimoine',
    domainAr: 'الآداب والتاريخ والتراث',
    professorName: 'Pr. Malika Touimi',
    professorTitle: 'Professeur de l’Enseignement Supérieur',
    professorEmail: 'malika.touimi@usmba.ac.ma',
    laboratory: 'Laboratoire d’Histoire, Patrimoine et Culture de l’Occident Musulman',
    institution: 'Faculté des Lettres et des Sciences Humaines Dhar El Mahraz (FLSH)',
    eligibilityCriteria: [
      'Master en Littérature Arabe, Histoire Médiévale ou Patrimoine Islamique',
      'Maîtrise de la paléographie maghrébine traditionnelle',
    ],
    requiredSkills: ['Paléographie & Codicologie', 'Édition critique de textes', 'Humanités Numériques', 'Arabe classique'],
    fundingType: 'bourse_cnrst',
    spotsAvailable: 1,
    applicantsCount: 3,
    submissionDeadline: '2024-11-24',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Histoire & Patrimoine', status: 'valid', date: '12/08/2024' },
      centre: { name: 'CEDoc Lettres et Sciences Humaines', status: 'valid', date: '20/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '31/08/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-008',
    code: 'FST-BIO-24-08',
    title: 'Valorisation Biotechnologique des Sous-produits Oléicoles (Margines et Grignons) de la Région Fès-Meknès',
    titleAr: 'التثمين التكنولوجي الحيوي للمخلفات الزيتونية (المرجان والفيتور) بجهة فاس-مكناس',
    scientificDescription:
      'Extraction de polyphénols antioxydants et bioconversion anaérobie des déchets de l’industrie oléicole pour la production combinée de biogaz et de biofertilisants à haute valeur agronomique.',
    scientificDescriptionAr:
      'استخلاص مضادات الأكسدة والتحويل الحيوي اللاهوائي لمخلفات عصر الزيتون لإنتاج الغاز الحيوي والأسمدة العضوية.',
    academicYear: '2024/2025',
    domain: 'Biotechnologie & Agro-ressources',
    domainAr: 'التكنولوجيا الحيوية والموارد الزراعية',
    professorName: 'Pr. Younes Filali',
    professorTitle: 'Professeur de l’Enseignement Supérieur',
    professorEmail: 'younes.filali@usmba.ac.ma',
    laboratory: 'Laboratoire de Biotechnologie Microbienne et Valorisation des Bioressources',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: [
      'Master en Biotechnologie, Biochimie, Bioprocédés ou Microbiologie Appliquée',
      'Expérience confirmée des techniques chromatographiques (HPLC/GC-MS) et des bioréacteurs',
    ],
    requiredSkills: ['Analyses chromatographiques (HPLC)', 'Fermentation microbienne', 'Bioprocédés environnementaux', 'Statistiques de laboratoire'],
    fundingType: 'projet_recherche',
    spotsAvailable: 1,
    applicantsCount: 2,
    submissionDeadline: '2024-11-26',
    status: 'open',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Bioressources', status: 'valid', date: '19/08/2024' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '24/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '03/09/2024' },
    },
  },
  {
    id: 'usmba-topic-2024-009',
    code: 'FST-LISIA-24-09',
    title: 'Sujet Prototype 30-08 : Diagnostic Prédictif des Éoliennes Offshore par Réseaux de Capteurs IoT',
    titleAr: 'موضوع تجريبي 30-08: التشخيص التنبئي لعنفات الرياح البحرية عبر شبكات إنترنت الأشياء',
    scientificDescription:
      'Ce sujet est actuellement en phase finale d’arbitrage par la commission centrale du Pôle Doctoral. Il n’accepte pas encore de candidatures publiques.',
    scientificDescriptionAr:
      'هذا الموضوع قيد المراجعة النهائية من طرف لجنة القطب الجامعي ولا يقبل الترشيحات حالياً.',
    academicYear: '2024/2025',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'karim.benali@usmba.ac.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: ['Master ou diplôme d’ingénieur'],
    requiredSkills: ['IoT', 'Edge Computing', 'Predictive Maintenance'],
    fundingType: 'projet_recherche',
    spotsAvailable: 1,
    applicantsCount: 1,
    submissionDeadline: '2024-12-15',
    status: 'under_review', // Demonstrates non-published state
    isOfficialPublication: false, // Cannot be applied to yet
    workflow: {
      structure: { name: 'Laboratoire LISIA', status: 'valid', date: '17/08/2024' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '17/08/2024' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'pending', comments: 'En attente de confirmation budgétaire' },
    },
  },
];

/**
 * Cart management with local storage persistence
 */
export const CartService = {
  getCartTopics(): string[] {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCartTopics(topicIds: string[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(topicIds));
    } catch (e) {
      console.warn('Unable to persist cart to localStorage', e);
    }
  },

  addTopic(topicId: string, maxLimit = DEFAULT_CART_CONFIG.maxSelectableTopics): { success: boolean; reason?: 'max_reached' | 'already_in_cart' } {
    const current = this.getCartTopics();
    if (current.includes(topicId)) {
      return { success: false, reason: 'already_in_cart' };
    }
    if (current.length >= maxLimit) {
      return { success: false, reason: 'max_reached' };
    }
    const updated = [...current, topicId];
    this.saveCartTopics(updated);
    return { success: true };
  },

  removeTopic(topicId: string): void {
    const current = this.getCartTopics();
    const updated = current.filter((id) => id !== topicId);
    this.saveCartTopics(updated);
  },

  clearCart(): void {
    localStorage.removeItem(CART_STORAGE_KEY);
  },

  getMaxLimit(): number {
    try {
      const stored = localStorage.getItem(CART_LIMIT_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 1 && val <= 10) return val;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CART_CONFIG.maxSelectableTopics;
  },

  setMaxLimit(newLimit: number): void {
    try {
      localStorage.setItem(CART_LIMIT_STORAGE_KEY, String(newLimit));
    } catch (e) {
      console.warn('Failed to set cart limit', e);
    }
  },
};

/**
 * Filter & search engine for the thesis catalog
 */
export function filterAndSortTopics(topics: ThesisTopic[], filters: TopicFilters): ThesisTopic[] {
  return topics
    .filter((topic) => {
      // 1. Search text query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesTitle = topic.title.toLowerCase().includes(q) || (topic.titleAr && topic.titleAr.includes(q));
        const matchesDesc = topic.scientificDescription.toLowerCase().includes(q) || (topic.scientificDescriptionAr && topic.scientificDescriptionAr.includes(q));
        const matchesProf = topic.professorName.toLowerCase().includes(q);
        const matchesLab = topic.laboratory.toLowerCase().includes(q);
        const matchesDomain = topic.domain.toLowerCase().includes(q) || (topic.domainAr && topic.domainAr.includes(q));
        const matchesSkills = topic.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesProf && !matchesLab && !matchesDomain && !matchesSkills) {
          return false;
        }
      }

      // 2. Institution filter
      if (filters.institution && topic.institution !== filters.institution) {
        return false;
      }

      // 3. Laboratory filter
      if (filters.laboratory && topic.laboratory !== filters.laboratory) {
        return false;
      }

      // 4. Domain filter
      if (filters.domain && topic.domain !== filters.domain) {
        return false;
      }

      // 5. Academic Year filter
      if (filters.academicYear && topic.academicYear !== filters.academicYear) {
        return false;
      }

      // 6. Professor filter
      if (filters.professor && topic.professorName !== filters.professor) {
        return false;
      }

      // 7. Only Open filter
      if (filters.onlyOpen && topic.status !== 'open') {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'deadline':
          return new Date(a.submissionDeadline).getTime() - new Date(b.submissionDeadline).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'applicants':
          return b.applicantsCount - a.applicantsCount;
        case 'newest':
        default:
          return b.id.localeCompare(a.id);
      }
    });
}

import { CandidateApplication, ApplicationDocument, ScientificOpinion } from '../types';
import { NotificationService } from './notificationService';

const APPLICATIONS_STORAGE_KEY = 'usmba_applications_v1';

export const DEMO_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'app-2024-001',
    topicId: 'usmba-topic-2024-001',
    topicCode: 'FST-LISIA-24-01',
    topicTitle: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    candidateName: 'Youssef El Amrani',
    candidateEmail: 'youssef.elamrani@etu.usmba.ac.ma',
    candidatePhone: '+212 661 234 567',
    cne: 'N138294012',
    cin: 'CD718293',
    masterDegree: 'Master Recherche en Informatique et Systèmes Intelligents',
    masterUniversity: 'Faculté des Sciences et Techniques (FST) de Fès',
    masterGrade: 16.20,
    masterMention: 'Très Bien',
    pfeTitle: 'Segmentation et transcription de textes arabes manuscrits par réseaux CNN-LSTM',
    submissionDate: '2024-10-18',
    status: 'pending_review',
    documents: [
      { id: 'doc-1', name: 'Curriculum Vitae académique', category: 'cv', fileName: 'CV_Youssef_ElAmrani.pdf', fileSize: '1.2 Mo', status: 'valid' },
      { id: 'doc-2', name: 'Diplôme de Master (ou Attestation de réussite)', category: 'master_diploma', fileName: 'Attestation_Master_FST.pdf', fileSize: '2.1 Mo', status: 'valid' },
      { id: 'doc-3', name: 'Relevés de notes semestriels (S1 à S4)', category: 'transcripts', fileName: 'Releves_Notes_S1_S4.pdf', fileSize: '3.4 Mo', status: 'valid' },
      { id: 'doc-4', name: 'Mémoire de Projet de Fin d’Études (PFE)', category: 'pfe_thesis', fileName: 'Memoire_PFE_ElAmrani.pdf', fileSize: '4.8 Mo', status: 'valid' },
      { id: 'doc-5', name: 'Carte Nationale d’Identité (CIN)', category: 'cin', fileName: 'CNIE_Recto_Verso.pdf', fileSize: '850 Ko', status: 'valid' },
    ],
    history: [
      { id: 'h-1', date: '18/10/2024 14:32', action: 'Dossier soumis par le candidat', author: 'Youssef El Amrani' },
      { id: 'h-2', date: '19/10/2024 10:15', action: 'Contrôle de recevabilité administrative validé', author: 'CEDoc Sciences & Techniques' },
    ],
  },
  {
    id: 'app-2024-002',
    topicId: 'usmba-topic-2024-001',
    topicCode: 'FST-LISIA-24-01',
    topicTitle: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    candidateName: 'Salma Bennani',
    candidateEmail: 'salma.bennani@gmail.com',
    candidatePhone: '+212 672 889 123',
    cne: 'M142095112',
    cin: 'D901234',
    masterDegree: 'Diplôme d’Ingénieur d’État en Génie Logiciel',
    masterUniversity: 'École Mohammadia d’Ingénieurs (EMI) — Rabat',
    masterGrade: 15.40,
    masterMention: 'Bien',
    pfeTitle: 'Reconnaissance optique de caractères sur documents scannés dégradés',
    submissionDate: '2024-10-19',
    status: 'correction_requested',
    correctionMessage: 'Le relevé de notes du Semestre 3 est incomplet (page verso manquante avec le cachet officiel du doyen).',
    documents: [
      { id: 'doc-21', name: 'Curriculum Vitae', category: 'cv', fileName: 'CV_Bennani.pdf', fileSize: '980 Ko', status: 'valid' },
      { id: 'doc-22', name: 'Diplôme d’Ingénieur', category: 'master_diploma', fileName: 'Diplome_EMI.pdf', fileSize: '1.9 Mo', status: 'valid' },
      { id: 'doc-23', name: 'Relevés de notes S1 à S4', category: 'transcripts', fileName: 'Releves_Notes_S1_S4.pdf', fileSize: '2.5 Mo', status: 'needs_correction', note: 'Page verso manquante' },
      { id: 'doc-24', name: 'Mémoire de PFE', category: 'pfe_thesis', fileName: 'Rapport_PFE_Salma.pdf', fileSize: '4.2 Mo', status: 'valid' },
      { id: 'doc-25', name: 'CIN', category: 'cin', fileName: 'CIN.pdf', fileSize: '700 Ko', status: 'valid' },
    ],
    history: [
      { id: 'h-21', date: '19/10/2024 16:10', action: 'Dossier soumis par le candidat', author: 'Salma Bennani' },
      { id: 'h-22', date: '21/10/2024 09:30', action: 'Demande de correction émise : relevé S3 incomplet', author: 'Pr. Karim Benali' },
    ],
  },
  {
    id: 'app-2024-003',
    topicId: 'usmba-topic-2024-003',
    topicCode: 'FST-LISIA-24-03',
    topicTitle: 'Detecting Public Security Threats on Social Media: A Multimodal NLP & Graph Neural Network Approach',
    candidateName: 'Mehdi Chraibi',
    candidateEmail: 'mehdi.chraibi@usmba.ac.ma',
    candidatePhone: '+212 663 456 789',
    cne: 'N134098221',
    cin: 'CD543210',
    masterDegree: 'Master Traitement Automatique du Langage et Vision',
    masterUniversity: 'Faculté des Sciences Dhar El Mahraz (FSDM) de Fès',
    masterGrade: 14.85,
    masterMention: 'Assez Bien',
    pfeTitle: 'Détection de discours haineux sur Twitter à l’aide de transformers multilingues',
    submissionDate: '2024-10-21',
    status: 'pending_review',
    documents: [
      { id: 'doc-31', name: 'CV académique', category: 'cv', fileName: 'CV_Chraibi.pdf', fileSize: '1.1 Mo', status: 'valid' },
      { id: 'doc-32', name: 'Diplôme de Master', category: 'master_diploma', fileName: 'Diplome_FSDM.pdf', fileSize: '1.8 Mo', status: 'valid' },
      { id: 'doc-33', name: 'Relevés de notes', category: 'transcripts', fileName: 'Releves.pdf', fileSize: '3.1 Mo', status: 'valid' },
      { id: 'doc-34', name: 'Rapport PFE', category: 'pfe_thesis', fileName: 'PFE_Mehdi.pdf', fileSize: '5.2 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-31', date: '21/10/2024 11:20', action: 'Dossier soumis par le candidat', author: 'Mehdi Chraibi' },
    ],
  },
  {
    id: 'app-2024-004',
    topicId: 'usmba-topic-2024-003',
    topicCode: 'FST-LISIA-24-03',
    topicTitle: 'Detecting Public Security Threats on Social Media: A Multimodal NLP & Graph Neural Network Approach',
    candidateName: 'Omar Kettani',
    candidateEmail: 'omar.kettani@gmail.com',
    candidatePhone: '+212 654 321 098',
    cne: 'R130198442',
    cin: 'BK889900',
    masterDegree: 'Master en Informatique Appliquée',
    masterUniversity: 'Université Mohammed V de Rabat',
    masterGrade: 13.90,
    masterMention: 'Passable',
    pfeTitle: 'Création d’un tableau de bord de veille sur les réseaux sociaux',
    submissionDate: '2024-10-17',
    status: 'rejected',
    rejectionReason: 'Profil académique insuffisant dans les prérequis méthodologiques en réseaux de neurones profonds (GNN).',
    decisionDate: '2024-10-24',
    decisionBy: 'Pr. Karim Benali',
    documents: [
      { id: 'doc-41', name: 'CV', category: 'cv', fileName: 'CV_Kettani.pdf', fileSize: '800 Ko', status: 'valid' },
      { id: 'doc-42', name: 'Diplôme', category: 'master_diploma', fileName: 'Master_UM5.pdf', fileSize: '2.0 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-41', date: '17/10/2024 18:00', action: 'Dossier soumis par le candidat', author: 'Omar Kettani' },
      { id: 'h-42', date: '24/10/2024 15:45', action: 'Dossier non retenu — motif notifié', author: 'Pr. Karim Benali', note: 'Prérequis GNN non satisfaits' },
    ],
  },
  {
    id: 'app-2024-005',
    topicId: 'usmba-topic-2024-002',
    topicCode: 'FST-LISIA-24-02',
    topicTitle: 'Topic Labelling and Hierarchical Semantic Discovery in Unstructured Academic Texts',
    candidateName: 'Nouhaila Tazi',
    candidateEmail: 'nouhaila.tazi@etu.usmba.ac.ma',
    candidatePhone: '+212 660 112 233',
    cne: 'N139044123',
    cin: 'CD654987',
    masterDegree: 'Master Data Science & Systèmes Intelligents',
    masterUniversity: 'Faculté des Sciences et Techniques (FST) de Fès',
    masterGrade: 16.70,
    masterMention: 'Très Bien',
    pfeTitle: 'Extraction sémantique et catégorisation thématique de corpus multilingues',
    submissionDate: '2024-10-16',
    status: 'accepted',
    decisionDate: '2024-10-25',
    decisionBy: 'Pr. Amina Berrada',
    documents: [
      { id: 'doc-51', name: 'CV détaillé', category: 'cv', fileName: 'CV_Nouhaila_Tazi.pdf', fileSize: '1.4 Mo', status: 'valid' },
      { id: 'doc-52', name: 'Diplôme Master FST', category: 'master_diploma', fileName: 'Master_Tazi.pdf', fileSize: '1.9 Mo', status: 'valid' },
      { id: 'doc-53', name: 'Relevés de notes officiels', category: 'transcripts', fileName: 'Releves_Tazi.pdf', fileSize: '3.0 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-51', date: '16/10/2024 10:00', action: 'Dossier soumis par le candidat', author: 'Nouhaila Tazi' },
      { id: 'h-52', date: '25/10/2024 17:30', action: 'Candidature retenue sur Liste Principale', author: 'Pr. Amina Berrada' },
    ],
    physicalReception: {
      received: true,
      date: '2024-10-27 10:15',
      agentName: 'M. Rachid Bennani (Agent CEDoc)',
      verifiedOriginals: ['Baccalauréat original', 'Diplôme de Master original', 'Relevés de notes certifiés'],
    },
  },
];

export const ApplicationService = {
  getApplications(): CandidateApplication[] {
    try {
      const data = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return DEMO_APPLICATIONS;
  },

  saveApplications(apps: CandidateApplication[]): void {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.warn('Unable to persist applications to localStorage', e);
    }
  },

  getApplicationsByProfessor(profName: string): CandidateApplication[] {
    const all = this.getApplications();
    const profTopics = DEMO_TOPICS.filter((t) => t.professorName === profName).map((t) => t.id);
    return all.filter((app) => profTopics.includes(app.topicId));
  },

  updateStatus(
    appId: string, 
    newStatus: CandidateApplication['status'], 
    payload: { reason?: string; correctionMessage?: string; waitlistRank?: number; author: string }
  ): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    const updated: CandidateApplication = {
      ...current,
      status: newStatus,
      decisionDate: new Date().toISOString().split('T')[0],
      decisionBy: payload.author,
      correctionMessage: newStatus === 'correction_requested' ? payload.correctionMessage : current.correctionMessage,
      rejectionReason: newStatus === 'rejected' ? payload.reason : undefined,
      waitlistRank: newStatus === 'waitlisted' ? payload.waitlistRank : undefined,
      history: [
        ...current.history,
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleString('fr-FR'),
          action: 
            newStatus === 'accepted' ? 'Candidat admis sur Liste Principale' :
            newStatus === 'waitlisted' ? `Candidat placé sur Liste d’Attente (Rang ${payload.waitlistRank || 1})` :
            newStatus === 'rejected' ? `Candidat non retenu : ${payload.reason || ''}` :
            newStatus === 'correction_requested' ? `Demande de correction émise : ${payload.correctionMessage || ''}` :
            'Statut réinitialisé en cours d’examen',
          author: payload.author,
          note: payload.reason || payload.correctionMessage,
        },
      ],
    };

    apps[index] = updated;
    this.saveApplications(apps);

    // Send internal system notification to candidate
    try {
      const statusFr = 
        newStatus === 'accepted' ? 'Félicitations : vous êtes admis sur la Liste Principale' :
        newStatus === 'waitlisted' ? `Vous êtes classé sur la Liste d’Attente (Rang ${payload.waitlistRank || 1})` :
        newStatus === 'rejected' ? 'Décision de la commission : candidature non retenue' :
        newStatus === 'correction_requested' ? 'Une correction de document est demandée sur votre dossier' :
        'Mise à jour du statut de votre candidature';

      NotificationService.createNotification({
        recipientEmail: current.candidateEmail,
        recipientRole: 'candidate',
        title: `Mise à jour de votre dossier (${current.topicCode})`,
        titleAr: `تحديث في ملف الترشيح (${current.topicCode})`,
        message: statusFr + (payload.reason ? ` : ${payload.reason}` : payload.correctionMessage ? ` : ${payload.correctionMessage}` : ''),
        type: newStatus === 'correction_requested' ? 'correction' : 'decision',
        relatedApplicationId: current.id,
        relatedTopicId: current.topicId,
      });
    } catch (e) {
      console.warn('Failed to dispatch notification', e);
    }

    return updated;
  },

  markPhysicalReception(
    appId: string,
    agentName: string,
    verifiedOriginals: string[]
  ): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    const updated: CandidateApplication = {
      ...current,
      physicalReception: {
        received: true,
        date: new Date().toLocaleString('fr-FR'),
        agentName,
        verifiedOriginals,
      },
      history: [
        ...current.history,
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleString('fr-FR'),
          action: 'Dossier physique vérifié et réceptionné au guichet CEDoc',
          author: agentName,
          note: `Originaux contrôlés : ${verifiedOriginals.join(', ')}`,
        },
      ],
    };

    apps[index] = updated;
    this.saveApplications(apps);
    return updated;
  },

  /**
   * Save or update draft application
   */
  saveDraft(draft: CandidateApplication): void {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === draft.id);
    if (index >= 0) {
      apps[index] = draft;
    } else {
      apps.unshift(draft);
    }
    this.saveApplications(apps);
  },

  /**
   * Officially submit application
   */
  submitApplication(app: CandidateApplication): void {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === app.id);
    const finalApp = { ...app, isDraft: false, status: 'pending_review' as const };
    if (index >= 0) {
      apps[index] = finalApp;
    } else {
      apps.unshift(finalApp);
    }
    this.saveApplications(apps);

    try {
      // Find topic to identify professor
      const targetTopic = DEMO_TOPICS.find((t) => t.id === app.topicId);
      
      // Notify candidate
      NotificationService.createNotification({
        recipientEmail: app.candidateEmail,
        recipientRole: 'candidate',
        title: `Candidature transmise avec succès (${app.topicCode})`,
        titleAr: `تم إرسال الترشيح بنجاح (${app.topicCode})`,
        message: `Votre dossier pour le sujet "${app.topicTitle}" a été reçu et transmis pour examen académique.`,
        type: 'submission',
        relatedApplicationId: app.id,
        relatedTopicId: app.topicId,
      });

      // Notify supervisor if professor email is known
      if (targetTopic?.professorEmail) {
        NotificationService.createNotification({
          recipientEmail: targetTopic.professorEmail,
          recipientRole: 'professor',
          title: `Nouvelle candidature reçue (${app.topicCode})`,
          titleAr: `طلب ترشيح جديد (${app.topicCode})`,
          message: `${app.candidateName} (${app.masterDegree}, ${app.masterGrade}/20) a postulé à votre sujet.`,
          type: 'submission',
          relatedApplicationId: app.id,
          relatedTopicId: app.topicId,
        });
      }
    } catch (e) {
      console.warn('Failed to dispatch submission notification', e);
    }
  },

  /**
   * Replace a specific document (e.g. following a correction request)
   */
  replaceDocument(appId: string, updatedDoc: ApplicationDocument): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    const updatedDocs = current.documents.map((d) => 
      d.category === updatedDoc.category ? { ...updatedDoc, status: 'valid' as const } : d
    );

    // If no more documents need correction, transition status back to 'pending_review'
    const hasRemainingCorrections = updatedDocs.some((d) => d.status === 'needs_correction');

    const updated: CandidateApplication = {
      ...current,
      documents: updatedDocs,
      status: hasRemainingCorrections ? 'correction_requested' : 'pending_review',
      correctionMessage: hasRemainingCorrections ? current.correctionMessage : undefined,
      history: [
        ...current.history,
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleString('fr-FR'),
          action: `Pièce corrigée et ré-uploadée : ${updatedDoc.name}`,
          author: current.candidateName,
        },
      ],
    };

    apps[index] = updated;
    this.saveApplications(apps);
    return updated;
  },

  /**
   * Author (Professor or Admin) requests correction on a specific document
   */
  requestDocumentCorrection(
    appId: string,
    category: string,
    note: string,
    author: string
  ): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    const updatedDocs = current.documents.map((d) => 
      d.category === category ? { ...d, status: 'needs_correction' as const, note } : d
    );

    const updated: CandidateApplication = {
      ...current,
      documents: updatedDocs,
      status: 'correction_requested',
      correctionMessage: note,
      history: [
        ...current.history,
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleString('fr-FR'),
          action: `Demande de correction sur la pièce "${category}" : ${note}`,
          author,
          note,
        },
      ],
    };

    apps[index] = updated;
    this.saveApplications(apps);

    try {
      NotificationService.createNotification({
        recipientEmail: current.candidateEmail,
        recipientRole: 'candidate',
        title: `Action requise : correction de pièce (${category})`,
        titleAr: `إجراء مطلوب : تصحيح وثيقة (${category})`,
        message: `L'encadrant a demandé une correction : ${note}`,
        type: 'correction',
        relatedApplicationId: current.id,
        relatedTopicId: current.topicId,
      });
    } catch (e) {
      console.warn('Failed to dispatch notification', e);
    }

    return updated;
  },

  /**
   * Save supervisor's scientific opinion (Avis scientifique)
   * Distinct from the administrative decision
   */
  saveScientificOpinion(appId: string, opinion: ScientificOpinion): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    const recLabels = {
      favorable: 'Favorable',
      defavorable: 'Défavorable',
      reserve: 'Réservé',
    };

    const updated: CandidateApplication = {
      ...current,
      scientificOpinion: opinion,
      history: [
        ...current.history,
        {
          id: `h-${Date.now()}`,
          date: new Date().toLocaleString('fr-FR'),
          action: `Avis scientifique émis : Avis ${recLabels[opinion.recommendation]}${opinion.score ? ` (Note: ${opinion.score}/20)` : ''}`,
          author: opinion.evaluatorName,
          note: opinion.academicAppraisal,
        },
      ],
    };

    apps[index] = updated;
    this.saveApplications(apps);
    return updated;
  },
};

