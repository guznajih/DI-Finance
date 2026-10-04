import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  accounts,
  auditLogs,
  bankAccounts,
  cashAccounts,
  funds,
  journalLines,
  journals,
  roles,
  transactionLines,
  transactions,
  units,
  users,
} from './schema.ts';

// Helper to execute query with automatic recovery if connection was idle/closed by Cloud SQL scale-to-zero proxy
export async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.code === '57P01' ||
        err?.code === 'ECONNRESET' ||
        err?.message?.includes('terminating connection due to administrator command') ||
        err?.message?.includes('Connection terminated unexpectedly');

      if (attempt <= maxRetries && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// Helper: Log audit trail
export async function createAuditLog(
  userId: number | null,
  userEmail: string | null,
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'REVERSE' | 'APPROVE' | 'SUBMIT' | 'VOID',
  entityType: 'TRANSACTION' | 'JOURNAL' | 'ACCOUNT' | 'UNIT' | 'FUND' | 'USER' | 'CASH_BANK',
  entityId: string,
  details: string,
  ipAddress: string = ''
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.warn('Failed to write audit log:', err);
  }
}

// ---------------- MASTER DATA ----------------

export async function getUnits() {
  return await executeWithRetry(async () => {
    return await db.select().from(units).orderBy(units.code);
  });
}

export async function createUnit(data: { code: string; name: string; description?: string; isActive?: boolean }, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.insert(units).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'UNIT', String(res[0].id), `Tambah unit: ${res[0].name} (${res[0].code})`);
    return res[0];
  });
}

export async function updateUnit(id: number, data: { name?: string; description?: string; isActive?: boolean }, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.update(units).set(data).where(eq(units.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'UNIT', String(id), `Update unit: ${res[0].name}`);
    return res[0];
  });
}

export async function getFunds() {
  return await executeWithRetry(async () => {
    return await db.select().from(funds).orderBy(funds.code);
  });
}

export async function createFund(data: { code: string; name: string; type: string; description?: string; isActive?: boolean }, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.insert(funds).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'FUND', String(res[0].id), `Tambah sumber dana: ${res[0].name} (${res[0].code})`);
    return res[0];
  });
}

export async function updateFund(id: number, data: { name?: string; type?: string; description?: string; isActive?: boolean }, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.update(funds).set(data).where(eq(funds.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'FUND', String(id), `Update sumber dana: ${res[0].name}`);
    return res[0];
  });
}

export async function getAccounts() {
  return await executeWithRetry(async () => {
    return await db.select().from(accounts).orderBy(accounts.code);
  });
}

export async function createAccount(data: {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  normalBalance: string;
  description?: string;
  isActive?: boolean;
}, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.insert(accounts).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'ACCOUNT', String(res[0].id), `Tambah akun: [${res[0].code}] ${res[0].name}`);
    return res[0];
  });
}

export async function updateAccount(id: number, data: {
  name?: string;
  category?: string;
  subCategory?: string;
  normalBalance?: string;
  description?: string;
  isActive?: boolean;
}, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'ACCOUNT', String(id), `Update akun: [${res[0].code}] ${res[0].name}`);
    return res[0];
  });
}

export async function getCashAccounts() {
  return await executeWithRetry(async () => {
    return await db
      .select({
        id: cashAccounts.id,
        accountId: cashAccounts.accountId,
        name: cashAccounts.name,
        unitId: cashAccounts.unitId,
        initialBalance: cashAccounts.initialBalance,
        currentBalance: cashAccounts.currentBalance,
        isActive: cashAccounts.isActive,
        accountCode: accounts.code,
        accountName: accounts.name,
        unitName: units.name,
      })
      .from(cashAccounts)
      .leftJoin(accounts, eq(cashAccounts.accountId, accounts.id))
      .leftJoin(units, eq(cashAccounts.unitId, units.id))
      .orderBy(cashAccounts.id);
  });
}

export async function createCashAccount(data: {
  accountId: number;
  name: string;
  unitId?: number | null;
  initialBalance: string;
  isActive?: boolean;
}, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db
      .insert(cashAccounts)
      .values({
        ...data,
        currentBalance: data.initialBalance,
      })
      .returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'CASH_BANK', String(res[0].id), `Tambah kas tunai: ${res[0].name}`);
    return res[0];
  });
}

export async function getBankAccounts() {
  return await executeWithRetry(async () => {
    return await db
      .select({
        id: bankAccounts.id,
        accountId: bankAccounts.accountId,
        accountName: bankAccounts.accountName,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        initialBalance: bankAccounts.initialBalance,
        currentBalance: bankAccounts.currentBalance,
        isActive: bankAccounts.isActive,
        accountCode: accounts.code,
        coaAccountName: accounts.name,
      })
      .from(bankAccounts)
      .leftJoin(accounts, eq(bankAccounts.accountId, accounts.id))
      .orderBy(bankAccounts.id);
  });
}

export async function createBankAccount(data: {
  accountId: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  initialBalance: string;
  isActive?: boolean;
}, user?: any) {
  return await executeWithRetry(async () => {
    const res = await db
      .insert(bankAccounts)
      .values({
        ...data,
        currentBalance: data.initialBalance,
      })
      .returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'CASH_BANK', String(res[0].id), `Tambah rekening bank: ${res[0].bankName} - ${res[0].accountNumber}`);
    return res[0];
  });
}

// ---------------- NUMBER GENERATOR HELPERS ----------------

async function generateTransactionNumber(prefix: string, dateStr: string): Promise<string> {
  const yearMonth = dateStr.replace(/-/g, '').substring(0, 6);
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(sql`transaction_number LIKE ${prefix + '-' + yearMonth + '-%'}`);
  const nextNum = Number(countRes[0]?.count || 0) + 1;
  return `${prefix}-${yearMonth}-${String(nextNum).padStart(4, '0')}`;
}

async function generateJournalNumber(dateStr: string): Promise<string> {
  const yearMonth = dateStr.replace(/-/g, '').substring(0, 6);
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(journals)
    .where(sql`journal_number LIKE ${'JRN-' + yearMonth + '-%'}`);
  const nextNum = Number(countRes[0]?.count || 0) + 1;
  return `JRN-${yearMonth}-${String(nextNum).padStart(4, '0')}`;
}

// ---------------- TRANSACTION CREATION ENGINES ----------------

// 1. PENERIMAAN KAS/BANK
export interface CreatePenerimaanInput {
  date: string; // YYYY-MM-DD
  incomeAccountId: number;
  unitId?: number | null;
  fundId?: number | null;
  cashBankType: 'KAS' | 'BANK';
  cashBankId: number; // cashAccounts.id or bankAccounts.id
  amount: number;
  description: string;
  reference?: string;
  attachmentUrl?: string;
  status?: 'DRAFT' | 'DIAJUKAN' | 'POSTED';
}

