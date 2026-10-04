import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, BankAccount, CashAccount, Fund, Transaction, Unit } from '../types/index.ts';

export const PengeluaranView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [cashAccountsList, setCashAccountsList] = useState<CashAccount[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expenseAccountId, setExpenseAccountId] = useState<number>(0);
  const [unitId, setUnitId] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [cashBankType, setCashBankType] = useState<'KAS' | 'BANK'>('BANK');
  const [cashBankId, setCashBankId] = useState<number>(0);
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [statusTarget, setStatusTarget] = useState<'DRAFT' | 'DIAJUKAN' | 'POSTED'>('POSTED');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState<boolean>(false);

  // Modals for details and reversal
  const [detailTrx, setDetailTrx] = useState<Transaction | null>(null);
  const [reverseModalTrx, setReverseModalTrx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');

  const isBendaharaOrAdmin = user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trxRes, accRes, cRes, bRes, uRes, fRes] = await Promise.all([
        authFetch('/api/transactions?type=PENGELUARAN'),
        authFetch('/api/accounts'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/units'),
        authFetch('/api/funds'),
      ]);

      if (trxRes.ok) setTransactions(await trxRes.json());
      if (accRes.ok) {
        const allAcc: Account[] = await accRes.json();
        const expenses = allAcc.filter((a) => a.category === 'BEBAN');
        setExpenseAccounts(expenses);
        if (expenses.length > 0) setExpenseAccountId(expenses[0].id);
      }
      if (cRes.ok) setCashAccountsList(await cRes.json());
      if (bRes.ok) {
        const banks: BankAccount[] = await bRes.json();
        setBankAccountsList(banks);
        if (banks.length > 0) setCashBankId(banks[0].id);
      }
      if (uRes.ok) setUnits(await uRes.json());
      if (fRes.ok) setFunds(await fRes.json());
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
    setDescription('');
    setRecipient('');
    setReference('');
    setAmount('');
    setAttachmentUrl('');
    setAllowNegativeBalance(false);
    setStatusTarget(isBendaharaOrAdmin ? 'POSTED' : 'DIAJUKAN');
    if (bankAccountsList.length > 0) {
      setCashBankType('BANK');
      setCashBankId(bankAccountsList[0].id);
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
      setFormError('Nominal harus lebih besar dari 0');
      return;
    }
    if (!expenseAccountId) {
      setFormError('Pilih pos akun beban');
      return;
    }
    if (!cashBankId) {
      setFormError('Pilih kas atau rekening bank sumber pengeluaran');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        date,
        expenseAccountId,
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        cashBankType,
        cashBankId,
        recipient,
        amount: parsedAmount,
        description,
        reference,
        attachmentUrl,
        status: statusTarget,
        allowNegativeBalance,
      };

      const res = await authFetch('/api/pengeluaran', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan pengeluaran');
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
        throw new Error(err.error || 'Gagal menyetujui');
      }
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePost = async (id: number) => {
    if (!confirm('Posting pengeluaran ini ke Jurnal Umum? Saldo kas/bank akan dipotong.')) return;
    try {
      const res = await authFetch(`/api/transactions/${id}/post`, {
        method: 'POST',
        body: JSON.stringify({ allowNegativeBalance }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mem-posting');
      }
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleConfirmReverse = async () => {
    if (!reverseModalTrx || !reverseReason.trim()) {
      alert('Alasan pembatalan/koreksi wajib diisi');
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

  const filtered = transactions.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (unitFilter && String(t.unitId) !== unitFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.transactionNumber.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchRec = t.recipient?.toLowerCase().includes(q);
      if (!matchNum && !matchDesc && !matchRec) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
            <ArrowUpRight className="h-4 w-4" />
            <span>KEUANGAN → PENGELUARAN KAS/BANK</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Transaksi Pengeluaran & Beban
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan beban dapur, gaji, listrik, pemeliharaan, dan operasional pesantren
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pengeluaran</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. KK, uraian, penerima..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="DIAJUKAN">DIAJUKAN</option>
          <option value="DISETUJUI">DISETUJUI</option>
          <option value="POSTED">POSTED</option>
          <option value="REVERSED">REVERSED / VOID</option>
        </select>

        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
        >
          <option value="">Semua Unit</option>
          {units.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchData}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100"
          title="Muat Ulang"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3.5">No. Pengeluaran</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Uraian / Keterangan</th>
              <th className="px-4 py-3.5">Penerima Dana</th>
              <th className="px-4 py-3.5">Sumber Kas/Bank</th>
              <th className="px-4 py-3.5 text-right">Nominal (Rp)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Memuat data pengeluaran...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Belum ada data pengeluaran kas/bank.
                </td>
              </tr>
            ) : (
              filtered.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">
                    {trx.transactionNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{trx.date}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={trx.description}>
                    <div className="font-medium">{trx.description}</div>
                    <div className="text-[10px] text-gray-400">
                      Unit: {trx.unitName || 'Pusat'} • Sumber: {trx.fundName || 'Operasional'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {trx.recipient || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {trx.cashBankType === 'KAS' ? 'Kas Tunai' : 'Bank'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-700 whitespace-nowrap">
                    -{formatRupiah(trx.totalAmount)}
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
                        title="Lihat Detail & Bukti"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Approval button */}
                      {trx.status === 'DIAJUKAN' && isBendaharaOrAdmin && (
                        <button
                          onClick={() => handleApprove(trx.id)}
                          title="Setujui Pengeluaran"
                          className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Post button */}
                      {(trx.status === 'DISETUJUI' || trx.status === 'DRAFT') && isBendaharaOrAdmin && (
                        <button
                          onClick={() => handlePost(trx.id)}
                          title="Posting ke Jurnal & Potong Kas/Bank"
                          className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800 hover:bg-emerald-200"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Reversal button */}
                      {trx.status === 'POSTED' && isBendaharaOrAdmin && (
                        <button
                          onClick={() => {
                            setReverseModalTrx(trx);
                            setReverseReason('');
                          }}
                          title="Void / Reversal Pengeluaran"
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

      {/* CREATE PENGELUARAN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Input Transaksi Pengeluaran (KK)
                </h3>
                <p className="text-xs text-gray-500">
                  Sistem otomatis menghasilkan Jurnal Seimbang (DEBIT: Beban, KREDIT: Kas/Bank)
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              {formError && (
                <div className="flex items-center space-x-2 rounded-xl bg-rose-50 p-2.5 text-rose-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-gray-700">Tanggal Pengeluaran *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Akun Beban / Pos Anggaran *</label>
                  <select
                    required
                    value={expenseAccountId}
                    onChange={(e) => setExpenseAccountId(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    {expenseAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kas / Bank Choice */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-gray-700">Sumber Dana Diambil Dari *</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCashBankType('BANK');
                        if (bankAccountsList.length > 0) setCashBankId(bankAccountsList[0].id);
                      }}
                      className={`rounded-lg p-2 text-center font-bold transition border ${
                        cashBankType === 'BANK'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Rekening Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCashBankType('KAS');
                        if (cashAccountsList.length > 0) setCashBankId(cashAccountsList[0].id);
                      }}
                      className={`rounded-lg p-2 text-center font-bold transition border ${
                        cashBankType === 'KAS'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Kas Tunai
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">
                    Pilih {cashBankType === 'BANK' ? 'Rekening Bank' : 'Kas Fisik'} *
                  </label>
                  {cashBankType === 'BANK' ? (
                    <select
                      value={cashBankId}
                      onChange={(e) => setCashBankId(parseInt(e.target.value, 10))}
                      className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                    >
                      {bankAccountsList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber} (Saldo: {formatRupiah(b.currentBalance)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={cashBankId}
                      onChange={(e) => setCashBankId(parseInt(e.target.value, 10))}
                      className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                    >
                      {cashAccountsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Saldo: {formatRupiah(c.currentBalance)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Penerima, Unit, Fund */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-gray-700">Nama Penerima Pembayaran *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Toko Beras Makmur, PLN, Ustadz..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Unit / Divisi</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Pusat Pondok (Umum) --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Sumber Dana</label>
                  <select
                    value={fundId}
                    onChange={(e) => setFundId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Dana Operasional --</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount, Description, Reference */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-gray-700">Nominal Pengeluaran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 3000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700">Uraian / Keterangan Pembelian / Beban *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembelian lauk dan beras santri pekan ke-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reference & File Upload */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-gray-700">No. Nota / Kwitansi / Referensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-1204, STRUK-BSI"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Upload Struk / Bukti Nota</label>
                  <div className="mt-1 flex items-center space-x-3">
                    <label className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                      <Upload className="h-4 w-4 text-gray-500" />
                      <span>Unggah Foto Nota</span>
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {attachmentUrl && (
                      <span className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Foto Nota Terlampir</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Negative balance override checkbox (for admin/bendahara) */}
              {isBendaharaOrAdmin && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="negBal"
                    checked={allowNegativeBalance}
                    onChange={(e) => setAllowNegativeBalance(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-rose-700 focus:ring-rose-600"
                  />
                  <label htmlFor="negBal" className="text-gray-700 text-[11px] cursor-pointer">
                    Izinkan saldo kas/bank minus sementara (otorisasi khusus administrator)
                  </label>
                </div>
              )}

              {/* Journal Preview */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
                <span className="font-bold text-rose-950">Pratinjau Jurnal Beban (Double-Entry Seimbang):</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-white p-2 border border-rose-100">
                    <span className="text-gray-500">DEBIT:</span>{' '}
                    <span className="font-bold text-rose-900">Akun Beban</span>
                    <p className="text-rose-700 font-bold">{formatRupiah(amount || 0)}</p>
                  </div>
                  <div className="rounded bg-white p-2 border border-rose-100">
                    <span className="text-gray-500">KREDIT:</span>{' '}
                    <span className="font-bold text-gray-900">{cashBankType} (Aset Berkurang)</span>
                    <p className="text-gray-800 font-bold">{formatRupiah(amount || 0)}</p>
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
                  {actionLoading ? 'Menyimpan...' : isBendaharaOrAdmin ? 'Simpan & Posting' : 'Ajukan Pengeluaran'}
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
                <h3 className="text-base font-bold text-gray-900">Detail Pengeluaran</h3>
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
                  <p className="font-bold text-rose-700">{formatRupiah(detailTrx.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Penerima Dana:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.recipient || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.status}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400">Uraian:</span>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{detailTrx.description}</p>
              </div>

              {detailTrx.attachmentUrl && (
                <div>
                  <span className="text-gray-400">Bukti Nota / Lampiran:</span>
                  <div className="mt-1 overflow-hidden rounded-xl border border-gray-200">
                    <img src={detailTrx.attachmentUrl} alt="Bukti nota" className="max-h-56 w-full object-contain bg-gray-50" />
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
              <h3 className="text-base font-bold">Koreksi / Reversal Pengeluaran</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Transaksi <strong>{reverseModalTrx.transactionNumber}</strong> akan dibatalkan melalui pembuatan jurnal pembalik otomatis. Saldo kas/bank akan dikembalikan utuh.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">Alasan Pembatalan / Koreksi *</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Nota salah hitung atau transaksi dibatalkan supplier..."
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
