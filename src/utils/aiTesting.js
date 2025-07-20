/**
 * AI Testing and Validation Utilities for SiNaK PWA
 * Provides tools for testing AI prompts, validating responses, and monitoring AI performance
 */

import { createAIContext } from '../types/recommendation.js';

/**
 * Sample business profiles for testing different scenarios
 */
export const TEST_BUSINESS_PROFILES = {
  // Small warung/food stall
  warung: {
    userId: 'test-warung-001',
    businessName: 'Warung Makan Bu Sari',
    category: 'food_beverage',
    stage: 'survival',
    location: 'Jakarta Selatan',
    employeeCount: 2,
    monthlyRevenue: 15000000, // 15 juta
    challenges: ['Persaingan ketat', 'Modal terbatas', 'Manajemen keuangan'],
    goals: ['Meningkatkan penjualan', 'Memperluas menu', 'Digitalisasi'],
    description: 'Warung makan tradisional yang menyajikan masakan rumahan dengan 2 karyawan'
  },

  // Online fashion boutique
  fashion: {
    userId: 'test-fashion-001',
    businessName: 'Hijab Cantik Store',
    category: 'fashion_retail',
    stage: 'success',
    location: 'Bandung',
    employeeCount: 5,
    monthlyRevenue: 45000000, // 45 juta
    challenges: ['Inventory management', 'Customer retention', 'Kompetisi online'],
    goals: ['Ekspansi ke marketplace', 'Brand awareness', 'Otomasi proses'],
    description: 'Toko online hijab dan fashion muslim dengan fokus kualitas premium'
  },

  // Tech startup
  tech: {
    userId: 'test-tech-001',
    businessName: 'EduTech Indonesia',
    category: 'technology',
    stage: 'take_off',
    location: 'Jakarta',
    employeeCount: 15,
    monthlyRevenue: 120000000, // 120 juta
    challenges: ['Scaling team', 'Product development', 'Market penetration'],
    goals: ['Series A funding', 'User acquisition', 'Product expansion'],
    description: 'Platform edukasi online untuk pelajar SMA dengan fitur AI tutoring'
  },

  // Traditional craft business
  craft: {
    userId: 'test-craft-001',
    businessName: 'Kerajinan Bambu Nusantara',
    category: 'handicraft',
    stage: 'existence',
    location: 'Yogyakarta',
    employeeCount: 3,
    monthlyRevenue: 8000000, // 8 juta
    challenges: ['Akses pasar', 'Digitalisasi', 'Standarisasi produk'],
    goals: ['Online presence', 'Export market', 'Skill development'],
    description: 'Usaha kerajinan bambu tradisional dengan teknik turun temurun'
  }
};

/**
 * Sample diagnosis data for different business scenarios
 */
