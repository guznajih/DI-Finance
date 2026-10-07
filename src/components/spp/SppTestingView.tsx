import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  FileSpreadsheet,
  FlaskConical,
  GraduationCap,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { TestResultItem } from '../../types/index.ts';

export const SppTestingView: React.FC = () => {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAllTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await authFetch('/api/spp/testing/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menjalankan pengujian FASE 3');

      setResults(data.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat mengeksekusi rangkaian pengujian FASE 3');
    } finally {
      setRunning(false);
    }
  };

  const allPassed = results && results.length > 0 && results.every((r) => r.passed);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-amber-300">
            <FlaskConical className="h-4 w-4" />
            <span>SUITE PENGUJIAN OTOMATIS FASE 3</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Audit Otomatis Mesin SPP Agregat & Rekonsiliasi
          </h1>
          <p className="mt-1 text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Verifikasi menyeluruh 12 poin pengujian: Input SPP Agregat Rp100jt, Double-Entry Jurnal Debit Bank & Kredit Pendapatan SPP, Mutasi Saldo, Preview & Deteksi Duplikasi, Rekonsiliasi Sesuai vs Selisih, dan Audit Trail.
          </p>
        </div>

        <div>
          <button
            onClick={runAllTests}
            disabled={running}
            className="flex items-center space-x-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold text-emerald-950 shadow-md transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menjalankan 12 Poin Uji...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-emerald-950" />
                <span>Jalankan Pengujian FASE 3</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overall Status Banner */}
      {results && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-5 ${
            allPassed
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
              : 'border-rose-300 bg-rose-50 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            {allPassed ? (
              <ShieldCheck className="h-8 w-8 text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-base font-bold">
                {allPassed
                  ? 'SELURUH PENGUJIAN FASE 3 BERHASIL & LOLOS (100% PASSED)'
                  : 'BEBERAPA PENGUJIAN BELUM MEMENUHI SPESIFIKASI'}
              </h2>
              <p className="text-xs text-gray-600">
                Penerimaan SPP terbukti masuk ke mesin akuntansi double-entry tanpa data santri individu, deteksi duplikasi aktif, dan rekonsiliasi bank bekerja akurat.
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs font-extrabold ${
              allPassed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
            }`}
          >
            {results.filter((r) => r.passed).length} / {results.length} PASSED
          </span>
        </div>
      )}

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TEST 1 - 5 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-gray-400">POIN 1 - 5</span>
                <h3 className="font-bold text-sm text-gray-900">
                  Input SPP Rp100.000.000, Jurnal & Mutasi Saldo
                </h3>
              </div>
            </div>
            {results ? (
              results[0]?.passed ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>LOLOS</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>GAGAL</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Siap Uji</span>
              </span>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>1. Input SPP agregat Rp100.000.000</li>
              <li>2. Jurnal otomatis: DEBIT Bank Rp100jt & KREDIT Pendapatan SPP (4110) Rp100jt</li>
              <li>3. Saldo bank terbukti bertambah Rp100.000.000</li>
              <li>4. Total pendapatan terbukti bertambah Rp100.000.000</li>
              <li>5. Masuk ke Buku Bank, Buku Besar, dan Dashboard</li>
            </ul>
          </div>

          {results && results[0] && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[0].message}</p>
            </div>
          )}
        </div>

        {/* TEST 6 - 9 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-teal-100 p-2 text-teal-800">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-gray-400">POIN 6 - 9</span>
                <h3 className="font-bold text-sm text-gray-900">
                  Import File Excel/CSV, Preview & Deteksi Duplikasi
                </h3>
              </div>
            </div>
            {results ? (
              results[1]?.passed ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>LOLOS</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>GAGAL</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Siap Uji</span>
              </span>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>6. Import file Excel/CSV rekap SPP</li>
              <li>7. Pratinjau (Preview) tabel terurai sebelum posting</li>
              <li>8. Pengecekan otomatis potensi duplikasi kombinasi periode, unit, nominal</li>
              <li>9. Sistem memberikan banner peringatan sebelum konfirmasi</li>
            </ul>
          </div>

          {results && results[1] && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[1].message}</p>
            </div>
          )}
        </div>

        {/* TEST 10 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-gray-400">POIN 10</span>
                <h3 className="font-bold text-sm text-gray-900">
                  Uji Rekonsiliasi Nominal Sama (REKONSILIASI SESUAI)
                </h3>
              </div>
            </div>
            {results ? (
              results[2]?.passed ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>LOLOS</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>GAGAL</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Siap Uji</span>
              </span>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="text-gray-600">
              Pencocokan antara Rekap SPP (Rp 100.000.000) dengan Mutasi Rekening Bank (Rp 100.000.000). Sistem menetapkan status <strong>SUDAH_REKONSILIASI / SESUAI</strong> dengan selisih Rp 0.
            </p>
          </div>

          {results && results[2] && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[2].message}</p>
            </div>
          )}
        </div>

        {/* TEST 11 & 12 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-800">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold text-gray-400">POIN 11 & 12</span>
                <h3 className="font-bold text-sm text-gray-900">
                  Deteksi Selisih Rekonsiliasi & Jejak Audit Trail
                </h3>
              </div>
            </div>
            {results ? (
              results[3]?.passed && results[4]?.passed ? (
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>LOLOS</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>GAGAL</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Siap Uji</span>
              </span>
            )}
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="text-gray-600">
              Pencocokan antara Rekap SPP (Rp 50jt) vs Bank (Rp 48jt) terdeteksi <strong>SELISIH</strong> (-Rp 2.000.000). Seluruh rangkaian aksi penerimaan, import, dan rekonsiliasi terbukti tercatat di tabel <strong>audit_logs</strong>.
            </p>
          </div>

          {results && results[3] && results[4] && (
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs space-y-1">
              <p className="font-medium text-gray-800">• {results[3].message}</p>
              <p className="font-medium text-gray-800">• {results[4].message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
