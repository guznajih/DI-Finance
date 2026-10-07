import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Search,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  X,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface BendaharaDashboardProps {
  onOpenSimpleModal: (type?: string) => void;
  onNavigateToView: (view: any) => void;
}

export const BendaharaDashboardView: React.FC<BendaharaDashboardProps> = ({
  onOpenSimpleModal,
  onNavigateToView,
}) => {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searching, setSearching] = useState<boolean>(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/fase7/dashboard/bendahara');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching bendahara stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await authFetch(`/api/fase7/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-teal-500/20 border border-teal-400/30 px-3 py-0.5 text-[11px] font-bold tracking-wider uppercase text-teal-300">
              Bendahara Keuangan
            </span>
            <span className="flex items-center text-xs text-slate-300">
              <CheckCircle className="mr-1 h-3.5 w-3.5 text-teal-400" />
              Double-Entry Otomatis
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl text-white">
            Dashboard Operasional Bendahara
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Pencatatan kas, bank, dan transaksi operasional pesantren dengan validasi double-entry dan verifikasi saldo real-time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onOpenSimpleModal('PENERIMAAN')}
            className="flex items-center space-x-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Penerimaan</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('PENGELUARAN')}
            className="flex items-center space-x-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Pengeluaran</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('TRANSFER')}
            className="flex items-center space-x-1.5 rounded-lg bg-slate-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-600 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Transfer Bank</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('INVESTASI')}
            className="flex items-center space-x-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Investasi</span>
          </button>
        </div>
      </div>

      {/* Smart Search Bar (Pencarian Bahasa Sederhana) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <form onSubmit={handleSmartSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Sparkles className="h-4 w-4 text-teal-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Pencarian cerdas contoh: "Pengeluaran listrik bulan September" atau "Pendapatan SPP"...'
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition disabled:opacity-50"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{searching ? 'Menganalisis...' : 'Cari Transaksi'}</span>
          </button>
        </form>

        {searchResult && (
          <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/50 p-3 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-950 flex items-center">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                {searchResult.filters?.explanation}
              </span>
              <button
                onClick={() => setSearchResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {searchResult.filters?.type && (
                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-teal-900 font-semibold">
                  Tipe: {searchResult.filters.type}
                </span>
              )}
              {searchResult.filters?.category && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-800 font-medium">
                  Kategori: {searchResult.filters.category}
                </span>
              )}
              {searchResult.filters?.monthName && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800 font-medium">
                  Bulan: {searchResult.filters.monthName}
                </span>
              )}
              <span className="text-slate-500 italic">
                (Filter otomatis diterapkan untuk mempermudah audit transaksi)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kas Tunai */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Kas Tunai</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700 border border-teal-100">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold text-slate-900">
            {formatRupiah(stats?.totalCash || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Kas fisik di kantor bendahara
          </div>
        </div>

        {/* Bank */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Bank Pesantren</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700 border border-teal-100">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold text-slate-900">
            {formatRupiah(stats?.totalBank || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Rekening giro & tabungan syariah
          </div>
        </div>

        {/* Penerimaan Bulan Ini */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Penerimaan Bulan Ini</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700 border border-teal-100">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold text-teal-700">
            {formatRupiah(stats?.monthlyIncome || 0)}
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-medium">
            SPP, Donasi, Infaq, Hasil Usaha
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-rose-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pengeluaran Bulan Ini</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-700 border border-rose-100">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold text-rose-700">
            {formatRupiah(stats?.monthlyExpense || 0)}
          </div>
          <div className="mt-2 text-[11px] text-rose-600 font-medium">
            Gaji, Listrik, Operasional Santri
          </div>
        </div>
      </div>

      {/* Operational Attention Cards (4 Kolom Status) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Investasi Berjalan */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-slate-800">
            <TrendingUp className="h-4 w-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Investasi Aktif</h3>
          </div>
          <p className="mt-2 font-mono text-lg font-bold text-slate-900">
            {formatRupiah(stats?.totalInvestments || 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Kemitraan & unit usaha produktif pesantren
          </p>
        </div>

        {/* Pengajuan Menunggu */}
        <div
          onClick={() => onNavigateToView('fund-requests')}
          className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 cursor-pointer hover:bg-amber-100/60 transition shadow-xs"
        >
          <div className="flex items-center justify-between text-amber-900">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Pengajuan Menunggu</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-amber-950">
            {stats?.pendingRequestsCount || 0} Pengajuan
          </p>
          <p className="mt-1 text-[11px] text-amber-700">
            Menunggu verifikasi dan pencairan kas/bank
          </p>
        </div>

        {/* LPJ Belum Selesai */}
        <div
          onClick={() => onNavigateToView('lpj-management')}
          className="rounded-2xl border border-rose-200/90 bg-rose-50/50 p-4 cursor-pointer hover:bg-rose-100/60 transition shadow-xs"
        >
          <div className="flex items-center justify-between text-rose-900">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider">LPJ Belum Selesai</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-rose-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-rose-950">
            {stats?.incompleteLpjCount || 0} Dokumen
          </p>
          <p className="mt-1 text-[11px] text-rose-700">
            Dana dicairkan belum tuntas di-LPJ-kan
          </p>
        </div>

        {/* Rekonsiliasi Bermasalah */}
        <div
          onClick={() => onNavigateToView('bank-reconciliation')}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 cursor-pointer hover:border-teal-300 transition shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Rekonsiliasi Bank</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {stats?.unreconciledCount || 0} Mutasi Perlu Cocok
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Dicocokkan dengan rekening koran bank
          </p>
        </div>
      </div>

      {/* Panduan Akuntansi Praktis Bendahara */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Prinsip Akuntansi Pesantren (Double-Entry Otomatis)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <span className="font-bold text-slate-900">1. Penerimaan Uang</span>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Debit akun Kas/Bank (aset bertambah) dan Kredit akun Pendapatan terkait. Sistem mengarahkan otomatis ke pos yang benar.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <span className="font-bold text-slate-900">2. Pengeluaran Operasional</span>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Debit akun Beban Operasional dan Kredit akun Kas/Bank (aset berkurang). Saldo rekening divalidasi mencegah defisit.
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
            <span className="font-bold text-slate-900">3. Investasi & Transfer</span>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Bukan merupakan beban atau pendapatan. Penempatan investasi mencatat pertukaran aset kas ke aset investasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
