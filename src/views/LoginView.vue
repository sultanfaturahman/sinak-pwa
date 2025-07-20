<template>
  <div class="login-container">
    <!-- Background Pattern -->
    <div class="background-pattern"></div>

    <!-- Login Card -->
    <div class="login-card">
      <!-- Header Section -->
      <div class="login-header">
        <div class="logo-section">
          <h1 class="app-title">SiNaik</h1>
          <p class="app-subtitle">Sistem Intervensi Terpandu UMKM</p>
        </div>
        <p class="welcome-text">Masuk ke akun Anda</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <div class="error-icon">⚠️</div>
        <div class="error-text">{{ error }}</div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Email Input -->
        <div class="input-group">
          <label for="email" class="input-label">Email</label>
          <div class="input-wrapper">
            <input
              id="email"
              type="email"
              v-model="email"
              placeholder="Masukkan email Anda"
              class="form-input"
              :class="{ 'input-error': emailError }"
              required
              autocomplete="email"
            />
            <div class="input-icon">📧</div>
          </div>
          <div v-if="emailError" class="field-error">{{ emailError }}</div>
        </div>

        <!-- Password Input -->
        <div class="input-group">
          <label for="password" class="input-label">Password</label>
          <div class="input-wrapper">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Masukkan password Anda"
              class="form-input"
              :class="{ 'input-error': passwordError }"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="password-toggle"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="passwordError" class="field-error">{{ passwordError }}</div>
        </div>

        <!-- Forgot Password Link -->
        <div class="forgot-password-section">
          <button
            type="button"
            @click="handleForgotPassword"
            class="forgot-password-link"
            :disabled="loading"
          >
            Lupa password?
          </button>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          class="login-btn"
          :disabled="loading || !isFormValid"
          :class="{ 'btn-loading': loading }"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <!-- Register Link -->
      <div class="register-section">
        <p class="register-text">
          Belum punya akun?
          <router-link to="/register" class="register-link">
            Daftar di sini
          </router-link>
        </p>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotModal" class="modal-overlay" @click="closeForgotModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Reset Password</h3>
          <button @click="closeForgotModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
          </p>
          <div class="input-group">
            <label for="reset-email" class="input-label">Email</label>
            <input
              id="reset-email"
              type="email"
              v-model="resetEmail"
              placeholder="Masukkan email Anda"
              class="form-input"
              required
            />
          </div>
        </div>
        <div class="modal-actions">
          <button
            @click="closeForgotModal"
            class="btn btn-secondary"
            :disabled="resetLoading"
          >
            Batal
          </button>
          <button
            @click="handleResetPassword"
            class="btn btn-primary"
            :disabled="resetLoading || !resetEmail"
          >
            <span v-if="resetLoading" class="loading-spinner"></span>
            {{ resetLoading ? 'Mengirim...' : 'Kirim Link Reset' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { loginUser, resetPassword } from '../services/authService';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

// Reactive data
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const emailError = ref('');
const passwordError = ref('');

// Forgot password modal
const showForgotModal = ref(false);
const resetEmail = ref('');
const resetLoading = ref(false);

// Store and router
const authStore = useAuthStore();
const router = useRouter();

// Computed properties
const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== '';
});

// Methods
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const validateForm = () => {
  let isValid = true;

  // Reset errors
  emailError.value = '';
  passwordError.value = '';
  error.value = '';

  // Email validation
  if (!email.value.trim()) {
    emailError.value = 'Email harus diisi';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Format email tidak valid';
    isValid = false;
  }

  // Password validation
  if (!password.value.trim()) {
    passwordError.value = 'Password harus diisi';
    isValid = false;
  } else if (password.value.length < 6) {
    passwordError.value = 'Password minimal 6 karakter';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    console.log('🔄 Attempting login...');
    const user = await loginUser(email.value, password.value);

    console.log('✅ Login successful:', user);
    authStore.setUser(user);

    // Redirect to dashboard
    router.push('/');
  } catch (err) {
    console.error('❌ Login error:', err);

    // Handle specific Firebase Auth errors
    if (err.code === 'auth/user-not-found') {
      error.value = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.';
    } else if (err.code === 'auth/wrong-password') {
      error.value = 'Password salah. Silakan coba lagi.';
    } else if (err.code === 'auth/invalid-email') {
      error.value = 'Format email tidak valid.';
    } else if (err.code === 'auth/too-many-requests') {
      error.value = 'Terlalu banyak percobaan login. Coba lagi nanti.';
    } else {
      error.value = 'Terjadi kesalahan saat login. Silakan coba lagi.';
    }
  } finally {
    loading.value = false;
  }
};

const handleForgotPassword = () => {
  resetEmail.value = email.value; // Pre-fill with current email
  showForgotModal.value = true;
};

const closeForgotModal = () => {
  showForgotModal.value = false;
  resetEmail.value = '';
};

const handleResetPassword = async () => {
  if (!resetEmail.value.trim()) return;

  resetLoading.value = true;

  try {
    await resetPassword(resetEmail.value);

    // Show success message
    error.value = '';
    alert('Link reset password telah dikirim ke email Anda. Silakan cek inbox dan folder spam.');

    closeForgotModal();
  } catch (err) {
    console.error('❌ Reset password error:', err);

    if (err.code === 'auth/user-not-found') {
      alert('Email tidak terdaftar dalam sistem.');
    } else {
      alert('Terjadi kesalahan saat mengirim email reset. Silakan coba lagi.');
    }
  } finally {
    resetLoading.value = false;
  }
};
</script>

<style scoped>
/* Login Container */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* Background Pattern */
.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  background-size: 100px 100px;
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Login Card */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

/* Header Section */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-section {
  margin-bottom: 1rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.app-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

.welcome-text {
  color: #374151;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1px solid #f87171;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-text {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

/* Form Styling */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  padding-right: 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #1f2937;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-icon {
  position: absolute;
  right: 1rem;
  color: #9ca3af;
  font-size: 1.125rem;
  pointer-events: none;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0.25rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  color: #6b7280;
}

.password-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.password-toggle:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.field-error {
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Forgot Password Section */
.forgot-password-section {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.5rem;
}

.forgot-password-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.forgot-password-link:hover {
  color: #5a67d8;
  text-decoration: underline;
}

.forgot-password-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Login Button */
.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  margin-top: 0.5rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.login-btn.btn-loading {
  pointer-events: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Register Section */
.register-section {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.register-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.register-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #5a67d8;
  text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0 1.5rem;
}

.modal-header h3 {
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 40px;
}

.btn-secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 0.5rem;
    border-radius: 16px;
  }

  .app-title {
    font-size: 2rem;
  }

  .modal-content {
    margin: 0.5rem;
    border-radius: 12px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 320px) {
  .login-card {
    padding: 1.5rem 1rem;
  }

  .app-title {
    font-size: 1.75rem;
  }
}

/* Focus styles for better accessibility */
.form-input:focus-visible,
.login-btn:focus-visible,
.forgot-password-link:focus-visible,
.register-link:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .login-card {
    border: 2px solid #000;
  }

  .form-input {
    border-width: 2px;
  }

  .error-message {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
