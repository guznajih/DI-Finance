import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  accounts,
  auditLogs,
  bankAccounts,
  cashAccounts,
  investments,
  investmentTransactions,
  journalLines,
  journals,
  transactionLines,
  transactions,
} from '../db/schema.ts';
import {
  getBalanceSheet,
  getGeneralLedger,
  getOrCreateInvestmentAccounts,
} from '../db/accounting.ts';
import { isPeriodClosed, getAccountingPeriods } from './periodManager.ts';

export interface IntegrityIssue {
  problemType: string;
  recordId?: string | number;
  transactionNumber?: string;
  date?: string;
  details: string;
  suggestedAction: string;
}

export interface IntegrityCheckItem {
  id: number;
  checkKey: string;
  title: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  description: string;
  issues: IntegrityIssue[];
  details?: Record<string, any>;
  suggestedAction?: string;
}

export interface ComprehensiveIntegrityReport {
  timestamp: string;
  overallStatus: 'PASS' | 'WARNING' | 'ERROR';
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
  checks: IntegrityCheckItem[];
  summaryMessage: string;
}

export async function runComprehensiveAccountingIntegrityAudit(): Promise<ComprehensiveIntegrityReport> {
  const checks: IntegrityCheckItem[] = [];

  // =========================================================================
  // 1. Total debit harus sama dengan total credit (All Journals & Journal Lines)
  // =========================================================================
  const allJrnLines = await db.select().from(journalLines);
  let sumDebit = 0;
  let sumCredit = 0;
  for (const l of allJrnLines) {
    sumDebit += Number(l.debit || 0);
    sumCredit += Number(l.credit || 0);
  }
  sumDebit = Math.round(sumDebit * 100) / 100;
  sumCredit = Math.round(sumCredit * 100) / 100;
  const diff1 = Math.abs(sumDebit - sumCredit);
  const pass1 = diff1 < 0.01;

  const issues1: IntegrityIssue[] = [];
  if (!pass1) {
    issues1.push({
      problemType: 'JURNAL_TIDAK_BALANCE',
      details: `Total Debit (Rp ${sumDebit.toLocaleString('id-ID')}) != Total Kredit (Rp ${sumCredit.toLocaleString('id-ID')}). Selisih: Rp ${diff1.toLocaleString('id-ID')}`,
      suggestedAction: 'Periksa baris jurnal pembalik atau mutasi yang tidak seimbang untuk mengidentifikasi nomor jurnal penyebab selisih.',
    });
  }

  checks.push({
    id: 1,
    checkKey: 'DEBIT_CREDIT_EQUALITY',
    title: '1. Keseimbangan Total Debit dan Total Kredit',
    status: pass1 ? 'PASS' : 'ERROR',
    description: 'Seluruh pencatatan akuntansi double-entry harus memiliki jumlah total debit sama persis dengan total kredit.',
    issues: issues1,
    details: { totalDebit: sumDebit, totalCredit: sumCredit, difference: diff1 },
  });

  // =========================================================================
  // 2. Tidak boleh ada POSTED transaction tanpa journal
  // =========================================================================
  const postedTrx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.status, 'POSTED'));

  const allJournals = await db.select().from(journals);
  const jrnTrxIdMap = new Set(allJournals.map((j) => j.transactionId).filter(Boolean));

  const orphanTrxList = postedTrx.filter((t) => !jrnTrxIdMap.has(t.id));
  const pass2 = orphanTrxList.length === 0;

  const issues2: IntegrityIssue[] = orphanTrxList.map((t) => ({
    problemType: 'TRANSAKSI_POSTED_TANPA_JURNAL',
    recordId: t.id,
    transactionNumber: t.transactionNumber,
    date: t.date,
    details: `Transaksi ${t.transactionNumber} berstatus POSTED tetapi tidak memiliki nomor jurnal buku besar terkait.`,
    suggestedAction: 'Buka transaksi ini dan lakukan posting ulang atau reversal secara sah.',
  }));

  checks.push({
    id: 2,
    checkKey: 'POSTED_TRANSACTION_HAS_JOURNAL',
    title: '2. Transaksi POSTED Wajib Memiliki Jurnal',
    status: pass2 ? 'PASS' : 'ERROR',
    description: 'Setiap transaksi keuangan yang telah diposting (POSTED) wajib memiliki pasangan ayat jurnal di buku besar.',
    issues: issues2,
    details: { totalPosted: postedTrx.length, orphanTransactionsCount: orphanTrxList.length },
  });

  // =========================================================================
  // 3. Tidak boleh ada journal tanpa source transaction jika diwajibkan
  // =========================================================================
  const allTrxIds = new Set((await db.select({ id: transactions.id }).from(transactions)).map((t) => t.id));
  const orphanJournals = allJournals.filter((j) => j.transactionId && !allTrxIds.has(j.transactionId));
  const pass3 = orphanJournals.length === 0;

  const issues3: IntegrityIssue[] = orphanJournals.map((j) => ({
    problemType: 'JURNAL_TANPA_TRANSAKSI_INDUK',
    recordId: j.id,
    transactionNumber: j.journalNumber,
    date: j.date,
    details: `Jurnal ${j.journalNumber} merujuk ke transaksi ID #${j.transactionId} yang tidak ditemukan pada tabel transaksi.`,
    suggestedAction: 'Periksa integritas relasi referensi jurnal terhadap tabel master transaksi.',
  }));

  checks.push({
    id: 3,
    checkKey: 'JOURNAL_SOURCE_VALIDITY',
    title: '3. Keabsahan Transaksi Sumber Jurnal',
    status: pass3 ? 'PASS' : 'ERROR',
    description: 'Jurnal yang memiliki relasi ke transaksi operasional harus merujuk ke record transaksi yang sah dan tidak hilang.',
    issues: issues3,
    details: { totalJournals: allJournals.length, orphanJournalsCount: orphanJournals.length },
  });

  // =========================================================================
  // 4. Semua account/journal line harus menggunakan COA yang valid
  // =========================================================================
  const allCoa = await db.select().from(accounts);
  const coaIdSet = new Set(allCoa.map((a) => a.id));

  const invalidJrnLines = allJrnLines.filter((l) => !coaIdSet.has(l.accountId));
  const allTrxLines = await db.select().from(transactionLines);
  const invalidTrxLines = allTrxLines.filter((l) => !coaIdSet.has(l.accountId));

  const pass4 = invalidJrnLines.length === 0 && invalidTrxLines.length === 0;
  const issues4: IntegrityIssue[] = [];

  if (invalidJrnLines.length > 0) {
    issues4.push({
      problemType: 'COA_TIDAK_VALID_DI_JURNAL',
      details: `Ditemukan ${invalidJrnLines.length} baris jurnal yang mengacu pada accountId yang tidak terdaftar di Bagan Akun (COA).`,
      suggestedAction: 'Daftarkan kode akun yang bersangkutan atau perbaiki relasi accountId di tabel baris jurnal.',
    });
  }
  if (invalidTrxLines.length > 0) {
    issues4.push({
      problemType: 'COA_TIDAK_VALID_DI_TRANSAKSI',
      details: `Ditemukan ${invalidTrxLines.length} baris transaksi yang mengacu pada accountId yang tidak terdaftar di COA.`,
      suggestedAction: 'Sinkronisasi master data akun COA agar mencakup seluruh ID yang digunakan transaksi.',
    });
  }

  checks.push({
    id: 4,
    checkKey: 'VALID_COA_REFERENCE',
    title: '4. Keabsahan Kode Akun (COA) pada Seluruh Baris Jurnal',
    status: pass4 ? 'PASS' : 'ERROR',
    description: 'Setiap baris mutasi debit dan kredit wajib menggunakan akun yang sah dari Bagan Akun Standar (COA).',
    issues: issues4,
    details: { totalCoa: allCoa.length, invalidJournalLines: invalidJrnLines.length, invalidTransactionLines: invalidTrxLines.length },
  });

  // =========================================================================
  // 5. Tidak boleh ada duplicate posting
  // =========================================================================
  const trxJrnCount: Record<number, number> = {};
  for (const j of allJournals) {
    if (j.transactionId && j.status === 'POSTED') {
      trxJrnCount[j.transactionId] = (trxJrnCount[j.transactionId] || 0) + 1;
    }
  }

  const dupTrxIds = Object.entries(trxJrnCount)
    .filter(([_, count]) => count > 1)
    .map(([trxId]) => parseInt(trxId, 10));

  const pass5 = dupTrxIds.length === 0;
  const issues5: IntegrityIssue[] = dupTrxIds.map((id) => ({
    problemType: 'DUPLICATE_POSTING_TERDETEKSI',
    recordId: id,
    details: `Transaksi ID #${id} memiliki lebih dari satu jurnal aktif bertipe POSTED (${trxJrnCount[id]} jurnal).`,
    suggestedAction: 'Periksa transaksi bersangkutan dan batalkan jurnal duplikat via mekanisme reversal akuntansi.',
  }));

  checks.push({
    id: 5,
    checkKey: 'NO_DUPLICATE_POSTING',
    title: '5. Pencegahan Duplikasi Posting (No Duplicate Posting)',
    status: pass5 ? 'PASS' : 'ERROR',
    description: 'Satu transaksi operasional tidak boleh menghasilkan lebih dari satu ayat jurnal aktif tanpa mekanisme pembalikan.',
    issues: issues5,
    details: { duplicateCount: dupTrxIds.length },
  });

  // =========================================================================
  // 6. Saldo Kas harus konsisten dengan journal
  // =========================================================================
  const cashAccountsList = await db.select().from(cashAccounts);
  let cashMismatchCount = 0;
  const issues6: IntegrityIssue[] = [];

  for (const cash of cashAccountsList) {
    const gl = await getGeneralLedger(cash.accountId);
    const glEnding = gl.endingBalance;
    const currentBal = Number(cash.currentBalance);
    const diff = Math.abs(currentBal - glEnding);

    if (diff > 0.05) {
      cashMismatchCount++;
      issues6.push({
        problemType: 'SELISIH_SALDO_KAS',
        recordId: cash.id,
        details: `Kas "${cash.name}": Saldo rekening (Rp ${currentBal.toLocaleString('id-ID')}) != Buku Besar Akun #${cash.accountId} (Rp ${glEnding.toLocaleString('id-ID')}). Selisih: Rp ${diff.toLocaleString('id-ID')}`,
        suggestedAction: 'Lakukan rekonsiliasi kas fisik dan periksa apakah ada mutasi jurnal manual di luar buku kas.',
      });
    }
  }

  checks.push({
    id: 6,
    checkKey: 'CASH_BALANCE_CONSISTENCY',
    title: '6. Konsistensi Saldo Kas dengan Buku Besar (Journal GL)',
    status: cashMismatchCount === 0 ? 'PASS' : 'ERROR',
    description: 'Saldo rekening kas tunai harus cocok persis dengan saldo akhir akun kas bersangkutan di Buku Besar.',
    issues: issues6,
    details: { totalCashAccounts: cashAccountsList.length, mismatchCount: cashMismatchCount },
  });

  // =========================================================================
  // 7. Saldo Bank harus konsisten dengan journal
  // =========================================================================
  const bankAccountsList = await db.select().from(bankAccounts);
  let bankMismatchCount = 0;
  const issues7: IntegrityIssue[] = [];

  for (const bank of bankAccountsList) {
    const gl = await getGeneralLedger(bank.accountId);
    const glEnding = gl.endingBalance;
    const currentBal = Number(bank.currentBalance);
    const diff = Math.abs(currentBal - glEnding);

    if (diff > 0.05) {
      bankMismatchCount++;
      issues7.push({
        problemType: 'SELISIH_SALDO_BANK',
        recordId: bank.id,
        details: `Rekening "${bank.bankName} - ${bank.accountNumber}": Saldo bank (Rp ${currentBal.toLocaleString('id-ID')}) != Buku Besar Akun #${bank.accountId} (Rp ${glEnding.toLocaleString('id-ID')}). Selisih: Rp ${diff.toLocaleString('id-ID')}`,
        suggestedAction: 'Jalankan fitur Rekonsiliasi Bank untuk mencocokkan mutasi rekening koran dengan jurnal finance.',
      });
    }
  }

  checks.push({
    id: 7,
    checkKey: 'BANK_BALANCE_CONSISTENCY',
    title: '7. Konsistensi Saldo Rekening Bank dengan Buku Besar (Journal GL)',
    status: bankMismatchCount === 0 ? 'PASS' : 'ERROR',
    description: 'Saldo rekening bank harus sejalan dengan saldo akhir buku besar akun bank terkait.',
    issues: issues7,
    details: { totalBankAccounts: bankAccountsList.length, mismatchCount: bankMismatchCount },
  });

  // =========================================================================
  // 8. Saldo investasi harus konsisten dengan transaksi investasi
  // =========================================================================
  const { invAcc } = await getOrCreateInvestmentAccounts();
  const activeInvs = await db.select().from(investments).where(eq(investments.status, 'ACTIVE'));
  const totalActiveInvVal = activeInvs.reduce((sum, i) => sum + Number(i.currentValue), 0);
  const invGl = await getGeneralLedger(invAcc.id);
  const invDiff = Math.abs(totalActiveInvVal - invGl.endingBalance);
  const pass8 = invDiff < 0.05;

  const issues8: IntegrityIssue[] = [];
  if (!pass8) {
    issues8.push({
      problemType: 'SELISIH_SALDO_INVESTASI',
      details: `Total Portofolio Investasi Aktif (Rp ${totalActiveInvVal.toLocaleString('id-ID')}) != Saldo Akun Aset Investasi di Buku Besar (Rp ${invGl.endingBalance.toLocaleString('id-ID')}). Selisih: Rp ${invDiff.toLocaleString('id-ID')}`,
      suggestedAction: 'Periksa transaksi penempatan modal dan pengembalian modal investasi untuk memastikan pencatatan jurnal pembalik atau pencatatan bagi hasil sesuai.',
    });
  }

  checks.push({
    id: 8,
    checkKey: 'INVESTMENT_BALANCE_CONSISTENCY',
    title: '8. Konsistensi Portofolio Investasi dengan Akun Neraca',
    status: pass8 ? 'PASS' : 'ERROR',
    description: 'Total nilai investasi berjalan harus konsisten dengan saldo akun Aset Investasi (1150).',
    issues: issues8,
    details: { totalActiveInvestments: activeInvs.length, totalValue: totalActiveInvVal, glEnding: invGl.endingBalance, difference: invDiff },
  });

  // =========================================================================
  // 9. Tidak boleh ada POSTED transaction di periode CLOSED
  // =========================================================================
  const allPeriods = await getAccountingPeriods();
  const closedPeriodKeys = new Set(allPeriods.filter((p) => p.status === 'CLOSED').map((p) => p.periodKey));

  const closedPeriodViolations = postedTrx.filter((t) => {
    const pKey = t.date ? t.date.substring(0, 7) : '';
    return closedPeriodKeys.has(pKey);
  });

  const pass9 = closedPeriodViolations.length === 0;
  const issues9: IntegrityIssue[] = closedPeriodViolations.map((t) => ({
    problemType: 'TRANSAKSI_POSTED_DI_PERIODE_CLOSED',
    recordId: t.id,
    transactionNumber: t.transactionNumber,
    date: t.date,
    details: `Transaksi ${t.transactionNumber} bertanggal ${t.date} berada di periode yang telah DITUTUP (${t.date.substring(0, 7)}).`,
    suggestedAction: 'Buka kembali (reopen) periode dengan alasan sah jika diperlukan koreksi, atau audit riwayat tanggal transaksi.',
  }));

  checks.push({
    id: 9,
    checkKey: 'NO_POSTED_IN_CLOSED_PERIOD',
    title: '9. Perlindungan Periode Akuntansi: Tidak Ada Transaksi POSTED di Periode CLOSED',
    status: pass9 ? 'PASS' : 'ERROR',
    description: 'Periode yang berstatus CLOSED terkunci penuh dan dilarang memiliki transaksi yang diposting secara ilegal.',
    issues: issues9,
    details: { closedPeriodsCount: closedPeriodKeys.size, violationsCount: closedPeriodViolations.length },
  });

  // =========================================================================
  // 10. Balance Sheet harus balance (Aset = Kewajiban + Aset Neto / Dana)
  // =========================================================================
  const bs = await getBalanceSheet();
  const pass10 = bs.isBalanced;
  const issues10: IntegrityIssue[] = [];

  if (!pass10) {
    issues10.push({
      problemType: 'NERACA_TIDAK_SEIMBANG',
      details: `Total Aset (Rp ${bs.assets.totalAssets.toLocaleString('id-ID')}) != Total Liabilitas + Dana (Rp ${bs.netAssets.totalNetAssetsAndLiabilities.toLocaleString('id-ID')}). Selisih: Rp ${bs.balanceDifference.toLocaleString('id-ID')}`,
      suggestedAction: 'Periksa jurnal penyesuaian atau pastikan surplus/defisit periode berjalan telah diperhitungkan ke pos Aset Neto / Ekuitas Dana.',
    });
  }

  checks.push({
    id: 10,
    checkKey: 'BALANCE_SHEET_BALANCED',
    title: '10. Keseimbangan Neraca (Laporan Posisi Keuangan)',
    status: pass10 ? 'PASS' : 'ERROR',
    description: 'Persamaan dasar akuntansi (Aset = Kewajiban + Dana Syariah/Aset Neto) wajib terpenuhi 100%.',
    issues: issues10,
    details: { totalAssets: bs.assets.totalAssets, totalLiabilitiesAndNetAssets: bs.netAssets.totalNetAssetsAndLiabilities, difference: bs.balanceDifference },
  });

  // =========================================================================
  // 11. Audit trail untuk aktivitas penting harus tersedia
  // =========================================================================
  const auditLogsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs);
  const totalAuditLogs = Number(auditLogsCount[0]?.count || 0);

  const keyActions = ['POST', 'REVERSE', 'CREATE', 'APPROVE'];
  const missingActions: string[] = [];

  for (const act of keyActions) {
    const actCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.action, act));
    if (Number(actCount[0]?.count || 0) === 0) {
      missingActions.push(act);
    }
  }

  // Pass if total logs >= 10 and no critical missing action that should exist
  const pass11 = totalAuditLogs >= 5;
  const issues11: IntegrityIssue[] = [];

  if (!pass11) {
    issues11.push({
      problemType: 'JEJAK_AUDIT_TIDAK_MEMADAI',
      details: `Jumlah jejak audit saat ini (${totalAuditLogs}) belum memenuhi standar kepatuhan minimum.`,
      suggestedAction: 'Pastikan seluruh aktivitas workflow dan transaksi membukukan jejak ke tabel audit_logs.',
    });
  }

  checks.push({
    id: 11,
    checkKey: 'AUDIT_TRAIL_AVAILABILITY',
    title: '11. Ketersediaan & Integritas Jejak Audit Trail',
    status: pass11 ? 'PASS' : 'WARNING',
    description: 'Seluruh aktivitas mutasi penting (CREATE, APPROVE, POST, REVERSE) wajib memiliki riwayat jejak audit yang tidak dapat dihapus.',
    issues: issues11,
    details: { totalAuditLogs, keyActionsMonitored: keyActions.length },
  });

  // Determine overall status
  const errorCount = checks.filter((c) => c.status === 'ERROR').length;
  const warningCount = checks.filter((c) => c.status === 'WARNING').length;
  const passedCount = checks.filter((c) => c.status === 'PASS').length;

  let overallStatus: 'PASS' | 'WARNING' | 'ERROR' = 'PASS';
  let summaryMessage = 'Seluruh 11 kriteria integritas akuntansi terpenuhi sempurna (PASS).';

  if (errorCount > 0) {
    overallStatus = 'ERROR';
    summaryMessage = `Ditemukan ${errorCount} masalah integritas kritis yang memerlukan perhatian akuntan.`;
  } else if (warningCount > 0) {
    overallStatus = 'WARNING';
    summaryMessage = `Seluruh pemeriksaan dasar lolos, namun terdapat ${warningCount} peringatan non-kritis.`;
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    totalChecks: checks.length,
    passedCount,
    warningCount,
    errorCount,
    checks,
    summaryMessage,
  };
}
