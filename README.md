# 🚀 SiNaik PWA

**Sistem Intervensi Terpandu untuk UMKM Indonesia**

SiNaik adalah Progressive Web App yang dirancang untuk membantu Usaha Mikro di Indonesia meningkatkan literasi keuangan dan mendorong pertumbuhan bisnis melalui diagnosis tahap bisnis, rekomendasi terpersonalisasi, dan gamifikasi.

## ✨ Fitur Utama

- 📊 **Diagnosis Bisnis** - Analisis tahap perkembangan berdasarkan model Churchill & Lewis
- 💡 **Rekomendasi Terpersonalisasi** - Saran aksi yang disesuaikan dengan kondisi bisnis
- 🎯 **Gamifikasi** - Sistem poin dan pencapaian berdasarkan Kerangka Octalysis
- 📱 **Progressive Web App** - Dapat diinstall dan bekerja offline
- 🔐 **Autentikasi Aman** - Login/register dengan Firebase Auth
- 💾 **Sinkronisasi Data** - Data tersimpan di cloud dengan Firestore

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 (Composition API + `<script setup>`)
- **Routing**: Vue Router 4
- **State Management**: Pinia
- **Backend**: Firebase v9+ (Auth, Firestore, Hosting)
- **Build Tool**: Vite
- **Styling**: CSS3 dengan design system modern
- **PWA**: Service Worker + Web App Manifest

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm atau yarn
- Firebase account

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/[username]/sinak-pwa.git
   cd sinak-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` dengan konfigurasi Firebase Anda.

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Firebase
firebase serve       # Serve built app locally
firebase deploy      # Deploy to Firebase Hosting
```

## 📁 Project Structure

```
sinak-pwa/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   └── common/      # Common UI components
│   ├── views/           # Page components
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── DashboardView.vue
│   │   └── NotFoundView.vue
│   ├── router/          # Vue Router configuration
│   ├── store/           # Pinia stores
│   │   └── auth.js      # Authentication store
│   ├── services/        # API services
│   │   ├── firebase.js      # Firebase configuration
│   │   ├── authService.js   # Authentication service
│   │   └── firestoreService.js # Firestore operations
│   ├── App.vue          # Root component
│   ├── main.js          # App entry point
│   └── style.css        # Global styles
├── firebase.json        # Firebase configuration
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🔥 Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project or use existing

2. **Enable Services**
   - Authentication (Email/Password)
   - Firestore Database
   - Hosting

3. **Get Configuration**
   - Project Settings → General → Your apps
   - Copy config to `.env.local`

4. **Security Rules** (Development)
   ```javascript
   // Firestore Rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🎨 Design System

SiNaik menggunakan design system yang konsisten:

- **Colors**: Gradient biru-ungu (#667eea → #764ba2)
- **Typography**: Inter font family
- **Components**: Modern card-based layout
- **Responsive**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliant

## 📱 PWA Features

- ✅ Responsive design
- ✅ Offline capability (planned)
- ✅ Installable
- ✅ Fast loading
- ✅ Secure (HTTPS)

## 🧪 Testing

```bash
# Unit tests (planned)
npm run test

# E2E tests (planned)
npm run test:e2e
```

## 🚀 Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy
```

### Other Platforms

- **Vercel**: Connect GitHub repo
- **Netlify**: Drag & drop `dist` folder
- **GitHub Pages**: Use GitHub Actions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: [Your Name]
- **Designer**: [Designer Name]
- **Product Manager**: [PM Name]

## 📞 Support

- 📧 Email: support@sinak.app
- 💬 Discord: [Discord Link]
- 📖 Documentation: [Docs Link]

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Firebase team for the backend infrastructure
- Indonesian UMKM community for inspiration

---

**Made with ❤️ for Indonesian UMKM**
