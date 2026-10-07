import express, { Request, Response } from 'express';
import {
  approveTransaction,
  createAccount,
  createAuditLog,
  createBankAccount,
  createCashAccount,
  createFund,
  createJurnalUmum,
  createPenerimaan,
  createPengeluaran,
  createTransfer,
  createUnit,
  getAccounts,
  getAuditLogs,
  getBankAccounts,
  getBankBook,
  getCashAccounts,
  getCashBook,
  getDashboardMetrics,
  getFunds,
  getGeneralLedger,
  getJournals,
  getTransactionDetails,
  getTransactions,
  getUnits,
  postTransaction,
  reverseTransaction,
  runPhase2AutomatedTests,
  submitTransaction,
  updateAccount,
  updateFund,
  updateUnit,
  checkSppDuplicate,
  commitSppImport,
  createSppRekap,
  getSppRekaps,
  getSppReportSummary,
  previewSppImport,
  reconcileSppRekap,
  runPhase3AutomatedTests,
  checkBudgetAvailability,
  createBudget,
  createFundRequest,
  createOrUpdateLpj,
  disburseFundRequest,
  getBudgets,
  getFundDisbursements,
  getFundRefunds,
  getFundRequests,
  getLeadershipMonitoringMetrics,
  getLpjs,
  processFundRefund,
  reviewLpj,
  runPhase4AutomatedTests,
  updateBudgetStatus,
  updateFundRequestStatus,
  addInvestmentDocument,
  adjustInvestmentValuation,
  createInvestment,
  createInvestmentReconciliation,
  getInvestmentById,
  getInvestmentDashboardSummary,
  getInvestmentDocuments,
  getInvestmentReconciliations,
  getInvestmentTransactions,
  getInvestments,
  placeInvestmentFund,
  recordInvestmentProfitSharing,
  returnInvestmentCapital,
  runPhase5AutomatedTests,
  updateInvestmentStatus,
  getTrialBalance,
  getBalanceSheet,
  getIncomeStatement,
  getCashFlowStatement,
  createCashBankReconciliation,
  getCashBankReconciliations,
  getDebitCreditHelperGuides,
  runAccountingIntegrityChecks,
  runPhase6AutomatedTests,
  getTransactionCategories,
  createTransactionCategory,
  updateTransactionCategory,
  getAccountingRules,
  createAccountingRule,
  updateAccountingRule,
  explainDebitCreditRule,
  previewOperationalTransaction,
  createOperationalTransaction,
  correctTransactionWithAudit,
  getTransactionCorrections,
  parseNaturalLanguageSearch,
  getBendaharaDashboardStats,
  getPimpinanDashboardStats,
  runAccountingHealthCheck,
  runPhase7AutomatedTests,
  runPhase8AutomatedTests,
  runPhase8BAutomatedTests,
  voidTransaction,
  updateTransaction,
  deleteTransaction,
} from '../db/accounting.ts';
import { getAllUsers, updateUserRoleAndUnit } from '../db/users.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import { requireWritePermission, isReadOnlyRole, checkPermission } from './permissions.ts';
import {
  getAccountingPeriods,
  closeAccountingPeriod,
  reopenAccountingPeriod,
  isPeriodClosed,
} from './periodManager.ts';
import { runComprehensiveAccountingIntegrityAudit } from './integrityAuditor.ts';
import { getSecurityEvents, recordSecurityEvent } from './securityEvents.ts';
import {
  generateBackupSnapshot,
  getBackupStatus,
  verifyBackupIntegrity,
} from './backupManager.ts';
import { runPhase8CAutomatedTests } from './phase8cTests.ts';
import path from 'path';
import fs from 'fs';

export const apiRouter = express.Router();
apiRouter.use(express.json({ limit: '10mb' }));

// 1. Current user profile & session info
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat sesi pengguna' });
  }
});

// 2. Dashboard metrics with filters (month, year, unitId, fundId)
apiRouter.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, unitId, fundId } = req.query;
    const filter: any = {};
    if (month) filter.month = parseInt(String(month), 10);
    if (year) filter.year = parseInt(String(year), 10);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (fundId) filter.fundId = parseInt(String(fundId), 10);

    const data = await getDashboardMetrics(filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/dashboard:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data dashboard' });
  }
});

// 3. Units / Divisi
apiRouter.get('/units', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getUnits();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat unit/divisi' });
  }
});

apiRouter.post('/units', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, isActive } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Kode dan nama unit wajib diisi' });
    }
    const created = await createUnit({ code, name, description, isActive }, req.user);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan unit/divisi' });
  }
});

apiRouter.put('/units/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, isActive } = req.body;
    const updated = await updateUnit(id, { name, description, isActive }, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui unit/divisi' });
  }
});

// 4. Sumber Dana (Funds)
apiRouter.get('/funds', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getFunds();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching funds:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat sumber dana' });
  }
});

apiRouter.post('/funds', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, type, description, isActive } = req.body;
    if (!code || !name || !type) {
      return res.status(400).json({ error: 'Kode, nama, dan jenis dana wajib diisi' });
    }
    const created = await createFund({ code, name, type, description, isActive }, req.user);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating fund:', error);
    res.status(500).json({ error: error.message || 'Gagal menyimpan sumber dana' });
  }
});

apiRouter.put('/funds/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, type, description, isActive } = req.body;
    const updated = await updateFund(id, { name, type, description, isActive }, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating fund:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui sumber dana' });
  }
});

// 5. Chart of Accounts (COA)
apiRouter.get('/accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getAccounts();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat bagan akun' });
  }
});

apiRouter.post('/accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, category, subCategory, normalBalance, description, isActive } = req.body;
    if (!code || !name || !category || !subCategory || !normalBalance) {
      return res.status(400).json({ error: 'Data akun tidak lengkap' });
    }
    const created = await createAccount(
      { code, name, category, subCategory, normalBalance, description, isActive },
      req.user
    );
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat akun baru' });
  }
});

apiRouter.put('/accounts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, category, subCategory, normalBalance, description, isActive } = req.body;
    const updated = await updateAccount(
      id,
      { name, category, subCategory, normalBalance, description, isActive },
      req.user
    );
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: error.message || 'Gagal memperbarui akun' });
  }
});

// 6. Kas & Bank
apiRouter.get('/cash-accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getCashAccounts();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching cash accounts:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rekening kas' });
  }
});

apiRouter.post('/cash-accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, name, unitId, initialBalance, isActive } = req.body;
    if (!accountId || !name) {
      return res.status(400).json({ error: 'Akun COA dan nama kas wajib diisi' });
    }
    const created = await createCashAccount(
      { accountId, name, unitId, initialBalance: initialBalance || '0', isActive },
      req.user
    );
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating cash account:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat rekening kas' });
  }
});

apiRouter.get('/bank-accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getBankAccounts();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rekening bank' });
  }
});

apiRouter.post('/bank-accounts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, accountName, bankName, accountNumber, initialBalance, isActive } = req.body;
    if (!accountId || !accountName || !bankName || !accountNumber) {
      return res.status(400).json({ error: 'Data rekening bank tidak lengkap' });
    }
    const created = await createBankAccount(
      { accountId, accountName, bankName, accountNumber, initialBalance: initialBalance || '0', isActive },
      req.user
    );
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat rekening bank' });
  }
});

