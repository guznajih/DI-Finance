import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Landmark,
  PlusCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  History,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, BankAccount, CashAccount, InvestmentTransaction } from '../../types/index.ts';

export const InvestmentPlacementView: React.FC = () => {
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
        authFetch('/api/investment-transactions?type=PENEMPATAN'),
      ]);

      if (invRes.ok) {
        const invList: Investment[] = await invRes.json();
        // Allow placement for APPROVED, ACTIVE, or DRAFT/SUBMITTED
        setInvestments(invList.filter((i) => i.status !== 'CANCELLED' && i.status !== 'COMPLETED'));
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

  // Auto-fill amount when investment selected
  const handleSelectInvestment = (idStr: string) => {
    setInvestmentId(idStr);
    const chosen = investments.find((i) => String(i.id) === idStr);
    if (chosen) {
      if (!amount) setAmount(chosen.initialCapital);
      if (!description) {
        setDescription(`Penempatan dana investasi pada ${chosen.investeeName} (${chosen.investmentNumber})`);
      }
    }
  };

  const getSourceBalance = (): number => {
    if (cashBankType === 'BANK') {
      const b = bankAccounts.find((item) => String(item.id) === bankAccountId);
      return b ? Number(b.currentBalance) : 0;
    } else {
      const c = cashAccounts.find((item) => String(item.id) === cashAccountId);
      return c ? Number(c.currentBalance) : 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !date || !amount || Number(amount) <= 0) {
      setFeedback({ type: 'error', message: 'Pilih investasi, tanggal, dan nominal yang valid (> 0)' });
      return;
    }

    const availableBal = getSourceBalance();
    if (Number(amount) > availableBal) {
      setFeedback({
        type: 'error',
        message: `Saldo ${cashBankType === 'BANK' ? 'rekening bank' : 'kas'} tidak mencukupi! Tersedia: ${formatRupiah(availableBal)}, Dibutuhkan: ${formatRupiah(amount)}`,
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await authFetch(`/api/investments/${investmentId}/placement`, {
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
      if (!res.ok) throw new Error(data.error || 'Gagal memproses penempatan dana');

      setFeedback({
        type: 'success',
        message: `Penempatan dana investasi sebesar ${formatRupiah(amount)} berhasil diposting ke Jurnal, Buku Besar, dan Kas/Bank!`,
      });

      // Reset form
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
          <ArrowUpRight className="h-6 w-6 text-emerald-700" />
          Penempatan Dana Investasi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pencatatan mutasi kas/bank keluar untuk penempatan modal pada lembaga/mitra investee.{' '}
          <strong className="text-emerald-800">
            Penempatan dicatat murni sebagai pemindahan aset (Bukan Beban/Biaya Operasional).
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

      {/* Main Grid: Form (Left) & Preview Jurnal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Left (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-700" />
            Formulir Penempatan Dana Investasi
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
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Pilih Investasi Terdaftar --</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investmentNumber} - {inv.investeeName} ({inv.investmentType}) · Modal: {formatRupiah(inv.initialCapital)} · [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            {selectedInvestment && (
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400">Modal Disetujui:</span>
                  <p className="font-bold text-slate-900 font-mono">{formatRupiah(selectedInvestment.initialCapital)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Sumber Dana:</span>
                  <p className="font-semibold text-slate-900">{selectedInvestment.fundName || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Akun Aset:</span>
                  <p className="font-mono text-slate-900">1150 - Aset Investasi</p>
                </div>
                <div>
                  <span className="text-slate-400">PIC Mitra:</span>
                  <p className="font-semibold text-slate-900">{selectedInvestment.picName}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Penempatan / Transfer *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* 3. Rekening Sumber (Kas/Bank) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Metode Kas / Bank *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCashBankType('BANK')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      cashBankType === 'BANK'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
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
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Kas Tunai
                  </button>
                </div>
              </div>
            </div>

            {/* Rekening Spesifik & Saldo Tersedia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {cashBankType === 'BANK' ? 'Pilih Rekening Bank Asal *' : 'Pilih Kas Asal *'}
                </label>
                {cashBankType === 'BANK' ? (
                  <select
                    required
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {cashAccounts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatRupiah(c.currentBalance)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Saldo Tersedia Saat Ini
                </label>
                <div className="rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-mono font-bold text-slate-800 border border-slate-200 flex items-center justify-between">
                  <span>{formatRupiah(getSourceBalance())}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-normal">
                    {cashBankType === 'BANK' ? 'Saldo Bank' : 'Saldo Kas'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Nominal Penempatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nominal Penempatan Dana (Rp) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Contoh: 500000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* 5. Referensi & Bukti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. Referensi / Bukti Transfer
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-BSI-9847291"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lampiran Bukti Transfer (Link / URL)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 6. Deskripsi / Keterangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Keterangan Penempatan
              </label>
              <textarea
                rows={2}
                placeholder="Penjelasan penempatan dana investasi, tahap penyerahan modal, dll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Memposting...' : 'Posting Penempatan Dana'}
              </button>
            </div>
          </form>
        </div>

        {/* Right (1 col): Preview Jurnal & Aturan Akuntansi */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-xs text-emerald-950">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-emerald-700" />
              Simulasi Jurnal Otomatis (Double-Entry)
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed mb-3">
              Ketika Anda memposting formulir ini, mesin akuntansi akan membuat jurnal seimbang:
            </p>

            <div className="rounded-xl bg-white p-3.5 border border-emerald-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-emerald-900 border-b border-slate-100 pb-1.5">
                <span>[DEBIT] 1150 - Aset Investasi</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 pt-0.5 pl-4">
                <span>[KREDIT] {cashBankType === 'BANK' ? 'Bank Pesantren' : 'Kas Pesantren'}</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-emerald-900/80 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Total Debit = Total Kredit (Balance 100%)
              </div>
              <p>
                Penempatan dana <strong>BUKAN</strong> beban/biaya operasional pesantren. Kas/bank berkurang, aset investasi bertambah dengan nilai yang persis sama.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Otomasi Sistem yang Terjadi
            </h4>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
              <li>Status investasi berubah otomatis menjadi <strong>ACTIVE</strong>.</li>
              <li>Saldo Kas/Bank terpotong otomatis di Buku Bank/Kas.</li>
              <li>Jurnal Umum terbentuk dan diposting ke Buku Besar.</li>
              <li>Dashboard Investasi & Laporan Portofolio ter-update instan.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Riwayat Penempatan Dana */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />
          Riwayat Penempatan Dana Investasi
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Investasi / Mitra</th>
                <th className="py-2.5 px-3">Rekening Sumber</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 px-3">No. Jurnal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    Belum ada riwayat transaksi penempatan modal investasi.
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
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">
                      {tx.journalNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
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
