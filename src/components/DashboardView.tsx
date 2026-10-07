import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CreditCard,
  DollarSign,
  Filter,
  Landmark,
  PlusCircle,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { DashboardMetrics, Fund, Unit } from '../types/index.ts';
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (Bulan, Tahun, Unit, Sumber Dana)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentMonth));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<string>('');

  const months = [
    { value: '', label: 'Semua Bulan (Kumulatif Tahunan)' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const years = ['2025', '2026', '2027'];

  // Fetch Units & Funds for filter dropdowns
  useEffect(() => {
    let isMounted = true;
    const fetchDropdowns = async () => {
      try {
        const [uRes, fRes] = await Promise.all([
          authFetch('/api/units').catch(() => null),
          authFetch('/api/funds').catch(() => null),
        ]);
        if (isMounted) {
          if (uRes && uRes.ok) {
            const uData = await uRes.json();
            setUnits(uData);
          }
          if (fRes && fRes.ok) {
            const fData = await fRes.json();
            setFunds(fData);
          }
        }
      } catch (e) {
        console.warn('Notice fetching dropdown filters:', e);
      }
    };
    fetchDropdowns();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchMetrics = async (retry = 0) => {
    setLoading(true);
    if (retry === 0) setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedUnit) params.append('unitId', selectedUnit);
      if (selectedFund) params.append('fundId', selectedFund);

      const res = await authFetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal mengambil data dashboard');
      }
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      if (retry < 2) {
        setTimeout(() => fetchMetrics(retry + 1), 800);
        return;
      }
      console.warn('Dashboard fetch warning:', err);
      setError(err.message || 'Gagal mengambil data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [selectedMonth, selectedYear, selectedUnit, selectedFund]);

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
            <span>Tahun Buku Aktif {selectedYear}</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            Sistem Keuangan Darul Istiqomah
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100">
            Pondok Pesantren Darul Istiqomah Bojonegoro • Mesin Transaksi & Akuntansi FASE 2
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setCurrentView('penerimaan')}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
          >
            <span>+ Penerimaan</span>
          </button>
          <button
            onClick={() => setCurrentView('pengeluaran')}
            className="flex items-center space-x-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
          >
            <span>- Pengeluaran</span>
          </button>
          <button
            onClick={() => setCurrentView('transfer')}
            className="flex items-center space-x-1.5 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-500 active:scale-95"
          >
            <span>Transfer Bank</span>
          </button>
          <button
            onClick={() => fetchMetrics(0)}
            className="flex items-center rounded-xl bg-emerald-950/60 p-2.5 text-emerald-200 transition hover:bg-emerald-900"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER BAR: Bulan, Tahun, Unit, Sumber Dana */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-700" />
              <span>BULAN</span>
            </span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-700" />
              <span>TAHUN</span>
            </span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            <span className="flex items-center space-x-1">
              <Filter className="h-3.5 w-3.5 text-emerald-700" />
              <span>UNIT / DIVISI</span>
            </span>
          </label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Unit / Divisi --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            <span className="flex items-center space-x-1">
              <Filter className="h-3.5 w-3.5 text-emerald-700" />
              <span>SUMBER DANA</span>
            </span>
          </label>
          <select
            value={selectedFund}
            onChange={(e) => setSelectedFund(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Sumber Dana --</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} - {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main KPI Metric Cards (6 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Saldo Kas */}
        <div
          onClick={() => setCurrentView('cash-book')}
          className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-emerald-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Saldo Kas Tunai</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {metrics ? formatRupiah(metrics.saldoKas) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-emerald-700 font-medium">
            <span>Buku Kas →</span>
          </div>
        </div>

        {/* 2. Saldo Bank */}
        <div
          onClick={() => setCurrentView('bank-book')}
          className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-teal-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Saldo Bank</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-teal-900">
            {metrics ? formatRupiah(metrics.saldoBank) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-teal-700 font-medium">
            <span>Buku Bank →</span>
          </div>
        </div>

        {/* 3. Total Kas + Bank */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Kas + Bank</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-lg font-bold text-gray-900">
            {metrics ? formatRupiah(metrics.totalKasBank || metrics.saldoKas + metrics.saldoBank) : '...'}
          </p>
          <div className="mt-1 flex items-center text-[11px] text-gray-400">
            <span>Likuiditas siap pakai</span>
          </div>
        </div>

        {/* 4. Total Pendapatan Bulan Berjalan */}
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

        {/* 5. Total Beban Bulan Berjalan */}
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
            <span>Operasional, Listrik, Dapur</span>
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

      {/* Saldo Masing-masing Bank (Individual Bank Breakdown) */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-teal-800" />
              <span>Rincian Saldo Masing-Masing Bank</span>
            </h2>
            <p className="text-xs text-gray-500">
              Rekening giro dan tabungan terdaftar di Darul Istiqomah Finance
            </p>
          </div>
          <button
            onClick={() => setCurrentView('bank-book')}
            className="text-xs font-bold text-teal-800 hover:underline"
          >
            Buka Buku Bank →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics && metrics.bankBalances && metrics.bankBalances.length > 0 ? (
            metrics.bankBalances.map((b) => (
              <div
                key={b.id}
                onClick={() => setCurrentView('bank-book')}
                className="cursor-pointer rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition hover:bg-teal-50/50 hover:border-teal-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-800">{b.bankName}</span>
                  <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800">
                    {b.accountNumber}
                  </span>
                </div>
                <p className="mt-2 font-mono text-base font-bold text-teal-950">
                  {formatRupiah(Number(b.balance))}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-gray-400">
              Belum ada data rekening bank.
            </div>
          )}
        </div>
      </div>

      {/* Grid: 10 Transaksi Terakhir & SPP Notification */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: 10 Transaksi Terakhir */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">10 Transaksi Terakhir</h2>
              <p className="text-xs text-gray-500">
                Pencatatan mutasi transaksi riil dari database
              </p>
            </div>
            <button
              onClick={() => setCurrentView('transactions')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline"
            >
              Lihat Semua Transaksi →
            </button>
          </div>

          <div className="mt-4 divide-y divide-gray-100">
            {metrics && metrics.recentTransactions && metrics.recentTransactions.length > 0 ? (
              metrics.recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex flex-col justify-between py-3.5 sm:flex-row sm:items-center"
                >
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

        {/* Right Col: SPP Note & Quick Navigation */}
        <div className="space-y-6">
          {/* FASE 5: Modul Investasi Pesantren Notice & Direct Action */}
          <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-emerald-50/70 p-5 text-teal-950 shadow-xs">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-teal-800" />
              <h3 className="font-bold text-sm">Modul Investasi Pesantren (FASE 5)</h3>
            </div>
            <p className="mt-2 text-xs text-teal-900 leading-relaxed">
              Penempatan modal pada mitra/perusahaan luar (Bukan Beban), penerimaan bagi hasil (Pendapatan), dan pengembalian modal (Pengurangan Aset Investasi 1150) yang terintegrasi penuh ke akuntansi double-entry.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentView('investment-dashboard')}
                className="rounded-lg bg-teal-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-900 shadow-xs"
              >
                Dashboard Investasi
              </button>
              <button
                onClick={() => setCurrentView('investment-placement')}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-800 shadow-xs"
              >
                + Penempatan Dana
              </button>
              <button
                onClick={() => setCurrentView('investment-profit')}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-amber-950 hover:bg-amber-400 shadow-xs"
              >
                + Catat Bagi Hasil
              </button>
              <button
                onClick={() => setCurrentView('investment-return')}
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-blue-800 shadow-xs"
              >
                Pengembalian Modal
              </button>
              <button
                onClick={() => setCurrentView('fase5-testing')}
                className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-[11px] font-bold text-teal-950 hover:bg-teal-50 shadow-xs"
              >
                Uji Otomatis FASE 5
              </button>
            </div>
          </div>

          {/* FASE 4: Anggaran & Pengajuan Dana Notice & Direct Action */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-950">
            <div className="flex items-center space-x-2">
              <Landmark className="h-5 w-5 text-emerald-800" />
              <h3 className="font-bold text-sm">Modul Anggaran & Pengajuan (FASE 4)</h3>
            </div>
            <p className="mt-2 text-xs text-emerald-900 leading-relaxed">
              Kelola rencana anggaran unit, alur pengajuan dana bertingkat, verifikasi bendahara & persetujuan pimpinan, pencairan kas/bank, hingga LPJ dan pengembalian sisa dana secara akuntabel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentView('fund-requests')}
                className="rounded-lg bg-emerald-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-900 shadow-xs"
              >
                + Pengajuan Dana
              </button>
              <button
                onClick={() => setCurrentView('budget-plan')}
                className="rounded-lg bg-teal-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-900 shadow-xs"
              >
                Rencana Anggaran
              </button>
              <button
                onClick={() => setCurrentView('lpj-management')}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-950 hover:bg-emerald-100"
              >
                LPJ & Sisa Dana
              </button>
              <button
                onClick={() => setCurrentView('monitoring-leadership')}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-950 hover:bg-emerald-100"
              >
                Monitoring Pimpinan
              </button>
            </div>
          </div>

          {/* SPP Rule Notice & Direct Action */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-950">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-amber-700" />
              <h3 className="font-bold text-sm">Modul SPP Agregat (FASE 3)</h3>
            </div>
            <p className="mt-2 text-xs text-amber-900 leading-relaxed">
              Sesuai prinsip akuntansi pondok pesantren, aplikasi tidak mengelola tagihan individu atau data santri. Pembayaran SPP dicatat secara rekapitulasi agregat melalui akun <code>4110 - Pendapatan SPP (Rekap Agregat)</code>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentView('spp-input')}
                className="rounded-lg bg-emerald-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-900 shadow-xs"
              >
                + Input SPP Agregat
              </button>
              <button
                onClick={() => setCurrentView('spp-import')}
                className="rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-teal-800 shadow-xs"
              >
                Import Excel/CSV
              </button>
              <button
                onClick={() => setCurrentView('spp-reconciliation')}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-950 hover:bg-amber-100"
              >
                Rekonsiliasi Bank
              </button>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900">Menu Cepat Keuangan</h3>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setCurrentView('penerimaan')}
                className="w-full flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-900"
              >
                <span>Penerimaan Kas/Bank (KM-...)</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setCurrentView('pengeluaran')}
                className="w-full flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-700 transition hover:bg-rose-50 hover:text-rose-900"
              >
                <span>Pengeluaran Kas/Bank (KK-...)</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setCurrentView('transfer')}
                className="w-full flex items-center justify-between rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-700 transition hover:bg-teal-50 hover:text-teal-900"
              >
                <span>Transfer Antar Kas/Bank (TRF-...)</span>
                <span>→</span>
              </button>
              <button
                onClick={() => setCurrentView('testing')}
                className="w-full flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100"
              >
                <span>Pengujian Akuntansi (4 Skenario)</span>
                <span>🧪</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
