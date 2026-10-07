import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  History,
  Landmark,
  PlusCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, BankAccount, CashAccount, InvestmentTransaction } from '../../types/index.ts';

export const InvestmentReturnView: React.FC = () => {
  const { user, authFetch } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Fields
  const [investmentId, setInvestmentId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cashBankType, setCashBankType] = useState<'BANK' | 'KAS'>('BANK');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [cashAccountId, setCashAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, banksRes, cashRes, txRes] = await Promise.all([
        authFetch('/api/investments'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/investment-transactions?type=PENGEMBALIAN_MODAL'),
      ]);

      if (invRes.ok) {
        const invList: Investment[] = await invRes.json();
        // Allow return for investments that still have currentValue > 0
        setInvestments(invList.filter((i) => Number(i.currentValue) > 0));
      }
      if (banksRes.ok) {
        const banks: BankAccount[] = await banksRes.json();
        setBankAccounts(banks);
        if (banks.length > 0 && !bankAccountId) setBankAccountId(String(banks[0].id));
      }
      if (cashRes.ok) {
        const cash: CashAccount[] = await cashRes.json();
        setCashAccounts(cash);
        if (cash.length > 0 && !cashAccountId) setCashAccountId(String(cash[0].id));
      }
      if (txRes.ok) {
        setTransactions(await txRes.json());
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data formulir' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedInvestment = investments.find((i) => String(i.id) === investmentId);

  const handleSelectInvestment = (idStr: string) => {
    setInvestmentId(idStr);
    const chosen = investments.find((i) => String(i.id) === idStr);
    if (chosen) {
      if (!description) {
        setDescription(`Pengembalian modal investasi dari ${chosen.investeeName} (${chosen.investmentNumber})`);
      }
    }
  };

  const formatRupiah = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const currentCapital = selectedInvestment ? Number(selectedInvestment.currentValue) : 0;
  const inputAmount = Number(amount) || 0;
  const isOverReturn = inputAmount > currentCapital;
  const remainingAfter = Math.max(0, currentCapital - inputAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !date || !amount || Number(amount) <= 0) {
      setFeedback({ type: 'error', message: 'Lengkapi investasi, tanggal, dan nominal yang valid (> 0)' });
      return;
    }

    if (isOverReturn) {
      setFeedback({
        type: 'error',
        message: `Pengembalian modal (${formatRupiah(amount)}) melebihi nilai investasi berjalan (${formatRupiah(currentCapital)}). Sistem menolak transaksi ini!`,
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await authFetch(`/api/investments/${investmentId}/capital-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amount: parseFloat(amount),
          cashBankType,
          bankAccountId: cashBankType === 'BANK' ? parseInt(bankAccountId, 10) : undefined,
          cashAccountId: cashBankType === 'KAS' ? parseInt(cashAccountId, 10) : undefined,
          reference,
          description,
          attachmentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pengembalian modal');

      setFeedback({
        type: 'success',
        message: `Pengembalian modal sebesar ${formatRupiah(amount)} berhasil dibukukan! Nilai modal berjalan menjadi ${formatRupiah(data.newCurrentValue)}. Jurnal DEBIT Kas/Bank & KREDIT Aset Investasi (BUKAN PENDAPATAN) terposting.`,
      });

      // Reset
      setAmount('');
      setReference('');
      setDescription('');
      setAttachmentUrl('');
      setInvestmentId('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="h-6 w-6 text-blue-700" />
          Pengembalian Modal Investasi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Penerimaan kembali dana pokok investasi dari mitra.{' '}
          <strong className="text-blue-900">
            Pengembalian modal BUKAN pendapatan. Transaksi ini mengkredit Akun Aset Investasi (1150) dan mengurangi nilai investasi berjalan.
          </strong>
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Grid: Form & Preview Jurnal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Left (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-700" />
            Formulir Pengembalian Modal Investasi
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. Pilih Investasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pilih Investasi / Mitra *
              </label>
              <select
                required
                value={investmentId}
                onChange={(e) => handleSelectInvestment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Investasi Yang Masih Memiliki Saldo Modal --</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investmentNumber} - {inv.investeeName} · Sisa Modal Berjalan: {formatRupiah(inv.currentValue)} · [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            {selectedInvestment && (
              <div className="rounded-xl bg-blue-50/60 p-3.5 border border-blue-200 text-xs text-blue-950 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-blue-700">Modal Awal:</span>
                  <p className="font-semibold text-slate-700 font-mono">{formatRupiah(selectedInvestment.initialCapital)}</p>
                </div>
                <div>
                  <span className="text-blue-700">Modal Telah Kembali:</span>
                  <p className="font-semibold text-slate-700 font-mono">{formatRupiah(selectedInvestment.totalCapitalReturned)}</p>
                </div>
                <div>
                  <span className="text-blue-700">Sisa Nilai Berjalan:</span>
                  <p className="font-black text-blue-900 font-mono">{formatRupiah(selectedInvestment.currentValue)}</p>
                </div>
                <div>
                  <span className="text-blue-700">Estimasi Sisa Akhir:</span>
                  <p className={`font-mono font-bold ${isOverReturn ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatRupiah(remainingAfter)}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Tanggal Pengembalian */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tanggal Pengembalian Dana *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 3. Rekening Penerima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rekening Kas/Bank Penerima Setoran *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setCashBankType('BANK')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    cashBankType === 'BANK'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Rekening Bank
                </button>
                <button
                  type="button"
                  onClick={() => setCashBankType('KAS')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    cashBankType === 'KAS'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Kas Tunai
                </button>
              </div>

              {cashBankType === 'BANK' ? (
                <select
                  required
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({formatRupiah(b.currentBalance)})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  required
                  value={cashAccountId}
                  onChange={(e) => setCashAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatRupiah(c.currentBalance)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 4. Nominal Pengembalian */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nominal Modal yang Dikembalikan (Rp) *
                </label>
                {selectedInvestment && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedInvestment.currentValue)}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    Kembalikan Seluruh Sisa ({formatRupiah(selectedInvestment.currentValue)})
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Contoh: 500000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-base font-mono font-bold focus:outline-none ${
                  isOverReturn
                    ? 'border-rose-400 text-rose-800 bg-rose-50/50'
                    : 'border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
              {isOverReturn && (
                <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Nominal melebihi sisa nilai investasi berjalan ({formatRupiah(currentCapital)})!
                </p>
              )}
            </div>

            {/* 5. Referensi & Bukti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. Referensi / Bukti Transfer
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RET-BSI-109281"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lampiran Bukti Transaksi (Link / URL)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Deskripsi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Keterangan / Catatan
              </label>
              <textarea
                rows={2}
                placeholder="Rincian pengembalian pokok modal, pengembalian bertahap, pelunasan akhir..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting || isOverReturn}
                className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Memposting...' : 'Posting Pengembalian Modal'}
              </button>
            </div>
          </form>
        </div>

        {/* Right (1 col): Preview Jurnal & Aturan Akuntansi */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-xs text-blue-950">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-blue-700" />
              Simulasi Jurnal Pengembalian Modal
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed mb-3">
              Jurnal otomatis mencatat mutasi aset tanpa menyentuh akun pendapatan:
            </p>

            <div className="rounded-xl bg-white p-3.5 border border-blue-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-900 border-b border-slate-100 pb-1.5">
                <span>[DEBIT] {cashBankType === 'BANK' ? 'Bank Pesantren' : 'Kas Pesantren'}</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-blue-900 pt-0.5 pl-4">
                <span>[KREDIT] 1150 - Aset Investasi</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-blue-900/80 space-y-1">
              <div className="flex items-center gap-1 font-bold text-blue-950">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                DILARANG DIBUKUKAN SEBAGAI PENDAPATAN
              </div>
              <p>
                Sistem secara otomatis menjaga agar pengembalian modal tidak dicampuradukkan dengan pendapatan operasional pesantren.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Otomasi Status Selesai (COMPLETED)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Jika sisa nilai modal berjalan mencapai Rp 0 setelah pengembalian ini, status investasi akan otomatis diperbarui menjadi <strong>COMPLETED (Selesai/Lunas)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Pengembalian Modal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />
          Riwayat Pengembalian Modal
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Investasi / Mitra</th>
                <th className="py-2.5 px-3">Rekening Penerima</th>
                <th className="py-2.5 px-3 text-right">Nominal Modal</th>
                <th className="py-2.5 px-3">No. Jurnal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    Belum ada riwayat pengembalian modal investasi.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-slate-800">
                      {tx.transactionNumber}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">{tx.date}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{tx.investeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tx.investmentNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700">
                      {tx.bankName ? `${tx.bankName} (${tx.bankAccountNumber})` : tx.cashName || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">
                      {tx.journalNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
