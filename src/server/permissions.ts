import { Response, NextFunction } from 'express';
import { AuthRequest, AppUser } from '../middleware/auth.ts';

export type ActionType =
  // Transactions & Journaling
  | 'TRANSACTION_CREATE'
  | 'TRANSACTION_UPDATE'
  | 'TRANSACTION_DELETE'
  | 'TRANSACTION_POST'
  | 'TRANSACTION_REVERSE'
  | 'TRANSACTION_VOID'
  | 'TRANSACTION_VIEW'
  // SPP Aggregates
  | 'SPP_CREATE'
  | 'SPP_RECONCILE'
  | 'SPP_IMPORT'
  | 'SPP_VIEW'
  // Budgets
  | 'BUDGET_CREATE'
  | 'BUDGET_UPDATE'
  | 'BUDGET_VIEW'
  // Fund Requests & Workflow
  | 'FUND_REQUEST_CREATE'
  | 'FUND_REQUEST_EXAMINE' // Verifikator
  | 'FUND_REQUEST_APPROVE' // Approver / Pimpinan
  | 'FUND_REQUEST_DISBURSE' // Bendahara
  | 'FUND_REQUEST_VIEW'
  // LPJ
  | 'LPJ_SUBMIT'
  | 'LPJ_REVIEW'
  | 'LPJ_VIEW'
  // Investments
  | 'INVESTMENT_CREATE'
  | 'INVESTMENT_TRANSACT'
  | 'INVESTMENT_VIEW'
  // System Administration
  | 'SYSTEM_CONFIG_MANAGE'
  | 'USER_MANAGE'
  | 'AUDIT_LOG_VIEW';

// Normalize role names to handle variations
export function normalizeRole(roleName?: string | null): string {
  if (!roleName) return 'VIEWER';
  const upper = roleName.toUpperCase().trim();
  if (upper === 'PIMPINAN') return 'APPROVER';
  if (upper === 'UNIT') return 'PETUGAS_UNIT';
  return upper;
}

// Check if user has read-only role (Auditor or Viewer)
export function isReadOnlyRole(roleName?: string | null): boolean {
  const normalized = normalizeRole(roleName);
  return normalized === 'AUDITOR' || normalized === 'VIEWER';
}

/**
 * Core Policy Engine: evaluates whether a user with their role and context
 * is permitted to perform a given action.
 */
