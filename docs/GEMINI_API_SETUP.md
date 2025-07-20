# Google Gemini API Setup Guide

## Overview

SiNaik PWA menggunakan Google Gemini API untuk menghasilkan rekomendasi bisnis yang dipersonalisasi. Panduan ini akan membantu Anda mendapatkan dan mengkonfigurasi API key Gemini.

## Langkah 1: Mendapatkan Gemini API Key

### 1. Kunjungi Google AI Studio
- Buka [Google AI Studio](https://aistudio.google.com/)
- Login dengan akun Google Anda

### 2. Buat API Key
- Klik "Get API Key" di bagian atas halaman
- Pilih "Create API key in new project" atau pilih project yang sudah ada
- Copy API key yang dihasilkan

### 3. Simpan API Key dengan Aman
- **JANGAN** commit API key ke repository
- Simpan di file `.env` lokal
- Gunakan environment variables untuk production

## Langkah 2: Konfigurasi di SiNaik PWA

### 1. Update File Environment
```bash
# Copy example file
cp .env.example .env

# Edit file .env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Restart Development Server
```bash
npm run dev
```

## Langkah 3: Verifikasi Setup

### 1. Test AI Recommendations
- Complete business diagnosis di aplikasi
- Navigate ke halaman recommendations
- Pastikan rekomendasi di-generate oleh Gemini AI

### 2. Check Console Logs
- Buka Developer Tools (F12)
- Lihat console untuk log "Gemini AI recommendations generated successfully"

## Fitur Gemini API di SiNaik

### Model yang Digunakan
- **Model**: `gemini-2.0-flash` (Latest & Most Advanced)
- **Max Tokens**: 8192 (Increased capacity)
- **Temperature**: 0.7
- **Top P**: 0.8
- **Top K**: 40

### Safety Settings
- Harassment: BLOCK_MEDIUM_AND_ABOVE
- Hate Speech: BLOCK_MEDIUM_AND_ABOVE
- Sexually Explicit: BLOCK_MEDIUM_AND_ABOVE
- Dangerous Content: BLOCK_MEDIUM_AND_ABOVE

### Fallback System
Jika Gemini API tidak tersedia:
- Sistem otomatis menggunakan rule-based recommendations
- Aplikasi tetap berfungsi normal
- User mendapat notifikasi bahwa menggunakan rekomendasi standar

## Keunggulan Gemini vs OpenAI

### 1. Performance
- **Latency**: Gemini Flash lebih cepat
- **Cost**: Lebih ekonomis untuk high-volume usage
- **Reliability**: Uptime yang baik

### 2. Indonesian Language Support
- **Native Support**: Pemahaman bahasa Indonesia yang baik
- **Cultural Context**: Memahami konteks bisnis Indonesia
- **Local Regulations**: Awareness terhadap regulasi lokal

### 3. Business Features
- **Structured Output**: Konsisten dalam format JSON
- **Context Awareness**: Memahami tahap bisnis Churchill & Lewis
- **Actionable Recommendations**: Fokus pada implementasi praktis

## Troubleshooting

### Error: "Gemini API key not found"
```bash
# Pastikan file .env ada dan berisi:
VITE_GEMINI_API_KEY=your_api_key_here

# Restart development server
npm run dev
```

### Error: "Invalid response format"
- Check API key validity
- Verify internet connection
- Check Gemini API status

### Error: "API quota exceeded"
- Check usage di Google AI Studio
- Upgrade plan jika diperlukan
- Implement rate limiting

## Best Practices

### 1. Security
- Jangan expose API key di client-side code
- Gunakan environment variables
- Implement proper error handling

### 2. Performance
- Cache responses untuk mengurangi API calls
- Implement retry logic dengan exponential backoff
- Monitor usage dan costs

### 3. User Experience
- Provide loading indicators
- Graceful fallback ke rule-based system
- Clear error messages untuk users

## Monitoring & Analytics

### 1. API Usage
- Monitor calls per day/month
- Track response times
- Monitor error rates

### 2. Recommendation Quality
- User feedback on recommendations
- Completion rates untuk action items
- Business impact metrics

### 3. Cost Management
- Set up billing alerts
- Monitor token usage
- Optimize prompts untuk efficiency

## Production Deployment

### 1. Environment Variables
```bash
# Production environment
VITE_GEMINI_API_KEY=prod_api_key_here
VITE_APP_ENVIRONMENT=production
```

### 2. Rate Limiting
- Implement client-side rate limiting
- Add server-side proxy jika diperlukan
- Monitor dan alert untuk unusual usage

### 3. Backup Strategy
- Always have rule-based fallback
- Monitor API health
- Implement circuit breaker pattern

## Support

### Google AI Studio
- [Documentation](https://ai.google.dev/docs)
- [Community Forum](https://discuss.ai.google.dev/)
- [Status Page](https://status.ai.google.dev/)

### SiNaik PWA
- Check GitHub issues
- Review application logs
- Contact development team

---

**Note**: Gemini API masih dalam development aktif. Fitur dan pricing dapat berubah. Selalu check dokumentasi terbaru di Google AI Studio.
