/**
 * Data models for AI-powered business recommendation system
 * SiNaik PWA - Sistem Intervensi Terpadu UMKM
 */

// Business stages based on Churchill & Lewis model
export const BUSINESS_STAGES = {
  EXISTENCE: 'existence',
  SURVIVAL: 'survival', 
  SUCCESS: 'success',
  TAKEOFF: 'takeoff',
  RESOURCE_MATURITY: 'resource_maturity'
};

// Business categories for Indonesian SMEs
export const BUSINESS_CATEGORIES = {
  RETAIL: 'retail',
  FOOD_BEVERAGE: 'food_beverage',
  MANUFACTURING: 'manufacturing',
  SERVICES: 'services',
  AGRICULTURE: 'agriculture',
  TECHNOLOGY: 'technology',
  CREATIVE: 'creative',
  TOURISM: 'tourism',
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare'
};

// Recommendation priorities
export const RECOMMENDATION_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Recommendation completion status
export const RECOMMENDATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

// Completion difficulty levels (1-5 scale)
export const COMPLETION_DIFFICULTY = {
  VERY_EASY: 1,
  EASY: 2,
  MODERATE: 3,
  HARD: 4,
  VERY_HARD: 5
};

// Impact levels (1-5 scale)
export const IMPACT_LEVEL = {
  VERY_LOW: 1,
  LOW: 2,
  MODERATE: 3,
  HIGH: 4,
  VERY_HIGH: 5
};

// Recommendation categories
export const RECOMMENDATION_CATEGORIES = {
  FINANCIAL_MANAGEMENT: 'financial_management',
  MARKETING_SALES: 'marketing_sales',
  OPERATIONS: 'operations',
  HUMAN_RESOURCES: 'human_resources',
  TECHNOLOGY: 'technology',
  LEGAL_COMPLIANCE: 'legal_compliance',
  GROWTH_STRATEGY: 'growth_strategy',
  FINANCIAL_LITERACY: 'financial_literacy'
};

// User business profile structure
export const createBusinessProfile = (data = {}) => ({
  userId: data.userId || '',
  businessName: data.businessName || '',
  businessCategory: data.businessCategory || '',
  businessStage: data.businessStage || '',
  employeeCount: data.employeeCount || 0,
  monthlyRevenue: data.monthlyRevenue || 0,
  businessAge: data.businessAge || 0,
  location: data.location || '',
  challenges: data.challenges || [],
  goals: data.goals || [],
  diagnosisAnswers: data.diagnosisAnswers || {},
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
});

// Recommendation structure with enhanced completion tracking
export const createRecommendation = (data = {}) => ({
  id: data.id || generateId(),
  userId: data.userId || '',
  title: data.title || '',
  description: data.description || '',
  category: data.category || '',
  priority: data.priority || RECOMMENDATION_PRIORITY.MEDIUM,
  businessStage: data.businessStage || '',
  actionItems: data.actionItems || [],
  resources: data.resources || [],
  estimatedTimeframe: data.estimatedTimeframe || '',
  expectedImpact: data.expectedImpact || '',
  reasoning: data.reasoning || '',

  // Enhanced completion tracking
  status: data.status || 'pending', // pending, in_progress, completed, skipped
  isCompleted: data.isCompleted || false,
  isBookmarked: data.isBookmarked || false,
  completedAt: data.completedAt || null,
  startedAt: data.startedAt || null,

  // Enhanced progress tracking with steps
  progress: data.progress || 0, // 0-100 percentage
  progressSteps: data.progressSteps || [],
  currentStep: data.currentStep || 0,
  totalSteps: data.totalSteps || 0,
  completionNotes: data.completionNotes || '',
  userRating: data.userRating || null, // 1-5 stars
  userFeedback: data.userFeedback || '',
  implementationDifficulty: data.implementationDifficulty || null,
  actualImpact: data.actualImpact || null,

  // Milestones and checkpoints
  milestones: data.milestones || [],
  checkpoints: data.checkpoints || [],

  // Completion history and analytics
  completionHistory: data.completionHistory || [],
  viewCount: data.viewCount || 0,
  lastViewedAt: data.lastViewedAt || null,
  estimatedCompletionDate: data.estimatedCompletionDate || null,

  // Timestamps
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
});

// Action item structure
export const createActionItem = (data = {}) => ({
  id: data.id || generateId(),
  title: data.title || '',
  description: data.description || '',
  priority: data.priority || RECOMMENDATION_PRIORITY.MEDIUM,
  estimatedHours: data.estimatedHours || 0,
  deadline: data.deadline || null,
  isCompleted: data.isCompleted || false,
  completedAt: data.completedAt || null,
  resources: data.resources || []
});

// Resource structure
export const createResource = (data = {}) => ({
  id: data.id || generateId(),
  title: data.title || '',
  description: data.description || '',
  type: data.type || 'article', // article, video, tool, course, template
  url: data.url || '',
  isExternal: data.isExternal || true,
  language: data.language || 'id',
  difficulty: data.difficulty || 'beginner' // beginner, intermediate, advanced
});

// AI prompt context structure
export const createAIContext = (businessProfile, diagnosisData) => ({
  businessProfile: {
    name: businessProfile.businessName,
    category: businessProfile.businessCategory,
    stage: businessProfile.businessStage,
    employeeCount: businessProfile.employeeCount,
    monthlyRevenue: businessProfile.monthlyRevenue,
    businessAge: businessProfile.businessAge,
    location: businessProfile.location,
    challenges: businessProfile.challenges,
    goals: businessProfile.goals
  },
  diagnosisResults: {
    currentStage: diagnosisData.currentStage,
    answers: diagnosisData.answers,
    strengths: diagnosisData.strengths || [],
    weaknesses: diagnosisData.weaknesses || [],
    opportunities: diagnosisData.opportunities || []
  },
  context: {
    country: 'Indonesia',
    targetAudience: 'UMKM (Usaha Mikro, Kecil, dan Menengah)',
    language: 'Indonesian',
    culturalContext: 'Indonesian business environment',
    regulations: 'Indonesian business regulations and compliance'
  }
});

