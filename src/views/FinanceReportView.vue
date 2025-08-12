<template>
  <div class="finance-report">
    <h1>Laporan Keuangan Harian</h1>
    <form @submit.prevent="save">
      <div>
        <label>Tanggal</label>
        <input type="date" v-model="form.date" />
      </div>
      <div>
        <label>Pendapatan</label>
        <input type="number" v-model.number="form.revenue" />
      </div>
      <div>
        <label>Pengeluaran</label>
        <input type="number" v-model.number="form.expense" />
      </div>
      <button type="submit" :disabled="finance.loading">Simpan</button>
    </form>

    <div v-if="finance.status" class="status">
      Status UMKM: {{ finance.status }}
    </div>

    <ul>
      <li v-for="r in finance.reports" :key="r.id">
        {{ r.date }} - Pendapatan: {{ r.revenue }} | Pengeluaran: {{ r.expense }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useFinanceStore } from '../store/finance.js';

const finance = useFinanceStore();
const form = reactive({
  date: new Date().toISOString().substring(0,10),
  revenue: 0,
  expense: 0,
});

onMounted(() => {
  finance.loadReports();
});

const save = () => {
  finance.addReport({ ...form });
};
</script>

<style scoped>
.finance-report {
  max-width: 400px;
  margin: 0 auto;
}
.finance-report form div {
  margin-bottom: 1rem;
}
</style>
