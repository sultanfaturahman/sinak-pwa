/**
 * Firebase AI Service - Using Firebase 12.0.0 AI Logic client SDKs
 * Provides AI-powered business recommendations using Gemini Developer API
 */

import { getGenerativeModel } from 'firebase/ai';
import { ai } from './firebase.js';

// AI Configuration
const AI_CONFIG = {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json'
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
};

// Indonesian UMKM-specific prompts
const UMKM_PROMPTS = {
  businessAnalysis: `
Anda adalah konsultan bisnis UMKM Indonesia yang berpengalaman. Analisis profil bisnis berikut dan berikan rekomendasi yang praktis dan dapat diterapkan.

Berikan respons dalam format JSON dengan struktur:
{
  "analysis": {
    "strengths": ["kekuatan 1", "kekuatan 2"],
    "weaknesses": ["kelemahan 1", "kelemahan 2"],
    "opportunities": ["peluang 1", "peluang 2"],
    "threats": ["ancaman 1", "ancaman 2"]
  },
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Judul Rekomendasi",
      "description": "Deskripsi detail rekomendasi",
      "category": "marketing|operations|finance|digital",
      "priority": "high|medium|low",
      "estimatedTime": "1-2 minggu",
      "difficulty": "easy|medium|hard",
      "expectedImpact": "Dampak yang diharapkan",
      "steps": ["langkah 1", "langkah 2", "langkah 3"]
    }
  ],
  "nextSteps": ["langkah selanjutnya 1", "langkah selanjutnya 2"]
}

Fokus pada:
1. Solusi praktis untuk UMKM Indonesia
2. Pertimbangan budget terbatas
3. Pemanfaatan teknologi digital
4. Strategi pemasaran lokal
5. Kepatuhan regulasi Indonesia
`,

  marketingStrategy: `
Sebagai ahli pemasaran digital untuk UMKM Indonesia, buatkan strategi pemasaran yang efektif dan terjangkau.

Berikan respons dalam format JSON dengan struktur:
{
  "strategy": {
    "targetAudience": "Deskripsi target audience",
    "valueProposition": "Proposisi nilai unik",
    "channels": ["channel 1", "channel 2"],
    "budget": "Estimasi budget bulanan"
  },
  "tactics": [
    {
      "id": "tactic-1",
      "name": "Nama Taktik",
      "description": "Deskripsi taktik",
      "platform": "Instagram|Facebook|TikTok|WhatsApp|Website",
      "cost": "Gratis|Rendah|Sedang",
      "timeline": "1-4 minggu",
      "kpi": ["metrik 1", "metrik 2"]
    }
  ],
  "contentIdeas": [
    {
      "type": "post|story|video|carousel",
      "topic": "Topik konten",
      "caption": "Contoh caption",
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}

Fokus pada platform yang populer di Indonesia dan strategi yang sesuai dengan budaya lokal.
`,

  operationalImprovement: `
Sebagai konsultan operasional UMKM, berikan rekomendasi untuk meningkatkan efisiensi operasional.

Berikan respons dalam format JSON dengan struktur:
{
  "currentState": "Analisis kondisi operasional saat ini",
  "improvements": [
    {
      "id": "imp-1",
      "area": "Inventory|Production|Service|Quality",
      "title": "Judul Perbaikan",
      "description": "Deskripsi detail",
      "implementation": ["langkah 1", "langkah 2"],
      "tools": ["alat/software yang dibutuhkan"],
      "cost": "Estimasi biaya",
      "roi": "Return on investment yang diharapkan"
    }
  ],
  "digitalTools": [
    {
      "name": "Nama Tool",
      "purpose": "Tujuan penggunaan",
      "cost": "Gratis|Berbayar",
      "difficulty": "Mudah|Sedang|Sulit"
    }
  ]
}

Prioritaskan solusi yang mudah diimplementasi dan cost-effective untuk UMKM Indonesia.
`
};

/**
 * Initialize Gemini model with Firebase AI
 */
const initializeGeminiModel = () => {
  if (!ai) {
    throw new Error('Firebase AI not initialized. Please check your configuration.');
  }

  try {
    const model = getGenerativeModel(ai, AI_CONFIG);
    console.log('✅ Gemini model initialized with Firebase AI');
    return model;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini model:', error);
    throw error;
  }
};

/**
 * Generate business analysis and recommendations
 */
