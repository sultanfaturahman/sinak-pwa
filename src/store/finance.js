import { defineStore } from 'pinia';
import { addDailyReport, getReports } from '../services/financeService.js';
import { useAuthStore } from './auth';

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    reports: [],
    status: null,
    loading: false,
    error: null,
  }),
  actions: {
    async loadReports() {
      this.loading = true;
      try {
        const auth = useAuthStore();
        this.reports = await getReports(auth.user.uid);
        this.status = auth.user?.umkmStatus || null;
      } catch (e) {
        console.error(e);
        this.error = 'Gagal memuat laporan';
      } finally {
        this.loading = false;
      }
    },
    async addReport(report) {
      this.loading = true;
      try {
        const auth = useAuthStore();
        const status = await addDailyReport(auth.user.uid, report);
        this.status = status;
        this.reports = await getReports(auth.user.uid);
      } catch (e) {
        console.error(e);
        this.error = 'Gagal menyimpan laporan';
      } finally {
        this.loading = false;
      }
    },
  },
});
