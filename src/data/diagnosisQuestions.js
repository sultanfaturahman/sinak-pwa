/**
 * Kuesioner Diagnosis Bisnis
 * Berdasarkan Churchill & Lewis Model
 */

export const DIAGNOSIS_QUESTIONS = [
  {
    id: 'business_age',
    category: 'basic_info',
    type: 'number',
    question: 'Berapa lama bisnis Anda sudah berjalan?',
    subtitle: 'Dalam bulan (contoh: 6 bulan = 6, 2 tahun = 24)',
    placeholder: 'Masukkan jumlah bulan',
    required: true,
    validation: {
      min: 0,
      max: 600 // 50 tahun
    }
  },
  
  {
    id: 'annual_revenue',
    category: 'financial',
    type: 'select',
    question: 'Berapa perkiraan pendapatan tahunan bisnis Anda?',
    subtitle: 'Pilih rentang yang paling mendekati',
    required: true,
    options: [
      { value: 25000000, label: 'Di bawah Rp 50 juta' },
      { value: 175000000, label: 'Rp 50 juta - Rp 300 juta' },
      { value: 1400000000, label: 'Rp 300 juta - Rp 2,5 miliar' },
      { value: 26250000000, label: 'Rp 2,5 miliar - Rp 50 miliar' },
      { value: 75000000000, label: 'Di atas Rp 50 miliar' }
    ]
  },
  
  {
    id: 'employee_count',
    category: 'organizational',
    type: 'select',
    question: 'Berapa jumlah karyawan (termasuk Anda) di bisnis ini?',
    subtitle: 'Hitung semua orang yang terlibat secara aktif',
    required: true,
    options: [
      { value: 1, label: 'Hanya saya sendiri' },
      { value: 2, label: '2-3 orang' },
      { value: 7, label: '4-10 orang' },
      { value: 30, label: '11-50 orang' },
      { value: 175, label: '51-300 orang' },
      { value: 500, label: 'Lebih dari 300 orang' }
    ]
  },
  
  {
    id: 'business_focus',
    category: 'strategy',
    type: 'radio',
    question: 'Apa fokus utama bisnis Anda saat ini?',
    required: true,
    options: [
      { 
        value: 'survival', 
        label: 'Bertahan hidup dan mencari pelanggan pertama',
        weight: { existence: 3, survival: 1 }
      },
      { 
        value: 'break_even', 
        label: 'Mencapai titik impas (break-even)',
        weight: { survival: 3, existence: 1 }
      },
      { 
        value: 'stable_profit', 
        label: 'Mempertahankan keuntungan yang stabil',
        weight: { success_disengagement: 3, survival: 1 }
      },
      { 
        value: 'growth', 
        label: 'Ekspansi dan pertumbuhan bisnis',
        weight: { success_growth: 3, success_disengagement: 1 }
      },
      { 
        value: 'optimization', 
        label: 'Optimalisasi dan efisiensi operasional',
        weight: { resource_maturity: 3, success_growth: 1 }
      }
    ]
  },
  
  {
    id: 'management_style',
    category: 'management',
    type: 'radio',
    question: 'Bagaimana gaya manajemen Anda saat ini?',
    required: true,
    options: [
      { 
        value: 'hands_on', 
        label: 'Saya menangani hampir semua aspek bisnis sendiri',
        weight: { existence: 3, survival: 2 }
      },
      { 
        value: 'some_delegation', 
        label: 'Saya mulai mendelegasikan beberapa tugas',
        weight: { survival: 3, success_disengagement: 2 }
      },
      { 
        value: 'team_management', 
        label: 'Saya memiliki tim yang mengelola operasional harian',
        weight: { success_disengagement: 3, success_growth: 2 }
      },
      { 
        value: 'strategic_only', 
        label: 'Saya fokus pada strategi, tim mengelola operasional',
        weight: { success_growth: 3, resource_maturity: 2 }
      },
      { 
        value: 'board_governance', 
        label: 'Bisnis dikelola oleh dewan direksi/manajemen profesional',
        weight: { resource_maturity: 3 }
      }
    ]
  },
  
  {
    id: 'cash_flow_status',
    category: 'financial',
    type: 'radio',
    question: 'Bagaimana kondisi arus kas (cash flow) bisnis Anda?',
    required: true,
    options: [
      { 
        value: 'negative', 
        label: 'Sering negatif, sulit menutupi biaya operasional',
        weight: { existence: 3, survival: 1 }
      },
      { 
        value: 'break_even', 
        label: 'Impas, kadang surplus kadang defisit',
        weight: { survival: 3, existence: 1 }
      },
      { 
        value: 'positive_small', 
        label: 'Positif tapi masih kecil',
        weight: { survival: 2, success_disengagement: 3 }
      },
      { 
        value: 'positive_stable', 
        label: 'Positif dan stabil',
        weight: { success_disengagement: 3, success_growth: 2 }
      },
      { 
        value: 'strong_positive', 
        label: 'Sangat positif dengan cadangan yang kuat',
        weight: { success_growth: 2, resource_maturity: 3 }
      }
    ]
  },
  
  {
    id: 'market_position',
    category: 'market',
    type: 'radio',
    question: 'Bagaimana posisi bisnis Anda di pasar?',
    required: true,
    options: [
      { 
        value: 'new_entrant', 
        label: 'Pemain baru, masih membangun reputasi',
        weight: { existence: 3, survival: 1 }
      },
      { 
        value: 'established_local', 
        label: 'Sudah dikenal di area lokal/niche tertentu',
        weight: { survival: 3, success_disengagement: 2 }
      },
      { 
        value: 'regional_player', 
        label: 'Pemain regional dengan pangsa pasar yang solid',
        weight: { success_disengagement: 2, success_growth: 3 }
      },
      { 
        value: 'market_leader', 
        label: 'Pemimpin pasar di kategori/wilayah tertentu',
        weight: { success_growth: 2, resource_maturity: 3 }
      },
      { 
        value: 'dominant_player', 
        label: 'Pemain dominan dengan pengaruh industri yang besar',
        weight: { resource_maturity: 3 }
      }
    ]
  },
  
  {
    id: 'systems_processes',
    category: 'operational',
    type: 'radio',
    question: 'Seberapa formal sistem dan proses bisnis Anda?',
    required: true,
    options: [
      { 
        value: 'informal', 
        label: 'Sebagian besar informal, bergantung pada ingatan',
        weight: { existence: 3, survival: 1 }
      },
      { 
        value: 'basic_documentation', 
        label: 'Mulai ada dokumentasi dasar untuk proses penting',
        weight: { survival: 3, success_disengagement: 1 }
      },
      { 
        value: 'standardized', 
        label: 'Proses sudah terstandarisasi dan terdokumentasi',
        weight: { success_disengagement: 3, success_growth: 2 }
      },
      { 
        value: 'optimized', 
        label: 'Sistem terintegrasi dengan optimalisasi berkelanjutan',
        weight: { success_growth: 3, resource_maturity: 2 }
      },
      { 
        value: 'enterprise_level', 
        label: 'Sistem enterprise dengan automasi tinggi',
        weight: { resource_maturity: 3 }
      }
    ]
  }
];

