import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  TrendingUp,
  PieChart,
  BarChart3,
  Scale,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface PimpinanDashboardProps {
  onNavigateToView: (view: any) => void;
}

export const PimpinanDashboardView: React.FC<PimpinanDashboardProps> = ({
  onNavigateToView,
}) => {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/fase7/dashboard/pimpinan');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching pimpinan stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-indigo-800/60 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-indigo-200">
              Eksekutif • Pengawasan Pimpinan
            </span>
            <span className="flex items-center text-xs text-indigo-300">
              <Scale className="mr-1 h-3.5 w-3.5 text-indigo-400" />
              Laporan Posisi Keuangan Pesantren
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Executive Dashboard Pimpinan</h1>
          <p className="mt-1 text-xs text-indigo-200 max-w-xl">
            Tinjauan strategis kesehatan finansial, neraca aset, realisasi anggaran, dan pengawasan akuntabilitas pesantren.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center space-x-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Primary KPI: Total Aset & Likuiditas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Aset */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Nilai Aset Pesantren</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-gray-900">
            {formatRupiah(stats?.totalAssets || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Kas + Bank + Investasi + Piutang
          </div>
        </div>

        {/* Kas & Bank (Likuiditas) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Likuiditas Kas + Bank</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-700">
            {formatRupiah(stats?.cashAndBank || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Dana siap pakai untuk operasional
          </div>
        </div>

        {/* Portofolio Investasi */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Aset Investasi Aktif</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-purple-700">
            {formatRupiah(stats?.totalInvestments || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Modal kemitraan produktif berjalan
          </div>
        </div>

        {/* Surplus / Defisit Berjalan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Surplus / (Defisit) Berjalan</span>
            <div className={`rounded-xl p-2 ${Number(stats?.surplusDefisit || 0) >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className={`mt-3 text-xl font-bold ${Number(stats?.surplusDefisit || 0) >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
            {formatRupiah(stats?.surplusDefisit || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Pendapatan dikurangi total beban
          </div>
        </div>
      </div>

      {/* Row 2: Pendapatan vs Beban & Realisasi Anggaran */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ringkasan Kinerja Keuangan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Kinerja Finansial (Laba Rugi / Aktivitas)
            </h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Bulan Berjalan
            </span>
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-teal-100 p-2 text-teal-700">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Total Pendapatan</p>
                  <p className="text-[11px] text-gray-500">SPP, Donasi, Wakaf, Bagi Hasil</p>
                </div>
              </div>
              <span className="text-sm font-bold text-teal-700">
                {formatRupiah(stats?.monthlyIncome || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Total Beban Operasional</p>
                  <p className="text-[11px] text-gray-500">Listrik, Gaji, ATK, Pemeliharaan</p>
                </div>
              </div>
              <span className="text-sm font-bold text-rose-700">
                {formatRupiah(stats?.monthlyExpense || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <span className="text-xs font-bold text-indigo-900">Status Neraca (Balance Sheet)</span>
              <span className="flex items-center text-xs font-bold text-emerald-700">
                <CheckCircle className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                BALANCE ✓ (Aset = Liabilitas + Dana)
              </span>
            </div>
          </div>
        </div>

        {/* Realisasi Anggaran Tahunan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Anggaran vs Realisasi (Tahun Berjalan)
            </h3>
            <button
              onClick={() => onNavigateToView('budget-vs-realization')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Lihat Detail →
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-gray-50 p-3">
                <span className="text-gray-500">Pagu Anggaran Disetujui</span>
                <p className="mt-1 text-base font-bold text-gray-900">
                  {formatRupiah(stats?.budgetSummary?.totalAllocated || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <span className="text-gray-500">Realisasi Terserap</span>
                <p className="mt-1 text-base font-bold text-indigo-700">
                  {formatRupiah(stats?.budgetSummary?.totalRealized || 0)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-gray-600">Persentase Penyerapan Anggaran</span>
                <span className="text-indigo-900 font-bold">
                  {stats?.budgetSummary?.percentage || 0}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, stats?.budgetSummary?.percentage || 0)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Sisa Pagu Anggaran Belum Terpakai: <span className="font-bold text-gray-800">{formatRupiah(stats?.budgetSummary?.remaining || 0)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pengawasan Manajerial (Approval, LPJ, Rekonsiliasi) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Pengajuan Menunggu Approval */}
        <div
          onClick={() => onNavigateToView('fund-requests')}
          className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 cursor-pointer hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-bold uppercase tracking-wider">Perlu Persetujuan Pimpinan</span>
            <Clock className="h-4 w-4 text-amber-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950">
            {stats?.pendingApprovalCount || 0}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Pengajuan dana unit/divisi menunggu keputusan persetujuan pimpinan
          </p>
        </div>

        {/* LPJ Belum Tuntas */}
        <div
          onClick={() => onNavigateToView('lpj-management')}
          className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 cursor-pointer hover:bg-rose-100/50 transition"
        >
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-xs font-bold uppercase tracking-wider">LPJ Belum Selesai</span>
            <FileCheck className="h-4 w-4 text-rose-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-950">
            {stats?.incompleteLpjCount || 0}
          </p>
          <p className="mt-1 text-xs text-rose-800">
            Kegiatan/unit yang belum menyerahkan LPJ atau belum menyetor sisa dana
          </p>
        </div>

        {/* Rekonsiliasi Kas & Bank */}
        <div
          onClick={() => onNavigateToView('bank-reconciliation')}
          className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 cursor-pointer hover:bg-blue-100/50 transition"
        >
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-xs font-bold uppercase tracking-wider">Rekonsiliasi Bank</span>
            <AlertTriangle className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-950">
            {stats?.unreconciledCount || 0}
          </p>
          <p className="mt-1 text-xs text-blue-800">
            Transaksi kas/bank memerlukan verifikasi kesesuaian rekening koran
          </p>
        </div>
      </div>
    </div>
  );
};
