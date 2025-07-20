/**
 * AI-powered Business Recommendation Service
 * SiNaik PWA - Sistem Intervensi Terpadu UMKM
 */

import {
  createRecommendation,
  createActionItem,
  createResource,
  createAIContext,
  createProgressStep,
  createMilestone,
  createCheckpoint,
  BUSINESS_STAGES,
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_PRIORITY
} from '../types/recommendation.js';
// Firebase AI not available in v10.12.5, using direct Gemini API

// Enhanced Gemini API Configuration
const AI_CONFIG = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  MODEL: 'gemini-2.0-flash',
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.7,
  TOP_P: 0.8,
  TOP_K: 40,
  ENABLED: !!(import.meta.env.VITE_GEMINI_API_KEY), // Check if API key is available

  // Enhanced configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 45000,
  BYPASS_MODE: import.meta.env.VITE_BYPASS_AI === 'true', // Only bypass if explicitly set
  FALLBACK_ENABLED: true,

  // Safety settings for business content
  SAFETY_SETTINGS: [
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

/**
 * Create simple recommendations for testing UI without JSON parsing
 */
const createSimpleRecommendations = (userId) => {
  console.log('🔧 Creating simple test recommendations for UI testing');

  const recommendations = [
    createRecommendation({
      userId,
      title: 'Optimasi Manajemen Keuangan',
      description: 'Implementasikan sistem pencatatan keuangan yang lebih terstruktur untuk meningkatkan kontrol cash flow dan profitabilitas bisnis.',
      category: 'financial_management',
      priority: 'high',
      estimatedTimeframe: '2-3 minggu',
      expectedImpact: 'Peningkatan kontrol keuangan dan visibilitas cash flow',
      reasoning: 'Manajemen keuangan yang baik adalah fondasi bisnis yang sehat',
      actionItems: [
        createActionItem({
          title: 'Setup sistem pencatatan',
          description: 'Implementasikan software akuntansi atau sistem pencatatan manual yang konsisten',
          estimatedHours: 8,
          deadline: null
        })
      ],
      resources: [
        createResource({
          title: 'Panduan Manajemen Keuangan UMKM',
          description: 'Panduan lengkap untuk mengelola keuangan bisnis kecil',
          type: 'guide',
          url: '#'
        })
      ]
    }),

    createRecommendation({
      userId,
      title: 'Strategi Digital Marketing',
      description: 'Kembangkan strategi pemasaran digital yang efektif untuk menjangkau target pasar yang lebih luas dan meningkatkan brand awareness.',
      category: 'marketing_sales',
      priority: 'medium',
      estimatedTimeframe: '3-4 minggu',
      expectedImpact: 'Peningkatan jangkauan pasar dan brand awareness',
      reasoning: 'Digital marketing adalah kunci pertumbuhan bisnis di era digital',
      actionItems: [
        createActionItem({
          title: 'Buat konten media sosial',
          description: 'Kembangkan strategi konten untuk platform media sosial utama',
          estimatedHours: 12,
          deadline: null
        })
      ],
      resources: [
        createResource({
          title: 'Panduan Digital Marketing untuk UMKM',
          description: 'Strategi pemasaran digital yang efektif untuk bisnis kecil',
          type: 'guide',
          url: '#'
        })
      ]
    }),

    createRecommendation({
      userId,
      title: 'Peningkatan Efisiensi Operasional',
      description: 'Evaluasi dan optimasi proses operasional untuk mengurangi waste dan meningkatkan produktivitas tim.',
      category: 'operations',
      priority: 'medium',
      estimatedTimeframe: '2-4 minggu',
      expectedImpact: 'Peningkatan efisiensi dan produktivitas operasional',
      reasoning: 'Operasional yang efisien mengurangi biaya dan meningkatkan kepuasan pelanggan',
      actionItems: [
        createActionItem({
          title: 'Audit proses operasional',
          description: 'Lakukan evaluasi menyeluruh terhadap proses bisnis saat ini',
          estimatedHours: 16,
          deadline: null
        })
      ],
      resources: [
        createResource({
          title: 'Panduan Optimasi Operasional',
          description: 'Cara meningkatkan efisiensi operasional bisnis',
          type: 'guide',
          url: '#'
        })
      ]
    })
  ];

  console.log(`✅ Created ${recommendations.length} simple test recommendations`);
  return recommendations;
};

/**
 * Attempt Firebase AI with Direct Gemini API (with enhanced error handling)
 */
const attemptFirebaseAI = async (businessProfile, diagnosisData) => {
  console.log('🔥 Attempting Firebase AI with Direct Gemini API...');

  // Create AI context
  const aiContext = createAIContext(businessProfile, diagnosisData);

  // Generate AI prompt for Gemini
  const prompt = createGeminiPrompt(aiContext);

  // Call Direct Gemini API with enhanced error handling
  console.log('📤 Sending prompt to Gemini (length:', prompt.length, 'chars)');

  const response = await fetch(AI_CONFIG.GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': AI_CONFIG.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: AI_CONFIG.TEMPERATURE,
        topK: AI_CONFIG.TOP_K,
        topP: AI_CONFIG.TOP_P,
        maxOutputTokens: AI_CONFIG.MAX_TOKENS,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
  });

  if (!response.ok) {
    let errorMessage = `Gemini API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage += ` - ${errorData.error.message}`;
      }
    } catch (parseError) {
      errorMessage += ` - ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Extract response from Gemini format
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response format from Gemini API');
  }

  const aiResponse = data.candidates[0].content.parts[0].text;

  if (!aiResponse) {
    throw new Error('Empty response from Gemini model');
  }

  console.log('📥 Received AI response (length:', aiResponse.length, 'chars)');

  // Parse AI response and create recommendations
  const recommendations = parseAIResponse(aiResponse, businessProfile.userId);

  if (recommendations.length === 0) {
    throw new Error('No valid recommendations generated from AI response');
  }

  console.log('✅ Firebase AI successful, generated', recommendations.length, 'recommendations');
  return recommendations;
};

/**
 * Enhanced AI with retry logic, better error handling, and sophisticated prompting
 */
