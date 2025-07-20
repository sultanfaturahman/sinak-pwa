<template>
  <div>
    <h1>Register</h1>
    <form @submit.prevent="register">
      <input type="text" v-model="namaUsaha" placeholder="Nama Usaha" />
      <input type="email" v-model="email" placeholder="Email" />
      <input type="password" v-model="password" placeholder="Password" />
      <button type="submit">Daftar</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { registerUser } from '../services/authService';
import { useRouter } from 'vue-router';

const namaUsaha = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();

const register = async () => {
  try {
    await registerUser(email.value, password.value, namaUsaha.value);
    router.push('/');
  } catch (error) {
    console.error(error);
  }
};
</script>
