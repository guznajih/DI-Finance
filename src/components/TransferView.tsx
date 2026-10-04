import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Landmark,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BankAccount, CashAccount, Transaction } from '../types/index.ts';

export const TransferView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [bankList, setBankList] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fromType, setFromType] = useState<'KAS' | 'BANK'>('BANK');
  const [fromId, setFromId] = useState<number>(0);
  const [toType, setToType] = useState<'KAS' | 'BANK'>('BANK');
  const [toId, setToId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [statusTarget, setStatusTarget] = useState<'DRAFT' | 'DIAJUKAN' | 'POSTED'>('POSTED');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState<boolean>(false);

  // Details & Reversal
  const [detailTrx, setDetailTrx] = useState<Transaction | null>(null);
  const [reverseModalTrx, setReverseModalTrx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');

  const isBendaharaOrAdmin = user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trxRes, cRes, bRes] = await Promise.all([
        authFetch('/api/transactions?type=TRANSFER'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/bank-accounts'),
      ]);

      if (trxRes.ok) setTransactions(await trxRes.json());
      if (cRes.ok) setCashList(await cRes.json());
      if (bRes.ok) {
        const banks: BankAccount[] = await bRes.json();
        setBankList(banks);
        if (banks.length >= 2) {
          setFromType('BANK');
          setFromId(banks[0].id);
          setToType('BANK');
          setToId(banks[1].id);
        } else if (banks.length === 1) {
          setFromType('BANK');
          setFromId(banks[0].id);
          setToType('KAS');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormError(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setDescription('');
    setReference('');
    setAttachmentUrl('');
    setAllowNegativeBalance(false);
    setStatusTarget(isBendaharaOrAdmin ? 'POSTED' : 'DIAJUKAN');

    if (bankList.length >= 2) {
      setFromType('BANK');
      setFromId(bankList[0].id);
      setToType('BANK');
      setToId(bankList[1].id);
    } else if (bankList.length === 1 && cashList.length >= 1) {
      setFromType('KAS');
      setFromId(cashList[0].id);
      setToType('BANK');
      setToId(bankList[0].id);
    }
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Nominal transfer harus lebih besar dari 0');
      return;
    }
    if (fromType === toType && fromId === toId) {
      setFormError('Akun asal dan akun tujuan transfer tidak boleh sama!');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        date,
        fromType,
        fromId,
        toType,
        toId,
        amount: parsedAmount,
        description: description || `Transfer internal ${fromType} ke ${toType}`,
        reference,
        attachmentUrl,
        status: statusTarget,
        allowNegativeBalance,
      };

      const res = await authFetch('/api/transfer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan transfer');
      }

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await authFetch(`/api/transactions/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyetujui transfer');
      }
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePost = async (id: number) => {
    if (!confirm('Posting transfer ini ke Jurnal Umum? Saldo asal dan tujuan akan langsung termutasi.')) return;
    try {
      const res = await authFetch(`/api/transactions/${id}/post`, {
        method: 'POST',
        body: JSON.stringify({ allowNegativeBalance }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mem-posting transfer');
      }
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirmReverse = async () => {
    if (!reverseModalTrx || !reverseReason.trim()) {
      alert('Alasan koreksi/pembatalan wajib diisi');
      return;
    }
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/transactions/${reverseModalTrx.id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason: reverseReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membatalkan transaksi');
      }
      setReverseModalTrx(null);
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatRupiah = (val: string | number) => {
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
          <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs">
            <ArrowLeftRight className="h-4 w-4" />
            <span>KEUANGAN → TRANSFER ANTAR KAS & BANK</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Mutasi & Transfer Antar Kas / Bank
          </h1>
          <p className="text-xs text-gray-500">
            Penyetoran kas ke bank, penarikan bank ke kas, dan transfer antar rekening bank (Tanpa menyentuh pos Pendapatan/Beban)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Transfer Baru</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3.5">No. Transfer</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Dari (Asal)</th>
              <th className="px-4 py-3.5">Ke (Tujuan)</th>
              <th className="px-4 py-3.5">Keterangan</th>
              <th className="px-4 py-3.5 text-right">Nominal (Rp)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Memuat data transfer...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Belum ada transaksi transfer tercatat.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-blue-900">
                    {trx.transactionNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{trx.date}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {trx.cashBankType === 'KAS' ? 'Kas Tunai' : 'Bank'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-800">
                    {trx.toCashBankType === 'KAS' ? 'Kas Tunai' : 'Bank'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={trx.description}>
                    {trx.description}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                    {formatRupiah(trx.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        trx.status === 'POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trx.status === 'DISETUJUI'
                          ? 'bg-blue-100 text-blue-800'
                          : trx.status === 'DIAJUKAN'
                          ? 'bg-purple-100 text-purple-800'
                          : trx.status === 'REVERSED' || trx.status === 'VOID'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => setDetailTrx(trx)}
                        title="Lihat Detail Transfer"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {trx.status === 'DIAJUKAN' && isBendaharaOrAdmin && (
                        <button
                          onClick={() => handleApprove(trx.id)}
                          title="Setujui Transfer"
                          className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}

                      {(trx.status === 'DISETUJUI' || trx.status === 'DRAFT') && isBendaharaOrAdmin && (
                        <button
                          onClick={() => handlePost(trx.id)}
                          title="Posting Transfer"
                          className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800 hover:bg-emerald-200"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>
                      )}

                      {trx.status === 'POSTED' && isBendaharaOrAdmin && (
                        <button
                          onClick={() => {
                            setReverseModalTrx(trx);
                            setReverseReason('');
                          }}
                          title="Reversal Transfer"
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE TRANSFER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Transfer Dana Internal Kas ⇄ Bank
                </h3>
                <p className="text-xs text-gray-500">
                  Mutasi murni antar pos aset; tidak dihitung sebagai beban atau pendapatan
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-2.5 text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700">Tanggal Transfer *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Source (Dari) vs Target (Ke) Grid */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-2">
                {/* SOURCE */}
                <div>
                  <span className="font-bold text-rose-800 uppercase tracking-wide text-[11px]">
                    1. Sumber Dana Asal (Kredit)
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFromType('BANK');
                        if (bankList.length > 0) setFromId(bankList[0].id);
                      }}
                      className={`flex-1 rounded-lg p-1.5 font-bold border transition text-center ${
                        fromType === 'BANK' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600 bg-white'
                      }`}
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFromType('KAS');
                        if (cashList.length > 0) setFromId(cashList[0].id);
                      }}
                      className={`flex-1 rounded-lg p-1.5 font-bold border transition text-center ${
                        fromType === 'KAS' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 text-gray-600 bg-white'
                      }`}
                    >
                      Kas Tunai
                    </button>
                  </div>

                  <div className="mt-2">
                    {fromType === 'BANK' ? (
                      <select
                        value={fromId}
                        onChange={(e) => setFromId(parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white"
                      >
                        {bankList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({formatRupiah(b.currentBalance)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={fromId}
                        onChange={(e) => setFromId(parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white"
                      >
                        {cashList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({formatRupiah(c.currentBalance)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* TARGET */}
                <div>
                  <span className="font-bold text-emerald-800 uppercase tracking-wide text-[11px]">
                    2. Tujuan Transfer (Debit)
                  </span>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setToType('BANK');
                        if (bankList.length > 1) setToId(bankList[1].id);
                      }}
                      className={`flex-1 rounded-lg p-1.5 font-bold border transition text-center ${
                        toType === 'BANK' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600 bg-white'
                      }`}
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToType('KAS');
                        if (cashList.length > 0) setToId(cashList[0].id);
                      }}
                      className={`flex-1 rounded-lg p-1.5 font-bold border transition text-center ${
                        toType === 'KAS' ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-gray-200 text-gray-600 bg-white'
                      }`}
                    >
                      Kas Tunai
                    </button>
                  </div>

                  <div className="mt-2">
                    {toType === 'BANK' ? (
                      <select
                        value={toId}
                        onChange={(e) => setToId(parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white"
                      >
                        {bankList.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} - {b.accountNumber}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={toId}
                        onChange={(e) => setToId(parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-gray-200 p-2 text-xs bg-white"
                      >
                        {cashList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount & Description */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-gray-700">Nominal Transfer (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 2000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">No. Bukti Transfer / Referensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: TRF-BSI-MUAMALAT-01"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Keterangan Transfer</label>
                <input
                  type="text"
                  placeholder="Contoh: Setor tunai ke rekening operasional BSI atau transfer antar rekening"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Upload Proof */}
              <div>
                <label className="block font-semibold text-gray-700">Upload Bukti Transfer (Opsional)</label>
                <div className="mt-1 flex items-center space-x-3">
                  <label className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span>Pilih Foto Bukti Transfer</span>
                    <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {attachmentUrl && (
                    <span className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>File Bukti Terlampir</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Journal Preview */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs">
                <span className="font-bold text-blue-950">Pratinjau Jurnal Mutasi Aset (Double-Entry Seimbang):</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-white p-2 border border-blue-100">
                    <span className="text-gray-500">DEBIT:</span>{' '}
                    <span className="font-bold text-blue-900">{toType} Tujuan (Bertambah)</span>
                    <p className="text-blue-700 font-bold">{formatRupiah(amount || 0)}</p>
                  </div>
                  <div className="rounded bg-white p-2 border border-blue-100">
                    <span className="text-gray-500">KREDIT:</span>{' '}
                    <span className="font-bold text-rose-900">{fromType} Asal (Berkurang)</span>
                    <p className="text-rose-700 font-bold">{formatRupiah(amount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-800 px-5 py-2 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {actionLoading ? 'Menyimpan...' : isBendaharaOrAdmin ? 'Simpan & Posting' : 'Ajukan Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Detail Transfer Internal</h3>
                <p className="font-mono text-xs text-gray-500">{detailTrx.transactionNumber}</p>
              </div>
              <button onClick={() => setDetailTrx(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3">
                <div>
                  <span className="text-gray-400">Tanggal:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.date}</p>
                </div>
                <div>
                  <span className="text-gray-400">Nominal:</span>
                  <p className="font-bold text-blue-900">{formatRupiah(detailTrx.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Asal:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.cashBankType}</p>
                </div>
                <div>
                  <span className="text-gray-400">Tujuan:</span>
                  <p className="font-semibold text-emerald-800">{detailTrx.toCashBankType}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400">Uraian:</span>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{detailTrx.description}</p>
              </div>

              {detailTrx.attachmentUrl && (
                <div>
                  <span className="text-gray-400">Bukti Transfer:</span>
                  <div className="mt-1 overflow-hidden rounded-xl border border-gray-200">
                    <img src={detailTrx.attachmentUrl} alt="Bukti transfer" className="max-h-56 w-full object-contain bg-gray-50" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setDetailTrx(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVERSAL MODAL */}
      {reverseModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-700">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-base font-bold">Koreksi / Reversal Transfer</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Transfer <strong>{reverseModalTrx.transactionNumber}</strong> akan dibatalkan melalui jurnal pembalik otomatis. Saldo kedua rekening akan dikembalikan seperti semula.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">Alasan Pembatalan / Koreksi *</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Salah nominal transfer atau transaksi batal..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setReverseModalTrx(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReverse}
                disabled={actionLoading || !reverseReason.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:bg-gray-300"
              >
                {actionLoading ? 'Memproses...' : 'Konfirmasi Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
