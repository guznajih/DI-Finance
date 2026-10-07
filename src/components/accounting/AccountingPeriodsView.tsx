import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AccountingPeriod {
  periodKey: string;
  year: number;
  month: number;
  monthName: string;
  status: 'OPEN' | 'CLOSED';
  closedBy?: { id: number; name: string; email: string } | null;
  closedAt?: string | null;
  reopenedBy?: { id: number; name: string; email: string } | null;
  reopenedAt?: string | null;
  reason?: string | null;
}

export const AccountingPeriodsView: React.FC = () => {
  const { user, authFetch } = useAuth();
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Sensitive Action Confirmation
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalAction, setModalAction] = useState<'CLOSE' | 'REOPEN'>('CLOSE');
  const [activePeriod, setActivePeriod] = useState<AccountingPeriod | null>(null);
  const [reason, setReason] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const userRole = (user?.roleName || (user as any)?.role || '').toUpperCase();
  const isAuthorized = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/accounting-periods');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data);
      }
    } catch (err) {
      console.error('Failed to load accounting periods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const openActionModal = (period: AccountingPeriod, action: 'CLOSE' | 'REOPEN') => {
    setActivePeriod(period);
    setModalAction(action);
    setReason('');
    setConfirmError(null);
    setModalOpen(true);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod) return;

    if (!reason || reason.trim().length < 5) {
      setConfirmError('Alasan tindakan wajib diisi dengan jelas (minimal 5 karakter).');
      return;
    }

    setSubmitting(true);
    setConfirmError(null);

    const endpoint =
      modalAction === 'CLOSE'
        ? `/api/accounting-periods/${activePeriod.periodKey}/close`
        : `/api/accounting-periods/${activePeriod.periodKey}/reopen`;

    try {
      const res = await authFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Gagal memproses ${modalAction === 'CLOSE' ? 'penutupan' : 'pembukaan'} periode`);
      }

      setActionSuccessMessage(
        modalAction === 'CLOSE'
          ? `Periode ${activePeriod.monthName} berhasil DITUTUP (CLOSED). Transaksi baru ke periode ini telah diblokir.`
          : `Periode ${activePeriod.monthName} berhasil DIBUKA KEMBALI (OPEN).`
      );

      setModalOpen(false);
      setActivePeriod(null);
      setReason('');
      fetchPeriods();

      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setConfirmError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter periods
  const filteredPeriods = periods.filter((p) => {
    if (selectedYear !== 0 && p.year !== selectedYear) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMonth = p.monthName.toLowerCase().includes(q);
      const matchKey = p.periodKey.toLowerCase().includes(q);
      const matchReason = p.reason?.toLowerCase().includes(q);
      if (!matchMonth && !matchKey && !matchReason) return false;
    }
    return true;
  });

  const totalPeriods = periods.length;
  const closedCount = periods.filter((p) => p.status === 'CLOSED').length;
  const openCount = periods.filter((p) => p.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Tahap 8C — Kontrol Periode
            </span>
            <span className="text-xs text-gray-500">Tutup Buku & Reopening Keuangan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Periode Akuntansi & Tutup Periode
          </h1>
          <p className="text-sm text-gray-600">
            Kendalikan masa pembukuan bulanan. Periode berstatus CLOSED mengunci seluruh transaksi posted, mencegah posting baru, dan melindungi buku besar dari perubahan liar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPeriods}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Periode Tercatat</p>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalPeriods}</p>
          <p className="mt-1 text-xs text-gray-500">Siklus bulanan pembukuan pesantren</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Periode Terbuka (OPEN)</p>
            <Unlock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950">{openCount}</p>
          <p className="mt-1 text-xs text-emerald-700">Menerima posting & transaksi baru secara sah</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Periode Ditutup (CLOSED)</p>
            <Lock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950">{closedCount}</p>
          <p className="mt-1 text-xs text-amber-700">Terkunci penuh; mutasi baru dilarang keras</p>
        </div>
      </div>

      {/* Policy Reminder */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950">
              Aturan Keamanan Pembukuan (Period Control & Audit Trail):
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>
                <strong>Jika CLOSED:</strong> Transaksi baru tidak boleh di-POST, transaksi POSTED tidak dapat diedit/dihapus, dan jurnal tidak dapat diubah.
              </li>
              <li>
                <strong>Reopening:</strong> Hanya dapat dilakukan oleh Bendahara atau Super Admin dengan alasan wajib yang terekam permanen di Jejak Audit.
              </li>
              <li>
                <strong>Integritas Historis:</strong> Menutup periode tidak mengubah data transaksi lama yang sudah dibukukan secara sah sebelumnya.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari bulan, kode periode, alasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value={2026}>Tahun Buku 2026</option>
              <option value={2025}>Tahun Buku 2025</option>
              <option value={0}>Semua Tahun</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="OPEN">Hanya OPEN (Terbuka)</option>
              <option value="CLOSED">Hanya CLOSED (Terkunci)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of Periods */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Daftar Siklus Periode Akuntansi ({filteredPeriods.length} Periode)
          </h2>
          {!isAuthorized && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              Mode Lihat: Hanya Bendahara & Super Admin yang berwenang mengubah status periode
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Memuat siklus periode akuntansi...</span>
          </div>
        ) : filteredPeriods.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Tidak ada periode akuntansi yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3.5">Periode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Ditutup Oleh (Closed By)</th>
                  <th className="px-4 py-3.5">Waktu Penutupan</th>
                  <th className="px-4 py-3.5">Dibuka Kembali (Reopened)</th>
                  <th className="px-4 py-3.5">Keterangan / Alasan</th>
                  <th className="px-6 py-3.5 text-right">Tindakan Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPeriods.map((p) => {
                  const isClosed = p.status === 'CLOSED';
                  return (
                    <tr key={p.periodKey} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{p.monthName}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.periodKey}</div>
                      </td>

                      <td className="px-4 py-4">
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <Lock className="h-3.5 w-3.5 text-amber-600" />
                            CLOSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                            OPEN
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs">
                        {p.closedBy ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            <span className="font-medium text-gray-900">{p.closedBy.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-gray-600">
                        {p.closedAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{new Date(p.closedAt).toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' } as any)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs">
                        {p.reopenedBy ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-gray-900">{p.reopenedBy.name}</div>
                            {p.reopenedAt && (
                              <div className="text-gray-500 text-[11px]">
                                {new Date(p.reopenedAt).toLocaleDateString('id-ID', { dateStyle: 'short', timeStyle: 'short' } as any)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs max-w-xs">
                        {p.reason ? (
                          <span className="text-gray-700 italic">"{p.reason}"</span>
                        ) : (
                          <span className="text-gray-400 italic">Belum ada catatan</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isClosed ? (
                          <button
                            onClick={() => openActionModal(p, 'REOPEN')}
                            disabled={!isAuthorized}
                            title={!isAuthorized ? 'Hanya Bendahara / Super Admin yang dapat membuka periode' : 'Buka kembali periode'}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Buka Kembali (Reopen)
                          </button>
                        ) : (
                          <button
                            onClick={() => openActionModal(p, 'CLOSE')}
                            disabled={!isAuthorized}
                            title={!isAuthorized ? 'Hanya Bendahara / Super Admin yang dapat menutup periode' : 'Tutup periode akuntansi'}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-2xs hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Tutup Periode (Close)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Mandatory Reason Modal (Sensitive Action Protection) */}
      {modalOpen && activePeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    modalAction === 'CLOSE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {modalAction === 'CLOSE' ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Konfirmasi {modalAction === 'CLOSE' ? 'Penutupan Periode' : 'Pembukaan Kembali Periode'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Periode: <strong className="text-gray-800">{activePeriod.monthName} ({activePeriod.periodKey})</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="mt-4 space-y-4">
              {modalAction === 'CLOSE' ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    Peringatan Perlindungan Transaksi (POSTED Protection):
                  </div>
                  <p>
                    Setelah periode ini ditutup (CLOSED), seluruh transaksi dalam bulan {activePeriod.monthName} akan dikunci permanen. Transaksi baru tidak dapat dibuat atau diposting ke periode ini.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    Otorisasi Pembukaan Kembali (Reopen):
                  </div>
                  <p>
                    Membuka kembali periode memungkinkan pemrosesan koreksi atau penyesuaian khusus. Tindakan ini terekam penuh di Jejak Audit (Audit Trail) dan Security Events.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Alasan {modalAction === 'CLOSE' ? 'Penutupan' : 'Pembukaan Kembali'} Periode <span className="text-rose-600">* Wajib</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    modalAction === 'CLOSE'
                      ? 'Contoh: Tutup buku akhir bulan Oktober 2026 setelah rekonsiliasi kas dan bank tuntas.'
                      : 'Contoh: Pembukaan kembali atas persetujuan pimpinan untuk jurnal pembalik audit koreksi inventaris.'
                  }
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-gray-500">
                  Minimal 5 karakter. Wajib diisi untuk kepatuhan audit.
                </span>
              </div>

              {confirmError && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  {confirmError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || reason.trim().length < 5}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 ${
                    modalAction === 'CLOSE'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting
                    ? 'Memproses...'
                    : modalAction === 'CLOSE'
                    ? 'Konfirmasi Tutup Periode'
                    : 'Konfirmasi Buka Kembali'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
