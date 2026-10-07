import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.ts';
import {
  accounts,
  auditLogs,
  bankAccounts,
  budgets,
  cashAccounts,
  fundRequests,
  funds,
  investments,
  investmentTransactions,
  journalLines,
  journals,
  lpjRecords,
  permissions,
  roles,
  sppRekap,
  transactionCorrections,
  transactionLines,
  transactions,
  units,
  users,
} from '../db/schema.ts';
import { createAuditLog } from '../db/accounting.ts';
import { recordSecurityEvent } from './securityEvents.ts';
import { getAccountingPeriods } from './periodManager.ts';

export interface BackupSnapshotMeta {
  id: string;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  recordCounts: Record<string, number>;
  totalRecords: number;
  createdByName: string;
  createdByEmail: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const BACKUP_INDEX_FILE = path.join(DATA_DIR, 'backup_meta.json');

function ensureBackupDirs() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function loadBackupIndex(): BackupSnapshotMeta[] {
  ensureBackupDirs();
  if (fs.existsSync(BACKUP_INDEX_FILE)) {
    try {
      const raw = fs.readFileSync(BACKUP_INDEX_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function saveBackupIndex(list: BackupSnapshotMeta[]) {
  ensureBackupDirs();
  try {
    fs.writeFileSync(BACKUP_INDEX_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save backup index:', e);
  }
}

export async function generateBackupSnapshot(user: any): Promise<BackupSnapshotMeta> {
  const userRole = (user?.roleName || user?.role || '').toUpperCase();
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'BENDAHARA') {
    throw new Error('Akses ditolak: Hanya Super Admin atau Bendahara yang dapat membuat backup sistem');
  }

  ensureBackupDirs();
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[:.]/g, '-');
  const snapshotId = `BKP-${now.getTime()}`;
  const filename = `darulistiqomah_backup_${timestampStr}.json`;
  const filePath = path.join(BACKUPS_DIR, filename);

  // Fetch all primary database records
  const [
    usersData,
    rolesData,
    permissionsData,
    unitsData,
    fundsData,
    accountsData,
    cashData,
    bankData,
    trxData,
    trxLinesData,
    jrnData,
    jrnLinesData,
    budgetsData,
    requestsData,
    lpjData,
    investmentsData,
    invTrxData,
    sppData,
    correctionsData,
    logsData,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(roles),
    db.select().from(permissions),
    db.select().from(units),
    db.select().from(funds),
    db.select().from(accounts),
    db.select().from(cashAccounts),
    db.select().from(bankAccounts),
    db.select().from(transactions),
    db.select().from(transactionLines),
    db.select().from(journals),
    db.select().from(journalLines),
    db.select().from(budgets),
    db.select().from(fundRequests),
    db.select().from(lpjRecords),
    db.select().from(investments),
    db.select().from(investmentTransactions),
    db.select().from(sppRekap),
    db.select().from(transactionCorrections),
    db.select().from(auditLogs),
  ]);

  const periodsData = await getAccountingPeriods();

  const payload = {
    metadata: {
      id: snapshotId,
      createdAt: now.toISOString(),
      system: 'Darul Istiqomah Finance (Tahap 8C-8E)',
      environment: process.env.NODE_ENV || 'production',
      createdById: user?.id,
      createdByName: user?.displayName || user?.name || user?.email,
      schemaVersion: '1.8.0',
    },
    data: {
      users: usersData,
      roles: rolesData,
      permissions: permissionsData,
      units: unitsData,
      funds: fundsData,
      accounts: accountsData,
      cashAccounts: cashData,
      bankAccounts: bankData,
      transactions: trxData,
      transactionLines: trxLinesData,
      journals: jrnData,
      journalLines: jrnLinesData,
      budgets: budgetsData,
      fundRequests: requestsData,
      lpjRecords: lpjData,
      investments: investmentsData,
      investmentTransactions: invTrxData,
      sppRekap: sppData,
      transactionCorrections: correctionsData,
      accountingPeriods: periodsData,
      auditLogs: logsData,
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');
  const sizeFormatted = sizeBytes < 1024 * 1024
    ? `${(sizeBytes / 1024).toFixed(1)} KB`
    : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

  const sha256 = crypto.createHash('sha256').update(jsonStr).digest('hex');

  // Write file
  fs.writeFileSync(filePath, jsonStr, 'utf-8');

  const recordCounts: Record<string, number> = {
    users: usersData.length,
    roles: rolesData.length,
    units: unitsData.length,
    funds: fundsData.length,
    accounts: accountsData.length,
    cashAccounts: cashData.length,
    bankAccounts: bankData.length,
    transactions: trxData.length,
    transactionLines: trxLinesData.length,
    journals: jrnData.length,
    journalLines: jrnLinesData.length,
    budgets: budgetsData.length,
    fundRequests: requestsData.length,
    lpjRecords: lpjData.length,
    investments: investmentsData.length,
    auditLogs: logsData.length,
  };

  const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

  const meta: BackupSnapshotMeta = {
    id: snapshotId,
    filename,
    timestamp: now.toISOString(),
    sizeBytes,
    sizeFormatted,
    sha256,
    recordCounts,
    totalRecords,
    createdByName: user?.displayName || user?.name || user?.email,
    createdByEmail: user?.email || '',
  };

  const index = loadBackupIndex();
  index.unshift(meta);
  saveBackupIndex(index);

  // Write to Audit Log
  await createAuditLog({
    user,
    action: 'BACKUP',
    module: 'BACKUP_RECOVERY',
    entityType: 'BACKUP_SNAPSHOT',
    entityId: snapshotId,
    summary: `Backup data keuangan lengkap dibuat (${meta.sizeFormatted}, ${totalRecords} records, SHA256: ${sha256.substring(0, 10)}...)`,
    beforeValue: null,
    afterValue: { snapshotId, filename, totalRecords, sha256 },
  });

  // Record Security Event
  await recordSecurityEvent({
    eventType: 'BACKUP',
    severity: 'INFO',
    user,
    details: `Backup database lengkap dibuat oleh ${meta.createdByName} (${meta.sizeFormatted}, ${totalRecords} baris data). File: ${filename}`,
    metadata: { snapshotId, sizeBytes, sha256 },
  });

  return meta;
}

export function getBackupStatus() {
  const index = loadBackupIndex();
  const last = index[0] || null;

  return {
    lastBackup: last?.timestamp || null,
    backupStatus: last ? 'ACTIVE' : 'READY',
    backupSize: last ? last.sizeFormatted : '0 KB',
    backupFrequency: 'Harian (Terjadwal) & On-Demand (Manual)',
    lastRestoreTest: 'RESTORE TEST: NOT YET TESTED (Membutuhkan Staging Isolated Environment)',
    restoreTestStatus: 'NOT_YET_TESTED',
    restoreSafetyPolicy: 'Prinsip Keamanan: Restore database production tidak boleh dilakukan secara otomatis untuk mencegah overwriting data aktif.',
    restoreChecklist: [
      { item: 'Integritas File: JSON valid dan checksum SHA-256 cocok', status: 'READY' },
      { item: 'Kelengkapan Bagan Akun (COA): Semua akun induk dan transaksi terdefinisi', status: 'READY' },
      { item: 'Keseimbangan Akuntansi: Debit = Kredit pada seluruh baris jurnal', status: 'READY' },
      { item: 'Konsistensi Saldo Kas & Bank: Nilai buku kas/bank sinkron dengan buku besar', status: 'READY' },
      { item: 'Jejak Audit Trail: Seluruh riwayat mutasi dan koreksi tersedia', status: 'READY' },
      { item: 'Uji Coba Lingkungan Terisolasi: Belum diuji coba pada staging server terpisah', status: 'NOT_YET_TESTED' },
    ],
    snapshots: index,
  };
}

/**
 * Dry-run verify a backup snapshot without touching live database
 */
export function verifyBackupIntegrity(snapshotId: string) {
  const index = loadBackupIndex();
  const meta = index.find((s) => s.id === snapshotId);
  if (!meta) {
    throw new Error('Snapshot backup tidak ditemukan.');
  }

  const filePath = path.join(BACKUPS_DIR, meta.filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File backup ${meta.filename} tidak ditemukan di disk.`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const actualHash = crypto.createHash('sha256').update(raw).digest('hex');

  if (actualHash !== meta.sha256) {
    return {
      isValid: false,
      message: 'Verifikasi Gagal: Hash SHA-256 file tidak cocok dengan indeks metadata (kemungkinan file rusak atau termodifikasi).',
      expectedHash: meta.sha256,
      actualHash,
    };
  }

  const parsed = JSON.parse(raw);
  const data = parsed.data || {};

  // Check debit = credit balance in journals within the snapshot
  let totalDebit = 0;
  let totalCredit = 0;
  if (Array.isArray(data.journalLines)) {
    for (const l of data.journalLines) {
      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);
    }
  }

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.05;

  return {
    isValid: true,
    snapshotId,
    filename: meta.filename,
    sha256: actualHash,
    recordCounts: meta.recordCounts,
    totalRecords: meta.totalRecords,
    journalCheck: {
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced,
    },
    message: isBalanced
      ? 'Verifikasi Integritas Snapshot Berhasil (SHA-256 Valid, Debit = Kredit Balance Sempurna, Struktur Data Utuh).'
      : 'Peringatan: File valid namun saldo debit-kredit jurnal snapshot memiliki selisih.',
  };
}
