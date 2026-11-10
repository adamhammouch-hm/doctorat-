/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Thesis Data Service & Cart Persistence for USMBA Doctoral Platform
 */

import { ThesisTopic, TopicFilters, CartConfig } from '../types';
import { V5_KEYS } from './dataMigrationService';
import { LocalFileStorage } from './localFileStorage';
import { getCurrentAcademicYear } from './dateUtils';

// USMBA rule: maximum 3 doctoral applications per candidate and per session
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
    id: 'usmba-topic-2026-001',
    code: 'FST-LISIA-26-01',
    title: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    titleAr: 'التعرف الضوئي على الحروف العربية بالذكاء الاصطناعي: بنى التعلم العميق لرقمنة المخطوطات التاريخية',
    scientificDescription:
      'Ce projet doctoral vise à concevoir et évaluer de nouvelles architectures de réseaux de neurones profonds (Vision Transformers et modèles hybrides CNN-RNN) capables de transcrire avec haute fidélité des manuscrits arabes anciens présentant des variations calligraphiques complexes, dégradations physiques et ligatures multiples.',
    scientificDescriptionAr:
      'يهدف هذا المشروع البحثي إلى تصميم وتقييم بنى عصبية عميقة مبتكرة لفك وترجمة المخطوطات العربية القديمة ذات الخطوط المعقدة والتشابكات الصعبة والتلف المادي.',
    academicYear: '2026/2027',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'directeur.these.test@usmba.ma',
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
    submissionDeadline: '2026-11-20',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    electronicSignature: {
      signerName: 'Pr. Mostafa Bennani',
      signerEmail: 'directeur.structure.test@usmba.ma',
      signerRole: 'Directeur du CEDoc Sciences & Technologies',
      signedAt: '28/08/2026 11:42',
      signatureFingerprint: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      comments: 'Sujet doctoral validé et signé pour la session académique 2026/2027.',
    },
    workflow: {
      structure: {
        name: 'Laboratoire LISIA',
        status: 'valid',
        date: '17/08/2026',
        validatedBy: 'Directeur de Laboratoire',
        comments: 'Avis très favorable. Adéquation parfaite avec l’axe IA & Patrimoine.',
      },
      centre: {
        name: 'CEDoc Sciences & Techniques',
        status: 'valid',
        date: '17/08/2026',
        validatedBy: 'Conseil du CEDoc FST',
        comments: 'Validation du quota d’accueil et des prérequis pédagogiques.',
      },
      pole: {
        name: 'Pôle Doctoral USMBA',
        status: 'valid',
        date: '28/08/2026',
        validatedBy: 'Commission Centrale de la Recherche',
        comments: 'Publication officielle autorisée pour la session 2026/2027.',
      },
    },
  },
  {
    id: 'usmba-topic-2026-002',
    code: 'FST-LISIA-26-02',
    title: 'Topic Labelling and Hierarchical Semantic Discovery in Unstructured Academic Texts',
    titleAr: 'تسمية المواضيع واستكشاف الدلالات الهرمية في النصوص الأكاديمية غير المهيكلة',
    scientificDescription:
      'Développement de modèles sémantiques non supervisés et semi-supervisés pour l’extraction automatique de thématiques de recherche à partir de corpus scientifiques pluridisciplinaires, avec application au catalogage des thèses marocaines.',
    scientificDescriptionAr:
      'تطوير نماذج دلالية غير خاضعة للإشراف للاستخراج التلقائي للمواضيع البحثية من المتون العلمية متعددة التخصصات وتصنيف الأطروحات الجامعية.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-22',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: {
        name: 'Laboratoire LISIA',
        status: 'valid',
        date: '17/08/2026',
        validatedBy: 'Directeur de Laboratoire',
      },
      centre: {
        name: 'CEDoc Sciences & Techniques',
        status: 'valid',
        date: '17/08/2026',
        validatedBy: 'Conseil du CEDoc',
      },
      pole: {
        name: 'Pôle Doctoral USMBA',
        status: 'valid',
        date: '28/08/2026',
        validatedBy: 'Pôle Doctoral Central',
      },
    },
  },
  {
    id: 'usmba-topic-2026-003',
    code: 'FST-LISIA-26-03',
    title: 'Detecting Public Security Threats on Social Media: A Multimodal NLP & Graph Neural Network Approach',
    titleAr: 'رصد التهديدات الأمنية في وسائل التواصل الاجتماعي: مقاربة متعددة الوسائط بالمعالجة اللغوية والشبكات البيانية',
    scientificDescription:
      'Conception de pipelines d’analyse en temps réel combinant analyse textuelle multilingue (Darija, Arabe standard, Français) et analyse structurelle des réseaux sociaux via Graph Neural Networks pour détecter la diffusion coordonnée de désinformation.',
    scientificDescriptionAr:
      'بناء منصة تحليل فوري تجمع بين معالجة النصوص متعددة اللغات (الدارجة، الفصحى، الفرنسية) وشبكات الرسوم البيانية العصبية لرصد التضليل والمحتوى التخريبي.',
    academicYear: '2026/2027',
    domain: 'Cybersécurité & Réseaux',
    domainAr: 'الأمن السيبراني والشبكات',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'directeur.these.test@usmba.ma',
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
    submissionDeadline: '2026-11-25',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LISIA', status: 'valid', date: '18/08/2026' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '19/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '29/08/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-004',
    code: 'ENSA-LIMII-26-04',
    title: 'Optimisation Énergétique des Réseaux Électriques Intelligents (Smart Grids) par IA Distribuée',
    titleAr: 'التحسين الطاقي للشبكات الكهربائية الذكية باستخدام الذكاء الاصطناعي الموزع',
    scientificDescription:
      'Étude et implémentation d’algorithmes d’apprentissage par renforcement multi-agents pour la gestion dynamique des micro-réseaux intégrant des sources photovoltaïques et éoliennes dans la région Fès-Meknès.',
    scientificDescriptionAr:
      'دراسة وتطبيق خوارزميات التعلم المعزز متعدد الوكلاء للإدارة الديناميكية للشبكات الكهربائية المصغرة المعتمدة على الطاقات المتجددة بجهة فاس-مكناس.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-20',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LIMII', status: 'valid', date: '15/08/2026' },
      centre: { name: 'CEDoc Sciences de l’Ingénieur', status: 'valid', date: '19/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '30/08/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-005',
    code: 'FS-GEO-26-05',
    title: 'Modélisation Hydrogéologique et Gestion Durable des Nappes Phréatiques du Bassin du Saïss',
    titleAr: 'النمذجة الهيدروجيولوجية والتدبير المستدام للمياه الجوفية بحوض سايس',
    scientificDescription:
      'Caractérisation spatio-temporelle de la recharge des aquifères et simulation des impacts du changement climatique sur les ressources hydriques souterraines à l’aide de couplages SIG et modèles hydrodynamiques.',
    scientificDescriptionAr:
      'التوصيف الزماني والمكاني لتغذية الفرشات المائية ومحاكاة آثار التغيرات المناخية على الموارد المائية الجوفية بحوض سايس.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-28',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Géorisques', status: 'valid', date: '16/08/2026' },
      centre: { name: 'CEDoc Sciences Exactes et Naturelles', status: 'valid', date: '21/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '01/09/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-006',
    code: 'FSJES-ECO-26-06',
    title: 'Impact de la Digitalisation Bancaire et de la FinTech sur l’Inclusion Financière au Maroc',
    titleAr: 'أثر الرقمنة البنكية والتكنولوجيا المالية على الشمول المالي في المغرب',
    scientificDescription:
      'Analyse économétrique des déterminants de l’adoption des services financiers numériques auprès des TPME et des ménages ruraux, et évaluation des réformes réglementaires de Bank Al-Maghrib.',
    scientificDescriptionAr:
      'تحليل قياسي لمحددات تبني الخدمات المالية الرقمية لدى المقاولات الصغرى والمتوسطة والأسر القروية في المغرب.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-30',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire LREAG', status: 'valid', date: '14/08/2026' },
      centre: { name: 'CEDoc Droit, Économie et Gestion', status: 'valid', date: '22/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '02/09/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-007',
    code: 'FLSH-LIT-26-07',
    title: 'Patrimoine Manuscrit de la Médina de Fès : Conservation Numérique et Analyse Philologique',
    titleAr: 'التراث المخطوط بمدينة فاس القديمة: الحفظ الرقمي والتحليل الفيلولوجي',
    scientificDescription:
      'Inventaire raisonné, étude codicologique et édition critique de manuscrits inédits conservés dans les bibliothèques traditionnelles de Fès, avec proposition d’un corpus numérique interrogeable.',
    scientificDescriptionAr:
      'فهرسة وتحقيق نقدي لمخطوطات نادرة محفوظة في الخزانات التراثية بفاس، مع اقتراح منصة رقمية مفهرسة للباحثين.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-24',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Histoire & Patrimoine', status: 'valid', date: '12/08/2026' },
      centre: { name: 'CEDoc Lettres et Sciences Humaines', status: 'valid', date: '20/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '31/08/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-008',
    code: 'FST-BIO-26-08',
    title: 'Valorisation Biotechnologique des Sous-produits Oléicoles (Margines et Grignons) de la Région Fès-Meknès',
    titleAr: 'التثمين التكنولوجي الحيوي للمخلفات الزيتونية (المرجان والفيتور) بجهة فاس-مكناس',
    scientificDescription:
      'Extraction de polyphénols antioxydants et bioconversion anaérobie des déchets de l’industrie oléicole pour la production combinée de biogaz et de biofertilisants à haute valeur agronomique.',
    scientificDescriptionAr:
      'استخلاص مضادات الأكسدة والتحويل الحيوي اللاهوائي لمخلفات عصر الزيتون لإنتاج الغاز الحيوي والأسمدة العضوية.',
    academicYear: '2026/2027',
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
    submissionDeadline: '2026-11-26',
    status: 'open',
    workflowStatus: 'approved_signed',
    isOfficialPublication: true,
    workflow: {
      structure: { name: 'Laboratoire Bioressources', status: 'valid', date: '19/08/2026' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '24/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: '03/09/2026' },
    },
  },
  {
    id: 'usmba-topic-2026-009',
    code: 'FST-LISIA-26-09',
    title: 'Sujet Prototype 30-08 : Diagnostic Prédictif des Éoliennes Offshore par Réseaux de Capteurs IoT',
    titleAr: 'موضوع تجريبي 30-08: التشخيص التنبئي لعنفات الرياح البحرية عبر شبكات إنترنت الأشياء',
    scientificDescription:
      'Ce sujet est actuellement en phase finale d’arbitrage par la commission centrale du Pôle Doctoral. Il n’accepte pas encore de candidatures publiques.',
    scientificDescriptionAr:
      'هذا الموضوع قيد المراجعة النهائية من طرف لجنة القطب الجامعي ولا يقبل الترشيحات حالياً.',
    academicYear: '2026/2027',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'directeur.these.test@usmba.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: ['Master ou diplôme d’ingénieur'],
    requiredSkills: ['IoT', 'Edge Computing', 'Predictive Maintenance'],
    fundingType: 'projet_recherche',
    spotsAvailable: 1,
    applicantsCount: 1,
    submissionDeadline: '2026-12-15',
    status: 'under_review',
    workflowStatus: 'submitted',
    isOfficialPublication: false,
    workflow: {
      structure: { name: 'Laboratoire LISIA', status: 'valid', date: '17/08/2026' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'valid', date: '17/08/2026' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'pending', comments: 'En attente d’arbitrage et signature par le Directeur de structure' },
    },
  },
  {
    id: 'usmba-topic-2026-010',
    code: 'FST-LISIA-26-10',
    title: 'Apprentissage Fédéré pour la Confidentialité des Données Médicales Hospitalières',
    titleAr: 'التعلم الموحد لحماية سرية البيانات الطبية الاستشفائية',
    scientificDescription:
      'Développement d’algorithmes Federated Learning sécurisés et robustes aux attaques d’empoisonnement, appliqués à l’analyse collaborative d’images médicales entre plusieurs centres hospitaliers universitaires régionaux sans partage direct des dossiers patients.',
    scientificDescriptionAr:
      'تطوير خوارزميات التعلم الموحد الآمن والمقاوم للهجمات، لتحليل الصور الطبية بتعاون المستشفيات الجامعية دون المساس بخصوصية المرضى.',
    academicYear: '2026/2027',
    domain: 'Informatique & Intelligence Artificielle',
    domainAr: 'المعلوميات والذكاء الاصطناعي',
    professorName: 'Pr. Karim Benali',
    professorTitle: 'Professeur de l’Enseignement Supérieur (PES)',
    professorEmail: 'directeur.these.test@usmba.ma',
    laboratory: 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
    institution: 'Faculté des Sciences et Techniques (FST) de Fès',
    eligibilityCriteria: ['Master ou Ingénieur en Informatique ou Cybersécurité', 'Bonne maîtrise de Python et PySyft / Flower'],
    requiredSkills: ['Federated Learning', 'Differential Privacy', 'PyTorch / Flower', 'Sécurité des données'],
    fundingType: 'projet_recherche',
    spotsAvailable: 1,
    applicantsCount: 0,
    submissionDeadline: '2026-12-20',
    status: 'under_review',
    workflowStatus: 'revision_requested',
    isOfficialPublication: false,
    revisionRequests: [
      {
        date: '12/09/2026 10:30',
        requestedBy: 'Pr. Mostafa Bennani (Directeur du CEDoc)',
        message: 'Prière de préciser les protocoles de chiffrement homomorphe envisagés et de joindre l’accord de principe du comité d’éthique du CHU Hassan II de Fès avant validation définitive.',
        resolved: false,
      },
    ],
    workflow: {
      structure: { name: 'Laboratoire LISIA', status: 'valid', date: '01/09/2026' },
      centre: { name: 'CEDoc Sciences & Techniques', status: 'revision_requested', date: '12/09/2026', comments: 'Précisions déontologiques demandées' },
      pole: { name: 'Pôle Doctoral USMBA', status: 'pending' },
    },
  },
];

const TOPICS_STORAGE_KEY = V5_KEYS.TOPICS;

function getStructureDirectorEmail(): string {
  try {
    const raw = localStorage.getItem(V5_KEYS.ACCOUNTS);
    if (raw) {
      const accounts = JSON.parse(raw);
      const director = accounts.find((a: any) => a.role === 'structure_director');
      if (director?.email) return director.email;
    }
  } catch {
    // ignore
  }
  return 'directeur.structure@usmba.ma';
}

/**
 * Service de gestion du cycle de vie des sujets de thèse :
 * Création, modification, soumission, révision et signature électronique
 */
export const ThesisTopicService = {
  getTopics(): ThesisTopic[] {
    try {
      const raw = localStorage.getItem(TOPICS_STORAGE_KEY);
      if (raw !== null) {
        return JSON.parse(raw);
      }
      this.saveTopics(DEMO_TOPICS);
      return DEMO_TOPICS;
    } catch {
      return DEMO_TOPICS;
    }
  },

  saveTopics(topics: ThesisTopic[]): void {
    try {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
    } catch (e) {
      console.warn('Failed to save thesis topics', e);
    }
  },

  createTopic(
    topicData: Partial<ThesisTopic>,
    author: { name: string; email: string; title?: string; institution?: string; laboratory?: string }
  ): ThesisTopic {
    const topics = this.getTopics();
    const count = topics.length + 1;
    const code = `FST-LISIA-26-${count < 10 ? '0' + count : count}`;

    const newTopic: ThesisTopic = {
      id: `topic-${Date.now()}`,
      code,
      title: topicData.title || 'Nouveau sujet doctoral',
      titleAr: topicData.titleAr || '',
      scientificDescription: topicData.scientificDescription || '',
      scientificDescriptionAr: topicData.scientificDescriptionAr || '',
      academicYear: topicData.academicYear || getCurrentAcademicYear(),
      domain: topicData.domain || 'Informatique & Intelligence Artificielle',
      domainAr: topicData.domainAr || 'المعلوميات والذكاء الاصطناعي',
      specialty: topicData.specialty || 'Intelligence Artificielle',
      professorName: author.name,
      professorTitle: author.title || 'Professeur de l’Enseignement Supérieur (PES)',
      professorEmail: author.email,
      laboratory: author.laboratory || topicData.laboratory || 'Laboratoire Systèmes Intelligents & Applications (LISIA)',
      institution: author.institution || topicData.institution || 'Faculté des Sciences et Techniques (FST) de Fès',
      eligibilityCriteria: topicData.eligibilityCriteria && topicData.eligibilityCriteria.length > 0
        ? topicData.eligibilityCriteria
        : ['Master de recherche ou Diplôme d’Ingénieur d’État dans la discipline'],
      requiredSkills: topicData.requiredSkills && topicData.requiredSkills.length > 0
        ? topicData.requiredSkills
        : ['Méthodologie de recherche', 'Analyse de données'],
      fundingType: topicData.fundingType || 'projet_recherche',
      spotsAvailable: topicData.spotsAvailable || 1,
      applicantsCount: 0,
      submissionDeadline: topicData.submissionDeadline || '2026-11-25',
      status: 'under_review',
      workflowStatus: 'submitted',
      isOfficialPublication: false,
      workflow: {
        structure: { name: topicData.laboratory || author.laboratory || 'Laboratoire de recherche', status: 'valid', date: new Date().toLocaleDateString('fr-FR') },
        centre: { name: 'CEDoc Sciences & Technologies', status: 'pending' },
        pole: { name: 'Pôle Doctoral USMBA', status: 'pending' },
      },
    };

    topics.unshift(newTopic);
    this.saveTopics(topics);

    const directorEmail = getStructureDirectorEmail();
    NotificationService.send({
      recipientEmail: directorEmail,
      recipientRole: 'structure_director',
      type: 'validation',
      title: `Nouveau sujet soumis pour signature (${newTopic.code})`,
      message: `${author.name} a créé et soumis le sujet "${newTopic.title}" à votre arbitrage.`,
      relatedTopicId: newTopic.id,
    });

    return newTopic;
  },

  updateTopic(
    topicId: string,
    updates: Partial<ThesisTopic>,
    editorName: string
  ): ThesisTopic | null {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === topicId);
    if (index === -1) return null;

    const current = topics[index];
    const isRevision = current.workflowStatus === 'revision_requested';

    const updated: ThesisTopic = {
      ...current,
      ...updates,
      // If was revision_requested and corrected, re-submit
      workflowStatus: isRevision ? 'submitted' : current.workflowStatus,
    };

    topics[index] = updated;
    this.saveTopics(topics);

    if (isRevision) {
      const directorEmail = getStructureDirectorEmail();
      NotificationService.send({
        recipientEmail: directorEmail,
        recipientRole: 'structure_director',
        type: 'validation',
        title: `Sujet révisé et re-soumis (${updated.code})`,
        message: `${editorName} a appliqué les corrections demandées sur le sujet "${updated.title}" et l'a re-soumis.`,
        relatedTopicId: updated.id,
      });
    }

    return updated;
  },

  requestTopicRevision(topicId: string, message: string, reviewerName: string): ThesisTopic | null {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === topicId);
    if (index === -1) return null;

    const current = topics[index];
    const revisions = current.revisionRequests || [];
    revisions.push({
      date: new Date().toLocaleString('fr-FR'),
      requestedBy: reviewerName,
      message,
      resolved: false,
    });

    const updated: ThesisTopic = {
      ...current,
      workflowStatus: 'revision_requested',
      revisionRequests: revisions,
    };

    topics[index] = updated;
    this.saveTopics(topics);

    NotificationService.send({
      recipientEmail: current.professorEmail,
      recipientRole: 'thesis_director',
      type: 'correction',
      title: `Modifications demandées sur votre sujet (${current.code})`,
      message: `${reviewerName} a demandé des modifications avant validation : "${message}"`,
      relatedTopicId: current.id,
    });

    return updated;
  },

  signAndApproveTopic(
    topicId: string,
    signer: { name: string; email: string; role: string },
    comments?: string
  ): ThesisTopic | null {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === topicId);
    if (index === -1) return null;

    const current = topics[index];
    const fingerprint = 'SHA256:' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    const updated: ThesisTopic = {
      ...current,
      workflowStatus: 'approved_signed',
      status: 'open',
      isOfficialPublication: true,
      electronicSignature: {
        signerName: signer.name,
        signerEmail: signer.email,
        signerRole: signer.role,
        signedAt: new Date().toLocaleString('fr-FR'),
        signatureFingerprint: fingerprint,
        comments: comments || 'Sujet doctoral validé, signé électroniquement et publié au catalogue officiel.',
      },
      workflow: {
        structure: { name: current.laboratory, status: 'valid', date: new Date().toLocaleDateString('fr-FR') },
        centre: { name: 'CEDoc Sciences & Technologies', status: 'valid', date: new Date().toLocaleDateString('fr-FR') },
        pole: { name: 'Pôle Doctoral USMBA', status: 'valid', date: new Date().toLocaleDateString('fr-FR') },
      },
    };

    topics[index] = updated;
    this.saveTopics(topics);

    NotificationService.send({
      recipientEmail: current.professorEmail,
      recipientRole: 'thesis_director',
      type: 'validation',
      title: `Sujet validé, signé et publié (${current.code})`,
      message: `Votre sujet "${current.title}" a été signé électroniquement par ${signer.name} et est désormais ouvert aux candidatures dans le catalogue public.`,
      relatedTopicId: current.id,
    });

    return updated;
  },

  rejectTopic(topicId: string, reason: string, reviewerName: string): ThesisTopic | null {
    const topics = this.getTopics();
    const index = topics.findIndex((t) => t.id === topicId);
    if (index === -1) return null;

    const current = topics[index];
    const updated: ThesisTopic = {
      ...current,
      workflowStatus: 'rejected',
      status: 'closed',
      isOfficialPublication: false,
    };

    topics[index] = updated;
    this.saveTopics(topics);

    NotificationService.send({
      recipientEmail: current.professorEmail,
      recipientRole: 'thesis_director',
      type: 'decision',
      title: `Sujet non retenu (${current.code})`,
      message: `Votre sujet "${current.title}" a été rejeté par ${reviewerName}. Motif : ${reason}`,
      relatedTopicId: current.id,
    });

    return updated;
  },
};

/**
 * Cart management with local storage persistence
 */
export const CartService = {
  getCartTopics(): string[] {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const limit = this.getMaxLimit();
        if (parsed.length > limit) {
          const trimmed = parsed.slice(0, limit);
          this.saveCartTopics(trimmed);
          return trimmed;
        }
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveCartTopics(topicIds: string[]): void {
    try {
      const limit = this.getMaxLimit();
      const sanitized = Array.isArray(topicIds) ? topicIds.slice(0, limit) : [];
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Unable to persist cart to localStorage', e);
    }
  },

  addTopic(topicId: string, maxLimit = 3): { success: boolean; reason?: 'max_reached' | 'already_in_cart' } {
    const current = this.getCartTopics();
    if (current.includes(topicId)) {
      return { success: false, reason: 'already_in_cart' };
    }
    const limit = Math.min(maxLimit, this.getMaxLimit());
    if (current.length >= limit) {
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
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return 3;
  },

  setMaxLimit(newLimit: number): void {
    try {
      const val = Math.max(1, Math.min(5, newLimit || 3));
      localStorage.setItem(CART_LIMIT_STORAGE_KEY, String(val));
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
import { AuditLogService } from './auditLogService';

const APPLICATIONS_STORAGE_KEY = V5_KEYS.APPLICATIONS;

export const DEMO_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'app-2026-001',
    topicId: 'usmba-topic-2026-001',
    topicCode: 'FST-LISIA-26-01',
    topicTitle: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    candidateId: 'user-test-cand',
    candidateName: 'Youssef El Amrani',
    candidateEmail: 'candidat.test@usmba.ma',
    candidatePhone: '+212 661 234 567',
    cne: 'N138294012',
    cin: 'CD718293',
    masterDegree: 'Master Recherche en Informatique et Systèmes Intelligents',
    masterUniversity: 'Faculté des Sciences et Techniques (FST) de Fès',
    masterGrade: 16.20,
    masterMention: 'Très Bien',
    pfeTitle: 'Segmentation et transcription de textes arabes manuscrits par réseaux CNN-LSTM',
    submissionDate: '2026-10-18',
    status: 'admitted',
    registrationDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    officialRanking: 1,
    decisionDate: '2026-10-25',
    decisionBy: 'Pr. Karim Benali (Directeur de Thèse)',
    scientificOpinion: {
      recommendation: 'favorable',
      score: 17.5,
      academicAppraisal: 'Profil d’excellence avec mention Très Bien. Adéquation remarquable avec le sujet de recherche.',
      evaluatorName: 'Pr. Karim Benali',
      evaluatedAt: '24/10/2026 15:30',
    },
    documents: [
      { id: 'doc-1', name: 'Curriculum Vitae académique', category: 'cv', fileName: 'CV_Youssef_ElAmrani.pdf', fileSize: '1.2 Mo', status: 'valid' },
      { id: 'doc-2', name: 'Diplôme de Master (ou Attestation de réussite)', category: 'master_diploma', fileName: 'Attestation_Master_FST.pdf', fileSize: '2.1 Mo', status: 'valid' },
      { id: 'doc-3', name: 'Relevés de notes semestriels (S1 à S4)', category: 'transcripts', fileName: 'Releves_Notes_S1_S4.pdf', fileSize: '3.4 Mo', status: 'valid' },
      { id: 'doc-4', name: 'Mémoire de Projet de Fin d’Études (PFE)', category: 'pfe_thesis', fileName: 'Memoire_PFE_ElAmrani.pdf', fileSize: '4.8 Mo', status: 'valid' },
      { id: 'doc-5', name: 'Carte Nationale d’Identité (CIN)', category: 'cin', fileName: 'CNIE_Recto_Verso.pdf', fileSize: '850 Ko', status: 'valid' },
    ],
    history: [
      { id: 'h-1', date: '18/10/2026 14:32', action: 'Dossier soumis par le candidat', author: 'Youssef El Amrani' },
      { id: 'h-2', date: '19/10/2026 10:15', action: 'Contrôle de recevabilité administrative validé', author: 'CEDoc Sciences & Techniques' },
      { id: 'h-3', date: '24/10/2026 15:30', action: 'Avis scientifique Favorable émis (17.5/20)', author: 'Pr. Karim Benali' },
      { id: 'h-4', date: '25/10/2026 11:00', action: 'Admission officielle sur Liste Principale notifiée', author: 'Direction du CEDoc' },
    ],
  },
  {
    id: 'app-2026-001-wl',
    topicId: 'usmba-topic-2026-001',
    topicCode: 'FST-LISIA-26-01',
    topicTitle: 'Arabic OCR using AI: Deep Learning Architectures for Historical Manuscript Digitization',
    candidateName: 'Oussama Tazi',
    candidateEmail: 'oussama.tazi@etu.usmba.ac.ma',
    candidatePhone: '+212 662 998 776',
    cne: 'N134009887',
    cin: 'CD998877',
    masterDegree: 'Master Big Data & Intelligence Artificielle',
    masterUniversity: 'Faculté des Sciences et Techniques (FST) de Fès',
    masterGrade: 15.80,
    masterMention: 'Bien',
    pfeTitle: 'Reconnaissance de caractères manuscrits anciens par Transformers',
    submissionDate: '2026-10-20',
    status: 'waitlist',
    waitlistRank: 1,
    decisionDate: '2026-10-25',
    decisionBy: 'Pr. Karim Benali (Directeur de Thèse)',
    scientificOpinion: {
      recommendation: 'favorable',
      score: 16.2,
      academicAppraisal: 'Très bon parcours. Classé n°1 sur liste d’attente pour éventuel désistement.',
      evaluatorName: 'Pr. Karim Benali',
      evaluatedAt: '24/10/2026 16:00',
    },
    documents: [
      { id: 'doc-wl-1', name: 'CV académique', category: 'cv', fileName: 'CV_Oussama_Tazi.pdf', fileSize: '1.0 Mo', status: 'valid' },
      { id: 'doc-wl-2', name: 'Diplôme de Master', category: 'master_diploma', fileName: 'Master_Tazi.pdf', fileSize: '1.8 Mo', status: 'valid' },
      { id: 'doc-wl-3', name: 'Relevés de notes', category: 'transcripts', fileName: 'Notes_Tazi.pdf', fileSize: '2.9 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-wl-1', date: '20/10/2026 11:00', action: 'Dossier soumis par le candidat', author: 'Oussama Tazi' },
      { id: 'h-wl-2', date: '24/10/2026 16:00', action: 'Évaluation scientifique terminée — Classé Liste d’Attente Rang 1', author: 'Pr. Karim Benali' },
    ],
  },
  {
    id: 'app-2026-002',
    topicId: 'usmba-topic-2026-001',
    topicCode: 'FST-LISIA-26-01',
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
    submissionDate: '2026-10-19',
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
      { id: 'h-21', date: '19/10/2026 16:10', action: 'Dossier soumis par le candidat', author: 'Salma Bennani' },
      { id: 'h-22', date: '21/10/2026 09:30', action: 'Demande de correction émise : relevé S3 incomplet', author: 'Pr. Karim Benali' },
    ],
  },
  {
    id: 'app-2026-003',
    topicId: 'usmba-topic-2026-003',
    topicCode: 'FST-LISIA-26-03',
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
    submissionDate: '2026-10-21',
    status: 'pending_review',
    documents: [
      { id: 'doc-31', name: 'CV académique', category: 'cv', fileName: 'CV_Chraibi.pdf', fileSize: '1.1 Mo', status: 'valid' },
      { id: 'doc-32', name: 'Diplôme de Master', category: 'master_diploma', fileName: 'Diplome_FSDM.pdf', fileSize: '1.8 Mo', status: 'valid' },
      { id: 'doc-33', name: 'Relevés de notes', category: 'transcripts', fileName: 'Releves.pdf', fileSize: '3.1 Mo', status: 'valid' },
      { id: 'doc-34', name: 'Rapport PFE', category: 'pfe_thesis', fileName: 'PFE_Mehdi.pdf', fileSize: '5.2 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-31', date: '21/10/2026 11:20', action: 'Dossier soumis par le candidat', author: 'Mehdi Chraibi' },
    ],
  },
  {
    id: 'app-2026-004',
    topicId: 'usmba-topic-2026-003',
    topicCode: 'FST-LISIA-26-03',
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
    submissionDate: '2026-10-17',
    status: 'rejected',
    rejectionReason: 'Profil académique insuffisant dans les prérequis méthodologiques en réseaux de neurones profonds (GNN).',
    decisionDate: '2026-10-24',
    decisionBy: 'Pr. Karim Benali',
    documents: [
      { id: 'doc-41', name: 'CV', category: 'cv', fileName: 'CV_Kettani.pdf', fileSize: '800 Ko', status: 'valid' },
      { id: 'doc-42', name: 'Diplôme', category: 'master_diploma', fileName: 'Master_UM5.pdf', fileSize: '2.0 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-41', date: '17/10/2026 18:00', action: 'Dossier soumis par le candidat', author: 'Omar Kettani' },
      { id: 'h-42', date: '24/10/2026 15:45', action: 'Dossier non retenu — motif notifié', author: 'Pr. Karim Benali', note: 'Prérequis GNN non satisfaits' },
    ],
  },
  {
    id: 'app-2026-005',
    topicId: 'usmba-topic-2026-002',
    topicCode: 'FST-LISIA-26-02',
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
    submissionDate: '2026-10-16',
    status: 'accepted',
    decisionDate: '2026-10-25',
    decisionBy: 'Pr. Amina Berrada',
    documents: [
      { id: 'doc-51', name: 'CV détaillé', category: 'cv', fileName: 'CV_Nouhaila_Tazi.pdf', fileSize: '1.4 Mo', status: 'valid' },
      { id: 'doc-52', name: 'Diplôme Master FST', category: 'master_diploma', fileName: 'Master_Tazi.pdf', fileSize: '1.9 Mo', status: 'valid' },
      { id: 'doc-53', name: 'Relevés de notes officiels', category: 'transcripts', fileName: 'Releves_Tazi.pdf', fileSize: '3.0 Mo', status: 'valid' },
    ],
    history: [
      { id: 'h-51', date: '16/10/2026 10:00', action: 'Dossier soumis par le candidat', author: 'Nouhaila Tazi' },
      { id: 'h-52', date: '25/10/2026 17:30', action: 'Candidature retenue sur Liste Principale', author: 'Pr. Amina Berrada' },
    ],
    physicalReception: {
      received: true,
      date: '27/10/2026 10:15',
      agentName: 'M. Rachid Bennani (Agent CEDoc)',
      verifiedOriginals: ['Baccalauréat original', 'Diplôme de Master original', 'Relevés de notes certifiés'],
    },
  },
];

export const ApplicationService = {
  getDeletedDraftIds(): Set<string> {
    try {
      const raw = localStorage.getItem(V5_KEYS.DELETED_DRAFTS);
      if (raw) {
        return new Set(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to parse deleted draft ids', e);
    }
    return new Set<string>();
  },

  recordDeletedDraftId(id: string): void {
    try {
      const ids = this.getDeletedDraftIds();
      ids.add(id);
      localStorage.setItem(V5_KEYS.DELETED_DRAFTS, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.warn('Failed to record deleted draft id', e);
    }
  },

  /**
   * Strict deduplication and integrity check for applications:
   * 1. Preserves all official applications (!isDraft && status !== 'draft'), including cancelled/withdrawn/admitted.
   * 2. Binds app-2026-001 to user-test-cand if candidateId is absent.
   * 3. For drafts: guarantees AT MOST ONE draft per (candidateId, topicId, session).
   * 4. If an official application already exists for (candidateId, topicId, session), removes any phantom drafts for that topic.
   * 5. Removes unowned drafts (missing candidateId).
   */
  deduplicateApplications(apps: CandidateApplication[]): CandidateApplication[] {
    const deletedDraftIds = this.getDeletedDraftIds();
    const result: CandidateApplication[] = [];
    const seenDraftKeys = new Set<string>();
    const seenOfficialKeys = new Set<string>();
    const seenAppIds = new Set<string>();

    // 1. Pass 1: Official applications (preserve all real applications, decisions and statuses)
    for (const app of apps) {
      if (!app || app.id === 'app-2026-draft-01' || deletedDraftIds.has(app.id)) {
        continue;
      }
      if (app.id === 'app-2026-001' && !app.candidateId) {
        app.candidateId = 'user-test-cand';
      }

      const isDraft = app.isDraft || app.status === 'draft';
      if (!isDraft) {
        if (!seenAppIds.has(app.id)) {
          seenAppIds.add(app.id);
          const cid = (app.candidateId || '').trim();
          const session = app.academicYear || ThesisTopicService.getTopics().find((t) => t.id === app.topicId)?.academicYear || getCurrentAcademicYear();
          if (cid) {
            seenOfficialKeys.add(`${cid.toLowerCase()}_${app.topicId}_${session}`);
          }
          result.push(app);
        }
      }
    }

    // 2. Pass 2: Drafts (strictly 1 draft per candidate + topic + session, only if no official app exists)
    for (const app of apps) {
      if (!app || app.id === 'app-2026-draft-01' || deletedDraftIds.has(app.id)) {
        continue;
      }
      const isDraft = app.isDraft || app.status === 'draft';
      if (isDraft) {
        if (!app.candidateId) continue; // Unowned drafts are ignored
        const cid = app.candidateId.trim().toLowerCase();
        const session = app.academicYear || ThesisTopicService.getTopics().find((t) => t.id === app.topicId)?.academicYear || getCurrentAcademicYear();
        const key = `${cid}_${app.topicId}_${session}`;

        // If an official application exists for this topic in this session, discard duplicate/phantom drafts
        if (seenOfficialKeys.has(key)) {
          continue;
        }

        if (!seenDraftKeys.has(key) && !seenAppIds.has(app.id)) {
          seenDraftKeys.add(key);
          seenAppIds.add(app.id);
          result.push(app);
        }
      }
    }

    return result;
  },

  getApplications(): CandidateApplication[] {
    try {
      const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      if (raw !== null) {
        const parsed: CandidateApplication[] = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const deduplicated = this.deduplicateApplications(parsed);
        if (deduplicated.length !== parsed.length) {
          this.saveApplications(deduplicated);
        }
        return deduplicated;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveApplications(apps: CandidateApplication[]): void {
    try {
      // 1. Asynchronously persist any rich document pages to IndexedDB
      apps.forEach((app) => {
        (app.documents || []).forEach((doc) => {
          if (doc.pages && doc.pages.length > 0 && doc.pages[0] !== '[local_storage_file]') {
            LocalFileStorage.saveDocumentPages(doc.id, doc.pages, {
              name: doc.name,
              category: doc.category,
              applicationId: app.id,
              candidateEmail: app.candidateEmail,
            }).catch(() => {});
          }
        });
      });

      // 2. Protect localStorage against quota exhaustion from heavy base64 strings
      const sanitized = apps.map((app) => ({
        ...app,
        documents: (app.documents || []).map((doc) => {
          if (doc.pages && doc.pages.some((p) => typeof p === 'string' && p.length > 40000)) {
            return {
              ...doc,
              pages: ['[local_storage_file]'],
              storageRef: doc.storageRef || doc.id,
              isStoredInIndexedDb: true,
            };
          }
          return doc;
        }),
      }));
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Unable to persist full applications to localStorage, falling back to lightweight schema', e);
      try {
        const minimal = apps.map((app) => ({
          ...app,
          documents: (app.documents || []).map((doc) => ({
            ...doc,
            pages: ['[local_storage_file]'],
            storageRef: doc.storageRef || doc.id,
            isStoredInIndexedDb: true,
          })),
        }));
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(minimal));
      } catch (fatal) {
        console.error('Fatal: localStorage quota exceeded completely', fatal);
      }
    }
  },

  /**
   * Migrate historical documents from localStorage into IndexedDB safely and non-destructively
   */
  async migrateHistoricalDocuments(): Promise<{ migratedCount: number }> {
    try {
      const apps = this.getApplications();
      let migratedCount = 0;
      for (const app of apps) {
        for (const doc of (app.documents || [])) {
          if (doc.pages && Array.isArray(doc.pages) && doc.pages.length > 0 && doc.pages[0].startsWith('data:')) {
            try {
              await LocalFileStorage.saveDocumentPages(doc.id, doc.pages, {
                name: doc.name,
                category: doc.category,
                applicationId: app.id,
                candidateEmail: app.candidateEmail,
              });
              doc.isStoredInIndexedDb = true;
              doc.storageRef = doc.id;
              migratedCount++;
            } catch (err) {
              console.warn(`Could not migrate document ${doc.id} to IndexedDB:`, err);
            }
          }
        }
      }
      return { migratedCount };
    } catch {
      return { migratedCount: 0 };
    }
  },

  /**
   * Delete a draft application strictly
   * Only drafts (isDraft: true or status: 'draft') can be deleted.
   * Submitted applications can never be deleted.
   * Cleans up localStorage and safely removes unreferenced IndexedDB files.
   */
  deleteDraft(applicationId: string, candidateUserId: string): { success: boolean; message: string } {
    try {
      const candNorm = (candidateUserId || '').trim();
      if (!candNorm) {
        return { success: false, message: 'Action non autorisée : identifiant candidat manquant.' };
      }

      const apps = this.getApplications();
      const index = apps.findIndex((a) => a.id === applicationId);
      if (index === -1) {
        return { success: false, message: 'Candidature introuvable.' };
      }

      const target = apps[index];

      // Strict check: only drafts can be deleted!
      if (!target.isDraft && target.status !== 'draft') {
        return { 
          success: false, 
          message: 'Impossible de supprimer un dossier déjà officiellement soumis à l’instruction académique.' 
        };
      }

      // Check ownership strictly against candidateUserId (drafts without candidateId cannot be claimed)
      const isOwner = Boolean(target.candidateId && target.candidateId.trim() === candNorm);

      if (!isOwner) {
        return { success: false, message: 'Action non autorisée : ce brouillon ne vous appartient pas.' };
      }

      // Remove from list
      apps.splice(index, 1);
      this.saveApplications(apps);

      // Record in deleted drafts set to prevent resurrection from demo seeds
      this.recordDeletedDraftId(applicationId);

      // Clean up files in IndexedDB ONLY if not referenced by any remaining application
      if (target.documents && target.documents.length > 0) {
        for (const doc of target.documents) {
          const isReferencedElsewhere = apps.some((other) =>
            other.documents?.some((d) => d.id === doc.id || (doc.storageRef && d.storageRef === doc.storageRef))
          );
          if (!isReferencedElsewhere) {
            try {
              LocalFileStorage.deleteDocument(doc.id).catch(() => {});
            } catch {
              // ignore
            }
          }
        }
      }

      // Record in Audit Log
      try {
        AuditLogService.log({
          action: 'SUPPRESSION_BROUILLON',
          userEmail: target.candidateEmail || candNorm,
          userRole: 'candidate',
          details: `Suppression du brouillon ${target.id} pour le sujet ${target.topicCode || target.topicId}`,
          targetId: target.id,
        });
      } catch (e) {
        console.warn('Audit logging error:', e);
      }

      return { success: true, message: 'Brouillon supprimé avec succès.' };
    } catch (err) {
      console.error('Error deleting draft:', err);
      return { success: false, message: 'Une erreur est survenue lors de la suppression du brouillon.' };
    }
  },

  /**
   * Check whether a candidate is allowed to apply for or submit a topic
   * USMBA rule: maximum 3 officially submitted applications per candidate across the campaign.
   * Drafts do NOT count towards the 3 official applications limit.
   * Duplicate applications for the SAME topic are strictly forbidden.
   */
  canCandidateApply(candidate: {
    id?: string;
    email?: string;
    cin?: string;
    cne?: string;
    targetTopicId?: string;
    currentApplicationId?: string;
    academicYear?: string;
  }): {
    canApply: boolean;
    reason?: string;
    existingDraftId?: string;
    existingApplication?: CandidateApplication;
    hasSubmitted?: boolean;
    hasDraft?: boolean;
    submittedCount?: number;
    maxReached?: boolean;
    alreadyAppliedToThisTopic?: boolean;
  } {
    const email = (candidate.email || '').toLowerCase().trim();
    const cin = (candidate.cin || '').toLowerCase().trim();
    const cne = (candidate.cne || '').toLowerCase().trim();
    const cid = (candidate.id || '').toLowerCase().trim();
    const targetTopicId = candidate.targetTopicId;
    const currentAppId = candidate.currentApplicationId;

    if (!email && !cin && !cne && !cid) {
      return { canApply: true, submittedCount: 0 };
    }

    // Determine target session (defaults to target topic's academic year or current year)
    const targetTopic = targetTopicId ? ThesisTopicService.getTopics().find((t) => t.id === targetTopicId) : null;
    const targetSession = candidate.academicYear || targetTopic?.academicYear || getCurrentAcademicYear();

    const allApps = this.getApplications();
    const myApps = allApps.filter((app) => {
      if (currentAppId && app.id === currentAppId) return false;
      if (!app.candidateId) return false;
      if (cid) return app.candidateId.trim().toLowerCase() === cid;
      return false;
    });

    // Only count submitted applications for THIS academic session (previous sessions do NOT count towards quota)
    const submittedApps = myApps.filter((a) => {
      if (a.isDraft || a.status === 'draft') return false;
      const appSession = a.academicYear || ThesisTopicService.getTopics().find((t) => t.id === a.topicId)?.academicYear || getCurrentAcademicYear();
      return appSession === targetSession;
    });

    const MAX_APPLICATIONS = CartService.getMaxLimit(); // Default 3

    // Check if already applied to this specific topic in this session
    if (targetTopicId) {
      const appForSameTopic = myApps.find((a) => {
        if (a.topicId !== targetTopicId) return false;
        const appSession = a.academicYear || ThesisTopicService.getTopics().find((t) => t.id === a.topicId)?.academicYear || getCurrentAcademicYear();
        return appSession === targetSession;
      });

      if (appForSameTopic) {
        if (!appForSameTopic.isDraft && appForSameTopic.status !== 'draft') {
          return {
            canApply: false,
            alreadyAppliedToThisTopic: true,
            hasSubmitted: true,
            submittedCount: submittedApps.length,
            existingApplication: appForSameTopic,
            reason: `Vous avez déjà soumis une candidature officielle pour le sujet « ${appForSameTopic.topicTitle} » (${appForSameTopic.topicCode}) pour la session ${targetSession}. La réglementation interdit de déposer deux candidatures pour le même sujet lors de la même session.`,
          };
        } else {
          return {
            canApply: true,
            hasDraft: true,
            existingDraftId: appForSameTopic.id,
            existingApplication: appForSameTopic,
            submittedCount: submittedApps.length,
          };
        }
      }
    }

    // Check if candidate reached maximum of 3 official submissions for this session
    if (submittedApps.length >= MAX_APPLICATIONS) {
      return {
        canApply: false,
        maxReached: true,
        hasSubmitted: true,
        submittedCount: submittedApps.length,
        reason: `Vous avez atteint le plafond réglementaire de ${MAX_APPLICATIONS} candidatures officielles pour la session doctorale ${targetSession} (${submittedApps.map((a) => a.topicCode).join(', ')}). Une quatrième candidature ne peut pas être déposée.`,
      };
    }

    return {
      canApply: true,
      submittedCount: submittedApps.length,
    };
  },

  /**
   * Supervisory tool for administrators to audit REAL duplicate applications:
   * 1. Candidates who applied more than once for the SAME topic.
   * 2. Candidates who exceeded the limit of 3 official applications.
   * Having 2 or 3 applications for different topics is fully legitimate.
   */
  getDuplicateApplicationsForAudit(): {
    candidateKey: string;
    candidateName: string;
    candidateEmail: string;
    count: number;
    anomalyType: 'same_topic_duplicate' | 'exceeded_max_applications';
    applications: CandidateApplication[];
  }[] {
    const all = this.getApplications();
    const map = new Map<string, CandidateApplication[]>();

    for (const app of all) {
      const key = (app.candidateEmail || app.cne || app.cin || app.candidateName || 'inconnu').toLowerCase().trim();
      const list = map.get(key) || [];
      list.push(app);
      map.set(key, list);
    }

    const duplicates: {
      candidateKey: string;
      candidateName: string;
      candidateEmail: string;
      count: number;
      anomalyType: 'same_topic_duplicate' | 'exceeded_max_applications';
      applications: CandidateApplication[];
    }[] = [];

    const MAX_LIMIT = CartService.getMaxLimit();

    map.forEach((list, key) => {
      // Check 1: Exceeded maximum official applications (> 3)
      const submitted = list.filter((a) => !a.isDraft && a.status !== 'draft');
      if (submitted.length > MAX_LIMIT) {
        duplicates.push({
          candidateKey: key,
          candidateName: list[0].candidateName || key,
          candidateEmail: list[0].candidateEmail || key,
          count: submitted.length,
          anomalyType: 'exceeded_max_applications',
          applications: submitted,
        });
        return;
      }

      // Check 2: Same topic duplicate
      const topicCounts = new Map<string, CandidateApplication[]>();
      for (const a of list) {
        const tList = topicCounts.get(a.topicId) || [];
        tList.push(a);
        topicCounts.set(a.topicId, tList);
      }
      topicCounts.forEach((tApps) => {
        if (tApps.length > 1) {
          duplicates.push({
            candidateKey: key,
            candidateName: list[0].candidateName || key,
            candidateEmail: list[0].candidateEmail || key,
            count: tApps.length,
            anomalyType: 'same_topic_duplicate',
            applications: tApps,
          });
        }
      });
    });

    return duplicates;
  },

  /**
   * Get applications for a thesis director
   * Strict filtering by topic's professorEmail or exact professorName from stored topics
   */
  getApplicationsByProfessor(profEmailOrName: string): CandidateApplication[] {
    const all = this.getApplications();
    const allTopics = ThesisTopicService.getTopics();
    const query = (profEmailOrName || '').toLowerCase().trim();
    if (!query) return [];

    const profTopicIds = allTopics
      .filter((t) => {
        const emailMatch = t.professorEmail && t.professorEmail.toLowerCase().trim() === query;
        const nameMatch = t.professorName && t.professorName.toLowerCase().trim() === query;
        return emailMatch || nameMatch;
      })
      .map((t) => t.id);

    return all.filter((app) => profTopicIds.includes(app.topicId));
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
   * Look up existing draft for a candidate, topic, and academic session
   */
  getDraftForCandidateAndTopic(candidateId: string, topicId: string, sessionYear?: string): CandidateApplication | null {
    if (!candidateId || !topicId) return null;
    const cid = candidateId.trim().toLowerCase();
    const apps = this.getApplications();
    const session = sessionYear || getCurrentAcademicYear();
    return apps.find((a) =>
      (a.isDraft || a.status === 'draft') &&
      Boolean(a.candidateId && a.candidateId.trim().toLowerCase() === cid) &&
      a.topicId === topicId &&
      (a.academicYear || session) === session
    ) || null;
  },

  /**
   * Save or update draft application
   * Guarantees at most ONE draft per candidate, topic, and session.
   * If an official submission exists for this topic and session, draft creation is blocked.
   */
  saveDraft(draft: CandidateApplication): void {
    if (!draft || !draft.candidateId) return;
    const cid = draft.candidateId.trim();
    const session = draft.academicYear || getCurrentAcademicYear();

    const apps = this.getApplications();

    // 1. Guard: If an official application already exists for this candidate and topic, do not create a draft
    const hasOfficial = apps.some((a) =>
      (!a.isDraft && a.status !== 'draft') &&
      Boolean(a.candidateId && a.candidateId.trim().toLowerCase() === cid.toLowerCase()) &&
      a.topicId === draft.topicId &&
      (a.academicYear || session) === session
    );
    if (hasOfficial) {
      console.warn('Cannot create draft: an official application already exists for this topic.');
      return;
    }

    // 2. Check if a draft already exists for this exact id OR for this candidate + topic + session
    let index = apps.findIndex((a) => a.id === draft.id);
    if (index === -1) {
      index = apps.findIndex((a) =>
        (a.isDraft || a.status === 'draft') &&
        Boolean(a.candidateId && a.candidateId.trim().toLowerCase() === cid.toLowerCase()) &&
        a.topicId === draft.topicId &&
        (a.academicYear || session) === session
      );
      if (index >= 0) {
        // Reuse canonical existing draft id!
        draft.id = apps[index].id;
      }
    }

    if (index >= 0) {
      const existing = apps[index];
      if (existing.candidateId && existing.candidateId.trim().toLowerCase() !== cid.toLowerCase()) {
        console.warn('Unauthorized attempt to overwrite draft belonging to another candidate');
        return;
      }
      apps[index] = {
        ...existing,
        ...draft,
        id: existing.id,
        isDraft: true,
        status: 'draft' as const,
        academicYear: session,
      };
    } else {
      apps.unshift({
        ...draft,
        isDraft: true,
        status: 'draft' as const,
        academicYear: session,
      });
    }

    const deduplicated = this.deduplicateApplications(apps);
    this.saveApplications(deduplicated);

    try {
      AuditLogService.log({
        action: 'ENREGISTREMENT_BROUILLON',
        userEmail: draft.candidateEmail,
        userRole: 'candidate',
        details: `Brouillon sauvegardé pour le sujet ${draft.topicCode || draft.topicId}`,
        targetId: draft.id,
      });
    } catch (e) {
      console.warn('Audit log error', e);
    }
  },

  /**
   * Officially submit application
   */
  submitApplication(app: CandidateApplication): { success: boolean; error?: string } {
    const allApps = this.getApplications();
    const currentCandidateId = (app.candidateId || '').trim();
    
    // Resolve session for target application
    const targetTopic = ThesisTopicService.getTopics().find((t) => t.id === app.topicId);
    const sessionYear = app.academicYear || targetTopic?.academicYear || getCurrentAcademicYear();

    const otherSubmitted = allApps.filter((a) => {
      if (a.id === app.id) return false;
      if (a.isDraft || a.status === 'draft') return false;
      // Filter strictly by session
      const aSession = a.academicYear || ThesisTopicService.getTopics().find((t) => t.id === a.topicId)?.academicYear || getCurrentAcademicYear();
      if (aSession !== sessionYear) return false; // Prior sessions do NOT count towards current session limit

      if (!a.candidateId) return false;
      return Boolean(currentCandidateId && a.candidateId.trim() === currentCandidateId);
    });

    const MAX_APPLICATIONS = CartService.getMaxLimit();
    if (otherSubmitted.length >= MAX_APPLICATIONS) {
      return {
        success: false,
        error: `Vous avez atteint le plafond réglementaire de ${MAX_APPLICATIONS} candidatures officielles pour la session doctorale ${sessionYear}.`,
      };
    }

    const sameTopic = otherSubmitted.find((a) => a.topicId === app.topicId);
    if (sameTopic) {
      return {
        success: false,
        error: `Vous avez déjà soumis une candidature officielle pour ce sujet (${sameTopic.topicCode}) pour la session ${sessionYear}.`,
      };
    }

    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      const existing = apps[index];
      if (existing.candidateId && app.candidateId && existing.candidateId.trim() !== app.candidateId.trim()) {
        return { success: false, error: 'Action non autorisée : ce dossier ne vous appartient pas.' };
      }
    }
    const finalApp: CandidateApplication = { 
      ...app, 
      academicYear: sessionYear, 
      isDraft: false, 
      status: 'pending_review' as const 
    };
    if (index >= 0) {
      apps[index] = finalApp;
    } else {
      apps.unshift(finalApp);
    }
    const deduplicated = this.deduplicateApplications(apps);
    this.saveApplications(deduplicated);

    try {
      AuditLogService.log({
        action: 'SOUMISSION_CANDIDATURE',
        userEmail: app.candidateEmail,
        userRole: 'candidate',
        details: `Candidature officielle transmise pour le sujet ${app.topicCode} (${app.topicTitle})`,
        targetId: app.id,
      });
    } catch (e) {
      console.warn('Audit log error', e);
    }

    try {
      // Find topic from active topics to identify professor
      const targetTopic = ThesisTopicService.getTopics().find((t) => t.id === app.topicId);
      
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
          recipientRole: 'thesis_director',
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

    return { success: true };
  },

  /**
   * Replace a specific document (e.g. following a correction request)
   */
  replaceDocument(appId: string, updatedDoc: ApplicationDocument, candidateUserId?: string): CandidateApplication | null {
    const apps = this.getApplications();
    const index = apps.findIndex((a) => a.id === appId);
    if (index === -1) return null;

    const current = apps[index];
    if (candidateUserId && current.candidateId && current.candidateId.trim() !== candidateUserId.trim()) {
      return null;
    }
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