export async function createPenerimaan(input: CreatePenerimaanInput, user: any) {
  return await executeWithRetry(async () => {
    if (input.amount <= 0) throw new Error('Nominal transaksi harus lebih besar dari 0');
    if (!input.incomeAccountId) throw new Error('Akun pendapatan wajib dipilih');
    if (!input.cashBankId) throw new Error('Kas atau rekening bank wajib dipilih');

    let cashAccountId: number | null = null;
    let bankAccountId: number | null = null;
    let coaKasBankAccountId: number;

    if (input.cashBankType === 'KAS') {
      const [c] = await db.select().from(cashAccounts).where(eq(cashAccounts.id, input.cashBankId));
      if (!c) throw new Error('Rekening kas tidak ditemukan');
      cashAccountId = c.id;
      coaKasBankAccountId = c.accountId;
    } else {
      const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.cashBankId));
      if (!b) throw new Error('Rekening bank tidak ditemukan');
      bankAccountId = b.id;
      coaKasBankAccountId = b.accountId;
    }

    const transactionNumber = await generateTransactionNumber('KM', input.date);
    const isAutoPost = input.status === 'POSTED' && (user.roleName === 'SUPER_ADMIN' || user.roleName === 'BENDAHARA');
    const initialStatus = isAutoPost ? 'POSTED' : input.status || 'DRAFT';

    const result = await db.transaction(async (tx) => {
      const [newTrx] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          date: input.date,
          type: 'PENERIMAAN',
          unitId: input.unitId || null,
          fundId: input.fundId || null,
          description: input.description,
          reference: input.reference || null,
          attachmentUrl: input.attachmentUrl || null,
          totalAmount: input.amount.toFixed(2),
          status: 'DRAFT',
          cashBankType: input.cashBankType,
          cashAccountId,
          bankAccountId,
          createdById: user.id,
        })
        .returning();

      // Line 1: DEBIT Kas/Bank
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: coaKasBankAccountId,
        description: `Penerimaan ke ${input.cashBankType}`,
        debit: input.amount.toFixed(2),
        credit: '0.00',
        lineNumber: 1,
      });

      // Line 2: KREDIT Pendapatan
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: input.incomeAccountId,
        description: input.description,
        debit: '0.00',
        credit: input.amount.toFixed(2),
        lineNumber: 2,
      });

      if (isAutoPost) {
        await postTransactionInternal(tx, newTrx.id, user, false);
        const [posted] = await tx.select().from(transactions).where(eq(transactions.id, newTrx.id));
        return posted;
      } else if (input.status === 'DIAJUKAN') {
        const [sub] = await tx
          .update(transactions)
          .set({ status: 'DIAJUKAN' })
          .where(eq(transactions.id, newTrx.id))
          .returning();
        return sub;
      }

      return newTrx;
    });

    await createAuditLog(
      user.id,
      user.email,
      isAutoPost ? 'POST' : 'CREATE',
      'TRANSACTION',
      String(result.id),
      `Penerimaan ${result.transactionNumber} senilai Rp ${input.amount.toLocaleString('id-ID')} (${result.status})`
    );

    return result;
  });
}

// 2. PENGELUARAN KAS/BANK
export interface CreatePengeluaranInput {
  date: string;
  expenseAccountId: number;
  unitId?: number | null;
  fundId?: number | null;
  cashBankType: 'KAS' | 'BANK';
  cashBankId: number;
  recipient: string;
  amount: number;
  description: string;
  reference?: string;
  attachmentUrl?: string;
  status?: 'DRAFT' | 'DIAJUKAN' | 'POSTED';
  allowNegativeBalance?: boolean;
}

export async function createPengeluaran(input: CreatePengeluaranInput, user: any) {
  return await executeWithRetry(async () => {
    if (input.amount <= 0) throw new Error('Nominal transaksi harus lebih besar dari 0');
    if (!input.expenseAccountId) throw new Error('Akun beban wajib dipilih');
    if (!input.cashBankId) throw new Error('Kas atau rekening bank wajib dipilih');

    let cashAccountId: number | null = null;
    let bankAccountId: number | null = null;
    let coaKasBankAccountId: number;
    let currentBal = 0;
    let accountDisplayName = '';

    if (input.cashBankType === 'KAS') {
      const [c] = await db.select().from(cashAccounts).where(eq(cashAccounts.id, input.cashBankId));
      if (!c) throw new Error('Rekening kas tidak ditemukan');
      cashAccountId = c.id;
      coaKasBankAccountId = c.accountId;
      currentBal = Number(c.currentBalance);
      accountDisplayName = c.name;
    } else {
      const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.cashBankId));
      if (!b) throw new Error('Rekening bank tidak ditemukan');
      bankAccountId = b.id;
      coaKasBankAccountId = b.accountId;
      currentBal = Number(b.currentBalance);
      accountDisplayName = `${b.bankName} (${b.accountNumber})`;
    }

    const isAutoPost = input.status === 'POSTED' && (user.roleName === 'SUPER_ADMIN' || user.roleName === 'BENDAHARA');

    // Negative balance validation on posting
    if (isAutoPost && currentBal - input.amount < 0 && !input.allowNegativeBalance) {
      throw new Error(
        `Saldo ${accountDisplayName} tidak mencukupi! Saldo saat ini Rp ${currentBal.toLocaleString(
          'id-ID'
        )}, Pengeluaran Rp ${input.amount.toLocaleString(
          'id-ID'
        )}. Saldo tidak boleh negatif kecuali disetujui administrator.`
      );
    }

    const transactionNumber = await generateTransactionNumber('KK', input.date);

    const result = await db.transaction(async (tx) => {
      const [newTrx] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          date: input.date,
          type: 'PENGELUARAN',
          unitId: input.unitId || null,
          fundId: input.fundId || null,
          description: input.description,
          recipient: input.recipient || null,
          reference: input.reference || null,
          attachmentUrl: input.attachmentUrl || null,
          totalAmount: input.amount.toFixed(2),
          status: 'DRAFT',
          cashBankType: input.cashBankType,
          cashAccountId,
          bankAccountId,
          createdById: user.id,
        })
        .returning();

      // Line 1: DEBIT Akun Beban
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: input.expenseAccountId,
        description: input.description,
        debit: input.amount.toFixed(2),
        credit: '0.00',
        lineNumber: 1,
      });

      // Line 2: KREDIT Kas/Bank
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: coaKasBankAccountId,
        description: `Pengeluaran dari ${input.cashBankType} kepada ${input.recipient || '-'}`,
        debit: '0.00',
        credit: input.amount.toFixed(2),
        lineNumber: 2,
      });

      if (isAutoPost) {
        await postTransactionInternal(tx, newTrx.id, user, !!input.allowNegativeBalance);
        const [posted] = await tx.select().from(transactions).where(eq(transactions.id, newTrx.id));
        return posted;
      } else if (input.status === 'DIAJUKAN') {
        const [sub] = await tx
          .update(transactions)
          .set({ status: 'DIAJUKAN' })
          .where(eq(transactions.id, newTrx.id))
          .returning();
        return sub;
      }

      return newTrx;
    });

    await createAuditLog(
      user.id,
      user.email,
      isAutoPost ? 'POST' : 'CREATE',
      'TRANSACTION',
      String(result.id),
      `Pengeluaran ${result.transactionNumber} senilai Rp ${input.amount.toLocaleString('id-ID')} kepada ${input.recipient || '-'} (${result.status})`
    );

    return result;
  });
}

// 3. TRANSFER ANTAR KAS & BANK
export interface CreateTransferInput {
  date: string;
  fromType: 'KAS' | 'BANK';
  fromId: number;
  toType: 'KAS' | 'BANK';
  toId: number;
  amount: number;
  description: string;
  reference?: string;
  attachmentUrl?: string;
  status?: 'DRAFT' | 'DIAJUKAN' | 'POSTED';
  allowNegativeBalance?: boolean;
}