export const TEST_DIAGNOSIS_DATA = {
  warung: {
    strengths: ['Lokasi strategis', 'Rasa masakan enak', 'Pelanggan loyal'],
    weaknesses: ['Tidak ada sistem POS', 'Pencatatan manual', 'Tidak ada online presence'],
    opportunities: ['Delivery online', 'Catering service', 'Menu diet sehat'],
    threats: ['Kompetitor franchise', 'Kenaikan harga bahan', 'Regulasi kesehatan'],
    currentChallenges: ['Cash flow tidak stabil', 'Sulit tracking inventory', 'Customer acquisition terbatas'],
    businessGoals: ['Omzet naik 30%', 'Sistem keuangan digital', 'Ekspansi delivery'],
    marketPosition: 'Local favorite dengan potensi digital growth',
    competitiveAdvantage: 'Rasa autentik dan harga terjangkau'
  },

  fashion: {
    strengths: ['Brand recognition', 'Quality products', 'Social media presence'],
    weaknesses: ['Limited inventory system', 'Manual order processing', 'No customer analytics'],
    opportunities: ['Marketplace expansion', 'Influencer partnerships', 'International market'],
    threats: ['Fast fashion competition', 'Economic downturn', 'Changing trends'],
    currentChallenges: ['Inventory optimization', 'Customer lifetime value', 'Operational efficiency'],
    businessGoals: ['Revenue growth 50%', 'Automated systems', 'Brand expansion'],
    marketPosition: 'Premium hijab brand with loyal customer base',
    competitiveAdvantage: 'High quality materials and exclusive designs'
  },

  tech: {
    strengths: ['Innovative product', 'Strong team', 'Early traction'],
    weaknesses: ['Limited funding', 'Scalability challenges', 'Market education needed'],
    opportunities: ['Government digitalization push', 'Remote learning trend', 'AI advancement'],
    threats: ['Big tech competition', 'Regulatory changes', 'Economic uncertainty'],
    currentChallenges: ['User acquisition cost', 'Product-market fit', 'Team scaling'],
    businessGoals: ['10x user growth', 'Funding round', 'Product expansion'],
    marketPosition: 'Emerging player in EdTech with unique AI features',
    competitiveAdvantage: 'AI-powered personalized learning'
  },

  craft: {
    strengths: ['Traditional skills', 'Unique products', 'Sustainable materials'],
    weaknesses: ['Limited market reach', 'No digital presence', 'Inconsistent quality'],
    opportunities: ['Export market', 'Eco-friendly trend', 'Tourism recovery'],
    threats: ['Mass production competition', 'Raw material scarcity', 'Skill transfer gap'],
    currentChallenges: ['Market access', 'Quality standardization', 'Digital adoption'],
    businessGoals: ['Online sales channel', 'Export readiness', 'Skill certification'],
    marketPosition: 'Traditional craft with modern market potential',
    competitiveAdvantage: 'Authentic traditional techniques and sustainable practices'
  }
};

/**
 * Validate AI response structure and content quality
 */