// 7. FASE 2: TRANSAKSI KHUSUS (PENERIMAAN, PENGELUARAN, TRANSFER, JURNAL UMUM)
apiRouter.post('/penerimaan', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { date, incomeAccountId, unitId, fundId, cashBankType, cashBankId, amount, description, reference, attachmentUrl, status } = req.body;
    if (!date || !incomeAccountId || !cashBankType || !cashBankId || !amount || !description) {
      return res.status(400).json({ error: 'Field penerimaan tidak lengkap' });
    }
    const result = await createPenerimaan(
      {
        date,
        incomeAccountId: parseInt(incomeAccountId, 10),
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        cashBankType,
        cashBankId: parseInt(cashBankId, 10),
        amount: parseFloat(amount),
        description,
        reference,
        attachmentUrl,
        status,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating penerimaan:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan penerimaan' });
  }
});

apiRouter.post('/pengeluaran', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { date, expenseAccountId, unitId, fundId, cashBankType, cashBankId, recipient, amount, description, reference, attachmentUrl, status, allowNegativeBalance } = req.body;
    if (!date || !expenseAccountId || !cashBankType || !cashBankId || !amount || !description) {
      return res.status(400).json({ error: 'Field pengeluaran tidak lengkap' });
    }
    const result = await createPengeluaran(
      {
        date,
        expenseAccountId: parseInt(expenseAccountId, 10),
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        cashBankType,
        cashBankId: parseInt(cashBankId, 10),
        recipient: recipient || '',
        amount: parseFloat(amount),
        description,
        reference,
        attachmentUrl,
        status,
        allowNegativeBalance: !!allowNegativeBalance,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating pengeluaran:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan pengeluaran' });
  }
});

apiRouter.post('/transfer', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { date, fromType, fromId, toType, toId, amount, description, reference, attachmentUrl, status, allowNegativeBalance } = req.body;
    if (!date || !fromType || !fromId || !toType || !toId || !amount) {
      return res.status(400).json({ error: 'Field transfer kas/bank tidak lengkap' });
    }
    const result = await createTransfer(
      {
        date,
        fromType,
        fromId: parseInt(fromId, 10),
        toType,
        toId: parseInt(toId, 10),
        amount: parseFloat(amount),
        description,
        reference,
        attachmentUrl,
        status,
        allowNegativeBalance: !!allowNegativeBalance,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating transfer:', error);
    res.status(400).json({ error: error.message || 'Gagal melakukan transfer kas/bank' });
  }
});

apiRouter.post('/jurnal-umum', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { date, description, reference, attachmentUrl, unitId, fundId, status, lines } = req.body;
    if (!date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({ error: 'Jurnal Umum harus memiliki minimal 2 pos akun (Debit & Kredit)' });
    }
    const result = await createJurnalUmum(
      {
        date,
        description,
        reference,
        attachmentUrl,
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        status,
        lines,
      },
      req.user
    );
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating jurnal umum:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan Jurnal Umum' });
  }
});

// 8. WORKFLOW ACTIONS (SUBMIT, APPROVE, POST, REVERSE)
apiRouter.post('/transactions/:id/submit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await submitTransaction(id, req.user);
    res.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error('Error submitting transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal mengajukan transaksi' });
  }
});

apiRouter.post('/transactions/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await approveTransaction(id, req.user);
    res.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error('Error approving transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal menyetujui transaksi' });
  }
});

apiRouter.post('/transactions/:id/post', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { allowNegativeBalance } = req.body;
    const journal = await postTransaction(id, req.user, !!allowNegativeBalance);
    res.json({ success: true, journal });
  } catch (error: any) {
    console.error('Error posting transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal mem-posting transaksi' });
  }
});

apiRouter.post('/transactions/:id/reverse', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reason } = req.body;
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Alasan pembatalan/reversal transaksi wajib diisi (minimal 5 karakter)' });
    }
    const result = await reverseTransaction(id, reason, req.user);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error reversing transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal membatalkan transaksi' });
  }
});

apiRouter.post('/transactions/:id/void', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reason, confirmed } = req.body;
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Alasan pembatalan (VOID) transaksi wajib diisi (minimal 5 karakter)' });
    }
    const result = await voidTransaction(id, reason, req.user, confirmed !== false);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error voiding transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal membatalkan (VOID) transaksi' });
  }
});

// Update draft transaction (POSTED transactions strictly locked)
apiRouter.put('/transactions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateTransaction(id, req.body, req.user);
    res.json({ success: true, transaction: updated });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal mengubah transaksi' });
  }
});

// Delete draft transaction (POSTED transactions strictly protected from deletion)
apiRouter.delete('/transactions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await deleteTransaction(id, req.user);
    res.json({ success: true, transaction: deleted });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal menghapus transaksi' });
  }
});

// 9. QUERY TRANSACTIONS & DETAILS
apiRouter.get('/transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, unitId, fundId, startDate, endDate } = req.query;
    const filter: any = {};
    if (status) filter.status = String(status);
    if (type) filter.type = String(type);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (fundId) filter.fundId = parseInt(String(fundId), 10);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const data = await getTransactions(filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat transaksi' });
  }
});

apiRouter.get('/transactions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await getTransactionDetails(id);
    if (!data) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat detail transaksi' });
  }
});

// 10. BUKU KAS & BUKU BANK
apiRouter.get('/cash-book', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { cashAccountId, startDate, endDate, unitId, fundId } = req.query;
    if (!cashAccountId) {
      return res.status(400).json({ error: 'Akun kas wajib dipilih' });
    }
    const data = await getCashBook(
      parseInt(String(cashAccountId), 10),
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching cash book:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Buku Kas' });
  }
});

apiRouter.get('/bank-book', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { bankAccountId, startDate, endDate, unitId, fundId } = req.query;
    if (!bankAccountId) {
      return res.status(400).json({ error: 'Rekening bank wajib dipilih' });
    }
    const data = await getBankBook(
      parseInt(String(bankAccountId), 10),
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching bank book:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Buku Bank' });
  }
});

// 11. JOURNALS & GENERAL LEDGER
apiRouter.get('/journals', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getJournals({
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
    });
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat jurnal' });
  }
});

apiRouter.get('/ledger', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { accountId, startDate, endDate } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: 'Akun (accountId) wajib dipilih' });
    }
    const data = await getGeneralLedger(
      parseInt(String(accountId), 10),
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching general ledger:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Buku Besar' });
  }
});

// 12. AUDIT LOGS (Tahap 8B Enhanced)
apiRouter.get('/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, userId, userEmail, action, module, recordId, entityType, q, searchQuery, limit } = req.query;
    const filter: any = {};
    if (limit) filter.limit = parseInt(String(limit), 10);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);
    if (userId) filter.userId = parseInt(String(userId), 10);
    if (userEmail) filter.userEmail = String(userEmail);
    if (action) filter.action = String(action);
    if (module) filter.module = String(module);
    if (recordId) filter.recordId = String(recordId);
    if (entityType) filter.entityType = String(entityType);
    if (q || searchQuery) filter.searchQuery = String(q || searchQuery);

    const data = await getAuditLogs(filter);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat riwayat audit' });
  }
});

