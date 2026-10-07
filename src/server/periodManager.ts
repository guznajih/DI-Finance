import fs from 'fs';
import path from 'path';
import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { createAuditLog } from '../db/accounting.ts';
import { recordSecurityEvent } from './securityEvents.ts';

export interface AccountingPeriodRecord {
  periodKey: string; // '2026-10'
  year: number;
  month: number;
  monthName: string; // 'Oktober 2026'
  status: 'OPEN' | 'CLOSED';
  closedBy?: { id: number; name: string; email: string } | null;
  closedAt?: string | null;
  reopenedBy?: { id: number; name: string; email: string } | null;
  reopenedAt?: string | null;
  reason?: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const PERIODS_FILE = path.join(DATA_DIR, 'accounting_periods.json');

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Generate standard default 12-month periods for a given year (e.g. 2026)
function generateDefaultPeriods(year: number = 2026): Record<string, AccountingPeriodRecord> {
  const result: Record<string, AccountingPeriodRecord> = {};
  for (let m = 1; m <= 12; m++) {
    const monthStr = m < 10 ? `0${m}` : `${m}`;
    const key = `${year}-${monthStr}`;
    result[key] = {
      periodKey: key,
      year,
      month: m,
      monthName: `${MONTH_NAMES[m - 1]} ${year}`,
      status: 'OPEN',
      closedBy: null,
      closedAt: null,
      reopenedBy: null,
      reopenedAt: null,
      reason: null,
    };
  }
  return result;
}

function loadPeriodsFromFile(): Record<string, AccountingPeriodRecord> {
  ensureDataDir();
  if (fs.existsSync(PERIODS_FILE)) {
    try {
      const raw = fs.readFileSync(PERIODS_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse accounting_periods.json, using defaults:', e);
    }
  }
  const defaults = generateDefaultPeriods(2026);
  savePeriodsToFile(defaults);
  return defaults;
}

function savePeriodsToFile(periods: Record<string, AccountingPeriodRecord>) {
  ensureDataDir();
  try {
    fs.writeFileSync(PERIODS_FILE, JSON.stringify(periods, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to save periods to file:', e);
  }
}

/**
 * Hydrate periods from PostgreSQL audit_logs if available
 */
export async function syncPeriodsFromAuditLogs(): Promise<Record<string, AccountingPeriodRecord>> {
  const periods = loadPeriodsFromFile();
  try {
    const periodLogs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityType, 'ACCOUNTING_PERIOD'))
      .orderBy(desc(auditLogs.id));

    // Replay chronological state if needed
    for (const log of periodLogs.reverse()) {
      const key = log.entityId;
      if (!key) continue;

      if (!periods[key]) {
        const [yStr, mStr] = key.split('-');
        const y = parseInt(yStr, 10) || 2026;
        const m = parseInt(mStr, 10) || 1;
        periods[key] = {
          periodKey: key,
          year: y,
          month: m,
          monthName: `${MONTH_NAMES[m - 1] || 'Bulan'} ${y}`,
          status: 'OPEN',
          closedBy: null,
          closedAt: null,
          reopenedBy: null,
          reopenedAt: null,
          reason: null,
        };
      }

      let payload: any = null;
      try {
        if (log.details && (log.details.startsWith('{') || log.details.startsWith('['))) {
          payload = JSON.parse(log.details);
        }
      } catch {
        payload = null;
      }

      if (log.action === 'PERIOD_CLOSED') {
        periods[key].status = 'CLOSED';
        periods[key].closedBy = {
          id: log.userId || 1,
          name: payload?.userName || log.userEmail?.split('@')[0] || 'Bendahara/Admin',
          email: log.userEmail || '',
        };
        periods[key].closedAt = log.createdAt ? log.createdAt.toISOString() : new Date().toISOString();
        periods[key].reason = payload?.reason || log.details || 'Tutup periode akuntansi';
      } else if (log.action === 'PERIOD_REOPENED') {
        periods[key].status = 'OPEN';
        periods[key].reopenedBy = {
          id: log.userId || 1,
          name: payload?.userName || log.userEmail?.split('@')[0] || 'Super Admin',
          email: log.userEmail || '',
        };
        periods[key].reopenedAt = log.createdAt ? log.createdAt.toISOString() : new Date().toISOString();
        periods[key].reason = payload?.reason || log.details || 'Buka kembali periode akuntansi';
      }
    }

    savePeriodsToFile(periods);
  } catch (err) {
    console.warn('Sync periods from audit logs failed (using local cache):', err);
  }
  return periods;
}

export async function getAccountingPeriods(): Promise<AccountingPeriodRecord[]> {
  const periods = await syncPeriodsFromAuditLogs();
  return Object.values(periods).sort((a, b) => a.periodKey.localeCompare(b.periodKey));
}

/**
 * Check if a date string falls inside a CLOSED period
 */
export async function isPeriodClosed(dateString: string): Promise<boolean> {
  if (!dateString) return false;
  // Extract YYYY-MM
  const periodKey = dateString.substring(0, 7);
  const periods = loadPeriodsFromFile();
  const record = periods[periodKey];
  return record?.status === 'CLOSED';
}

/**
 * Close an accounting period
 */
export async function closeAccountingPeriod(
  periodKey: string,
  reason: string,
  user: any,
  confirmed: boolean = true
): Promise<AccountingPeriodRecord> {
  const userRole = (user?.roleName || user?.role || '').toUpperCase();
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'BENDAHARA') {
    throw new Error('Akses ditolak: Hanya Bendahara atau Super Admin yang berwenang menutup periode akuntansi');
  }

  if (!confirmed) {
    throw new Error('Konfirmasi diperlukan sebelum menutup periode akuntansi.');
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('Alasan penutupan periode akuntansi wajib diisi (minimal 5 karakter).');
  }

  const periods = loadPeriodsFromFile();
  if (!periods[periodKey]) {
    const [yStr, mStr] = periodKey.split('-');
    const y = parseInt(yStr, 10) || 2026;
    const m = parseInt(mStr, 10) || 1;
    periods[periodKey] = {
      periodKey,
      year: y,
      month: m,
      monthName: `${MONTH_NAMES[m - 1] || 'Bulan'} ${y}`,
      status: 'OPEN',
    };
  }

  const prev = periods[periodKey];
  if (prev.status === 'CLOSED') {
    throw new Error(`Periode ${prev.monthName} sudah berstatus CLOSED.`);
  }

  const nowIso = new Date().toISOString();
  periods[periodKey] = {
    ...prev,
    status: 'CLOSED',
    closedBy: {
      id: user.id,
      name: user.displayName || user.name || user.email,
      email: user.email,
    },
    closedAt: nowIso,
    reason: reason.trim(),
  };

  savePeriodsToFile(periods);

  // Record into Audit Trail
  await createAuditLog({
    user,
    action: 'PERIOD_CLOSED',
    module: 'PERIOD_CONTROL',
    entityType: 'ACCOUNTING_PERIOD',
    entityId: periodKey,
    reason: reason.trim(),
    summary: `Tutup Periode Akuntansi ${prev.monthName}: ${reason.trim()}`,
    beforeValue: { status: 'OPEN', periodKey },
    afterValue: { status: 'CLOSED', periodKey, closedAt: nowIso, closedBy: user.email },
  });

  // Record Security Event
  await recordSecurityEvent({
    eventType: 'PERIOD_CLOSED',
    severity: 'WARNING',
    user,
    details: `Periode akuntansi ${prev.monthName} ditutup oleh ${user.displayName || user.email}. Transaksi baru ke periode ini diblokir. Alasan: ${reason.trim()}`,
    metadata: { periodKey, reason: reason.trim() },
  });

  return periods[periodKey];
}

/**
 * Reopen an accounting period
 */
export async function reopenAccountingPeriod(
  periodKey: string,
  reason: string,
  user: any,
  confirmed: boolean = true
): Promise<AccountingPeriodRecord> {
  const userRole = (user?.roleName || user?.role || '').toUpperCase();
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'BENDAHARA') {
    throw new Error('Akses ditolak: Hanya Bendahara atau Super Admin yang berwenang membuka kembali periode akuntansi');
  }