export const generateBusinessRecommendations = async (businessProfile) => {
  try {
    console.log('🤖 Generating business recommendations with Firebase AI...');
    
    const model = initializeGeminiModel();
    
    const prompt = `${UMKM_PROMPTS.businessAnalysis}

PROFIL BISNIS:
- Nama Usaha: ${businessProfile.businessName || 'Tidak disebutkan'}
- Kategori: ${businessProfile.category || 'Tidak disebutkan'}
- Lokasi: ${businessProfile.location || 'Tidak disebutkan'}
- Jumlah Karyawan: ${businessProfile.employeeCount || 'Tidak disebutkan'}
- Omzet Bulanan: ${businessProfile.monthlyRevenue || 'Tidak disebutkan'}
- Target Pasar: ${businessProfile.targetMarket || 'Tidak disebutkan'}
- Tantangan Utama: ${businessProfile.mainChallenges || 'Tidak disebutkan'}
- Tujuan Bisnis: ${businessProfile.businessGoals || 'Tidak disebutkan'}

Berikan analisis dan rekomendasi yang spesifik untuk profil bisnis ini.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Business recommendations generated successfully');
    
    // Parse JSON response
    try {
      const recommendations = JSON.parse(text);
      return {
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON response, returning raw text');
      return {
        success: true,
        data: { rawResponse: text },
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('❌ Failed to generate business recommendations:', error);
    
    // Return fallback recommendations
    return {
      success: false,
      error: error.message,
      data: getFallbackRecommendations(businessProfile),
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Generate marketing strategy
 */
export const generateMarketingStrategy = async (businessProfile) => {
  try {
    console.log('📈 Generating marketing strategy with Firebase AI...');
    
    const model = initializeGeminiModel();
    
    const prompt = `${UMKM_PROMPTS.marketingStrategy}

PROFIL BISNIS:
- Nama Usaha: ${businessProfile.businessName || 'Tidak disebutkan'}
- Kategori: ${businessProfile.category || 'Tidak disebutkan'}
- Target Pasar: ${businessProfile.targetMarket || 'Tidak disebutkan'}
- Budget Marketing: ${businessProfile.marketingBudget || 'Terbatas'}
- Platform Saat Ini: ${businessProfile.currentPlatforms || 'Tidak ada'}

Buatkan strategi pemasaran yang sesuai dengan profil bisnis ini.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Marketing strategy generated successfully');
    
    try {
      const strategy = JSON.parse(text);
      return {
        success: true,
        data: strategy,
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      return {
        success: true,
        data: { rawResponse: text },
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('❌ Failed to generate marketing strategy:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Generate operational improvements
 */
export const generateOperationalImprovements = async (businessProfile) => {
  try {
    console.log('⚙️ Generating operational improvements with Firebase AI...');
    
    const model = initializeGeminiModel();
    
    const prompt = `${UMKM_PROMPTS.operationalImprovement}

PROFIL BISNIS:
- Nama Usaha: ${businessProfile.businessName || 'Tidak disebutkan'}
- Kategori: ${businessProfile.category || 'Tidak disebutkan'}
- Proses Utama: ${businessProfile.mainProcesses || 'Tidak disebutkan'}
- Tantangan Operasional: ${businessProfile.operationalChallenges || 'Tidak disebutkan'}
- Teknologi Saat Ini: ${businessProfile.currentTechnology || 'Manual'}

Berikan rekomendasi perbaikan operasional yang praktis dan terjangkau.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Operational improvements generated successfully');
    
    try {
      const improvements = JSON.parse(text);
      return {
        success: true,
        data: improvements,
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      return {
        success: true,
        data: { rawResponse: text },
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error('❌ Failed to generate operational improvements:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Fallback recommendations when AI fails
 */
const getFallbackRecommendations = (businessProfile) => {
  return {
    analysis: {
      strengths: ["Memiliki produk/layanan yang dibutuhkan pasar"],
      weaknesses: ["Perlu analisis lebih mendalam"],
      opportunities: ["Digitalisasi bisnis", "Ekspansi pasar online"],
      threats: ["Persaingan yang ketat"]
    },
    recommendations: [
      {
        id: "fallback-1",
        title: "Tingkatkan Kehadiran Digital",
        description: "Buat akun media sosial dan website sederhana untuk menjangkau lebih banyak pelanggan",
        category: "digital",
        priority: "high",
        estimatedTime: "2-3 minggu",
        difficulty: "medium",
        expectedImpact: "Meningkatkan visibilitas dan jangkauan pasar",
        steps: [
          "Buat akun Instagram dan Facebook bisnis",
          "Posting konten produk secara rutin",
          "Interaksi dengan pelanggan melalui komentar dan DM"
        ]
      }
    ],
    nextSteps: [
      "Lengkapi profil bisnis dengan informasi yang lebih detail",
      "Identifikasi target pasar yang spesifik"
    ]
  };
};

/**
 * Check if Firebase AI is available
 */
export const isFirebaseAIAvailable = () => {
  return ai !== null;
};

console.log('🤖 Firebase AI Service initialized');
