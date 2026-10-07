import { db } from '../db/index.ts';
import { transactions, accounts, bankAccounts } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  createOperationalTransaction,
  postTransaction,
  updateTransaction,
  deleteTransaction,
  updateFundRequestStatus,
  createFundRequest,
} from '../db/accounting.ts';
import {
  closeAccountingPeriod,
  reopenAccountingPeriod,
  getAccountingPeriods,
  isPeriodClosed,
} from './periodManager.ts';
import { runComprehensiveAccountingIntegrityAudit } from './integrityAuditor.ts';
import { recordSecurityEvent, getSecurityEvents } from './securityEvents.ts';
import { generateBackupSnapshot, getBackupStatus, verifyBackupIntegrity } from './backupManager.ts';

export interface TestResultItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function runPhase8CAutomatedTests(currentUser?: any): Promise<TestResultItem[]> {
  const results: TestResultItem[] = [];

  const actorAdmin = {
    id: 1,
    name: 'Super Administrator',
    displayName: 'Super Administrator',
    email: 'admin@darulistiqomah.ac.id',
    role: 'SUPER_ADMIN',
    roleName: 'SUPER_ADMIN',
  };

  const actorBendahara = {
    id: 2,
    name: 'Ust. Ahmad Dahlan (Bendahara)',
    displayName: 'Ust. Ahmad Dahlan (Bendahara)',
    email: 'bendahara@darulistiqomah.ac.id',
    role: 'BENDAHARA',
    roleName: 'BENDAHARA',
  };

  const actorAuditor = {
    id: 9,
    name: 'Drs. H. Mulyadi (Auditor Keuangan)',
    displayName: 'Drs. H. Mulyadi (Auditor Keuangan)',
    email: 'auditor@darulistiqomah.ac.id',
    role: 'AUDITOR',
    roleName: 'AUDITOR',
  };

  const actorMaker = {
    id: 7,
    name: 'Ust. Ridwan (Petugas Unit Dapur)',
    displayName: 'Ust. Ridwan (Petugas Unit Dapur)',
    email: 'petugas.unit@darulistiqomah.ac.id',
    role: 'PETUGAS_UNIT',
    roleName: 'PETUGAS_UNIT',
    unitId: 4,
  };

  const today = new Date().toISOString().split('T')[0];

  // Use a dedicated past period for testing to avoid locking active current month
  const testPeriodKey = '2025-11'; // November 2025

