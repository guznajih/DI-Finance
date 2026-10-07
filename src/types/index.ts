export type RoleName =
  | 'SUPER_ADMIN'
  | 'BENDAHARA'
  | 'VERIFIKATOR'
  | 'APPROVER'
  | 'PIMPINAN'
  | 'PETUGAS_UNIT'
  | 'UNIT'
  | 'AUDITOR'
  | 'VIEWER'
  | 'PETUGAS_KEUANGAN';

export type TransactionStatus = 'DRAFT' | 'DIAJUKAN' | 'DISETUJUI' | 'POSTED' | 'REVERSED' | 'VOID';

export type TransactionType =
  | 'PENERIMAAN'
  | 'PENGELUARAN'
  | 'TRANSFER'
  | 'JURNAL_UMUM'
  | 'MUTASI_KAS_BANK'
  | 'PENYESUAIAN';

export interface User {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  roleId: number | null;
  unitId: number | null;
  roleName: RoleName | null;
  roleDesc: string | null;
  unitName: string | null;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface Unit {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Fund {
  id: number;
  code: string;
  name: string;
  type: 'terikat' | 'tidak_terikat' | string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  category: 'ASET' | 'KEWAJIBAN' | 'DANA' | 'PENDAPATAN' | 'BEBAN';
  subCategory: string;
  normalBalance: 'DEBIT' | 'KREDIT';
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CashAccount {
  id: number;
  accountId: number;
  name: string;
  unitId?: number | null;
  initialBalance: string;
  currentBalance: string;
  isActive: boolean;
  accountCode?: string;
  accountName?: string;
  unitName?: string | null;
}

export interface BankAccount {
  id: number;
  accountId: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  initialBalance: string;
  currentBalance: string;
  isActive: boolean;
  accountCode?: string;
  coaAccountName?: string;
}

export interface TransactionLine {
  id?: number;
  accountId: number;
  description?: string;
  debit: number | string;
  credit: number | string;
  lineNumber?: number;
  accountCode?: string;
  accountName?: string;
  category?: string;
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  date: string;
  type: TransactionType;
  unitId?: number | null;
  fundId?: number | null;
  description: string;
  recipient?: string | null;
  reference?: string | null;
  attachmentUrl?: string | null;
  totalAmount: string;
  status: TransactionStatus;
  cashBankType?: 'KAS' | 'BANK' | null;
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  toCashBankType?: 'KAS' | 'BANK' | null;
  toCashAccountId?: number | null;
  toBankAccountId?: number | null;
  reversalOfId?: number | null;
  createdById?: number;
  approvedById?: number | null;
  approvedAt?: string | null;
  postedById?: number | null;
  postedAt?: string | null;
  createdAt?: string;
  unitName?: string | null;
  unitCode?: string | null;
  fundName?: string | null;
  creatorName?: string | null;
  approverName?: string | null;
  posterName?: string | null;
  sourceAccountName?: string | null;
  targetAccountName?: string | null;
  lines?: TransactionLine[];
}

export interface JournalLine {
  id: number;
  journalId: number;
  accountId: number;
  unitId?: number | null;
  fundId?: number | null;
  description?: string | null;
  debit: string;
  credit: string;
  lineNumber: number;
  accountCode?: string;
  accountName?: string;
  unitName?: string | null;
  fundName?: string | null;
}

export interface Journal {
  id: number;
  journalNumber: string;
  transactionId?: number | null;
  date: string;
  description: string;
  attachmentUrl?: string | null;
  totalDebit: string;
  totalCredit: string;
  isBalanced: boolean;
  status: 'POSTED' | 'REVERSED';
  createdAt: string;
  posterName?: string | null;
  lines: JournalLine[];
}

export interface GeneralLedgerEntry {
  id: number;
  date: string;
  journalNumber: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: number;
  unitName?: string | null;
  fundName?: string | null;
}

export interface GeneralLedgerData {
  account: Account;
  openingBalance: number;
  entries: GeneralLedgerEntry[];
  endingBalance: number;
}

export interface CashBookEntry {
  id: number;
  date: string;
  transactionNumber: string;
  description: string;
  penerimaan: number;
  pengeluaran: number;
  runningBalance: number;
  unitName?: string | null;
  fundName?: string | null;
  reference?: string | null;
}

export interface CashBookData {
  cashAccount: CashAccount;
  openingBalance: number;
  totalPenerimaan: number;
  totalPengeluaran: number;
  endingBalance: number;
  entries: CashBookEntry[];
}

export interface BankBookEntry {
  id: number;
  date: string;
  transactionNumber: string;
  type: string;
  description: string;
  penerimaan: number;
  pengeluaran: number;
  transferIn: number;
  transferOut: number;
  runningBalance: number;
  unitName?: string | null;
  fundName?: string | null;
  reference?: string | null;
}

export interface BankBookData {
  bankAccount: BankAccount;
  openingBalance: number;
  totalPenerimaan: number;
  totalPengeluaran: number;
  totalTransferIn: number;
  totalTransferOut: number;
  endingBalance: number;
  entries: BankBookEntry[];
}

export interface DashboardMetrics {
  saldoKas: number;
  saldoBank: number;
  totalKasBank: number;
  bankBalances: Array<{
    id: number;
    bankName: string;
    accountNumber: string;
    balance: number;
  }>;
  totalAset: number;
  pendapatan: number;
  beban: number;
  surplusDefisit: number;
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    date: string;
    type: string;
    description: string;
    totalAmount: string;
    status: string;
    unitName?: string | null;
    fundName?: string | null;
  }>;
  counts: {
    units: number;
    funds: number;
    accounts: number;
  };
}

export interface AuditLog {
  id: number;
  userId?: number | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
  user?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  action: string;
  module?: string;
  record?: string;
  entityType: string;
  recordId?: string | null;
  entityId?: string | null;
  timestamp?: string;
  createdAt: string;
  details?: string | null;
  summary?: string | null;
  beforeValue?: any;
  afterValue?: any;
  reason?: string | null;
  ipAddress?: string | null;
}

export interface TestResultItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  details?: any;
}

export type SppReconciliationStatus =
  | 'BELUM_REKONSILIASI'
  | 'SUDAH_REKONSILIASI'
  | 'PERLU_PEMERIKSAAN'
  | 'SELISIH';

export interface SppRekap {
  id: number;
  rekapNumber: string;
  date: string;
  period: string;
  academicYear: string;
  unitId: number;
  cashBankType: 'KAS' | 'BANK';
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  amount: string;
  paymentCount: number;
  dataSource: string;
  reference?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
  status: string;
  reconciliationStatus: SppReconciliationStatus;
  reconciledAmount?: string | null;
  reconciledDifference?: string | null;
  reconciledNotes?: string | null;
  reconciledAt?: string | null;
  reconciledById?: number | null;
  transactionId?: number | null;
  journalId?: number | null;
  createdById?: number | null;
  createdAt: string;
  unitName?: string | null;
  unitCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  cashName?: string | null;
  creatorName?: string | null;
  reconcilerName?: string | null;
  transactionNumber?: string | null;
  journalNumber?: string | null;
}

export interface SppReconciliation {
  id: number;
  sppRekapId: number;
  status: string;
  externalAmount: string;
  bankAmount: string;
  systemAmount: string;
  difference: string;
  matchStatus: 'SESUAI' | 'SELISIH';
  notes?: string | null;
  reconciledById?: number | null;
  createdAt: string;
  reconcilerName?: string | null;
  rekapNumber?: string | null;
  period?: string | null;
  unitName?: string | null;
}

export interface SppReportSummary {
  totalAmount: number;
  totalPayments: number;
  totalRecords: number;
  unreconciledCount: number;
  reconciledCount: number;
  differenceCount: number;
  totalDifference: number;
  byMonth: Array<{
    period: string;
    totalAmount: number;
    totalPayments: number;
    count: number;
  }>;
  byAcademicYear: Array<{
    academicYear: string;
    totalAmount: number;
    totalPayments: number;
    count: number;
  }>;
  byUnit: Array<{
    unitId: number;
    unitCode: string;
    unitName: string;
    totalAmount: number;
    totalPayments: number;
    count: number;
  }>;
  byAccount: Array<{
    type: 'KAS' | 'BANK';
    name: string;
    accountNumber?: string;
    totalAmount: number;
    count: number;
  }>;
  discrepancies: SppRekap[];
}

// =========================================================================
// FASE 4 TYPES: ANGGARAN, PENGAJUAN, PENCAIRAN, LPJ & SISA DANA
// =========================================================================

export type BudgetStatus = 'DRAFT' | 'DIAJUKAN' | 'DISETUJUI' | 'AKTIF' | 'NONAKTIF';

export interface Budget {
  id: number;
  budgetCode: string;
  fiscalYear: string;
  unitId: number;
  fundId?: number | null;
  accountId: number;
  allocatedAmount: string;
  realizedAmount: string;
  remainingAmount: string;
  description?: string | null;
  status: BudgetStatus;
  createdById?: number | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  unitName?: string | null;
  unitCode?: string | null;
  fundName?: string | null;
  accountName?: string | null;
  accountCode?: string | null;
  creatorName?: string | null;
  approverName?: string | null;
  realizationPercentage?: number;
}

export type FundRequestStatus =
  | 'DRAFT'
  | 'DIAJUKAN'
  | 'DIPERIKSA'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'DICAIRKAN'
  | 'SELESAI';

export type LpjStatus =
  | 'BELUM_LPJ'
  | 'LPJ_DIBUAT'
  | 'DIAJUKAN'
  | 'DIPERIKSA'
  | 'DISETUJUI'
  | 'SELESAI'
  | 'PERLU_PERBAIKAN';

export interface FundRequest {
  id: number;
  requestNumber: string;
  date: string;
  requesterId: number;
  requesterName: string;
  unitId: number;
  fundId?: number | null;
  accountId: number;
  budgetId?: number | null;
  purpose: string;
  amountRequested: string;
  amountApproved?: string | null;
  amountDisbursed: string;
  itemsDetail?: string | null;
  attachmentUrl?: string | null;
  status: FundRequestStatus;
  examinedById?: number | null;
  examinedAt?: string | null;
  examinationNotes?: string | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  rejectedById?: number | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  lpjStatus: LpjStatus;
  allowOverBudget: boolean;
  createdAt: string;
  updatedAt: string;
  unitName?: string | null;
  unitCode?: string | null;
  fundName?: string | null;
  accountName?: string | null;
  accountCode?: string | null;
  budgetCode?: string | null;
  budgetRemaining?: string | null;
  examinerName?: string | null;
  approverName?: string | null;
  rejectedByName?: string | null;
}

export interface FundDisbursement {
  id: number;
  disbursementNumber: string;
  requestId: number;
  disbursementDate: string;
  recipientName: string;
  cashBankType: 'KAS' | 'BANK';
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  amount: string;
  notes?: string | null;
  receiptUrl?: string | null;
  transactionId?: number | null;
  journalId?: number | null;
  createdById: number;
  createdAt: string;
  requestNumber?: string | null;
  purpose?: string | null;
  unitName?: string | null;
  cashName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  creatorName?: string | null;
  transactionNumber?: string | null;
}

export interface LpjItem {
  id: number;
  lpjId: number;
  date: string;
  description: string;
  accountId?: number | null;
  amount: string;
  receiptUrl?: string | null;
  createdAt: string;
  accountName?: string | null;
  accountCode?: string | null;
}

export interface LpjRecord {
  id: number;
  lpjNumber: string;
  requestId: number;
  disbursementId?: number | null;
  unitId: number;
  requesterId: number;
  amountReceived: string;
  totalSpent: string;
  remainingAmount: string;
  notes?: string | null;
  attachmentUrl?: string | null;
  status: LpjStatus;
  examinerNotes?: string | null;
  examinedById?: number | null;
  examinedAt?: string | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  refundStatus: 'TIDAK_ADA_SISA' | 'MENUNGGU_PENGEMBALIAN' | 'SUDAH_DIKEMBALIKAN';
  refundTransactionId?: number | null;
  createdAt: string;
  updatedAt: string;
  requestNumber?: string | null;
  purpose?: string | null;
  unitName?: string | null;
  requesterName?: string | null;
  examinerName?: string | null;
  approverName?: string | null;
  items?: LpjItem[];
  refund?: FundRefund | null;
}

export interface FundRefund {
  id: number;
  refundNumber: string;
  lpjId: number;
  requestId: number;
  refundDate: string;
  cashBankType: 'KAS' | 'BANK';
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  amount: string;
  notes?: string | null;
  receiptUrl?: string | null;
  transactionId?: number | null;
  journalId?: number | null;
  createdById: number;
  createdAt: string;
  lpjNumber?: string | null;
  requestNumber?: string | null;
  cashName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  creatorName?: string | null;
  transactionNumber?: string | null;
}

export interface LeadershipDashboardMetrics {
  requests: {
    waitingExamination: number;
    waitingApproval: number;
    approved: number;
    rejected: number;
    disbursed: number;
    total: number;
    totalAmountRequested: number;
    totalAmountDisbursed: number;
  };
  lpj: {
    pendingLpj: number;
    waitingVerification: number;
    needsRevision: number;
    completed: number;
    totalRemainingUnrefunded: number;
  };
  budget: {
    totalAllocated: number;
    totalRealized: number;
    totalRemaining: number;
    overallPercentage: number;
    byUnit: Array<{
      unitId: number;
      unitName: string;
      unitCode: string;
      allocated: number;
      realized: number;
      remaining: number;
      percentage: number;
    }>;
  };
}

// =========================================================================
// FASE 5: MODUL INVESTASI PESANTREN TYPES
// =========================================================================

export type InvestmentType = 'BAGI_HASIL' | 'PENYERTAAN_MODAL' | 'DEPOSITO' | 'LAINNYA';

export type InvestmentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'MATURED'
  | 'COMPLETED'
  | 'PROBLEMATIC'
  | 'CANCELLED';

export type InvestmentTxType =
  | 'PENEMPATAN'
  | 'BAGI_HASIL'
  | 'PENGEMBALIAN_MODAL'
  | 'PENYESUAIAN_NILAI';

export type ReconciliationStatus = 'MATCHED' | 'VARIANCE' | 'PENDING' | 'NEEDS_REVIEW';

export type InvestmentDocumentType =
  | 'PERJANJIAN'
  | 'BUKTI_TRANSFER'
  | 'LAPORAN_KEUANGAN_MITRA'
  | 'BUKTI_BAGI_HASIL'
  | 'BUKTI_PENGEMBALIAN'
  | 'LAINNYA';

export interface Investment {
  id: number;
  investmentNumber: string;
  investeeName: string;
  investmentType: InvestmentType;
  placementDate: string;
  startDate: string;
  dueDate?: string | null;
  initialCapital: string;
  currentValue: string;
  totalReturnProfit: string;
  totalCapitalReturned: string;
  totalValuationAdjustment: string;
  fundId: number;
  unitId?: number | null;
  investmentAccountId: number;
  sourceCashAccountId?: number | null;
  sourceBankAccountId?: number | null;
  investmentScheme?: string | null;
  profitSharingPercentage?: string | null;
  profitPaymentSchedule?: string | null;
  targetReturnEstimate?: string | null;
  status: InvestmentStatus;
  picName: string;
  picContact?: string | null;
  notes?: string | null;
  contractUrl?: string | null;
  createdById: number;
  approvedById?: number | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined fields
  fundName?: string | null;
  fundCode?: string | null;
  unitName?: string | null;
  unitCode?: string | null;
  investmentAccountCode?: string | null;
  investmentAccountName?: string | null;
  sourceCashName?: string | null;
  sourceBankName?: string | null;
  sourceBankAccountNumber?: string | null;
  creatorName?: string | null;
  approverName?: string | null;
  transactionsCount?: number;
  documentsCount?: number;
}

export interface InvestmentTransaction {
  id: number;
  transactionNumber: string;
  investmentId: number;
  type: InvestmentTxType;
  date: string;
  amount: string;
  cashBankType: 'KAS' | 'BANK' | 'NON_CASH';
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  revenueAccountId?: number | null;
  lossAccountId?: number | null;
  period?: string | null;
  reference?: string | null;
  description: string;
  attachmentUrl?: string | null;
  status: 'POSTED' | 'REVERSED';
  transactionId?: number | null;
  journalId?: number | null;
  createdById: number;
  createdAt: string;

