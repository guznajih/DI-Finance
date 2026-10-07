import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Scale,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface TestResult {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  details?: any;
}

export const Fase5TestingView: React.FC = () => {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runAllTests = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await authFetch('/api/fase5/testing/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menjalankan uji otomatis FASE 5');
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setRunning(false);
    }
  };

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-md mb-2">
              <FlaskConical className="h-4 w-4" />
              Automated Integrity Test Suite
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Pengujian Otomatis FASE 5: Modul Investasi Pesantren
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Verifikasi 9 skenario audit kepatuhan double-entry: Penempatan dana Rp 500jt (Debit Investasi, Kredit Bank), penerimaan bagi hasil Rp 30jt (Debit Bank, Kredit Pendapatan), pengembalian modal Rp 500jt (Debit Bank, Kredit Investasi), pengembalian parsial Rp 200jt (sisa Rp 300jt), validasi penolakan over-return, bukti non-beban, pengakuan pendapatan, dan keseimbangan jurnal 100%.
            </p>
          </div>

          <div>
            <button
              onClick={runAllTests}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black px-6 py-3 text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className={`h-4 w-4 fill-current ${running ? 'animate-spin' : ''}`} />
              {running ? 'Menjalankan Uji Sistem...' : 'Jalankan 9 Skenario Pengujian'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-bold underline">
            Tutup
          </button>
        </div>
      )}

      {/* Progress & Summary Bar */}
      {totalCount > 0 && (
        <div
          className={`rounded-2xl border p-5 shadow-xs transition-colors ${
            allPassed
              ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
              : 'border-amber-300 bg-amber-50/80 text-amber-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {allPassed ? (
                <div className="rounded-full bg-emerald-200 p-2 text-emerald-800">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-200 p-2 text-amber-800">
                  <AlertCircle className="h-6 w-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold">
                  {allPassed
                    ? 'SELURUH SKENARIO UJI FASE 5 LOLOS 100%'
                    : `${passedCount} dari ${totalCount} Skenario Lolos`}
                </h3>
                <p className="text-xs mt-0.5">
                  Integritas akuntansi syariah, mutasi kas/bank, jurnal double-entry, dan pencegahan kesalahan pencatatan terverifikasi aman.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-2xl font-black">
                {Math.round((passedCount / totalCount) * 100)}%
              </span>
              <span className="block text-[10px] uppercase font-bold text-slate-500">
                Tingkat Kepatuhan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {results.length === 0 && !running && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            <FlaskConical className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada hasil pengujian.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Klik tombol "Jalankan 9 Skenario Pengujian" di atas untuk memvalidasi integrasi modul investasi dengan mesin akuntansi double-entry secara otomatis.
            </p>
          </div>
        )}

        {results.map((r, idx) => (
          <div
            key={r.id || idx}
            className={`rounded-2xl border p-4 shadow-xs transition-all ${
              r.passed
                ? 'border-emerald-200 bg-white hover:border-emerald-300'
                : 'border-rose-200 bg-rose-50/50 hover:border-rose-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {r.passed ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {r.title}
                  </h4>
                  <p
                    className={`mt-1 text-xs leading-relaxed ${
                      r.passed ? 'text-slate-600' : 'text-rose-700 font-medium'
                    }`}
                  >
                    {r.message}
                  </p>

                  {r.details && (
                    <div className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] font-mono text-slate-700 border border-slate-200 overflow-x-auto">
                      <pre>{JSON.stringify(r.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {r.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
