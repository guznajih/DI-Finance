import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Image,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, BankAccount, CashAccount, Fund, Transaction, Unit } from '../types/index.ts';

export const PenerimaanView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<Account[]>([]);
  const [cashAccountsList, setCashAccountsList] = useState<CashAccount[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incomeAccountId, setIncomeAccountId] = useState<number>(0);
  const [unitId, setUnitId] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [cashBankType, setCashBankType] = useState<'KAS' | 'BANK'>('BANK');
  const [cashBankId, setCashBankId] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [statusTarget, setStatusTarget] = useState<'DRAFT' | 'DIAJUKAN' | 'POSTED'>('POSTED');

  // Details Modal & Reversal Modal
  const [detailTrx, setDetailTrx] = useState<Transaction | null>(null);
  const [reverseModalTrx, setReverseModalTrx] = useState<Transaction | null>(null);
  const [reverseReason, setReverseReason] = useState<string>('');

  const isBendaharaOrAdmin = user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trxRes, accRes, cRes, bRes, uRes, fRes] = await Promise.all([
        authFetch('/api/transactions?type=PENERIMAAN'),
        authFetch('/api/accounts'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/units'),
        authFetch('/api/funds'),
      ]);

      if (trxRes.ok) setTransactions(await trxRes.json());
      if (accRes.ok) {
        const allAcc: Account[] = await accRes.json();
        const incomes = allAcc.filter((a) => a.category === 'PENDAPATAN');
        setIncomeAccounts(incomes);
        if (incomes.length > 0) setIncomeAccountId(incomes[0].id);
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
    setReference('');
    setAmount('');
    setAttachmentUrl('');
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
    if (!incomeAccountId) {
      setFormError('Pilih akun pendapatan');
      return;
    }
    if (!cashBankId) {
      setFormError('Pilih kas atau rekening bank tujuan');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        date,
        incomeAccountId,
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        cashBankType,
        cashBankId,
        amount: parsedAmount,
        description,
        reference,
        attachmentUrl,
        status: statusTarget,
      };

      const res = await authFetch('/api/penerimaan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan penerimaan');
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
    if (!confirm('Posting penerimaan ini ke Jurnal Umum? Saldo kas/bank akan bertambah.')) return;
    try {
      const res = await authFetch(`/api/transactions/${id}/post`, {
        method: 'POST',
        body: JSON.stringify({ allowNegativeBalance: true }),
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
    if (fundFilter && String(t.fundId) !== fundFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.transactionNumber.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      if (!matchNum && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <ArrowDownLeft className="h-4 w-4" />
            <span>KEUANGAN → PENERIMAAN KAS/BANK</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Transaksi Penerimaan Kas & Bank
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan pendapatan infak, donasi, wakaf, pendaftaran santri, dan hasil unit usaha
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Penerimaan</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. KM, uraian..."
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
              <th className="px-4 py-3.5">No. Penerimaan</th>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">Uraian / Keterangan</th>
              <th className="px-4 py-3.5">Tujuan Kas/Bank</th>
              <th className="px-4 py-3.5">Unit & Sumber</th>
              <th className="px-4 py-3.5 text-right">Nominal (Rp)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Memuat data penerimaan...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Belum ada data penerimaan kas/bank.
                </td>
              </tr>
            ) : (
              filtered.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-900">
                    {trx.transactionNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{trx.date}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-xs truncate" title={trx.description}>
                    <div className="font-medium">{trx.description}</div>
                    {trx.reference && (
                      <span className="text-[10px] text-gray-400">Ref: {trx.reference}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {trx.cashBankType === 'KAS' ? 'Kas Tunai' : 'Bank'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{trx.unitName || 'Pusat'}</div>
                    <div className="text-[10px] text-gray-400">{trx.fundName || 'Operasional'}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                    +{formatRupiah(trx.totalAmount)}
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
                          title="Setujui Penerimaan"
                          className="rounded-lg bg-blue-50 p-1.5 text-blue-700 hover:bg-blue-100"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Post button */}
                      {(trx.status === 'DISETUJUI' || trx.status === 'DRAFT') && isBendaharaOrAdmin && (
                        <button
                          onClick={() => handlePost(trx.id)}
                          title="Posting ke Jurnal & Tambah Kas/Bank"
                          className="rounded-lg bg-emerald-100 p-1.5 text-emerald-800 hover:bg-emerald-200"
                        >
                          <FileCheck2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Reversal / Void button */}
                      {trx.status === 'POSTED' && isBendaharaOrAdmin && (
                        <button
                          onClick={() => {
                            setReverseModalTrx(trx);
                            setReverseReason('');
                          }}
                          title="Void / Reversal Penerimaan"
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

      {/* CREATE PENERIMAAN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Input Transaksi Penerimaan (KM)
                </h3>
                <p className="text-xs text-gray-500">
                  Sistem otomatis menghasilkan Jurnal Seimbang (DEBIT: Kas/Bank, KREDIT: Pendapatan)
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
                  <label className="block font-semibold text-gray-700">Tanggal Penerimaan *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Akun Pendapatan *</label>
                  <select
                    required
                    value={incomeAccountId}
                    onChange={(e) => setIncomeAccountId(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  >
                    {incomeAccounts.map((a) => (
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
                  <label className="block font-semibold text-gray-700">Penerimaan Masuk Ke *</label>
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
                          {b.bankName} - {b.accountNumber} ({formatRupiah(b.currentBalance)})
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
                          {c.name} ({formatRupiah(c.currentBalance)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Unit, Fund, Amount */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

                <div>
                  <label className="block font-semibold text-gray-700">Nominal Penerimaan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 10000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs font-mono font-bold text-gray-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description & Reference */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-gray-700">Uraian / Keterangan Transaksi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penerimaan infak donasi pembangunan kamar santri"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">No. Bukti / Kwitansi / Referensi</label>
                  <input
                    type="text"
                    placeholder="Contoh: BSI-TRF-00912, KWT-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Attachment upload */}
              <div>
                <label className="block font-semibold text-gray-700">Upload Bukti Transaksi (Kwitansi / Slip Transfer)</label>
                <div className="mt-1 flex items-center space-x-3">
                  <label className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100">
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span>Pilih Foto/Dokumen Bukti</span>
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

              {/* Dynamic Journal Preview Banner */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                <span className="font-bold text-emerald-950">Pratinjau Jurnal Otomatis (Double-Entry Seimbang):</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-white p-2 border border-emerald-100">
                    <span className="text-gray-500">DEBIT:</span>{' '}
                    <span className="font-bold text-emerald-900">{cashBankType} (Aset)</span>
                    <p className="text-emerald-700 font-bold">{formatRupiah(amount || 0)}</p>
                  </div>
                  <div className="rounded bg-white p-2 border border-emerald-100">
                    <span className="text-gray-500">KREDIT:</span>{' '}
                    <span className="font-bold text-emerald-900">Akun Pendapatan</span>
                    <p className="text-emerald-700 font-bold">{formatRupiah(amount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                  {actionLoading ? 'Menyimpan...' : isBendaharaOrAdmin ? 'Simpan & Posting' : 'Ajukan Penerimaan'}
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
                <h3 className="text-base font-bold text-gray-900">Detail Penerimaan</h3>
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
                  <p className="font-bold text-emerald-800">{formatRupiah(detailTrx.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.status}</p>
                </div>
                <div>
                  <span className="text-gray-400">Unit:</span>
                  <p className="font-semibold text-gray-800">{detailTrx.unitName || 'Pusat'}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400">Uraian:</span>
                <p className="mt-0.5 text-sm font-medium text-gray-900">{detailTrx.description}</p>
              </div>

              {detailTrx.attachmentUrl && (
                <div>
                  <span className="text-gray-400">Bukti Lampiran:</span>
                  <div className="mt-1 overflow-hidden rounded-xl border border-gray-200">
                    <img src={detailTrx.attachmentUrl} alt="Bukti transaksi" className="max-h-56 w-full object-contain bg-gray-50" />
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
              <h3 className="text-base font-bold">Koreksi / Reversal Penerimaan</h3>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Transaksi <strong>{reverseModalTrx.transactionNumber}</strong> akan dibatalkan melalui pembuatan jurnal pembalik otomatis. Saldo kas/bank akan dikurangi kembali sesuai nominal.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700">Alasan Pembatalan / Koreksi *</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Salah input pos akun atau donasi dialihkan..."
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
