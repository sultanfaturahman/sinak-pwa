<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>SiNaik</h1>
        <p>Daftar untuk Memulai Perjalanan UMKM Anda</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="namaUsaha">Nama Usaha</label>
          <input
            id="namaUsaha"
            type="text"
            v-model="namaUsaha"
            placeholder="Masukkan nama usaha Anda"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="Masukkan email Anda"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="Minimal 6 karakter"
            required
            minlength="6"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Konfirmasi Password</label>
          <input
            id="confirmPassword"
            type="password"
            v-model="confirmPassword"
            placeholder="Ulangi password Anda"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="register-btn" :disabled="loading || !isFormValid">
          {{ loading ? 'Mendaftar...' : 'Daftar' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div class="login-link">
        <p>Sudah punya akun? <router-link to="/login">Masuk di sini</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { registerUser } from '../services/authService';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const namaUsaha = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const authStore = useAuthStore();
const router = useRouter();

const isFormValid = computed(() => {
  return namaUsaha.value.trim() &&
         email.value.trim() &&
         password.value.length >= 6 &&
         password.value === confirmPassword.value;
});

const handleRegister = async () => {
  if (loading.value || !isFormValid.value) return;

  if (password.value !== confirmPassword.value) {
    error.value = 'Password dan konfirmasi password tidak sama';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const user = await registerUser(email.value, password.value, namaUsaha.value);
    authStore.setUser(user);
    router.push('/');
  } catch (err) {
    console.error('Registration error:', err);
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const getErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar';
    case 'auth/invalid-email':
      return 'Format email tidak valid';
    case 'auth/weak-password':
      return 'Password terlalu lemah';
    case 'auth/operation-not-allowed':
      return 'Registrasi tidak diizinkan';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi';
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 2.5rem;
  font-weight: bold;
}

.register-header p {
  color: #666;
  font-size: 0.9rem;
}

.register-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.register-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 6px;
  margin-top: 15px;
  text-align: center;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link p {
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