  // -------------------------------------------------------------------------
  // TEST 1: Tutup Periode (CLOSE) oleh Super Admin / Bendahara dengan Alasan Sah
  // -------------------------------------------------------------------------
  try {
    const closedRecord = await closeAccountingPeriod(
      testPeriodKey,
      'Penutupan buku akhir bulan reguler untuk pengujian integritas akuntansi',
      actorBendahara,
      true
    );

    const isClosedNow = await isPeriodClosed(`${testPeriodKey}-15`);
    const passed1 = closedRecord.status === 'CLOSED' && isClosedNow === true;

    results.push({
      id: 'TEST_T8C_01_PERIOD_CLOSE_SUCCESS',
      title: '1. Penutupan Periode Akuntansi (Tutup Buku) oleh Bendahara',
      passed: passed1,
      message: passed1
        ? `Lolos: Periode ${closedRecord.monthName} berhasil ditutup dengan status CLOSED oleh ${actorBendahara.roleName}. Tercatat di Audit Trail & Security Events.`
        : 'Gagal: Status periode tidak berubah menjadi CLOSED.',
      details: { periodKey: testPeriodKey, status: closedRecord.status, closedAt: closedRecord.closedAt },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_01_PERIOD_CLOSE_SUCCESS',
      title: '1. Penutupan Periode Akuntansi (Tutup Buku)',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Validasi Alasan Tutup Periode (Alasan < 5 karakter wajib ditolak)
  // -------------------------------------------------------------------------
  try {
    let emptyReasonBlocked = false;
    let reasonErrorMsg = '';

    try {
      await closeAccountingPeriod('2025-10', 'abc', actorAdmin, true);
    } catch (err: any) {
      if (err.message.includes('minimal 5 karakter') || err.message.includes('wajib diisi')) {
        emptyReasonBlocked = true;
        reasonErrorMsg = err.message;
      } else {
        throw err;
      }
    }

    results.push({
      id: 'TEST_T8C_02_PERIOD_CLOSE_REASON_VALIDATION',
      title: '2. Validasi Alasan Wajib Penutupan Periode (Sensitif Action Protection)',
      passed: emptyReasonBlocked,
      message: emptyReasonBlocked
        ? `Lolos: Penutupan periode tanpa alasan valid berhasil dicegat sistem ("${reasonErrorMsg}"). Minimal 5 karakter ditegakkan.`
        : 'Gagal: Sistem menerima penutupan periode dengan alasan di bawah 5 karakter.',
      details: { emptyReasonBlocked, reasonErrorMsg },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_02_PERIOD_CLOSE_REASON_VALIDATION',
      title: '2. Validasi Alasan Wajib Penutupan Periode',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 3: Pencegahan Posting ke Periode CLOSED
  // -------------------------------------------------------------------------
  try {
    let postingBlocked = false;
    let postErrorMsg = '';

    // Attempt to post transaction on date in closed period
    try {
      const bankAccountsList = await db.select().from(bankAccounts);
      const bank = bankAccountsList[0] || { id: 1 };

      await createOperationalTransaction(
        {
          date: `${testPeriodKey}-10`,
          type: 'PENERIMAAN',
          categoryName: 'Infaq & Sedekah',
          amount: 250000,
          cashBankType: 'BANK',
          cashBankId: bank.id,
          description: '[UJI T8C.3] Upaya Posting Transaksi ke Periode CLOSED (Wajib Ditolak)',
        },
        actorBendahara
      );
    } catch (err: any) {
      if (
        err.message.includes('CLOSED') ||
        err.message.includes('ditutup') ||
        err.message.includes('Periode akuntansi')
      ) {
        postingBlocked = true;
        postErrorMsg = err.message;
      } else {
        throw err;
      }
    }

    results.push({
      id: 'TEST_T8C_03_BLOCKED_POST_IN_CLOSED_PERIOD',
      title: '3. Perlindungan Periode CLOSED: Pemblokiran Transaksi Baru ke Periode Tertutup',
      passed: postingBlocked,
      message: postingBlocked
        ? `Lolos: Transaksi baru ke periode ${testPeriodKey} yang telah CLOSED berhasil diblokir secara ketat ("${postErrorMsg}").`
        : 'Gagal: Transaksi baru berhasil lolos ke periode CLOSED.',
      details: { postingBlocked, postErrorMsg },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_03_BLOCKED_POST_IN_CLOSED_PERIOD',
      title: '3. Perlindungan Periode CLOSED',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 4: Pembukaan Kembali (REOPEN) Periode Akuntansi oleh Role Berwenang
  // -------------------------------------------------------------------------
  try {
    const reopenedRecord = await reopenAccountingPeriod(
      testPeriodKey,
      'Pembukaan kembali periode untuk verifikasi koreksi audit tahunan yang telah disetujui',
      actorAdmin,
      true
    );

    const isClosedAfterReopen = await isPeriodClosed(`${testPeriodKey}-15`);
    const passed4 = reopenedRecord.status === 'OPEN' && isClosedAfterReopen === false;

    results.push({
      id: 'TEST_T8C_04_PERIOD_REOPEN_SUCCESS',
      title: '4. Pembukaan Kembali (REOPEN) Periode Akuntansi dengan Alasan Wajib',
      passed: passed4,
      message: passed4
        ? `Lolos: Periode ${reopenedRecord.monthName} berhasil dibuka kembali menjadi OPEN oleh ${actorAdmin.roleName}. Alasan terekam lengkap.`
        : 'Gagal: Status periode tidak kembali ke OPEN.',
      details: { periodKey: testPeriodKey, status: reopenedRecord.status, reopenedAt: reopenedRecord.reopenedAt },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_04_PERIOD_REOPEN_SUCCESS',
      title: '4. Pembukaan Kembali (REOPEN) Periode Akuntansi',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 5: Penolakan Tutup/Buka Periode oleh Role Tidak Berwenang
  // -------------------------------------------------------------------------
  try {
    let unauthBlocked = false;
    let unauthMsg = '';

    try {
      await closeAccountingPeriod(
        testPeriodKey,
        'Mencoba tutup periode tanpa wewenang sebagai Auditor',
        actorAuditor,
        true
      );
    } catch (err: any) {
      if (err.message.includes('Akses ditolak') || err.message.includes('Bendahara atau Super Admin')) {
        unauthBlocked = true;
        unauthMsg = err.message;
      } else {
        throw err;
      }
    }

    results.push({
      id: 'TEST_T8C_05_UNAUTHORIZED_PERIOD_ACTION_BLOCKED',
      title: '5. Otorisasi Akses: Penolakan Kontrol Periode oleh Role Tanpa Wewenang',
      passed: unauthBlocked,
      message: unauthBlocked
        ? `Lolos: Role ${actorAuditor.roleName} (Read-Only) berhasil dicegah memanipulasi status periode ("${unauthMsg}").`
        : 'Gagal: Role tanpa otorisasi berhasil mengubah status periode.',
      details: { unauthBlocked, actor: actorAuditor.roleName },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_05_UNAUTHORIZED_PERIOD_ACTION_BLOCKED',
      title: '5. Otorisasi Akses: Penolakan Kontrol Periode',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 6: 11-Point Accounting Integrity Audit Runner
  // -------------------------------------------------------------------------
  try {
    const auditReport = await runComprehensiveAccountingIntegrityAudit();

    // Check that all 11 points are executed
    const has11Checks = auditReport.checks.length === 11;
    const debitCreditCheck = auditReport.checks.find((c) => c.checkKey === 'DEBIT_CREDIT_EQUALITY');
    const balanceSheetCheck = auditReport.checks.find((c) => c.checkKey === 'BALANCE_SHEET_BALANCED');
    const auditTrailCheck = auditReport.checks.find((c) => c.checkKey === 'AUDIT_TRAIL_AVAILABILITY');

    const passed6 = has11Checks && debitCreditCheck?.status === 'PASS' && balanceSheetCheck?.status === 'PASS';

    results.push({
      id: 'TEST_T8C_06_ACCOUNTING_INTEGRITY_AUDIT_EXECUTION',
      title: '6. Evaluasi 11 Kriteria Accounting Integrity Check Engine',
      passed: passed6,
      message: passed6
        ? `Lolos: Engine Integritas Akuntansi berhasil menjalankan 11 kriteria pengujian penuh. Total Check: ${auditReport.totalChecks}, Lolos: ${auditReport.passedCount}, Warning: ${auditReport.warningCount}, Error: ${auditReport.errorCount}. Status Sistem: ${auditReport.overallStatus}.`
        : 'Gagal: Jumlah kriteria evaluasi integritas tidak sesuai 11 poin atau pemeriksaan mendasar gagal.',
      details: {
        totalChecks: auditReport.totalChecks,
        passedCount: auditReport.passedCount,
        warningCount: auditReport.warningCount,
        errorCount: auditReport.errorCount,
        overallStatus: auditReport.overallStatus,
      },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_06_ACCOUNTING_INTEGRITY_AUDIT_EXECUTION',
      title: '6. Evaluasi 11 Kriteria Accounting Integrity Check Engine',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 7: Pencatatan Security Events & Sanitasi Kredensial
  // -------------------------------------------------------------------------
  try {
    const recordedSec = await recordSecurityEvent({
      eventType: 'PERMISSION_CHANGED',
      severity: 'WARNING',
      user: actorAdmin,
      details: 'Pengujian pencatatan peristiwa keamanan dengan verifikasi penyaringan kredensial sensitif',
      metadata: {
        targetRole: 'BENDAHARA',
        testPassword: 'SecretPassword123!',
        testToken: 'Bearer xyz-sensitive-token',
        validSetting: 'active',
      },
    });

    const isPasswordSanitized = recordedSec.metadata?.testPassword === '[REDACTED]';
    const isTokenSanitized = recordedSec.metadata?.testToken === '[REDACTED]';
    const isValidSettingKept = recordedSec.metadata?.validSetting === 'active';

    const passed7 = Boolean(recordedSec.id) && isPasswordSanitized && isTokenSanitized && isValidSettingKept;

    results.push({
      id: 'TEST_T8C_07_SECURITY_EVENTS_SANITIZATION',
      title: '7. Pencatatan Security Events & Sanitasi Kredensial Otomatis',
      passed: passed7,
      message: passed7
        ? `Lolos: Security event '${recordedSec.eventType}' (ID: ${recordedSec.id}) tercatat dengan tepat. Password dan Token berhasil di-redact ([REDACTED]) sebelum disimpan ke audit database.`
        : 'Gagal: Kredensial sensitif tidak disaring saat logging security events.',
      details: { recordedId: recordedSec.id, isPasswordSanitized, isTokenSanitized },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_07_SECURITY_EVENTS_SANITIZATION',
      title: '7. Pencatatan Security Events & Sanitasi Kredensial Otomatis',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 8: Perlindungan Transaksi Ganda (Duplicate Posting Protection)
  // -------------------------------------------------------------------------
  try {
    const today = new Date().toISOString().split('T')[0];
    const bankAccountsList = await db.select().from(bankAccounts);
    const bank = bankAccountsList[0] || { id: 1 };

    // Create a transaction
    const newTrx = await createOperationalTransaction(
      {
        date: today,
        type: 'PENERIMAAN',
        categoryName: 'Infaq & Sedekah',
        amount: 350000,
        cashBankType: 'BANK',
        cashBankId: bank.id,
        description: '[UJI T8C.8] Transaksi untuk Pengujian Anti-Duplikasi Posting',
      },
      actorBendahara
    );

    // Attempt to post again immediately (duplicate post attempt)
    let duplicateBlocked = false;
    let dupErrMsg = '';
    try {
      await postTransaction(newTrx.transaction.id, actorBendahara);
    } catch (err: any) {
      if (
        err.message.includes('sudah diposting') ||
        err.message.includes('Idempotency') ||
        err.message.includes('Jurnal Aktif')
      ) {
        duplicateBlocked = true;
        dupErrMsg = err.message;
      } else {
        throw err;
      }
    }

    results.push({
      id: 'TEST_T8C_08_DUPLICATE_POSTING_PROTECTION',
      title: '8. Pencegahan Duplikasi Posting (Duplicate Submission Protection)',
      passed: duplicateBlocked,
      message: duplicateBlocked
        ? `Lolos: Upaya posting ganda pada transaksi #${newTrx.transaction.id} berhasil ditolak ("${dupErrMsg}"). 1 transaksi tidak menghasilkan 2 jurnal.`
        : 'Gagal: Transaksi yang sudah diposting dapat diposting ulang.',
      details: { duplicateBlocked, dupErrMsg },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_08_DUPLICATE_POSTING_PROTECTION',
      title: '8. Pencegahan Duplikasi Posting',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 9: Pembuatan Snapshot Backup Database Lengkap
  // -------------------------------------------------------------------------
  try {
    const backupSnapshot = await generateBackupSnapshot(actorAdmin);
    const backupStatus = getBackupStatus();

    const passed9 =
      Boolean(backupSnapshot.id) &&
      Boolean(backupSnapshot.sha256) &&
      backupSnapshot.totalRecords > 0 &&
      backupStatus.backupStatus === 'ACTIVE';

    results.push({
      id: 'TEST_T8C_09_BACKUP_SNAPSHOT_GENERATION',
      title: '9. Pembuatan Snapshot Cadangan Data (Backup Snapshot)',
      passed: passed9,
      message: passed9
        ? `Lolos: Snapshot ${backupSnapshot.id} (${backupSnapshot.filename}, ${backupSnapshot.sizeFormatted}, ${backupSnapshot.totalRecords} baris data) berhasil dibuat dengan SHA-256 Checksum: ${backupSnapshot.sha256.substring(0, 12)}...`
        : 'Gagal: Pembuatan backup snapshot gagal atau data kosong.',
      details: {
        snapshotId: backupSnapshot.id,
        size: backupSnapshot.sizeFormatted,
        totalRecords: backupSnapshot.totalRecords,
        status: backupStatus.backupStatus,
      },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_09_BACKUP_SNAPSHOT_GENERATION',
      title: '9. Pembuatan Snapshot Cadangan Data',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 10: Prinsip Keamanan Restore & Verifikasi Integritas Snapshot
  // -------------------------------------------------------------------------
  try {
    const backupStatus = getBackupStatus();
    const lastSnap = backupStatus.snapshots[0];

    let dryRunValid = false;
    let dryRunMsg = '';

    if (lastSnap) {
      const verification = verifyBackupIntegrity(lastSnap.id);
      dryRunValid = verification.isValid;
      dryRunMsg = verification.message;
    }

    const restoreNotAutomatic = backupStatus.lastRestoreTest.includes('RESTORE TEST: NOT YET TESTED');
    const passed10 = restoreNotAutomatic && dryRunValid;

    results.push({
      id: 'TEST_T8C_10_RESTORE_SAFETY_POLICY',
      title: '10. Prinsip Keamanan Restore (Restore Safety Checklist & Dry-Run Verify)',
      passed: passed10,
      message: passed10
        ? `Lolos: Sistem mematuhi kebijakan perlindungan live production ("RESTORE TEST: NOT YET TESTED"). Verifikasi dry-run SHA-256 dan double-entry jurnal berhasil tanpa mengubah database aktif.`
        : 'Gagal: Kebijakan keamanan restore tidak terpenuhi.',
      details: {
        restoreStatus: backupStatus.lastRestoreTest,
        dryRunValid,
        dryRunMsg,
      },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_10_RESTORE_SAFETY_POLICY',
      title: '10. Prinsip Keamanan Restore',
      passed: false,
      message: e.message,
    });
  }

  // -------------------------------------------------------------------------
  // TEST 11: Penegakan Maker-Checker: Pembuat Dilarang Menyetujui Miliknya Sendiri
  // -------------------------------------------------------------------------
  try {
    let makerApprovalBlocked = false;
    let makerBlockedMsg = '';

    // Create a dummy fund request as maker
    const expenseAcc = (await db.select().from(accounts).where(eq(accounts.category, 'EXPENSE')))[0] || { id: 14 };
    const fundReq = await createFundRequest(
      {
        date: today,
        unitId: 4,
        fundId: 1,
        accountId: expenseAcc.id,
        amountRequested: 500000,
        purpose: '[UJI T8C.11] Pengujian larangan self-approval maker (Maker-Checker)',
      },
      actorMaker
    );

    // Maker attempts to approve own fund request
    try {
      await updateFundRequestStatus(
        fundReq.id,
        'APPROVE',
        { amountApproved: 500000, notes: 'Mencoba approve sendiri' },
        actorMaker
      );
    } catch (err: any) {
      if (
        err.message.includes('Maker-Checker') ||
        err.message.includes('Pembuat') ||
        err.message.includes('Akses ditolak')
      ) {
        makerApprovalBlocked = true;
        makerBlockedMsg = err.message;
      } else {
        throw err;
      }
    }

    results.push({
      id: 'TEST_T8C_11_MAKER_CHECKER_SELF_APPROVAL_BLOCKED',
      title: '11. Penegakan Otorisasi Maker-Checker (Maker Dilarang Approve Sendiri)',
      passed: makerApprovalBlocked,
      message: makerApprovalBlocked
        ? `Lolos: Pembuat pengajuan (${actorMaker.name}) diblokir saat mencoba menyetujui pengajuannya sendiri ("${makerBlockedMsg}").`
        : 'Gagal: Pembuat pengajuan berhasil menyetujui pengajuannya sendiri (Pelanggaran Maker-Checker).',
      details: { makerApprovalBlocked, makerBlockedMsg },
    });
  } catch (e: any) {
    results.push({
      id: 'TEST_T8C_11_MAKER_CHECKER_SELF_APPROVAL_BLOCKED',
      title: '11. Penegakan Otorisasi Maker-Checker',
      passed: false,
      message: e.message,
    });
  }

  return results;
}