  if (!confirmed) {
    throw new Error('Konfirmasi diperlukan sebelum membuka kembali periode akuntansi.');
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('Alasan pembukaan kembali (reopening) periode wajib diisi dengan jelas (minimal 5 karakter).');
  }

  const periods = loadPeriodsFromFile();
  const prev = periods[periodKey];
  if (!prev) {
    throw new Error(`Periode ${periodKey} tidak ditemukan.`);
  }

  if (prev.status === 'OPEN') {
    throw new Error(`Periode ${prev.monthName} saat ini sudah berstatus OPEN.`);
  }

  const nowIso = new Date().toISOString();
  periods[periodKey] = {
    ...prev,
    status: 'OPEN',
    reopenedBy: {
      id: user.id,
      name: user.displayName || user.name || user.email,
      email: user.email,
    },
    reopenedAt: nowIso,
    reason: reason.trim(),
  };

  savePeriodsToFile(periods);

  // Record into Audit Trail
  await createAuditLog({
    user,
    action: 'PERIOD_REOPENED',
    module: 'PERIOD_CONTROL',
    entityType: 'ACCOUNTING_PERIOD',
    entityId: periodKey,
    reason: reason.trim(),
    summary: `Buka Kembali Periode Akuntansi ${prev.monthName}: ${reason.trim()}`,
    beforeValue: { status: 'CLOSED', periodKey },
    afterValue: { status: 'OPEN', periodKey, reopenedAt: nowIso, reopenedBy: user.email },
  });

  // Record Security Event
  await recordSecurityEvent({
    eventType: 'PERIOD_REOPENED',
    severity: 'WARNING',
    user,
    details: `Periode akuntansi ${prev.monthName} dibuka kembali oleh ${user.displayName || user.email}. Alasan: ${reason.trim()}`,
    metadata: { periodKey, reason: reason.trim() },
  });

  return periods[periodKey];
}
