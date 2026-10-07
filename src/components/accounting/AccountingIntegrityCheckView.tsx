import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Scale,
  FileText,
  HelpCircle,
  AlertOctagon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface IntegrityIssue {
  problemType: string;
  recordId?: string | number;
  transactionNumber?: string;
  date?: string;
  details: string;
  suggestedAction: string;
}

interface IntegrityCheckItem {
  id: number;
  checkKey: string;
  title: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  description: string;
  issues: IntegrityIssue[];
  details?: Record<string, any>;
  suggestedAction?: string;
}

interface ComprehensiveIntegrityReport {
  timestamp: string;
  overallStatus: 'PASS' | 'WARNING' | 'ERROR';
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  errorCount: number;
  checks: IntegrityCheckItem[];
  summaryMessage: string;
}

export const AccountingIntegrityCheckView: React.FC = () => {
  const { authFetch } = useAuth();
  const [report, setReport] = useState<ComprehensiveIntegrityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'WARNING' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchIntegrityAudit = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/accounting-integrity/audit');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to run accounting integrity audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrityAudit();
  }, []);

  const filteredChecks = report?.checks.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchIssues = c.issues.some(
        (i) =>
          i.details.toLowerCase().includes(q) ||
          i.problemType.toLowerCase().includes(q) ||
          i.suggestedAction.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchIssues) return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Tahap 8C — Integritas Akuntansi
            </span>
            <span className="text-xs text-gray-500">11-Point Double-Entry Verification Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Accounting Integrity Check
          </h1>
          <p className="text-sm text-gray-600">
            Pemeriksaan menyeluruh 11 kriteria matematis dan konsistensi buku besar, kas, bank, investasi, neraca, serta perlindungan periode akuntansi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchIntegrityAudit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Jalankan Audit Integritas Sekarang
          </button>
        </div>
      </div>

      {/* Principle Disclaimer Notice */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-2xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Prinsip Perlindungan Data Keuangan (Non-Destructive Integrity Policy):
            </p>
            <p className="text-amber-900 leading-relaxed">
              Jika ditemukan status <strong>ERROR</strong> atau ketidakcocokan saldo, sistem{' '}
              <strong>TIDAK OTOMATIS MENGUBAH / MEMPERBAIKI DATA KEUANGAN</strong>. Seluruh perbaikan harus dilakukan secara sah melalui jurnal penyesuaian, rekonsiliasi bank, atau otorisasi pimpinan dengan jejak audit double-entry yang lengkap demi akuntabilitas syariah.
            </p>
          </div>
        </div>
      </div>

      {/* Overall Status Banner */}
      {report && (
        <div
          className={`rounded-2xl border p-6 shadow-xs ${
            report.overallStatus === 'PASS'
              ? 'border-emerald-200 bg-emerald-50/60'
              : report.overallStatus === 'WARNING'
              ? 'border-amber-200 bg-amber-50/60'
              : 'border-rose-200 bg-rose-50/60'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                  report.overallStatus === 'PASS'
                    ? 'bg-emerald-600 text-white'
                    : report.overallStatus === 'WARNING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {report.overallStatus === 'PASS' ? (
                  <ShieldCheck className="h-8 w-8" />
                ) : report.overallStatus === 'WARNING' ? (
                  <AlertTriangle className="h-8 w-8" />
                ) : (
                  <ShieldAlert className="h-8 w-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-bold ${
                      report.overallStatus === 'PASS'
                        ? 'bg-emerald-200 text-emerald-900'
                        : report.overallStatus === 'WARNING'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    STATUS SISTEM: {report.overallStatus}
                  </span>
                  <span className="text-xs text-gray-500">
                    Audit Terakhir: {new Date(report.timestamp).toLocaleTimeString('id-ID')}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  {report.summaryMessage}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Dievaluasi berdasarkan 11 tolok ukur akuntansi double-entry dan regulasi tata kelola keuangan pesantren.
                </p>
              </div>
            </div>

            {/* Metrics Counters */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Lolos (PASS)</span>
                <p className="text-xl font-bold text-emerald-700">{report.passedCount}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Peringatan (WARN)</span>
                <p className="text-xl font-bold text-amber-600">{report.warningCount}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center shadow-2xs">
                <span className="text-xs text-gray-500 font-medium">Masalah (ERROR)</span>
                <p className="text-xl font-bold text-rose-700">{report.errorCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kriteria, kata kunci, jenis masalah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status (PASS, WARNING, ERROR)</option>
              <option value="ERROR">Hanya ERROR (Memerlukan Tindakan)</option>
              <option value="WARNING">Hanya WARNING (Peringatan)</option>
              <option value="PASS">Hanya PASS (Lolos Sempurna)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 11 Checks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <span>Menjalankan audit 11 kriteria integritas akuntansi...</span>
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-500">
            Tidak ada kriteria yang sesuai filter.
          </div>
        ) : (
          filteredChecks.map((item) => {
            const isError = item.status === 'ERROR';
            const isWarning = item.status === 'WARNING';
            const isPass = item.status === 'PASS';

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-5 shadow-xs transition-all ${
                  isError
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isWarning
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-gray-200'
                }`}
              >
                {/* Header item */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        isError
                          ? 'bg-rose-100 text-rose-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isError ? (
                        <XCircle className="h-4 w-4" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-3 py-1 text-xs font-bold ${
                      isError
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : isWarning
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Details snippet if available */}
                {item.details && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    {Object.entries(item.details).map(([key, val]) => (
                      <span key={key} className="rounded bg-gray-100 px-2.5 py-1 font-mono text-[11px] text-gray-700">
                        {key}: <strong className="text-gray-900">{typeof val === 'number' ? val.toLocaleString('id-ID') : String(val)}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* If there are specific issues (ERROR or WARNING) */}
                {item.issues && item.issues.length > 0 && (
                  <div className="mt-4 space-y-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
                      <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Rincian Masalah Integritas Terdeteksi ({item.issues.length} Temuan):</span>
                    </div>

                    <div className="space-y-3">
                      {item.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-rose-200 bg-white p-3.5 text-xs text-gray-800 shadow-2xs space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                            <span className="font-semibold text-rose-900 bg-rose-100/70 px-2 py-0.5 rounded">
                              Jenis Masalah: {issue.problemType}
                            </span>
                            {issue.recordId && (
                              <span className="font-mono text-gray-600 text-[11px]">
                                Record / Trx ID: #{issue.recordId}
                              </span>
                            )}
                            {issue.date && (
                              <span className="text-gray-500 text-[11px]">
                                Tanggal: {issue.date}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">Keterangan:</span>{' '}
                            <span className="text-gray-900">{issue.details}</span>
                          </div>

                          <div className="rounded bg-emerald-50 border border-emerald-200 p-2 text-emerald-950">
                            <span className="font-bold text-emerald-900">Tindakan yang Disarankan:</span>{' '}
                            <span>{issue.suggestedAction}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
