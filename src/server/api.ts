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
} from '../db/accounting.ts';
import { getAllUsers, updateUserRoleAndUnit } from '../db/users.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

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
    if (!reason) {
      return res.status(400).json({ error: 'Alasan pembatalan/koreksi wajib diisi' });
    }
    const result = await reverseTransaction(id, reason, req.user);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error reversing transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal membatalkan transaksi' });
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

// 12. AUDIT LOGS
apiRouter.get('/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
    const data = await getAuditLogs(limit);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message || 'Gagal memuat riwayat audit' });
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
    const { roleId, unitId, isActive } = req.body;
    const updated = await updateUserRoleAndUnit(id, roleId, unitId, isActive);
    await createAuditLog(
      req.user.id,
      req.user.email,
      'UPDATE',
      'USER',
      String(id),
      `Ubah role pengguna ID #${id} ke Role #${roleId}`
    );
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
