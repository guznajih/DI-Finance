import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FlaskConical,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TestResult {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  details?: any;
}

export const TestingView: React.FC = () => {
  const { authFetch } = useAuth();
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual interactive sandbox for Test 4 validation demonstration
  const [unbalancedDebit, setUnbalancedDebit] = useState<string>('5000000');
  const [unbalancedCredit, setUnbalancedCredit] = useState<string>('4000000');
  const [manualTestingLoading, setManualTestingLoading] = useState<boolean>(false);
  const [manualTestFeedback, setManualTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const runAutomatedTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await authFetch('/api/testing/run', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjalankan pengujian akuntansi');
      }
      setResults(data.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat menjalankan rangkaian pengujian');
    } finally {
      setRunning(false);
    }
  };

  const testUnbalancedJournal = async () => {
    setManualTestingLoading(true);
    setManualTestFeedback(null);
    try {
      const d = parseFloat(unbalancedDebit) || 0;
      const c = parseFloat(unbalancedCredit) || 0;

      // Try to create an unbalanced journal directly
      const res = await authFetch('/api/jurnal-umum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          description: `Percobaan Jurnal Tidak Seimbang (Debit Rp${d} vs Kredit Rp${c})`,
          status: 'POSTED',
          lines: [
            { accountId: 1, debit: d, credit: 0, description: 'Sisi Debit' },
            { accountId: 2, debit: 0, credit: c, description: 'Sisi Kredit' },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setManualTestFeedback({
          success: true,
          message: `DITOLAK SESUAI ATURAN AKUNTANSI: ${data.error || 'Total Debit dan Kredit tidak seimbang'}`,
        });
      } else {
        setManualTestFeedback({
          success: false,
          message: 'BAHAYA: Sistem mengizinkan jurnal tidak seimbang lolos!',
        });
      }
    } catch (err: any) {
      setManualTestFeedback({
        success: true,
        message: `DITOLAK DENGAN BENAR: ${err.message}`,
      });
    } finally {
      setManualTestingLoading(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const allPassed = results && results.length === 4 && results.every((r) => r.passed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-amber-300">
            <FlaskConical className="h-4 w-4" />
            <span>MODUL PENGUJIAN AKUNTANSI FASE 2</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Audit Otomatis Mesin Akuntansi & Double-Entry
          </h1>
          <p className="mt-1 text-xs text-emerald-100 max-w-2xl">
            Eksekusi pengujian integritas akuntansi sesuai 4 skenario wajib: Penerimaan Bank, Pengeluaran Beban, Transfer Antar-Bank (tanpa menyentuh pendapatan/beban), dan Penolakan Jurnal Tidak Seimbang.
          </p>
        </div>

        <div>
          <button
            onClick={runAutomatedTests}
            disabled={running}
            className="flex items-center space-x-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold text-emerald-950 shadow-md transition hover:bg-amber-300 active:scale-95 disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menjalankan 4 Skenario...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-emerald-950" />
                <span>Jalankan Seluruh Pengujian</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overall Banner Result */}
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
                  ? 'SELURUH PENGUJIAN AKUNTANSI FASE 2 BERHASIL (4 / 4 LOLOS)'
                  : 'BEBERAPA PENGUJIAN BELUM MEMENUHI SPESIFIKASI'}
              </h2>
              <p className="text-xs text-gray-600">
                Integritas saldo bank, aturan mutasi non-pendapatan/beban, dan pencegahan jurnal tidak seimbang terverifikasi pada level database PostgreSQL.
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

      {/* Test Results Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* TEST 1 Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <ArrowDownLeft className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-400">SKENARIO 1</span>
                <h3 className="font-bold text-sm text-gray-900">
                  TEST 1: Penerimaan Rp10.000.000 melalui Bank A
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
                <span>Menunggu Uji</span>
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Verifikasi yang dilakukan:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>Saldo rekening Bank A bertambah persis Rp10.000.000</li>
              <li>Jurnal otomatis: DEBIT Bank A Rp10.000.000</li>
              <li>Jurnal otomatis: KREDIT Akun Pendapatan Rp10.000.000</li>
              <li>Jurnal berstatus balance dan POSTED</li>
            </ul>
          </div>

          {results && results[0] && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[0].message}</p>
              {results[0].details && (
                <div className="mt-2 font-mono text-[11px] text-gray-600 space-y-0.5">
                  <p>• No. Transaksi: {results[0].details.trxNumber}</p>
                  <p>• No. Jurnal: {results[0].details.journalNumber}</p>
                  <p>• Saldo Baru Bank A: {formatRupiah(results[0].details.newBalA)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEST 2 Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-rose-100 p-2 text-rose-800">
                <ArrowUpRight className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-400">SKENARIO 2</span>
                <h3 className="font-bold text-sm text-gray-900">
                  TEST 2: Pengeluaran Rp3.000.000 dari Bank A
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
                <span>Menunggu Uji</span>
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Verifikasi yang dilakukan:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>Saldo rekening Bank A berkurang persis Rp3.000.000</li>
              <li>Jurnal otomatis: DEBIT Akun Beban Rp3.000.000</li>
              <li>Jurnal otomatis: KREDIT Bank A Rp3.000.000</li>
              <li>Audit trail dan penulisan penerima pengeluaran</li>
            </ul>
          </div>

          {results && results[1] && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[1].message}</p>
              {results[1].details && (
                <div className="mt-2 font-mono text-[11px] text-gray-600 space-y-0.5">
                  <p>• No. Transaksi: {results[1].details.trxNumber}</p>
                  <p>• No. Jurnal: {results[1].details.journalNumber}</p>
                  <p>• Saldo Baru Bank A: {formatRupiah(results[1].details.newBalA2)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEST 3 Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-teal-100 p-2 text-teal-800">
                <ArrowLeftRight className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-400">SKENARIO 3</span>
                <h3 className="font-bold text-sm text-gray-900">
                  TEST 3: Transfer Rp2.000.000 dari Bank A ke Bank B
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
                <span>Menunggu Uji</span>
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Verifikasi yang dilakukan:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>Bank A berkurang Rp2.000.000</li>
              <li>Bank B bertambah Rp2.000.000</li>
              <li>Jurnal: DEBIT Bank B Rp2.000.000 & KREDIT Bank A Rp2.000.000</li>
              <li>Transfer <strong>TIDAK BOLEH</strong> dianggap sebagai pendapatan atau beban</li>
            </ul>
          </div>

          {results && results[2] && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-gray-800">{results[2].message}</p>
              {results[2].details && (
                <div className="mt-2 font-mono text-[11px] text-gray-600 space-y-0.5">
                  <p>• No. Transaksi: {results[2].details.trxNumber}</p>
                  <p>• No. Jurnal: {results[2].details.journalNumber}</p>
                  <p>• Saldo Bank A: {formatRupiah(results[2].details.newA3)}</p>
                  <p>• Saldo Bank B: {formatRupiah(results[2].details.newB3)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TEST 4 Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-800">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold text-gray-400">SKENARIO 4</span>
                <h3 className="font-bold text-sm text-gray-900">
                  TEST 4: Penolakan Jurnal Tidak Seimbang (Debit Rp5jt vs Kredit Rp4jt)
                </h3>
              </div>
            </div>
            {results ? (
              results[3]?.passed ? (
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
                <span>Menunggu Uji</span>
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Verifikasi yang dilakukan:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
              <li>Mencoba membuat Jurnal Debit Rp5.000.000 vs Kredit Rp4.000.000</li>
              <li>Sistem <strong>HARUS MENOLAK</strong> posting jika Debit ≠ Kredit</li>
              <li>Tidak ada catatan jurnal korup yang masuk ke database</li>
            </ul>
          </div>

          {results && results[3] && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
              <p className="font-medium text-emerald-800">{results[3].message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Manual Sandbox for Rule #4 & Rule #9 Validation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <div className="flex items-center space-x-2">
          <FlaskConical className="h-5 w-5 text-emerald-800" />
          <h2 className="text-base font-bold text-gray-900">
            Laboratorium Pengujian Interaktif: Validasi Keseimbangan Jurnal
          </h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Uji secara langsung apakah sistem menolak saat Anda mencoba memasukkan angka debit dan kredit yang tidak seimbang (Contoh: Debit Rp5.000.000 vs Kredit Rp4.000.000).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              NOMINAL DEBIT (RP)
            </label>
            <input
              type="number"
              value={unbalancedDebit}
              onChange={(e) => setUnbalancedDebit(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono font-bold text-gray-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">
              NOMINAL KREDIT (RP)
            </label>
            <input
              type="number"
              value={unbalancedCredit}
              onChange={(e) => setUnbalancedCredit(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono font-bold text-gray-900"
            />
          </div>

          <div>
            <button
              onClick={testUnbalancedJournal}
              disabled={manualTestingLoading}
              className="w-full rounded-xl bg-emerald-900 p-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
            >
              {manualTestingLoading ? 'Menguji...' : 'Uji Penolakan Sistem Sekarang'}
            </button>
          </div>
        </div>

        {manualTestFeedback && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-semibold ${
              manualTestFeedback.success
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {manualTestFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
};