export const calculateBusinessStage = (answers) => {
  const stageScores = {
    existence: 0,
    survival: 0,
    success_disengagement: 0,
    success_growth: 0,
    resource_maturity: 0
  };
  
  // Hitung skor berdasarkan jawaban
  DIAGNOSIS_QUESTIONS.forEach(question => {
    const answer = answers[question.id];
    if (!answer) return;
    
    if (question.type === 'radio') {
      const option = question.options.find(opt => opt.value === answer);
      if (option && option.weight) {
        Object.entries(option.weight).forEach(([stage, weight]) => {
          stageScores[stage] += weight;
        });
      }
    }
  });
  
  // Tambahkan bobot dari data numerik
  const revenue = answers.annual_revenue || 0;
  const employees = answers.employee_count || 1;
  const businessAge = answers.business_age || 0;
  
  // Logika tambahan berdasarkan metrik
  if (revenue < 50000000) stageScores.existence += 2;
  else if (revenue < 300000000) stageScores.survival += 2;
  else if (revenue < 2500000000) stageScores.success_disengagement += 2;
  else if (revenue < 50000000000) stageScores.success_growth += 2;
  else stageScores.resource_maturity += 2;
  
  if (employees <= 3) stageScores.existence += 1;
  else if (employees <= 10) stageScores.survival += 1;
  else if (employees <= 50) stageScores.success_disengagement += 1;
  else if (employees <= 300) stageScores.success_growth += 1;
  else stageScores.resource_maturity += 1;
  
  if (businessAge <= 12) stageScores.existence += 1;
  else if (businessAge <= 36) stageScores.survival += 1;
  else if (businessAge <= 84) stageScores.success_disengagement += 1;
  else if (businessAge <= 120) stageScores.success_growth += 1;
  else stageScores.resource_maturity += 1;
  
  // Tentukan tahap dengan skor tertinggi
  const maxScore = Math.max(...Object.values(stageScores));
  const winningStage = Object.entries(stageScores).find(([stage, score]) => score === maxScore);
  
  return {
    stage: winningStage[0],
    scores: stageScores,
    confidence: (maxScore / Object.values(stageScores).reduce((a, b) => a + b, 0)) * 100
  };
};