// Immutability Protection: Audit trail records CANNOT be deleted or edited!
apiRouter.delete('/audit-logs/:id', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.status(403).json({
    error: 'Akses Ditolak (Pelanggaran Kepatuhan): Riwayat audit trail transaksi keuangan bersifat immutable dan dilarang untuk dihapus.',
  });
});

apiRouter.delete('/audit-logs', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.status(403).json({
    error: 'Akses Ditolak (Pelanggaran Kepatuhan): Riwayat audit trail transaksi keuangan bersifat immutable dan dilarang untuk dihapus.',
  });
});

apiRouter.put('/audit-logs/:id', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.status(403).json({
    error: 'Akses Ditolak (Pelanggaran Kepatuhan): Riwayat audit trail transaksi keuangan bersifat immutable dan dilarang untuk diedit.',
  });
});

apiRouter.patch('/audit-logs/:id', requireAuth, async (_req: AuthRequest, res: Response) => {
  return res.status(403).json({
    error: 'Akses Ditolak (Pelanggaran Kepatuhan): Riwayat audit trail transaksi keuangan bersifat immutable dan dilarang untuk diedit.',
  });
});

// Record user activity event (LOGIN, LOGOUT, dsb.)
apiRouter.post('/audit-logs/event', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { action, module, entityType, entityId, details, summary, reason, beforeValue, afterValue } = req.body;
    await createAuditLog({
      user: req.user,
      action: action || 'LOG',
      module: module || 'AUTH',
      entityType: entityType || 'USER_SESSION',
      entityId: entityId || (req.user ? String(req.user.id) : ''),
      summary: summary || details || `Aktivitas ${action} oleh ${req.user?.displayName || req.user?.email}`,
      reason,
      beforeValue,
      afterValue,
      ipAddress: req.ip || '',
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. USERS MANAGEMENT
apiRouter.get('/users', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getAllUsers();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat daftar pengguna' });
  }
});

apiRouter.put('/users/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.roleName !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Hanya Super Admin yang dapat mengubah role pengguna' });
    }
    const id = parseInt(req.params.id, 10);
    const { roleId, unitId, isActive, reason } = req.body;

    const allUsers = await getAllUsers();
    const prevUser = allUsers.find((u) => u.id === id);

    const updated = await updateUserRoleAndUnit(id, roleId, unitId, isActive);

    await createAuditLog({
      user: req.user,
      action: 'PERMISSION_CHANGE',
      module: 'USER_MGMT',
      entityType: 'USER',
      entityId: String(id),
      reason: reason || 'Perubahan kewenangan / hak akses oleh Super Admin',
      summary: `Perubahan kewenangan pengguna ID #${id} (${prevUser?.displayName || prevUser?.email}): Role #${prevUser?.roleId || '-'} -> #${roleId} (${isActive !== false ? 'Aktif' : 'Nonaktif'})`,
      beforeValue: {
        roleId: prevUser?.roleId,
        roleName: prevUser?.roleName,
        unitId: prevUser?.unitId,
        isActive: prevUser?.isActive,
      },
      afterValue: {
        roleId,
        unitId,
        isActive: isActive !== false,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message || 'Gagal mengubah role pengguna' });
  }
});

// 14. PHASE 2 AUTOMATED TEST SUITE RUNNER
apiRouter.post('/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase2AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian akuntansi' });
  }
});

// =========================================================================
// 15. FASE 3: SPP AGREGAT EKSTERNAL & REKONSILIASI
// =========================================================================

// 15.1. Get SPP Rekaps list with filters
apiRouter.get('/spp', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { period, academicYear, unitId, reconciliationStatus, startDate, endDate } = req.query;
    const filter: any = {};
    if (period) filter.period = String(period);
    if (academicYear) filter.academicYear = String(academicYear);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (reconciliationStatus) filter.reconciliationStatus = String(reconciliationStatus);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const list = await getSppRekaps(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching SPP list:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rekap SPP' });
  }
});

// 15.2. Check duplicate SPP
apiRouter.post('/spp/check-duplicate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { period, academicYear, unitId, amount, reference } = req.body;
    if (!period || !academicYear || !unitId || !amount) {
      return res.status(400).json({ error: 'Parameter pengecekan duplikasi tidak lengkap' });
    }
    const result = await checkSppDuplicate({
      period,
      academicYear,
      unitId: parseInt(unitId, 10),
      amount: parseFloat(amount),
      reference,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error checking duplicate SPP:', error);
    res.status(500).json({ error: error.message || 'Gagal memeriksa duplikasi' });
  }
});

// 15.3. Create SPP Rekap (Manual Input)
apiRouter.post('/spp', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      date,
      period,
      academicYear,
      unitId,
      cashBankType,
      cashBankId,
      amount,
      paymentCount,
      dataSource,
      reference,
      description,
      attachmentUrl,
      status,
      skipDuplicateCheck,
    } = req.body;

    if (!date || !period || !academicYear || !unitId || !cashBankType || !cashBankId || !amount) {
      return res.status(400).json({ error: 'Field formulir SPP tidak lengkap' });
    }

    const created = await createSppRekap(
      {
        date,
        period,
        academicYear,
        unitId: parseInt(unitId, 10),
        cashBankType,
        cashBankId: parseInt(cashBankId, 10),
        amount: parseFloat(amount),
        paymentCount: paymentCount ? parseInt(paymentCount, 10) : 0,
        dataSource: dataSource || 'Aplikasi SPP',
        reference,
        description,
        attachmentUrl,
        status: status || 'POSTED',
        skipDuplicateCheck: !!skipDuplicateCheck,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating SPP rekap:', error);
    if (error.code === 'SPP_DUPLICATE_DETECTED') {
      return res.status(409).json({
        error: error.message,
        isDuplicate: true,
        details: error.duplicateDetails,
      });
    }
    res.status(400).json({ error: error.message || 'Gagal menyimpan penerimaan SPP' });
  }
});

// 15.4. Reconcile SPP Rekap
apiRouter.post('/spp/:id/reconcile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { bankAmount, notes, forceStatus } = req.body;

    if (bankAmount === undefined || bankAmount === null) {
      return res.status(400).json({ error: 'Nominal mutasi bank wajib diisi untuk rekonsiliasi' });
    }

    const reconciled = await reconcileSppRekap(
      id,
      {
        bankAmount: parseFloat(bankAmount),
        notes,
        forceStatus,
      },
      req.user
    );

    res.json({ success: true, rekap: reconciled });
  } catch (error: any) {
    console.error('Error reconciling SPP:', error);
    res.status(400).json({ error: error.message || 'Gagal melakukan rekonsiliasi SPP' });
  }
});

// 15.5. SPP Reports Summary
apiRouter.get('/spp/reports', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { academicYear, unitId, startDate, endDate } = req.query;
    const filter: any = {};
    if (academicYear) filter.academicYear = String(academicYear);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const summary = await getSppReportSummary(filter);
    res.json(summary);
  } catch (error: any) {
    console.error('Error generating SPP report:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat laporan SPP' });
  }
});

// 15.6. Import Preview
apiRouter.post('/spp/import-preview', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Data baris import kosong' });
    }
    const preview = await previewSppImport(rows);
    res.json(preview);
  } catch (error: any) {
    console.error('Error in SPP import preview:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses preview import SPP' });
  }
});