// Utility functions
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Progress step structure
export const createProgressStep = (data = {}) => ({
  id: data.id || generateId(),
  title: data.title || '',
  description: data.description || '',
  order: data.order || 0,
  status: data.status || 'pending', // pending, in_progress, completed, skipped
  isRequired: data.isRequired || true,
  estimatedDuration: data.estimatedDuration || '', // e.g., "2 hari", "1 minggu"
  resources: data.resources || [],
  tips: data.tips || [],
  completedAt: data.completedAt || null,
  startedAt: data.startedAt || null,
  notes: data.notes || '',
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
});

// Milestone structure
export const createMilestone = (data = {}) => ({
  id: data.id || generateId(),
  title: data.title || '',
  description: data.description || '',
  targetDate: data.targetDate || null,
  completedAt: data.completedAt || null,
  isCompleted: data.isCompleted || false,
  requiredSteps: data.requiredSteps || [], // Array of step IDs
  reward: data.reward || '', // Achievement or benefit
  icon: data.icon || '🎯',
  createdAt: data.createdAt || new Date().toISOString()
});

// Checkpoint structure
export const createCheckpoint = (data = {}) => ({
  id: data.id || generateId(),
  stepId: data.stepId || '',
  title: data.title || '',
  description: data.description || '',
  isCompleted: data.isCompleted || false,
  completedAt: data.completedAt || null,
  order: data.order || 0,
  createdAt: data.createdAt || new Date().toISOString()
});

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getBusinessStageInfo = (stage) => {
  const stageInfo = {
    [BUSINESS_STAGES.EXISTENCE]: {
      name: 'Tahap Keberadaan',
      description: 'Fokus pada bertahan hidup dan membangun basis pelanggan',
      keyFocus: ['Validasi produk', 'Mencari pelanggan', 'Cashflow positif'],
      challenges: ['Modal terbatas', 'Belum ada sistem', 'Ketidakpastian pasar']
    },
    [BUSINESS_STAGES.SURVIVAL]: {
      name: 'Tahap Bertahan',
      description: 'Mencapai break-even dan stabilitas operasional',
      keyFocus: ['Efisiensi operasional', 'Kontrol keuangan', 'Kualitas produk'],
      challenges: ['Kompetisi', 'Manajemen kas', 'Kualitas konsisten']
    },
    [BUSINESS_STAGES.SUCCESS]: {
      name: 'Tahap Sukses',
      description: 'Bisnis stabil dengan pilihan untuk tumbuh atau mempertahankan',
      keyFocus: ['Ekspansi pasar', 'Diversifikasi', 'Sistem manajemen'],
      challenges: ['Keputusan strategis', 'Delegasi', 'Inovasi berkelanjutan']
    },
    [BUSINESS_STAGES.TAKEOFF]: {
      name: 'Tahap Lepas Landas',
      description: 'Pertumbuhan cepat dengan kebutuhan sumber daya besar',
      keyFocus: ['Skalabilitas', 'Manajemen tim', 'Pendanaan pertumbuhan'],
      challenges: ['Manajemen pertumbuhan', 'Kontrol kualitas', 'Struktur organisasi']
    },
    [BUSINESS_STAGES.RESOURCE_MATURITY]: {
      name: 'Tahap Kedewasaan Sumber Daya',
      description: 'Bisnis mapan dengan fokus pada efisiensi dan inovasi',
      keyFocus: ['Inovasi', 'Efisiensi', 'Ekspansi strategis'],
      challenges: ['Birokrasi', 'Inovasi berkelanjutan', 'Adaptasi pasar']
    }
  };
  
  return stageInfo[stage] || stageInfo[BUSINESS_STAGES.EXISTENCE];
};

export const getPriorityColor = (priority) => {
  const colors = {
    [RECOMMENDATION_PRIORITY.CRITICAL]: '#ef4444',
    [RECOMMENDATION_PRIORITY.HIGH]: '#f59e0b',
    [RECOMMENDATION_PRIORITY.MEDIUM]: '#3b82f6',
    [RECOMMENDATION_PRIORITY.LOW]: '#10b981'
  };
  return colors[priority] || colors[RECOMMENDATION_PRIORITY.MEDIUM];
};

export const getCategoryIcon = (category) => {
  const icons = {
    [RECOMMENDATION_CATEGORIES.FINANCIAL_MANAGEMENT]: '💰',
    [RECOMMENDATION_CATEGORIES.MARKETING_SALES]: '📈',
    [RECOMMENDATION_CATEGORIES.OPERATIONS]: '⚙️',
    [RECOMMENDATION_CATEGORIES.HUMAN_RESOURCES]: '👥',
    [RECOMMENDATION_CATEGORIES.TECHNOLOGY]: '💻',
    [RECOMMENDATION_CATEGORIES.LEGAL_COMPLIANCE]: '📋',
    [RECOMMENDATION_CATEGORIES.GROWTH_STRATEGY]: '🚀',
    [RECOMMENDATION_CATEGORIES.FINANCIAL_LITERACY]: '📚'
  };
  return icons[category] || '💡';
};
