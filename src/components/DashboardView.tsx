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

  const [budgetSummary, setBudgetSummary] = useState<{
    totalAllocated: number;
    totalRealized: number;
    percentage: number;
  } | null>(null);

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

      // Fetch budget summary for the selected year
      try {
        const bRes = await authFetch(`/api/budgets?fiscalYear=${selectedYear}`);
        if (bRes.ok) {
          const bList = await bRes.json();
          if (Array.isArray(bList) && bList.length > 0) {
            const alloc = bList.reduce((acc: number, b: any) => acc + Number(b.allocatedAmount || 0), 0);
            const real = bList.reduce((acc: number, b: any) => acc + Number(b.realizedAmount || 0), 0);
            const pct = alloc > 0 ? Math.round((real / alloc) * 100) : 0;
            setBudgetSummary({ totalAllocated: alloc, totalRealized: real, percentage: pct });
          } else {
            setBudgetSummary(null);
          }
        }
      } catch (be) {
        console.warn('Notice fetching budget summary:', be);
      }

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
      {/* Top Banner / Institutional Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full bg-teal-500/15 border border-teal-400/30 px-3 py-0.5 text-xs font-semibold text-teal-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Tahun Buku Aktif {selectedYear}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">Darul Istiqomah</span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl text-white">
            Dashboard Keuangan Pesantren
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Ikhtisar real-time pendapatan, beban operasional, posisi kas & bank, serta realisasi anggaran pondok pesantren.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCurrentView('penerimaan')}
            className="flex items-center space-x-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
          >
            <span>+ Penerimaan</span>
          </button>
          <button
            onClick={() => setCurrentView('pengeluaran')}
            className="flex items-center space-x-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
          >
            <span>- Pengeluaran</span>
          </button>
          <button
            onClick={() => setCurrentView('transfer')}
            className="flex items-center space-x-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-xs transition active:scale-95"
          >
            <span>Transfer Bank</span>
          </button>
          <button
            onClick={() => fetchMetrics(0)}
            className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER BAR: Bulan, Tahun, Unit, Sumber Dana */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4 items-end">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-teal-700" />
              <span>PERIODE BULAN</span>
            </span>
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-teal-700" />
              <span>TAHUN ANGGARAN</span>
            </span>
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Filter className="h-3.5 w-3.5 text-teal-700" />
              <span>UNIT / DIVISI</span>
            </span>
          </label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
          <label className="block text-[11px] font-bold text-slate-500 mb-1">
            <span className="flex items-center space-x-1">
              <Filter className="h-3.5 w-3.5 text-teal-700" />
              <span>SUMBER DANA</span>
            </span>
          </label>
          <select
            value={selectedFund}
            onChange={(e) => setSelectedFund(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-semibold text-slate-800 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
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
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main 5 Priority KPI Cards: Pemasukan, Beban, Surplus/Defisit, Saldo, Anggaran */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total Pemasukan */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pemasukan</span>
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700 border border-teal-100">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-xl font-bold text-teal-700">
            {metrics ? formatRupiah(metrics.pendapatan) : '...'}
          </p>
          <div className="mt-2 flex items-center text-[11px] text-teal-600 font-medium">
            <ArrowUpRight className="h-3 w-3 mr-0.5" />
            <span>SPP, Infak, Wakaf, Donasi</span>
          </div>
        </div>

        {/* 2. Total Beban / Pengeluaran */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-rose-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Beban / Pengeluaran</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-700 border border-rose-100">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-xl font-bold text-rose-700">
            {metrics ? formatRupiah(metrics.beban) : '...'}
          </p>
          <div className="mt-2 flex items-center text-[11px] text-rose-600 font-medium">
            <ArrowDownRight className="h-3 w-3 mr-0.5" />
            <span>Gaji, Utilitas Listrik, Dapur Santri</span>
          </div>
        </div>

        {/* 3. Surplus / (Defisit) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-amber-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Surplus / (Defisit)</span>
            <div
              className={`rounded-xl p-2 border ${
                (metrics?.surplusDefisit || 0) >= 0
                  ? 'bg-teal-50 text-teal-700 border-teal-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-3 font-mono text-xl font-bold ${
              (metrics?.surplusDefisit || 0) >= 0 ? 'text-teal-800' : 'text-rose-700'
            }`}
          >
            {metrics ? formatRupiah(metrics.surplusDefisit) : '...'}
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            {(metrics?.surplusDefisit || 0) >= 0 ? 'Surplus operasional bersih' : 'Defisit operasional berjalan'}
          </div>
        </div>

        {/* 4. Total Saldo (Kas + Bank) */}
        <div
          onClick={() => setCurrentView('cash-bank')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300 hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Saldo Likuiditas</span>
            <div className="rounded-xl bg-slate-50 p-2 text-slate-700 border border-slate-200">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-xl font-bold text-slate-900">
            {metrics ? formatRupiah(metrics.totalKasBank || metrics.saldoKas + metrics.saldoBank) : '...'}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Kas: {formatRupiah(metrics?.saldoKas || 0)}</span>
            <span className="text-teal-700 font-semibold">Kas & Bank →</span>
          </div>
        </div>

        {/* 5. Anggaran & Realisasi */}
        <div
          onClick={() => setCurrentView('budget-plan')}
          className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-teal-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pagu & Realisasi Anggaran</span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
              {budgetSummary ? `${budgetSummary.percentage}%` : 'Terserap'}
            </span>
          </div>
          <p className="mt-3 font-mono text-base font-bold text-slate-900">
            {budgetSummary ? formatRupiah(budgetSummary.totalRealized) : formatRupiah(metrics?.beban || 0)}
          </p>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            Pagu: {budgetSummary ? formatRupiah(budgetSummary.totalAllocated) : 'Terintegrasi APBP'}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, budgetSummary?.percentage || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* GRAFIK PEMASUKAN DAN PENGELUARAN (Visual Clean Chart) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600"></span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Grafik Komparasi Pemasukan vs Pengeluaran
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualisasi proporsi penerimaan operasional, realisasi beban pesantren, dan rasio surplus
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-sm bg-teal-600 inline-block"></span>
              <span className="text-slate-700">Pemasukan ({metrics ? formatRupiah(metrics.pendapatan) : 'Rp0'})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-sm bg-rose-600 inline-block"></span>
              <span className="text-slate-700">Beban ({metrics ? formatRupiah(metrics.beban) : 'Rp0'})</span>
            </div>
          </div>
        </div>

        {/* Chart Bars and Breakdown */}
        {(() => {
          const inc = Number(metrics?.pendapatan || 0);
          const exp = Number(metrics?.beban || 0);
          const maxVal = Math.max(inc, exp, 1);
          const incWidthPct = Math.round((inc / maxVal) * 100);
          const expWidthPct = Math.round((exp / maxVal) * 100);
          const surplus = inc - exp;
          const ratioPct = inc > 0 ? Math.round((exp / inc) * 100) : 0;

          return (
            <div className="mt-6 space-y-5">
              {/* Bar 1: Pemasukan */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-teal-900 flex items-center space-x-1">
                    <span>Total Pemasukan (SPP, Infak, Donasi, Hasil Usaha)</span>
                  </span>
                  <span className="font-mono text-teal-800">{formatRupiah(inc)} (100%)</span>
                </div>
                <div className="h-7 w-full rounded-lg bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full rounded-md bg-teal-600 transition-all duration-500 flex items-center justify-end pr-2 text-[11px] font-bold text-white"
                    style={{ width: `${Math.max(incWidthPct, 4)}%` }}
                  >
                    {incWidthPct > 15 ? `${incWidthPct}%` : ''}
                  </div>
                </div>
              </div>

              {/* Bar 2: Pengeluaran */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-rose-900 flex items-center space-x-1">
                    <span>Total Beban Operasional (Gaji, Listrik, Konsumsi, Pemeliharaan)</span>
                  </span>
                  <span className="font-mono text-rose-800">
                    {formatRupiah(exp)} ({inc > 0 ? `${ratioPct}% dari penerimaan` : '0%'})
                  </span>
                </div>
                <div className="h-7 w-full rounded-lg bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full rounded-md bg-rose-600 transition-all duration-500 flex items-center justify-end pr-2 text-[11px] font-bold text-white"
                    style={{ width: `${Math.max(expWidthPct, 4)}%` }}
                  >
                    {expWidthPct > 15 ? `${expWidthPct}%` : ''}
                  </div>
                </div>
              </div>

              {/* Summary Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Rasio Beban terhadap Pemasukan</span>
                  <p className="mt-1 font-mono text-base font-bold text-slate-800">
                    {ratioPct}%
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    {ratioPct <= 85 ? '✓ Beban berada dalam batas ideal (<85%)' : '⚠ Perlu perhatian pengetatan anggaran'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Net Hasil Operasional</span>
                  <p className={`mt-1 font-mono text-base font-bold ${surplus >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
                    {formatRupiah(surplus)}
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    {surplus >= 0 ? 'Surplus dialokasikan ke cadangan dana pesantren' : 'Defisit ditutup dari cadangan saldo kas'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100">
                  <span className="text-slate-500 font-medium">Realisasi Penyerapan Anggaran</span>
                  <p className="mt-1 font-mono text-base font-bold text-teal-800">
                    {budgetSummary?.percentage ?? 0}%
                  </p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Dari total pagu {budgetSummary ? formatRupiah(budgetSummary.totalAllocated) : 'Rencana Anggaran (RAPB)'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Saldo Masing-masing Bank (Individual Bank Breakdown) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-teal-700" />
              <span>Rincian Saldo Rekening Bank & Kas Pondok</span>
            </h2>
            <p className="text-xs text-slate-500">
              Rekening giro syariah dan tabungan resmi tercatat di sistem DI-Finance
            </p>
          </div>
          <button
            onClick={() => setCurrentView('bank-book')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
          >
            Buka Buku Bank →
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Kas Fisik Bendahara */}
          <div
            onClick={() => setCurrentView('cash-book')}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-teal-50/50 hover:border-teal-300"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Kas Tunai Bendahara</span>
              <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800">
                KAS FISIK
              </span>
            </div>
            <p className="mt-2 font-mono text-base font-bold text-teal-950">
              {metrics ? formatRupiah(metrics.saldoKas) : 'Rp0'}
            </p>
            <p className="mt-1 text-[10.5px] text-slate-400">Brankas kas operasional kantor</p>
          </div>

          {metrics && metrics.bankBalances && metrics.bankBalances.length > 0 ? (
            metrics.bankBalances.map((b) => (
              <div
                key={b.id}
                onClick={() => setCurrentView('bank-book')}
                className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-teal-50/50 hover:border-teal-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{b.bankName}</span>
                  <span className="rounded bg-teal-100 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-800">
                    {b.accountNumber}
                  </span>
                </div>
                <p className="mt-2 font-mono text-base font-bold text-teal-950">
                  {formatRupiah(Number(b.balance))}
                </p>
                <p className="mt-1 text-[10.5px] text-slate-400">Rekening aktif terverifikasi</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-4 text-center text-xs text-slate-400">
              Belum ada data rekening bank.
            </div>
          )}
        </div>
      </div>

      {/* Grid: 10 Transaksi Terakhir & Quick Module Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: 10 Transaksi Terakhir */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">10 Transaksi Terakhir</h2>
              <p className="text-xs text-slate-500">
                Pencatatan mutasi transaksi riil dari jurnal umum terposting
              </p>
            </div>
            <button
              onClick={() => setCurrentView('transactions')}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
            >
              Lihat Semua Transaksi →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {metrics && metrics.recentTransactions && metrics.recentTransactions.length > 0 ? (
              metrics.recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  className="flex flex-col justify-between py-3 sm:flex-row sm:items-center hover:bg-slate-50/80 px-2 rounded-lg transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {trx.transactionNumber}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                          trx.status === 'POSTED'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : trx.status === 'REVERSED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {trx.status}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {trx.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800">{trx.description}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>{trx.date}</span>
                      {trx.unitName && <span>• {trx.unitName}</span>}
                      {trx.fundName && <span>• {trx.fundName}</span>}
                    </div>
                  </div>
                  <div className="mt-2 text-right sm:mt-0">
                    <span
                      className={`font-mono text-sm font-bold ${
                        trx.type === 'PENERIMAAN'
                          ? 'text-teal-700'
                          : trx.type === 'PENGELUARAN'
                          ? 'text-rose-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {trx.type === 'PENERIMAAN' ? '+' : trx.type === 'PENGELUARAN' ? '-' : ''}
                      {formatRupiah(Number(trx.totalAmount))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
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
