import express, { Request, Response } from 'express';
import {
  createAccount,
  createAuditLog,
  createBankAccount,
  createCashAccount,
  createFund,
  createTransaction,
  createUnit,
  getAccounts,
  getAuditLogs,
  getBankAccounts,
  getCashAccounts,
  getDashboardMetrics,
  getFunds,
  getGeneralLedger,
  getJournals,
  getTransactionDetails,
  getTransactions,
  getUnits,
  postTransaction,
  reverseTransaction,
  updateAccount,
  updateFund,
  updateUnit,
} from '../db/accounting.ts';
import { getAllUsers, updateUserRoleAndUnit } from '../db/users.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const apiRouter = express.Router();
apiRouter.use(express.json());

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

// 2. Dashboard metrics
apiRouter.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getDashboardMetrics();
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

// 7. Transactions & Double Entry
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

apiRouter.post('/transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { date, type, unitId, fundId, description, reference, lines, autoPost } = req.body;
    if (!date || !type || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({
        error: 'Transaksi akuntansi wajib menyertakan minimal 2 baris jurnal (Debit & Kredit)',
      });
    }

    const created = await createTransaction(
      { date, type, unitId, fundId, description, reference, lines, autoPost },
      req.user
    );
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal menyimpan transaksi' });
  }
});

apiRouter.post('/transactions/:id/post', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (req.user?.roleName !== 'SUPER_ADMIN' && req.user?.roleName !== 'BENDAHARA') {
      return res.status(403).json({ error: 'Hanya Bendahara atau Super Admin yang dapat mem-posting transaksi' });
    }
    const journal = await postTransaction(id, req.user);
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
    if (req.user?.roleName !== 'SUPER_ADMIN' && req.user?.roleName !== 'BENDAHARA') {
      return res.status(403).json({ error: 'Hanya Bendahara atau Super Admin yang dapat membatalkan transaksi' });
    }
    const result = await reverseTransaction(id, reason, req.user);
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Error reversing transaction:', error);
    res.status(400).json({ error: error.message || 'Gagal membatalkan transaksi' });
  }
});

// 8. Journals
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

// 9. Buku Besar (General Ledger)
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

// 10. Audit Logs
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

// 11. User Management
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