// 15.7. Import Commit
apiRouter.post('/spp/import-commit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Data konfirmasi import kosong' });
    }
    const result = await commitSppImport(rows, req.user);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error in SPP import commit:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan batch import SPP' });
  }
});

// 15.8. PHASE 3 AUTOMATED TESTS RUNNER
apiRouter.post('/spp/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase3AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 3 tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian FASE 3' });
  }
});

// =========================================================================
// 16. FASE 4: ANGGARAN, PENGAJUAN DANA, PENCAIRAN, LPJ & SISA DANA
// =========================================================================

// 16.1. Budgets (Anggaran)
apiRouter.get('/budgets', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fiscalYear, unitId, fundId, accountId, status } = req.query;
    const filter: any = {};
    if (fiscalYear) filter.fiscalYear = String(fiscalYear);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (fundId) filter.fundId = parseInt(String(fundId), 10);
    if (accountId) filter.accountId = parseInt(String(accountId), 10);
    if (status) filter.status = String(status);

    const list = await getBudgets(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rencana anggaran' });
  }
});

apiRouter.post('/budgets', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fiscalYear, unitId, fundId, accountId, allocatedAmount, description, status } = req.body;
    if (!fiscalYear || !unitId || !accountId || !allocatedAmount) {
      return res.status(400).json({ error: 'Parameter rencana anggaran tidak lengkap' });
    }

    const created = await createBudget(
      {
        fiscalYear,
        unitId: parseInt(unitId, 10),
        fundId: fundId ? parseInt(fundId, 10) : null,
        accountId: parseInt(accountId, 10),
        allocatedAmount: parseFloat(allocatedAmount),
        description,
        status,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating budget:', error);
    res.status(400).json({ error: error.message || 'Gagal membuat anggaran' });
  }
});

apiRouter.put('/budgets/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status anggaran wajib diisi' });

    const updated = await updateBudgetStatus(id, status, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating budget status:', error);
    res.status(400).json({ error: error.message || 'Gagal memperbarui status anggaran' });
  }
});

apiRouter.get('/budgets/:id/check-availability', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const amount = req.query.amount ? parseFloat(String(req.query.amount)) : 0;
    const result = await checkBudgetAvailability(id, amount);
    res.json(result);
  } catch (error: any) {
    console.error('Error checking budget availability:', error);
    res.status(400).json({ error: error.message || 'Gagal memeriksa ketersediaan anggaran' });
  }
});

// 16.2. Fund Requests (Pengajuan Dana)
apiRouter.get('/fund-requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, unitId, budgetId, requesterId, lpjStatus, startDate, endDate } = req.query;
    const filter: any = {};
    if (status) filter.status = String(status);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (budgetId) filter.budgetId = parseInt(String(budgetId), 10);
    if (requesterId) filter.requesterId = parseInt(String(requesterId), 10);
    if (lpjStatus) filter.lpjStatus = String(lpjStatus);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const list = await getFundRequests(filter, req.user);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching fund requests:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat pengajuan dana' });
  }
});

apiRouter.post('/fund-requests', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      date,
      unitId,
      accountId,
      fundId,
      budgetId,
      purpose,
      amountRequested,
      itemsDetail,
      attachmentUrl,
      allowOverBudget,
    } = req.body;

    if (!date || !unitId || !accountId || !purpose || !amountRequested) {
      return res.status(400).json({ error: 'Formulir pengajuan dana tidak lengkap' });
    }

    const created = await createFundRequest(
      {
        date,
        unitId: parseInt(unitId, 10),
        accountId: parseInt(accountId, 10),
        fundId: fundId ? parseInt(fundId, 10) : null,
        budgetId: budgetId ? parseInt(budgetId, 10) : null,
        purpose,
        amountRequested: parseFloat(amountRequested),
        itemsDetail: typeof itemsDetail === 'string' ? itemsDetail : JSON.stringify(itemsDetail),
        attachmentUrl,
        allowOverBudget: !!allowOverBudget,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating fund request:', error);
    if (error.code === 'BUDGET_EXCEEDED') {
      return res.status(409).json({
        error: error.message,
        isOverBudget: true,
        details: error.details,
      });
    }
    res.status(400).json({ error: error.message || 'Gagal membuat pengajuan dana' });
  }
});

apiRouter.put('/fund-requests/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, notes, amountApproved, rejectedReason, allowOverBudget } = req.body;
    if (!action) return res.status(400).json({ error: 'Aksi status pengajuan wajib diisi' });

    const updated = await updateFundRequestStatus(
      id,
      action,
      {
        notes,
        amountApproved: amountApproved ? parseFloat(amountApproved) : undefined,
        rejectedReason,
        allowOverBudget: !!allowOverBudget,
      },
      req.user
    );

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating fund request status:', error);
    if (error.message?.includes('Maker-Checker')) {
      return res.status(403).json({
        error: error.message,
        isMakerCheckerViolation: true,
        code: 'MAKER_CHECKER_VIOLATION',
      });
    }
    if (error.message?.includes('Akses ditolak') || error.message?.includes('Read-Only')) {
      return res.status(403).json({
        error: error.message,
        isAccessDenied: true,
        code: 'ACCESS_DENIED',
      });
    }
    res.status(400).json({ error: error.message || 'Gagal memproses persetujuan pengajuan' });
  }
});

// 16.3. Disbursements (Pencairan Dana)
apiRouter.get('/fund-disbursements', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, cashBankType, startDate, endDate } = req.query;
    const filter: any = {};
    if (requestId) filter.requestId = parseInt(String(requestId), 10);
    if (cashBankType) filter.cashBankType = String(cashBankType);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const list = await getFundDisbursements(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching disbursements:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data pencairan dana' });
  }
});

apiRouter.post('/fund-requests/:id/disburse', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { disbursementDate, recipientName, cashBankType, cashBankId, amount, notes, receiptUrl } = req.body;

    if (!disbursementDate || !recipientName || !cashBankType || !cashBankId) {
      return res.status(400).json({ error: 'Formulir pencairan dana tidak lengkap' });
    }

    const result = await disburseFundRequest(
      id,
      {
        disbursementDate,
        recipientName,
        cashBankType,
        cashBankId: parseInt(cashBankId, 10),
        amount: amount ? parseFloat(amount) : undefined,
        notes,
        receiptUrl,
      },
      req.user
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error disbursing fund request:', error);
    res.status(400).json({ error: error.message || 'Gagal mencairkan pengajuan dana' });
  }
});

// 16.4. LPJ (Laporan Pertanggungjawaban)
apiRouter.get('/lpjs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { unitId, status, refundStatus, requestId } = req.query;
    const filter: any = {};
    if (unitId) filter.unitId = parseInt(String(unitId), 10);
    if (status) filter.status = String(status);
    if (refundStatus) filter.refundStatus = String(refundStatus);
    if (requestId) filter.requestId = parseInt(String(requestId), 10);

    const list = await getLpjs(filter, req.user);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching LPJs:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data LPJ' });
  }
});

apiRouter.post('/lpjs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId, notes, attachmentUrl, items } = req.body;
    if (!requestId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Rincian pengeluaran LPJ wajib diisi minimal 1 item' });
    }

    const result = await createOrUpdateLpj(
      {
        requestId: parseInt(requestId, 10),
        notes,
        attachmentUrl,
        items: items.map((i: any) => ({
          date: i.date,
          description: i.description,
          accountId: i.accountId ? parseInt(i.accountId, 10) : undefined,
          amount: parseFloat(i.amount),
          receiptUrl: i.receiptUrl,
        })),
      },
      req.user
    );

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating LPJ:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan LPJ' });
  }
});