export function checkPermission(
  user: AppUser | undefined,
  action: ActionType,
  context?: {
    makerId?: number | null;
    unitId?: number | null;
    requestStatus?: string;
  }
): { allowed: boolean; reason?: string } {
  if (!user || !user.isActive) {
    return { allowed: false, reason: 'Pengguna tidak aktif atau sesi tidak valid' };
  }

  const role = normalizeRole(user.roleName);

  // 1. RULE: AUDITOR & VIEWER are strictly READ-ONLY
  if (isReadOnlyRole(role)) {
    const isReadAction = action.endsWith('_VIEW');
    if (!isReadAction) {
      return {
        allowed: false,
        reason: `Akses ditolak: Role ${user.roleName || 'AUDITOR/VIEWER'} hanya memiliki hak akses Baca (Read-Only). Tidak diizinkan melakukan input, perubahan, verifikasi, approval, atau posting.`,
      };
    }
    return { allowed: true };
  }

  // 2. SUPER ADMIN has full access across all modules, subject to Maker-Checker
  if (role === 'SUPER_ADMIN') {
    // Maker-checker still applies to Super Admin if they created the request themselves
    if (action === 'FUND_REQUEST_APPROVE' && context?.makerId && context.makerId === user.id) {
      return {
        allowed: false,
        reason: 'Pelanggaran Maker-Checker: Pembuat pengajuan dana tidak boleh menyetujui (approve) pengajuannya sendiri, demi transparansi dan akuntabilitas audit.',
      };
    }
    return { allowed: true };
  }

  // 3. BENDAHARA
  if (role === 'BENDAHARA' || role === 'PETUGAS_KEUANGAN') {
    switch (action) {
      case 'TRANSACTION_CREATE':
      case 'TRANSACTION_UPDATE':
      case 'TRANSACTION_POST':
      case 'TRANSACTION_REVERSE':
      case 'TRANSACTION_VOID':
      case 'TRANSACTION_VIEW':
      case 'SPP_CREATE':
      case 'SPP_RECONCILE':
      case 'SPP_IMPORT':
      case 'SPP_VIEW':
      case 'BUDGET_CREATE':
      case 'BUDGET_UPDATE':
      case 'BUDGET_VIEW':
      case 'FUND_REQUEST_CREATE':
      case 'FUND_REQUEST_VIEW':
      case 'LPJ_REVIEW':
      case 'LPJ_VIEW':
      case 'INVESTMENT_CREATE':
      case 'INVESTMENT_TRANSACT':
      case 'INVESTMENT_VIEW':
      case 'AUDIT_LOG_VIEW':
        return { allowed: true };

      case 'FUND_REQUEST_DISBURSE':
        return { allowed: true };

      case 'FUND_REQUEST_EXAMINE':
        // Bendahara can verify/examine as long as they are NOT the maker
        if (context?.makerId && context.makerId === user.id) {
          return {
            allowed: false,
            reason: 'Pelanggaran Maker-Checker: Anda adalah pembuat (maker) pengajuan ini, sehingga tidak dapat memverifikasinya sendiri.',
          };
        }
        return { allowed: true };

      case 'FUND_REQUEST_APPROVE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Bendahara bertindak sebagai pemroses & pencair dana (disbursement), kewenangan approval final berada pada Approver/Pimpinan.',
        };

      case 'SYSTEM_CONFIG_MANAGE':
      case 'USER_MANAGE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Konfigurasi sistem dan manajemen pengguna hanya dapat diakses oleh Super Administrator.',
        };

      default:
        return { allowed: true };
    }
  }

  // 4. VERIFIKATOR
  if (role === 'VERIFIKATOR') {
    switch (action) {
      case 'FUND_REQUEST_EXAMINE':
        // Maker-checker check
        if (context?.makerId && context.makerId === user.id) {
          return {
            allowed: false,
            reason: 'Pelanggaran Maker-Checker: Verifikator tidak dapat memverifikasi pengajuan yang dibuat oleh dirinya sendiri.',
          };
        }
        return { allowed: true };

      case 'FUND_REQUEST_APPROVE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Verifikator hanya berwenang memeriksa kelengkapan berkas, bukan memberikan persetujuan (approval) final.',
        };

      case 'FUND_REQUEST_DISBURSE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Verifikator tidak berwenang mencairkan dana (pencairan dilakukan oleh Bendahara).',
        };

      case 'TRANSACTION_CREATE':
      case 'TRANSACTION_UPDATE':
      case 'TRANSACTION_POST':
      case 'TRANSACTION_REVERSE':
      case 'TRANSACTION_DELETE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Verifikator tidak memiliki kewenangan mengubah atau membuat transaksi akuntansi langsung.',
        };

      case 'TRANSACTION_VIEW':
      case 'SPP_VIEW':
      case 'BUDGET_VIEW':
      case 'FUND_REQUEST_VIEW':
      case 'LPJ_VIEW':
      case 'LPJ_REVIEW':
      case 'INVESTMENT_VIEW':
      case 'AUDIT_LOG_VIEW':
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Akses ditolak untuk role Verifikator pada aksi ini.' };
    }
  }

  // 5. APPROVER / PIMPINAN
  if (role === 'APPROVER') {
    switch (action) {
      case 'FUND_REQUEST_APPROVE':
        // MAKER-CHECKER ENFORCEMENT:
        if (context?.makerId && context.makerId === user.id) {
          return {
            allowed: false,
            reason: 'Pelanggaran Maker-Checker: Pimpinan/Approver yang membuat pengajuan tidak boleh menyetujui pengajuannya sendiri. Harus disetujui oleh pejabat berwenang lainnya.',
          };
        }
        return { allowed: true };

      case 'FUND_REQUEST_EXAMINE':
        return { allowed: true };

      case 'TRANSACTION_CREATE':
      case 'TRANSACTION_UPDATE':
      case 'TRANSACTION_POST':
      case 'TRANSACTION_REVERSE':
      case 'TRANSACTION_DELETE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Approver/Pimpinan mengawasi dan menyetujui kebijakan, pemrosesan transaksi akuntansi dilakukan oleh Bendahara.',
        };

      case 'FUND_REQUEST_DISBURSE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Pencairan dana fisik/bank dilakukan oleh Bendahara (Segregation of Duties).',
        };

      case 'TRANSACTION_VIEW':
      case 'SPP_VIEW':
      case 'BUDGET_VIEW':
      case 'BUDGET_UPDATE': // Approver can approve budget
      case 'FUND_REQUEST_VIEW':
      case 'LPJ_VIEW':
      case 'INVESTMENT_VIEW':
      case 'AUDIT_LOG_VIEW':
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Akses ditolak untuk role Approver pada aksi ini.' };
    }
  }

  // 6. PETUGAS_UNIT / UNIT
  if (role === 'PETUGAS_UNIT') {
    switch (action) {
      case 'FUND_REQUEST_CREATE':
      case 'LPJ_SUBMIT':
        // Petugas unit can only submit for their own unit
        if (context?.unitId && user.unitId && context.unitId !== user.unitId) {
          return {
            allowed: false,
            reason: `Akses ditolak: Anda hanya berwenang mengajukan untuk Unit ID ${user.unitId} (${user.unitName || 'Unit Anda'}).`,
          };
        }
        return { allowed: true };

      case 'FUND_REQUEST_VIEW':
      case 'LPJ_VIEW':
      case 'BUDGET_VIEW':
        return { allowed: true };

      case 'FUND_REQUEST_EXAMINE':
      case 'FUND_REQUEST_APPROVE':
      case 'FUND_REQUEST_DISBURSE':
        return {
          allowed: false,
          reason: 'Akses ditolak: Petugas Unit tidak memiliki kewenangan verifikasi, persetujuan, atau pencairan dana.',
        };

      case 'TRANSACTION_CREATE':
      case 'TRANSACTION_UPDATE':
      case 'TRANSACTION_POST':
      case 'TRANSACTION_REVERSE':
      case 'TRANSACTION_DELETE':
      case 'SPP_CREATE':
      case 'SPP_RECONCILE':
      case 'SPP_IMPORT':
      case 'INVESTMENT_CREATE':
      case 'INVESTMENT_TRANSACT':
        return {
          allowed: false,
          reason: 'Akses ditolak: Petugas Unit hanya memiliki akses terbatas pada pengajuan dan LPJ unitnya sendiri.',
        };

      default:
        return { allowed: false, reason: 'Akses ditolak untuk role Petugas Unit pada aksi ini.' };
    }
  }

  return { allowed: false, reason: 'Hak akses tidak dikenal atau tidak mencukupi.' };
}

