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

// Helper: Log audit trail
export async function createAuditLog(
  userId: number | null,
  userEmail: string | null,
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'REVERSE' | 'APPROVE',
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
    console.error('Failed to write audit log:', err);
  }
}

// ---------------- MASTER DATA: UNITS ----------------
export async function getUnits() {
  try {
    return await db.select().from(units).orderBy(units.code);
  } catch (error) {
    console.error('Error fetching units:', error);
    throw new Error('Gagal mengambil data unit/divisi', { cause: error });
  }
}

export async function createUnit(data: { code: string; name: string; description?: string; isActive?: boolean }, user?: any) {
  try {
    const res = await db.insert(units).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'UNIT', String(res[0].id), `Tambah unit: ${res[0].name} (${res[0].code})`);
    return res[0];
  } catch (error) {
    console.error('Error creating unit:', error);
    throw new Error('Gagal membuat unit/divisi baru', { cause: error });
  }
}

export async function updateUnit(id: number, data: { name?: string; description?: string; isActive?: boolean }, user?: any) {
  try {
    const res = await db.update(units).set(data).where(eq(units.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'UNIT', String(id), `Update unit: ${res[0].name}`);
    return res[0];
  } catch (error) {
    console.error('Error updating unit:', error);
    throw new Error('Gagal memperbarui unit/divisi', { cause: error });
  }
}

// ---------------- MASTER DATA: FUNDS (SUMBER DANA) ----------------
export async function getFunds() {
  try {
    return await db.select().from(funds).orderBy(funds.code);
  } catch (error) {
    console.error('Error fetching funds:', error);
    throw new Error('Gagal mengambil data sumber dana', { cause: error });
  }
}

export async function createFund(data: { code: string; name: string; type: string; description?: string; isActive?: boolean }, user?: any) {
  try {
    const res = await db.insert(funds).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'FUND', String(res[0].id), `Tambah sumber dana: ${res[0].name} (${res[0].code})`);
    return res[0];
  } catch (error) {
    console.error('Error creating fund:', error);
    throw new Error('Gagal membuat sumber dana baru', { cause: error });
  }
}

export async function updateFund(id: number, data: { name?: string; type?: string; description?: string; isActive?: boolean }, user?: any) {
  try {
    const res = await db.update(funds).set(data).where(eq(funds.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'FUND', String(id), `Update sumber dana: ${res[0].name}`);
    return res[0];
  } catch (error) {
    console.error('Error updating fund:', error);
    throw new Error('Gagal memperbarui sumber dana', { cause: error });
  }
}

// ---------------- MASTER DATA: CHART OF ACCOUNTS ----------------
export async function getAccounts() {
  try {
    return await db.select().from(accounts).orderBy(accounts.code);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw new Error('Gagal mengambil data bagan akun (COA)', { cause: error });
  }
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
  try {
    const res = await db.insert(accounts).values(data).returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'ACCOUNT', String(res[0].id), `Tambah akun: [${res[0].code}] ${res[0].name}`);
    return res[0];
  } catch (error) {
    console.error('Error creating account:', error);
    throw new Error('Gagal membuat akun baru', { cause: error });
  }
}

export async function updateAccount(id: number, data: {
  name?: string;
  category?: string;
  subCategory?: string;
  normalBalance?: string;
  description?: string;
  isActive?: boolean;
}, user?: any) {
  try {
    const res = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
    await createAuditLog(user?.id, user?.email, 'UPDATE', 'ACCOUNT', String(id), `Update akun: [${res[0].code}] ${res[0].name}`);
    return res[0];
  } catch (error) {
    console.error('Error updating account:', error);
    throw new Error('Gagal memperbarui akun', { cause: error });
  }
}

// ---------------- MASTER DATA: KAS & BANK ----------------
export async function getCashAccounts() {
  try {
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
  } catch (error) {
    console.error('Error fetching cash accounts:', error);
    throw new Error('Gagal mengambil data rekening kas', { cause: error });
  }
}

export async function createCashAccount(data: {
  accountId: number;
  name: string;
  unitId?: number | null;
  initialBalance: string;
  isActive?: boolean;
}, user?: any) {
  try {
    const res = await db
      .insert(cashAccounts)
      .values({
        ...data,
        currentBalance: data.initialBalance,
      })
      .returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'CASH_BANK', String(res[0].id), `Tambah kas tunai: ${res[0].name}`);
    return res[0];
  } catch (error) {
    console.error('Error creating cash account:', error);
    throw new Error('Gagal membuat rekening kas baru', { cause: error });
  }
}

export async function getBankAccounts() {
  try {
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
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw new Error('Gagal mengambil data rekening bank', { cause: error });
  }
}