apiRouter.put('/lpjs/:id/review', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { action, notes } = req.body;
    if (!action) return res.status(400).json({ error: 'Aksi verifikasi LPJ wajib ditentukan' });

    const result = await reviewLpj(id, { action, notes }, req.user);
    res.json(result);
  } catch (error: any) {
    console.error('Error reviewing LPJ:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses verifikasi LPJ' });
  }
});

// 16.5. Refunds (Pengembalian Sisa Dana)
apiRouter.get('/fund-refunds', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { lpjId, requestId, cashBankType, startDate, endDate } = req.query;
    const filter: any = {};
    if (lpjId) filter.lpjId = parseInt(String(lpjId), 10);
    if (requestId) filter.requestId = parseInt(String(requestId), 10);
    if (cashBankType) filter.cashBankType = String(cashBankType);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const list = await getFundRefunds(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat riwayat pengembalian dana' });
  }
});

apiRouter.post('/lpjs/:id/refund', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lpjId = parseInt(req.params.id, 10);
    const { refundDate, cashBankType, cashBankId, amount, notes, receiptUrl } = req.body;

    if (!refundDate || !cashBankType || !cashBankId || !amount) {
      return res.status(400).json({ error: 'Formulir pengembalian sisa dana tidak lengkap' });
    }

    const result = await processFundRefund(
      lpjId,
      {
        refundDate,
        cashBankType,
        cashBankId: parseInt(cashBankId, 10),
        amount: parseFloat(amount),
        notes,
        receiptUrl,
      },
      req.user
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error processing fund refund:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses pengembalian sisa dana' });
  }
});

// 16.6. Executive / Leadership Monitoring Dashboard
apiRouter.get('/monitoring/leadership', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { fiscalYear, unitId } = req.query;
    const metrics = await getLeadershipMonitoringMetrics(
      fiscalYear ? String(fiscalYear) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined
    );
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching leadership metrics:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat monitoring pimpinan' });
  }
});

// 16.7. FASE 4 AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase4/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase4AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 4 automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian FASE 4' });
  }
});

// =========================================================================
// 17. FASE 5: MODUL INVESTASI PESANTREN (API ENDPOINTS)
// =========================================================================

// 17.1. Dashboard Summary
apiRouter.get('/investments/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await getInvestmentDashboardSummary();
    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching investment dashboard:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat dashboard investasi' });
  }
});

// 17.2. Master Data Investasi
apiRouter.get('/investments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { status, investmentType, fundId, unitId } = req.query;
    const filter: any = {};
    if (status) filter.status = String(status);
    if (investmentType) filter.investmentType = String(investmentType);
    if (fundId) filter.fundId = parseInt(String(fundId), 10);
    if (unitId) filter.unitId = parseInt(String(unitId), 10);

    const list = await getInvestments(filter, req.user);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat daftar investasi' });
  }
});

apiRouter.get('/investments/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await getInvestmentById(id);
    if (!item) return res.status(404).json({ error: 'Data investasi tidak ditemukan' });
    res.json(item);
  } catch (error: any) {
    console.error('Error fetching investment by id:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data investasi' });
  }
});

apiRouter.post('/investments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      investeeName,
      investmentType,
      placementDate,
      startDate,
      dueDate,
      initialCapital,
      fundId,
      unitId,
      investmentAccountId,
      sourceCashAccountId,
      sourceBankAccountId,
      investmentScheme,
      profitSharingPercentage,
      profitPaymentSchedule,
      targetReturnEstimate,
      picName,
      picContact,
      notes,
      contractUrl,
      submitImmediately,
    } = req.body;

    if (!investeeName || !initialCapital || !fundId || !picName) {
      return res.status(400).json({ error: 'Field wajib usulan investasi belum lengkap' });
    }

    const created = await createInvestment(
      {
        investeeName,
        investmentType: investmentType || 'BAGI_HASIL',
        placementDate: placementDate || new Date().toISOString().split('T')[0],
        startDate: startDate || new Date().toISOString().split('T')[0],
        dueDate,
        initialCapital: parseFloat(initialCapital),
        fundId: parseInt(fundId, 10),
        unitId: unitId ? parseInt(unitId, 10) : undefined,
        investmentAccountId: investmentAccountId ? parseInt(investmentAccountId, 10) : undefined,
        sourceCashAccountId: sourceCashAccountId ? parseInt(sourceCashAccountId, 10) : undefined,
        sourceBankAccountId: sourceBankAccountId ? parseInt(sourceBankAccountId, 10) : undefined,
        investmentScheme,
        profitSharingPercentage: profitSharingPercentage ? parseFloat(profitSharingPercentage) : undefined,
        profitPaymentSchedule,
        targetReturnEstimate: targetReturnEstimate ? parseFloat(targetReturnEstimate) : undefined,
        picName,
        picContact,
        notes,
        contractUrl,
        submitImmediately: !!submitImmediately,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating investment:', error);
    res.status(400).json({ error: error.message || 'Gagal membuat usulan investasi' });
  }
});

apiRouter.put('/investments/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Status investasi wajib ditentukan' });

    const updated = await updateInvestmentStatus(id, status, notes, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating investment status:', error);
    res.status(400).json({ error: error.message || 'Gagal mengubah status investasi' });
  }
});

// 17.3. Penempatan Dana (Placement)
apiRouter.post('/investments/:id/placement', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, amount, cashBankType, cashAccountId, bankAccountId, reference, description, attachmentUrl } = req.body;

    if (!date || !amount || !cashBankType) {
      return res.status(400).json({ error: 'Parameter penempatan dana investasi belum lengkap' });
    }

    const result = await placeInvestmentFund(
      id,
      {
        date,
        amount: parseFloat(amount),
        cashBankType,
        cashAccountId: cashAccountId ? parseInt(cashAccountId, 10) : undefined,
        bankAccountId: bankAccountId ? parseInt(bankAccountId, 10) : undefined,
        reference,
        description,
        attachmentUrl,
      },
      req.user
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error placing investment fund:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses penempatan dana investasi' });
  }
});

// 17.4. Pendapatan Bagi Hasil (Profit Sharing)
apiRouter.post('/investments/:id/profit-sharing', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, amount, cashBankType, cashAccountId, bankAccountId, period, reference, description, attachmentUrl } = req.body;

    if (!date || !amount || !cashBankType) {
      return res.status(400).json({ error: 'Parameter pendapatan bagi hasil belum lengkap' });
    }

    const result = await recordInvestmentProfitSharing(
      id,
      {
        date,
        amount: parseFloat(amount),
        cashBankType,
        cashAccountId: cashAccountId ? parseInt(cashAccountId, 10) : undefined,
        bankAccountId: bankAccountId ? parseInt(bankAccountId, 10) : undefined,
        period,
        reference,
        description,
        attachmentUrl,
      },
      req.user
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error recording profit sharing:', error);
    res.status(400).json({ error: error.message || 'Gagal mencatat pendapatan bagi hasil' });
  }
});

