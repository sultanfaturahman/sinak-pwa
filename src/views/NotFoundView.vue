<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">🔍</div>
      <h1>404</h1>
      <h2>Halaman Tidak Ditemukan</h2>
      <p>Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.</p>
      <div class="action-buttons">
        <router-link to="/" class="home-btn">
          Kembali ke Dashboard
        </router-link>
        <router-link to="/login" class="login-btn">
          Halaman Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// No additional logic needed for 404 page
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.not-found-content h1 {
  font-size: 4rem;
  font-weight: bold;
  color: #667eea;
  margin: 0 0 1rem 0;
}

.not-found-content h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 1rem 0;
}

.not-found-content p {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.home-btn, .login-btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.2s;
  display: inline-block;
}

.home-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.login-btn {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.home-btn:hover, .login-btn:hover {
  transform: translateY(-2px);
}

.login-btn:hover {
  background: #667eea;
  color: white;
}

@media (max-width: 480px) {
  .not-found-content {
    padding: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .home-btn, .login-btn {
    width: 100%;
  }
}
</style>
