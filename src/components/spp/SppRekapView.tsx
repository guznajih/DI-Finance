import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  Filter,
  GraduationCap,
  Landmark,
  Plus,
  Printer,
  RefreshCw,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SppRekap, Unit } from '../../types/index.ts';
import { ViewType } from '../Sidebar.tsx';

interface SppRekapViewProps {
  setCurrentView?: (v: ViewType) => void;
}

export const SppRekapView: React.FC<SppRekapViewProps> = ({ setCurrentView }) => {
  const { authFetch, user } = useAuth();
  const [rekaps, setRekaps] = useState<SppRekap[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [recStatusFilter, setRecStatusFilter] = useState<string>('');

  // Detail Modal
  const [detailItem, setDetailItem] = useState<SppRekap | null>(null);

  const fetchUnits = async () => {
    try {
      const res = await authFetch('/api/units');
      if (res.ok) setUnits(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRekaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (periodFilter) params.append('period', periodFilter);
      if (academicYearFilter) params.append('academicYear', academicYearFilter);
      if (unitFilter) params.append('unitId', unitFilter);
      if (recStatusFilter) params.append('reconciliationStatus', recStatusFilter);

      const res = await authFetch(`/api/spp?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat rekap penerimaan SPP');
      const data = await res.json();
      setRekaps(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchRekaps();
  }, [periodFilter, academicYearFilter, unitFilter, recStatusFilter]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // KPIs
  const totalNominal = rekaps.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalSantriCount = rekaps.reduce((sum, r) => sum + (r.paymentCount || 0), 0);
  const reconciledCount = rekaps.filter((r) => r.reconciliationStatus === 'SUDAH_REKONSILIASI').length;
  const discrepancyCount = rekaps.filter(
    (r) => r.reconciliationStatus === 'SELISIH' || r.reconciliationStatus === 'PERLU_PEMERIKSAAN'
  ).length;

  const filteredRekaps = rekaps.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.rekapNumber.toLowerCase().includes(q) ||
      r.period.toLowerCase().includes(q) ||
      (r.unitName || '').toLowerCase().includes(q) ||
      (r.reference || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (rekaps.length === 0) return;
    const headers = [
      'No. Rekap SPP',
      'Tanggal',
      'Periode',
      'Tahun Ajaran',
      'Unit Pendidikan',
      'Rekening Tujuan',
      'Nominal (Rp)',
      'Jml Pembayaran Santri',
      'Sumber Data',
      'No. Referensi',
      'Status Rekonsiliasi',
      'Selisih Bank',
      'No. Transaksi Jurnal',
    ];
    const rows = filteredRekaps.map((r) => [
      `"${r.rekapNumber}"`,
      `"${r.date}"`,
      `"${r.period}"`,
      `"${r.academicYear}"`,
      `"${r.unitName || '-'}"`,
      `"${r.cashBankType === 'BANK' ? `${r.bankName} (${r.accountNumber})` : r.cashName || 'Kas Tunai'}"`,
      r.amount,
      r.paymentCount,
      `"${r.dataSource}"`,
      `"${r.reference || '-'}"`,
      `"${r.reconciliationStatus}"`,
      r.reconciledDifference || 0,
      `"${r.transactionNumber || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekap_Penerimaan_SPP_${new Date().toISOString().split('T')[0]}.csv`
    );
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
            <GraduationCap className="h-4 w-4" />
            <span>SPP → REKAP PENERIMAAN AGREGAT</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Rekapitulasi Penerimaan SPP
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan hasil rekapitulasi pembayaran SPP dari aplikasi eksternal yang terhubung langsung ke mesin akuntansi double-entry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setCurrentView && (
            <>
              <button
                onClick={() => setCurrentView('spp-input')}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-800 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Input Manual SPP</span>
              </button>
              <button
                onClick={() => setCurrentView('spp-import')}
                className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-600 active:scale-95"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Import File Rekap</span>
              </button>
            </>
          )}
          <button
            onClick={handleExportCSV}
            disabled={rekaps.length === 0}
            className="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak</span>
          </button>
          <button
            onClick={fetchRekaps}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500">Total Nominal SPP Teragregasi</span>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">
            {formatRupiah(totalNominal)}
          </p>
          <span className="text-[10px] text-gray-400">Dari {rekaps.length} entri batch rekap</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500">Total Transaksi Santri Eksternal</span>
          <p className="mt-1 font-mono text-xl font-bold text-teal-900">
            {totalSantriCount.toLocaleString('id-ID')}
          </p>
          <span className="text-[10px] text-gray-400">Pembayaran santri terdata di sistem SPP</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500">Sudah Direkonsiliasi Bank</span>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-700">
            {reconciledCount} Rekap
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Mutasi bank cocok 100%</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-gray-500">Selisih / Belum Sesuai</span>
          <p className={`mt-1 font-mono text-xl font-bold ${discrepancyCount > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
            {discrepancyCount} Rekap
          </p>
          <span className="text-[10px] text-gray-400">Memerlukan verifikasi bank</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:grid-cols-2 md:grid-cols-5 items-end">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">CARI REKAP SPP</label>
          <div className="flex items-center space-x-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no. rekap, periode, unit, atau referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-gray-800"
            />
          </div>
        </div>

        {/* Unit Filter */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">UNIT PENDIDIKAN</label>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Unit --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tahun Ajaran */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">TAHUN AJARAN</label>
          <select
            value={academicYearFilter}
            onChange={(e) => setAcademicYearFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua TA --</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>

        {/* Status Rekonsiliasi */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">REKONSILIASI</label>
          <select
            value={recStatusFilter}
            onChange={(e) => setRecStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Status --</option>
            <option value="BELUM_REKONSILIASI">Belum Direkonsiliasi</option>
            <option value="SUDAH_REKONSILIASI">Sudah Direkonsiliasi (Sesuai)</option>
            <option value="SELISIH">Terdapat Selisih</option>
            <option value="PERLU_PEMERIKSAAN">Perlu Pemeriksaan</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3.5">No. Rekap</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Periode / TA</th>
              <th className="px-4 py-3.5">Unit Pendidikan</th>
              <th className="px-4 py-3.5">Rekening Tujuan</th>
              <th className="px-4 py-3.5 text-right">Nominal Agregat</th>
              <th className="px-4 py-3.5 text-center">Jml Transaksi</th>
              <th className="px-4 py-3.5 text-center">Rekonsiliasi</th>
              <th className="px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Memuat data rekapitulasi SPP...
                </td>
              </tr>
            ) : filteredRekaps.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Belum ada data rekap SPP yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filteredRekaps.map((r) => {
                const isReconciled = r.reconciliationStatus === 'SUDAH_REKONSILIASI';
                const isDifference = r.reconciliationStatus === 'SELISIH';
                return (
                  <tr key={r.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-950 whitespace-nowrap">
                      {r.rekapNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{r.period}</span>
                      <span className="block text-[11px] text-gray-400">TA {r.academicYear}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        {r.unitName || r.unitCode || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {r.cashBankType === 'BANK' ? (
                        <span>
                          <strong className="text-gray-900">{r.bankName}</strong>{' '}
                          <span className="font-mono text-[11px] text-gray-400">({r.accountNumber})</span>
                        </span>
                      ) : (
                        <span>{r.cashName || 'Kas Tunai'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-900 whitespace-nowrap">
                      {formatRupiah(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-gray-600">
                      {r.paymentCount > 0 ? `${r.paymentCount} Santri` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isReconciled
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDifference
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReconciled && <span>✓ Sesuai</span>}
                        {isDifference && <span>⚠ Selisih</span>}
                        {!isReconciled && !isDifference && <span>Belum Uji</span>}
                      </span>
                      {isDifference && Number(r.reconciledDifference) !== 0 && (
                        <span className="block font-mono text-[10px] font-bold text-rose-700">
                          {formatRupiah(r.reconciledDifference || 0)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDetailItem(r)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-900"
                        title="Lihat Detail Transaksi & Jurnal"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Detail Rekap SPP: {detailItem.rekapNumber}
                </h3>
                <p className="text-xs text-gray-500">Informasi terhubung ke jurnal akuntansi double-entry</p>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500">Tanggal Penerimaan:</span>
                <p className="font-semibold text-gray-900">{detailItem.date}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Periode & Tahun Ajaran:</span>
                <p className="font-semibold text-gray-900">{detailItem.period} (TA {detailItem.academicYear})</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Unit Pendidikan:</span>
                <p className="font-semibold text-gray-900">{detailItem.unitName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Rekening Tujuan:</span>
                <p className="font-semibold text-gray-900">
                  {detailItem.cashBankType === 'BANK' ? `${detailItem.bankName} (${detailItem.accountNumber})` : detailItem.cashName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Nominal Agregat:</span>
                <p className="font-mono text-base font-bold text-emerald-900">{formatRupiah(detailItem.amount)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Jumlah Transaksi Pembayaran Santri:</span>
                <p className="font-mono font-bold text-gray-900">{detailItem.paymentCount || 0} Santri</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Sumber Data:</span>
                <p className="font-semibold text-gray-900">{detailItem.dataSource}</p>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500">Nomor Referensi:</span>
                <p className="font-mono text-gray-900">{detailItem.reference || '-'}</p>
              </div>

              <div className="col-span-2 space-y-1 border-t pt-2">
                <span className="text-gray-500">Keterangan:</span>
                <p className="text-gray-800">{detailItem.description || '-'}</p>
              </div>

              <div className="col-span-2 space-y-1 rounded-xl bg-gray-50 p-3">
                <span className="font-bold text-gray-700">Integrasi Akuntansi FASE 2:</span>
                <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>• No. Transaksi: <strong>{detailItem.transactionNumber || '-'}</strong></div>
                  <div>• No. Jurnal: <strong>{detailItem.journalNumber || '-'}</strong></div>
                  <div>• Jurnal Sisi Debit: <strong>{detailItem.bankName || 'Kas/Bank'}</strong></div>
                  <div>• Jurnal Sisi Kredit: <strong>4110 - Pendapatan SPP (Rekap Agregat)</strong></div>
                </div>
              </div>

              <div className="col-span-2 space-y-1 rounded-xl bg-teal-50 p-3 text-teal-950">
                <span className="font-bold">Status Rekonsiliasi Bank:</span>
                <p className="text-xs">
                  {detailItem.reconciliationStatus === 'SUDAH_REKONSILIASI'
                    ? '✓ Rekonsiliasi Sesuai 100% dengan Mutasi Bank'
                    : detailItem.reconciliationStatus === 'SELISIH'
                    ? `⚠ Terdapat Selisih ${formatRupiah(detailItem.reconciledDifference || 0)}`
                    : 'Belum Direkonsiliasi dengan rekening koran bank'}
                </p>
                {detailItem.reconciledNotes && (
                  <p className="text-[11px] italic text-teal-800">Catatan: {detailItem.reconciledNotes}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
