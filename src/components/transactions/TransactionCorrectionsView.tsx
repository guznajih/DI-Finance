import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  History,
  CheckCircle,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const TransactionCorrectionsView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form states
  const [trxId, setTrxId] = useState<string>('');
  const [correctionType, setCorrectionType] = useState<'VOID' | 'REVERSAL' | 'CORRECTION'>('REVERSAL');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/fase7/corrections');
      if (res.ok) {
        const data = await res.json();
        setCorrections(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || !reason.trim()) {
      setErrorMsg('ID Transaksi dan Alasan Koreksi wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await authFetch('/api/fase7/transactions/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: parseInt(trxId, 10),
          correctionType,
          reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memproses koreksi');
      }

      setIsModalOpen(false);
      setTrxId('');
      setReason('');
      await fetchCorrections();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Audit Trail & Integritas
            </span>
            <span className="flex items-center text-xs text-gray-500">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-600" />
              Tanpa Hapus Data Siluman
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
            Koreksi Transaksi (VOID / REVERSAL / CORRECTION)
          </h1>
          <p className="text-xs text-gray-500">
            Setiap koreksi atas transaksi POSTED menerbitkan jurnal pembalik otomatis dan mencatat jejak audit lengkap.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 rounded-xl bg-rose-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Koreksi Transaksi Baru</span>
        </button>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
        <div className="flex items-center space-x-2 font-bold">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
          <span>Prinsip Koreksi Akuntansi Pesantren:</span>
        </div>
        <p className="mt-1 text-amber-800 leading-relaxed">
          Sesuai standar akuntansi keuangan syariah dan kepatuhan audit, sistem <strong>tidak pernah mengubah atau menghapus jurnal POSTED secara diam-diam</strong>.
          Semua koreksi menghasilkan jurnal pembalik (reversal) berlawanan arah dengan referensi dokumen asli yang diaudit secara transparan.
        </p>
      </div>

      {/* Table of Corrections */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Riwayat Koreksi Transaksi & Audit Trail ({corrections.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Tanggal Koreksi</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Transaksi Asli</th>
                <th className="px-4 py-3">Jurnal Pembalik</th>
                <th className="px-4 py-3">Alasan Koreksi</th>
                <th className="px-4 py-3">User Bendahara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {corrections.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-mono">
                    {new Date(c.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-rose-100 px-2.5 py-1 text-[10px] font-bold text-rose-800">
                      {c.correctionType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{c.originalTransactionNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-700 font-semibold">{c.reversalJournalNumber || '-'}</span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2">{c.reason}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.performedByName}
                  </td>
                </tr>
              ))}
              {corrections.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Belum ada riwayat koreksi transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Koreksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                Proses Koreksi / Pembalikan Transaksi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700">ID Transaksi yang Dikoreksi</label>
                <input
                  type="number"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="Masukkan nomor ID transaksi (contoh: 25)"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Tipe Koreksi</label>
                <select
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 focus:border-rose-600 focus:outline-none"
                >
                  <option value="REVERSAL">REVERSAL (Pembalikan Jurnal)</option>
                  <option value="VOID">VOID (Pembatalan Transaksi)</option>
                  <option value="CORRECTION">CORRECTION (Koreksi Pengganti)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Alasan Koreksi (Wajib Jelas)</label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan alasan koreksi (contoh: Salah input akun beban atau salah rekening bank sumber)..."
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-800 text-white font-bold rounded-xl hover:bg-rose-700 transition"
                >
                  {submitting ? 'Memproses...' : 'Proses Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