const attemptEnhancedAI = async (businessProfile, diagnosisData) => {
  console.log('🤖 Attempting Enhanced AI with sophisticated prompting...');

  const aiContext = createAIContext(businessProfile, diagnosisData);
  const prompt = createGeminiPrompt(aiContext);

  let lastError = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= AI_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`📤 AI Attempt ${attempt}/${AI_CONFIG.MAX_RETRIES} - Sending enhanced prompt (${prompt.length} chars)`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.TIMEOUT);

      const response = await fetch(AI_CONFIG.GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': AI_CONFIG.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: AI_CONFIG.TEMPERATURE,
            topK: AI_CONFIG.TOP_K,
            topP: AI_CONFIG.TOP_P,
            maxOutputTokens: AI_CONFIG.MAX_TOKENS,
            candidateCount: 1
          },
          safetySettings: AI_CONFIG.SAFETY_SETTINGS
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `Enhanced AI error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          }
        } catch (parseError) {
          errorMessage += ` - ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Enhanced AI');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty response from Enhanced AI model');
      }

      console.log(`📥 Enhanced AI response received (${aiResponse.length} chars)`);

      // Parse AI response with enhanced error handling
      const recommendations = parseEnhancedAIResponse(aiResponse, businessProfile.userId);

      if (!recommendations || recommendations.length === 0) {
        throw new Error('No valid recommendations generated from Enhanced AI response');
      }

      console.log(`✅ Enhanced AI successful on attempt ${attempt}, generated ${recommendations.length} recommendations`);
      return recommendations;

    } catch (error) {
      lastError = error;
      console.error(`❌ Enhanced AI attempt ${attempt} failed:`, error.message);

      if (attempt < AI_CONFIG.MAX_RETRIES) {
        const delay = AI_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Enhanced AI failed after ${AI_CONFIG.MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
};

/**
 * Generate AI-powered business recommendations using layered fallback approach
 */
export const generateAIRecommendations = async (businessProfile, diagnosisData) => {
  try {
    console.log('🤖 Starting AI recommendation generation process...');
    console.log('🔍 DEBUG: businessProfile:', businessProfile);
    console.log('🔍 DEBUG: diagnosisData:', diagnosisData);

    // Check environment variables and AI configuration
    console.log('🔍 DEBUG: AI_CONFIG.ENABLED:', AI_CONFIG.ENABLED);
    console.log('🔍 DEBUG: AI_CONFIG.BYPASS_MODE:', AI_CONFIG.BYPASS_MODE);
    console.log('🔍 DEBUG: AI_CONFIG.GEMINI_API_KEY exists:', !!AI_CONFIG.GEMINI_API_KEY);
    console.log('🔍 DEBUG: VITE_BYPASS_JSON_PARSING:', import.meta.env.VITE_BYPASS_JSON_PARSING);

    // Strategy 1: Use bypass mode only if explicitly enabled
    if (AI_CONFIG.BYPASS_MODE || import.meta.env.VITE_BYPASS_JSON_PARSING === 'true') {
      console.log('🔧 BYPASS MODE: Creating simple recommendations (explicitly enabled)');
      const simpleRecs = createSimpleRecommendations(businessProfile.userId);
      console.log('🔧 BYPASS: Created recommendations:', simpleRecs.length);
      return simpleRecs;
    }

    // Strategy 2: Try Real AI (Primary method)
    if (AI_CONFIG.ENABLED && AI_CONFIG.GEMINI_API_KEY) {
      console.log('🤖 Attempting Real AI with Enhanced Gemini API...');

      try {
        const aiRecommendations = await attemptEnhancedAI(businessProfile, diagnosisData);
        if (aiRecommendations && aiRecommendations.length > 0) {
          console.log('✅ Enhanced AI successful, returning', aiRecommendations.length, 'recommendations');
          return aiRecommendations;
        }
      } catch (aiError) {
        console.error('❌ Enhanced AI failed:', aiError);

        // Try fallback AI method
        if (AI_CONFIG.FALLBACK_ENABLED) {
          console.log('🔄 Trying fallback AI method...');
          try {
            const fallbackRecommendations = await attemptFirebaseAI(businessProfile, diagnosisData);
            if (fallbackRecommendations && fallbackRecommendations.length > 0) {
              console.log('✅ Fallback AI successful, returning', fallbackRecommendations.length, 'recommendations');
              return fallbackRecommendations;
            }
          } catch (fallbackError) {
            console.error('❌ Fallback AI also failed:', fallbackError);
          }
        }
      }
    }

    // Strategy 3: Rule-based fallback (final fallback)
    console.warn('⚠️ All AI methods unavailable, using rule-based recommendations');
    return generateRuleBasedRecommendations(businessProfile);

  } catch (error) {
    console.error('❌ Error generating Firebase AI recommendations:', error);

    // Log request ID if available for debugging
    if (error.requestId) {
      console.error('🔍 Request ID:', error.requestId);
    }

    // Log specific error types for debugging
    if (error.message.includes('JSON')) {
      console.error('🔍 JSON parsing error - this may indicate prompt needs adjustment');
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack?.substring(0, 300)
      });
    } else if (error.message.includes('Empty response')) {
      console.error('🔍 Empty response - check Gemini model availability');
    } else if (error.message.includes('Firebase AI not available')) {
      console.error('🔍 Firebase AI not initialized - check Firebase console');
    } else if (error.code) {
      console.error('🔍 Error code:', error.code);
      console.error('🔍 Error details:', error.details || error.message);
    }

    // Fallback to rule-based recommendations
    console.log('🔄 Falling back to rule-based recommendations');
    return generateRuleBasedRecommendations(businessProfile);
  }
};

/**
 * Generate rule-based recommendations (fallback)
 */
export const generateRuleBasedRecommendations = (businessProfile) => {
  console.log('📋 Generating rule-based recommendations...');
  
  const recommendations = [];
  const stage = businessProfile.businessStage;
  const userId = businessProfile.userId;
  
  // Stage-specific recommendations
  switch (stage) {
    case BUSINESS_STAGES.EXISTENCE:
      recommendations.push(...getExistenceStageRecommendations(userId));
      break;
    case BUSINESS_STAGES.SURVIVAL:
      recommendations.push(...getSurvivalStageRecommendations(userId));
      break;
    case BUSINESS_STAGES.SUCCESS:
      recommendations.push(...getSuccessStageRecommendations(userId));
      break;
    case BUSINESS_STAGES.TAKEOFF:
      recommendations.push(...getTakeoffStageRecommendations(userId));
      break;
    case BUSINESS_STAGES.RESOURCE_MATURITY:
      recommendations.push(...getMaturityStageRecommendations(userId));
      break;
    default:
      recommendations.push(...getGeneralRecommendations(userId));
  }

  // Add financial literacy recommendations for all stages
  recommendations.push(...getFinancialLiteracyRecommendations(userId));
  
  console.log(`✅ Generated ${recommendations.length} rule-based recommendations`);
  return recommendations;
};

/**
 * Create sophisticated Gemini prompt for Indonesian UMKM recommendations
 */
const createGeminiPrompt = (aiContext) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Anda adalah Dr. Sari Wijaya, konsultan bisnis senior dengan 20+ tahun pengalaman khusus dalam pengembangan UMKM Indonesia. Anda memiliki:

🎓 KEAHLIAN UTAMA:
- PhD Manajemen Bisnis dengan spesialisasi UMKM Asia Tenggara
- Sertifikasi konsultan bisnis dari Kementerian Koperasi dan UKM RI
- Pengalaman mendampingi 500+ UMKM di berbagai sektor
- Pemahaman mendalam model Churchill & Lewis untuk konteks Indonesia
- Expertise dalam digitalisasi UMKM dan transformasi digital

🇮🇩 KONTEKS INDONESIA 2024:
- Regulasi terbaru: UU Cipta Kerja, PP UMKM No. 7/2021, Perpres 98/2021
- Program pemerintah: KUR (Kredit Usaha Rakyat), BPUM, PEN UMKM
- Tren pasar: E-commerce boom, digital payment adoption, sustainability focus
- Tantangan utama: Inflasi, supply chain disruption, talent shortage
- Peluang: Export digitalization, green economy, halal industry

📊 METODOLOGI ANALISIS:
- Gunakan framework Churchill & Lewis (5 tahap: Existence, Survival, Success, Take-off, Resource Maturity)
- Pertimbangkan konteks lokal: budaya kerja Indonesia, preferensi konsumen, infrastruktur
- Fokus pada solusi praktis, cost-effective, dan sustainable
- Prioritaskan quick wins dan long-term strategic moves

📋 TUGAS ANDA (${currentDate}):
Analisis mendalam profil bisnis dan data diagnosis berikut, lalu berikan 6-10 rekomendasi strategis yang:

✅ KRITERIA REKOMENDASI:
1. Spesifik untuk industri dan tahap bisnis klien
2. Actionable dengan langkah-langkah konkret dan timeline jelas
3. Relevan dengan kondisi pasar Indonesia 2024
4. Mempertimbangkan keterbatasan resource UMKM
5. Mengintegrasikan aspek digital dan tradisional
6. Sustainable dan scalable untuk jangka panjang
7. Include estimasi biaya dan ROI yang realistis

