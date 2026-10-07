import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Play,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface TestResultItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  details?: any;
}

export const Fase6TestingView: React.FC = () => {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRunTests = async () => {
    setRunning(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/fase6/testing/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjalankan pengujian FASE 6');
      }
      setResults(data.results || []);
      setLastRunTime(new Date().toLocaleTimeString('id-ID'));
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setRunning(false);
    }
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && failedCount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-emerald-800" />
            <h1 className="text-xl font-black text-gray-900 tracking-tight sm:text-2xl">
              Uji Otomatis FASE 6: Laporan Keuangan & Integritas Akuntansi
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pengujian otomatis konsistensi transaksi POSTED → Jurnal → Buku Besar → Saldo Akun → Laporan Keuangan
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={running}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-900 disabled:opacity-50 transition"
        >
          {running ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Menjalankan 13 Skenario...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>Jalankan Semua Pengujian FASE 6</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Skenario Uji</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">
              {totalCount > 0 ? totalCount : 13}
            </span>
            <span className="text-xs text-gray-400">skenario</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase">Lolos Uji (Passed)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{passedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold">
              {totalCount > 0 ? `${Math.round((passedCount / totalCount) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-rose-700 uppercase">Gagal Uji (Failed)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{failedCount}</span>
            <span className="text-xs text-rose-500 font-semibold">masalah</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">Status Akhir Audit</span>
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                allPassed
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : totalCount === 0
                  ? 'bg-slate-100 text-gray-600'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {allPassed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>100% LOLOS</span>
                </>
              ) : totalCount === 0 ? (
                <span>SIAP DIUJI</span>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 text-rose-700" />
                  <span>PERBAIKAN</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Skenario List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-gray-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Daftar Skenario Pengujian Integritas Akuntansi
          </h2>
          {lastRunTime && (
            <span className="text-xs text-gray-400 font-mono">
              Terakhir dijalankan pukul {lastRunTime} WIB
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {results.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FlaskConical className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-600">Pengujian Belum Dijalankan</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Klik tombol "Jalankan Semua Pengujian FASE 6" di atas untuk memverifikasi seluruh
                skenario integrasi akuntansi, neraca, laba rugi, arus kas, rekonsiliasi, dan audit trail.
              </p>
            </div>
          ) : (
            results.map((r, idx) => {
              const isExpanded = expandedId === r.id;
              return (
                <div key={r.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="flex cursor-pointer items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {r.passed ? (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-800">
                            <XCircle className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-bold text-gray-900">{r.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              r.passed
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {r.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.message}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-gray-400 mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {isExpanded && r.details && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-slate-900 p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                      <div className="text-gray-400 mb-1 text-[10px] uppercase font-bold tracking-wider">
                        Hasil Payload & Transaksi Database:
                      </div>
                      <pre>{JSON.stringify(r.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
