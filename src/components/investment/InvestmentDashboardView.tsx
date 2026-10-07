import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Briefcase,
  ArrowUpRight,
  BadgePercent,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  PlusCircle,
  Scale,
  FileText,
  DollarSign,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { InvestmentDashboardSummary, Investment, InvestmentTransaction } from '../../types/index.ts';

interface InvestmentDashboardViewProps {
  setCurrentView: (view: any) => void;
}

export const InvestmentDashboardView: React.FC<InvestmentDashboardViewProps> = ({ setCurrentView }) => {
  const { user, authFetch } = useAuth();
  const [summary, setSummary] = useState<InvestmentDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch('/api/investments/dashboard');
      if (!res.ok) throw new Error('Gagal memuat ringkasan dashboard investasi');
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatRupiah = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700 border-gray-300',
      SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-300',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
      ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      MATURED: 'bg-purple-100 text-purple-800 border-purple-300',
      COMPLETED: 'bg-teal-100 text-teal-800 border-teal-300',
      PROBLEMATIC: 'bg-rose-100 text-rose-800 border-rose-300',
      CANCELLED: 'bg-slate-200 text-slate-700 border-slate-300',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-md mb-2">
              <ShieldCheck className="h-4 w-4" />
              Sistem Akuntansi Double-Entry Syariah
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dashboard Investasi Pesantren
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Monitoring real-time penempatan modal pada mitra/lembaga eksternal, penerimaan pendapatan bagi hasil,
              pengembalian modal, dan kepatuhan akuntansi tanpa mencampuradukkan aset dengan beban operasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all active:scale-95 border border-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button
              onClick={() => setCurrentView('investment-placement')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-bold text-emerald-950 transition-all shadow-md active:scale-95"
            >
              <ArrowUpRight className="h-4 w-4" />
              Penempatan Dana
            </button>
            <button
              onClick={() => setCurrentView('investment-profit')}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-xs font-bold text-amber-950 transition-all shadow-md active:scale-95"
            >
              <BadgePercent className="h-4 w-4" />
              Catat Bagi Hasil
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="text-xs font-semibold underline hover:text-rose-950"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Dana Investasi Berjalan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dana Sedang Diinvestasikan
            </span>
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">
            {formatRupiah(summary?.totalActiveInvested)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">
              {summary?.activeInvestmentsCount || 0} Portofolio Aktif
            </span>
            <span>· Modal Awal: {formatRupiah(summary?.totalInitialInvested)}</span>
          </div>
        </div>

        {/* Card 2: Total Bagi Hasil Diterima */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Bagi Hasil / Imbalan
            </span>
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
              <BadgePercent className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-900">
            {formatRupiah(summary?.totalProfitReceived)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Tercatat sebagai Pendapatan Investasi (4320)</span>
          </div>
        </div>

        {/* Card 3: Total Pengembalian Modal */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Modal Telah Dikembalikan
            </span>
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <RotateCcw className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-blue-900">
            {formatRupiah(summary?.totalCapitalReturned)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-700 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Murni pengurangan aset (Bukan Pendapatan)</span>
          </div>
        </div>

        {/* Card 4: Status & Risiko Portofolio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status Portofolio
            </span>
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 py-1.5 px-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Aktif</span>
              <p className="text-base font-black text-emerald-900">{summary?.activeInvestmentsCount || 0}</p>
            </div>
            <div className="rounded-lg bg-teal-50 py-1.5 px-2">
              <span className="text-[10px] font-bold text-teal-800 uppercase">Selesai</span>
              <p className="text-base font-black text-teal-900">{summary?.completedInvestmentsCount || 0}</p>
            </div>
            <div className="rounded-lg bg-purple-50 py-1.5 px-2">
              <span className="text-[10px] font-bold text-purple-800 uppercase">Jatuh Tempo</span>
              <p className="text-base font-black text-purple-900">{summary?.maturedInvestmentsCount || 0}</p>
            </div>
            <div className="rounded-lg bg-rose-50 py-1.5 px-2">
              <span className="text-[10px] font-bold text-rose-800 uppercase">Bermasalah</span>
              <p className="text-base font-black text-rose-900">{summary?.problematicInvestmentsCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner jika ada Investasi Jatuh Tempo atau Bermasalah */}
      {((summary?.upcomingMaturities && summary.upcomingMaturities.length > 0) || (summary?.problematicInvestmentsCount && summary.problematicInvestmentsCount > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.upcomingMaturities && summary.upcomingMaturities.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-amber-950 flex items-start gap-3 shadow-xs">
              <Clock className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-bold text-amber-900">
                  Perhatian: {summary.upcomingMaturities.length} Investasi Mendekati Jatuh Tempo (≤ 60 Hari)
                </span>
                <ul className="mt-1 space-y-1 text-xs text-amber-800">
                  {summary.upcomingMaturities.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex justify-between items-center">
                      <span>{item.investeeName} ({item.investmentNumber})</span>
                      <span className="font-bold">Tempo: {item.dueDate}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {summary.problematicInvestmentsCount && summary.problematicInvestmentsCount > 0 && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 text-rose-950 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-rose-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <span className="font-bold text-rose-900">
                  Perhatian: Terdapat {summary.problematicInvestmentsCount} Investasi Berstatus Bermasalah
                </span>
                <p className="mt-1 text-xs text-rose-800">
                  Lakukan peninjauan rekonsiliasi, pemanggilan mitra penanggung jawab (PIC), atau pertimbangan pengakuan penurunan nilai (impairment) secara legal.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Breakdown Section: By Investee & By Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Nilai Investasi per Perusahaan / Mitra */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Portofolio Penempatan Berdasarkan Perusahaan / Mitra
              </h2>
              <p className="text-xs text-slate-500">
                Alokasi modal berjalan dan realisasi imbal hasil per mitra investee
              </p>
            </div>
            <button
              onClick={() => setCurrentView('investment-list')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Nama Lembaga / Mitra</th>
                  <th className="py-2.5 px-3 text-right">Modal Awal</th>
                  <th className="py-2.5 px-3 text-right">Nilai Berjalan</th>
                  <th className="py-2.5 px-3 text-right">Bagi Hasil</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Portofolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary?.byInvestee && summary.byInvestee.length > 0 ? (
                  summary.byInvestee.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        {inv.investeeName}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono text-xs">
                        {formatRupiah(inv.initialCapital)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-xs">
                        {formatRupiah(inv.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-700 font-bold font-mono text-xs">
                        {formatRupiah(inv.profitReceived)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {inv.count}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      Belum ada data penempatan investasi terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (1 col): Distribusi Jenis Investasi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Distribusi Jenis Investasi
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Porsi instrumen berdasarkan akad & skema
            </p>

            <div className="space-y-4">
              {summary?.byType && summary.byType.length > 0 ? (
                summary.byType.map((t, idx) => {
                  const total = summary.totalActiveInvested || 1;
                  const pct = Math.round((t.currentValue / total) * 100);
                  const typeLabel: Record<string, string> = {
                    BAGI_HASIL: 'Bagi Hasil (Mudharabah/Musyarakah)',
                    PENYERTAAN_MODAL: 'Penyertaan Modal / Saham',
                    DEPOSITO: 'Deposito Syariah / Finansial',
                    LAINNYA: 'Investasi Lainnya',
                  };
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {typeLabel[t.type] || t.type}
                        </span>
                        <span className="font-mono text-slate-500">{pct}% ({t.count})</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-right font-mono font-bold text-slate-700">
                        {formatRupiah(t.currentValue)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Belum ada instrumen investasi aktif.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200/60 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Scale className="h-4 w-4 text-teal-600" />
              Prinsip Akuntansi Syariah
            </div>
            <p className="text-[11px] leading-relaxed">
              Modal investasi dicatat pada Akun 1150 (Aset). Bagi hasil dicatat pada Akun 4320 (Pendapatan). Pengembalian modal langsung memotong saldo modal tanpa mempengaruhi laba/rugi.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Transaksi Investasi Terakhir
            </h2>
            <p className="text-xs text-slate-500">
              Mutasi penempatan modal, penerimaan bagi hasil, dan pengembalian modal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('investment-reports')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Lihat Laporan Lengkap <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Investasi / Mitra</th>
                <th className="py-2.5 px-3">Jenis Transaksi</th>
                <th className="py-2.5 px-3">Rekening Kas/Bank</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                summary.recentTransactions.map((tx) => {
                  const txBadge: Record<string, { label: string; cls: string }> = {
                    PENEMPATAN: { label: 'Penempatan Modal', cls: 'bg-emerald-100 text-emerald-800' },
                    BAGI_HASIL: { label: 'Pendapatan Bagi Hasil', cls: 'bg-amber-100 text-amber-800' },
                    PENGEMBALIAN_MODAL: { label: 'Pengembalian Modal', cls: 'bg-blue-100 text-blue-800' },
                    PENYESUAIAN_NILAI: { label: 'Penyesuaian Nilai', cls: 'bg-rose-100 text-rose-800' },
                  };
                  const badge = txBadge[tx.type] || { label: tx.type, cls: 'bg-gray-100 text-gray-800' };

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-slate-800">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{tx.investeeName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.investmentNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">
                        {tx.bankName ? `${tx.bankName} (${tx.bankAccountNumber})` : tx.cashName || '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    Belum ada riwayat transaksi investasi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
