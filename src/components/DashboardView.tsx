import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  Landmark,
  PlusCircle,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { DashboardMetrics } from '../types/index.ts';
import { ViewType } from './Sidebar.tsx';

interface DashboardViewProps {
  setCurrentView: (view: ViewType) => void;
  openNewTransactionModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentView,
  openNewTransactionModal,
}) => {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/dashboard');
      if (!res.ok) throw new Error('Gagal mengambil data dashboard');
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Greetings */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 p-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-700/60 px-3 py-1 text-xs font-semibold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Tahun Buku Aktif 2026</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Sistem Akuntansi Pondok Pesantren
          </h1>
          <p className="mt-1 text-sm text-emerald-100">
            Pondok Pesantren Darul Istiqomah Bojonegoro • Sistem Double-Entry
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={openNewTransactionModal}
            className="flex items-center space-x-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-md transition hover:bg-amber-300 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Catat Transaksi</span>
          </button>
          <button
            onClick={() => setCurrentView('journals')}
            className="flex items-center space-x-2 rounded-xl bg-emerald-700/80 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
          >
            <BookOpen className="h-4 w-4 text-emerald-200" />
            <span>Lihat Jurnal</span>
          </button>
          <button
            onClick={fetchMetrics}
            className="flex items-center rounded-xl bg-emerald-800 p-2.5 text-emerald-200 transition hover:bg-emerald-700"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Saldo Kas */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Saldo Kas Tunai</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {metrics ? formatRupiah(metrics.saldoKas) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-gray-400">
            <span>Fisik brankas pondok</span>
          </div>
        </div>

        {/* 2. Saldo Bank */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Saldo Bank (BSI & Lainnya)</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {metrics ? formatRupiah(metrics.saldoBank) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-gray-400">
            <span>Rekening giro & tabungan</span>
          </div>
        </div>

        {/* 3. Total Aset */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Aset Pesantren</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {metrics ? formatRupiah(metrics.totalAset) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-gray-400">
            <span>Kas, Bank & Aset Tetap</span>
          </div>
        </div>

        {/* 4. Pendapatan */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Pendapatan</span>
            <div className="rounded-xl bg-green-50 p-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-green-700">
            {metrics ? formatRupiah(metrics.pendapatan) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-green-600">
            <ArrowUpRight className="h-3 w-3 mr-0.5" />
            <span>Infak, Hibah, SPP Agregat</span>
          </div>
        </div>

        {/* 5. Beban */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Beban</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-700">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-rose-700">
            {metrics ? formatRupiah(metrics.beban) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-rose-600">
            <ArrowDownRight className="h-3 w-3 mr-0.5" />
            <span>Dapur, Listrik, Operasional</span>
          </div>
        </div>

        {/* 6. Surplus / Defisit */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Surplus / (Defisit)</span>
            <div
              className={`rounded-xl p-2 ${
                (metrics?.surplusDefisit || 0) >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p
            className={`mt-3 text-lg font-bold ${
              (metrics?.surplusDefisit || 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {metrics ? formatRupiah(metrics.surplusDefisit) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-gray-400">
            <span>Net hasil operasional</span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Transactions & Important Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Transaksi Akuntansi Terbaru</h2>
              <p className="text-xs text-gray-500">
                Pencatatan real-time yang terhubung ke Jurnal Umum
              </p>
            </div>
            <button
              onClick={() => setCurrentView('transactions')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {metrics && metrics.recentTransactions && metrics.recentTransactions.length > 0 ? (
              metrics.recentTransactions.map((trx) => (
                <div key={trx.id} className="flex flex-col justify-between py-3.5 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {trx.transactionNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          trx.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trx.status}
                      </span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {trx.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-800">{trx.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                      <span>{trx.date}</span>
                      {trx.unitName && <span>• Unit: {trx.unitName}</span>}
                      {trx.fundName && <span>• Sumber: {trx.fundName}</span>}
                    </div>
                  </div>
                  <div className="mt-2 text-right sm:mt-0">
                    <span
                      className={`text-sm font-bold ${
                        trx.type === 'PENERIMAAN'
                          ? 'text-emerald-700'
                          : trx.type === 'PENGELUARAN'
                          ? 'text-rose-700'
                          : 'text-gray-900'
                      }`}
                    >
                      {trx.type === 'PENERIMAAN' ? '+' : trx.type === 'PENGELUARAN' ? '-' : ''}
                      {formatRupiah(Number(trx.totalAmount))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                Belum ada transaksi tercatat.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: System Master Status & SPP Note */}
        <div className="space-y-6">
          {/* SPP Architecture Notice */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-amber-950">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-amber-700" />
              <h3 className="font-bold text-sm">Modul SPP Eksternal</h3>
            </div>
            <p className="mt-2 text-xs text-amber-900 leading-relaxed">
              Sesuai ketentuan, <strong>Darul Istiqomah Finance</strong> tidak memproses tagihan atau kartu SPP per santri. Penerimaan SPP nantinya dicatat secara <strong>rekapitulasi agregat</strong> melalui akun <code>4110 - Pendapatan SPP (Rekap Agregat)</code>.
            </p>
          </div>

          {/* Master Data Quick Status */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900">Ringkasan Master Data</h3>
            <div className="mt-4 space-y-3">
              <div
                onClick={() => setCurrentView('units')}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-emerald-50"
              >
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">Unit / Divisi</p>
                  <p className="text-gray-400">Madrasah, Dapur, Kesantrean, dsb.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  {metrics?.counts?.units || 10} Unit
                </span>
              </div>

              <div
                onClick={() => setCurrentView('funds')}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-emerald-50"
              >
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">Sumber Dana</p>
                  <p className="text-gray-400">Operasional, Pembangunan, Wakaf, Infak</p>
                </div>
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800">
                  {metrics?.counts?.funds || 12} Dana
                </span>
              </div>

              <div
                onClick={() => setCurrentView('accounts')}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-emerald-50"
              >
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">Bagan Akun (COA)</p>
                  <p className="text-gray-400">Aset, Kewajiban, Dana, Pendapatan, Beban</p>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                  {metrics?.counts?.accounts || 45} Akun
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