🎯 FOKUS AREA PRIORITAS:
- Revenue growth dan market expansion
- Operational efficiency dan cost optimization
- Digital transformation dan online presence
- Customer acquisition, retention, dan loyalty
- Supply chain dan inventory management
- Human capital development
- Financial management dan access to capital
- Compliance, risk management, dan sustainability

📊 ANALISIS BISNIS:

## PROFIL BISNIS:
- **Nama Bisnis**: ${aiContext.businessProfile.name}
- **Kategori**: ${aiContext.businessProfile.category}
- **Tahap Bisnis**: ${aiContext.businessProfile.stage}
- **Jumlah Karyawan**: ${aiContext.businessProfile.employeeCount} orang
- **Pendapatan Bulanan**: Rp ${aiContext.businessProfile.monthlyRevenue?.toLocaleString('id-ID') || 'Tidak disebutkan'}
- **Usia Bisnis**: ${aiContext.businessProfile.businessAge} tahun
- **Lokasi**: ${aiContext.businessProfile.location}
- **Tantangan Utama**: ${aiContext.businessProfile.challenges?.join(', ') || 'Belum diidentifikasi'}
- **Tujuan Bisnis**: ${aiContext.businessProfile.goals?.join(', ') || 'Belum ditetapkan'}

## HASIL DIAGNOSIS CHURCHILL & LEWIS:
- **Tahap Saat Ini**: ${aiContext.diagnosisResults.currentStage}
- **Kekuatan**: ${aiContext.diagnosisResults.strengths?.join(', ') || 'Sedang dianalisis'}
- **Area Pengembangan**: ${aiContext.diagnosisResults.weaknesses?.join(', ') || 'Sedang dianalisis'}
- **Peluang**: ${aiContext.diagnosisResults.opportunities?.join(', ') || 'Sedang diidentifikasi'}

## INSTRUKSI OUTPUT:
Berikan 6-10 rekomendasi dalam format JSON yang valid dengan struktur lengkap berikut:

\`\`\`json
{
  "recommendations": [
    {
      "title": "Judul rekomendasi yang jelas dan actionable",
      "description": "Deskripsi detail yang menjelaskan apa, mengapa, dan bagaimana (min 100 kata)",
      "category": "pilih: financial_management, marketing_sales, operations, human_resources, technology, legal_compliance, growth_strategy, customer_service",
      "priority": "pilih: critical, high, medium, low",
      "businessStage": "tahap bisnis yang paling cocok untuk rekomendasi ini",
      "estimatedTimeframe": "estimasi waktu penyelesaian (contoh: 2-4 minggu)",
      "expectedImpact": "dampak positif yang diharapkan dengan metrik spesifik",
      "reasoning": "analisis mendalam mengapa rekomendasi ini kritis untuk bisnis saat ini",
      "estimatedCost": "estimasi biaya implementasi dalam Rupiah",
      "difficultyLevel": "pilih: easy, medium, hard",
      "tags": ["tag1", "tag2", "tag3"],

      "progressSteps": [
        {
          "title": "Nama langkah implementasi",
          "description": "Detail apa yang harus dilakukan pada langkah ini",
          "order": 1,
          "isRequired": true,
          "estimatedDuration": "estimasi waktu (contoh: 3-5 hari)",
          "resources": [
            {
              "title": "Nama resource",
              "description": "Deskripsi resource",
              "type": "pilih: article, video, tool, course, template, website, guide",
              "url": "URL valid atau '#'"
            }
          ],
          "tips": ["Tip praktis 1", "Tip praktis 2"],
          "checkpoints": [
            {
              "title": "Checkpoint yang harus dicapai",
              "description": "Detail checkpoint",
              "order": 1
            }
          ]
        }
      ],

      "milestones": [
        {
          "title": "Nama milestone penting",
          "description": "Deskripsi pencapaian milestone",
          "targetDate": "estimasi tanggal target (YYYY-MM-DD)",
          "reward": "benefit atau pencapaian yang didapat",
          "icon": "emoji yang sesuai",
          "requiredSteps": [0, 1, 2]
        }
      ],

      "actionItems": [
        {
          "title": "Aksi spesifik yang dapat dilakukan",
          "description": "Detail implementasi step-by-step",
          "estimatedHours": 8,
          "deadline": "YYYY-MM-DD"
        }
      ]
    }
  ],

  "summary": {
    "totalRecommendations": 7,
    "priorityDistribution": {
      "critical": 2,
      "high": 3,
      "medium": 2,
      "low": 0
    },
    "estimatedImplementationTime": "3-6 bulan",
    "keyFocusAreas": ["area1", "area2", "area3"],
    "nextSteps": "Langkah pertama yang harus segera dilakukan"
  }
}
\`\`\`

## PANDUAN REKOMENDASI BERKUALITAS:

🎯 **KRITERIA UTAMA:**
1. **Relevansi Tahap Bisnis**: Sesuai dengan ${aiContext.businessProfile.stage} stage Churchill & Lewis
2. **Konteks Indonesia 2024**: Pertimbangkan regulasi, budaya, dan kondisi ekonomi terkini
3. **Resource-Conscious**: Realistis untuk keterbatasan UMKM (budget, SDM, waktu)
4. **Measurable Impact**: Berikan metrik konkret dan timeline yang jelas
5. **Progressive Steps**: Buat langkah-langkah yang dapat diikuti secara bertahap
6. **Local Resources**: Prioritaskan tools, platform, dan layanan yang tersedia di Indonesia

💡 **FOKUS STRATEGIS:**
- **Quick Wins** (1-4 minggu): Solusi cepat untuk masalah mendesak
- **Medium-term Goals** (1-3 bulan): Perbaikan operasional dan efisiensi
- **Long-term Vision** (3-12 bulan): Transformasi dan pertumbuhan berkelanjutan

🔍 **AREA PRIORITAS BERDASARKAN PROFIL:**
- Tantangan utama: ${aiContext.businessProfile.challenges?.join(', ') || 'Optimasi umum'}
- Tujuan bisnis: ${aiContext.businessProfile.goals?.join(', ') || 'Pertumbuhan berkelanjutan'}
- Industri: ${aiContext.businessProfile.category} - pertimbangkan tren dan regulasi spesifik
- Lokasi: ${aiContext.businessProfile.location} - manfaatkan ekosistem lokal

✅ **VALIDASI AKHIR:**
Setiap rekomendasi harus lulus tes:
1. Apakah ini actionable dalam 30 hari pertama?
2. Apakah ROI-nya jelas dan terukur?
3. Apakah sesuai dengan kapasitas UMKM Indonesia?
4. Apakah ada dukungan ekosistem lokal?
5. Apakah compliance dengan regulasi Indonesia?

**MULAI ANALISIS DAN BERIKAN REKOMENDASI DALAM FORMAT JSON YANG DIMINTA.**

## PENTING - FORMAT OUTPUT:
1. **HANYA JSON**: Berikan output dalam format JSON yang valid
2. **TANPA MARKDOWN**: Jangan gunakan \`\`\`json atau \`\`\`
3. **TANPA TEKS TAMBAHAN**: Tidak ada penjelasan di luar JSON
4. **VALID JSON**: Pastikan semua string menggunakan double quotes
5. **NO TRAILING COMMAS**: Jangan ada koma di akhir object/array

Contoh format yang BENAR:
{
  "recommendations": [
    {
      "title": "Judul rekomendasi",
      "description": "Deskripsi lengkap",
      "category": "financial_management",
      "priority": "high",
      "actionItems": [
        {
          "title": "Aksi spesifik",
          "description": "Detail implementasi",
          "estimatedHours": 8,
          "deadline": "2024-02-15"
        }
      ],
      "resources": [
        {
          "title": "Nama resource",
          "description": "Deskripsi resource",
          "type": "article",
          "url": "https://example.com"
        }
      ],
      "estimatedTimeframe": "1-2 minggu",
      "expectedImpact": "Dampak yang diharapkan",
      "reasoning": "Alasan rekomendasi"
    }
  ]
}

MULAI JSON OUTPUT SEKARANG:`;
};



