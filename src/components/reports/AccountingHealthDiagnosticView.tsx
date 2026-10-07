import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpenCheck,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Info,
  Landmark,
  Lightbulb,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface IntegrityCheckItem {
  checkId: string;
  title: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING';
  description: string;
  message: string;
  details?: any;
}

interface IntegrityReport {
  timestamp: string;
  allPassed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: IntegrityCheckItem[];
}

interface DebitCreditGuide {
  id: string;
  label: string;
  type: string;
  categoryName: string;
  accountCode: string;
  accountName: string;
  explanation: string;
}

export const AccountingHealthDiagnosticView: React.FC = () => {
  const { authFetch } = useAuth();
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [guides, setGuides] = useState<DebitCreditGuide[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('LISTRIK');
  const [activeTab, setActiveTab] = useState<'diagnostik' | 'panduan'>('diagnostik');

  const fetchDiagnosticData = async () => {
    setLoading(true);
    try {
      const [checkRes, guideRes] = await Promise.all([
        authFetch('/api/bendahara/integrity-checks'),
        authFetch('/api/bendahara/debit-credit-guides'),
      ]);

      if (checkRes.ok) {
        setIntegrityReport(await checkRes.json());
      }
      if (guideRes.ok) {
        const gList = await guideRes.json();
        setGuides(gList);
        if (gList.length > 0 && !selectedGuideId) {
          setSelectedGuideId(gList[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching diagnostic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnosticData();
  }, []);

  const selectedGuide = guides.find((g) => g.id === selectedGuideId) || guides[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-800" />
            <h1 className="text-xl font-black text-gray-900 tracking-tight sm:text-2xl">
              Diagnostik & Bantuan Bendahara
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pusat kendali pemeriksaan integritas pembukuan double-entry, deteksi anomali, dan panduan akuntansi pesantren
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDiagnosticData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Audit Ulang Sistem</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('diagnostik')}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'diagnostik'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>14 Kriteria Audit Kesehatan Pembukuan</span>
          {integrityReport && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                integrityReport.allPassed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {integrityReport.passedChecks}/{integrityReport.totalChecks} Lolos
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('panduan')}
          className={`flex items-center gap-2 pb-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'panduan'
              ? 'border-emerald-800 text-emerald-950'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Lightbulb className="h-4 w-4" />
          <span>Kamus & Panduan Debit-Kredit Pesantren</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            {guides.length} Pola
          </span>
        </button>
      </div>

      {activeTab === 'diagnostik' && (
        <div className="space-y-6">
          {/* Main Health Status Banner */}
          {integrityReport && (
            <div
              className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${
                integrityReport.allPassed
                  ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/50'
                  : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      integrityReport.allPassed
                        ? 'bg-emerald-800 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    {integrityReport.allPassed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <AlertTriangle className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      {integrityReport.allPassed
                        ? 'Pembukuan Pesantren 100% Sehat & Seimbang'
                        : `Ditemukan ${integrityReport.failedChecks} Catatan yang Memerlukan Perhatian Bendahara`}
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {integrityReport.allPassed
                        ? 'Seluruh transaksi berstatus POSTED memiliki jurnal double-entry seimbang, neraca balance, buku besar sinkron, dan arus kas konsisten.'
                        : 'Periksa daftar rincian di bawah untuk melakukan rekonsiliasi atau penyesuaian yang sah.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-[11px] font-bold text-gray-500 uppercase">
                      Audit Terakhir
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-800">
                      {new Date(integrityReport.timestamp).toLocaleTimeString('id-ID')} WIB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Check Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
                Menjalankan 14 kriteria pemeriksaan otomatis pembukuan...
              </div>
            ) : (
              integrityReport?.results.map((c) => {
                const isPassed = c.passed;
                return (
                  <div
                    key={c.checkId}
                    className={`rounded-xl border p-4.5 transition shadow-xs flex flex-col justify-between ${
                      isPassed
                        ? 'border-gray-200 bg-white'
                        : c.severity === 'CRITICAL'
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isPassed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-gray-900">{c.title}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isPassed ? 'LOLOS' : 'PERHATIAN'}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                        {c.description}
                      </p>

                      <div
                        className={`mt-3 rounded-lg p-2.5 text-xs font-medium ${
                          isPassed
                            ? 'bg-slate-50 text-gray-700 border border-gray-100'
                            : 'bg-rose-100/70 text-rose-900 border border-rose-200'
                        }`}
                      >
                        {c.message}
                      </div>
                    </div>

                    {c.details && !isPassed && (
                      <div className="mt-3 pt-2.5 border-t border-gray-200/60 text-[11px] text-gray-500 font-mono">
                        Detail: {JSON.stringify(c.details)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'panduan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guide Selector List */}
          <div className="space-y-2 lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 px-2">
                Pilih Jenis Transaksi
              </h3>
              <div className="space-y-1">
                {guides.map((g) => {
                  const isSel = g.id === selectedGuide?.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGuideId(g.id)}
                      className={`w-full text-left rounded-lg p-2.5 text-xs font-semibold transition flex items-center justify-between ${
                        isSel
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block font-bold">{g.label}</span>
                        <span
                          className={`text-[10px] ${
                            isSel ? 'text-emerald-200' : 'text-gray-400'
                          }`}
                        >
                          {g.categoryName} • {g.type}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Guide Explanation Card */}
          {selectedGuide && (
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                      {selectedGuide.categoryName}
                    </span>
                    <h2 className="text-lg font-black text-gray-900 mt-0.5">
                      {selectedGuide.label}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      selectedGuide.type === 'PENERIMAAN'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : selectedGuide.type === 'PENGELUARAN'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {selectedGuide.type}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Journal Flow Illustration */}
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <BookOpenCheck className="h-4 w-4 text-emerald-800" />
                      Konstruksi Jurnal Double-Entry
                    </h4>

                    {selectedGuide.type === 'PENERIMAAN' ? (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-emerald-800">
                            DEBIT : Kas / Bank Rekening Pesantren
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            (+ Aset Lancar Likuid)
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-gray-800">
                            KREDIT : {selectedGuide.accountCode} - {selectedGuide.accountName}
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            {selectedGuide.id === 'INVESTASI_PENGEMBALIAN'
                              ? '(- Saldo Aset Investasi)'
                              : '(+ Pos Pendapatan/Dana)'}
                          </span>
                        </div>
                      </div>
                    ) : selectedGuide.type === 'PENGELUARAN' ? (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-gray-800">
                            DEBIT : {selectedGuide.accountCode} - {selectedGuide.accountName}
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            {selectedGuide.id === 'INVESTASI_PENEMPATAN'
                              ? '(+ Aset Investasi, BUKAN Beban)'
                              : '(+ Beban Operasional)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-rose-700">
                            KREDIT : Kas / Bank Rekening Pesantren
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            (- Saldo Kas/Bank)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-emerald-800">
                            DEBIT : Kas/Bank Tujuan (+ Saldo Masuk)
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            (Rekening Penerima)
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="font-bold text-rose-700">
                            KREDIT : Kas/Bank Asal (- Saldo Keluar)
                          </span>
                          <span className="text-gray-500 font-sans text-[11px]">
                            (Rekening Pengirim)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Penjelasan Logika Akuntansi */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950">
                          Prinsip & Penjelasan Bendahara:
                        </h4>
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                          {selectedGuide.explanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Anti-Kesalahan Rule */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Aturan Penting Pencegahan Salah Catat:
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
                      <li>
                        Penempatan dana investasi <strong>BUKAN beban</strong> operasional, melainkan
                        perpindahan aset likuid ke aset investasi.
                      </li>
                      <li>
                        Pengembalian pokok modal investasi <strong>BUKAN pendapatan</strong>, melainkan
                        pemulihan aset kas/bank dan pengurangan aset investasi berjalan.
                      </li>
                      <li>
                        Transfer antar rekening bank/kas pesantren <strong>TIDAK BOLEH</strong> diakui
                        sebagai pendapatan maupun beban.
                      </li>
                      <li>
                        Setiap transaksi POSTED harus memiliki Debit = Kredit tanpa kompromi.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