  // Joined fields
  investmentNumber?: string | null;
  investeeName?: string | null;
  cashName?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  revenueAccountName?: string | null;
  revenueAccountCode?: string | null;
  lossAccountName?: string | null;
  lossAccountCode?: string | null;
  creatorName?: string | null;
  journalNumber?: string | null;
}

export interface InvestmentReconciliation {
  id: number;
  reconciliationNumber: string;
  investmentId: number;
  asOfDate: string;
  systemBookValue: string;
  investeeReportedValue: string;
  expectedProfitSharing: string;
  actualProfitReceived: string;
  capitalReturned: string;
  difference: string;
  status: ReconciliationStatus;
  notes?: string | null;
  attachmentUrl?: string | null;
  reconciledById: number;
  createdAt: string;
  updatedAt: string;

  // Joined fields
  investmentNumber?: string | null;
  investeeName?: string | null;
  reconcilerName?: string | null;
}

export interface InvestmentDocument {
  id: number;
  investmentId: number;
  documentType: InvestmentDocumentType;
  title: string;
  fileUrl: string;
  notes?: string | null;
  uploadedById: number;
  createdAt: string;

  // Joined fields
  uploaderName?: string | null;
  investmentNumber?: string | null;
  investeeName?: string | null;
}

export interface InvestmentDashboardSummary {
  totalActiveInvested: number; // Nilai modal berjalan investasi aktif
  totalInitialInvested: number; // Total modal awal seluruh investasi
  activeInvestmentsCount: number;
  maturedInvestmentsCount: number;
  problematicInvestmentsCount: number;
  completedInvestmentsCount: number;
  totalProfitReceived: number; // Total bagi hasil
  totalCapitalReturned: number; // Total pengembalian modal
  totalValuationLoss: number; // Total kerugian / penurunan nilai
  upcomingMaturities: Investment[]; // Jatuh tempo 30-60 hari ke depan
  byInvestee: Array<{
    investeeName: string;
    currentValue: number;
    initialCapital: number;
    profitReceived: number;
    count: number;
  }>;
  byType: Array<{
    type: InvestmentType;
    currentValue: number;
    count: number;
  }>;
  recentTransactions: InvestmentTransaction[];
}

// =========================================================================
// FASE 6: LAPORAN KEUANGAN KONSISTEN, NERACA, ARUS KAS, NERACA SALDO & INTEGRITAS
// =========================================================================

export interface TrialBalanceItem {
  accountId: number;
  accountCode: string;
  accountName: string;
  category: 'ASET' | 'KEWAJIBAN' | 'DANA' | 'PENDAPATAN' | 'BEBAN';
  subCategory: string;
  normalBalance: 'DEBIT' | 'KREDIT';
  totalDebit: number;
  totalCredit: number;
  endingDebit: number;
  endingCredit: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  startDate?: string;
  items: TrialBalanceItem[];
  totalDebitMutasi: number;
  totalCreditMutasi: number;
  totalEndingDebit: number;
  totalEndingCredit: number;
  isBalanced: boolean;
  difference: number;
}

export interface BalanceSheetItem {
  accountId: number;
  code: string;
  name: string;
  subCategory: string;
  balance: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    cashAndBank: BalanceSheetItem[];
    receivables: BalanceSheetItem[];
    inventories: BalanceSheetItem[];
    investments: BalanceSheetItem[];
    fixedAssets: BalanceSheetItem[];
    depreciations: BalanceSheetItem[];
    otherAssets: BalanceSheetItem[];
    totalCashAndBank: number;
    totalInvestments: number;
    totalFixedAssetsNet: number;
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: BalanceSheetItem[];
    longTermLiabilities: BalanceSheetItem[];
    totalLiabilities: number;
  };
  netAssets: {
    unrestrictedFunds: BalanceSheetItem[];
    restrictedFunds: BalanceSheetItem[];
    currentPeriodSurplusDeficit: number;
    totalFunds: number;
    totalNetAssetsAndLiabilities: number;
  };
  isBalanced: boolean;
  balanceDifference: number;
  warning?: string | null;
}

