import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  Edit2,
  Filter,
  GraduationCap,
  Landmark,
  Printer,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SppRekap } from '../../types/index.ts';

export const SppReconciliationView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [rekaps, setRekaps] = useState<SppRekap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reconciliation Modal
  const [selectedItem, setSelectedItem] = useState<SppRekap | null>(null);
  const [bankInputAmount, setBankInputAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRekaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('reconciliationStatus', statusFilter);

      const res = await authFetch(`/api/spp?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data rekonsiliasi SPP');
      setRekaps(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekaps();
  }, [statusFilter]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const openReconcileModal = (item: SppRekap) => {
    setSelectedItem(item);
    setBankInputAmount(item.reconciledAmount ? String(item.reconciledAmount) : String(item.amount));
    setNotes(item.reconciledNotes || '');
    setActionSuccess(null);
  };

  const handleSaveReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(`/api/spp/${selectedItem.id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAmount: parseFloat(bankInputAmount),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan rekonsiliasi');

      setActionSuccess(`Rekonsiliasi SPP ${selectedItem.rekapNumber} berhasil diperbarui.`);
      setSelectedItem(null);
      fetchRekaps();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal melakukan rekonsiliasi');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const totalRekapCount = rekaps.length;
  const sesuaiCount = rekaps.filter((r) => r.reconciliationStatus === 'SUDAH_REKONSILIASI').length;
  const selisihCount = rekaps.filter((r) => r.reconciliationStatus === 'SELISIH').length;
  const pendingCount = rekaps.filter((r) => r.reconciliationStatus === 'BELUM_REKONSILIASI').length;

  const filtered = rekaps.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.rekapNumber.toLowerCase().includes(q) ||
      r.period.toLowerCase().includes(q) ||
      (r.unitName || '').toLowerCase().includes(q) ||
      (r.bankName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
            <CheckSquare className="h-4 w-4" />
            <span>SPP → REKONSILIASI BANK VS APLIKASI SPP</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Rekonsiliasi Penerimaan SPP
          </h1>
          <p className="text-xs text-gray-500">
            Pencocokan tiga arah (Three-Way Matching): Rekap Aplikasi SPP vs Mutasi Rekening Bank vs Pencatatan Akuntansi
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak / PDF</span>
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

      {actionSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs text-gray-500">Total Rekap Terdaftar</span>
          <p className="mt-1 font-mono text-xl font-bold text-gray-900">{totalRekapCount}</p>
          <span className="text-[10px] text-gray-400">Seluruh entri batch SPP</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs text-emerald-800 font-medium">Rekonsiliasi Sesuai (Match)</span>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">{sesuaiCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Mutasi bank cocok 100% (Selisih Rp 0)</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-xs text-rose-800 font-medium">Terdapat Selisih</span>
          <p className="mt-1 font-mono text-xl font-bold text-rose-900">{selisihCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Ada ketidaksamaan nominal</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs text-amber-800 font-medium">Belum Direkonsiliasi</span>
          <p className="mt-1 font-mono text-xl font-bold text-amber-900">{pendingCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Menunggu pemeriksaan koran bank</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs min-w-[240px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. rekap, periode, unit, atau rekening bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-500">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">Semua Status Rekonsiliasi</option>
            <option value="SUDAH_REKONSILIASI">Sudah Direkonsiliasi (Sesuai)</option>
            <option value="SELISIH">Terdapat Selisih</option>
            <option value="BELUM_REKONSILIASI">Belum Direkonsiliasi</option>
          </select>
        </div>
      </div>

      {/* Matching Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="p-3.5">No. Rekap / Periode</th>
              <th className="p-3.5">Unit Pendidikan</th>
              <th className="p-3.5">Rekening Bank</th>
              <th className="p-3.5 text-right text-gray-700">1. Rekap SPP Eksternal</th>
              <th className="p-3.5 text-right text-teal-800">2. Mutasi Rekening Bank</th>
              <th className="p-3.5 text-right text-emerald-800">3. Pencatatan Akuntansi</th>
              <th className="p-3.5 text-right">Selisih</th>
              <th className="p-3.5 text-center">Status Rekonsiliasi</th>
              <th className="p-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Memuat data rekonsiliasi SPP...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400">
                  Tidak ada data rekonsiliasi yang sesuai.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isMatch = r.reconciliationStatus === 'SUDAH_REKONSILIASI';
                const isDiff = r.reconciliationStatus === 'SELISIH';
                const diffVal = Number(r.reconciledDifference || 0);

                return (
                  <tr key={r.id} className="hover:bg-gray-50/70">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-gray-900 block">{r.rekapNumber}</span>
                      <span className="text-[11px] text-gray-400">{r.period} (TA {r.academicYear})</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-emerald-900">{r.unitName}</span>
                    </td>
                    <td className="p-3.5 text-gray-700">
                      {r.bankName ? (
                        <>
                          <span className="font-bold text-gray-900">{r.bankName}</span>
                          <span className="block font-mono text-[11px] text-gray-400">{r.accountNumber}</span>
                        </>
                      ) : (
                        <span>Kas Tunai</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-gray-800">
                      {formatRupiah(r.amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-teal-900">
                      {r.reconciledAmount ? formatRupiah(r.reconciledAmount) : <span className="text-gray-400 font-normal">Belum Dicek</span>}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-900">
                      {formatRupiah(r.amount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold">
                      {isMatch ? (
                        <span className="text-emerald-700">Rp 0</span>
                      ) : isDiff ? (
                        <span className="text-rose-700 font-extrabold">{formatRupiah(diffVal)}</span>
                      ) : (
                        <span className="text-gray-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {isMatch ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>REKONSILIASI SESUAI</span>
                        </span>
                      ) : isDiff ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>SELISIH</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Belum Direkonsiliasi</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => openReconcileModal(r)}
                        className="rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-900 shadow-xs"
                      >
                        Cocokkan Bank
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECONCILIATION MATCHING MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Pencocokan Rekonsiliasi Bank
                </h3>
                <p className="text-xs text-gray-500">
                  Rekap SPP: <strong>{selectedItem.rekapNumber}</strong> ({selectedItem.period})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReconciliation} className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">1. Rekap Aplikasi SPP Eksternal:</span>
                  <span className="font-mono font-bold text-gray-900">{formatRupiah(selectedItem.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">2. Pencatatan DARUL ISTIQOMAH FINANCE:</span>
                  <span className="font-mono font-bold text-emerald-900">{formatRupiah(selectedItem.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Rekening Bank Penerima:</span>
                  <span className="font-semibold text-gray-800">{selectedItem.bankName} ({selectedItem.accountNumber})</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  NOMINAL MUTASI MASUK PADA REKENING BANK (RP) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={bankInputAmount}
                  onChange={(e) => setBankInputAmount(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 font-mono text-sm font-bold text-teal-950 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
                <span className="block mt-1 font-mono text-[11px] text-teal-800">
                  {formatRupiah(bankInputAmount || 0)}
                </span>
              </div>

              {/* Realtime Difference Preview */}
              {bankInputAmount && (
                <div
                  className={`rounded-xl p-3 font-semibold ${
                    Math.abs(parseFloat(bankInputAmount) - Number(selectedItem.amount)) < 0.01
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {Math.abs(parseFloat(bankInputAmount) - Number(selectedItem.amount)) < 0.01
                        ? '✓ REKONSILIASI SESUAI (Cocok 100%)'
                        : '⚠ TERDAPAT SELISIH NOMINAL'}
                    </span>
                    <span className="font-mono font-bold">
                      Selisih: {formatRupiah(parseFloat(bankInputAmount) - Number(selectedItem.amount))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  CATATAN / KETERANGAN PEMERIKSAAN
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Mutasi sesuai rekening koran BSI tgl 02/10/2026..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !bankInputAmount}
                  className="rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Hasil Rekonsiliasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