/**
 * Fix unescaped quotes in JSON string values - more aggressive approach
 */
const fixUnescapedQuotes = (jsonString) => {
  try {
    // First, let's try a more aggressive approach
    // Replace problematic patterns that commonly break JSON

    let fixed = jsonString;

    // Pattern 1: Fix quotes inside descriptions
    // Look for: "description": "text with "quotes" inside"
    fixed = fixed.replace(/"description":\s*"([^"]*)"([^"]*)"([^"]*?)"/g, (_, part1, part2, part3) => {
      return `"description": "${part1}\\"${part2}\\"${part3}"`;
    });

    // Pattern 2: Fix quotes inside titles
    fixed = fixed.replace(/"title":\s*"([^"]*)"([^"]*)"([^"]*?)"/g, (_, part1, part2, part3) => {
      return `"title": "${part1}\\"${part2}\\"${part3}"`;
    });

    // Pattern 3: Fix quotes inside any string value (more general)
    fixed = fixed.replace(/"([^"]+)":\s*"([^"]*)"([^"]*)"([^"]*?)"/g, (_, key, part1, part2, part3) => {
      return `"${key}": "${part1}\\"${part2}\\"${part3}"`;
    });

    // Pattern 4: Fix incomplete strings (common issue)
    // Look for lines that end abruptly without closing quotes
    const lines = fixed.split('\n');
    const fixedLines = lines.map((line, index) => {
      // If line contains ": " but doesn't end with " or ", or }
      if (line.includes('": "') && !line.trim().match(/[",}]$/)) {
        // Check if next line might be continuation
        if (index < lines.length - 1) {
          const nextLine = lines[index + 1].trim();
          // If next line doesn't start with a key, it might be continuation
          if (!nextLine.startsWith('"') && !nextLine.startsWith('}') && !nextLine.startsWith(']')) {
            return line + '",'; // Close the string
          }
        }
      }
      return line;
    });

    return fixedLines.join('\n');
  } catch (error) {
    console.warn('⚠️ Error in quote fixing, returning original:', error);
    return jsonString;
  }
};

/**
 * Ultra-aggressive JSON cleaning for severely malformed responses
 */
const aggressiveJSONClean = (jsonString) => {
  try {
    let cleaned = jsonString.trim();

    // Remove everything before first { and after last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON structure found');
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    // Ultra-aggressive cleaning
    cleaned = cleaned
      // Remove markdown
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      // Remove ALL control characters including newlines, tabs, etc.
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unquoted keys
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes to double quotes (but be careful with apostrophes)
      .replace(/'/g, '"')
      // Fix broken string endings - if a line ends with quote but no comma/brace
      .replace(/"(\s*)$/gm, '",')
      // Fix missing quotes around values that look like strings
      .replace(/:\s*([a-zA-Z][a-zA-Z0-9\s]*[a-zA-Z0-9])\s*([,}])/g, ': "$1"$2')
      // Fix double quotes inside strings by escaping them
      .replace(/"([^"]*)"([^"]*)"([^"]*?)"/g, '"$1\\"$2\\"$3"')
      // Remove any remaining problematic characters
      .replace(/[^\x20-\x7E"{}[\]:,]/g, ' ')
      // Final whitespace cleanup
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  } catch (error) {
    console.warn('⚠️ Aggressive cleaning failed:', error);
    return jsonString;
  }
};

/**
 * Nuclear option: Rebuild JSON from scratch using regex extraction
 */
const nuclearJSONRebuild = (jsonString) => {
  try {
    console.log('☢️ Nuclear JSON rebuild initiated...');

    // Extract all potential key-value pairs
    const keyValuePairs = [];

    // Pattern for "key": "value" pairs
    const kvRegex = /"([^"]+)":\s*"([^"]*?)"/g;
    let match;

    while ((match = kvRegex.exec(jsonString)) !== null) {
      const key = match[1];
      let value = match[2];

      // Clean the value
      value = value
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control chars
        .replace(/"/g, '\\"') // Escape quotes
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      keyValuePairs.push({ key, value });
    }

    // Try to extract array structures
    const recommendations = [];
    let currentRec = {};

    keyValuePairs.forEach(({ key, value }) => {
      if (key === 'title' && Object.keys(currentRec).length > 0) {
        // New recommendation starting
        recommendations.push(currentRec);
        currentRec = {};
      }
      currentRec[key] = value;
    });

    // Add the last recommendation
    if (Object.keys(currentRec).length > 0) {
      recommendations.push(currentRec);
    }

    // Build a clean JSON structure
    const cleanJSON = {
      recommendations: recommendations.map(rec => ({
        title: rec.title || 'Rekomendasi Bisnis',
        description: rec.description || 'Deskripsi rekomendasi untuk bisnis Anda',
        category: rec.category || 'growth_strategy',
        priority: rec.priority || 'medium',
        estimatedTimeframe: rec.estimatedTimeframe || '2-4 minggu',
        expectedImpact: rec.expectedImpact || 'Dampak positif pada bisnis',
        reasoning: rec.reasoning || 'Rekomendasi berdasarkan analisis AI'
      }))
    };

    const result = JSON.stringify(cleanJSON, null, 2);
    console.log('☢️ Nuclear rebuild successful, created', cleanJSON.recommendations.length, 'recommendations');
    return result;

  } catch (error) {
    console.error('☢️ Nuclear rebuild failed:', error);
    throw error;
  }
};

/**
 * Manual extraction as last resort - extract key information using regex
 */
const tryManualExtraction = (aiResponse, userId) => {
  console.log('🔧 Attempting manual extraction from AI response...');

  try {
    const recommendations = [];

    // Try multiple extraction patterns
    const patterns = [
      /"title":\s*"([^"]+)"/g,
      /title:\s*"([^"]+)"/g,
      /Title:\s*"([^"]+)"/g,
      /"judul":\s*"([^"]+)"/g
    ];

    const descPatterns = [
      /"description":\s*"([^"]+)"/g,
      /description:\s*"([^"]+)"/g,
      /Description:\s*"([^"]+)"/g,
      /"deskripsi":\s*"([^"]+)"/g
    ];

    let titleMatches = [];
    let descMatches = [];

    // Try all patterns
    patterns.forEach(pattern => {
      const matches = [...aiResponse.matchAll(pattern)];
      titleMatches.push(...matches.map(m => m[1]));
    });

    descPatterns.forEach(pattern => {
      const matches = [...aiResponse.matchAll(pattern)];
      descMatches.push(...matches.map(m => m[1]));
    });

    console.log(`🔍 Found ${titleMatches.length} titles and ${descMatches.length} descriptions`);

    // Create basic recommendations from extracted data
    const maxItems = Math.max(titleMatches.length, descMatches.length, 1);

    for (let i = 0; i < Math.min(maxItems, 5); i++) { // Limit to 5 recommendations
      const title = titleMatches[i] || `Rekomendasi Bisnis ${i + 1}`;
      const description = descMatches[i] || 'Rekomendasi berdasarkan analisis AI untuk meningkatkan performa bisnis Anda.';

      recommendations.push(createRecommendation({
        userId,
        title: title.substring(0, 100).replace(/[^\w\s-]/g, ''), // Clean title
        description: description.substring(0, 500).replace(/[^\w\s.,!?-]/g, ''), // Clean description
        category: 'growth_strategy',
        priority: 'medium',
        estimatedTimeframe: '2-4 minggu',
        expectedImpact: 'Dampak positif pada bisnis',
        reasoning: 'Rekomendasi berdasarkan analisis AI',
        actionItems: [
          createActionItem({
            title: 'Implementasi rekomendasi',
            description: 'Terapkan rekomendasi ini sesuai dengan kondisi bisnis Anda',
            estimatedHours: 8,
            deadline: null
          })
        ],
        resources: [
          createResource({
            title: 'Panduan Implementasi',
            description: 'Panduan umum untuk implementasi rekomendasi bisnis',
            type: 'guide',
            url: '#'
          })
        ]
      }));
    }

    if (recommendations.length === 0) {
      // Create at least one fallback recommendation
      recommendations.push(createRecommendation({
        userId,
        title: 'Evaluasi dan Optimasi Bisnis',
        description: 'Lakukan evaluasi menyeluruh terhadap operasional bisnis dan identifikasi area yang dapat dioptimalkan untuk meningkatkan efisiensi dan profitabilitas.',
        category: 'growth_strategy',
        priority: 'high',
        estimatedTimeframe: '2-4 minggu',
        expectedImpact: 'Peningkatan efisiensi operasional dan profitabilitas',
        reasoning: 'Rekomendasi fallback berdasarkan best practices bisnis',
        actionItems: [
          createActionItem({
            title: 'Audit operasional',
            description: 'Lakukan audit menyeluruh terhadap proses bisnis saat ini',
            estimatedHours: 16,
            deadline: null
          })
        ],
        resources: [
          createResource({
            title: 'Panduan Audit Bisnis',
            description: 'Panduan lengkap untuk melakukan audit bisnis',
            type: 'guide',
            url: '#'
          })
        ]
      }));
    }

    console.log(`✅ Manual extraction created ${recommendations.length} recommendations`);
    return recommendations;

  } catch (error) {
    console.error('❌ Manual extraction failed:', error);
    // Return absolute fallback
    return [createRecommendation({
      userId,
      title: 'Konsultasi Bisnis',
      description: 'Konsultasikan strategi bisnis Anda dengan ahli untuk mendapatkan rekomendasi yang tepat.',
      category: 'consultation',
      priority: 'medium',
      estimatedTimeframe: '1-2 minggu',
      expectedImpact: 'Mendapatkan insight profesional untuk bisnis',
      reasoning: 'Fallback recommendation ketika AI parsing gagal',
      actionItems: [],
      resources: []
    })];
  }
};