export async function createTransfer(input: CreateTransferInput, user: any) {
  return await executeWithRetry(async () => {
    if (input.amount <= 0) throw new Error('Nominal transfer harus lebih besar dari 0');
    if (input.fromType === input.toType && input.fromId === input.toId) {
      throw new Error('Akun asal dan akun tujuan transfer tidak boleh sama');
    }

    let sourceCoaId: number;
    let targetCoaId: number;
    let sourceBal = 0;
    let sourceDisplayName = '';
    let targetDisplayName = '';

    let sourceCashId: number | null = null;
    let sourceBankId: number | null = null;
    let targetCashId: number | null = null;
    let targetBankId: number | null = null;

    if (input.fromType === 'KAS') {
      const [c] = await db.select().from(cashAccounts).where(eq(cashAccounts.id, input.fromId));
      if (!c) throw new Error('Kas asal tidak ditemukan');
      sourceCoaId = c.accountId;
      sourceCashId = c.id;
      sourceBal = Number(c.currentBalance);
      sourceDisplayName = `Kas: ${c.name}`;
    } else {
      const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.fromId));
      if (!b) throw new Error('Bank asal tidak ditemukan');
      sourceCoaId = b.accountId;
      sourceBankId = b.id;
      sourceBal = Number(b.currentBalance);
      sourceDisplayName = `Bank: ${b.bankName} (${b.accountNumber})`;
    }

    if (input.toType === 'KAS') {
      const [c] = await db.select().from(cashAccounts).where(eq(cashAccounts.id, input.toId));
      if (!c) throw new Error('Kas tujuan tidak ditemukan');
      targetCoaId = c.accountId;
      targetCashId = c.id;
      targetDisplayName = `Kas: ${c.name}`;
    } else {
      const [b] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, input.toId));
      if (!b) throw new Error('Bank tujuan tidak ditemukan');
      targetCoaId = b.accountId;
      targetBankId = b.id;
      targetDisplayName = `Bank: ${b.bankName} (${b.accountNumber})`;
    }

    const isAutoPost = input.status === 'POSTED' && (user.roleName === 'SUPER_ADMIN' || user.roleName === 'BENDAHARA');

    if (isAutoPost && sourceBal - input.amount < 0 && !input.allowNegativeBalance) {
      throw new Error(
        `Saldo ${sourceDisplayName} tidak mencukupi untuk transfer! Saldo saat ini Rp ${sourceBal.toLocaleString(
          'id-ID'
        )}, Transfer Rp ${input.amount.toLocaleString('id-ID')}.`
      );
    }

    const transactionNumber = await generateTransactionNumber('TRF', input.date);

    const result = await db.transaction(async (tx) => {
      const [newTrx] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          date: input.date,
          type: 'TRANSFER',
          description: input.description || `Transfer dari ${sourceDisplayName} ke ${targetDisplayName}`,
          reference: input.reference || null,
          attachmentUrl: input.attachmentUrl || null,
          totalAmount: input.amount.toFixed(2),
          status: 'DRAFT',
          cashBankType: input.fromType,
          cashAccountId: sourceCashId,
          bankAccountId: sourceBankId,
          toCashBankType: input.toType,
          toCashAccountId: targetCashId,
          toBankAccountId: targetBankId,
          createdById: user.id,
        })
        .returning();

      // Line 1: DEBIT Kas/Bank Tujuan
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: targetCoaId,
        description: `Transfer masuk dari ${sourceDisplayName}`,
        debit: input.amount.toFixed(2),
        credit: '0.00',
        lineNumber: 1,
      });

      // Line 2: KREDIT Kas/Bank Asal
      await tx.insert(transactionLines).values({
        transactionId: newTrx.id,
        accountId: sourceCoaId,
        description: `Transfer keluar ke ${targetDisplayName}`,
        debit: '0.00',
        credit: input.amount.toFixed(2),
        lineNumber: 2,
      });

      if (isAutoPost) {
        await postTransactionInternal(tx, newTrx.id, user, !!input.allowNegativeBalance);
        const [posted] = await tx.select().from(transactions).where(eq(transactions.id, newTrx.id));
        return posted;
      } else if (input.status === 'DIAJUKAN') {
        const [sub] = await tx
          .update(transactions)
          .set({ status: 'DIAJUKAN' })
          .where(eq(transactions.id, newTrx.id))
          .returning();
        return sub;
      }

      return newTrx;
    });

    await createAuditLog(
      user.id,
      user.email,
      isAutoPost ? 'POST' : 'CREATE',
      'TRANSACTION',
      String(result.id),
      `Transfer ${result.transactionNumber} Rp ${input.amount.toLocaleString('id-ID')} (${sourceDisplayName} -> ${targetDisplayName})`
    );

    return result;
  });
}

// 4. JURNAL UMUM (MULTI-LINE / PENYESUAIAN)
export interface CreateJurnalUmumInput {
  date: string;
  description: string;
  reference?: string;
  attachmentUrl?: string;
  unitId?: number | null;
  fundId?: number | null;
  status?: 'DRAFT' | 'DIAJUKAN' | 'POSTED';
  lines: Array<{
    accountId: number;
    description?: string;
    debit: number;
    credit: number;
  }>;
}

export async function createJurnalUmum(input: CreateJurnalUmumInput, user: any) {
  return await executeWithRetry(async () => {
    if (!input.lines || input.lines.length < 2) {
      throw new Error('Jurnal Umum harus memiliki minimal 2 pos akun (Debit dan Kredit)');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const l of input.lines) {
      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(
        `Jurnal TIDAK BALANCE! Total Debit (Rp ${totalDebit.toLocaleString(
          'id-ID'
        )}) tidak sama dengan Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')}).`
      );
    }

    if (totalDebit <= 0) {
      throw new Error('Nilai jurnal harus lebih besar dari 0');
    }

    const transactionNumber = await generateTransactionNumber('JU', input.date);
    const isAutoPost = input.status === 'POSTED' && (user.roleName === 'SUPER_ADMIN' || user.roleName === 'BENDAHARA');

    const result = await db.transaction(async (tx) => {
      const [newTrx] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          date: input.date,
          type: 'JURNAL_UMUM',
          unitId: input.unitId || null,
          fundId: input.fundId || null,
          description: input.description,
          reference: input.reference || null,
          attachmentUrl: input.attachmentUrl || null,
          totalAmount: totalDebit.toFixed(2),
          status: 'DRAFT',
          createdById: user.id,
        })
        .returning();

      for (let i = 0; i < input.lines.length; i++) {
        const l = input.lines[i];
        await tx.insert(transactionLines).values({
          transactionId: newTrx.id,
          accountId: l.accountId,
          description: l.description || input.description,
          debit: Number(l.debit || 0).toFixed(2),
          credit: Number(l.credit || 0).toFixed(2),
          lineNumber: i + 1,
        });
      }

      if (isAutoPost) {
        await postTransactionInternal(tx, newTrx.id, user, false);
        const [posted] = await tx.select().from(transactions).where(eq(transactions.id, newTrx.id));
        return posted;
      } else if (input.status === 'DIAJUKAN') {
        const [sub] = await tx
          .update(transactions)
          .set({ status: 'DIAJUKAN' })
          .where(eq(transactions.id, newTrx.id))
          .returning();
        return sub;
      }

      return newTrx;
    });

    await createAuditLog(
      user.id,
      user.email,
      isAutoPost ? 'POST' : 'CREATE',
      'TRANSACTION',
      String(result.id),
      `Jurnal Umum ${result.transactionNumber} senilai Rp ${totalDebit.toLocaleString('id-ID')} (${result.status})`
    );

    return result;
  });
}

// ---------------- WORKFLOW TRANSITIONS: AJUKAN, SETUJUI, POSTING, VOID/REVERSE ----------------

export async function submitTransaction(transactionId: number, user: any) {
  return await executeWithRetry(async () => {
    const [trx] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.status !== 'DRAFT') throw new Error(`Hanya transaksi berstatus DRAFT yang dapat diajukan (status saat ini: ${trx.status})`);

    const [updated] = await db
      .update(transactions)
      .set({ status: 'DIAJUKAN' })
      .where(eq(transactions.id, transactionId))
      .returning();

    await createAuditLog(user.id, user.email, 'SUBMIT', 'TRANSACTION', String(transactionId), `Pengajuan transaksi ${trx.transactionNumber}`);
    return updated;
  });
}

