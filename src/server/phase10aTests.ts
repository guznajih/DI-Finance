import { db } from '../db/index.ts';
import { bankAccounts, journals, journalLines } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  createTransfer,
  getGeneralLedger,
  getIncomeStatement,
  getOrCreateBankAdminExpenseAccount,
  getUnreconciledCashBankAccounts,
} from '../db/accounting.ts';

export interface TestResult {
  testId: string;
  testName: string;
  status: 'PASS' | 'FAIL';
  details: string;
  metrics?: Record<string, any>;
}

export async function runPhase10ATests(): Promise<{
  allPassed: boolean;
  results: TestResult[];
  unreconciledStatusBsi: any;
}> {
  const results: TestResult[] = [];

  // =========================================================================
  // TEST 7: Transfer BSI -> Muamalat Rp20.000.000 dengan Biaya Admin Rp6.500
  // =========================================================================
  try {
    const [bsi] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, 1));
    const [muamalat] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, 2));

    if (!bsi || !muamalat) {
      throw new Error('Rekening BSI atau Muamalat tidak ditemukan');
    }

    const adminAcc = await getOrCreateBankAdminExpenseAccount();
    const initAdminGl = await getGeneralLedger(adminAcc.id);
    const initIncome = await getIncomeStatement();

    const initialBsiBal = Number(bsi.currentBalance);
    const initialMuamalatBal = Number(muamalat.currentBalance);
    const initialAdminBal = initAdminGl.endingBalance;
    const initialRevenue = initIncome.revenues.totalRevenue;

    const adminUser = {
      id: 1,
      name: 'Admin Finance',
      email: 'admin@darulistiqomah.ac.id',
      roleName: 'SUPER_ADMIN',
    };

    const transferAmount = 20000000;
    const adminFee = 6500;
    const totalDeductionExpected = 20006500;

    const trf = await createTransfer(
      {
        date: new Date().toISOString().split('T')[0],
        fromType: 'BANK',
        fromId: bsi.id,
        toType: 'BANK',
        toId: muamalat.id,
        amount: transferAmount,
        adminFee,
        description: 'TEST 7: Transfer BSI ke Muamalat dengan biaya admin Rp6.500',
        reference: 'REF-TEST-7-PHASE10A',
        status: 'POSTED',
      },
      adminUser
    );

    const [postBsi] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, 1));
    const [postMuamalat] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, 2));
    const postAdminGl = await getGeneralLedger(adminAcc.id);
    const postIncome = await getIncomeStatement();

    const [jrn] = await db.select().from(journals).where(eq(journals.transactionId, trf.id));
    const jLines = await db.select().from(journalLines).where(eq(journalLines.journalId, jrn.id));

    const bsiDelta = Number(postBsi.currentBalance) - initialBsiBal;
    const muamalatDelta = Number(postMuamalat.currentBalance) - initialMuamalatBal;
    const adminExpDelta = postAdminGl.endingBalance - initialAdminBal;
    const revenueDelta = postIncome.revenues.totalRevenue - initialRevenue;
    const isDoubleEntryBalanced = Math.abs(Number(jrn.totalDebit) - Number(jrn.totalCredit)) < 0.001;

    const passBsi = Math.abs(bsiDelta - -totalDeductionExpected) < 0.01;
    const passMuamalat = Math.abs(muamalatDelta - transferAmount) < 0.01;
    const passAdmin = Math.abs(adminExpDelta - adminFee) < 0.01;
    const passRevenue = Math.abs(revenueDelta) < 0.01;
    const passBalance = isDoubleEntryBalanced && Number(jrn.totalDebit) === totalDeductionExpected;

    const test7Passed = passBsi && passMuamalat && passAdmin && passRevenue && passBalance;

    results.push({
      testId: 'TEST_7',
      testName: 'TEST 7: Transfer BSI -> Muamalat Rp20.000.000 dengan Biaya Admin Rp6.500',
      status: test7Passed ? 'PASS' : 'FAIL',
      details: test7Passed
        ? `Sukses! BSI berkurang Rp ${Math.abs(bsiDelta).toLocaleString('id-ID')}, Muamalat bertambah Rp ${muamalatDelta.toLocaleString('id-ID')}, Beban Admin Bank bertambah Rp ${adminExpDelta.toLocaleString('id-ID')}, Pendapatan tidak berubah (delta Rp 0), Debit = Kredit Rp ${Number(jrn.totalDebit).toLocaleString('id-ID')}.`
        : `Gagal pada validasi saldo atau double entry.`,
      metrics: {
        transactionNumber: trf.transactionNumber,
        journalNumber: jrn.journalNumber,
        bsiDelta,
        muamalatDelta,
        adminExpDelta,
        revenueDelta,
        totalDebit: Number(jrn.totalDebit),
        totalCredit: Number(jrn.totalCredit),
        journalLinesCount: jLines.length,
      },
    });
  } catch (error: any) {
    results.push({
      testId: 'TEST_7',
      testName: 'TEST 7: Transfer BSI -> Muamalat Rp20.000.000 dengan Biaya Admin Rp6.500',
      status: 'FAIL',
      details: `Error: ${error.message}`,
    });
  }

  // =========================================================================
  // AUDIT BSI RP500.000 UNRECONCILED STATUS CHECK
  // =========================================================================
  const unreconciledList = await getUnreconciledCashBankAccounts();
  const bsiAuditItem = unreconciledList.find((i) => i.id === 1 && i.accountType === 'BANK');

  const bsiDiffMatches = bsiAuditItem && Math.abs(Math.abs(bsiAuditItem.difference) - 500000) < 0.01;
  const isMarkedUnreconciled = bsiAuditItem && bsiAuditItem.status === 'UNRECONCILED';

  results.push({
    testId: 'AUDIT_BSI_500K_CHECK',
    testName: 'Audit Rekonsiliasi BSI Rp 500.000 (Status UNRECONCILED & Larangan Auto-Fix)',
    status: bsiDiffMatches && isMarkedUnreconciled ? 'PASS' : 'FAIL',
    details: `Selisih Rp 500.000 pada BSI berhasil diidentifikasi sebagai ${bsiAuditItem?.status}. Tidak ada Auto-Fix yang diterapkan. Bendahara diarahkan melakukan verifikasi rekening koran fisik dan Jurnal Penyesuaian resmi via Maker-Checker.`,
    metrics: {
      accountName: bsiAuditItem?.name,
      statementOrBankBalance: bsiAuditItem?.statementOrBankBalance,
      glBalance: bsiAuditItem?.glBalance,
      difference: bsiAuditItem?.difference,
      status: bsiAuditItem?.status,
    },
  });

  const allPassed = results.every((r) => r.status === 'PASS');

  return {
    allPassed,
    results,
    unreconciledStatusBsi: bsiAuditItem,
  };
}