// 17.5. Pengembalian Modal (Capital Return)
apiRouter.post('/investments/:id/capital-return', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, amount, cashBankType, cashAccountId, bankAccountId, reference, description, attachmentUrl } = req.body;

    if (!date || !amount || !cashBankType) {
      return res.status(400).json({ error: 'Parameter pengembalian modal belum lengkap' });
    }

    const result = await returnInvestmentCapital(
      id,
      {
        date,
        amount: parseFloat(amount),
        cashBankType,
        cashAccountId: cashAccountId ? parseInt(cashAccountId, 10) : undefined,
        bankAccountId: bankAccountId ? parseInt(bankAccountId, 10) : undefined,
        reference,
        description,
        attachmentUrl,
      },
      req.user
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error returning investment capital:', error);
    res.status(400).json({ error: error.message || 'Gagal memproses pengembalian modal investasi' });
  }
});

// 17.6. Penyesuaian Nilai / Kerugian (Valuation Adjustment)
apiRouter.post('/investments/:id/valuation-adjustment', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { date, lossAmount, reason, reference, attachmentUrl } = req.body;

    if (!date || !lossAmount || !reason) {
      return res.status(400).json({ error: 'Tanggal, nominal penurunan nilai, dan alasan wajib diisi' });
    }

    const result = await adjustInvestmentValuation(
      id,
      {
        date,
        lossAmount: parseFloat(lossAmount),
        reason,
        reference,
        attachmentUrl,
      },
      req.user
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Error adjusting investment valuation:', error);
    res.status(400).json({ error: error.message || 'Gagal mencatat penyesuaian nilai investasi' });
  }
});

// 17.7. Riwayat Transaksi Investasi
apiRouter.get('/investment-transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, type, startDate, endDate } = req.query;
    const filter: any = {};
    if (investmentId) filter.investmentId = parseInt(String(investmentId), 10);
    if (type) filter.type = String(type);
    if (startDate) filter.startDate = String(startDate);
    if (endDate) filter.endDate = String(endDate);

    const list = await getInvestmentTransactions(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching investment transactions:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat riwayat transaksi investasi' });
  }
});

// 17.8. Rekonsiliasi Investasi
apiRouter.get('/investment-reconciliations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, status } = req.query;
    const filter: any = {};
    if (investmentId) filter.investmentId = parseInt(String(investmentId), 10);
    if (status) filter.status = String(status);

    const list = await getInvestmentReconciliations(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching reconciliations:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat data rekonsiliasi investasi' });
  }
});

apiRouter.post('/investment-reconciliations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, asOfDate, investeeReportedValue, expectedProfitSharing, actualProfitReceived, capitalReturned, notes, attachmentUrl } = req.body;

    if (!investmentId || !asOfDate || investeeReportedValue === undefined) {
      return res.status(400).json({ error: 'Parameter rekonsiliasi investasi tidak lengkap' });
    }

    const created = await createInvestmentReconciliation(
      {
        investmentId: parseInt(investmentId, 10),
        asOfDate,
        investeeReportedValue: parseFloat(investeeReportedValue),
        expectedProfitSharing: expectedProfitSharing ? parseFloat(expectedProfitSharing) : undefined,
        actualProfitReceived: actualProfitReceived ? parseFloat(actualProfitReceived) : undefined,
        capitalReturned: capitalReturned ? parseFloat(capitalReturned) : undefined,
        notes,
        attachmentUrl,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating reconciliation:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan rekonsiliasi investasi' });
  }
});

// 17.9. Dokumen Investasi
apiRouter.get('/investment-documents', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId } = req.query;
    const list = await getInvestmentDocuments(investmentId ? parseInt(String(investmentId), 10) : undefined);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching investment documents:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat dokumen investasi' });
  }
});

apiRouter.post('/investment-documents', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { investmentId, documentType, title, fileUrl, notes } = req.body;
    if (!investmentId || !documentType || !title || !fileUrl) {
      return res.status(400).json({ error: 'Parameter dokumen investasi tidak lengkap' });
    }

    const created = await addInvestmentDocument(
      {
        investmentId: parseInt(investmentId, 10),
        documentType,
        title,
        fileUrl,
        notes,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating investment document:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan dokumen investasi' });
  }
});

// 17.10. FASE 5 AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase5/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase5AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 5 automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian FASE 5' });
  }
});

// =========================================================================
// 18. FASE 6: LAPORAN KEUANGAN LENGKAP, KONSISTENSI JURNAL -> BUKU BESAR,
// REKONSILIASI KAS & BANK, INTEGRITAS AKUNTANSI & BANTU BENDAHARA
// =========================================================================

// 18.1. Neraca Saldo (Trial Balance)
apiRouter.get('/reports/trial-balance', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { asOfDate, startDate, unitId, fundId } = req.query;
    const data = await getTrialBalance(
      asOfDate ? String(asOfDate) : undefined,
      startDate ? String(startDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching trial balance:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Neraca Saldo' });
  }
});

// 18.2. Neraca / Laporan Posisi Keuangan (Balance Sheet)
apiRouter.get('/reports/balance-sheet', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { asOfDate, unitId, fundId } = req.query;
    const data = await getBalanceSheet(
      asOfDate ? String(asOfDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Neraca Posisi Keuangan' });
  }
});

// 18.3. Laporan Pendapatan dan Beban (Income Statement / Aktivitas)
apiRouter.get('/reports/income-statement', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, unitId, fundId } = req.query;
    const data = await getIncomeStatement(
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching income statement:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Laporan Pendapatan dan Beban' });
  }
});

// 18.4. Laporan Arus Kas (Cash Flow Statement)
apiRouter.get('/reports/cash-flow', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, unitId, fundId } = req.query;
    const data = await getCashFlowStatement(
      startDate ? String(startDate) : undefined,
      endDate ? String(endDate) : undefined,
      unitId ? parseInt(String(unitId), 10) : undefined,
      fundId ? parseInt(String(fundId), 10) : undefined
    );
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching cash flow statement:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat Laporan Arus Kas' });
  }
});

// 18.5. Rekonsiliasi Kas & Bank (List & Create)
apiRouter.get('/cash-bank-reconciliations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { accountType, status, bankAccountId, cashAccountId } = req.query;
    const filter: any = {};
    if (accountType) filter.accountType = String(accountType);
    if (status) filter.status = String(status);
    if (bankAccountId) filter.bankAccountId = parseInt(String(bankAccountId), 10);
    if (cashAccountId) filter.cashAccountId = parseInt(String(cashAccountId), 10);

    const list = await getCashBankReconciliations(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching cash/bank reconciliations:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat rekonsiliasi kas dan bank' });
  }
});

apiRouter.post('/cash-bank-reconciliations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      accountType,
      cashAccountId,
      bankAccountId,
      reconciliationDate,
      statementBalance,
      notes,
      attachmentUrl,
    } = req.body;

    if (!accountType || !reconciliationDate || statementBalance === undefined || statementBalance === null) {
      return res.status(400).json({ error: 'Parameter rekonsiliasi kas/bank tidak lengkap.' });
    }

    const created = await createCashBankReconciliation(
      {
        accountType,
        cashAccountId: cashAccountId ? parseInt(cashAccountId, 10) : undefined,
        bankAccountId: bankAccountId ? parseInt(bankAccountId, 10) : undefined,
        reconciliationDate,
        statementBalance: parseFloat(statementBalance),
        notes,
        attachmentUrl,
      },
      req.user
    );

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating cash/bank reconciliation:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan rekonsiliasi kas/bank' });
  }
});