export interface IncomeStatementItem {
  accountId: number;
  code: string;
  name: string;
  subCategory: string;
  amount: number;
}

export interface IncomeStatementReport {
  startDate: string;
  endDate: string;
  revenues: {
    sppAgregat: IncomeStatementItem[];
    donations: IncomeStatementItem[];
    education: IncomeStatementItem[];
    business: IncomeStatementItem[];
    investmentProfitSharing: IncomeStatementItem[];
    otherRevenues: IncomeStatementItem[];
    totalRevenue: number;
  };
  expenses: {
    salaryAndHonor: IncomeStatementItem[];
    electricity: IncomeStatementItem[];
    water: IncomeStatementItem[];
    stationery: IncomeStatementItem[];
    maintenance: IncomeStatementItem[];
    educationExp: IncomeStatementItem[];
    santriActivities: IncomeStatementItem[];
    kitchenConsumption: IncomeStatementItem[];
    operational: IncomeStatementItem[];
    investmentValuationLoss: IncomeStatementItem[];
    otherExpenses: IncomeStatementItem[];
    totalExpense: number;
  };
  surplusDeficit: number;
}

export interface CashFlowActivityItem {
  label: string;
  amount: number;
  category: 'OPERATING' | 'INVESTING' | 'FINANCING';
}

