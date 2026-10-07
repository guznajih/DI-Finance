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
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-emerald-700/50 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-emerald-200">
              Tahap 7 • Operasional Bendahara
            </span>
            <span className="flex items-center text-xs text-emerald-300">
              <CheckCircle className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Double-Entry Otomatis
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Dashboard Bendahara Pesantren</h1>
          <p className="mt-1 text-xs text-emerald-100 max-w-xl">
            Pencatatan kas, bank, dan transaksi rutin menggunakan bahasa operasional tanpa perlu bingung menentukan debit atau kredit manual.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onOpenSimpleModal('PENERIMAAN')}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Penerimaan</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('PENGELUARAN')}
            className="flex items-center space-x-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Pengeluaran</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('TRANSFER')}
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Transfer</span>
          </button>
          <button
            onClick={() => onOpenSimpleModal('INVESTASI')}
            className="flex items-center space-x-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 transition active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Investasi</span>
          </button>
        </div>
      </div>

      {/* Smart Search Bar (Pencarian Bahasa Sederhana) */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
        <form onSubmit={handleSmartSearch} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Pencarian cerdas contoh: "Pengeluaran listrik bulan September" atau "Pendapatan SPP September"...'
              className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="w-full sm:w-auto flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{searching ? 'Menganalisis...' : 'Cari Transaksi'}</span>
          </button>
        </form>

        {searchResult && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-xs text-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-900 flex items-center">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                {searchResult.filters?.explanation}
              </span>
              <button
                onClick={() => setSearchResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {searchResult.filters?.type && (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 font-medium">
                  Tipe: {searchResult.filters.type}
                </span>
              )}
              {searchResult.filters?.category && (
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800 font-medium">
                  Kategori: {searchResult.filters.category}
                </span>
              )}
              {searchResult.filters?.monthName && (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800 font-medium">
                  Bulan: {searchResult.filters.monthName}
                </span>
              )}
              <span className="text-gray-500 italic">
                (Filter otomatis diterapkan untuk mempermudah pencarian bendahara)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Kas Tunai */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Saldo Kas Tunai</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-gray-900">
            {formatRupiah(stats?.totalCash || 0)}
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Uang fisik kas bendahara</span>
          </div>
        </div>

        {/* Bank */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Saldo Bank Pesantren</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-gray-900">
            {formatRupiah(stats?.totalBank || 0)}
          </div>
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>Rekening giro & tabungan syariah</span>
          </div>
        </div>

        {/* Penerimaan Bulan Ini */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Penerimaan Bulan Ini</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-teal-700">
            {formatRupiah(stats?.monthlyIncome || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            SPP, Donasi, Infaq, Hasil Usaha
          </div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pengeluaran Bulan Ini</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-rose-700">
            {formatRupiah(stats?.monthlyExpense || 0)}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Gaji, Listrik, Operasional Santri
          </div>
        </div>
      </div>

      {/* Operational Attention Cards (4 Kolom Status) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Investasi Berjalan */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
          <div className="flex items-center space-x-2 text-purple-900">
            <TrendingUp className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wide">Investasi Aktif</h3>
          </div>
          <p className="mt-2 text-lg font-bold text-purple-950">
            {formatRupiah(stats?.totalInvestments || 0)}
          </p>
          <p className="mt-1 text-[11px] text-purple-700">
            Dana kemitraan dan unit usaha produktif pesantren
          </p>
        </div>

        {/* Pengajuan Menunggu */}
        <div
          onClick={() => onNavigateToView('fund-requests')}
          className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 cursor-pointer hover:bg-amber-100/50 transition"
        >
          <div className="flex items-center justify-between text-amber-900">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">Pengajuan Menunggu</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
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
          className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 cursor-pointer hover:bg-rose-100/50 transition"
        >
          <div className="flex items-center justify-between text-rose-900">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">LPJ Belum Selesai</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-rose-700" />
          </div>
          <p className="mt-2 text-lg font-bold text-rose-950">
            {stats?.incompleteLpjCount || 0} Dokumen
          </p>
          <p className="mt-1 text-[11px] text-rose-700">
            Dana yang telah dicairkan dan belum LPJ tuntas
          </p>
        </div>

        {/* Rekonsiliasi Bermasalah */}
        <div
          onClick={() => onNavigateToView('bank-reconciliation')}
          className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 cursor-pointer hover:bg-blue-100/50 transition"
        >
          <div className="flex items-center justify-between text-blue-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wide">Rekonsiliasi Bank</h3>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-blue-700" />
          </div>
          <p className="mt-2 text-lg font-bold text-blue-950">
            {stats?.unreconciledCount || 0} Mutasi Selisih
          </p>
          <p className="mt-1 text-[11px] text-blue-700">
            Perlu dicocokkan dengan rekening koran bank
          </p>
        </div>
      </div>

      {/* Panduan Akuntansi Praktis Bendahara */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Prinsip Akuntansi Pesantren (Double-Entry Otomatis)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
            <span className="font-bold text-gray-900">1. Penerimaan Uang</span>
            <p className="mt-1 text-gray-600 leading-relaxed">
              Debit akun Kas/Bank (aset bertambah) dan Kredit akun Pendapatan terkait. Sistem mengarahkan otomatis ke pos yang benar.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
            <span className="font-bold text-gray-900">2. Pengeluaran Operasional</span>
            <p className="mt-1 text-gray-600 leading-relaxed">
              Debit akun Beban Operasional dan Kredit akun Kas/Bank (aset berkurang). Saldo rekening divalidasi mencegah defisit.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
            <span className="font-bold text-gray-900">3. Investasi & Transfer</span>
            <p className="mt-1 text-gray-600 leading-relaxed">
              Bukan merupakan beban atau pendapatan. Penempatan investasi mencatat pertukaran aset kas ke aset investasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
