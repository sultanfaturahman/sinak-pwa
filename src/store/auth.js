import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isLoggedIn: false,
    loading: false,
  }),

  getters: {
    // Getter untuk mendapatkan nama usaha
    businessName: (state) => {
      return state.user?.namaUsaha || 'Pengguna';
    },

    // Getter untuk mendapatkan email user
    userEmail: (state) => {
      return state.user?.email || '';
    },

    // Getter untuk mendapatkan UID user
    userId: (state) => {
      return state.user?.uid || null;
    },
  },

  actions: {
    // Set user data dan update status login
    setUser(userData) {
      this.user = userData;
      this.isLoggedIn = !!userData;

      // Simpan ke localStorage untuk persistence
      if (userData) {
        localStorage.setItem('sinak_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('sinak_user');
      }
    },

    // Set loading state
    setLoading(status) {
      this.loading = status;
    },

    // Clear user data (logout)
    clearUser() {
      this.user = null;
      this.isLoggedIn = false;
      localStorage.removeItem('sinak_user');
    },

    // Initialize user dari localStorage
    initializeAuth() {
      const savedUser = localStorage.getItem('sinak_user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          this.user = userData;
          this.isLoggedIn = true;
          console.log('✅ User restored from localStorage:', userData.email);
        } catch (error) {
          console.error('❌ Error parsing saved user data:', error);
          localStorage.removeItem('sinak_user');
        }
      } else {
        console.log('ℹ️ No saved user found in localStorage');
      }
    },

    // Update user profile data
    updateUserProfile(profileData) {
      if (this.user) {
        this.user = { ...this.user, ...profileData };
        localStorage.setItem('sinak_user', JSON.stringify(this.user));
        console.log('✅ User profile updated:', profileData);
      }
    },
  },
});
