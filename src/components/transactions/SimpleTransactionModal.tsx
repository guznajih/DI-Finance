import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SimpleTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: string;
}

export const SimpleTransactionModal: React.FC<SimpleTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'PENERIMAAN',
}) => {
  const { authFetch, user } = useAuth();

  // Form states
  const [trxType, setTrxType] = useState<string>(defaultType);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [cashBankType, setCashBankType] = useState<'KAS' | 'BANK'>('BANK');
  const [cashBankId, setCashBankId] = useState<string>('');
  const [toCashBankType, setToCashBankType] = useState<'KAS' | 'BANK'>('BANK');
  const [toCashBankId, setToCashBankId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  // Dropdown data
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);

  // Preview & Explanation
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Confirmation Step
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  useEffect(() => {
    if (defaultType) setTrxType(defaultType);
  }, [defaultType]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (trxType) {
      loadCategories(trxType);
    }
  }, [trxType]);

  // Auto preview when essential fields change
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (isOpen && categoryName && numAmount > 0 && cashBankId) {
      fetchPreview();
    } else {
      setPreview(null);
    }
  }, [trxType, categoryName, amount, cashBankType, cashBankId, toCashBankType, toCashBankId, unitId, fundId]);

  const loadInitialData = async () => {
    try {
      const [cashRes, bankRes, unitRes, fundRes] = await Promise.all([
        authFetch('/api/cash-accounts'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/units'),
        authFetch('/api/funds'),
      ]);

      if (cashRes.ok) setCashAccounts(await cashRes.json());
      if (bankRes.ok) {
        const banks = await bankRes.json();
        setBankAccounts(banks);
        if (banks.length > 0 && !cashBankId) {
          setCashBankId(String(banks[0].id));
        }
        if (banks.length > 1 && !toCashBankId) {
          setToCashBankId(String(banks[1].id));
        }
      }
      if (unitRes.ok) setUnits(await unitRes.json());
      if (fundRes.ok) {
        const fList = await fundRes.json();
        setFunds(fList);
        if (fList.length > 0 && !fundId) setFundId(String(fList[0].id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async (type: string) => {
    try {
      const res = await authFetch(`/api/fase7/categories?type=${type}`);
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryName(cats[0].name);
        } else {
          setCategoryName('');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPreview = async () => {
    setPreviewLoading(true);
    setErrorMsg(null);
    try {
      const res = await authFetch('/api/fase7/transactions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          type: trxType,
          categoryName,
          amount: parseFloat(amount) || 0,
          cashBankType,
          cashBankId: parseInt(cashBankId, 10),
          toCashBankType,
          toCashBankId: toCashBankId ? parseInt(toCashBankId, 10) : undefined,
          unitId: unitId ? parseInt(unitId, 10) : undefined,
          fundId: fundId ? parseInt(fundId, 10) : undefined,
          recipient,
          description: description || `Transaksi ${categoryName}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Gagal memuat preview jurnal');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) {
      setErrorMsg('Kategori transaksi wajib dipilih.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }
    if (!cashBankId) {
      setErrorMsg('Rekening Kas atau Bank wajib dipilih.');
      return;
    }

    if (preview && !preview.isBalanced) {
      setErrorMsg('Jurnal tidak balance! Transaksi tidak dapat diposting.');
      return;
    }

    if (preview?.balanceCheck?.isInsufficient) {
      setErrorMsg('Saldo rekening tidak mencukupi untuk transaksi ini.');
      return;
    }

    setErrorMsg(null);
    setShowConfirmation(true);
  };

  const handleFinalPost = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await authFetch('/api/fase7/transactions/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          type: trxType,
          categoryName,
          amount: parseFloat(amount),
          cashBankType,
          cashBankId: parseInt(cashBankId, 10),
          toCashBankType,
          toCashBankId: toCashBankId ? parseInt(toCashBankId, 10) : undefined,
          unitId: unitId ? parseInt(unitId, 10) : undefined,
          fundId: fundId ? parseInt(fundId, 10) : undefined,
          recipient,
          description: description || `Transaksi ${categoryName}`,
          reference,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memposting transaksi');
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal posting transaksi');
      setShowConfirmation(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Form Transaksi Sederhana (Bahasa Operasional)
            </h2>
            <p className="text-xs text-gray-500">
              Bendahara cukup memasukkan jenis & rincian operasional, debit/kredit diatur otomatis oleh sistem.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: FORM INPUT */}
          {!showConfirmation ? (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Jenis Transaksi Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'PENERIMAAN', label: 'Penerimaan' },
                    { id: 'PENGELUARAN', label: 'Pengeluaran' },
                    { id: 'TRANSFER', label: 'Transfer Bank' },
                    { id: 'INVESTASI', label: 'Investasi' },
                    { id: 'PENGEMBALIAN_INVESTASI', label: 'Pengembalian Inv.' },
                    { id: 'PENDAPATAN_INVESTASI', label: 'Bagi Hasil Inv.' },
                    { id: 'PENYESUAIAN', label: 'Penyesuaian' },
                    { id: 'LAINNYA', label: 'Lainnya' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrxType(t.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold text-center transition ${
                        trxType === t.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 1: Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Kategori Transaksi</label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <option value="Operasional Umum">Operasional Umum</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 2: Rekening Sumber & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    {trxType === 'PENERIMAAN' || trxType === 'PENGEMBALIAN_INVESTASI' || trxType === 'PENDAPATAN_INVESTASI'
                      ? 'Diterima Ke Rekening / Kas'
                      : 'Dibayar Dari Rekening / Kas'}
                  </label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={cashBankType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setCashBankType(val);
                        if (val === 'KAS' && cashAccounts.length > 0) setCashBankId(String(cashAccounts[0].id));
                        if (val === 'BANK' && bankAccounts.length > 0) setCashBankId(String(bankAccounts[0].id));
                      }}
                      className="w-1/3 rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="BANK">Bank</option>
                      <option value="KAS">Kas Tunai</option>
                    </select>

                    <select
                      value={cashBankId}
                      onChange={(e) => setCashBankId(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                    >
                      {cashBankType === 'BANK'
                        ? bankAccounts.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} - {b.accountNumber} (Saldo: {formatRupiah(b.currentBalance)})
                            </option>
                          ))
                        : cashAccounts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (Saldo: {formatRupiah(c.currentBalance)})
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Nominal Transaksi (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Contoh: 5000000"
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Transfer Target (Jika Tipe TRANSFER) */}
              {trxType === 'TRANSFER' && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    Ditransfer Ke (Rekening / Kas Tujuan)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={toCashBankType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setToCashBankType(val);
                        if (val === 'KAS' && cashAccounts.length > 0) setToCashBankId(String(cashAccounts[0].id));
                        if (val === 'BANK' && bankAccounts.length > 0) setToCashBankId(String(bankAccounts[0].id));
                      }}
                      className="w-1/3 rounded-xl border border-blue-200 bg-white p-2.5 text-xs text-gray-800 focus:outline-none"
                    >
                      <option value="BANK">Bank</option>
                      <option value="KAS">Kas Tunai</option>
                    </select>
                    <select
                      value={toCashBankId}
                      onChange={(e) => setToCashBankId(e.target.value)}
                      className="flex-1 rounded-xl border border-blue-200 bg-white p-2.5 text-xs text-gray-800 focus:outline-none"
                    >
                      {toCashBankType === 'BANK'
                        ? bankAccounts.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} - {b.accountNumber}
                            </option>
                          ))
                        : cashAccounts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Row 3: Unit, Sumber Dana, Penerima/Pihak Ketiga */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Unit / Lembaga</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Umum / Pesantren --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Sumber Dana</label>
                  <select
                    value={fundId}
                    onChange={(e) => setFundId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700">Pihak / Mitra / Penerima</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Contoh: PLN, Toko ATK, Mitra Farm"
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Uraian & Nomor Bukti */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700">Uraian / Keterangan Transaksi</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Keterangan transaksi ${categoryName || ''}`}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Nomor Bukti / Kuitansi</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Contoh: KWT-001/PLN"
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Classification Warning Notice if any */}
              {preview?.classificationNotice && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Pencegahan Salah Klasifikasi:</span>
                    <p className="mt-0.5">{preview.classificationNotice}</p>
                  </div>
                </div>
              )}

              {/* Budget Check Indicator */}
              {preview?.budgetInfo?.isLinked && (
                <div className={`rounded-xl border p-3 text-xs ${
                  preview.budgetInfo.isOverBudget
                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Validasi Anggaran: {preview.budgetInfo.budgetCode}</span>
                    <span>{preview.budgetInfo.isOverBudget ? 'MELAMPAUI PAGU ✕' : 'AMAN ✓'}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Pagu: {formatRupiah(preview.budgetInfo.allocatedAmount)}</div>
                    <div>Sisa Sebelumnya: {formatRupiah(preview.budgetInfo.remainingBefore)}</div>
                    <div>Transaksi Ini: {formatRupiah(amount)}</div>
                    <div className="font-bold">Sisa Akhir: {formatRupiah(preview.budgetInfo.remainingAfter)}</div>
                  </div>
                </div>
              )}

              {/* PREVIEW JURNAL OTOMATIS */}
              {preview && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-emerald-700" />
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                        Preview Jurnal Akuntansi Otomatis
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Kenapa jurnalnya seperti ini?</span>
                    </button>
                  </div>

                  {/* Lines Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2">Posisi</th>
                          <th className="px-3 py-2">Akun COA</th>
                          <th className="px-3 py-2 text-right">Debit (Rp)</th>
                          <th className="px-3 py-2 text-right">Kredit (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {preview.lines.map((line: any, idx: number) => (
                          <tr key={idx} className={line.position === 'DEBIT' ? 'bg-white' : 'bg-gray-50/30'}>
                            <td className="px-3 py-2 font-bold text-gray-900">
                              {line.position}
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-medium">{line.accountCode} - {line.accountName}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">
                              {line.debit > 0 ? formatRupiah(line.debit) : '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">
                              {line.credit > 0 ? formatRupiah(line.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 font-bold text-gray-900 border-t border-gray-200">
                        <tr>
                          <td colSpan={2} className="px-3 py-2 text-right">Total:</td>
                          <td className="px-3 py-2 text-right font-mono">{formatRupiah(preview.totalDebit)}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatRupiah(preview.totalCredit)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Balance Status Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Keseimbangan Double-Entry:</span>
                    <span
                      className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full ${
                        preview.isBalanced
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {preview.balanceStatusText}
                    </span>
                  </div>

                  {/* Penjelasan Debit / Kredit Modal Box */}
                  {showExplanation && preview.explanation && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-gray-800 space-y-2">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span>Penjelasan Akuntansi (Bahasa Sederhana):</span>
                        <button
                          type="button"
                          onClick={() => setShowExplanation(false)}
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-medium text-emerald-900">{preview.explanation.summaryText}</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-700 text-[11px]">
                        {preview.explanation.plainReasons?.map((reason: string, rIdx: number) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={previewLoading || (preview && !preview.isBalanced)}
                  className="flex items-center space-x-1.5 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <span>Lanjutkan Konfirmasi Posting</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: KONFIRMASI POSTING TRANSAKSI */
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h3 className="font-bold text-sm">Pastikan transaksi berikut sudah benar sebelum diposting.</h3>
                </div>
                <p className="mt-1 text-xs text-emerald-800">
                  Setelah transaksi berstatus POSTED, catatan tidak dapat diedit secara langsung melainkan harus melalui mekanisme VOID / REVERSAL demi menjaga keaslian audit trail akuntansi.
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Tanggal:</span>
                    <p className="font-semibold text-gray-900">{date}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jenis Transaksi:</span>
                    <p className="font-semibold text-gray-900">{trxType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kategori:</span>
                    <p className="font-semibold text-gray-900">{categoryName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nominal:</span>
                    <p className="font-bold text-emerald-800 text-sm">{formatRupiah(amount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Rekening Kas/Bank:</span>
                    <p className="font-semibold text-gray-900">
                      {cashBankType} (ID: {cashBankId})
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Penerima/Mitra:</span>
                    <p className="font-semibold text-gray-900">{recipient || '-'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Keterangan:</span>
                  <p className="font-medium text-gray-800">{description || '-'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  ← Kembali Perbaiki
                </button>

                <button
                  type="button"
                  onClick={handleFinalPost}
                  disabled={submitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{submitting ? 'Memposting...' : 'Posting Transaksi Sekarang'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
