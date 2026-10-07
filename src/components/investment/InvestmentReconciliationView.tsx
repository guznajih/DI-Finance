import React, { useEffect, useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  PlusCircle,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, InvestmentReconciliation, ReconciliationStatus } from '../../types/index.ts';

export const InvestmentReconciliationView: React.FC = () => {
  const { user, authFetch } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [reconciliations, setReconciliations] = useState<InvestmentReconciliation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [investmentId, setInvestmentId] = useState<string>('');
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [investeeReportedValue, setInvesteeReportedValue] = useState<string>('');
  const [expectedProfitSharing, setExpectedProfitSharing] = useState<string>('');
  const [actualProfitReceived, setActualProfitReceived] = useState<string>('');
  const [capitalReturned, setCapitalReturned] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, recRes] = await Promise.all([
        authFetch('/api/investments'),
        authFetch(`/api/investment-reconciliations${statusFilter ? `?status=${statusFilter}` : ''}`),
      ]);

      if (invRes.ok) setInvestments(await invRes.json());
      if (recRes.ok) setReconciliations(await recRes.json());
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data rekonsiliasi' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const selectedInvestment = investments.find((i) => String(i.id) === investmentId);

  const handleSelectInvestment = (idStr: string) => {
    setInvestmentId(idStr);
    const chosen = investments.find((i) => String(i.id) === idStr);
    if (chosen) {
      setInvesteeReportedValue(chosen.currentValue);
      setExpectedProfitSharing(chosen.totalReturnProfit);
      setActualProfitReceived(chosen.totalReturnProfit);
      setCapitalReturned(chosen.totalCapitalReturned);
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

  const systemVal = selectedInvestment ? Number(selectedInvestment.currentValue) : 0;
  const reportedVal = Number(investeeReportedValue) || 0;
  const diffVal = reportedVal - systemVal;
  const hasVariance = Math.abs(diffVal) > 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !asOfDate || investeeReportedValue === '') {
      setFeedback({ type: 'error', message: 'Pilih investasi, tanggal per tanggal, dan nilai menurut mitra' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await authFetch('/api/investment-reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: parseInt(investmentId, 10),
          asOfDate,
          investeeReportedValue: parseFloat(investeeReportedValue),
          expectedProfitSharing: expectedProfitSharing ? parseFloat(expectedProfitSharing) : undefined,
          actualProfitReceived: actualProfitReceived ? parseFloat(actualProfitReceived) : undefined,
          capitalReturned: capitalReturned ? parseFloat(capitalReturned) : undefined,
          notes,
          attachmentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan rekonsiliasi');

      setFeedback({
        type: 'success',
        message: `Rekonsiliasi ${data.reconciliationNumber} berhasil disimpan dengan status ${data.status}!`,
      });

      // Reset
      setInvestmentId('');
      setInvesteeReportedValue('');
      setExpectedProfitSharing('');
      setActualProfitReceived('');
      setCapitalReturned('');
      setNotes('');
      setAttachmentUrl('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ReconciliationStatus) => {
    const map: Record<ReconciliationStatus, { label: string; cls: string; icon: any }> = {
      MATCHED: { label: 'SESUAI (MATCHED)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
      VARIANCE: { label: 'ADA SELISIH (VARIANCE)', cls: 'bg-rose-100 text-rose-800 border-rose-300', icon: AlertTriangle },
      PENDING: { label: 'PENDING', cls: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
      NEEDS_REVIEW: { label: 'PERLU REVIEW', cls: 'bg-purple-100 text-purple-800 border-purple-300', icon: HelpCircle },
    };
    const b = map[status] || { label: status, cls: 'bg-slate-100 text-slate-800 border-slate-300', icon: HelpCircle };
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.cls}`}>
        <Icon className="h-3.5 w-3.5" />
        {b.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Scale className="h-6 w-6 text-emerald-700" />
          Rekonsiliasi Investasi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pencocokan nilai buku investasi menurut sistem akuntansi pesantren dengan laporan keuangan / konfirmasi dari pihak mitra (investee).
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

      {/* Grid: Form & Real-time Comparison Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Left (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-700" />
            Input Berita Acara Rekonsiliasi
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
                <option value="">-- Pilih Portofolio Investasi --</option>
                {investments.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.investmentNumber} - {inv.investeeName} · Nilai Buku: {formatRupiah(inv.currentValue)} · [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tanggal Per (As of Date) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tanggal Cut-Off / Posisi Rekonsiliasi (As of Date) *
              </label>
              <input
                type="date"
                required
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* 3. Nilai Menurut Mitra & Sistem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nilai Modal Menurut Laporan Mitra (Investee) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="Contoh: 500000000"
                  value={investeeReportedValue}
                  onChange={(e) => setInvesteeReportedValue(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nilai Modal Menurut Sistem Pesantren
                </label>
                <div className="rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-200 flex items-center justify-between">
                  <span>{formatRupiah(systemVal)}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-normal">Otomatis Terkunci</span>
                </div>
              </div>
            </div>

            {/* 4. Realisasi Bagi Hasil & Pengembalian Modal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bagi Hasil Seharusnya
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={expectedProfitSharing}
                  onChange={(e) => setExpectedProfitSharing(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bagi Hasil Sudah Diterima
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={actualProfitReceived}
                  onChange={(e) => setActualProfitReceived(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Modal Sudah Dikembalikan
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={capitalReturned}
                  onChange={(e) => setCapitalReturned(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Catatan & Lampiran */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Rekonsiliasi & Hasil Klarifikasi
                </label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan hasil konfirmasi dengan pihak manajemen mitra, verifikasi rekening koran..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lampiran Berkas Laporan Keuangan Mitra / Rekening Koran (Link)
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

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Hasil Rekonsiliasi'}
              </button>
            </div>
          </form>
        </div>

        {/* Right (1 col): Real-time Difference & Status Banner */}
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-5 shadow-xs transition-colors ${
              hasVariance
                ? 'border-rose-300 bg-rose-50/70 text-rose-950'
                : 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">
                Status Rekonsiliasi Otomatis
              </span>
              {hasVariance ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-900">
                  <AlertTriangle className="h-3.5 w-3.5" /> VARIANCE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-3.5 w-3.5" /> MATCHED
                </span>
              )}
            </div>

            <div className="rounded-xl bg-white p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Nilai Menurut Sistem:</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(systemVal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Laporan Mitra (Investee):</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(reportedVal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-800">Selisih:</span>
                <span className={`font-mono text-sm font-black ${hasVariance ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatRupiah(diffVal)}
                </span>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed">
              {hasVariance
                ? 'Terdapat selisih antara saldo buku sistem dengan pengakuan mitra. Status rekonsiliasi ditandai sebagai VARIANCE untuk ditindaklanjuti.'
                : 'Nilai buku sistem cocok 100% dengan konfirmasi laporan mitra. Tidak terdapat selisih.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Kategori Status Rekonsiliasi
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li><strong>MATCHED</strong>: Selisih Rp 0.</li>
              <li><strong>VARIANCE</strong>: Terdapat perbedaan angka yang perlu diklarifikasi.</li>
              <li><strong>NEEDS REVIEW</strong>: Perlu review pimpinan / bendahara pondok.</li>
              <li><strong>PENDING</strong>: Menunggu berkas laporan mitra.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* History of Reconciliations */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Berita Acara Rekonsiliasi
            </h2>
            <p className="text-xs text-slate-500">
              Daftar pencocokan nilai investasi per tanggal buku
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="MATCHED">MATCHED</option>
              <option value="VARIANCE">VARIANCE</option>
              <option value="PENDING">PENDING</option>
              <option value="NEEDS_REVIEW">NEEDS REVIEW</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Rekonsiliasi</th>
                <th className="py-2.5 px-3">Per Tanggal</th>
                <th className="py-2.5 px-3">Investasi / Mitra</th>
                <th className="py-2.5 px-3 text-right">Nilai Sistem</th>
                <th className="py-2.5 px-3 text-right">Laporan Mitra</th>
                <th className="py-2.5 px-3 text-right">Selisih</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Perekonsiliasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                    Belum ada riwayat rekonsiliasi investasi.
                  </td>
                </tr>
              ) : (
                reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono text-xs font-bold text-slate-800">
                      {rec.reconciliationNumber}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                      {rec.asOfDate}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{rec.investeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rec.investmentNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-slate-700">
                      {formatRupiah(rec.systemBookValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-semibold text-slate-900">
                      {formatRupiah(rec.investeeReportedValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                      <span className={Number(rec.difference) !== 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatRupiah(rec.difference)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600">
                      {rec.reconcilerName || 'Petugas'}
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
