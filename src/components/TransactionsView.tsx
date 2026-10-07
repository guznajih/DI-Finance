import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, Fund, Transaction, TransactionLine, Unit } from '../types/index.ts';
import { SimpleTransactionModal } from './transactions/SimpleTransactionModal.tsx';

interface TransactionsViewProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  modalOpen,
  setModalOpen,
}) => {
  const { authFetch, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tahap 7 Simple Modal State
  const [simpleModalOpen, setSimpleModalOpen] = useState<boolean>(false);
  const [simpleModalType, setSimpleModalType] = useState<string>('PENERIMAAN');

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [detailModalTrx, setDetailModalTrx] = useState<Transaction | null>(null);
  const [reverseModalTrx, setReverseModalTrx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New Transaction Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<'PENERIMAAN' | 'PENGELUARAN' | 'MUTASI_KAS_BANK' | 'PENYESUAIAN'>('PENERIMAAN');
  const [formUnitId, setFormUnitId] = useState<string>('');
  const [formFundId, setFormFundId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formReference, setFormReference] = useState<string>('');
  const [formLines, setFormLines] = useState<
    Array<{ accountId: number; description: string; debit: number; credit: number }>
  >([
    { accountId: 0, description: '', debit: 0, credit: 0 },
    { accountId: 0, description: '', debit: 0, credit: 0 },
  ]);
  const [formAutoPost, setFormAutoPost] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  const isBendaharaOrAdmin = user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trxRes, uRes, fRes, aRes] = await Promise.all([
        authFetch('/api/transactions'),
        authFetch('/api/units'),
        authFetch('/api/funds'),
        authFetch('/api/accounts'),
      ]);

      if (trxRes.ok) setTransactions(await trxRes.json());
      if (uRes.ok) setUnits(await uRes.json());
      if (fRes.ok) setFunds(await fRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default lines helper when transaction type changes
  const applyTemplate = (type: string) => {
    setFormType(type as any);
    const kasAccount = accounts.find((a) => a.code === '1110');
    const bankAccount = accounts.find((a) => a.code === '1120');
    const infakAccount = accounts.find((a) => a.code === '4220');
    const dapurBeban = accounts.find((a) => a.code === '5210');

    if (type === 'PENERIMAAN') {
      setFormLines([
        { accountId: kasAccount?.id || 0, description: 'Penerimaan Kas Tunai', debit: 0, credit: 0 },
        { accountId: infakAccount?.id || 0, description: 'Pendapatan Infak / Donasi', debit: 0, credit: 0 },
      ]);
    } else if (type === 'PENGELUARAN') {
      setFormLines([
        { accountId: dapurBeban?.id || 0, description: 'Beban Operasional / Dapur', debit: 0, credit: 0 },
        { accountId: kasAccount?.id || 0, description: 'Pengeluaran Kas Tunai', debit: 0, credit: 0 },
      ]);
    } else if (type === 'MUTASI_KAS_BANK') {
      setFormLines([
        { accountId: bankAccount?.id || 0, description: 'Setor ke Bank Rekening', debit: 0, credit: 0 },
        { accountId: kasAccount?.id || 0, description: 'Tarik dari Kas Tunai', debit: 0, credit: 0 },
      ]);
    } else {
      setFormLines([
        { accountId: 0, description: '', debit: 0, credit: 0 },
        { accountId: 0, description: '', debit: 0, credit: 0 },
      ]);
    }
  };

  // Double Entry calculation
  const totalDebit = formLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = formLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  const handleAddLine = () => {
    setFormLines([
      ...formLines,
      { accountId: 0, description: formDescription, debit: 0, credit: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (formLines.length <= 2) {
      alert('Transaksi akuntansi wajib memiliki minimal 2 baris!');
      return;
    }
    setFormLines(formLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: 'accountId' | 'description' | 'debit' | 'credit',
    value: any
  ) => {
    const updated = [...formLines];
    updated[index] = { ...updated[index], [field]: value };
    setFormLines(updated);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isBalanced) {
      setFormError(`Double Entry tidak balance! Total Debit (Rp ${totalDebit.toLocaleString()}) != Total Kredit (Rp ${totalCredit.toLocaleString()})`);
      return;
    }

    for (const line of formLines) {
      if (!line.accountId) {
        setFormError('Semua baris wajib memilih Akun');
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        date: formDate,
        type: formType,
        unitId: formUnitId ? parseInt(formUnitId, 10) : null,
        fundId: formFundId ? parseInt(formFundId, 10) : null,
        description: formDescription,
        reference: formReference,
        lines: formLines,
        autoPost: isBendaharaOrAdmin ? formAutoPost : false,
      };

      const res = await authFetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan transaksi');
      }

      setModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormDescription('');
    setFormReference('');
    setFormUnitId('');
    setFormFundId('');
    setFormError(null);
    applyTemplate('PENERIMAAN');
  };

  const handlePostTransaction = async (id: number) => {
    if (!confirm('Posting transaksi ini ke Jurnal Umum? Saldo kas/bank dan buku besar akan langsung diperbarui.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/transactions/${id}/post`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal posting transaksi');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReverse = (trx: Transaction) => {
    setReverseModalTrx(trx);
    setReverseReason('');
  };

  const handleConfirmReverse = async () => {
    if (!reverseModalTrx) return;
    if (!reverseReason.trim()) {
      alert('Alasan koreksi/pembatalan wajib diisi!');
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
        throw new Error(err.error || 'Gagal melakukan pembalikan transaksi');
      }

      setReverseModalTrx(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (trx: Transaction) => {
    try {
      const res = await authFetch(`/api/transactions/${trx.id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailModalTrx(data);
      } else {
        setDetailModalTrx(trx);
      }
    } catch (e) {
      setDetailModalTrx(trx);
    }
  };

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Filtered transactions with plain-language smart understanding
  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (unitFilter && String(t.unitId) !== unitFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      // Month keyword matching
      const monthMap: Record<string, string> = {
        januari: '-01-', februari: '-02-', maret: '-03-', april: '-04-',
        mei: '-05-', juni: '-06-', juli: '-07-', agustus: '-08-',
        september: '-09-', oktober: '-10-', november: '-11-', desember: '-12-'
      };
      for (const [mName, mCode] of Object.entries(monthMap)) {
        if (q.includes(mName) && !t.date?.includes(mCode)) {
          return false;
        }
      }

      // Keyword type matching
      if (q.includes('pengeluaran') && t.type !== 'PENGELUARAN') return false;
      if (q.includes('penerimaan') && t.type !== 'PENERIMAAN') return false;
      if (q.includes('investasi') && !t.type.includes('INVESTASI')) return false;

      // Clean terms match
      const cleaned = q
        .replace(/bulan|periode|pengeluaran|penerimaan|transaksi/g, '')
        .trim();

      if (cleaned.length > 1) {
        const matchNum = t.transactionNumber?.toLowerCase().includes(cleaned);
        const matchDesc = t.description?.toLowerCase().includes(cleaned);
        const matchUnit = t.unitName?.toLowerCase().includes(cleaned);
        if (!matchNum && !matchDesc && !matchUnit) return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Transaksi Keuangan & Akuntansi
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan mutasi kas, bank, penerimaan, dan pengeluaran berbasis Double-Entry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSimpleModalType('PENERIMAAN');
              setSimpleModalOpen(true);
            }}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-600 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Transaksi Sederhana (Bendahara)</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Input Manual COA</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor transaksi, uraian, unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="">Semua Jenis</option>
            <option value="PENERIMAAN">Penerimaan</option>
            <option value="PENGELUARAN">Pengeluaran</option>
            <option value="MUTASI_KAS_BANK">Mutasi Kas / Bank</option>
            <option value="PENYESUAIAN">Penyesuaian</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="POSTED">POSTED (Jurnal Sah)</option>
            <option value="DRAFT">DRAFT (Belum Diposting)</option>
            <option value="REVERSED">REVERSED (Dibatalkan)</option>
          </select>

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
          >
            <option value="">Semua Unit</option>
            {units.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name}
              </option>
            ))}
          </select>

          {(typeFilter || statusFilter || unitFilter || searchQuery) && (
            <button
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setUnitFilter('');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-emerald-800 hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3.5">No. Transaksi</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Jenis</th>
                <th className="px-4 py-3.5">Unit & Sumber</th>
                <th className="px-4 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5 text-right">Jumlah</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="transition hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">
                      {trx.transactionNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{trx.date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          trx.type === 'PENERIMAAN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.type === 'PENGELUARAN'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {trx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-medium">{trx.unitName || '-'}</div>
                      <div className="text-[10px] text-gray-400">{trx.fundName || 'Umum'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={trx.description}>
                      {trx.description}
                      {trx.reference && (
                        <div className="text-[10px] text-gray-400">Ref: {trx.reference}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      {formatRupiah(trx.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          trx.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trx.status === 'POSTED' && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
                        {trx.status === 'REVERSED' && <RotateCcw className="h-3 w-3 mr-0.5" />}
                        {trx.status === 'DRAFT' && <Clock className="h-3 w-3 mr-0.5" />}
                        <span>{trx.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleViewDetails(trx)}
                          title="Lihat Detail Transaksi & Jurnal"
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Posting Button for DRAFT (Bendahara or Admin) */}
                        {trx.status === 'DRAFT' && isBendaharaOrAdmin && (
                          <button
                            onClick={() => handlePostTransaction(trx.id)}
                            title="Posting ke Jurnal Umum"
                            className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800 hover:bg-emerald-200"
                          >
                            <FileCheck2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Reversal / Koreksi Button for POSTED (Bendahara or Admin) */}
                        {trx.status === 'POSTED' && isBendaharaOrAdmin && (
                          <button
                            onClick={() => handleOpenReverse(trx)}
                            title="Koreksi / Batalkan Transaksi (Double Entry Reversal)"
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
      </div>

      {/* CREATE TRANSACTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Input Transaksi Akuntansi (Double-Entry)
                </h2>
                <p className="text-xs text-gray-500">
                  Setiap transaksi wajib memenuhi: Total Debit = Total Kredit
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="mt-4 space-y-4">
              {formError && (
                <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Template Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'PENERIMAAN', label: 'Penerimaan Kas/Bank' },
                    { id: 'PENGELUARAN', label: 'Pengeluaran Beban' },
                    { id: 'MUTASI_KAS_BANK', label: 'Mutasi Kas ⇄ Bank' },
                    { id: 'PENYESUAIAN', label: 'Jurnal Penyesuaian' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      className={`rounded-xl border p-2.5 text-xs font-semibold transition text-center ${
                        formType === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: Date, Unit, Fund, Reference */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Unit / Divisi</label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Tanpa Unit / Umum --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Sumber Dana</label>
                  <select
                    value={formFundId}
                    onChange={(e) => setFormFundId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Default / Dana Operasional --</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">No. Ref / Kwitansi</label>
                  <input
                    type="text"
                    placeholder="Contoh: KWT-001, BSI-TRF"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700">Uraian / Keterangan Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Penerimaan infak jumat legi atau belanja konsumsi santri dapur"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Journal Lines Table */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-800">
                    Pos Baris Akun (Double-Entry)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center space-x-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formLines.map((line, idx) => (
                    <div key={idx} className="flex flex-col gap-2 rounded-lg bg-white p-2.5 shadow-xs border border-gray-200 sm:flex-row sm:items-center">
                      <div className="flex-1 sm:w-1/3">
                        <select
                          required
                          value={line.accountId}
                          onChange={(e) =>
                            handleLineChange(idx, 'accountId', parseInt(e.target.value, 10))
                          }
                          className="w-full rounded-lg border border-gray-200 p-1.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                        >
                          <option value="0">-- Pilih Akun COA --</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              [{a.code}] {a.name} ({a.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1 sm:w-1/3">
                        <input
                          type="text"
                          placeholder="Keterangan baris (opsional)"
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 p-1.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          placeholder="Debit"
                          min="0"
                          step="any"
                          value={line.debit || ''}
                          onChange={(e) =>
                            handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-gray-200 p-1.5 text-xs font-mono text-right text-gray-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          placeholder="Kredit"
                          min="0"
                          step="any"
                          value={line.credit || ''}
                          onChange={(e) =>
                            handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-gray-200 p-1.5 text-xs font-mono text-right text-gray-900 focus:border-emerald-600 focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 self-end sm:self-center"
                        title="Hapus Baris"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Balance Status Footer */}
                <div className="mt-3 flex flex-col justify-between gap-2 border-t border-gray-200 pt-3 text-xs sm:flex-row sm:items-center">
                  <div className="flex items-center space-x-2">
                    {isBalanced ? (
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                        <CheckCircle className="h-4 w-4" />
                        <span>Jurnal Balance (Seimbang)</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-rose-700 font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>Belum Balance! Selisih: {formatRupiah(difference)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 font-mono font-bold">
                    <span>Debit: {formatRupiah(totalDebit)}</span>
                    <span>Kredit: {formatRupiah(totalCredit)}</span>
                  </div>
                </div>
              </div>

              {/* Direct Post Checkbox (For Bendahara / Admin) */}
              {isBendaharaOrAdmin && (
                <div className="flex items-center space-x-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    id="autoPost"
                    checked={formAutoPost}
                    onChange={(e) => setFormAutoPost(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                  />
                  <label htmlFor="autoPost" className="cursor-pointer font-medium">
                    Posting langsung ke Jurnal Umum & perbarui saldo kas/bank saat disimpan
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced || actionLoading}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition ${
                    isBalanced && !actionLoading
                      ? 'bg-emerald-800 hover:bg-emerald-700'
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  }`}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailModalTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Rincian Transaksi & Jurnal
                </h3>
                <p className="font-mono text-xs text-gray-500">
                  {detailModalTrx.transactionNumber}
                </p>
              </div>
              <button
                onClick={() => setDetailModalTrx(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-4">
                <div>
                  <span className="text-gray-400">Tanggal:</span>
                  <p className="font-semibold text-gray-800">{detailModalTrx.date}</p>
                </div>
                <div>
                  <span className="text-gray-400">Jenis:</span>
                  <p className="font-semibold text-gray-800">{detailModalTrx.type}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className="font-semibold text-gray-800">{detailModalTrx.status}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Nilai:</span>
                  <p className="font-semibold text-emerald-800">
                    {formatRupiah(detailModalTrx.totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-gray-400">Uraian:</span>
                <p className="mt-0.5 text-sm font-medium text-gray-900">
                  {detailModalTrx.description}
                </p>
              </div>

              {/* Lines table */}
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Akun COA</th>
                      <th className="px-3 py-2">Keterangan</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {detailModalTrx.lines && detailModalTrx.lines.length > 0 ? (
                      detailModalTrx.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-sans font-medium text-gray-800">
                            [{l.accountCode}] {l.accountName}
                          </td>
                          <td className="px-3 py-2 font-sans text-gray-600">
                            {l.description || '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            {Number(l.debit) > 0 ? formatRupiah(l.debit) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">
                            {Number(l.credit) > 0 ? formatRupiah(l.credit) : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-400">
                          Memuat baris pos transaksi...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setDetailModalTrx(null)}
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
              <h3 className="text-base font-bold">Koreksi / Pembalikan Transaksi</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Sesuai standar akuntansi double-entry, transaksi <strong>{reverseModalTrx.transactionNumber}</strong> tidak akan dihapus fisik. Sistem akan membuat <strong>Jurnal Pembalik (Reversal)</strong> yang membalik posisi Debit dan Kredit sehingga saldo kas & bank disesuaikan kembali.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">
                Alasan Koreksi / Pembatalan *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Salah memasukkan nominal atau salah pos rekening..."
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
                {actionLoading ? 'Memproses...' : 'Konfirmasi Pembalikan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tahap 7 Simple Transaction Modal */}
      <SimpleTransactionModal
        isOpen={simpleModalOpen}
        onClose={() => setSimpleModalOpen(false)}
        onSuccess={async () => {
          setSimpleModalOpen(false);
          await fetchData();
        }}
        defaultType={simpleModalType}
      />
    </div>
  );
};
