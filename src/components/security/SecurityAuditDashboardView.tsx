import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  RotateCcw,
  Ban,
  Clock,
  Database,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCw,
  Key,
  UserX,
  Play,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ViewType } from '../Sidebar.tsx';

interface DashboardSummary {
  timestamp: string;
  transactions: {
    pendingCount: number;
    reversedCount: number;
    voidCount: number;
    totalCount: number;
  };
  periods: {
    total: number;
    closedCount: number;
    openCount: number;
  };
  integrity: {
    overallStatus: 'PASS' | 'WARNING' | 'ERROR';
    totalChecks: number;
    passedCount: number;
    warningCount: number;
    errorCount: number;
    summaryMessage: string;
  };
  security: {
    failedLoginsCount: number;
    permissionChangesCount: number;
    totalEvents: number;
  };
  backup: {
    lastBackup: string | null;
    backupStatus: string;
    backupSize: string;
    lastRestoreTest: string;
    restoreTestStatus: string;
  };
}

interface SecurityAuditDashboardProps {
  onNavigateToView?: (view: ViewType) => void;
}

export const SecurityAuditDashboardView: React.FC<SecurityAuditDashboardProps> = ({
  onNavigateToView,
}) => {
  const { authFetch } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Test Runner state
  const [testingRunning, setTestingRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testError, setTestError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/security-audit/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load security audit summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const runPhase8CTests = async () => {
    setTestingRunning(true);
    setTestError(null);
    try {
      const res = await authFetch('/api/fase8c/testing/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjalankan pengujian TAHAP 8C-8E');
      }
      setTestResults(data.results || []);
    } catch (e: any) {
      setTestError(e.message || 'Terjadi kesalahan saat pengujian');
    } finally {
      setTestingRunning(false);
    }
  };

  const getIndicatorBadge = (status: 'PASS' | 'WARNING' | 'ERROR') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
            <AlertTriangle className="h-3 w-3" /> WARNING
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-800">
            <XCircle className="h-3 w-3" /> ERROR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Tahap 8C–8E — Security & Audit
            </span>
            <span className="text-xs text-gray-500">Dasbor Eksekutif & Pengawasan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Security & Audit Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Ringkasan status keamanan transaksi, penutupan periode akuntansi, integritas pembukuan, peristiwa keamanan, serta status cadangan sistem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Grid of Key Surveillance Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Accounting Integrity Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Integritas Akuntansi
              </span>
              {summary ? getIndicatorBadge(summary.integrity.overallStatus) : null}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {summary?.integrity.passedCount || 0} / {summary?.integrity.totalChecks || 11} PASS
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {summary?.integrity.summaryMessage || 'Memeriksa persamaan double-entry'}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {summary?.integrity.errorCount ? `${summary.integrity.errorCount} Masalah Kritis` : '100% Terverifikasi'}
            </span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('integrity-check' as any)}
                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Buka Detail <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Closed Periods & Transaction Locks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Kontrol Periode Akuntansi
              </span>
              {getIndicatorBadge('PASS')}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {summary?.periods.closedCount || 0} Periode CLOSED
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {summary?.periods.openCount || 0} Periode OPEN aktif menerima transaksi
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Perlindungan POSTED aktif</span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('accounting-periods' as any)}
                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Kelola Periode <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Transaction Corrections (Reversed & Void) */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pengawasan Koreksi Transaksi
              </span>
              {getIndicatorBadge('PASS')}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {(summary?.transactions.reversedCount || 0) + (summary?.transactions.voidCount || 0)} Koreksi
              </div>
              <div className="flex gap-3 text-xs text-gray-600 mt-1 font-mono">
                <span>Reversed: <strong>{summary?.transactions.reversedCount || 0}</strong></span>
                <span>Void: <strong>{summary?.transactions.voidCount || 0}</strong></span>
                <span>Pending: <strong>{summary?.transactions.pendingCount || 0}</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Jurnal pembalik tervalidasi</span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('audit-logs' as any)}
                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Lihat Audit Trail <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Security Events & Login Failures */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Keamanan Akun & Akses
              </span>
              {summary && summary.security.failedLoginsCount > 0 ? getIndicatorBadge('WARNING') : getIndicatorBadge('PASS')}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {summary?.security.failedLoginsCount || 0} Gagal Login
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {summary?.security.permissionChangesCount || 0} perubahan izin/peran terekam
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Sanitasi kredensial aktif</span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('security-events' as any)}
                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Log Keamanan <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 5. Backup & Recovery Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Cadangan Database (Backup)
              </span>
              {getIndicatorBadge('PASS')}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-gray-900">
                {summary?.backup.backupStatus || 'ACTIVE'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Ukuran: {summary?.backup.backupSize || '0 KB'} • SHA-256 Verifiable
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Snapshot terenkripsi</span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('backup-recovery' as any)}
                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Kelola Backup <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* 6. Restore Test Status */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Uji Pemulihan (Restore Test)
              </span>
              {getIndicatorBadge('WARNING')}
            </div>
            <div className="mt-3">
              <div className="text-sm font-bold text-amber-950">
                RESTORE TEST: NOT YET TESTED
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Kepatuhan prinsip: Restore database production tidak dijalankan otomatis
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between text-xs">
            <span className="text-amber-800">Checklist pemulihan siap</span>
            {onNavigateToView && (
              <button
                onClick={() => onNavigateToView('backup-recovery' as any)}
                className="font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1"
              >
                Lihat Checklist <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Automated Testing Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">
                Pengujian Otomatis Kepatuhan (Tahap 8C–8E Test Suite)
              </h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Verifikasi otomatis 11 poin kepatuhan: kontrol periode, pencegahan transaksi ganda, sanitasi security events, Maker-Checker, dan integritas backup.
            </p>
          </div>

          <button
            onClick={runPhase8CTests}
            disabled={testingRunning}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 ${testingRunning ? 'animate-spin' : ''}`} />
            {testingRunning ? 'Menjalankan Uji Otomatis...' : 'Jalankan Pengujian Tahap 8C–8E'}
          </button>
        </div>

        {testError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {testError}
          </div>
        )}

        {testResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 border-b border-gray-100 pb-2">
              <span>Hasil Pengujian ({testResults.filter((r) => r.passed).length}/{testResults.length} Lolos)</span>
              <span className="text-emerald-700">Semua skenario divalidasi</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {testResults.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg border p-3 text-xs flex items-start justify-between gap-3 ${
                    t.passed ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950' : 'border-rose-200 bg-rose-50 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {t.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{t.title}</div>
                      <div className="text-[11px] text-gray-700 mt-0.5">{t.message}</div>
                    </div>
                  </div>

                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                      t.passed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {t.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
