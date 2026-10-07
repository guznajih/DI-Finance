import React, { useEffect, useState } from 'react';
import {
  BadgePercent,
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
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, BankAccount, CashAccount, InvestmentTransaction } from '../../types/index.ts';

export const InvestmentProfitView: React.FC = () => {
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
  const [period, setPeriod] = useState<string>('');
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
        authFetch('/api/investment-transactions?type=BAGI_HASIL'),
      ]);

      if (invRes.ok) {
        const invList: Investment[] = await invRes.json();
        // Allow profit sharing for ACTIVE, APPROVED, or MATURED
        setInvestments(invList.filter((i) => i.status === 'ACTIVE' || i.status === 'APPROVED' || i.status === 'MATURED'));
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
        setDescription(`Penerimaan bagi hasil dari ${chosen.investeeName} (${chosen.investmentNumber})`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !date || !amount || Number(amount) <= 0) {
      setFeedback({ type: 'error', message: 'Lengkapi investasi, tanggal, dan nominal bagi hasil (> 0)' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await authFetch(`/api/investments/${investmentId}/profit-sharing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amount: parseFloat(amount),
          cashBankType,
          bankAccountId: cashBankType === 'BANK' ? parseInt(bankAccountId, 10) : undefined,
          cashAccountId: cashBankType === 'KAS' ? parseInt(cashAccountId, 10) : undefined,
          period,
          reference,
          description,
          attachmentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat pendapatan bagi hasil');

      setFeedback({
        type: 'success',
        message: `Penerimaan bagi hasil sebesar ${formatRupiah(amount)} berhasil diposting sebagai PENDAPATAN INVESTASI (4320) & saldo bertambah!`,
      });

      // Reset
      setAmount('');
      setPeriod('');
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
          <BadgePercent className="h-6 w-6 text-amber-600" />
          Penerimaan Pendapatan Bagi Hasil Investasi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pencatatan pendapatan bagi hasil, dividen, dan imbal hasil dari penempatan modal investasi pesantren.{' '}
          <strong className="text-amber-800">
            Jurnal otomatis masuk ke Akun 4320 (Pendapatan Bagi Hasil Investasi).
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
            <PlusCircle className="h-5 w-5 text-amber-600" />
            Formulir Penerimaan Bagi Hasil
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* 1. Pilih Investasi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pilih Portofolio Investasi *
              </label>
              <select
                required
                value={investmentId}
                onChange={(e) => handleSelectInvestment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Pilih Investasi Yang Sedang Berjalan --</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investmentNumber} - {inv.investeeName} · Nilai Berjalan: {formatRupiah(inv.currentValue)} · Nisbah: {inv.profitSharingPercentage || 0}% · [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            {selectedInvestment && (
              <div className="rounded-xl bg-amber-50/60 p-3.5 border border-amber-200 text-xs text-amber-950 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-amber-700">Modal Berjalan:</span>
                  <p className="font-bold font-mono text-slate-900">{formatRupiah(selectedInvestment.currentValue)}</p>
                </div>
                <div>
                  <span className="text-amber-700">Nisbah / Imbalan:</span>
                  <p className="font-bold">{selectedInvestment.profitSharingPercentage ? `${selectedInvestment.profitSharingPercentage}%` : '-'}</p>
                </div>
                <div>
                  <span className="text-amber-700">Jadwal Pembayaran:</span>
                  <p className="font-semibold">{selectedInvestment.profitPaymentSchedule || 'Bulanan'}</p>
                </div>
                <div>
                  <span className="text-amber-700">Total Telah Diterima:</span>
                  <p className="font-black font-mono text-amber-900">{formatRupiah(selectedInvestment.totalReturnProfit)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 2. Periode Bagi Hasil */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Periode Bagi Hasil (Bulan / Kuartal)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Oktober 2026 / Triwulan III"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* 3. Tanggal Penerimaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Penerimaan Kas/Bank *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Rekening Penerima */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rekening Penerima Dana *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setCashBankType('BANK')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    cashBankType === 'BANK'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
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
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatRupiah(c.currentBalance)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 5. Nominal Bagi Hasil */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nominal Bagi Hasil Diterima (Rp) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Contoh: 30000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base font-mono font-bold text-amber-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* 6. Referensi & Bukti */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  No. Referensi / Bukti Transfer Setoran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DIV-202610-098"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lampiran Bukti Bagi Hasil (Link / URL)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 7. Keterangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Catatan / Deskripsi
              </label>
              <textarea
                rows={2}
                placeholder="Rincian perhitungan bagi hasil, laporan omset mitra, dll..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 px-6 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Memposting...' : 'Posting Pendapatan Bagi Hasil'}
              </button>
            </div>
          </form>
        </div>

        {/* Right (1 col): Preview Jurnal & Aturan */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs text-amber-950">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-amber-700" />
              Simulasi Jurnal Pendapatan
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed mb-3">
              Mesin akuntansi secara otomatis mengkredit Akun Pendapatan Bagi Hasil:
            </p>

            <div className="rounded-xl bg-white p-3.5 border border-amber-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-900 border-b border-slate-100 pb-1.5">
                <span>[DEBIT] {cashBankType === 'BANK' ? 'Bank Pesantren' : 'Kas Pesantren'}</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-amber-900 pt-0.5 pl-4">
                <span>[KREDIT] 4320 - Pendapatan Bagi Hasil</span>
                <span className="font-bold">{formatRupiah(amount || 0)}</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-amber-900/80 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                Masuk Laporan Pendapatan / Aktivitas
              </div>
              <p>
                Pendapatan ini menambah surplus operasional pesantren dan dapat dilacak per sumber dana dan unit penanggung jawab.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Kepatuhan Rekonsiliasi
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Setiap bukti transfer atau slip perhitungan bagi hasil yang diterima dari mitra dapat langsung diverifikasi pada menu <strong>Rekonsiliasi Investasi</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Penerimaan Bagi Hasil */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-600" />
          Riwayat Penerimaan Bagi Hasil
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Investasi / Mitra</th>
                <th className="py-2.5 px-3">Periode</th>
                <th className="py-2.5 px-3">Rekening Penerima</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
                <th className="py-2.5 px-3">No. Jurnal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                    Belum ada riwayat penerimaan bagi hasil investasi.
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
                    <td className="py-3 px-3 text-xs text-slate-700 font-medium">
                      {tx.period || '-'}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700">
                      {tx.bankName ? `${tx.bankName} (${tx.bankAccountNumber})` : tx.cashName || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">
                      {formatRupiah(tx.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600">
                      {tx.journalNumber || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
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
