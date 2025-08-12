import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { updateUserDocument } from './firestoreService.js';

// Save a daily financial report for a user
export const addDailyReport = async (uid, report) => {
  const reportsCol = collection(db, 'users', uid, 'reports');
  const reportRef = doc(reportsCol, report.date);
  await setDoc(reportRef, {
    ...report,
    createdAt: serverTimestamp()
  });

  const reports = await getReports(uid);
  const status = classifyBusiness(reports);
  await updateUserDocument(uid, { umkmStatus: status });
  return status;
};

// Retrieve all reports for a user ordered by date desc
export const getReports = async (uid) => {
  const reportsCol = collection(db, 'users', uid, 'reports');
  const q = query(reportsCol, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Simple classification based on total net revenue
export const classifyBusiness = (reports) => {
  const total = reports.reduce((sum, r) => sum + (Number(r.revenue) - Number(r.expense)), 0);
  if (total < 50000000) return 'mikro';
  if (total < 300000000) return 'kecil';
  return 'menengah';
};
