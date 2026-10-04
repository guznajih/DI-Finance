export type RoleName = 'SUPER_ADMIN' | 'PIMPINAN' | 'BENDAHARA' | 'PETUGAS_KEUANGAN' | 'UNIT';

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
  type: 'PENERIMAAN' | 'PENGELUARAN' | 'MUTASI_KAS_BANK' | 'PENYESUAIAN';
  unitId?: number | null;
  fundId?: number | null;
  description: string;
  reference?: string | null;
  totalAmount: string;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  reversalOfId?: number | null;
  createdById?: number;
  postedById?: number | null;
  postedAt?: string | null;
  createdAt?: string;
  unitName?: string | null;
  unitCode?: string | null;
  fundName?: string | null;
  creatorName?: string | null;
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

export interface DashboardMetrics {
  saldoKas: number;
  saldoBank: number;
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
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  userName?: string | null;
}