// 18.6. Panduan Bantu Debit & Kredit Bendahara
apiRouter.get('/bendahara/debit-credit-guides', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const guides = getDebitCreditHelperGuides();
    res.json(guides);
  } catch (error: any) {
    console.error('Error fetching debit/credit guides:', error);
    res.status(500).json({ error: 'Gagal memuat panduan debit kredit' });
  }
});

// 18.7. Pemeriksaan Integritas & Kesehatan Pembukuan Otomatis
apiRouter.get('/bendahara/integrity-checks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const results = await runAccountingIntegrityChecks();
    res.json(results);
  } catch (error: any) {
    console.error('Error running integrity checks:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pemeriksaan kesehatan akuntansi' });
  }
});

// 18.8. FASE 6 AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase6/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase6AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 6 automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian FASE 6' });
  }
});

// =========================================================================
// ========================= TAHAP 7 API ENDPOINTS =========================
// =========================================================================

// 19.1. Kategori Transaksi
apiRouter.get('/fase7/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;
    const cats = await getTransactionCategories(type ? String(type) : undefined);
    res.json(cats);
  } catch (error: any) {
    console.error('Error fetching transaction categories:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat kategori transaksi' });
  }
});

apiRouter.post('/fase7/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, defaultAccountId, description, warningNotice } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Nama dan jenis kategori wajib diisi' });
    }
    const created = await createTransactionCategory(
      {
        name,
        type,
        defaultAccountId: defaultAccountId ? parseInt(defaultAccountId, 10) : null,
        description,
        warningNotice,
        isActive: true,
      },
      req.user
    );
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating transaction category:', error);
    res.status(400).json({ error: error.message || 'Gagal membuat kategori transaksi' });
  }
});

apiRouter.put('/fase7/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateTransactionCategory(id, req.body, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating transaction category:', error);
    res.status(400).json({ error: error.message || 'Gagal memperbarui kategori transaksi' });
  }
});

// 19.2. Accounting Rules (Database Aturan Akuntansi)
apiRouter.get('/fase7/rules', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { transactionType } = req.query;
    const rules = await getAccountingRules(transactionType ? String(transactionType) : undefined);
    res.json(rules);
  } catch (error: any) {
    console.error('Error fetching accounting rules:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat aturan akuntansi' });
  }
});

apiRouter.post('/fase7/rules', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const created = await createAccountingRule(req.body, req.user);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating accounting rule:', error);
    res.status(400).json({ error: error.message || 'Gagal membuat aturan akuntansi' });
  }
});

apiRouter.put('/fase7/rules/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateAccountingRule(id, req.body, req.user);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating accounting rule:', error);
    res.status(400).json({ error: error.message || 'Gagal memperbarui aturan akuntansi' });
  }
});

// 19.3. Penjelasan Debit / Kredit ("Kenapa jurnalnya seperti ini?")
apiRouter.post('/fase7/explain', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const explanation = await explainDebitCreditRule(req.body);
    res.json(explanation);
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan penjelasan debit/kredit' });
  }
});

// 19.4. Preview Transaksi Operasional
apiRouter.post('/fase7/transactions/preview', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const preview = await previewOperationalTransaction(req.body);
    res.json(preview);
  } catch (error: any) {
    console.error('Error generating transaction preview:', error);
    res.status(400).json({ error: error.message || 'Gagal menghasilkan preview transaksi' });
  }
});

// 19.5. Posting Transaksi Operasional Sederhana
apiRouter.post('/fase7/transactions/post', requireAuth, requireWritePermission, async (req: AuthRequest, res: Response) => {
  try {
    const result = await createOperationalTransaction(req.body, req.user);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error posting operational transaction:', error);
    if (error.message?.includes('Akses ditolak') || error.message?.includes('Read-Only')) {
      return res.status(403).json({ error: error.message, isAccessDenied: true });
    }
    res.status(400).json({ error: error.message || 'Gagal memposting transaksi' });
  }
});

// 19.6. Koreksi Transaksi (VOID / REVERSAL / CORRECTION)
apiRouter.post('/fase7/transactions/correct', requireAuth, requireWritePermission, async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId, correctionType, reason, newTransactionData } = req.body;
    if (!transactionId || !correctionType || !reason) {
      return res.status(400).json({ error: 'Parameter koreksi transaksi tidak lengkap (ID, Tipe Koreksi, dan Alasan wajib diisi).' });
    }

    const result = await correctTransactionWithAudit(
      {
        transactionId: parseInt(transactionId, 10),
        correctionType,
        reason,
        newTransactionData,
      },
      req.user
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error correcting transaction:', error);
    if (error.message?.includes('Akses ditolak') || error.message?.includes('Hanya Bendahara atau Super Admin')) {
      return res.status(403).json({ error: error.message, isAccessDenied: true });
    }
    res.status(400).json({ error: error.message || 'Gagal memproses koreksi transaksi' });
  }
});

apiRouter.get('/fase7/corrections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const corrections = await getTransactionCorrections();
    res.json(corrections);
  } catch (error: any) {
    console.error('Error fetching transaction corrections:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat riwayat koreksi transaksi' });
  }
});

// 19.7. Pencarian Bahasa Alami (Smart Search)
apiRouter.get('/fase7/search', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const parsed = await parseNaturalLanguageSearch(q ? String(q) : '');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error parsing search:', error);
    res.status(500).json({ error: error.message || 'Gagal memproses pencarian' });
  }
});

// 19.8. Dashboard Khusus Bendahara
apiRouter.get('/fase7/dashboard/bendahara', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getBendaharaDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching bendahara dashboard:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat dashboard bendahara' });
  }
});

// 19.9. Dashboard Khusus Pimpinan
apiRouter.get('/fase7/dashboard/pimpinan', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getPimpinanDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching pimpinan dashboard:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat dashboard pimpinan' });
  }
});

// 19.10. Accounting Health Check (Diagnostik & Bantuan Solusi)
apiRouter.get('/fase7/health-check', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const health = await runAccountingHealthCheck();
    res.json(health);
  } catch (error: any) {
    console.error('Error running accounting health check:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan health check akuntansi' });
  }
});

// 19.11. FASE 7 AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase7/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase7AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 7 automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian FASE 7' });
  }
});

// 20. TAHAP 8A AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase8/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase8AutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 8 automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian TAHAP 8A' });
  }
});

// 21. TAHAP 8B AUTOMATED TEST SUITE RUNNER (AUDIT TRAIL & PERLINDUNGAN TRANSAKSI)
apiRouter.post('/fase8b/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase8BAutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 8B automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian TAHAP 8B' });
  }
});

// 22. KONTROL PERIODE AKUNTANSI (TAHAP 8C)
apiRouter.get('/accounting-periods', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const periods = await getAccountingPeriods();
    res.json(periods);
  } catch (error: any) {
    console.error('Error fetching accounting periods:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat periode akuntansi' });
  }
});