export async function approveTransaction(transactionId: number, user: any) {
  return await executeWithRetry(async () => {
    if (user.roleName !== 'SUPER_ADMIN' && user.roleName !== 'BENDAHARA' && user.roleName !== 'PIMPINAN') {
      throw new Error('Anda tidak memiliki wewenang untuk menyetujui transaksi');
    }

    const [trx] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
    if (!trx) throw new Error('Transaksi tidak ditemukan');
    if (trx.status !== 'DIAJUKAN') throw new Error(`Hanya transaksi dengan status DIAJUKAN yang dapat disetujui (status saat ini: ${trx.status})`);

    const [updated] = await db
      .update(transactions)
      .set({
        status: 'DISETUJUI',
        approvedById: user.id,
        approvedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    await createAuditLog(user.id, user.email, 'APPROVE', 'TRANSACTION', String(transactionId), `Persetujuan transaksi ${trx.transactionNumber}`);
    return updated;
  });
}

export async function postTransaction(transactionId: number, user: any, allowNegativeBalance = false) {
  return await executeWithRetry(async () => {
    if (user.roleName !== 'SUPER_ADMIN' && user.roleName !== 'BENDAHARA') {
      throw new Error('Hanya Bendahara atau Super Admin yang dapat mem-posting transaksi');
    }

    const journal = await db.transaction(async (tx) => {
      return await postTransactionInternal(tx, transactionId, user, allowNegativeBalance);
    });

    await createAuditLog(
      user.id,
      user.email,
      'POST',
      'TRANSACTION',
      String(transactionId),
      `Posting transaksi #${transactionId} menghasilkan Jurnal ${journal.journalNumber}`
    );

    return journal;
  });
}

async function postTransactionInternal(tx: any, transactionId: number, user: any, allowNegativeBalance: boolean) {
  const [trx] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
  if (!trx) throw new Error('Transaksi tidak ditemukan');
  if (trx.status === 'POSTED') throw new Error('Transaksi sudah diposting');
  if (trx.status === 'REVERSED' || trx.status === 'VOID') throw new Error('Transaksi yang dibatalkan tidak dapat diposting');

  const lines = await tx.select().from(transactionLines).where(eq(transactionLines.transactionId, transactionId));
  if (!lines || lines.length === 0) throw new Error('Transaksi tidak memiliki baris jurnal');

  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of lines) {
    totalDebit += Number(l.debit);
    totalCredit += Number(l.credit);
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new Error(`Double-Entry Error: Jurnal tidak balance! Debit Rp ${totalDebit} != Kredit Rp ${totalCredit}`);
  }

  // Pre-check for negative balance on Cash/Bank accounts if debit < credit (credit reduces balance)
  for (const l of lines) {
    const netChange = Number(l.debit) - Number(l.credit);
    if (netChange < 0 && !allowNegativeBalance) {
      // Check cash accounts
      const [cash] = await tx.select().from(cashAccounts).where(eq(cashAccounts.accountId, l.accountId));
      if (cash && Number(cash.currentBalance) + netChange < 0) {
        throw new Error(
          `Posting Ditolak: Saldo ${cash.name} tidak mencukupi (Saldo Rp ${Number(
            cash.currentBalance
          ).toLocaleString('id-ID')}, Dibutuhkan Rp ${Math.abs(netChange).toLocaleString(
            'id-ID'
          )}). Saldo tidak boleh negatif!`
        );
      }

      // Check bank accounts
      const [bank] = await tx.select().from(bankAccounts).where(eq(bankAccounts.accountId, l.accountId));
      if (bank && Number(bank.currentBalance) + netChange < 0) {
        throw new Error(
          `Posting Ditolak: Saldo ${bank.bankName} (${bank.accountNumber}) tidak mencukupi (Saldo Rp ${Number(
            bank.currentBalance
          ).toLocaleString('id-ID')}, Dibutuhkan Rp ${Math.abs(netChange).toLocaleString(
            'id-ID'
          )}). Saldo tidak boleh negatif!`
        );
      }
    }
  }

  const journalNumber = await generateJournalNumber(trx.date);

  // Insert Journal Header
  const [newJournal] = await tx
    .insert(journals)
    .values({
      journalNumber,
      transactionId: trx.id,
      date: trx.date,
      description: trx.description,
      attachmentUrl: trx.attachmentUrl || null,
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      isBalanced: true,
      status: 'POSTED',
      postedById: user.id,
    })
    .returning();

  // Insert Journal Lines & Update Cash/Bank balances
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    await tx.insert(journalLines).values({
      journalId: newJournal.id,
      accountId: l.accountId,
      unitId: trx.unitId,
      fundId: trx.fundId,
      description: l.description || trx.description,
      debit: l.debit,
      credit: l.credit,
      lineNumber: i + 1,
    });

    const netChange = Number(l.debit) - Number(l.credit);

    // Update cash account balance
    await tx
      .update(cashAccounts)
      .set({
        currentBalance: sql`${cashAccounts.currentBalance} + ${netChange}`,
      })
      .where(eq(cashAccounts.accountId, l.accountId));

    // Update bank account balance
    await tx
      .update(bankAccounts)
      .set({
        currentBalance: sql`${bankAccounts.currentBalance} + ${netChange}`,
      })
      .where(eq(bankAccounts.accountId, l.accountId));
  }

  // Update transaction status to POSTED
  await tx
    .update(transactions)
    .set({
      status: 'POSTED',
      postedById: user.id,
      postedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId));

  return newJournal;
}

// ---------------- REVERSAL / VOID / KOREKSI ----------------
export async function reverseTransaction(transactionId: number, reason: string, user: any) {
  return await executeWithRetry(async () => {
    if (user.roleName !== 'SUPER_ADMIN' && user.roleName !== 'BENDAHARA') {
      throw new Error('Hanya Bendahara atau Super Admin yang dapat membatalkan transaksi');
    }

    const result = await db.transaction(async (tx) => {
      const [trx] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!trx) throw new Error('Transaksi tidak ditemukan');
      if (trx.status !== 'POSTED') {
        throw new Error('Hanya transaksi dengan status POSTED yang dapat dibatalkan melalui mekanisme reversal akuntansi');
      }

      const lines = await tx.select().from(transactionLines).where(eq(transactionLines.transactionId, transactionId));
      const today = new Date().toISOString().split('T')[0];
      const reversalNumber = await generateTransactionNumber('REV', today);
      const reversalJrnNumber = await generateJournalNumber(today);

      // Insert reversal transaction record
      const [revTx] = await tx
        .insert(transactions)
        .values({
          transactionNumber: reversalNumber,
          date: today,
          type: trx.type,
          unitId: trx.unitId,
          fundId: trx.fundId,
          description: `[REVERSAL/PEMBALIKAN] ${trx.transactionNumber}: ${reason}`,
          reference: trx.transactionNumber,
          totalAmount: trx.totalAmount,
          status: 'POSTED',
          reversalOfId: trx.id,
          createdById: user.id,
          postedById: user.id,
          postedAt: new Date(),
        })
        .returning();

      // Inverted journal
      const [revJournal] = await tx
        .insert(journals)
        .values({
          journalNumber: reversalJrnNumber,
          transactionId: revTx.id,
          date: today,
          description: `[REVERSAL] Pembatalan ${trx.transactionNumber}: ${reason}`,
          totalDebit: trx.totalAmount,
          totalCredit: trx.totalAmount,
          isBalanced: true,
          status: 'POSTED',
          postedById: user.id,
        })
        .returning();

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // Invert debit and credit
        const revDebit = l.credit;
        const revCredit = l.debit;

        await tx.insert(transactionLines).values({
          transactionId: revTx.id,
          accountId: l.accountId,
          description: `Pembalikan: ${l.description || trx.description}`,
          debit: revDebit,
          credit: revCredit,
          lineNumber: i + 1,
        });

        await tx.insert(journalLines).values({
          journalId: revJournal.id,
          accountId: l.accountId,
          unitId: trx.unitId,
          fundId: trx.fundId,
          description: `Pembalikan: ${l.description || trx.description}`,
          debit: revDebit,
          credit: revCredit,
          lineNumber: i + 1,
        });

        const netChange = Number(revDebit) - Number(revCredit);

        await tx
          .update(cashAccounts)
          .set({
            currentBalance: sql`${cashAccounts.currentBalance} + ${netChange}`,
          })
          .where(eq(cashAccounts.accountId, l.accountId));

        await tx
          .update(bankAccounts)
          .set({
            currentBalance: sql`${bankAccounts.currentBalance} + ${netChange}`,
          })
          .where(eq(bankAccounts.accountId, l.accountId));
      }

      await tx.update(transactions).set({ status: 'REVERSED' }).where(eq(transactions.id, transactionId));
      await tx.update(journals).set({ status: 'REVERSED' }).where(eq(journals.transactionId, transactionId));

      return { revTx, revJournal };
    });

    await createAuditLog(
      user.id,
      user.email,
      'REVERSE',
      'TRANSACTION',
      String(transactionId),
      `Reversal transaksi #${transactionId} (${result.revJournal.journalNumber}): ${reason}`
    );

    return result;
  });
}

