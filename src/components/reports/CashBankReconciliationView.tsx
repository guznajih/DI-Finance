import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  Filter,
  History,
  Landmark,
  PlusCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface CashBankRecItem {
  id: number;
  reconciliationNumber: string;
  accountType: 'KAS' | 'BANK';
  cashAccountId?: number;
  bankAccountId?: number;
  reconciliationDate: string;
  systemBalance: string;
  statementBalance: string;
  difference: string;
  status: 'MATCHED' | 'VARIANCE' | 'NEEDS_REVIEW';
  notes?: string;
  attachmentUrl?: string;
  reconciledById: number;
  createdAt: string;
  updatedAt: string;
  accountName: string;
  reconcilerName?: string;
}

export const CashBankReconciliationView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [reconciliations, setReconciliations] = useState<CashBankRecItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formAccountType, setFormAccountType] = useState<'KAS' | 'BANK'>('BANK');
  const [formBankId, setFormBankId] = useState<number>(0);
  const [formCashId, setFormCashId] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatementBalance, setFormStatementBalance] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Master accounts
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);

  // Selected system balance preview
  const [selectedSystemBalance, setSelectedSystemBalance] = useState<number>(0);

  const fetchMaster = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        authFetch('/api/bank-accounts'),
        authFetch('/api/cash-accounts'),
      ]);
      if (bRes.ok) {
        const banks = await bRes.json();
        setBankAccounts(banks);
        if (banks.length > 0 && formAccountType === 'BANK' && !formBankId) {
          setFormBankId(banks[0].id);
          setSelectedSystemBalance(Number(banks[0].currentBalance));
        }
      }
      if (cRes.ok) {
        const cash = await cRes.json();
        setCashAccounts(cash);
      }
    } catch (e) {
      console.error('Error fetching master in rec:', e);
    }
  };

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('accountType', filterType);
      if (filterStatus) params.append('status', filterStatus);
      const res = await authFetch(`/api/cash-bank-reconciliations?${params.toString()}`);
      if (res.ok) {
        setReconciliations(await res.json());
      }
    } catch (e) {
      console.error('Error fetching reconciliations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaster();
    fetchReconciliations();
  }, [filterType, filterStatus]);

  useEffect(() => {
    if (formAccountType === 'BANK') {
      const b = bankAccounts.find((acc) => acc.id === formBankId);
      setSelectedSystemBalance(b ? Number(b.currentBalance) : 0);
    } else {
      const c = cashAccounts.find((acc) => acc.id === formCashId);
      setSelectedSystemBalance(c ? Number(c.currentBalance) : 0);
    }
  }, [formAccountType, formBankId, formCashId, bankAccounts, cashAccounts]);

  const stmtBalNum = parseFloat(formStatementBalance.replace(/[^0-9.-]+/g, '')) || 0;
  const currentDifference = stmtBalNum - selectedSystemBalance;
  const isMatch = Math.abs(currentDifference) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      if (formAccountType === 'BANK' && !formBankId) {
        throw new Error('Rekening bank wajib dipilih.');
      }
      if (formAccountType === 'KAS' && !formCashId) {
        throw new Error('Rekening kas wajib dipilih.');
      }
      if (!formStatementBalance && formStatementBalance !== '0') {
        throw new Error('Saldo rekening koran / kas fisik wajib diisi.');
      }

      const res = await authFetch('/api/cash-bank-reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: formAccountType,
          bankAccountId: formAccountType === 'BANK' ? formBankId : undefined,
          cashAccountId: formAccountType === 'KAS' ? formCashId : undefined,
          reconciliationDate: formDate,
          statementBalance: stmtBalNum,
          notes: formNotes,
          attachmentUrl: formAttachmentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan rekonsiliasi kas/bank.');
      }

      setFormSuccess(
        `Rekonsiliasi ${data.reconciliationNumber} berhasil dibukukan dengan status: ${data.status}.`
      );
      setShowModal(false);
      setFormStatementBalance('');
      setFormNotes('');
      setFormAttachmentUrl('');
      fetchReconciliations();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (reconciliations.length === 0) return;
    const headers = [
      'No. Rekonsiliasi',
      'Tanggal',
      'Tipe',
      'Rekening / Kas',
      'Saldo Sistem (Rp)',
      'Saldo Bank / Koran (Rp)',
      'Selisih (Rp)',
      'Status',
      'Petugas',
      'Catatan',
    ];
    const rows = reconciliations.map((r) => [
      `"${r.reconciliationNumber}"`,
      `"${r.reconciliationDate}"`,
      `"${r.accountType}"`,
      `"${r.accountName.replace(/"/g, '""')}"`,
      Number(r.systemBalance),
      Number(r.statementBalance),
      Number(r.difference),
      `"${r.status}"`,
      `"${r.reconcilerName || '-'}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekonsiliasi_Kas_Bank_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics
  const totalRecs = reconciliations.length;
  const matchedCount = reconciliations.filter((r) => r.status === 'MATCHED').length;
  const varianceCount = reconciliations.filter((r) => r.status === 'VARIANCE').length;
  const totalVarianceAmt = reconciliations
    .filter((r) => r.status === 'VARIANCE')
    .reduce((sum, r) => sum + Math.abs(Number(r.difference)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-emerald-800" />
            <h1 className="text-xl font-black text-gray-900 tracking-tight sm:text-2xl">
              Rekonsiliasi Kas & Bank
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pencocokan saldo sistem pembukuan dengan rekening koran bank atau fisik kas tunai (MATCHED / VARIANCE)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchReconciliations}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={reconciliations.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setFormError('');
              setFormSuccess('');
            }}
            className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Rekonsiliasi Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Rekonsiliasi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900">{totalRecs}</span>
            <span className="text-xs text-gray-500">kali dicocokkan</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Sesuai (MATCHED)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{matchedCount}</span>
            <span className="text-xs text-gray-500">
              {totalRecs > 0 ? `${Math.round((matchedCount / totalRecs) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Terdapat Selisih (VARIANCE)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">{varianceCount}</span>
            <span className="text-xs text-amber-600 font-semibold">perlu tindak lanjut</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Akumulasi Selisih Kas/Bank</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-gray-900">
              Rp {totalVarianceAmt.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span>Filter:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="">Semua Rekening (Kas & Bank)</option>
            <option value="BANK">Hanya Rekening Bank</option>
            <option value="KAS">Hanya Kas Tunai</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-600 focus:outline-hidden"
          >
            <option value="">Semua Status</option>
            <option value="MATCHED">MATCHED (Sesuai)</option>
            <option value="VARIANCE">VARIANCE (Selisih)</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Menampilkan <span className="font-bold text-gray-800">{reconciliations.length}</span> rekonsiliasi
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Rekonsiliasi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Rekening / Kas</th>
                <th className="py-3 px-4 text-right">Saldo Sistem</th>
                <th className="py-3 px-4 text-right">Saldo Koran / Fisik</th>
                <th className="py-3 px-4 text-right">Selisih</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Petugas & Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-emerald-700 mb-2" />
                    Memuat riwayat rekonsiliasi kas dan bank...
                  </td>
                </tr>
              ) : reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Scale className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    Belum ada rekonsiliasi kas/bank tercatat. Silakan klik "Rekonsiliasi Baru".
                  </td>
                </tr>
              ) : (
                reconciliations.map((r) => {
                  const isMatched = r.status === 'MATCHED';
                  const diffVal = Number(r.difference);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                        {r.reconciliationNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{r.reconciliationDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div className="flex items-center gap-1.5">
                          {r.accountType === 'BANK' ? (
                            <Landmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Wallet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span>{r.accountName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-gray-700">
                        Rp {Number(r.systemBalance).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                        Rp {Number(r.statementBalance).toLocaleString('id-ID')}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          Math.abs(diffVal) < 0.01
                            ? 'text-gray-400'
                            : diffVal > 0
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {diffVal > 0 ? '+' : ''}Rp {diffVal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isMatched
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          )}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 max-w-xs truncate">
                        <span className="font-semibold text-gray-700">{r.reconcilerName || 'Staff'}</span>
                        {r.notes && <span className="block text-[11px] text-gray-400">{r.notes}</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Rekonsiliasi Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">Form Rekonsiliasi Kas & Bank</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bandingkan saldo pembukuan sistem dengan bukti rekening koran / kas fisik
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jenis Akun Likuiditas <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormAccountType('BANK');
                      if (bankAccounts.length > 0) setFormBankId(bankAccounts[0].id);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition ${
                      formAccountType === 'BANK'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Landmark className="h-4 w-4" />
                    <span>Rekening Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormAccountType('KAS');
                      if (cashAccounts.length > 0) setFormCashId(cashAccounts[0].id);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-bold transition ${
                      formAccountType === 'KAS'
                        ? 'border-emerald-800 bg-emerald-50 text-emerald-950'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Kas Tunai</span>
                  </button>
                </div>
              </div>

              {formAccountType === 'BANK' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilih Rekening Bank <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBankId}
                    onChange={(e) => setFormBankId(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-hidden"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Pilih Akun Kas Tunai <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCashId}
                    onChange={(e) => setFormCashId(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-hidden"
                  >
                    {cashAccounts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tanggal Rekonsiliasi (As Of Date) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              {/* Saldo Sistem Comparison Card */}
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Saldo Menurut Sistem:</span>
                  <span className="font-mono font-bold text-gray-900">
                    Rp {selectedSystemBalance.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Saldo Rekening Koran / Fisik:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    Rp {stmtBalNum.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700">Selisih:</span>
                  <span
                    className={
                      isMatch
                        ? 'text-emerald-700'
                        : currentDifference > 0
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }
                  >
                    Rp {currentDifference.toLocaleString('id-ID')}{' '}
                    {isMatch ? '(MATCHED 100%)' : '(VARIANCE)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Saldo Menurut Rekening Koran / Hitungan Fisik (Rp){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formStatementBalance}
                  onChange={(e) => setFormStatementBalance(e.target.value)}
                  placeholder="Contoh: 15000000"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs font-mono text-gray-900 focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan / Keterangan Selisih (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Penjelasan hasil verifikasi rekening koran / cek fisik..."
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  URL Dokumen Lampiran / Rekening Koran (Opsional)
                </label>
                <input
                  type="url"
                  value={formAttachmentUrl}
                  onChange={(e) => setFormAttachmentUrl(e.target.value)}
                  placeholder="https://drive.google.com/... atau tautan berkas"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50 transition"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Rekonsiliasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