export const validateAIResponse = (response, expectedFields = []) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0,
    details: {}
  };

  try {
    // Parse JSON if string
    const data = typeof response === 'string' ? JSON.parse(response) : response;

    // Check basic structure
    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      validation.errors.push('Missing or invalid recommendations array');
      validation.isValid = false;
      return validation;
    }

    const recommendations = data.recommendations;
    validation.details.recommendationCount = recommendations.length;

    // Validate each recommendation
    recommendations.forEach((rec, index) => {
      const recValidation = validateRecommendation(rec, index);
      if (!recValidation.isValid) {
        validation.errors.push(...recValidation.errors);
        validation.isValid = false;
      }
      validation.warnings.push(...recValidation.warnings);
    });

    // Check summary if present
    if (data.summary) {
      validation.details.hasSummary = true;
      if (data.summary.totalRecommendations !== recommendations.length) {
        validation.warnings.push('Summary count mismatch with actual recommendations');
      }
    }

    // Calculate quality score
    validation.score = calculateQualityScore(data);

  } catch (error) {
    validation.errors.push(`JSON parsing error: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
};

/**
 * Validate individual recommendation structure and content
 */
const validateRecommendation = (rec, index) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Required fields
  const requiredFields = ['title', 'description', 'category', 'priority'];
  requiredFields.forEach(field => {
    if (!rec[field]) {
      validation.errors.push(`Recommendation ${index + 1}: Missing required field '${field}'`);
      validation.isValid = false;
    }
  });

  // Content quality checks
  if (rec.title && rec.title.length < 10) {
    validation.warnings.push(`Recommendation ${index + 1}: Title too short`);
  }

  if (rec.description && rec.description.length < 50) {
    validation.warnings.push(`Recommendation ${index + 1}: Description too short`);
  }

  // Progress steps validation
  if (rec.progressSteps && Array.isArray(rec.progressSteps)) {
    rec.progressSteps.forEach((step, stepIndex) => {
      if (!step.title || !step.description) {
        validation.warnings.push(`Recommendation ${index + 1}, Step ${stepIndex + 1}: Missing title or description`);
      }
    });
  }

  // Milestones validation
  if (rec.milestones && Array.isArray(rec.milestones)) {
    rec.milestones.forEach((milestone, milestoneIndex) => {
      if (!milestone.title || !milestone.description) {
        validation.warnings.push(`Recommendation ${index + 1}, Milestone ${milestoneIndex + 1}: Missing title or description`);
      }
    });
  }

  return validation;
};

/**
 * Calculate quality score for AI response (0-100)
 */
const calculateQualityScore = (data) => {
  let score = 0;
  const recommendations = data.recommendations;

  // Base score for valid structure
  score += 20;

  // Score for recommendation count (optimal: 6-10)
  const recCount = recommendations.length;
  if (recCount >= 6 && recCount <= 10) {
    score += 15;
  } else if (recCount >= 4 && recCount <= 12) {
    score += 10;
  } else {
    score += 5;
  }

  // Score for content quality
  let contentScore = 0;
  recommendations.forEach(rec => {
    // Title quality
    if (rec.title && rec.title.length >= 15 && rec.title.length <= 80) {
      contentScore += 2;
    }

    // Description quality
    if (rec.description && rec.description.length >= 100) {
      contentScore += 3;
    }

    // Progress steps
    if (rec.progressSteps && rec.progressSteps.length >= 2) {
      contentScore += 5;
    }

    // Milestones
    if (rec.milestones && rec.milestones.length >= 1) {
      contentScore += 3;
    }

    // Indonesian context
    if (rec.description && (
      rec.description.includes('UMKM') ||
      rec.description.includes('Indonesia') ||
      rec.description.includes('Rupiah') ||
      rec.description.includes('regulasi')
    )) {
      contentScore += 2;
    }
  });

  score += Math.min(contentScore, 40);

  // Score for summary
  if (data.summary) {
    score += 10;
  }

  // Score for diversity (different categories and priorities)
  const categories = new Set(recommendations.map(r => r.category));
  const priorities = new Set(recommendations.map(r => r.priority));
  
  score += Math.min(categories.size * 2, 10);
  score += Math.min(priorities.size * 2, 5);

  return Math.min(score, 100);
};

/**
 * Generate test context for AI prompt testing
 */
export const generateTestContext = (profileKey = 'warung') => {
  const profile = TEST_BUSINESS_PROFILES[profileKey];
  const diagnosis = TEST_DIAGNOSIS_DATA[profileKey];

  if (!profile || !diagnosis) {
    throw new Error(`Test profile '${profileKey}' not found`);
  }

  return createAIContext(profile, diagnosis);
};

/**
 * Performance metrics for AI testing
 */
export const measureAIPerformance = async (testFunction, iterations = 3) => {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      const endTime = performance.now();
      
      results.push({
        iteration: i + 1,
        success: true,
        duration: endTime - startTime,
        result: result,
        validation: validateAIResponse(result)
      });
    } catch (error) {
      const endTime = performance.now();
      
      results.push({
        iteration: i + 1,
        success: false,
        duration: endTime - startTime,
        error: error.message,
        validation: null
      });
    }
  }

  // Calculate summary metrics
  const successful = results.filter(r => r.success);
  const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
  const avgScore = successful.reduce((sum, r) => sum + (r.validation?.score || 0), 0) / successful.length;

  return {
    totalIterations: iterations,
    successfulIterations: successful.length,
    successRate: (successful.length / iterations) * 100,
    averageDuration: avgDuration,
    averageQualityScore: avgScore,
    results: results
  };
};

/**
 * Export test utilities for console testing
 */
export const AITestUtils = {
  profiles: TEST_BUSINESS_PROFILES,
  diagnosis: TEST_DIAGNOSIS_DATA,
  validate: validateAIResponse,
  generateContext: generateTestContext,
  measurePerformance: measureAIPerformance
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.AITestUtils = AITestUtils;
}
