/**
 * Churchill & Lewis Business Growth Model
 * 5 Tahap Perkembangan Bisnis UMKM
 */

export const BUSINESS_STAGES = {
  EXISTENCE: {
    id: 'existence',
    name: 'Tahap Keberadaan (Existence)',
    description: 'Bisnis baru yang berfokus pada mendapatkan pelanggan dan menghasilkan produk/layanan',
    characteristics: [
      'Bisnis masih sangat kecil dan sederhana',
      'Pemilik melakukan sebagian besar pekerjaan',
      'Fokus utama adalah bertahan hidup',
      'Sistem manajemen masih minimal'
    ],
    challenges: [
      'Mendapatkan pelanggan pertama',
      'Menghasilkan cukup uang untuk menutupi biaya',
      'Membangun produk/layanan yang diinginkan pasar'
    ],
    keyMetrics: {
      revenue: { min: 0, max: 50000000 }, // 0-50 juta/tahun
      employees: { min: 1, max: 3 },
      businessAge: { min: 0, max: 12 } // 0-1 tahun
    }
  },
  
  SURVIVAL: {
    id: 'survival',
    name: 'Tahap Bertahan (Survival)',
    description: 'Bisnis telah membuktikan viabilitas dan fokus pada profitabilitas',
    characteristics: [
      'Memiliki pelanggan yang cukup',
      'Produk/layanan sudah diterima pasar',
      'Fokus pada cash flow dan break-even',
      'Mulai membangun sistem operasional'
    ],
    challenges: [
      'Mencapai titik impas (break-even)',
      'Mengelola cash flow',
      'Mempertahankan pelanggan',
      'Meningkatkan efisiensi operasional'
    ],
    keyMetrics: {
      revenue: { min: 50000000, max: 300000000 }, // 50-300 juta/tahun
      employees: { min: 3, max: 10 },
      businessAge: { min: 12, max: 36 } // 1-3 tahun
    }
  },
  
  SUCCESS_DISENGAGEMENT: {
    id: 'success_disengagement',
    name: 'Tahap Sukses - Pelepasan (Success-Disengagement)',
    description: 'Bisnis stabil dan menguntungkan, pemilik dapat melepas kontrol operasional',
    characteristics: [
      'Bisnis menguntungkan dan stabil',
      'Sistem manajemen yang baik',
      'Pemilik dapat mendelegasikan tugas',
      'Cash flow positif dan konsisten'
    ],
    challenges: [
      'Membangun tim manajemen yang kompeten',
      'Mengembangkan sistem dan prosedur',
      'Mempertahankan pertumbuhan yang stabil',
      'Mengelola ekspektasi stakeholder'
    ],
    keyMetrics: {
      revenue: { min: 300000000, max: 2500000000 }, // 300 juta - 2.5 miliar/tahun
      employees: { min: 10, max: 50 },
      businessAge: { min: 36, max: 84 } // 3-7 tahun
    }
  },
  
  SUCCESS_GROWTH: {
    id: 'success_growth',
    name: 'Tahap Sukses - Pertumbuhan (Success-Growth)',
    description: 'Bisnis berkembang pesat dengan investasi untuk ekspansi',
    characteristics: [
      'Pertumbuhan yang signifikan',
      'Investasi dalam SDM dan infrastruktur',
      'Ekspansi pasar atau produk',
      'Sistem manajemen yang matang'
    ],
    challenges: [
      'Mengelola pertumbuhan yang cepat',
      'Mempertahankan kualitas saat scaling',
      'Mengamankan pendanaan untuk ekspansi',
      'Mengembangkan kepemimpinan'
    ],
    keyMetrics: {
      revenue: { min: 2500000000, max: 50000000000 }, // 2.5-50 miliar/tahun
      employees: { min: 50, max: 300 },
      businessAge: { min: 60, max: 120 } // 5-10 tahun
    }
  },
  
  RESOURCE_MATURITY: {
    id: 'resource_maturity',
    name: 'Tahap Kedewasaan Sumber Daya (Resource Maturity)',
    description: 'Bisnis besar dengan sumber daya yang melimpah dan sistem yang matang',
    characteristics: [
      'Organisasi yang besar dan kompleks',
      'Sumber daya finansial yang kuat',
      'Sistem manajemen yang canggih',
      'Posisi pasar yang dominan'
    ],
    challenges: [
      'Mempertahankan inovasi dan fleksibilitas',
      'Menghindari birokrasi berlebihan',
      'Menghadapi kompetisi dari startup',
      'Mengelola kompleksitas organisasi'
    ],
    keyMetrics: {
      revenue: { min: 50000000000, max: Infinity }, // 50+ miliar/tahun
      employees: { min: 300, max: Infinity },
      businessAge: { min: 120, max: Infinity } // 10+ tahun
    }
  }
};

export const getStageById = (stageId) => {
  return Object.values(BUSINESS_STAGES).find(stage => stage.id === stageId);
};

export const getStageByMetrics = (revenue, employees, businessAge) => {
  for (const stage of Object.values(BUSINESS_STAGES)) {
    const { keyMetrics } = stage;
    
    const revenueMatch = revenue >= keyMetrics.revenue.min && 
                        (keyMetrics.revenue.max === Infinity || revenue <= keyMetrics.revenue.max);
    
    const employeeMatch = employees >= keyMetrics.employees.min && 
                         (keyMetrics.employees.max === Infinity || employees <= keyMetrics.employees.max);
    
    const ageMatch = businessAge >= keyMetrics.businessAge.min && 
                    (keyMetrics.businessAge.max === Infinity || businessAge <= keyMetrics.businessAge.max);
    
    if (revenueMatch && employeeMatch && ageMatch) {
      return stage;
    }
  }
  
  // Default ke Existence jika tidak ada yang cocok
  return BUSINESS_STAGES.EXISTENCE;
};
