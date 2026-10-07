import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  PlusCircle,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Building2,
  User,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, InvestmentStatus, InvestmentType, Fund, Unit, BankAccount, CashAccount } from '../../types/index.ts';

interface InvestmentListViewProps {
  setCurrentView?: (view: any) => void;
}

export const InvestmentListView: React.FC<InvestmentListViewProps> = ({ setCurrentView }) => {
  const { user, authFetch } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [valuationModalOpen, setValuationModalOpen] = useState<boolean>(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  // Form: Create Master Investment
  const [formData, setFormData] = useState({
    investeeName: '',
    investmentType: 'BAGI_HASIL' as InvestmentType,
    placementDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    initialCapital: '',
    fundId: '',
    unitId: '',
    sourceBankAccountId: '',
    sourceCashAccountId: '',
    investmentScheme: '',
    profitSharingPercentage: '',
    profitPaymentSchedule: 'BULANAN',
    targetReturnEstimate: '',
    picName: '',
    picContact: '',
    notes: '',
    contractUrl: '',
    submitImmediately: true,
  });

  // Form: Status Workflow
  const [statusAction, setStatusAction] = useState<InvestmentStatus>('APPROVED');
  const [statusNotes, setStatusNotes] = useState<string>('');

  // Form: Valuation Adjustment (Penurunan Nilai / Kerugian)
  const [valuationData, setValuationData] = useState({
    date: new Date().toISOString().split('T')[0],
    lossAmount: '',
    reason: '',
    reference: '',
    attachmentUrl: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [fundsRes, unitsRes, banksRes, cashRes] = await Promise.all([
        authFetch('/api/funds'),
        authFetch('/api/units'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/cash-accounts'),
      ]);
      if (fundsRes.ok) setFunds(await fundsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (banksRes.ok) setBankAccounts(await banksRes.json());
      if (cashRes.ok) setCashAccounts(await cashRes.json());
    } catch (e) {
      console.error('Error fetching dropdowns:', e);
    }
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('investmentType', typeFilter);
      if (fundFilter) params.append('fundId', fundFilter);

      const res = await authFetch(`/api/investments?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat daftar investasi');
      const data = await res.json();
      setInvestments(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat investasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [statusFilter, typeFilter, fundFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investeeName || !formData.initialCapital || !formData.fundId || !formData.picName) {
      setFeedback({ type: 'error', message: 'Lengkapi semua field bertanda bintang (*)' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await authFetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan usulan investasi');

      setFeedback({
        type: 'success',
        message: `Investasi ${data.investmentNumber} (${data.investeeName}) berhasil dibuat dengan status ${data.status}!`,
      });
      setCreateModalOpen(false);
      resetForm();
      fetchInvestments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment) return;

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await authFetch(`/api/investments/${selectedInvestment.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusAction,
          notes: statusNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status investasi');

      setFeedback({
        type: 'success',
        message: `Status investasi ${selectedInvestment.investmentNumber} berhasil diubah menjadi ${statusAction}!`,
      });
      setStatusModalOpen(false);
      fetchInvestments();
      if (detailModalOpen) {
        setSelectedInvestment({ ...selectedInvestment, status: statusAction });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleValuationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment || !valuationData.lossAmount || !valuationData.reason) {
      setFeedback({ type: 'error', message: 'Nominal kerugian/penurunan nilai dan alasan wajib diisi' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await authFetch(`/api/investments/${selectedInvestment.id}/valuation-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valuationData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat penurunan nilai investasi');

      setFeedback({
        type: 'success',
        message: `Penurunan nilai investasi sebesar Rp ${Number(valuationData.lossAmount).toLocaleString('id-ID')} berhasil dicatat & jurnal terposting!`,
      });
      setValuationModalOpen(false);
      fetchInvestments();
      setValuationData({
        date: new Date().toISOString().split('T')[0],
        lossAmount: '',
        reason: '',
        reference: '',
        attachmentUrl: '',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      investeeName: '',
      investmentType: 'BAGI_HASIL',
      placementDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      initialCapital: '',
      fundId: funds.length > 0 ? String(funds[0].id) : '',
      unitId: '',
      sourceBankAccountId: '',
      sourceCashAccountId: '',
      investmentScheme: '',
      profitSharingPercentage: '',
      profitPaymentSchedule: 'BULANAN',
      targetReturnEstimate: '',
      picName: '',
      picContact: '',
      notes: '',
      contractUrl: '',
      submitImmediately: true,
    });
  };

  const formatRupiah = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const filteredInvestments = investments.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.investeeName.toLowerCase().includes(q) ||
      item.investmentNumber.toLowerCase().includes(q) ||
      (item.picName && item.picName.toLowerCase().includes(q)) ||
      (item.investmentScheme && item.investmentScheme.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: InvestmentStatus) => {
    const styles: Record<InvestmentStatus, { label: string; cls: string }> = {
      DRAFT: { label: 'DRAFT', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
      SUBMITTED: { label: 'DIAJUKAN', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
      APPROVED: { label: 'DISETUJUI', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
      ACTIVE: { label: 'AKTIF (BERJALAN)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
      MATURED: { label: 'JATUH TEMPO', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
      COMPLETED: { label: 'SELESAI (LUNAS)', cls: 'bg-teal-100 text-teal-800 border-teal-300' },
      PROBLEMATIC: { label: 'BERMASALAH', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
      CANCELLED: { label: 'DIBATALKAN', cls: 'bg-slate-200 text-slate-700 border-slate-300' },
    };
    const b = styles[status] || { label: status, cls: 'bg-gray-100 text-gray-800 border-gray-300' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.cls}`}>
        {b.label}
      </span>
    );
  };

  const getTypeLabel = (t: InvestmentType) => {
    const labels: Record<InvestmentType, string> = {
      BAGI_HASIL: 'Bagi Hasil (Mudharabah/Musyarakah)',
      PENYERTAAN_MODAL: 'Penyertaan Modal',
      DEPOSITO: 'Deposito Syariah',
      LAINNYA: 'Investasi Lainnya',
    };
    return labels[t] || t;
  };

  const isLeadershipOrAdmin =
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'PIMPINAN' ||
    user?.roleName === 'BENDAHARA';

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-emerald-700" />
            Master & Daftar Portofolio Investasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengelolaan entitas investasi, alur pengajuan & persetujuan, pemantauan modal berjalan, dan penyesuaian nilai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            Usulan Investasi Baru
          </button>
        </div>
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

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mitra, nomor, PIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">DIAJUKAN (SUBMITTED)</option>
              <option value="APPROVED">DISETUJUI (APPROVED)</option>
              <option value="ACTIVE">AKTIF (ACTIVE)</option>
              <option value="MATURED">JATUH TEMPO (MATURED)</option>
              <option value="COMPLETED">SELESAI (COMPLETED)</option>
              <option value="PROBLEMATIC">BERMASALAH (PROBLEMATIC)</option>
              <option value="CANCELLED">DIBATALKAN</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">Semua Jenis Investasi</option>
              <option value="BAGI_HASIL">Bagi Hasil</option>
              <option value="PENYERTAAN_MODAL">Penyertaan Modal</option>
              <option value="DEPOSITO">Deposito Syariah</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {/* Fund Filter */}
          <div>
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">Semua Sumber Dana</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Investasi</th>
                <th className="py-3 px-4">Nama Mitra / Investee</th>
                <th className="py-3 px-4">Jenis & Akad</th>
                <th className="py-3 px-4 text-right">Modal Awal</th>
                <th className="py-3 px-4 text-right">Nilai Berjalan</th>
                <th className="py-3 px-4 text-right">Bagi Hasil Diterima</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Memuat data investasi...
                  </td>
                </tr>
              ) : filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data investasi yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {inv.investmentNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        Mulai: {inv.startDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.investeeName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="h-3 w-3 text-slate-400" />
                        PIC: {inv.picName} {inv.picContact && `(${inv.picContact})`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-slate-800">
                        {getTypeLabel(inv.investmentType)}
                      </span>
                      {inv.investmentScheme && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {inv.investmentScheme}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                      {formatRupiah(inv.initialCapital)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-emerald-800">
                      {formatRupiah(inv.currentValue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-amber-700">
                      {formatRupiah(inv.totalReturnProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedInvestment(inv);
                            setDetailModalOpen(true);
                          }}
                          title="Lihat Rincian & Audit Trail"
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Status Change / Approval Button */}
                        {isLeadershipOrAdmin && (
                          <button
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setStatusAction(
                                inv.status === 'SUBMITTED'
                                  ? 'APPROVED'
                                  : inv.status === 'APPROVED'
                                  ? 'ACTIVE'
                                  : inv.status === 'ACTIVE'
                                  ? 'PROBLEMATIC'
                                  : 'ACTIVE'
                              );
                              setStatusNotes('');
                              setStatusModalOpen(true);
                            }}
                            title="Ubah Status / Alur Approval"
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        )}

                        {/* Valuation Adjustment Button */}
                        {isLeadershipOrAdmin && (inv.status === 'ACTIVE' || inv.status === 'PROBLEMATIC') && (
                          <button
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setValuationData({
                                date: new Date().toISOString().split('T')[0],
                                lossAmount: '',
                                reason: '',
                                reference: '',
                                attachmentUrl: '',
                              });
                              setValuationModalOpen(true);
                            }}
                            title="Penyesuaian Nilai / Pengakuan Kerugian"
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          >
                            <TrendingDown className="h-4 w-4 text-rose-600" />
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

      {/* MODAL 1: Create Master Investment */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-700" />
                  Formulir Usulan Master Investasi Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Data master akad investasi mitra. Penempatan dana kas/bank dilakukan setelah disetujui.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Mitra / Investee */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Perusahaan / Lembaga Mitra (Investee) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Agro Berkah Santri / BMT Mandiri"
                    value={formData.investeeName}
                    onChange={(e) => setFormData({ ...formData, investeeName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Jenis Investasi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Investasi *
                  </label>
                  <select
                    value={formData.investmentType}
                    onChange={(e) => setFormData({ ...formData, investmentType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="BAGI_HASIL">Bagi Hasil (Mudharabah / Musyarakah)</option>
                    <option value="PENYERTAAN_MODAL">Penyertaan Modal (Equity / Saham)</option>
                    <option value="DEPOSITO">Deposito Syariah / Finansial</option>
                    <option value="LAINNYA">Investasi Lainnya</option>
                  </select>
                </div>

                {/* Sumber Dana */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sumber Dana Investasi *
                  </label>
                  <select
                    required
                    value={formData.fundId}
                    onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Pilih Sumber Dana</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nominal Modal Awal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nilai Modal Investasi (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="Contoh: 500000000"
                    value={formData.initialCapital}
                    onChange={(e) => setFormData({ ...formData, initialCapital: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Unit Penanggung Jawab */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unit / Divisi Penanggung Jawab
                  </label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Tidak terikat unit khusus</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal Penempatan & Mulai */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tanggal Penempatan / Akad *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.placementDate}
                    onChange={(e) => setFormData({ ...formData, placementDate: e.target.value, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Tanggal Jatuh Tempo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tanggal Jatuh Tempo (Bila ada)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Skema Investasi */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Skema / Rincian Akad Investasi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Mudharabah Muqayyadah untuk ekspansi budidaya hidroponik pesantren"
                    value={formData.investmentScheme}
                    onChange={(e) => setFormData({ ...formData, investmentScheme: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Nisbah / % Bagi Hasil & Jadwal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nisbah / Persentase Imbal Hasil (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 60"
                    value={formData.profitSharingPercentage}
                    onChange={(e) => setFormData({ ...formData, profitSharingPercentage: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jadwal Pembayaran Bagi Hasil
                  </label>
                  <select
                    value={formData.profitPaymentSchedule}
                    onChange={(e) => setFormData({ ...formData, profitPaymentSchedule: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="BULANAN">Bulanan</option>
                    <option value="TRIWULAN">Triwulan (3 Bulan)</option>
                    <option value="SEMESTER">Semester (6 Bulan)</option>
                    <option value="TAHUNAN">Tahunan</option>
                    <option value="AKHIR_KONTRAK">Akhir Kontrak / Sekaligus</option>
                  </select>
                </div>

                {/* PIC Name & Contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Penanggung Jawab (PIC) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ust. Fauzan / Bpk. Rudi"
                    value={formData.picName}
                    onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kontak PIC (No. Telp / HP)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789"
                    value={formData.picContact}
                    onChange={(e) => setFormData({ ...formData, picContact: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Link Dokumen Perjanjian */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Link / URL Dokumen Perjanjian (Bila ada)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.contractUrl}
                    onChange={(e) => setFormData({ ...formData, contractUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Catatan */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Catatan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Catatan mengenai latar belakang, jaminan, agunan, atau klausul khusus..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Submit Langsung */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Ajukan ke Pimpinan Sekarang (SUBMITTED)?</span>
                  <p className="text-[11px] text-slate-500">
                    Bila dicentang, status menjadi SUBMITTED untuk diperiksa pimpinan. Jika tidak, tersimpan sebagai DRAFT.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.submitImmediately}
                  onChange={(e) => setFormData({ ...formData, submitImmediately: e.target.checked })}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Usulan Investasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Detail Investasi & Ringkasan Akuntansi */}
      {detailModalOpen && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {selectedInvestment.investmentNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedInvestment.investeeName}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Status & Rekap Akuntansi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedInvestment.status)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Nilai Modal Awal</span>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                    {formatRupiah(selectedInvestment.initialCapital)}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Nilai Modal Berjalan</span>
                  <p className="mt-1 font-mono text-sm font-black text-emerald-900">
                    {formatRupiah(selectedInvestment.currentValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Bagi Hasil Diterima</span>
                  <p className="mt-1 font-mono text-sm font-black text-amber-900">
                    {formatRupiah(selectedInvestment.totalReturnProfit)}
                  </p>
                </div>
              </div>

              {/* Rincian Finansial 3 Dimensi */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Rincian Mutasi Finansial Terintegrasi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-slate-500">Modal Awal:</span>
                    <p className="font-semibold text-slate-800 font-mono">
                      {formatRupiah(selectedInvestment.initialCapital)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Pengembalian Modal:</span>
                    <p className="font-semibold text-blue-700 font-mono">
                      {formatRupiah(selectedInvestment.totalCapitalReturned)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Penyesuaian Nilai (Loss):</span>
                    <p className="font-semibold text-rose-700 font-mono">
                      {formatRupiah(selectedInvestment.totalValuationAdjustment)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Sisa Nilai Berjalan:</span>
                    <p className="font-bold text-emerald-800 font-mono">
                      {formatRupiah(selectedInvestment.currentValue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Kontrak / Akad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Jenis Investasi:</span>
                    <span className="font-semibold text-slate-800">{getTypeLabel(selectedInvestment.investmentType)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Sumber Dana:</span>
                    <span className="font-semibold text-slate-800">{selectedInvestment.fundName || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Unit Terkait:</span>
                    <span className="font-semibold text-slate-800">{selectedInvestment.unitName || 'Semua Unit'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Akun Aset Investasi:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedInvestment.investmentAccountCode} - {selectedInvestment.investmentAccountName}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tanggal Penempatan:</span>
                    <span className="font-semibold text-slate-800">{selectedInvestment.placementDate}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Jatuh Tempo:</span>
                    <span className="font-semibold text-slate-800">{selectedInvestment.dueDate || 'Tidak Ditentukan'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Jadwal Pembayaran:</span>
                    <span className="font-semibold text-slate-800">{selectedInvestment.profitPaymentSchedule || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nisbah / Bagi Hasil:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedInvestment.profitSharingPercentage ? `${selectedInvestment.profitSharingPercentage}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedInvestment.notes && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-bold block text-slate-900 mb-1">Catatan / Rekam Jejak Workflow:</span>
                  <p className="whitespace-pre-line leading-relaxed">{selectedInvestment.notes}</p>
                </div>
              )}

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {setCurrentView && selectedInvestment.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => {
                          setDetailModalOpen(false);
                          setCurrentView('investment-profit');
                        }}
                        className="rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-3 py-1.5 text-xs shadow-xs"
                      >
                        Input Bagi Hasil
                      </button>
                      <button
                        onClick={() => {
                          setDetailModalOpen(false);
                          setCurrentView('investment-return');
                        }}
                        className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 text-xs shadow-xs"
                      >
                        Pengembalian Modal
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Status / Approval Workflow */}
      {statusModalOpen && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              Perbarui Status Investasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Investasi: <span className="font-semibold text-slate-800">{selectedInvestment.investeeName}</span> ({selectedInvestment.investmentNumber})
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Baru
                </label>
                <select
                  value={statusAction}
                  onChange={(e) => setStatusAction(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="APPROVED">APPROVED (Disetujui Pimpinan)</option>
                  <option value="ACTIVE">ACTIVE (Dana Sedang Berjalan)</option>
                  <option value="MATURED">MATURED (Jatuh Tempo)</option>
                  <option value="COMPLETED">COMPLETED (Selesai Lunas)</option>
                  <option value="PROBLEMATIC">PROBLEMATIC (Bermasalah / Menunggak)</option>
                  <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan / Alasan Perubahan Status
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Masukkan alasan persetujuan, penolakan, atau kondisi saat ini..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Valuation Adjustment / Impairment */}
      {valuationModalOpen && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-600" />
              Penyesuaian Nilai / Penurunan Nilai (Impairment)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Investasi: <span className="font-semibold text-slate-800">{selectedInvestment.investeeName}</span> · Nilai Berjalan:{' '}
              <span className="font-mono font-bold text-emerald-800">{formatRupiah(selectedInvestment.currentValue)}</span>
            </p>

            <div className="my-3 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                Ketentuan Akuntansi Syariah:
              </div>
              <p>
                Jurnal penurunan nilai akan dibuat: <strong>Debit Kerugian Penurunan Nilai Investasi (5920)</strong> dan{' '}
                <strong>Kredit Aset Investasi (1150)</strong>. Nilai modal berjalan akan otomatis berkurang.
              </p>
            </div>

            <form onSubmit={handleValuationSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Pencatatan Penurunan Nilai *
                </label>
                <input
                  type="date"
                  required
                  value={valuationData.date}
                  onChange={(e) => setValuationData({ ...valuationData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nominal Penurunan Nilai / Kerugian (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedInvestment.currentValue)}
                  step="any"
                  required
                  placeholder={`Maksimal ${formatRupiah(selectedInvestment.currentValue)}`}
                  value={valuationData.lossAmount}
                  onChange={(e) => setValuationData({ ...valuationData, lossAmount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold text-rose-800 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alasan Penurunan Nilai / Kerugian *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Mitra mengalami kebangkrutan terbukti / penurunan nilai pasar berdasarkan audit tahunan..."
                  value={valuationData.reason}
                  onChange={(e) => setValuationData({ ...valuationData, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Referensi / Nomor Berita Acara
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BA-KERUGIAN-2026/01"
                  value={valuationData.reference}
                  onChange={(e) => setValuationData({ ...valuationData, reference: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setValuationModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Memproses Jurnal...' : 'Posting Penurunan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