export async function createBankAccount(data: {
  accountId: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  initialBalance: string;
  isActive?: boolean;
}, user?: any) {
  try {
    const res = await db
      .insert(bankAccounts)
      .values({
        ...data,
        currentBalance: data.initialBalance,
      })
      .returning();
    await createAuditLog(user?.id, user?.email, 'CREATE', 'CASH_BANK', String(res[0].id), `Tambah rekening bank: ${res[0].bankName} - ${res[0].accountNumber}`);
    return res[0];
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw new Error('Gagal membuat rekening bank baru', { cause: error });
  }
}

// ---------------- TRANSACTIONS & DOUBLE ENTRY ACCOUNTING ----------------

export interface TransactionLineInput {
  accountId: number;
  description?: string;
  debit: number;
  credit: number;
}

export interface CreateTransactionInput {
  date: string; // YYYY-MM-DD
  type: 'PENERIMAAN' | 'PENGELUARAN' | 'MUTASI_KAS_BANK' | 'PENYESUAIAN';
  unitId?: number | null;
  fundId?: number | null;
  description: string;
  reference?: string;
  lines: TransactionLineInput[];
  autoPost?: boolean;
}

export async function createTransaction(input: CreateTransactionInput, user: any) {
  try {
    // 1. Double Entry validation: Total Debit MUST equal Total Credit
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of input.lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }

    // Round to 2 decimal places to prevent float precision issues
    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Double-Entry Error: Jurnal tidak balance! Total Debit (Rp ${totalDebit.toLocaleString('id-ID')}) != Total Kredit (Rp ${totalCredit.toLocaleString('id-ID')})`);
    }

    if (totalDebit <= 0) {
      throw new Error('Nilai transaksi harus lebih besar dari 0');
    }

    const countRes = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const nextNum = Number(countRes[0]?.count || 0) + 1;
    const yearMonth = input.date.replace(/-/g, '').substring(0, 6);
    const transactionNumber = `TRX-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const isAutoPost = input.autoPost && (user.roleName === 'SUPER_ADMIN' || user.roleName === 'BENDAHARA');

    const newTx = await db.transaction(async (tx) => {
      // Insert transaction header as DRAFT initially
      const [insertedTx] = await tx
        .insert(transactions)
        .values({
          transactionNumber,
          date: input.date,
          type: input.type,
          unitId: input.unitId || null,
          fundId: input.fundId || null,
          description: input.description,
          reference: input.reference || null,
          totalAmount: totalDebit.toFixed(2),
          status: 'DRAFT',
          createdById: user.id,
        })
        .returning();

      // Insert transaction lines
      for (let i = 0; i < input.lines.length; i++) {
        const l = input.lines[i];
        await tx.insert(transactionLines).values({
          transactionId: insertedTx.id,
          accountId: l.accountId,
          description: l.description || input.description,
          debit: Number(l.debit || 0).toFixed(2),
          credit: Number(l.credit || 0).toFixed(2),
          lineNumber: i + 1,
        });
      }

      // If posting, generate Journal and update balances
      if (isAutoPost) {
        await postTransactionInternal(tx, insertedTx.id, user);
        const [postedTx] = await tx.select().from(transactions).where(eq(transactions.id, insertedTx.id));
        return postedTx;
      }

      return insertedTx;
    });

    await createAuditLog(
      user.id,
      user.email,
      isAutoPost ? 'POST' : 'CREATE',
      'TRANSACTION',
      String(newTx.id),
      `Transaksi ${newTx.transactionNumber} (${isAutoPost ? 'POSTED' : 'DRAFT'}): ${input.description} senilai Rp ${totalDebit.toLocaleString('id-ID')}`
    );

    return newTx;
  } catch (error: any) {
    console.error('Error in createTransaction:', error);
    throw new Error(error.message || 'Gagal menyimpan transaksi akuntansi', { cause: error });
  }
}