// ---------------- QUERY TRANSACTIONS ----------------

export async function getTransactions(filter?: {
  status?: string;
  type?: string;
  unitId?: number;
  fundId?: number;
  startDate?: string;
  endDate?: string;
}) {
  return await executeWithRetry(async () => {
    const conditions = [];

    if (filter?.status) {
      conditions.push(eq(transactions.status, filter.status));
    }
    if (filter?.type) {
      conditions.push(eq(transactions.type, filter.type));
    }
    if (filter?.unitId) {
      conditions.push(eq(transactions.unitId, filter.unitId));
    }
    if (filter?.fundId) {
      conditions.push(eq(transactions.fundId, filter.fundId));
    }
    if (filter?.startDate) {
      conditions.push(gte(transactions.date, filter.startDate));
    }
    if (filter?.endDate) {
      conditions.push(lte(transactions.date, filter.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const res = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        date: transactions.date,
        type: transactions.type,
        unitId: transactions.unitId,
        fundId: transactions.fundId,
        description: transactions.description,
        recipient: transactions.recipient,
        reference: transactions.reference,
        attachmentUrl: transactions.attachmentUrl,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
        cashBankType: transactions.cashBankType,
        cashAccountId: transactions.cashAccountId,
        bankAccountId: transactions.bankAccountId,
        toCashBankType: transactions.toCashBankType,
        toCashAccountId: transactions.toCashAccountId,
        toBankAccountId: transactions.toBankAccountId,
        reversalOfId: transactions.reversalOfId,
        createdById: transactions.createdById,
        approvedById: transactions.approvedById,
        approvedAt: transactions.approvedAt,
        postedById: transactions.postedById,
        postedAt: transactions.postedAt,
        createdAt: transactions.createdAt,
        unitName: units.name,
        unitCode: units.code,
        fundName: funds.name,
        creatorName: users.displayName,
      })
      .from(transactions)
      .leftJoin(units, eq(transactions.unitId, units.id))
      .leftJoin(funds, eq(transactions.fundId, funds.id))
      .leftJoin(users, eq(transactions.createdById, users.id))
      .where(whereClause)
      .orderBy(desc(transactions.date), desc(transactions.id));

    return res;
  });
}

export async function getTransactionDetails(id: number) {
  return await executeWithRetry(async () => {
    const [trx] = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        date: transactions.date,
        type: transactions.type,
        unitId: transactions.unitId,
        fundId: transactions.fundId,
        description: transactions.description,
        recipient: transactions.recipient,
        reference: transactions.reference,
        attachmentUrl: transactions.attachmentUrl,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
        cashBankType: transactions.cashBankType,
        cashAccountId: transactions.cashAccountId,
        bankAccountId: transactions.bankAccountId,
        toCashBankType: transactions.toCashBankType,
        toCashAccountId: transactions.toCashAccountId,
        toBankAccountId: transactions.toBankAccountId,
        reversalOfId: transactions.reversalOfId,
        createdById: transactions.createdById,
        approvedById: transactions.approvedById,
        approvedAt: transactions.approvedAt,
        postedById: transactions.postedById,
        postedAt: transactions.postedAt,
        createdAt: transactions.createdAt,
        unitName: units.name,
        fundName: funds.name,
        creatorName: users.displayName,
      })
      .from(transactions)
      .leftJoin(units, eq(transactions.unitId, units.id))
      .leftJoin(funds, eq(transactions.fundId, funds.id))
      .leftJoin(users, eq(transactions.createdById, users.id))
      .where(eq(transactions.id, id));

    if (!trx) return null;

    const lines = await db
      .select({
        id: transactionLines.id,
        accountId: transactionLines.accountId,
        description: transactionLines.description,
        debit: transactionLines.debit,
        credit: transactionLines.credit,
        lineNumber: transactionLines.lineNumber,
        accountCode: accounts.code,
        accountName: accounts.name,
        category: accounts.category,
      })
      .from(transactionLines)
      .leftJoin(accounts, eq(transactionLines.accountId, accounts.id))
      .where(eq(transactionLines.transactionId, id))
      .orderBy(transactionLines.lineNumber);

    return { ...trx, lines };
  });
}

// ---------------- BUKU KAS (CASH BOOK) ----------------
export async function getCashBook(
  cashAccountId: number,
  startDate?: string,
  endDate?: string,
  unitId?: number,
  fundId?: number
) {
  return await executeWithRetry(async () => {
    const [cash] = await db.select().from(cashAccounts).where(eq(cashAccounts.id, cashAccountId));
    if (!cash) throw new Error('Kas tunai tidak ditemukan');

    // Initial opening balance: cash.initialBalance plus posted journals prior to startDate
    let openingBal = Number(cash.initialBalance);

    if (startDate) {
      const priorConditions = [
        eq(journalLines.accountId, cash.accountId),
        sql`journals.date < ${startDate}`,
      ];
      if (unitId) priorConditions.push(eq(journalLines.unitId, unitId));
      if (fundId) priorConditions.push(eq(journalLines.fundId, fundId));

      const priorLines = await db
        .select({
          totalDebit: sql<string>`coalesce(sum(journal_lines.debit), 0)`,
          totalCredit: sql<string>`coalesce(sum(journal_lines.credit), 0)`,
        })
        .from(journalLines)
        .innerJoin(journals, and(eq(journalLines.journalId, journals.id), eq(journals.status, 'POSTED')))
        .where(and(...priorConditions));

      const d = Number(priorLines[0]?.totalDebit || 0);
      const c = Number(priorLines[0]?.totalCredit || 0);
      openingBal += d - c;
    }

    const conditions = [
      eq(journalLines.accountId, cash.accountId),
      eq(journals.status, 'POSTED'),
    ];
    if (startDate) conditions.push(gte(journals.date, startDate));
    if (endDate) conditions.push(lte(journals.date, endDate));
    if (unitId) conditions.push(eq(journalLines.unitId, unitId));
    if (fundId) conditions.push(eq(journalLines.fundId, fundId));

    const lines = await db
      .select({
        id: journalLines.id,
        date: journals.date,
        journalNumber: journals.journalNumber,
        description: journalLines.description,
        debit: journalLines.debit,
        credit: journalLines.credit,
        unitName: units.name,
        fundName: funds.name,
      })
      .from(journalLines)
      .innerJoin(journals, eq(journalLines.journalId, journals.id))
      .leftJoin(units, eq(journalLines.unitId, units.id))
      .leftJoin(funds, eq(journalLines.fundId, funds.id))
      .where(and(...conditions))
      .orderBy(journals.date, journals.id, journalLines.lineNumber);

    let cur = openingBal;
    let totalMasuk = 0;
    let totalKeluar = 0;

    const entries = lines.map((l) => {
      const masuk = Number(l.debit);
      const keluar = Number(l.credit);
      cur += masuk - keluar;
      totalMasuk += masuk;
      totalKeluar += keluar;
      return {
        id: l.id,
        date: l.date,
        transactionNumber: l.journalNumber,
        description: l.description || '-',
        penerimaan: masuk,
        pengeluaran: keluar,
        runningBalance: cur,
        unitName: l.unitName,
        fundName: l.fundName,
      };
    });

    return {
      cashAccount: cash,
      openingBalance: openingBal,
      totalPenerimaan: totalMasuk,
      totalPengeluaran: totalKeluar,
      endingBalance: cur,
      entries,
    };
  });
}