/**
 * Middleware: Enforces that write/mutation operations are blocked for Auditor/Viewer
 */
export const requireWritePermission = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Sesi tidak ditemukan' });
  }

  if (isReadOnlyRole(user.roleName)) {
    return res.status(403).json({
      error: `Akses ditolak: Role ${user.roleName || 'AUDITOR/VIEWER'} berstatus READ-ONLY. Tidak diizinkan melakukan operasi penulisan atau perubahan data.`,
      code: 'FORBIDDEN_READ_ONLY',
    });
  }

  next();
};

/**
 * Middleware generator for action-based permission check
 */
export const requirePermission = (
  action: ActionType,
  extractContext?: (req: AuthRequest) => { makerId?: number | null; unitId?: number | null; requestStatus?: string }
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Sesi tidak ditemukan' });
    }

    const context = extractContext ? extractContext(req) : undefined;
    const check = checkPermission(user, action, context);

    if (!check.allowed) {
      return res.status(403).json({
        error: check.reason || 'Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini.',
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSION',
        action,
        userRole: user.roleName,
      });
    }

    next();
  };
};

/**
 * Middleware to ensure unit isolation for PETUGAS_UNIT / UNIT role
 */
export const enforceUnitScoping = (
  extractTargetUnitId: (req: AuthRequest) => number | null | undefined
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const role = normalizeRole(user.roleName);
    if (role === 'PETUGAS_UNIT') {
      const targetUnitId = extractTargetUnitId(req);
      if (targetUnitId && user.unitId && targetUnitId !== user.unitId) {
        return res.status(403).json({
          error: `Akses ditolak: Anda hanya dapat mengakses data untuk unit Anda sendiri (Unit ID ${user.unitId}).`,
          code: 'FORBIDDEN_UNIT_MISMATCH',
        });
      }
    }

    next();
  };
};
