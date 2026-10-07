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
  adminFee: numeric('admin_fee', { precision: 15, scale: 2 }).default('0'),
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
  entityType: varchar('entity_type', { length: 50 }).notNull(), // TRANSACTION, JOURNAL, ACCOUNT, UNIT, FUND, USER, CASH_BANK, SPP_REKAP, RECONCILIATION
  entityId: varchar('entity_id', { length: 50 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. SPP REKAP PENERIMAAN (FASE 3: Agregat dari Aplikasi Eksternal)
export const sppRekap = pgTable('spp_rekap', {
  id: serial('id').primaryKey(),
  rekapNumber: varchar('rekap_number', { length: 50 }).notNull().unique(), // SPP-YYYYMM-XXXX
  date: date('date').notNull(),
  period: varchar('period', { length: 50 }).notNull(), // Contoh: 'September 2026'
  academicYear: varchar('academic_year', { length: 20 }).notNull(), // Contoh: '2026/2027'
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  cashBankType: varchar('cash_bank_type', { length: 20 }).default('BANK').notNull(), // KAS, BANK
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  paymentCount: integer('payment_count').default(0), // Jumlah transaksi santri eksternal (opsional)
  dataSource: varchar('data_source', { length: 100 }).default('Aplikasi SPP Eksternal').notNull(),
  reference: text('reference'), // No. Ref / Bukti Batch Eksternal
  description: text('description'),
  attachmentUrl: text('attachment_url'),
  status: varchar('status', { length: 20 }).default('POSTED').notNull(), // DRAFT, POSTED, REVERSED, VOID
  reconciliationStatus: varchar('reconciliation_status', { length: 30 })
    .default('BELUM_REKONSILIASI')
    .notNull(), // BELUM_REKONSILIASI, SUDAH_REKONSILIASI, PERLU_PEMERIKSAAN
  reconciledAmount: numeric('reconciled_amount', { precision: 15, scale: 2 }),
  reconciledDifference: numeric('reconciled_difference', { precision: 15, scale: 2 }),
  reconciledNotes: text('reconciled_notes'),
  reconciledAt: timestamp('reconciled_at'),
  reconciledById: integer('reconciled_by_id').references(() => users.id),
  transactionId: integer('transaction_id').references(() => transactions.id),
  journalId: integer('journal_id').references(() => journals.id),
  createdById: integer('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. SPP RECONCILIATIONS (Riwayat & Pencocokan Rekonsiliasi Bank vs SPP)
export const sppReconciliations = pgTable('spp_reconciliations', {
  id: serial('id').primaryKey(),
  sppRekapId: integer('spp_rekap_id')
    .references(() => sppRekap.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 30 }).notNull(), // SUDAH_REKONSILIASI, SELISIH, PERLU_PEMERIKSAAN
  externalAmount: numeric('external_amount', { precision: 15, scale: 2 }).notNull(), // Rekap Aplikasi SPP
  bankAmount: numeric('bank_amount', { precision: 15, scale: 2 }).notNull(), // Rekening Bank
  systemAmount: numeric('system_amount', { precision: 15, scale: 2 }).notNull(), // Pencatatan Finance
  difference: numeric('difference', { precision: 15, scale: 2 }).default('0').notNull(),
  matchStatus: varchar('match_status', { length: 30 }).notNull(), // SESUAI, SELISIH
  notes: text('notes'),
  reconciledById: integer('reconciled_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// =========================================================================
// FASE 4: ANGGARAN, PENGAJUAN DANA, APPROVAL, PENCAIRAN, DAN LPJ
// =========================================================================

// 16. ANGGARAN (Budgets)
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  budgetCode: varchar('budget_code', { length: 50 }).notNull().unique(), // ANG-2026-MDR-01
  fiscalYear: varchar('fiscal_year', { length: 20 }).notNull(), // '2026' atau '2026/2027'
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  fundId: integer('fund_id').references(() => funds.id),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  realizedAmount: numeric('realized_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT, DIAJUKAN, DISETUJUI, AKTIF, NONAKTIF
  createdById: integer('created_by_id').references(() => users.id),
  approvedById: integer('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 17. PENGAJUAN DANA (Fund Requests)
export const fundRequests = pgTable('fund_requests', {
  id: serial('id').primaryKey(),
  requestNumber: varchar('request_number', { length: 50 }).notNull().unique(), // REQ-YYYYMM-XXXX
  date: date('date').notNull(),
  requesterId: integer('requester_id')
    .references(() => users.id)
    .notNull(),
  requesterName: varchar('requester_name', { length: 150 }).notNull(),
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  fundId: integer('fund_id').references(() => funds.id),
  accountId: integer('account_id')
    .references(() => accounts.id)
    .notNull(),
  budgetId: integer('budget_id').references(() => budgets.id),
  purpose: text('purpose').notNull(), // Keperluan
  amountRequested: numeric('amount_requested', { precision: 15, scale: 2 }).notNull(),
  amountApproved: numeric('amount_approved', { precision: 15, scale: 2 }),
  amountDisbursed: numeric('amount_disbursed', { precision: 15, scale: 2 }).default('0.00').notNull(),
  itemsDetail: text('items_detail'), // Rincian kebutuhan (JSON array teks)
  attachmentUrl: text('attachment_url'),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT, DIAJUKAN, DIPERIKSA, DISETUJUI, DITOLAK, DICAIRKAN, SELESAI
  examinedById: integer('examined_by_id').references(() => users.id),
  examinedAt: timestamp('examined_at'),
  examinationNotes: text('examination_notes'),
  approvedById: integer('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  approvalNotes: text('approval_notes'),
  rejectedById: integer('rejected_by_id').references(() => users.id),
  rejectedAt: timestamp('rejected_at'),
  rejectedReason: text('rejected_reason'),
  lpjStatus: varchar('lpj_status', { length: 30 }).default('BELUM_LPJ').notNull(), // BELUM_LPJ, LPJ_DIBUAT, DIAJUKAN, DIPERIKSA, DISETUJUI, SELESAI, PERLU_PERBAIKAN
  allowOverBudget: boolean('allow_over_budget').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 18. PENCAIRAN DANA (Fund Disbursements)
export const fundDisbursements = pgTable('fund_disbursements', {
  id: serial('id').primaryKey(),
  disbursementNumber: varchar('disbursement_number', { length: 50 }).notNull().unique(), // DISB-YYYYMM-XXXX
  requestId: integer('request_id')
    .references(() => fundRequests.id)
    .notNull(),
  disbursementDate: date('disbursement_date').notNull(),
  recipientName: varchar('recipient_name', { length: 150 }).notNull(),
  cashBankType: varchar('cash_bank_type', { length: 10 }).notNull(), // KAS, BANK
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  transactionId: integer('transaction_id').references(() => transactions.id),
  journalId: integer('journal_id').references(() => journals.id),
  createdById: integer('created_by_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 19. LPJ RECORDS (Laporan Pertanggungjawaban Dana)
export const lpjRecords = pgTable('lpj_records', {
  id: serial('id').primaryKey(),
  lpjNumber: varchar('lpj_number', { length: 50 }).notNull().unique(), // LPJ-YYYYMM-XXXX
  requestId: integer('request_id')
    .references(() => fundRequests.id)
    .notNull(),
  disbursementId: integer('disbursement_id').references(() => fundDisbursements.id),
  unitId: integer('unit_id')
    .references(() => units.id)
    .notNull(),
  requesterId: integer('requester_id')
    .references(() => users.id)
    .notNull(),
  amountReceived: numeric('amount_received', { precision: 15, scale: 2 }).notNull(),
  totalSpent: numeric('total_spent', { precision: 15, scale: 2 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(), // amountReceived - totalSpent
  notes: text('notes'),
  attachmentUrl: text('attachment_url'),
  status: varchar('status', { length: 30 }).default('LPJ_DIBUAT').notNull(), // LPJ_DIBUAT, DIAJUKAN, DIPERIKSA, DISETUJUI, SELESAI, PERLU_PERBAIKAN
  examinerNotes: text('examiner_notes'),
  examinedById: integer('examined_by_id').references(() => users.id),
  examinedAt: timestamp('examined_at'),
  approvedById: integer('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  refundStatus: varchar('refund_status', { length: 30 }).default('TIDAK_ADA_SISA').notNull(), // TIDAK_ADA_SISA, MENUNGGU_PENGEMBALIAN, SUDAH_DIKEMBALIKAN
  refundTransactionId: integer('refund_transaction_id').references(() => transactions.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 20. LPJ ITEMS (Rincian Bukti Pengeluaran LPJ)
export const lpjItems = pgTable('lpj_items', {
  id: serial('id').primaryKey(),
  lpjId: integer('lpj_id')
    .references(() => lpjRecords.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  description: text('description').notNull(),
  accountId: integer('account_id').references(() => accounts.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 21. FUND REFUNDS (Pengembalian Sisa Dana ke Kas/Bank)
export const fundRefunds = pgTable('fund_refunds', {
  id: serial('id').primaryKey(),
  refundNumber: varchar('refund_number', { length: 50 }).notNull().unique(), // REFUND-YYYYMM-XXXX
  lpjId: integer('lpj_id')
    .references(() => lpjRecords.id)
    .notNull(),
  requestId: integer('request_id')
    .references(() => fundRequests.id)
    .notNull(),
  refundDate: date('refund_date').notNull(),
  cashBankType: varchar('cash_bank_type', { length: 10 }).notNull(), // KAS, BANK
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  transactionId: integer('transaction_id').references(() => transactions.id),
  journalId: integer('journal_id').references(() => journals.id),
  createdById: integer('created_by_id')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 22. INVESTMENTS (Master Data Investasi Pesantren)
export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  investmentNumber: varchar('investment_number', { length: 50 }).notNull().unique(), // INV-YYYYMM-XXXX
  investeeName: varchar('investee_name', { length: 255 }).notNull(), // Nama Lembaga / Mitra / Perusahaan
  investmentType: varchar('investment_type', { length: 50 }).notNull(), // BAGI_HASIL, PENYERTAAN_MODAL, DEPOSITO, LAINNYA
  placementDate: date('placement_date').notNull(),
  startDate: date('start_date').notNull(),
  dueDate: date('due_date'),
  initialCapital: numeric('initial_capital', { precision: 15, scale: 2 }).notNull(), // Modal awal
  currentValue: numeric('current_value', { precision: 15, scale: 2 }).notNull(), // Nilai modal berjalan
  totalReturnProfit: numeric('total_return_profit', { precision: 15, scale: 2 }).default('0').notNull(), // Total bagi hasil diterima
  totalCapitalReturned: numeric('total_capital_returned', { precision: 15, scale: 2 }).default('0').notNull(), // Total modal dikembalikan
  totalValuationAdjustment: numeric('total_valuation_adjustment', { precision: 15, scale: 2 }).default('0').notNull(), // Penyesuaian nilai / kerugian
  fundId: integer('fund_id').references(() => funds.id).notNull(), // Sumber dana
  unitId: integer('unit_id').references(() => units.id), // Unit penanggung jawab
  investmentAccountId: integer('investment_account_id').references(() => accounts.id).notNull(), // Default: 1150 (Aset Investasi)
  sourceCashAccountId: integer('source_cash_account_id').references(() => cashAccounts.id),
  sourceBankAccountId: integer('source_bank_account_id').references(() => bankAccounts.id),
  investmentScheme: text('investment_scheme'), // Mudharabah, Musyarakah, Saham, Deposito Syariah, dll.
  profitSharingPercentage: numeric('profit_sharing_percentage', { precision: 5, scale: 2 }), // % bagi hasil jika ada
  profitPaymentSchedule: varchar('profit_payment_schedule', { length: 50 }), // BULANAN, TRIWULAN, SEMESTER, TAHUNAN, AKHIR_KONTRAK
  targetReturnEstimate: numeric('target_return_estimate', { precision: 15, scale: 2 }), // Target estimasi imbal hasil (Rp)
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT, SUBMITTED, APPROVED, ACTIVE, MATURED, COMPLETED, PROBLEMATIC, CANCELLED
  picName: varchar('pic_name', { length: 150 }).notNull(),
  picContact: varchar('pic_contact', { length: 100 }),
  notes: text('notes'),
  contractUrl: text('contract_url'),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  approvedById: integer('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 23. INVESTMENT TRANSACTIONS (Mutasi Transaksi Penempatan, Bagi Hasil, Pengembalian Modal, Penyesuaian Nilai)
export const investmentTransactions = pgTable('investment_transactions', {
  id: serial('id').primaryKey(),
  transactionNumber: varchar('transaction_number', { length: 50 }).notNull().unique(), // INVTX-YYYYMM-XXXX
  investmentId: integer('investment_id').references(() => investments.id).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // PENEMPATAN, BAGI_HASIL, PENGEMBALIAN_MODAL, PENYESUAIAN_NILAI
  date: date('date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  cashBankType: varchar('cash_bank_type', { length: 10 }).notNull(), // KAS, BANK, NON_CASH (untuk penyesuaian nilai)
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  revenueAccountId: integer('revenue_account_id').references(() => accounts.id), // Default 4320 jika type=BAGI_HASIL
  lossAccountId: integer('loss_account_id').references(() => accounts.id), // Default 5920 jika type=PENYESUAIAN_NILAI (kerugian)
  period: varchar('period', { length: 100 }), // Periode bagi hasil (cth: "Januari 2026", "Kuartal 1 2026")
  reference: varchar('reference', { length: 100 }),
  description: text('description').notNull(),
  attachmentUrl: text('attachment_url'),
  status: varchar('status', { length: 20 }).default('POSTED').notNull(), // POSTED, REVERSED
  transactionId: integer('transaction_id').references(() => transactions.id),
  journalId: integer('journal_id').references(() => journals.id),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 24. INVESTMENT RECONCILIATIONS (Rekonsiliasi Nilai Sistem vs Investee)
export const investmentReconciliations = pgTable('investment_reconciliations', {
  id: serial('id').primaryKey(),
  reconciliationNumber: varchar('reconciliation_number', { length: 50 }).notNull().unique(), // INVREC-YYYYMM-XXXX
  investmentId: integer('investment_id').references(() => investments.id).notNull(),
  asOfDate: date('as_of_date').notNull(),
  systemBookValue: numeric('system_book_value', { precision: 15, scale: 2 }).notNull(),
  investeeReportedValue: numeric('investee_reported_value', { precision: 15, scale: 2 }).notNull(),
  expectedProfitSharing: numeric('expected_profit_sharing', { precision: 15, scale: 2 }).default('0').notNull(),
  actualProfitReceived: numeric('actual_profit_received', { precision: 15, scale: 2 }).default('0').notNull(),
  capitalReturned: numeric('capital_returned', { precision: 15, scale: 2 }).default('0').notNull(),
  difference: numeric('difference', { precision: 15, scale: 2 }).notNull(), // investeeReportedValue - systemBookValue
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // MATCHED, VARIANCE, PENDING, NEEDS_REVIEW
  notes: text('notes'),
  attachmentUrl: text('attachment_url'),
  reconciledById: integer('reconciled_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 25. INVESTMENT DOCUMENTS (Dokumen & Berkas Investasi)
export const investmentDocuments = pgTable('investment_documents', {
  id: serial('id').primaryKey(),
  investmentId: integer('investment_id').references(() => investments.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // PERJANJIAN, BUKTI_TRANSFER, LAPORAN_KEUANGAN_MITRA, BUKTI_BAGI_HASIL, BUKTI_PENGEMBALIAN, LAINNYA
  title: varchar('title', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  notes: text('notes'),
  uploadedById: integer('uploaded_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 26. CASH & BANK RECONCILIATIONS (Rekonsiliasi Kas dan Bank)
export const cashBankReconciliations = pgTable('cash_bank_reconciliations', {
  id: serial('id').primaryKey(),
  reconciliationNumber: varchar('reconciliation_number', { length: 50 }).notNull().unique(), // REC-YYYYMM-XXXX
  accountType: varchar('account_type', { length: 10 }).notNull(), // KAS, BANK
  cashAccountId: integer('cash_account_id').references(() => cashAccounts.id),
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  reconciliationDate: date('reconciliation_date').notNull(),
  systemBalance: numeric('system_balance', { precision: 15, scale: 2 }).notNull(),
  statementBalance: numeric('statement_balance', { precision: 15, scale: 2 }).notNull(), // Saldo bank / rekening koran / fisik
  difference: numeric('difference', { precision: 15, scale: 2 }).notNull(), // statementBalance - systemBalance
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // MATCHED, VARIANCE, NEEDS_REVIEW
  notes: text('notes'),
  attachmentUrl: text('attachment_url'),
  reconciledById: integer('reconciled_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 27. TRANSACTION CATEGORIES (Master Kategori Transaksi)
export const transactionCategories = pgTable('transaction_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // PENERIMAAN, PENGELUARAN, TRANSFER, INVESTASI, PENGEMBALIAN_INVESTASI, PENDAPATAN_INVESTASI, PENYESUAIAN, LAINNYA
  defaultAccountId: integer('default_account_id').references(() => accounts.id),
  description: text('description'),
  warningNotice: text('warning_notice'), // Pencegahan salah klasifikasi
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 28. ACCOUNTING RULES / TRANSACTION TEMPLATES (Database Aturan Akuntansi)
export const accountingRules = pgTable('accounting_rules', {
  id: serial('id').primaryKey(),
  ruleCode: varchar('rule_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  transactionType: varchar('transaction_type', { length: 50 }).notNull(),
  categoryId: integer('category_id').references(() => transactionCategories.id),
  debitAccountId: integer('debit_account_id').references(() => accounts.id),
  creditAccountId: integer('credit_account_id').references(() => accounts.id),
  debitRuleType: varchar('debit_rule_type', { length: 50 }).default('FIXED_ACCOUNT').notNull(), // FIXED_ACCOUNT, SELECTED_CASH_BANK, TARGET_CASH_BANK, INVESTMENT_ACCOUNT
  creditRuleType: varchar('credit_rule_type', { length: 50 }).default('FIXED_ACCOUNT').notNull(), // FIXED_ACCOUNT, SELECTED_CASH_BANK, SOURCE_CASH_BANK, INVESTMENT_ACCOUNT
  debitExplanation: text('debit_explanation').notNull(),
  creditExplanation: text('credit_explanation').notNull(),
  summaryExplanation: text('summary_explanation').notNull(),
  warningNotice: text('warning_notice'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 29. TRANSACTION CORRECTIONS (Audit Trail & Log Koreksi Transaksi: VOID, REVERSAL, CORRECTION)
export const transactionCorrections = pgTable('transaction_corrections', {
  id: serial('id').primaryKey(),
  originalTransactionId: integer('original_transaction_id').references(() => transactions.id).notNull(),
  correctionType: varchar('correction_type', { length: 20 }).notNull(), // VOID, REVERSAL, CORRECTION
  reason: text('reason').notNull(),
  correctedTransactionId: integer('corrected_transaction_id').references(() => transactions.id),
  reversedJournalId: integer('reversed_journal_id').references(() => journals.id),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
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
  sppRekaps: many(sppRekap),
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
  createdSppRekaps: many(sppRekap, { relationName: 'createdSppRekaps' }),
  auditLogs: many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  cashAccounts: many(cashAccounts),
  bankAccounts: many(bankAccounts),
  transactionLines: many(transactionLines),
  journalLines: many(journalLines),
}));

export const cashAccountsRelations = relations(cashAccounts, ({ one, many }) => ({
  account: one(accounts, {
    fields: [cashAccounts.accountId],
    references: [accounts.id],
  }),
  unit: one(units, {
    fields: [cashAccounts.unitId],
    references: [units.id],
  }),
  sppRekaps: many(sppRekap),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  account: one(accounts, {
    fields: [bankAccounts.accountId],
    references: [accounts.id],
  }),
  sppRekaps: many(sppRekap),
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
  sppRekap: one(sppRekap, {
    fields: [transactions.id],
    references: [sppRekap.transactionId],
  }),
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

export const sppRekapRelations = relations(sppRekap, ({ one, many }) => ({
  unit: one(units, {
    fields: [sppRekap.unitId],
    references: [units.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [sppRekap.cashAccountId],
    references: [cashAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [sppRekap.bankAccountId],
    references: [bankAccounts.id],
  }),
  transaction: one(transactions, {
    fields: [sppRekap.transactionId],
    references: [transactions.id],
  }),
  journal: one(journals, {
    fields: [sppRekap.journalId],
    references: [journals.id],
  }),
  creator: one(users, {
    fields: [sppRekap.createdById],
    references: [users.id],
    relationName: 'createdSppRekaps',
  }),
  reconciler: one(users, {
    fields: [sppRekap.reconciledById],
    references: [users.id],
  }),
  reconciliations: many(sppReconciliations),
}));

export const sppReconciliationsRelations = relations(sppReconciliations, ({ one }) => ({
  sppRekap: one(sppRekap, {
    fields: [sppReconciliations.sppRekapId],
    references: [sppRekap.id],
  }),
  reconciler: one(users, {
    fields: [sppReconciliations.reconciledById],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  unit: one(units, {
    fields: [budgets.unitId],
    references: [units.id],
  }),
  fund: one(funds, {
    fields: [budgets.fundId],
    references: [funds.id],
  }),
  account: one(accounts, {
    fields: [budgets.accountId],
    references: [accounts.id],
  }),
  creator: one(users, {
    fields: [budgets.createdById],
    references: [users.id],
    relationName: 'createdBudgets',
  }),
  approver: one(users, {
    fields: [budgets.approvedById],
    references: [users.id],
    relationName: 'approvedBudgets',
  }),
  fundRequests: many(fundRequests),
}));

export const fundRequestsRelations = relations(fundRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [fundRequests.requesterId],
    references: [users.id],
    relationName: 'requestedFunds',
  }),
  unit: one(units, {
    fields: [fundRequests.unitId],
    references: [units.id],
  }),
  fund: one(funds, {
    fields: [fundRequests.fundId],
    references: [funds.id],
  }),
  account: one(accounts, {
    fields: [fundRequests.accountId],
    references: [accounts.id],
  }),
  budget: one(budgets, {
    fields: [fundRequests.budgetId],
    references: [budgets.id],
  }),
  examiner: one(users, {
    fields: [fundRequests.examinedById],
    references: [users.id],
    relationName: 'examinedRequests',
  }),
  approver: one(users, {
    fields: [fundRequests.approvedById],
    references: [users.id],
    relationName: 'approvedRequests',
  }),
  disbursements: many(fundDisbursements),
  lpjRecords: many(lpjRecords),
}));

export const fundDisbursementsRelations = relations(fundDisbursements, ({ one }) => ({
  request: one(fundRequests, {
    fields: [fundDisbursements.requestId],
    references: [fundRequests.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [fundDisbursements.cashAccountId],
    references: [cashAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [fundDisbursements.bankAccountId],
    references: [bankAccounts.id],
  }),
  transaction: one(transactions, {
    fields: [fundDisbursements.transactionId],
    references: [transactions.id],
  }),
  journal: one(journals, {
    fields: [fundDisbursements.journalId],
    references: [journals.id],
  }),
  creator: one(users, {
    fields: [fundDisbursements.createdById],
    references: [users.id],
  }),
}));

export const lpjRecordsRelations = relations(lpjRecords, ({ one, many }) => ({
  request: one(fundRequests, {
    fields: [lpjRecords.requestId],
    references: [fundRequests.id],
  }),
  disbursement: one(fundDisbursements, {
    fields: [lpjRecords.disbursementId],
    references: [fundDisbursements.id],
  }),
  unit: one(units, {
    fields: [lpjRecords.unitId],
    references: [units.id],
  }),
  requester: one(users, {
    fields: [lpjRecords.requesterId],
    references: [users.id],
  }),
  items: many(lpjItems),
  refunds: many(fundRefunds),
}));

export const lpjItemsRelations = relations(lpjItems, ({ one }) => ({
  lpj: one(lpjRecords, {
    fields: [lpjItems.lpjId],
    references: [lpjRecords.id],
  }),
  account: one(accounts, {
    fields: [lpjItems.accountId],
    references: [accounts.id],
  }),
}));

export const fundRefundsRelations = relations(fundRefunds, ({ one }) => ({
  lpj: one(lpjRecords, {
    fields: [fundRefunds.lpjId],
    references: [lpjRecords.id],
  }),
  request: one(fundRequests, {
    fields: [fundRefunds.requestId],
    references: [fundRequests.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [fundRefunds.cashAccountId],
    references: [cashAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [fundRefunds.bankAccountId],
    references: [bankAccounts.id],
  }),
  transaction: one(transactions, {
    fields: [fundRefunds.transactionId],
    references: [transactions.id],
  }),
  journal: one(journals, {
    fields: [fundRefunds.journalId],
    references: [journals.id],
  }),
  creator: one(users, {
    fields: [fundRefunds.createdById],
    references: [users.id],
  }),
}));

export const investmentsRelations = relations(investments, ({ one, many }) => ({
  fund: one(funds, {
    fields: [investments.fundId],
    references: [funds.id],
  }),
  unit: one(units, {
    fields: [investments.unitId],
    references: [units.id],
  }),
  investmentAccount: one(accounts, {
    fields: [investments.investmentAccountId],
    references: [accounts.id],
  }),
  sourceCashAccount: one(cashAccounts, {
    fields: [investments.sourceCashAccountId],
    references: [cashAccounts.id],
  }),
  sourceBankAccount: one(bankAccounts, {
    fields: [investments.sourceBankAccountId],
    references: [bankAccounts.id],
  }),
  creator: one(users, {
    fields: [investments.createdById],
    references: [users.id],
    relationName: 'investmentCreator',
  }),
  approver: one(users, {
    fields: [investments.approvedById],
    references: [users.id],
    relationName: 'investmentApprover',
  }),
  transactions: many(investmentTransactions),
  reconciliations: many(investmentReconciliations),
  documents: many(investmentDocuments),
}));

export const investmentTransactionsRelations = relations(investmentTransactions, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentTransactions.investmentId],
    references: [investments.id],
  }),
  cashAccount: one(cashAccounts, {
    fields: [investmentTransactions.cashAccountId],
    references: [cashAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [investmentTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
  revenueAccount: one(accounts, {
    fields: [investmentTransactions.revenueAccountId],
    references: [accounts.id],
    relationName: 'investmentRevenueAccount',
  }),
  lossAccount: one(accounts, {
    fields: [investmentTransactions.lossAccountId],
    references: [accounts.id],
    relationName: 'investmentLossAccount',
  }),
  transaction: one(transactions, {
    fields: [investmentTransactions.transactionId],
    references: [transactions.id],
  }),
  journal: one(journals, {
    fields: [investmentTransactions.journalId],
    references: [journals.id],
  }),
  creator: one(users, {
    fields: [investmentTransactions.createdById],
    references: [users.id],
  }),
}));

export const investmentReconciliationsRelations = relations(investmentReconciliations, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentReconciliations.investmentId],
    references: [investments.id],
  }),
  reconciler: one(users, {
    fields: [investmentReconciliations.reconciledById],
    references: [users.id],
  }),
}));

export const investmentDocumentsRelations = relations(investmentDocuments, ({ one }) => ({
  investment: one(investments, {
    fields: [investmentDocuments.investmentId],
    references: [investments.id],
  }),
  uploader: one(users, {
    fields: [investmentDocuments.uploadedById],
    references: [users.id],
  }),
}));

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
  defaultAccount: one(accounts, {
    fields: [transactionCategories.defaultAccountId],
    references: [accounts.id],
  }),
  rules: many(accountingRules),
}));

export const accountingRulesRelations = relations(accountingRules, ({ one }) => ({
  category: one(transactionCategories, {
    fields: [accountingRules.categoryId],
    references: [transactionCategories.id],
  }),
  debitAccount: one(accounts, {
    fields: [accountingRules.debitAccountId],
    references: [accounts.id],
  }),
  creditAccount: one(accounts, {
    fields: [accountingRules.creditAccountId],
    references: [accounts.id],
  }),
}));

export const transactionCorrectionsRelations = relations(transactionCorrections, ({ one }) => ({
  originalTransaction: one(transactions, {
    fields: [transactionCorrections.originalTransactionId],
    references: [transactions.id],
  }),
  correctedTransaction: one(transactions, {
    fields: [transactionCorrections.correctedTransactionId],
    references: [transactions.id],
  }),
  reversedJournal: one(journals, {
    fields: [transactionCorrections.reversedJournalId],
    references: [journals.id],
  }),
  creator: one(users, {
    fields: [transactionCorrections.createdById],
    references: [users.id],
  }),
}));

export const cashBankReconciliationsRelations = relations(cashBankReconciliations, ({ one }) => ({
  cashAccount: one(cashAccounts, {
    fields: [cashBankReconciliations.cashAccountId],
    references: [cashAccounts.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [cashBankReconciliations.bankAccountId],
    references: [bankAccounts.id],
  }),
  reconciler: one(users, {
    fields: [cashBankReconciliations.reconciledById],
    references: [users.id],
  }),
}));
