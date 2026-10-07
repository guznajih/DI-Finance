import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FlaskConical,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const Fase7TestingView: React.FC = () => {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await authFetch('/api/fase7/testing/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menjalankan pengujian Tahap 7');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRunning(false);
    }
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-emerald-700/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Tahap 7 • Suite Pengujian Otomatis
            </span>
            <span className="flex items-center text-xs text-emerald-300">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              10 Skenario Wajib + Validasi Penolakan
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Automated Accounting & Operations Test Suite
          </h1>
          <p className="mt-1 text-xs text-emerald-200 max-w-xl">
            Menjalankan 14 skenario pengujian komprehensif mulai dari Penerimaan SPP Rp 100jt, Listrik Rp 5jt, Transfer Rp 20jt, Investasi Rp 50jt, Bagi Hasil Rp 3jt, Pengembalian Investasi Rp 20jt, Alur Pengajuan, Pencairan, LPJ, Pengembalian Sisa, Uji Negatif Saldo, Pencegahan Salah Klasifikasi, Mekanisme Koreksi Reversal, hingga 14 Indikator Health Check.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={running}
          className="flex items-center space-x-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-bold text-gray-950 shadow-md transition disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-950" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
          <span>{running ? 'Menjalankan Test...' : 'Jalankan Seluruh Test Tahap 7'}</span>
        </button>
      </div>

      {/* Test Metric Cards */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-gray-500">Total Pengujian</span>
            <p className="mt-1 text-2xl font-bold text-gray-900">{results.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-emerald-700">Lolos (Passed)</span>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{passedCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center shadow-xs">
            <span className="text-xs font-semibold text-rose-700">Gagal (Failed)</span>
            <p className="mt-1 text-2xl font-bold text-rose-700">{failedCount}</p>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Daftar Skenario Pengujian Tahap 7
          </h2>
          {results.length > 0 && (
            <span className="text-xs font-bold text-emerald-800">
              Tingkat Keberhasilan: {Math.round((passedCount / results.length) * 100)}%
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {results.map((t, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div key={idx} className="p-4 hover:bg-gray-50/80 transition">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                >
                  <div className="flex items-center space-x-3">
                    {t.passed ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{t.title}</h4>
                      <p className="mt-0.5 text-[11px] text-gray-500">{t.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        t.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.passed ? 'PASS ✓' : 'FAIL ✕'}
                    </span>
                    {t.details && (
                      <span className="text-gray-400">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && t.details && (
                  <div className="mt-3 rounded-xl bg-gray-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    <pre>{JSON.stringify(t.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}

          {results.length === 0 && !running && (
            <div className="p-12 text-center text-xs text-gray-400">
              <FlaskConical className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              Klik tombol &ldquo;Jalankan Seluruh Test Tahap 7&rdquo; untuk memulai verifikasi otomatis sistem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