apiRouter.post('/accounting-periods/:periodKey/close', requireAuth, requireWritePermission, async (req: AuthRequest, res: Response) => {
  try {
    const { periodKey } = req.params;
    const { reason, confirmed } = req.body;
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Alasan penutupan periode akuntansi wajib diisi (minimal 5 karakter).' });
    }
    const result = await closeAccountingPeriod(periodKey, reason, req.user, confirmed !== false);
    res.json({ success: true, period: result });
  } catch (error: any) {
    console.error('Error closing accounting period:', error);
    if (error.message?.includes('Akses ditolak') || error.message?.includes('Hanya Bendahara atau Super Admin')) {
      return res.status(403).json({ error: error.message, isAccessDenied: true });
    }
    res.status(400).json({ error: error.message || 'Gagal menutup periode akuntansi' });
  }
});

apiRouter.post('/accounting-periods/:periodKey/reopen', requireAuth, requireWritePermission, async (req: AuthRequest, res: Response) => {
  try {
    const { periodKey } = req.params;
    const { reason, confirmed } = req.body;
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Alasan pembukaan kembali (reopening) periode wajib diisi (minimal 5 karakter).' });
    }
    const result = await reopenAccountingPeriod(periodKey, reason, req.user, confirmed !== false);
    res.json({ success: true, period: result });
  } catch (error: any) {
    console.error('Error reopening accounting period:', error);
    if (error.message?.includes('Akses ditolak') || error.message?.includes('Hanya Bendahara atau Super Admin')) {
      return res.status(403).json({ error: error.message, isAccessDenied: true });
    }
    res.status(400).json({ error: error.message || 'Gagal membuka kembali periode akuntansi' });
  }
});

// 23. ACCOUNTING INTEGRITY CHECK 11-POINT AUDIT (TAHAP 8C)
apiRouter.get('/accounting-integrity/audit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const auditReport = await runComprehensiveAccountingIntegrityAudit();
    res.json(auditReport);
  } catch (error: any) {
    console.error('Error running accounting integrity audit:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan audit integritas akuntansi' });
  }
});

// 24. SECURITY EVENTS LOGGING (TAHAP 8D)
apiRouter.get('/security-events', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, severity, q, limit } = req.query;
    const events = await getSecurityEvents({
      eventType: eventType ? String(eventType) : undefined,
      severity: severity ? String(severity) : undefined,
      searchQuery: q ? String(q) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 100,
    });
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat log peristiwa keamanan' });
  }
});

apiRouter.post('/security-events', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { eventType, severity, details, metadata } = req.body;
    if (!eventType || !details) {
      return res.status(400).json({ error: 'Parameter eventType dan details wajib diisi' });
    }
    const recorded = await recordSecurityEvent({
      eventType,
      severity,
      user: req.user,
      ipAddress: req.ip,
      details,
      metadata,
    });
    res.status(201).json(recorded);
  } catch (error: any) {
    console.error('Error recording security event:', error);
    res.status(400).json({ error: error.message || 'Gagal mencatat security event' });
  }
});

// 25. BACKUP & RECOVERY (TAHAP 8D-8E)
apiRouter.get('/backup/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = getBackupStatus();
    res.json(status);
  } catch (error: any) {
    console.error('Error fetching backup status:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat status backup' });
  }
});

apiRouter.post('/backup/generate', requireAuth, requireWritePermission, async (req: AuthRequest, res: Response) => {
  try {
    const meta = await generateBackupSnapshot(req.user);
    res.status(201).json({ success: true, backup: meta });
  } catch (error: any) {
    console.error('Error generating backup snapshot:', error);
    if (error.message?.includes('Akses ditolak')) {
      return res.status(403).json({ error: error.message, isAccessDenied: true });
    }
    res.status(400).json({ error: error.message || 'Gagal membuat backup snapshot' });
  }
});

apiRouter.get('/backup/download/:filename', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userRole = (req.user?.roleName || (req.user as any)?.role || '').toUpperCase();
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'BENDAHARA') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Super Admin atau Bendahara yang dapat mengunduh file backup' });
    }
    const filename = path.basename(req.params.filename);
    const filePath = path.join(process.cwd(), 'data', 'backups', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File backup tidak ditemukan di server' });
    }
    res.download(filePath, filename);
  } catch (error: any) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: error.message || 'Gagal mengunduh file backup' });
  }
});

apiRouter.post('/backup/verify/:snapshotId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = verifyBackupIntegrity(req.params.snapshotId);
    res.json(result);
  } catch (error: any) {
    console.error('Error verifying backup snapshot:', error);
    res.status(400).json({ error: error.message || 'Gagal memverifikasi backup snapshot' });
  }
});

// 26. SECURITY & AUDIT DASHBOARD SUMMARY (TAHAP 8E)
apiRouter.get('/security-audit/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Transactions status
    const allTrx = await getTransactions();
    const pendingCount = allTrx.filter((t: any) => t.status === 'DIAJUKAN' || t.status === 'DRAFT').length;
    const reversedCount = allTrx.filter((t: any) => t.status === 'REVERSED').length;
    const voidCount = allTrx.filter((t: any) => t.status === 'VOID').length;

    // 2. Periods status
    const periods = await getAccountingPeriods();
    const closedPeriodsCount = periods.filter((p) => p.status === 'CLOSED').length;

    // 3. Integrity checks
    const integrityReport = await runComprehensiveAccountingIntegrityAudit();

    // 4. Security events
    const secEvents = await getSecurityEvents({ limit: 100 });
    const failedLoginsCount = secEvents.filter((e) => e.eventType === 'LOGIN_FAILED').length;
    const permChangesCount = secEvents.filter((e) => e.eventType === 'PERMISSION_CHANGED' || e.eventType === 'ROLE_CHANGED').length;

    // 5. Backup info
    const backupStatus = getBackupStatus();

    res.json({
      timestamp: new Date().toISOString(),
      transactions: {
        pendingCount,
        reversedCount,
        voidCount,
        totalCount: allTrx.length,
      },
      periods: {
        total: periods.length,
        closedCount: closedPeriodsCount,
        openCount: periods.length - closedPeriodsCount,
      },
      integrity: {
        overallStatus: integrityReport.overallStatus,
        totalChecks: integrityReport.totalChecks,
        passedCount: integrityReport.passedCount,
        warningCount: integrityReport.warningCount,
        errorCount: integrityReport.errorCount,
        summaryMessage: integrityReport.summaryMessage,
      },
      security: {
        failedLoginsCount,
        permissionChangesCount: permChangesCount,
        totalEvents: secEvents.length,
      },
      backup: {
        lastBackup: backupStatus.lastBackup,
        backupStatus: backupStatus.backupStatus,
        backupSize: backupStatus.backupSize,
        lastRestoreTest: backupStatus.lastRestoreTest,
        restoreTestStatus: backupStatus.restoreTestStatus,
      },
    });
  } catch (error: any) {
    console.error('Error fetching security & audit summary:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat ringkasan audit keamanan' });
  }
});

// 27. TAHAP 8C-8E AUTOMATED TEST SUITE RUNNER
apiRouter.post('/fase8c/testing/run', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const testResults = await runPhase8CAutomatedTests(req.user);
    res.json({ success: true, results: testResults });
  } catch (error: any) {
    console.error('Error running Phase 8C automated tests:', error);
    res.status(500).json({ error: error.message || 'Gagal menjalankan pengujian TAHAP 8C-8E' });
  }
});