// ---------------- BUKU BANK (BANK BOOK) ----------------
export async function getBankBook(
  bankAccountId: number,
  startDate?: string,
  endDate?: string,
  unitId?: number,
  fundId?: number
) {
  return await executeWithRetry(async () => {
    const [bank] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankAccountId));
    if (!bank) throw new Error('Rekening bank tidak ditemukan');

    let openingBal = Number(bank.initialBalance);

    if (startDate) {
      const priorConditions = [
        eq(journalLines.accountId, bank.accountId),
        sql`journals.date < ${startDate}`,
      ];
      if (unitId) priorConditions.push(eq(journalLines.unitId, unitId));
      if (fundId) priorConditions.push(eq(journalLines.fundId, fundId));

      const priorLines = await db
        .select({
          totalDebit: sql<string>`coalesce(sum(journal_lines.debit), 0)`,
          totalCredit: sql<string>`coalesce(sum(journal_lines.credit), 0)`,
        })
        .from(journalLines)
        .innerJoin(journals, and(eq(journalLines.journalId, journals.id), eq(journals.status, 'POSTED')))
        .where(and(...priorConditions));

      const d = Number(priorLines[0]?.totalDebit || 0);
      const c = Number(priorLines[0]?.totalCredit || 0);
      openingBal += d - c;
    }

    const conditions = [
      eq(journalLines.accountId, bank.accountId),
      eq(journals.status, 'POSTED'),
    ];
    if (startDate) conditions.push(gte(journals.date, startDate));
    if (endDate) conditions.push(lte(journals.date, endDate));
    if (unitId) conditions.push(eq(journalLines.unitId, unitId));
    if (fundId) conditions.push(eq(journalLines.fundId, fundId));

    const lines = await db
      .select({
        id: journalLines.id,
        date: journals.date,
        journalNumber: journals.journalNumber,
        trxType: transactions.type,
        description: journalLines.description,
        debit: journalLines.debit,
        credit: journalLines.credit,
        unitName: units.name,
        fundName: funds.name,
      })
      .from(journalLines)
      .innerJoin(journals, eq(journalLines.journalId, journals.id))
      .leftJoin(transactions, eq(journals.transactionId, transactions.id))
      .leftJoin(units, eq(journalLines.unitId, units.id))
      .leftJoin(funds, eq(journalLines.fundId, funds.id))
      .where(and(...conditions))
      .orderBy(journals.date, journals.id, journalLines.lineNumber);

    let cur = openingBal;
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;
    let totalTransferIn = 0;
    let totalTransferOut = 0;

    const entries = lines.map((l) => {
      const d = Number(l.debit);
      const c = Number(l.credit);
      const isTransfer = l.trxType === 'TRANSFER' || l.trxType === 'MUTASI_KAS_BANK';

      let pen = 0;
      let peng = 0;
      let trIn = 0;
      let trOut = 0;

      if (d > 0) {
        if (isTransfer) {
          trIn = d;
          totalTransferIn += d;
        } else {
          pen = d;
          totalPenerimaan += d;
        }
        cur += d;
      } else if (c > 0) {
        if (isTransfer) {
          trOut = c;
          totalTransferOut += c;
        } else {
          peng = c;
          totalPengeluaran += c;
        }
        cur -= c;
      }

      return {
        id: l.id,
        date: l.date,
        transactionNumber: l.journalNumber,
        type: l.trxType || 'JURNAL',
        description: l.description || '-',
        penerimaan: pen,
        pengeluaran: peng,
        transferIn: trIn,
        transferOut: trOut,
        runningBalance: cur,
        unitName: l.unitName,
        fundName: l.fundName,
      };
    });

    return {
      bankAccount: bank,
      openingBalance: openingBal,
      totalPenerimaan,
      totalPengeluaran,
      totalTransferIn,
      totalTransferOut,
      endingBalance: cur,
      entries,
    };
  });
}

