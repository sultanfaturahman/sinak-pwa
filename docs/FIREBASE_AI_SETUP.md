# Firebase AI Logic Setup Guide

## Overview

SiNaik PWA menggunakan Firebase AI Logic dengan Gemini Developer API untuk menghasilkan rekomendasi bisnis yang dipersonalisasi. Pendekatan ini lebih aman karena API key dikelola oleh Firebase, bukan di client code.

## Keunggulan Firebase AI Logic

### 🔒 Security Benefits
- **API Key Management**: API key Gemini dikelola oleh Firebase, tidak exposed di client
- **Secure Backend**: Requests diproses melalui Firebase infrastructure
- **No Client-Side Secrets**: Tidak ada sensitive data di browser

### ⚡ Performance Benefits
- **Optimized Routing**: Firebase mengoptimalkan routing ke Gemini API
- **Built-in Caching**: Firebase menyediakan caching layer
- **Better Error Handling**: Integrated error handling dan retry logic

### 🛠️ Development Benefits
- **Simplified Integration**: Tidak perlu manage API keys secara manual
- **Consistent Interface**: Menggunakan Firebase SDK yang familiar
- **Automatic Updates**: Firebase mengelola updates ke Gemini API

## Setup Instructions

### Step 1: Enable Firebase AI in Console

1. **Buka Firebase Console**
   - Navigate ke [Firebase Console](https://console.firebase.google.com/)
   - Pilih project "sinaik-pwa"

2. **Enable AI Services**
   - Go to "Build" → "AI" di sidebar
   - Click "Get Started" untuk enable Firebase AI
   - Accept terms and conditions

3. **Configure Gemini API**
   - Firebase akan otomatis setup Gemini Developer API
   - Tidak perlu manual API key configuration

### Step 2: Verify Project Configuration

Pastikan Firebase project sudah dikonfigurasi dengan benar:

```javascript
// firebase.js - Configuration sudah benar
const firebaseConfig = {
  apiKey: "AIzaSyBhZvHQT5Omr8L_O9sn-BFrni6GzPu4pqU",
  authDomain: "sinaik-pwa.firebaseapp.com",
  projectId: "sinaik-pwa",
  storageBucket: "sinaik-pwa.firebasestorage.app",
  messagingSenderId: "801751969697",
  appId: "1:801751969697:web:1461a75e437828126265e0",
  measurementId: "G-JHY41YCETE"
};
```

### Step 3: Test AI Integration

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Check Console Logs**
   - Buka Developer Tools (F12)
   - Look for: "✅ Firebase AI initialized with Gemini 2.5 Flash"

3. **Test Recommendations**
   - Complete business diagnosis
   - Navigate to recommendations page
   - Verify AI recommendations are generated

## Implementation Details

### Firebase AI Initialization

```javascript
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

// Initialize the Gemini Developer API backend service
const ai = getAI(app, { backend: new GoogleAIBackend() });

// Create a GenerativeModel instance
const geminiModel = getGenerativeModel(ai, { 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.8,
    maxOutputTokens: 8192,
  }
});
```

### Generating Recommendations

```javascript
// Generate content using Firebase AI
const result = await geminiModel.generateContent(prompt);
const response = result.response;
const aiResponse = response.text();
```

## Model Configuration

### Gemini 2.5 Flash Settings
- **Model**: `gemini-2.5-flash` (Latest available)
- **Max Output Tokens**: 8192
- **Temperature**: 0.7 (Balanced creativity)
- **Top K**: 40 (Token selection diversity)
- **Top P**: 0.8 (Nucleus sampling)

### Safety Settings
- **Harassment**: BLOCK_MEDIUM_AND_ABOVE
- **Hate Speech**: BLOCK_MEDIUM_AND_ABOVE
- **Sexually Explicit**: BLOCK_MEDIUM_AND_ABOVE
- **Dangerous Content**: BLOCK_MEDIUM_AND_ABOVE

## Error Handling

### Graceful Degradation
```javascript
try {
  // Try Firebase AI
  const result = await geminiModel.generateContent(prompt);
  return parseAIResponse(result.response.text());
} catch (error) {
  // Fallback to rule-based recommendations
  console.log('🔄 Falling back to rule-based recommendations');
  return generateRuleBasedRecommendations(businessProfile);
}
```

### Common Error Scenarios
1. **Firebase AI Not Available**: Falls back to rule-based system
2. **Network Issues**: Cached recommendations used
3. **Rate Limiting**: Automatic retry with exponential backoff
4. **Invalid Response**: Error parsing handled gracefully

## Monitoring & Analytics

### Console Logs to Monitor
```
✅ Firebase AI initialized with Gemini 2.5 Flash
🤖 Generating AI recommendations with Firebase AI + Gemini 2.5 Flash...
✅ Firebase AI + Gemini recommendations generated successfully
```

### Error Logs to Watch
```
⚠️ Firebase AI initialization failed
❌ Error generating Firebase AI recommendations
🔄 Falling back to rule-based recommendations
```

## Troubleshooting

### Issue: "Firebase AI initialization failed"
**Solution:**
1. Check Firebase Console - ensure AI is enabled
2. Verify project configuration
3. Check network connectivity
4. Ensure latest Firebase SDK version

### Issue: "Empty response from Gemini model"
**Solution:**
1. Check prompt format and length
2. Verify safety settings aren't too restrictive
3. Monitor Firebase Console for quota limits
4. Check model availability status

### Issue: "Fallback to rule-based recommendations"
**Solution:**
1. This is normal behavior when AI is unavailable
2. Check Firebase AI status in console
3. Verify internet connectivity
4. Monitor Firebase project quotas

## Best Practices

### 1. Prompt Engineering
- Keep prompts focused and specific
- Include clear output format requirements
- Provide sufficient context for Indonesian UMKM
- Use structured input format

### 2. Error Handling
- Always implement fallback mechanisms
- Log errors for monitoring
- Provide user-friendly error messages
- Don't expose technical errors to users

### 3. Performance Optimization
- Cache AI responses locally
- Implement request debouncing
- Use loading indicators
- Optimize prompt length

### 4. Security
- Never expose API keys in client code
- Use Firebase security rules
- Implement proper authentication
- Monitor usage patterns

## Production Deployment

### 1. Firebase Project Setup
- Ensure production Firebase project has AI enabled
- Configure proper security rules
- Set up monitoring and alerts
- Configure billing limits

### 2. Environment Configuration
```env
# Production environment
VITE_FIREBASE_PROJECT_ID=sinaik-pwa-prod
VITE_APP_ENVIRONMENT=production
```

### 3. Monitoring
- Set up Firebase Analytics
- Monitor AI usage and costs
- Track error rates and fallback usage
- Monitor user engagement with recommendations

## Cost Management

### Firebase AI Pricing
- Gemini 2.5 Flash: Cost-effective for high volume
- Pay-per-use model
- No upfront costs
- Automatic scaling

### Optimization Strategies
- Implement response caching
- Optimize prompt length
- Use appropriate model for use case
- Monitor and set usage alerts

## Support Resources

### Firebase Documentation
- [Firebase AI Logic Guide](https://firebase.google.com/docs/ai)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Console](https://console.firebase.google.com/)

### SiNaik PWA Support
- Check GitHub issues
- Review application logs
- Contact development team
- Community discussions

---

**Note**: Firebase AI Logic dengan Gemini adalah solusi yang lebih aman dan scalable dibandingkan direct API calls. Semua API key management ditangani oleh Firebase infrastructure.