// Internal posting logic shared between autoPost and postTransaction
async function postTransactionInternal(tx: any, transactionId: number, user: any) {
  const [trx] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
  if (!trx) throw new Error('Transaksi tidak ditemukan');
  if (trx.status === 'POSTED') throw new Error('Transaksi sudah diposting');
  if (trx.status === 'REVERSED') throw new Error('Transaksi yang dibatalkan tidak dapat diposting');

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

  const jrnCountRes = await tx.select({ count: sql<number>`count(*)` }).from(journals);
  const nextJrnNum = Number(jrnCountRes[0]?.count || 0) + 1;
  const yearMonth = trx.date.replace(/-/g, '').substring(0, 6);
  const journalNumber = `JRN-${yearMonth}-${String(nextJrnNum).padStart(4, '0')}`;

  // Insert Journal header
  const [newJournal] = await tx
    .insert(journals)
    .values({
      journalNumber,
      transactionId: trx.id,
      date: trx.date,
      description: trx.description,
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
      description: l.description,
      debit: l.debit,
      credit: l.credit,
      lineNumber: i + 1,
    });

    const netChange = Number(l.debit) - Number(l.credit);

    // Update cash account if this accountId is mapped
    await tx
      .update(cashAccounts)
      .set({
        currentBalance: sql`${cashAccounts.currentBalance} + ${netChange}`,
      })
      .where(eq(cashAccounts.accountId, l.accountId));

    // Update bank account if this accountId is mapped
    await tx
      .update(bankAccounts)
      .set({
        currentBalance: sql`${bankAccounts.currentBalance} + ${netChange}`,
      })
      .where(eq(bankAccounts.accountId, l.accountId));
  }

  // Update transaction status
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

export async function postTransaction(transactionId: number, user: any) {
  try {
    const newJournal = await db.transaction(async (tx) => {
      return await postTransactionInternal(tx, transactionId, user);
    });

    await createAuditLog(
      user.id,
      user.email,
      'POST',
      'TRANSACTION',
      String(transactionId),
      `Posting transaksi akuntansi ID #${transactionId} menghasilkan Jurnal ${newJournal.journalNumber}`
    );

    return newJournal;
  } catch (error: any) {
    console.error('Error posting transaction:', error);
    throw new Error(error.message || 'Gagal mem-posting transaksi', { cause: error });
  }
}

// Reversal / Koreksi Transaksi (No permanent deletion!)
export async function reverseTransaction(transactionId: number, reason: string, user: any) {
  try {
    const result = await db.transaction(async (tx) => {
      const [trx] = await tx.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!trx) throw new Error('Transaksi tidak ditemukan');
      if (trx.status !== 'POSTED') throw new Error('Hanya transaksi dengan status POSTED yang dapat dibatalkan/dikoreksi');

      const lines = await tx.select().from(transactionLines).where(eq(transactionLines.transactionId, transactionId));

      const countRes = await tx.select({ count: sql<number>`count(*)` }).from(transactions);
      const nextNum = Number(countRes[0]?.count || 0) + 1;
      const today = new Date().toISOString().split('T')[0];
      const yearMonth = today.replace(/-/g, '').substring(0, 6);
      const reversalNumber = `TRX-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

      // Insert reversal transaction
      const [revTx] = await tx
        .insert(transactions)
        .values({
          transactionNumber: reversalNumber,
          date: today,
          type: trx.type,
          unitId: trx.unitId,
          fundId: trx.fundId,
          description: `[KOREKSI/PEMBALIKAN] ${trx.transactionNumber}: ${reason}`,
          reference: trx.transactionNumber,
          totalAmount: trx.totalAmount,
          status: 'POSTED',
          reversalOfId: trx.id,
          createdById: user.id,
          postedById: user.id,
          postedAt: new Date(),
        })
        .returning();

      // Inverted lines: debit becomes credit, credit becomes debit
      const jrnCountRes = await tx.select({ count: sql<number>`count(*)` }).from(journals);
      const nextJrnNum = Number(jrnCountRes[0]?.count || 0) + 1;
      const reversalJrnNumber = `JRN-${yearMonth}-${String(nextJrnNum).padStart(4, '0')}`;

      const [revJournal] = await tx
        .insert(journals)
        .values({
          journalNumber: reversalJrnNumber,
          transactionId: revTx.id,
          date: today,
          description: `[KOREKSI/PEMBALIKAN] Jurnal untuk ${trx.transactionNumber}: ${reason}`,
          totalDebit: trx.totalAmount,
          totalCredit: trx.totalAmount,
          isBalanced: true,
          status: 'POSTED',
          postedById: user.id,
        })
        .returning();

      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // Swapping debit and credit
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

        // Revert Cash/Bank balances
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

      // Mark original transaction and associated journals as REVERSED
      await tx
        .update(transactions)
        .set({ status: 'REVERSED' })
        .where(eq(transactions.id, transactionId));

      await tx
        .update(journals)
        .set({ status: 'REVERSED' })
        .where(eq(journals.transactionId, transactionId));

      return { revTx, revJournal };
    });

    await createAuditLog(
      user.id,
      user.email,
      'REVERSE',
      'TRANSACTION',
      String(transactionId),
      `Koreksi/Pembalikan transaksi #${transactionId} dengan jurnal pembalik ${result.revJournal.journalNumber}. Alasan: ${reason}`
    );

    return result;
  } catch (error: any) {
    console.error('Error reversing transaction:', error);
    throw new Error(error.message || 'Gagal membatalkan transaksi', { cause: error });
  }
}