// ---------------- JOURNALS & GENERAL LEDGER ----------------
export async function getJournals(filter?: {
  startDate?: string;
  endDate?: string;
}) {
  return await executeWithRetry(async () => {
    const conditions = [];
    if (filter?.startDate) conditions.push(gte(journals.date, filter.startDate));
    if (filter?.endDate) conditions.push(lte(journals.date, filter.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const journalList = await db
      .select({
        id: journals.id,
        journalNumber: journals.journalNumber,
        transactionId: journals.transactionId,
        date: journals.date,
        description: journals.description,
        attachmentUrl: journals.attachmentUrl,
        totalDebit: journals.totalDebit,
        totalCredit: journals.totalCredit,
        isBalanced: journals.isBalanced,
        status: journals.status,
        createdAt: journals.createdAt,
        posterName: users.displayName,
      })
      .from(journals)
      .leftJoin(users, eq(journals.postedById, users.id))
      .where(whereClause)
      .orderBy(desc(journals.date), desc(journals.id));

    const allLines = await db
      .select({
        id: journalLines.id,
        journalId: journalLines.journalId,
        accountId: journalLines.accountId,
        unitId: journalLines.unitId,
        fundId: journalLines.fundId,
        description: journalLines.description,
        debit: journalLines.debit,
        credit: journalLines.credit,
        lineNumber: journalLines.lineNumber,
        accountCode: accounts.code,
        accountName: accounts.name,
        unitName: units.name,
        fundName: funds.name,
      })
      .from(journalLines)
      .leftJoin(accounts, eq(journalLines.accountId, accounts.id))
      .leftJoin(units, eq(journalLines.unitId, units.id))
      .leftJoin(funds, eq(journalLines.fundId, funds.id))
      .orderBy(journalLines.journalId, journalLines.lineNumber);

    const linesByJournalId = new Map<number, any[]>();
    for (const line of allLines) {
      const arr = linesByJournalId.get(line.journalId) || [];
      arr.push(line);
      linesByJournalId.set(line.journalId, arr);
    }

    return journalList.map((j) => ({
      ...j,
      lines: linesByJournalId.get(j.id) || [],
    }));
  });
}

export async function getGeneralLedger(accountId: number, startDate?: string, endDate?: string) {
  return await executeWithRetry(async () => {
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!acc) throw new Error('Akun tidak ditemukan');

    let openingDebit = 0;
    let openingCredit = 0;

    if (startDate) {
      const priorLines = await db
        .select({
          totalDebit: sql<string>`coalesce(sum(journal_lines.debit), 0)`,
          totalCredit: sql<string>`coalesce(sum(journal_lines.credit), 0)`,
        })
        .from(journalLines)
        .innerJoin(journals, and(eq(journalLines.journalId, journals.id), eq(journals.status, 'POSTED')))
        .where(
          and(
            eq(journalLines.accountId, accountId),
            sql`journals.date < ${startDate}`
          )
        );

      openingDebit = Number(priorLines[0]?.totalDebit || 0);
      openingCredit = Number(priorLines[0]?.totalCredit || 0);
    }

    const openingBalance =
      acc.normalBalance === 'DEBIT'
        ? openingDebit - openingCredit
        : openingCredit - openingDebit;

    const conditions = [
      eq(journalLines.accountId, accountId),
      eq(journals.status, 'POSTED'),
    ];
    if (startDate) conditions.push(gte(journals.date, startDate));
    if (endDate) conditions.push(lte(journals.date, endDate));

    const entries = await db
      .select({
        id: journalLines.id,
        date: journals.date,
        journalNumber: journals.journalNumber,
        description: journalLines.description,
        debit: journalLines.debit,
        credit: journalLines.credit,
        unitName: units.name,
        fundName: funds.name,
      })
      .from(journalLines)
      .innerJoin(journals, eq(journalLines.journalId, journals.id))
      .leftJoin(units, eq(journalLines.unitId, units.id))
      .leftJoin(funds, eq(journalLines.fundId, funds.id))
      .where(and(...conditions))
      .orderBy(journals.date, journals.id, journalLines.lineNumber);

    let currentBalance = openingBalance;
    const entriesWithBalance = entries.map((entry) => {
      const d = Number(entry.debit);
      const c = Number(entry.credit);
      if (acc.normalBalance === 'DEBIT') {
        currentBalance += d - c;
      } else {
        currentBalance += c - d;
      }
      return {
        ...entry,
        runningBalance: currentBalance,
      };
    });

    return {
      account: acc,
      openingBalance,
      entries: entriesWithBalance,
      endingBalance: currentBalance,
    };
  });
}

// ---------------- DASHBOARD METRICS WITH FILTERS ----------------

export async function getDashboardMetrics(filter?: {
  month?: number;
  year?: number;
  unitId?: number;
  fundId?: number;
}) {
  return await executeWithRetry(async () => {
    // 1. Saldo Kas Tunai
    const cashRes = await db
      .select({ total: sql<string>`coalesce(sum(current_balance), 0)` })
      .from(cashAccounts)
      .where(eq(cashAccounts.isActive, true));
    const saldoKas = Number(cashRes[0]?.total || 0);

    // 2. Saldo masing-masing bank
    const banks = await db
      .select({
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        balance: sql<number>`current_balance::numeric`,
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.isActive, true))
      .orderBy(bankAccounts.id);

    const saldoBank = banks.reduce((sum, b) => sum + Number(b.balance), 0);
    const totalKasBank = saldoKas + saldoBank;

    // 3. Pendapatan & Beban with date/unit/fund filters
    const journalConditions = [eq(journals.status, 'POSTED')];

    if (filter?.year) {
      journalConditions.push(sql`EXTRACT(YEAR FROM journals.date) = ${filter.year}`);
    } else {
      const curYear = new Date().getFullYear();
      journalConditions.push(sql`EXTRACT(YEAR FROM journals.date) = ${curYear}`);
    }

    if (filter?.month) {
      journalConditions.push(sql`EXTRACT(MONTH FROM journals.date) = ${filter.month}`);
    }

    const lineConditions = [];
    if (filter?.unitId) {
      lineConditions.push(eq(journalLines.unitId, filter.unitId));
    }
    if (filter?.fundId) {
      lineConditions.push(eq(journalLines.fundId, filter.fundId));
    }

    const whereClause = and(...journalConditions, ...lineConditions);

    const categoryTotals = await db
      .select({
        category: accounts.category,
        totalDebit: sql<string>`coalesce(sum(journal_lines.debit), 0)`,
        totalCredit: sql<string>`coalesce(sum(journal_lines.credit), 0)`,
      })
      .from(journalLines)
      .innerJoin(journals, eq(journalLines.journalId, journals.id))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(whereClause)
      .groupBy(accounts.category);

    let totalPendapatan = 0;
    let totalBeban = 0;
    let totalAsetJurnal = 0;

    for (const row of categoryTotals) {
      const d = Number(row.totalDebit);
      const c = Number(row.totalCredit);
      if (row.category === 'PENDAPATAN') {
        totalPendapatan = c - d;
      } else if (row.category === 'BEBAN') {
        totalBeban = d - c;
      } else if (row.category === 'ASET') {
        totalAsetJurnal = d - c;
      }
    }

    const totalAset = Math.max(totalKasBank, totalKasBank + totalAsetJurnal);
    const surplusDefisit = totalPendapatan - totalBeban;

    // 4. 10 Transaksi Terakhir
    const trxConditions = [];
    if (filter?.unitId) trxConditions.push(eq(transactions.unitId, filter.unitId));
    if (filter?.fundId) trxConditions.push(eq(transactions.fundId, filter.fundId));

    const recentTransactions = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        date: transactions.date,
        type: transactions.type,
        description: transactions.description,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
        unitName: units.name,
        fundName: funds.name,
      })
      .from(transactions)
      .leftJoin(units, eq(transactions.unitId, units.id))
      .leftJoin(funds, eq(transactions.fundId, funds.id))
      .where(trxConditions.length > 0 ? and(...trxConditions) : undefined)
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(10);

    const [unitsCount] = await db.select({ count: sql<number>`count(*)` }).from(units);
    const [fundsCount] = await db.select({ count: sql<number>`count(*)` }).from(funds);
    const [accountsCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts);

    return {
      saldoKas,
      saldoBank,
      totalKasBank,
      bankBalances: banks,
      totalAset,
      pendapatan: totalPendapatan,
      beban: totalBeban,
      surplusDefisit,
      recentTransactions,
      counts: {
        units: Number(unitsCount?.count || 0),
        funds: Number(fundsCount?.count || 0),
        accounts: Number(accountsCount?.count || 0),
      },
    };
  });
}

// ---------------- AUDIT LOGS ----------------
export async function getAuditLogs(limit: number = 100) {
  return await executeWithRetry(async () => {
    return await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userEmail: auditLogs.userEmail,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userName: users.displayName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  });
}

// ---------------- PHASE 2 AUTOMATED TEST RUNNER ----------------