/**
 * Alternative line-by-line quote fixing for fallback
 */
const fixUnescapedQuotesLineByLine = (jsonString) => {
  try {
    return jsonString.replace(/": "([^"]*)"([^"]*)"([^"]*)"/g, (_, part1, part2, part3) => {
      return `": "${part1}\\"${part2}\\"${part3}"`;
    });
  } catch (error) {
    return jsonString;
  }
};

/**
 * Create a minimal valid response when all else fails
 */
const createMinimalValidResponse = (brokenJson) => {
  // Extract any title strings we can find
  const titleMatches = brokenJson.match(/"title":\s*"([^"]+)"/g) || [];
  const titles = titleMatches.map(match => {
    const titleMatch = match.match(/"title":\s*"([^"]+)"/);
    return titleMatch ? titleMatch[1] : 'Rekomendasi Bisnis';
  });

  // Create minimal recommendations
  const recommendations = titles.slice(0, 3).map((title) => ({
    title: title,
    description: 'Deskripsi detail akan tersedia setelah perbaikan sistem AI.',
    category: 'growth_strategy',
    priority: 'medium',
    actionItems: [{
      title: 'Tindak lanjut diperlukan',
      description: 'Detail akan diperbarui',
      estimatedHours: 4,
      deadline: null
    }],
    resources: [{
      title: 'Resource akan diperbarui',
      description: 'Informasi akan tersedia segera',
      type: 'article',
      url: '#'
    }],
    estimatedTimeframe: '1-2 minggu',
    expectedImpact: 'Dampak positif pada pengembangan bisnis',
    reasoning: 'Rekomendasi berdasarkan analisis AI (dalam perbaikan)'
  }));

  return { recommendations };
};

/**
 * Parse AI response and create recommendation objects with robust error handling
 */
const parseAIResponse = (aiResponse, userId) => {
  try {
    console.log('🔍 Raw AI response length:', aiResponse.length);

    // Clean the response more thoroughly
    let cleanResponse = aiResponse.trim();

    // Remove markdown code blocks
    cleanResponse = cleanResponse.replace(/```json\n?|\n?```/g, '');
    cleanResponse = cleanResponse.replace(/```\n?|\n?```/g, '');

    // Remove any text before the first {
    const firstBrace = cleanResponse.indexOf('{');
    if (firstBrace > 0) {
      cleanResponse = cleanResponse.substring(firstBrace);
    }

    // Remove any text after the last }
    const lastBrace = cleanResponse.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < cleanResponse.length - 1) {
      cleanResponse = cleanResponse.substring(0, lastBrace + 1);
    }

    // Fix common JSON issues with more sophisticated approach
    cleanResponse = cleanResponse
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]

    // Fix unescaped quotes in string values - this is the main issue
    cleanResponse = fixUnescapedQuotes(cleanResponse);

    // Final cleanup
    cleanResponse = cleanResponse
      .replace(/(\w+):/g, '"$1":') // Add quotes around unquoted keys
      .replace(/"\s*(\w+)\s*":/g, '"$1":'); // Clean up quoted keys

    console.log('🧹 Cleaned response preview:', cleanResponse.substring(0, 200) + '...');

    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('🔍 Problematic JSON:', cleanResponse.substring(Math.max(0, parseError.message.match(/position (\d+)/)?.[1] - 50 || 0), (parseError.message.match(/position (\d+)/)?.[1] || 0) + 50));

      // Try multiple fallback strategies
      console.log('🔄 Trying fallback strategies...');

      // Strategy 1: Try with line-by-line quote fixing
      try {
        const lineFixedResponse = fixUnescapedQuotesLineByLine(cleanResponse);
        parsed = JSON.parse(lineFixedResponse);
        console.log('✅ Recovered JSON using line-by-line quote fixing');
      } catch (lineError) {
        console.log('❌ Line-by-line fixing failed:', lineError.message);

        // Strategy 2: Try aggressive cleaning
        try {
          const aggressiveCleaned = aggressiveJSONClean(cleanResponse);
          parsed = JSON.parse(aggressiveCleaned);
          console.log('✅ Recovered JSON using aggressive cleaning');
        } catch (aggressiveError) {
          console.log('❌ Aggressive cleaning failed:', aggressiveError.message);

          // Strategy 3: Extract JSON using regex
          const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const extractedJson = fixUnescapedQuotes(jsonMatch[0]);
              parsed = JSON.parse(extractedJson);
              console.log('✅ Recovered JSON using regex extraction + quote fixing');
            } catch (regexError) {
              console.log('❌ Regex extraction failed:', regexError.message);

              // Strategy 4: Nuclear JSON rebuild
              try {
                const nuclearRebuilt = nuclearJSONRebuild(aiResponse);
                parsed = JSON.parse(nuclearRebuilt);
                console.log('☢️ Nuclear JSON rebuild successful');
              } catch (nuclearError) {
                console.log('☢️ Nuclear rebuild failed:', nuclearError.message);

                // Strategy 5: Try to build a minimal valid response
                try {
                  parsed = createMinimalValidResponse(cleanResponse);
                  console.log('✅ Created minimal valid response from fragments');
                } catch (minimalError) {
                  console.log('❌ All JSON strategies failed, trying manual extraction');
                  return tryManualExtraction(aiResponse, userId);
                }
              }
            }
          } else {
            console.log('❌ No JSON structure found, trying nuclear rebuild');
            try {
              const nuclearRebuilt = nuclearJSONRebuild(aiResponse);
              parsed = JSON.parse(nuclearRebuilt);
              console.log('☢️ Nuclear JSON rebuild successful (no structure)');
            } catch (finalError) {
              console.log('❌ All strategies exhausted, trying manual extraction');
              return tryManualExtraction(aiResponse, userId);
            }
          }
        }
      }
    }

    const recommendations = [];

    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      console.log(`📋 Processing ${parsed.recommendations.length} recommendations`);

      parsed.recommendations.forEach((rec, index) => {
        try {
          // Process progress steps
          const progressSteps = rec.progressSteps?.map((step, stepIndex) => {
            const processedStep = createProgressStep({
              title: step.title || `Langkah ${stepIndex + 1}`,
              description: step.description || 'Deskripsi langkah',
              order: step.order || stepIndex,
              isRequired: step.isRequired !== false,
              estimatedDuration: step.estimatedDuration || '1-2 hari',
              resources: step.resources?.map(resource => createResource({
                title: resource.title || 'Resource',
                description: resource.description || 'Deskripsi resource',
                type: resource.type || 'article',
                url: resource.url || '#'
              })) || [],
              tips: step.tips || [],
              checkpoints: step.checkpoints?.map((checkpoint, cpIndex) => createCheckpoint({
                title: checkpoint.title || `Checkpoint ${cpIndex + 1}`,
                description: checkpoint.description || 'Deskripsi checkpoint',
                order: checkpoint.order || cpIndex
              })) || []
            });
            return processedStep;
          }) || [];

          // Process milestones
          const milestones = rec.milestones?.map((milestone, milestoneIndex) => createMilestone({
            title: milestone.title || `Milestone ${milestoneIndex + 1}`,
            description: milestone.description || 'Deskripsi milestone',
            targetDate: milestone.targetDate || null,
            reward: milestone.reward || 'Pencapaian penting',
            icon: milestone.icon || '🎯',
            requiredSteps: milestone.requiredSteps || []
          })) || [];

          const recommendation = createRecommendation({
            userId,
            title: rec.title || `Rekomendasi ${index + 1}`,
            description: rec.description || 'Deskripsi tidak tersedia',
            category: rec.category || 'growth_strategy',
            priority: rec.priority || 'medium',
            businessStage: rec.businessStage || 'growth',
            estimatedTimeframe: rec.estimatedTimeframe || '2-4 minggu',
            expectedImpact: rec.expectedImpact || 'Dampak positif pada bisnis',
            reasoning: rec.reasoning || 'Rekomendasi berdasarkan analisis AI',

            // Enhanced fields
            estimatedCost: rec.estimatedCost || 'Biaya akan ditentukan',
            difficultyLevel: rec.difficultyLevel || 'medium',
            tags: rec.tags || [],

            // Progress tracking
            progressSteps: progressSteps,
            totalSteps: progressSteps.length,
            milestones: milestones,

            actionItems: rec.actionItems?.map(item => createActionItem({
              title: item.title || 'Aksi diperlukan',
              description: item.description || 'Detail akan ditentukan',
              estimatedHours: item.estimatedHours || 4,
              deadline: item.deadline || null
            })) || [],
            resources: rec.resources?.map(resource => createResource({
              title: resource.title || 'Resource',
              description: resource.description || 'Deskripsi resource',
              type: resource.type || 'article',
              url: resource.url || '#'
            })) || []
          });

          recommendations.push(recommendation);
        } catch (recError) {
          console.warn(`⚠️ Error processing recommendation ${index + 1}:`, recError);
          // Continue with other recommendations
        }
      });
    } else {
      console.warn('⚠️ No recommendations array found in parsed response');
      throw new Error('Invalid response format: missing recommendations array');
    }

    console.log(`✅ Successfully parsed ${recommendations.length} recommendations`);
    return recommendations;

  } catch (error) {
    console.error('❌ Error parsing AI response:', error);
    console.log('🔍 Response preview:', aiResponse.substring(0, 500));
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
};