// Query Transactions with filtering
export async function getTransactions(filter?: {
  status?: string;
  type?: string;
  unitId?: number;
  fundId?: number;
  startDate?: string;
  endDate?: string;
}) {
  try {
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
        reference: transactions.reference,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
        reversalOfId: transactions.reversalOfId,
        createdById: transactions.createdById,
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
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Gagal mengambil data transaksi', { cause: error });
  }
}

export async function getTransactionDetails(id: number) {
  try {
    const [trx] = await db
      .select({
        id: transactions.id,
        transactionNumber: transactions.transactionNumber,
        date: transactions.date,
        type: transactions.type,
        unitId: transactions.unitId,
        fundId: transactions.fundId,
        description: transactions.description,
        reference: transactions.reference,
        totalAmount: transactions.totalAmount,
        status: transactions.status,
        reversalOfId: transactions.reversalOfId,
        createdById: transactions.createdById,
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
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw new Error('Gagal mengambil detail transaksi', { cause: error });
  }
}

// ---------------- JOURNALS & GENERAL LEDGER (BUKU BESAR) ----------------
export async function getJournals(filter?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
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

    // Fetch lines for these journals
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

    // Group lines by journalId
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
  } catch (error) {
    console.error('Error fetching journals:', error);
    throw new Error('Gagal mengambil daftar jurnal umum', { cause: error });
  }
}

// Buku Besar (General Ledger) for a specific account
export async function getGeneralLedger(accountId: number, startDate?: string, endDate?: string) {
  try {
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!acc) throw new Error('Akun tidak ditemukan');

    // Calculate opening balance before startDate
    let openingDebit = 0;
    let openingCredit = 0;

    if (startDate) {
      const priorLines = await db
        .select({
          totalDebit: sql<string>`sum(journal_lines.debit)`,
          totalCredit: sql<string>`sum(journal_lines.credit)`,
        })
        .from(journalLines)
        .innerJoin(journals, eq(journalLines.journalId, journals.id))
        .where(
          and(
            eq(journalLines.accountId, accountId),
            eq(journals.status, 'POSTED'),
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

    // Fetch entries in period
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

    // Compute running balance
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
  } catch (error) {
    console.error('Error fetching general ledger:', error);
    throw new Error('Gagal mengambil Buku Besar', { cause: error });
  }
}

// ---------------- DASHBOARD METRICS ----------------
export async function getDashboardMetrics() {
  try {
    // 1. Saldo Kas
    const cashRes = await db
      .select({ total: sql<string>`coalesce(sum(current_balance), 0)` })
      .from(cashAccounts)
      .where(eq(cashAccounts.isActive, true));
    const saldoKas = Number(cashRes[0]?.total || 0);

    // 2. Saldo Bank
    const bankRes = await db
      .select({ total: sql<string>`coalesce(sum(current_balance), 0)` })
      .from(bankAccounts)
      .where(eq(bankAccounts.isActive, true));
    const saldoBank = Number(bankRes[0]?.total || 0);

    // 3. Total Aset, Pendapatan, Beban from journal_lines of POSTED journals
    const categoryTotals = await db
      .select({
        category: accounts.category,
        totalDebit: sql<string>`coalesce(sum(journal_lines.debit), 0)`,
        totalCredit: sql<string>`coalesce(sum(journal_lines.credit), 0)`,
      })
      .from(journalLines)
      .innerJoin(journals, and(eq(journalLines.journalId, journals.id), eq(journals.status, 'POSTED')))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
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

    // Total Aset combines active cash, active bank, plus fixed assets or journal balances
    // Ensure totalAset is at least cash + bank
    const totalAset = Math.max(saldoKas + saldoBank, saldoKas + saldoBank + totalAsetJurnal);
    const surplusDefisit = totalPendapatan - totalBeban;

    // 4. Recent transactions
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
      .orderBy(desc(transactions.date), desc(transactions.id))
      .limit(6);

    // 5. Total Units and Funds count
    const [unitsCount] = await db.select({ count: sql<number>`count(*)` }).from(units);
    const [fundsCount] = await db.select({ count: sql<number>`count(*)` }).from(funds);
    const [accountsCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts);

    return {
      saldoKas,
      saldoBank,
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
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw new Error('Gagal mengambil metrik dashboard', { cause: error });
  }
}

// ---------------- AUDIT LOGS ----------------
export async function getAuditLogs(limit: number = 100) {
  try {
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
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw new Error('Gagal mengambil riwayat audit', { cause: error });
  }
}
