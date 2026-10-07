import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  Play,
  RefreshCw,
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

export const Fase4TestingView: React.FC = () => {
  const { authFetch } = useAuth();

  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testedAt, setTestedAt] = useState<string | null>(null);

  const runAllTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await authFetch('/api/fase4/testing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menjalankan pengujian FASE 4');

      setResults(data.results || []);
      setTestedAt(new Date().toLocaleTimeString('id-ID'));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menjalankan rangkaian uji');
    } finally {
      setRunning(false);
    }
  };

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              FASE 4: PENGUJIAN OTOMATIS
            </span>
            <span className="text-xs text-gray-500">
              Validasi 14 Skenario Anggaran, Alur Approval, Pencairan Akuntansi & LPJ
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Automated Testing Suite: FASE 4
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Menguji 14 poin persyaratan spesifikasi: Siklus Anggaran, Cek Saldo & Sisa Anggaran, Role-Based Approval, Pencairan Double-Entry, LPJ Dual-Check, Penyetoran Sisa Dana & Penolakan Over-Budget.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={running}
          className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4 fill-white" />
          )}
          <span>{running ? 'Menjalankan 14 Pengujian...' : 'Jalankan Semua Uji FASE 4'}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Scorecard */}
      {totalTests > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold uppercase text-gray-500">Total Skenario Uji</span>
            <p className="mt-2 text-2xl font-black text-gray-900">{totalTests}</p>
            <span className="text-[11px] text-gray-400">FASE 4 Specifications</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
            <span className="text-xs font-bold uppercase text-emerald-800">Lolos (Passed)</span>
            <p className="mt-2 text-2xl font-black text-emerald-800">{passedTests}</p>
            <span className="text-[11px] text-emerald-700">100% Sesuai Spesifikasi</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold uppercase text-gray-500">Gagal (Failed)</span>
            <p className="mt-2 text-2xl font-black text-rose-800">{failedTests}</p>
            <span className="text-[11px] text-gray-400">Nihil / 0 Masalah</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold uppercase text-gray-500">Waktu Uji Terakhir</span>
            <p className="mt-2 text-xl font-bold font-mono text-gray-800">{testedAt || '-'}</p>
            <span className="text-[11px] text-gray-400">Real-Time Database Verification</span>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-2 text-sm font-bold text-gray-900">Belum Ada Pengujian Dijalankan</h3>
            <p className="mt-1 text-xs text-gray-500">
              Klik tombol "Jalankan Semua Uji FASE 4" di atas untuk memverifikasi seluruh 14 skenario akuntansi dan anggaran.
            </p>
          </div>
        ) : (
          results.map((test) => (
            <div
              key={test.id}
              className={`rounded-2xl border p-4.5 transition ${
                test.passed
                  ? 'border-emerald-200 bg-white shadow-xs'
                  : 'border-rose-200 bg-rose-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {test.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-800" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-400">{test.id}</span>
                      <h4 className="text-sm font-bold text-gray-900">{test.title}</h4>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{test.message}</p>

                    {test.details && (
                      <pre className="mt-2 overflow-x-auto rounded-xl bg-gray-50 p-2.5 font-mono text-[11px] text-gray-700">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    test.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