/**
 * Enhanced AI response parser with better error handling and validation
 */
const parseEnhancedAIResponse = (aiResponse, userId) => {
  console.log('🔍 Parsing Enhanced AI response...');

  try {
    // Clean and extract JSON from response
    let cleanResponse = aiResponse.trim();

    // Remove markdown code blocks if present
    cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');

    // Find JSON object boundaries
    const jsonStart = cleanResponse.indexOf('{');
    const jsonEnd = cleanResponse.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON structure found in AI response');
    }

    cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);

    // Parse JSON with enhanced error handling
    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.log('❌ Initial JSON parse failed, attempting recovery...');

      // Try to fix common JSON issues
      let fixedResponse = cleanResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        .replace(/\\n/g, '\\\\n') // Escape newlines
        .replace(/\n/g, ' ') // Remove actual newlines
        .replace(/\t/g, ' ') // Remove tabs
        .replace(/\s+/g, ' '); // Normalize whitespace

      try {
        parsed = JSON.parse(fixedResponse);
        console.log('✅ JSON recovery successful');
      } catch (recoveryError) {
        console.error('❌ JSON recovery failed:', recoveryError.message);
        throw new Error(`Failed to parse AI response as JSON: ${recoveryError.message}`);
      }
    }

    // Validate response structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid response: not an object');
    }

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response: missing or invalid recommendations array');
    }

    if (parsed.recommendations.length === 0) {
      throw new Error('No recommendations found in response');
    }

    console.log(`📋 Processing ${parsed.recommendations.length} enhanced recommendations`);

    const recommendations = [];

    parsed.recommendations.forEach((rec, index) => {
      try {
        // Validate required fields
        if (!rec.title || !rec.description) {
          console.warn(`⚠️ Skipping recommendation ${index + 1}: missing title or description`);
          return;
        }

        // Process progress steps with enhanced validation
        const progressSteps = rec.progressSteps?.map((step, stepIndex) => {
          if (!step.title) {
            console.warn(`⚠️ Step ${stepIndex + 1} missing title, using default`);
          }

          return createProgressStep({
            title: step.title || `Langkah ${stepIndex + 1}`,
            description: step.description || 'Deskripsi langkah akan ditentukan',
            order: step.order || stepIndex,
            isRequired: step.isRequired !== false,
            estimatedDuration: step.estimatedDuration || '1-2 hari',
            resources: step.resources?.map(resource => createResource({
              title: resource.title || 'Resource',
              description: resource.description || 'Deskripsi resource',
              type: resource.type || 'article',
              url: resource.url || '#'
            })) || [],
            tips: Array.isArray(step.tips) ? step.tips : [],
            checkpoints: step.checkpoints?.map((checkpoint, cpIndex) => createCheckpoint({
              title: checkpoint.title || `Checkpoint ${cpIndex + 1}`,
              description: checkpoint.description || 'Deskripsi checkpoint',
              order: checkpoint.order || cpIndex
            })) || []
          });
        }) || [];

        // Process milestones with validation
        const milestones = rec.milestones?.map((milestone, milestoneIndex) => createMilestone({
          title: milestone.title || `Milestone ${milestoneIndex + 1}`,
          description: milestone.description || 'Deskripsi milestone',
          targetDate: milestone.targetDate || null,
          reward: milestone.reward || 'Pencapaian penting',
          icon: milestone.icon || '🎯',
          requiredSteps: Array.isArray(milestone.requiredSteps) ? milestone.requiredSteps : []
        })) || [];

        // Create enhanced recommendation
        const recommendation = createRecommendation({
          userId,
          title: rec.title,
          description: rec.description,
          category: rec.category || 'growth_strategy',
          priority: rec.priority || 'medium',
          businessStage: rec.businessStage || 'growth',
          estimatedTimeframe: rec.estimatedTimeframe || '2-4 minggu',
          expectedImpact: rec.expectedImpact || 'Dampak positif pada bisnis',
          reasoning: rec.reasoning || 'Rekomendasi berdasarkan analisis AI',

          // Enhanced fields
          estimatedCost: rec.estimatedCost || 'Biaya akan ditentukan',
          difficultyLevel: rec.difficultyLevel || 'medium',
          tags: Array.isArray(rec.tags) ? rec.tags : [],

          // Progress tracking
          progressSteps: progressSteps,
          totalSteps: progressSteps.length,
          milestones: milestones,

          // Legacy fields for compatibility
          actionItems: rec.actionItems?.map(item => createActionItem({
            title: item.title || 'Aksi diperlukan',
            description: item.description || 'Detail akan ditentukan',
            estimatedHours: item.estimatedHours || 4,
            deadline: item.deadline || null
          })) || [],
          resources: rec.resources?.map(resource => createResource({
            title: resource.title || 'Resource',
            description: resource.description || 'Deskripsi resource',
            type: resource.type || 'article',
            url: resource.url || '#'
          })) || []
        });

        recommendations.push(recommendation);
        console.log(`✅ Processed enhanced recommendation ${index + 1}: ${recommendation.title}`);

      } catch (recError) {
        console.error(`❌ Error processing recommendation ${index + 1}:`, recError);
        // Continue with other recommendations
      }
    });

    if (recommendations.length === 0) {
      throw new Error('No valid recommendations could be processed');
    }

    console.log(`✅ Successfully parsed ${recommendations.length} enhanced recommendations`);
    return recommendations;

  } catch (error) {
    console.error('❌ Error parsing enhanced AI response:', error);
    console.log('🔍 Response preview:', aiResponse.substring(0, 500));
    throw new Error(`Failed to parse enhanced AI response: ${error.message}`);
  }
};

