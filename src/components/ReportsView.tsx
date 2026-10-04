import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, DashboardMetrics } from '../types/index.ts';

export const ReportsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportType, setReportType] = useState<'AKTIVITAS' | 'POSISI'>('AKTIVITAS');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        authFetch('/api/dashboard'),
        authFetch('/api/accounts'),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Laporan Keuangan Pesantren
          </h1>
          <p className="text-xs text-gray-500">
            Laporan Aktivitas (Laba/Rugi Surplus) dan Laporan Posisi Keuangan (Neraca)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setReportType('AKTIVITAS')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition ${
            reportType === 'AKTIVITAS'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Laporan Aktivitas (Pendapatan & Beban)
        </button>

        <button
          onClick={() => setReportType('POSISI')}
          className={`py-3 px-5 text-xs font-bold border-b-2 transition ${
            reportType === 'POSISI'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Laporan Posisi Keuangan (Aset & Dana)
        </button>
      </div>

      {/* Report Document Box */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Pesantren Letterhead */}
        <div className="border-b-2 border-emerald-900 pb-5 text-center">
          <h2 className="text-base font-bold uppercase tracking-wider text-emerald-950 sm:text-lg">
            Pondok Pesantren Darul Istiqomah
          </h2>
          <p className="text-xs text-gray-500">
            Kecamatan Ngambon / Temayang, Kabupaten Bojonegoro, Jawa Timur
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
            {reportType === 'AKTIVITAS'
              ? 'Laporan Aktivitas Keuangan (Surplus / Defisit Operasional)'
              : 'Laporan Posisi Keuangan (Neraca Kas & Aset)'}
          </p>
          <p className="text-[11px] text-gray-400">Periode Berjalan Tahun 2026</p>
        </div>

        {/* Content */}
        {reportType === 'AKTIVITAS' ? (
          <div className="mt-6 space-y-6 text-xs">
            {/* 1. Pendapatan */}
            <div>
              <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 p-2 font-bold text-emerald-900">
                <span>I. PENDAPATAN (PENERIMAAN)</span>
                <span>{metrics ? formatRupiah(metrics.pendapatan) : '...'}</span>
              </div>
              <div className="mt-2 divide-y divide-gray-100 pl-3">
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Penerimaan Infak & Sedekah</span>
                  <span className="font-mono">Rp 4.500.000</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Penerimaan SPP (Rekap Agregat)</span>
                  <span className="font-mono text-gray-400">Rp 0 (Tahap Berikutnya)</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Penerimaan Donasi & Hibah</span>
                  <span className="font-mono">Rp 0</span>
                </div>
              </div>
            </div>

            {/* 2. Beban */}
            <div>
              <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 p-2 font-bold text-rose-900">
                <span>II. BEBAN OPERASIONAL PESANTREN</span>
                <span>{metrics ? formatRupiah(metrics.beban) : '...'}</span>
              </div>
              <div className="mt-2 divide-y divide-gray-100 pl-3">
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Beban Dapur & Konsumsi Santri</span>
                  <span className="font-mono">Rp 1.750.000</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Beban Listrik (PLN) & Utilitas</span>
                  <span className="font-mono">Rp 3.200.000</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Beban Gaji & Honor Asatidz</span>
                  <span className="font-mono">Rp 0</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Beban Sarana Prasarana & Lainnya</span>
                  <span className="font-mono">Rp 0</span>
                </div>
              </div>
            </div>

            {/* Surplus/Defisit Total */}
            <div className="rounded-xl border border-gray-300 bg-gray-50 p-4 font-bold flex justify-between items-center text-sm">
              <span className="text-gray-900">SURPLUS / (DEFISIT) BERSIH</span>
              <span
                className={`font-mono text-base ${
                  (metrics?.surplusDefisit || 0) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {metrics ? formatRupiah(metrics.surplusDefisit) : '...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6 text-xs">
            {/* Posisi Aset */}
            <div>
              <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/60 p-2 font-bold text-blue-900">
                <span>ASET PESANTREN</span>
                <span>{metrics ? formatRupiah(metrics.totalAset) : '...'}</span>
              </div>
              <div className="mt-2 divide-y divide-gray-100 pl-3">
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Kas Fisik di Brankas Bendahara</span>
                  <span className="font-mono">{metrics ? formatRupiah(metrics.saldoKas) : '...'}</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Rekening Giro & Tabungan Bank (BSI)</span>
                  <span className="font-mono">{metrics ? formatRupiah(metrics.saldoBank) : '...'}</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Aset Tetap (Tanah, Gedung, Peralatan)</span>
                  <span className="font-mono">Tercatat di COA</span>
                </div>
              </div>
            </div>

            {/* Posisi Kewajiban & Dana */}
            <div>
              <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50/60 p-2 font-bold text-purple-900">
                <span>DANA / ASET NETO PESANTREN</span>
                <span>{metrics ? formatRupiah(metrics.totalAset) : '...'}</span>
              </div>
              <div className="mt-2 divide-y divide-gray-100 pl-3">
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Dana Tidak Terikat (Operasional Bebas)</span>
                  <span className="font-mono">Tersedia</span>
                </div>
                <div className="flex justify-between py-1.5 text-gray-700">
                  <span>Dana Terikat (Wakaf & Pembangunan)</span>
                  <span className="font-mono">Tersedia</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Line */}
        <div className="mt-12 grid grid-cols-2 pt-8 text-center text-xs text-gray-700">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold text-gray-900 mt-0.5">Pimpinan Pondok Pesantren</p>
            <div className="h-16" />
            <p className="font-bold underline">K.H. Pimpinan Darul Istiqomah</p>
          </div>
          <div>
            <p>Bojonegoro, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold text-gray-900 mt-0.5">Bendahara Umum</p>
            <div className="h-16" />
            <p className="font-bold underline">Ust. Bendahara Pesantren</p>
          </div>
        </div>
      </div>
    </div>
  );
};
