import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  GraduationCap,
  Landmark,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SppReportSummary, Unit } from '../../types/index.ts';

export const SppReportsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [data, setData] = useState<SppReportSummary | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [academicYear, setAcademicYear] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchUnits = async () => {
    try {
      const res = await authFetch('/api/units');
      if (res.ok) setUnits(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (unitFilter) params.append('unitId', unitFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await authFetch(`/api/spp/reports?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching SPP report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [academicYear, unitFilter, startDate, endDate]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Kategori / Unit', 'Periode / TA', 'Rekening', 'Nominal (Rp)', 'Jml Santri', 'Status Rekonsiliasi'];
    const rows: any[] = [];

    // Rows from byUnit
    data.byUnit.forEach((u) => {
      rows.push([`"${u.unitName}"`, `"${academicYear || 'Semua TA'}"`, '-', u.totalAmount, u.totalPayments, '-']);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Analisis_SPP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <BarChart3 className="h-4 w-4" />
            <span>SPP → LAPORAN ANALISIS REKAPITULASI</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Laporan Penerimaan SPP Agregat
          </h1>
          <p className="text-xs text-gray-500">
            Analisis tren penerimaan SPP per bulan, per tahun ajaran, per unit pendidikan, dan status rekonsiliasi bank
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak / PDF</span>
          </button>
          <button
            onClick={fetchReport}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:grid-cols-4 items-end">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">TAHUN AJARAN</label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">Semua Tahun Ajaran</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">UNIT PENDIDIKAN</label>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">Semua Unit Pendidikan</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">DARI TANGGAL</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">SAMPAI TANGGAL</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs text-gray-500">Total Penerimaan SPP</span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-950">
              {formatRupiah(data.totalAmount)}
            </p>
            <span className="text-[11px] text-gray-400">Tercatat di akun Pendapatan SPP (4110)</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs text-gray-500">Total Transaksi Santri</span>
            <p className="mt-1 font-mono text-2xl font-bold text-teal-900">
              {data.totalPayments.toLocaleString('id-ID')} Santri
            </p>
            <span className="text-[11px] text-teal-700 font-medium">Pembayaran di aplikasi luar</span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
            <span className="text-xs text-emerald-800 font-medium">Rekonsiliasi Sesuai</span>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-900">
              {data.reconciledCount} Rekap
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Cocok dengan mutasi rekening bank</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <span className="text-xs text-amber-800 font-medium">Selisih / Belum Selesai</span>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-900">
              {data.differenceCount + data.unreconciledCount} Rekap
            </p>
            <span className="text-[11px] text-amber-700 font-medium">
              Selisih nominal: {formatRupiah(data.totalDifference)}
            </span>
          </div>
        </div>
      )}

      {/* Grid: Penerimaan per Unit & Penerimaan per Rekening */}
      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 1. Penerimaan per Unit Pendidikan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b pb-3 flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-emerald-800" />
              <span>Penerimaan SPP per Unit Pendidikan</span>
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {data.byUnit.map((u) => (
                <div key={u.unitId} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-xs text-gray-900">{u.unitName}</span>
                    <span className="block text-[11px] text-gray-400">
                      {u.count} Batch Rekap • {u.totalPayments} Santri
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-900">
                      {formatRupiah(u.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Penerimaan per Rekening Bank */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b pb-3 flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-teal-800" />
              <span>Penerimaan SPP per Rekening Bank / Kas</span>
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {data.byAccount.map((acc, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-xs text-gray-900">{acc.name}</span>
                    <span className="block text-[11px] text-gray-400">
                      {acc.count} Transaksi Masuk
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-teal-900">
                      {formatRupiah(acc.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Penerimaan per Bulan & Per Tahun Ajaran */}
      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 3. Penerimaan per Bulan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b pb-3 flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-emerald-800" />
              <span>Penerimaan SPP per Periode Bulan</span>
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {data.byMonth.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-xs text-gray-900">{m.period}</span>
                    <span className="block text-[11px] text-gray-400">
                      {m.count} Rekap • {m.totalPayments} Santri
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-900">
                      {formatRupiah(m.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Penerimaan per Tahun Ajaran */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold text-gray-900 border-b pb-3 flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-emerald-800" />
              <span>Penerimaan SPP per Tahun Ajaran</span>
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {data.byAcademicYear.map((y, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <div>
                    <span className="font-semibold text-xs text-gray-900">Tahun Ajaran {y.academicYear}</span>
                    <span className="block text-[11px] text-gray-400">
                      {y.count} Rekap • {y.totalPayments} Santri
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-900">
                      {formatRupiah(y.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discrepancies Table if any */}
      {data && data.discrepancies.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-bold text-rose-950 border-b border-rose-100 pb-3 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>Rincian Rekap SPP dengan Selisih Rekonsiliasi Bank</span>
          </h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50 text-rose-900 font-bold border-b border-rose-100">
                <tr>
                  <th className="p-3">No. Rekap</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Rekap SPP</th>
                  <th className="p-3 text-right">Mutasi Bank</th>
                  <th className="p-3 text-right">Selisih</th>
                  <th className="p-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs">
                {data.discrepancies.map((d) => (
                  <tr key={d.id}>
                    <td className="p-3 font-bold text-gray-900">{d.rekapNumber}</td>
                    <td className="p-3 font-sans">{d.period}</td>
                    <td className="p-3 font-sans font-semibold text-gray-800">{d.unitName}</td>
                    <td className="p-3 text-right text-gray-700">{formatRupiah(d.amount)}</td>
                    <td className="p-3 text-right text-teal-900">{formatRupiah(d.reconciledAmount || 0)}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{formatRupiah(d.reconciledDifference || 0)}</td>
                    <td className="p-3 font-sans text-gray-500">{d.reconciledNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