/**
 * Stage-specific recommendation generators
 */
const getExistenceStageRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Validasi Model Bisnis',
      description: 'Pastikan produk/layanan Anda memenuhi kebutuhan pasar yang nyata melalui riset mendalam dan validasi langsung dengan calon pelanggan. Ini adalah langkah kritis untuk mengurangi risiko kegagalan bisnis.',
      category: RECOMMENDATION_CATEGORIES.GROWTH_STRATEGY,
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      businessStage: 'existence',
      estimatedTimeframe: '2-4 minggu',
      expectedImpact: 'Mengurangi risiko kegagalan bisnis hingga 60% dan meningkatkan peluang sukses jangka panjang',
      reasoning: 'Pada tahap keberadaan, validasi pasar adalah kunci untuk memastikan bisnis dapat bertahan dan berkembang',
      estimatedCost: 'Rp 500.000 - 1.500.000',
      difficultyLevel: 'medium',
      tags: ['validasi pasar', 'riset pelanggan', 'model bisnis', 'startup'],

      // Enhanced progress steps
      progressSteps: [
        createProgressStep({
          title: 'Persiapan Riset Pasar',
          description: 'Siapkan framework dan tools untuk melakukan riset pasar yang efektif',
          order: 0,
          isRequired: true,
          estimatedDuration: '2-3 hari',
          resources: [
            createResource({
              title: 'Template Riset Pasar UMKM',
              description: 'Template lengkap untuk riset pasar khusus UMKM Indonesia',
              type: 'template',
              url: '#'
            }),
            createResource({
              title: 'Panduan Wawancara Pelanggan',
              description: 'Teknik wawancara efektif untuk mendapatkan insight pelanggan',
              type: 'guide',
              url: '#'
            })
          ],
          tips: [
            'Fokus pada masalah yang ingin dipecahkan, bukan solusi yang ingin dijual',
            'Siapkan pertanyaan terbuka untuk mendapatkan insight mendalam',
            'Dokumentasikan semua feedback dengan detail'
          ],
          checkpoints: [
            createCheckpoint({
              title: 'Daftar pertanyaan riset sudah siap',
              description: 'Minimal 15 pertanyaan terstruktur untuk wawancara',
              order: 0
            }),
            createCheckpoint({
              title: 'Target responden sudah ditentukan',
              description: 'Identifikasi 25-30 calon pelanggan untuk diwawancara',
              order: 1
            }),
            createCheckpoint({
              title: 'Tools dokumentasi sudah disiapkan',
              description: 'Aplikasi recording, form survey, atau spreadsheet tracking',
              order: 2
            })
          ]
        }),
        createProgressStep({
          title: 'Eksekusi Wawancara Pelanggan',
          description: 'Lakukan wawancara mendalam dengan calon pelanggan untuk memvalidasi asumsi bisnis',
          order: 1,
          isRequired: true,
          estimatedDuration: '1-2 minggu',
          resources: [
            createResource({
              title: 'Script Wawancara Validasi',
              description: 'Script percakapan untuk wawancara validasi bisnis',
              type: 'template',
              url: '#'
            })
          ],
          tips: [
            'Lakukan wawancara tatap muka atau video call untuk hasil terbaik',
            'Jangan leading questions - biarkan responden bercerita',
            'Catat tidak hanya jawaban, tapi juga emosi dan reaksi'
          ],
          checkpoints: [
            createCheckpoint({
              title: 'Wawancara dengan 10 responden pertama',
              description: 'Selesaikan wawancara dengan 10 calon pelanggan',
              order: 0
            }),
            createCheckpoint({
              title: 'Analisis pola feedback awal',
              description: 'Identifikasi pola dan tema umum dari feedback',
              order: 1
            }),
            createCheckpoint({
              title: 'Wawancara dengan 15 responden tambahan',
              description: 'Lanjutkan wawancara untuk validasi pola yang ditemukan',
              order: 2
            })
          ]
        }),
        createProgressStep({
          title: 'Analisis dan Kesimpulan',
          description: 'Analisis hasil riset dan buat keputusan strategis berdasarkan data',
          order: 2,
          isRequired: true,
          estimatedDuration: '3-5 hari',
          resources: [
            createResource({
              title: 'Template Analisis Riset',
              description: 'Framework untuk menganalisis hasil riset pasar',
              type: 'template',
              url: '#'
            })
          ],
          tips: [
            'Kategorikan feedback menjadi: masalah, solusi, harga, dan distribusi',
            'Hitung persentase responden yang mengkonfirmasi setiap asumsi',
            'Identifikasi red flags yang memerlukan pivot model bisnis'
          ],
          checkpoints: [
            createCheckpoint({
              title: 'Data wawancara sudah dikompilasi',
              description: 'Semua hasil wawancara terdokumentasi dengan rapi',
              order: 0
            }),
            createCheckpoint({
              title: 'Analisis pola dan insight selesai',
              description: 'Identifikasi insight kunci dan pola feedback',
              order: 1
            }),
            createCheckpoint({
              title: 'Rekomendasi aksi sudah dibuat',
              description: 'Buat rekomendasi konkret berdasarkan hasil riset',
              order: 2
            })
          ]
        })
      ],

      milestones: [
        createMilestone({
          title: 'Riset Pasar Selesai',
          description: 'Menyelesaikan riset komprehensif dengan minimal 25 responden',
          targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reward: 'Pemahaman mendalam tentang kebutuhan pasar dan validasi model bisnis',
          icon: '🎯',
          requiredSteps: [0, 1, 2]
        })
      ],

      actionItems: [
        createActionItem({
          title: 'Survei Pelanggan Potensial',
          description: 'Lakukan wawancara dengan 25-30 calon pelanggan untuk memvalidasi kebutuhan',
          estimatedHours: 20,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        })
      ],
      resources: [
        createResource({
          title: 'Template Survei Validasi Bisnis',
          description: 'Template pertanyaan untuk validasi model bisnis',
          type: 'template',
          url: '#'
        })
      ]
    })
  ];
};

const getSurvivalStageRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Implementasi Sistem Keuangan Dasar',
      description: 'Bangun sistem pencatatan keuangan yang akurat untuk kontrol kas yang lebih baik',
      category: RECOMMENDATION_CATEGORIES.FINANCIAL_MANAGEMENT,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      estimatedTimeframe: '1-2 minggu',
      expectedImpact: 'Meningkatkan kontrol keuangan dan membantu mencapai break-even',
      reasoning: 'Sistem keuangan yang baik adalah fondasi untuk bertahan dan tumbuh',
      actionItems: [
        createActionItem({
          title: 'Setup Aplikasi Keuangan',
          description: 'Install dan konfigurasi aplikasi pencatatan keuangan sederhana',
          estimatedHours: 4,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      ]
    })
  ];
};

const getSuccessStageRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Strategi Ekspansi Pasar',
      description: 'Kembangkan rencana untuk memperluas jangkauan pasar atau diversifikasi produk',
      category: RECOMMENDATION_CATEGORIES.MARKETING_SALES,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      estimatedTimeframe: '4-6 minggu',
      expectedImpact: 'Meningkatkan pendapatan dan mengurangi risiko ketergantungan pada satu pasar',
      reasoning: 'Pada tahap sukses, ekspansi adalah kunci untuk pertumbuhan berkelanjutan'
    })
  ];
};

const getTakeoffStageRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Pengembangan Struktur Organisasi',
      description: 'Bangun struktur organisasi yang dapat mendukung pertumbuhan cepat',
      category: RECOMMENDATION_CATEGORIES.HUMAN_RESOURCES,
      priority: RECOMMENDATION_PRIORITY.CRITICAL,
      estimatedTimeframe: '6-8 minggu',
      expectedImpact: 'Memungkinkan delegasi efektif dan skalabilitas operasional',
      reasoning: 'Pertumbuhan cepat memerlukan struktur yang jelas untuk menghindari kekacauan'
    })
  ];
};

const getMaturityStageRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Program Inovasi Berkelanjutan',
      description: 'Implementasikan sistem untuk mendorong inovasi dan adaptasi pasar',
      category: RECOMMENDATION_CATEGORIES.GROWTH_STRATEGY,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      estimatedTimeframe: '8-12 minggu',
      expectedImpact: 'Mempertahankan daya saing dan relevansi di pasar',
      reasoning: 'Bisnis matang perlu terus berinovasi untuk menghindari stagnasi'
    })
  ];
};

const getGeneralRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Analisis Kompetitor',
      description: 'Lakukan analisis mendalam terhadap pesaing untuk mengidentifikasi peluang',
      category: RECOMMENDATION_CATEGORIES.MARKETING_SALES,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      estimatedTimeframe: '2-3 minggu',
      expectedImpact: 'Memahami posisi kompetitif dan mengidentifikasi peluang diferensiasi',
      reasoning: 'Pemahaman kompetitor penting untuk semua tahap bisnis'
    })
  ];
};

const getFinancialLiteracyRecommendations = (userId) => {
  return [
    createRecommendation({
      userId,
      title: 'Pelatihan Literasi Keuangan UMKM',
      description: 'Ikuti program pelatihan untuk meningkatkan pemahaman keuangan bisnis',
      category: RECOMMENDATION_CATEGORIES.FINANCIAL_LITERACY,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      estimatedTimeframe: '4-6 minggu',
      expectedImpact: 'Meningkatkan kemampuan pengambilan keputusan keuangan yang lebih baik',
      reasoning: 'Literasi keuangan adalah fondasi untuk semua keputusan bisnis yang sehat',
      resources: [
        createResource({
          title: 'Modul Literasi Keuangan OJK',
          description: 'Materi pembelajaran literasi keuangan dari Otoritas Jasa Keuangan',
          type: 'course',
          url: 'https://sikapiuangmu.ojk.go.id'
        })
      ]
    })
  ];
};

/**
 * Test function for JSON parsing (development only)
 */
export const testJSONParsing = (testResponse) => {
  try {
    const testRecommendations = parseAIResponse(testResponse, 'test-user');
    console.log('✅ JSON parsing test successful:', testRecommendations.length, 'recommendations');
    return testRecommendations;
  } catch (error) {
    console.error('❌ JSON parsing test failed:', error);
    return null;
  }
};

/**
 * Test AI integration with sample data (for development/testing)
 */
export const testAIIntegration = async (profileType = 'warung') => {
  console.log(`🧪 Testing AI integration with ${profileType} profile...`);

  try {
    // Import test utilities dynamically
    const { TEST_BUSINESS_PROFILES, TEST_DIAGNOSIS_DATA } = await import('../utils/aiTesting.js');

    const profile = TEST_BUSINESS_PROFILES[profileType];
    const diagnosis = TEST_DIAGNOSIS_DATA[profileType];

    if (!profile || !diagnosis) {
      throw new Error(`Test profile '${profileType}' not found`);
    }

    console.log('📋 Test Profile:', profile);
    console.log('🔍 Test Diagnosis:', diagnosis);

    const startTime = performance.now();
    const recommendations = await generateAIRecommendations(profile, diagnosis);
    const endTime = performance.now();

    console.log(`✅ AI Test completed in ${Math.round(endTime - startTime)}ms`);
    console.log(`📊 Generated ${recommendations.length} recommendations`);

    // Log first recommendation details
    if (recommendations.length > 0) {
      const firstRec = recommendations[0];
      console.log('🎯 Sample Recommendation:', {
        title: firstRec.title,
        category: firstRec.category,
        priority: firstRec.priority,
        hasProgressSteps: !!(firstRec.progressSteps && firstRec.progressSteps.length > 0),
        hasMilestones: !!(firstRec.milestones && firstRec.milestones.length > 0),
        stepCount: firstRec.progressSteps?.length || 0,
        milestoneCount: firstRec.milestones?.length || 0
      });
    }

    return {
      success: true,
      duration: endTime - startTime,
      recommendationCount: recommendations.length,
      recommendations: recommendations,
      profile: profile,
      diagnosis: diagnosis
    };

  } catch (error) {
    console.error('❌ AI Test failed:', error);
    return {
      success: false,
      error: error.message,
      profile: null,
      diagnosis: null
    };
  }
};

/**
 * Quick AI test function for browser console
 */
export const quickAITest = () => {
  console.log('🚀 Starting Quick AI Test...');
  console.log('Available test profiles: warung, fashion, tech, craft');
  console.log('Usage: testAIIntegration("warung")');

  return testAIIntegration('warung');
};

// Make test functions available globally for console access
if (typeof window !== 'undefined') {
  window.testAIIntegration = testAIIntegration;
  window.quickAITest = quickAITest;
  window.generateAIRecommendations = generateAIRecommendations;

  console.log('🧪 AI Testing functions available:');
  console.log('- testAIIntegration(profileType)');
  console.log('- quickAITest()');
  console.log('- generateAIRecommendations(profile, diagnosis)');
}

export default {
  generateAIRecommendations,
  generateRuleBasedRecommendations,
  testJSONParsing,
  testAIIntegration,
  quickAITest
};
