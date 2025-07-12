<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>SiNaik</h1>
        <p>Sistem Intervensi Terpandu untuk UMKM</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
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
            placeholder="Masukkan password Anda"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div class="register-link">
        <p>Belum punya akun? <router-link to="/register">Daftar di sini</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { loginUser } from '../services/authService';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  if (loading.value) return;

  loading.value = true;
  error.value = '';

  try {
    const user = await loginUser(email.value, password.value);
    authStore.setUser(user);
    router.push('/');
  } catch (err) {
    console.error('Login error:', err);
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
};

const getErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Email tidak terdaftar';
    case 'auth/wrong-password':
      return 'Password salah';
    case 'auth/invalid-email':
      return 'Format email tidak valid';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi nanti';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi';
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #333;
  margin-bottom: 8px;
  font-size: 2.5rem;
  font-weight: bold;
}

.login-header p {
  color: #666;
  font-size: 0.9rem;
}

.login-form {
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

.login-btn {
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

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
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

.register-link {
  text-align: center;
  margin-top: 20px;
}

.register-link p {
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
