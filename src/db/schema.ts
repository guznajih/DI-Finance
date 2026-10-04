import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// 1. ROLES
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // SUPER_ADMIN, PIMPINAN, BENDAHARA, PETUGAS_KEUANGAN, UNIT
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. PERMISSIONS
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  permission: varchar('permission', { length: 100 }).notNull(),
});

// 3. UNITS / DIVISI
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. FUNDS / SUMBER DANA
export const funds = pgTable('funds', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // 'terikat', 'tidak_terikat'
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. USERS
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  roleId: integer('role_id').references(() => roles.id),
  unitId: integer('unit_id').references(() => units.id),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
});

// 6. ACCOUNTS (Chart of Accounts)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  category: varchar('category', { length: 30 }).notNull(), // ASET, KEWAJIBAN, DANA, PENDAPATAN, BEBAN
  subCategory: varchar('sub_category', { length: 50 }).notNull(),
  normalBalance: varchar('normal_balance', { length: 10 }).notNull(), // DEBIT, KREDIT
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. CASH ACCOUNTS (Kas Tunai)
export const cashAccounts = pgTable('cash_accounts', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  unitId: integer('unit_id').references(() => units.id),
  initialBalance: numeric('initial_balance', { precision: 15, scale: 2 }).default('0').notNull(),
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 8. BANK ACCOUNTS (Rekening Bank)
export const bankAccounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  accountName: varchar('account_name', { length: 100 }).notNull(),
  bankName: varchar('bank_name', { length: 50 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  initialBalance: numeric('initial_balance', { precision: 15, scale: 2 }).default('0').notNull(),
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. TRANSACTIONS
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(),
  date: date('date').notNull(),
  type: varchar('type', { length: 30 }).notNull(), // PENERIMAAN, PENGELUARAN, TRANSFER, JURNAL_UMUM, MUTASI_KAS_BANK, PENYESUAIAN
  unitId: integer('unit_id').references(() => units.id),
  fundId: integer('fund_id').references(() => funds.id),
  description: text('description').notNull(),
  recipient: varchar('recipient', { length: 150 }), // Penerima dana (pengeluaran)
  reference: text('reference'), // bukti kwitansi / invoice
  attachmentUrl: text('attachment_url'), // file attachment / proof
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, DIAJUKAN, DISETUJUI, POSTED, REVERSED, VOID
  cashBankType: varchar('cash_bank_type', { length: 20 }), // KAS, BANK
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  toCashBankType: varchar('to_cash_bank_type', { length: 20 }), // for TRANSFER
  toCashAccountId: integer('to_cash_account_id').references(() => cashAccounts.id),
  toBankAccountId: integer('to_bank_account_id').references(() => bankAccounts.id),
  reversalOfId: integer('reversal_of_id'),
  createdById: integer('created_by_id').references(() => users.id),
  approvedById: integer('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  postedById: integer('posted_by_id').references(() => users.id),
  postedAt: timestamp('posted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. TRANSACTION LINES
export const transactionLines = pgTable('transaction_lines', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id')
    .references(() => transactions.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  description: text('description'),
  debit: numeric('debit', { precision: 15, scale: 2 }).default('0').notNull(),
  credit: numeric('credit', { precision: 15, scale: 2 }).default('0').notNull(),
  lineNumber: integer('line_number').notNull(),
});

// 11. JOURNALS (Buku Jurnal Umum)
export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  journalNumber: varchar('journal_number', { length: 50 }).notNull().unique(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  date: date('date').notNull(),
  description: text('description').notNull(),
  attachmentUrl: text('attachment_url'),
  totalDebit: numeric('total_debit', { precision: 15, scale: 2 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 15, scale: 2 }).notNull(),
  isBalanced: boolean('is_balanced').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('POSTED').notNull(), // POSTED, REVERSED
  postedById: integer('posted_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. JOURNAL LINES
export const journalLines = pgTable('journal_lines', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .references(() => journals.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  unitId: integer('unit_id').references(() => units.id),
  fundId: integer('fund_id').references(() => funds.id),
  description: text('description'),
  debit: numeric('debit', { precision: 15, scale: 2 }).default('0').notNull(),
  credit: numeric('credit', { precision: 15, scale: 2 }).default('0').notNull(),
  lineNumber: integer('line_number').notNull(),
});

// 13. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  userEmail: varchar('user_email', { length: 150 }),
  action: varchar('action', { length: 50 }).notNull(), // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, POST, REVERSE, APPROVE
  entityType: varchar('entity_type', { length: 50 }).notNull(), // TRANSACTION, JOURNAL, ACCOUNT, UNIT, FUND, USER, CASH_BANK
  entityId: varchar('entity_id', { length: 50 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// RELATIONS
export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(permissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id],
  }),
}));

export const unitsRelations = relations(units, ({ many }) => ({
  users: many(users),
  cashAccounts: many(cashAccounts),
  transactions: many(transactions),
}));

export const fundsRelations = relations(funds, ({ many }) => ({
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  unit: one(units, {
    fields: [users.unitId],
    references: [units.id],
  }),
  createdTransactions: many(transactions, { relationName: 'createdTransactions' }),
  postedTransactions: many(transactions, { relationName: 'postedTransactions' }),
  auditLogs: many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  cashAccounts: many(cashAccounts),
  bankAccounts: many(bankAccounts),
  transactionLines: many(transactionLines),
  journalLines: many(journalLines),
}));

export const cashAccountsRelations = relations(cashAccounts, ({ one }) => ({
  account: one(accounts, {
    fields: [cashAccounts.accountId],
    references: [accounts.id],
  }),
  unit: one(units, {
    fields: [cashAccounts.unitId],
    references: [units.id],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  account: one(accounts, {
    fields: [bankAccounts.accountId],
    references: [accounts.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  unit: one(units, {
    fields: [transactions.unitId],
    references: [units.id],
  }),
  fund: one(funds, {
    fields: [transactions.fundId],
    references: [funds.id],
  }),
  creator: one(users, {
    fields: [transactions.createdById],
    references: [users.id],
    relationName: 'createdTransactions',
  }),
  poster: one(users, {
    fields: [transactions.postedById],
    references: [users.id],
    relationName: 'postedTransactions',
  }),
  lines: many(transactionLines),
  journals: many(journals),
}));

export const transactionLinesRelations = relations(transactionLines, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLines.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [transactionLines.accountId],
    references: [accounts.id],
  }),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  transaction: one(transactions, {
    fields: [journals.transactionId],
    references: [transactions.id],
  }),
  poster: one(users, {
    fields: [journals.postedById],
    references: [users.id],
  }),
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journal: one(journals, {
    fields: [journalLines.journalId],
    references: [journals.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
  unit: one(units, {
    fields: [journalLines.unitId],
    references: [units.id],
  }),
  fund: one(funds, {
    fields: [journalLines.fundId],
    references: [funds.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