export async function runPhase2AutomatedTests(user: any) {
  return await executeWithRetry(async () => {
    const results: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Find Bank A and Bank B
    const allBanks = await db.select().from(bankAccounts).orderBy(bankAccounts.id);
    if (allBanks.length < 2) {
      throw new Error('Pengujian membutuhkan minimal 2 rekening bank (Bank A dan Bank B).');
    }
    const bankA = allBanks[0];
    const bankB = allBanks[1];

    // Find Income account (e.g. Infak 4220 or Donasi 4210)
    const incomeAcc = (await db.select().from(accounts).where(eq(accounts.category, 'PENDAPATAN')))[0];
    // Find Expense account (e.g. Beban Makan/Dapur 5210 or Listrik 5220)
    const expenseAcc = (await db.select().from(accounts).where(eq(accounts.category, 'BEBAN')))[0];

    // ==========================================
    // TEST 1: Penerimaan Rp10.000.000 via Bank A
    // ==========================================
    try {
      const prevBalA = Number(bankA.currentBalance);
      const trx1 = await createPenerimaan(
        {
          date: today,
          incomeAccountId: incomeAcc.id,
          cashBankType: 'BANK',
          cashBankId: bankA.id,
          amount: 10000000,
          description: '[TEST 1] Penerimaan Donasi Bank A',
          status: 'POSTED',
        },
        user
      );

      const [updatedBankA] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankA.id));
      const newBalA = Number(updatedBankA.currentBalance);
      const balanceDiff = newBalA - prevBalA;

      const [jrn1] = await db.select().from(journals).where(eq(journals.transactionId, trx1.id));
      const jrnLines1 = await db.select().from(journalLines).where(eq(journalLines.journalId, jrn1.id));

      const debitLine = jrnLines1.find((l) => Number(l.debit) === 10000000);
      const creditLine = jrnLines1.find((l) => Number(l.credit) === 10000000);

      const pass1 =
        Math.abs(balanceDiff - 10000000) < 0.01 &&
        debitLine?.accountId === bankA.accountId &&
        creditLine?.accountId === incomeAcc.id;

      results.push({
        id: 'TEST_1',
        title: 'Penerimaan Rp10.000.000 melalui Bank A',
        passed: pass1,
        message: pass1
          ? `Lolos: Saldo Bank A bertambah Rp10.000.000, Jurnal Debit Bank A (Rp 10.000.000) & Kredit Pendapatan (Rp 10.000.000) berhasil diposting.`
          : `Gagal: Saldo selisih ${balanceDiff}, Debit ${debitLine?.debit}, Kredit ${creditLine?.credit}`,
        details: { trxNumber: trx1.transactionNumber, journalNumber: jrn1.journalNumber, newBalA },
      });
    } catch (e: any) {
      results.push({ id: 'TEST_1', title: 'Penerimaan Rp10.000.000 melalui Bank A', passed: false, message: e.message });
    }

    // ==========================================
    // TEST 2: Pengeluaran Rp3.000.000 dari Bank A
    // ==========================================
    try {
      const [bankACurrent] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankA.id));
      const prevBalA2 = Number(bankACurrent.currentBalance);

      const trx2 = await createPengeluaran(
        {
          date: today,
          expenseAccountId: expenseAcc.id,
          cashBankType: 'BANK',
          cashBankId: bankA.id,
          recipient: 'Penyedia Bahan Pesantren',
          amount: 3000000,
          description: '[TEST 2] Pengeluaran Operasional Bank A',
          status: 'POSTED',
        },
        user
      );

      const [updatedBankA2] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankA.id));
      const newBalA2 = Number(updatedBankA2.currentBalance);
      const balanceDiff2 = prevBalA2 - newBalA2;

      const [jrn2] = await db.select().from(journals).where(eq(journals.transactionId, trx2.id));
      const jrnLines2 = await db.select().from(journalLines).where(eq(journalLines.journalId, jrn2.id));

      const debitLine2 = jrnLines2.find((l) => Number(l.debit) === 3000000);
      const creditLine2 = jrnLines2.find((l) => Number(l.credit) === 3000000);

      const pass2 =
        Math.abs(balanceDiff2 - 3000000) < 0.01 &&
        debitLine2?.accountId === expenseAcc.id &&
        creditLine2?.accountId === bankA.accountId;

      results.push({
        id: 'TEST_2',
        title: 'Pengeluaran Rp3.000.000 dari Bank A',
        passed: pass2,
        message: pass2
          ? `Lolos: Saldo Bank A berkurang Rp3.000.000, Jurnal Debit Beban (Rp 3.000.000) & Kredit Bank A (Rp 3.000.000) berhasil diposting.`
          : `Gagal: Saldo selisih ${balanceDiff2}, Debit ${debitLine2?.debit}, Kredit ${creditLine2?.credit}`,
        details: { trxNumber: trx2.transactionNumber, journalNumber: jrn2.journalNumber, newBalA2 },
      });
    } catch (e: any) {
      results.push({ id: 'TEST_2', title: 'Pengeluaran Rp3.000.000 dari Bank A', passed: false, message: e.message });
    }

    // ==========================================
    // TEST 3: Transfer Rp2.000.000 dari Bank A ke Bank B
    // ==========================================
    try {
      const [bankACur3] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankA.id));
      const [bankBCur3] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankB.id));
      const prevA3 = Number(bankACur3.currentBalance);
      const prevB3 = Number(bankBCur3.currentBalance);

      const trx3 = await createTransfer(
        {
          date: today,
          fromType: 'BANK',
          fromId: bankA.id,
          toType: 'BANK',
          toId: bankB.id,
          amount: 2000000,
          description: '[TEST 3] Transfer Antar Bank A ke Bank B',
          status: 'POSTED',
        },
        user
      );

      const [upA3] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankA.id));
      const [upB3] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, bankB.id));
      const newA3 = Number(upA3.currentBalance);
      const newB3 = Number(upB3.currentBalance);

      const [jrn3] = await db.select().from(journals).where(eq(journals.transactionId, trx3.id));
      const jrnLines3 = await db.select().from(journalLines).where(eq(journalLines.journalId, jrn3.id));

      const accMap = new Map((await db.select().from(accounts)).map((a) => [a.id, a]));
      let hasRevenueOrExpense = false;
      for (const l of jrnLines3) {
        const cat = accMap.get(l.accountId)?.category;
        if (cat === 'PENDAPATAN' || cat === 'BEBAN') {
          hasRevenueOrExpense = true;
        }
      }

      const pass3 =
        Math.abs(prevA3 - newA3 - 2000000) < 0.01 &&
        Math.abs(newB3 - prevB3 - 2000000) < 0.01 &&
        !hasRevenueOrExpense;

      results.push({
        id: 'TEST_3',
        title: 'Transfer Rp2.000.000 dari Bank A ke Bank B',
        passed: pass3,
        message: pass3
          ? `Lolos: Bank A berkurang Rp2.000.000, Bank B bertambah Rp2.000.000, dan jurnal transfer murni mutasi aset tanpa menyentuh Pendapatan atau Beban.`
          : `Gagal: Selisih Bank A ${prevA3 - newA3}, Selisih Bank B ${newB3 - prevB3}, Menyentuh Pendapatan/Beban: ${hasRevenueOrExpense}`,
        details: { trxNumber: trx3.transactionNumber, journalNumber: jrn3.journalNumber, newA3, newB3 },
      });
    } catch (e: any) {
      results.push({ id: 'TEST_3', title: 'Transfer Rp2.000.000 dari Bank A ke Bank B', passed: false, message: e.message });
    }

    // ==========================================
    // TEST 4: Penolakan Jurnal Tidak Seimbang (Debit Rp5jt, Kredit Rp4jt)
    // ==========================================
    try {
      let rejected = false;
      let rejectMsg = '';

      try {
        await createJurnalUmum(
          {
            date: today,
            description: '[TEST 4] Percobaan Jurnal Tidak Balance',
            status: 'POSTED',
            lines: [
              { accountId: bankA.accountId, debit: 5000000, credit: 0 },
              { accountId: incomeAcc.id, debit: 0, credit: 4000000 },
            ],
          },
          user
        );
      } catch (err: any) {
        rejected = true;
        rejectMsg = err.message;
      }

      results.push({
        id: 'TEST_4',
        title: 'Validasi Penolakan Jurnal Tidak Seimbang (Debit Rp5.000.000 vs Kredit Rp4.000.000)',
        passed: rejected,
        message: rejected
          ? `Lolos: Sistem berhasil mendeteksi dan secara ketat MENOLAK posting jurnal yang tidak seimbang. Pesan sistem: "${rejectMsg}".`
          : `Gagal: Sistem secara keliru mengizinkan posting jurnal yang tidak seimbang!`,
        details: { rejected, rejectMsg },
      });
    } catch (e: any) {
      results.push({ id: 'TEST_4', title: 'Validasi Penolakan Jurnal Tidak Seimbang', passed: false, message: e.message });
    }

    return results;
  });
}
