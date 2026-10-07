import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Clock,
  Coins,
  FileCheck,
  Landmark,
  Percent,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { LeadershipDashboardMetrics, Unit } from '../../types/index.ts';

export const LeadershipMonitoringView: React.FC = () => {
  const { authFetch } = useAuth();

  const [metrics, setMetrics] = useState<LeadershipDashboardMetrics | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('2026/2027');
  const [unitFilter, setUnitFilter] = useState<string>('');

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const fetchUnits = async () => {
    try {
      const res = await authFetch('/api/units');
      if (res.ok) setUnits(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fiscalYearFilter) params.append('fiscalYear', fiscalYearFilter);
      if (unitFilter) params.append('unitId', unitFilter);

      const res = await authFetch(`/api/monitoring/leadership?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat monitoring pimpinan');
      setMetrics(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data monitoring');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fiscalYearFilter, unitFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              FASE 4: DASHBOARD EKSEKUTIF
            </span>
            <span className="text-xs text-gray-500">Monitoring Real-Time Anggaran & Likuiditas</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Monitoring Pimpinan & Realisasi Anggaran
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Pantau total plafon anggaran, serapan riil belanja, sisa anggaran aktif, pipeline antrean pengajuan, dan status LPJ.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-gray-600">Tahun Anggaran:</span>
            <select
              value={fiscalYearFilter}
              onChange={(e) => setFiscalYearFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 focus:outline-none"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-gray-600">Unit / Divisi:</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="">Semua Unit Pendidikan</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
          Memuat metrik dan indikator pimpinan...
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Plafon Anggaran
                </span>
                <span className="rounded-lg bg-blue-50 p-2 text-blue-800">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-black text-gray-900">
                {formatRupiah(metrics.budget.totalAllocated)}
              </p>
              <div className="mt-2 text-[11px] text-gray-500">
                Alokasi disetujui ({fiscalYearFilter})
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Realisasi (Neto)
                </span>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-black text-teal-800">
                {formatRupiah(metrics.budget.totalRealized)}
              </p>
              <div className="mt-2 flex items-center space-x-1 text-[11px] font-bold text-emerald-800">
                <Percent className="h-3 w-3" />
                <span>Serapan: {metrics.budget.overallPercentage}%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Sisa Anggaran Tersedia
                </span>
                <span className="rounded-lg bg-amber-50 p-2 text-amber-800">
                  <Coins className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-black text-amber-900">
                {formatRupiah(metrics.budget.totalRemaining)}
              </p>
              <div className="mt-2 text-[11px] text-amber-800">
                {100 - metrics.budget.overallPercentage}% plafon belum terpakai
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Total Dicairkan
                </span>
                <span className="rounded-lg bg-indigo-50 p-2 text-indigo-800">
                  <Landmark className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-mono text-2xl font-black text-indigo-950">
                {formatRupiah(metrics.requests.totalAmountDisbursed)}
              </p>
              <div className="mt-2 text-[11px] text-gray-500">
                {metrics.requests.disbursed} pengajuan telah dicairkan
              </div>
            </div>
          </div>

          {/* Pipeline Pengajuan & Pertanggungjawaban Status */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Pipeline Pengajuan Dana */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-800" />
                <span>Pipeline Pengajuan Dana (Approval Queue)</span>
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Menunggu Cek</span>
                  <p className="mt-1 text-xl font-black text-amber-900">
                    {metrics.requests.waitingExamination}
                  </p>
                  <span className="text-[10px] text-amber-700">Oleh Bendahara</span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">Menunggu Approval</span>
                  <p className="mt-1 text-xl font-black text-blue-900">
                    {metrics.requests.waitingApproval}
                  </p>
                  <span className="text-[10px] text-blue-700">Oleh Pimpinan</span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Disetujui</span>
                  <p className="mt-1 text-xl font-black text-emerald-900">
                    {metrics.requests.approved}
                  </p>
                  <span className="text-[10px] text-emerald-700">Siap Dicairkan</span>
                </div>

                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-teal-900 block">Dicairkan</span>
                  <p className="mt-1 text-xl font-black text-teal-900">
                    {metrics.requests.disbursed}
                  </p>
                  <span className="text-[10px] text-teal-700">Sudah Terbayar</span>
                </div>
              </div>
            </div>

            {/* Status LPJ & Sisa Dana */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <FileCheck className="h-4 w-4 text-emerald-800" />
                <span>Monitoring Pertanggungjawaban (LPJ & Sisa Dana)</span>
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Belum LPJ</span>
                  <p className="mt-1 text-xl font-black text-amber-900">
                    {metrics.lpj.pendingLpj}
                  </p>
                  <span className="text-[10px] text-amber-700">Unit belum lapor</span>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-blue-800 block">Menunggu Review</span>
                  <p className="mt-1 text-xl font-black text-blue-900">
                    {metrics.lpj.waitingVerification}
                  </p>
                  <span className="text-[10px] text-blue-700">Perlu pemeriksaan</span>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">Revisi LPJ</span>
                  <p className="mt-1 text-xl font-black text-rose-900">
                    {metrics.lpj.needsRevision}
                  </p>
                  <span className="text-[10px] text-rose-700">Perlu perbaikan</span>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Sisa Belum Setor</span>
                  <p className="mt-1 text-base font-black font-mono text-emerald-900">
                    {formatRupiah(metrics.lpj.totalRemainingUnrefunded)}
                  </p>
                  <span className="text-[10px] text-emerald-700">Sisa riil dana</span>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Breakdown Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Rincian Serapan Anggaran Per Unit Pendidikan
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-3.5">Unit / Divisi</th>
                  <th className="p-3.5 text-right">Plafon Anggaran</th>
                  <th className="p-3.5 text-right">Realisasi (Neto)</th>
                  <th className="p-3.5 text-right">Sisa Anggaran</th>
                  <th className="p-3.5 text-center">Persentase</th>
                  <th className="p-3.5">Status Serapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans text-xs">
                {metrics.budget.byUnit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Belum ada data anggaran aktif untuk tahun ini.
                    </td>
                  </tr>
                ) : (
                  metrics.budget.byUnit.map((ub) => (
                    <tr key={ub.unitId} className="hover:bg-gray-50/70">
                      <td className="p-3.5 font-bold text-gray-900">
                        {ub.unitName} ({ub.unitCode})
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                        {formatRupiah(ub.allocated)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-teal-800">
                        {formatRupiah(ub.realized)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-900">
                        {formatRupiah(ub.remaining)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-emerald-800">
                          {ub.percentage}%
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ub.percentage > 90
                                ? 'bg-rose-500'
                                : ub.percentage > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, ub.percentage)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