export interface CashFlowReport {
  startDate: string;
  endDate: string;
  operatingActivities: CashFlowActivityItem[];
  investingActivities: CashFlowActivityItem[];
  financingActivities: CashFlowActivityItem[];
  netOperatingCash: number;
  netInvestingCash: number;
  netFinancingCash: number;
  netCashChange: number;
  openingCashAndBank: number;
  endingCashAndBank: number;
  balanceSheetCashAndBank: number;
  isReconciledWithBalanceSheet: boolean;
}

export interface CashBankReconciliation {
  id: number;
  reconciliationNumber: string;
  accountType: 'KAS' | 'BANK';
  cashAccountId?: number | null;
  bankAccountId?: number | null;
  reconciliationDate: string;
  systemBalance: string;
  statementBalance: string;
  difference: string;
  status: 'MATCHED' | 'VARIANCE' | 'NEEDS_REVIEW';
  notes?: string | null;
  attachmentUrl?: string | null;
  reconciledById: number;
  createdAt: string;
  updatedAt: string;

  // Joined
  accountName?: string | null;
  accountNumber?: string | null;
  reconcilerName?: string | null;
}

export interface AccountingIntegrityCheckResult {
  checkId: string;
  title: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  message: string;
  details?: any;
}

export interface AccountingIntegrityReport {
  timestamp: string;
  allPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: AccountingIntegrityCheckResult[];
}

export interface DebitCreditGuide {
  id: string;
  label: string;
  type: 'PENERIMAAN' | 'PENGELUARAN' | 'TRANSFER';
  categoryName: string;
  defaultAccountId: number;
  accountCode: string;
  accountName: string;
  explanation: string;
}

