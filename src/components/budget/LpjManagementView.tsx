import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Account,
  BankAccount,
  CashAccount,
  FundRequest,
  LpjRecord,
  Unit,
} from '../../types/index.ts';

interface LpjItemInput {
  date: string;
  description: string;
  accountId?: number;
  amount: number;
  receiptUrl?: string;
}

export const LpjManagementView: React.FC = () => {
  const { authFetch, user } = useAuth();

  const [lpjList, setLpjList] = useState<LpjRecord[]>([]);
  const [disbursedRequests, setDisbursedRequests] = useState<FundRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [refundModalOpen, setRefundModalOpen] = useState<boolean>(false);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);

  // Selected State
  const [selectedLpj, setSelectedLpj] = useState<LpjRecord | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create / Edit LPJ Form State
  const [formRequestId, setFormRequestId] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formAttachment, setFormAttachment] = useState<string>('');
  const [formItems, setFormItems] = useState<LpjItemInput[]>([
    {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      receiptUrl: '',
    },
  ]);

  // Review LPJ Form State (Examiner / Bendahara / Pimpinan)
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Refund Form State (Pengembalian Sisa Dana)
  const [refundDate, setRefundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refundType, setRefundType] = useState<'KAS' | 'BANK'>('BANK');
  const [refundBankId, setRefundBankId] = useState<string>('');
  const [refundCashId, setRefundCashId] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [refundReceiptUrl, setRefundReceiptUrl] = useState<string>('');

  // Permissions
  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';
  const isBendahara = user?.roleName === 'BENDAHARA';
  const isPimpinan = user?.roleName === 'PIMPINAN';
  const isPetugas = user?.roleName === 'PETUGAS_KEUANGAN';

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const fetchDropdowns = async () => {
    try {
      const [uRes, aRes, bRes, cRes, rRes] = await Promise.all([
        authFetch('/api/units'),
        authFetch('/api/accounts'),
        authFetch('/api/banks'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/fund-requests?status=DICAIRKAN'),
      ]);

      if (uRes.ok) setUnits(await uRes.json());
      if (aRes.ok) {
        const aData: Account[] = await aRes.json();
        setAccountsList(aData.filter((a) => a.category === 'BEBAN' || a.category === 'ASET'));
      }
      if (bRes.ok) {
        const bData: BankAccount[] = await bRes.json();
        setBanks(bData);
        if (bData.length > 0 && !refundBankId) setRefundBankId(String(bData[0].id));
      }
      if (cRes.ok) {
        const cData: CashAccount[] = await cRes.json();
        setCashList(cData);
        if (cData.length > 0 && !refundCashId) setRefundCashId(String(cData[0].id));
      }
      if (rRes.ok) {
        const reqData: FundRequest[] = await rRes.json();
        setDisbursedRequests(reqData);
        if (reqData.length > 0 && !formRequestId) setFormRequestId(String(reqData[0].id));
      }
    } catch (e) {
      console.error('Error fetching dropdowns in LPJ:', e);
    }
  };

  const fetchLpjs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (refundStatusFilter) params.append('refundStatus', refundStatusFilter);

      const res = await authFetch(`/api/lpjs?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat daftar LPJ');
      setLpjList(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat LPJ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchLpjs();
  }, [statusFilter, refundStatusFilter]);

  // Total spent in form items
  const totalFormSpent = formItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const selectedReqForForm = disbursedRequests.find((r) => String(r.id) === formRequestId);
  const amountReceivedForm = selectedReqForForm ? Number(selectedReqForForm.amountDisbursed || selectedReqForForm.amountRequested) : 0;
  const remainingCalculated = Math.max(0, amountReceivedForm - totalFormSpent);

  const handleAddItem = () => {
    setFormItems([
      ...formItems,
      {
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        receiptUrl: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof LpjItemInput, val: any) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: val };
    setFormItems(updated);
  };

  const handleOpenCreateModal = (targetReqId?: number) => {
    if (targetReqId) {
      setFormRequestId(String(targetReqId));
    } else if (disbursedRequests.length > 0 && !formRequestId) {
      setFormRequestId(String(disbursedRequests[0].id));
    }
    setFormNotes('');
    setFormAttachment('');
    setFormItems([
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Belanja riil sesuai kebutuhan pencairan',
        amount: 0,
        receiptUrl: '',
      },
    ]);
    setCreateModalOpen(true);
  };

  const handleSubmitLpj = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formRequestId) throw new Error('Pilih pengajuan dana yang telah dicairkan');
      if (formItems.length === 0 || totalFormSpent <= 0) {
        throw new Error('Rincian belanja LPJ wajib memiliki nominal pengeluaran riil');
      }

      const res = await authFetch('/api/lpjs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: parseInt(formRequestId, 10),
          notes: formNotes,
          attachmentUrl: formAttachment,
          items: formItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan LPJ');

      setSuccessMsg(`LPJ ${data.lpj.lpjNumber} berhasil dikirim dan siap diperiksa.`);
      setCreateModalOpen(false);
      fetchLpjs();
      fetchDropdowns();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan LPJ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReview = (item: LpjRecord) => {
    setSelectedLpj(item);
    setReviewAction('APPROVE');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLpj) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(`/api/lpjs/${selectedLpj.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memverifikasi LPJ');

      setSuccessMsg(
        reviewAction === 'APPROVE'
          ? `LPJ ${selectedLpj.lpjNumber} disetujui! Status pengajuan kini SELESAI.`
          : `LPJ ${selectedLpj.lpjNumber} dikembalikan untuk revisi unit.`
      );
      setReviewModalOpen(false);
      fetchLpjs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal memproses verifikasi LPJ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefund = (item: LpjRecord) => {
    setSelectedLpj(item);
    setRefundDate(new Date().toISOString().split('T')[0]);
    setRefundType('BANK');
    setRefundAmount(String(item.remainingAmount || '0'));
    setRefundNotes(`Pengembalian sisa dana ${item.lpjNumber} (${item.requestNumber || ''})`);
    setRefundReceiptUrl('');
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLpj) return;
    setSubmitting(true);
    setError(null);

    try {
      const numAmount = parseFloat(refundAmount);
      if (!numAmount || numAmount <= 0) {
        throw new Error('Nominal pengembalian dana harus lebih dari Rp 0');
      }

      const res = await authFetch(`/api/lpjs/${selectedLpj.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundDate,
          cashBankType: refundType,
          cashBankId: refundType === 'BANK' ? parseInt(refundBankId, 10) : parseInt(refundCashId, 10),
          amount: numAmount,
          notes: refundNotes,
          receiptUrl: refundReceiptUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses setoran sisa dana');

      setSuccessMsg(
        `Pengembalian sisa dana berhasil dibukukan! ${data.message} Jurnal pengembalian telah mengkredit beban dan menambah kas/bank.`
      );
      setRefundModalOpen(false);
      fetchLpjs();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan pengembalian sisa dana');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLpjs = lpjList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      item.lpjNumber.toLowerCase().includes(q) ||
      (item.requestNumber && item.requestNumber.toLowerCase().includes(q)) ||
      (item.unitName && item.unitName.toLowerCase().includes(q)) ||
      (item.requesterName && item.requesterName.toLowerCase().includes(q)) ||
      (item.purpose && item.purpose.toLowerCase().includes(q));
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              FASE 4: PERTANGGUNGJAWABAN DANA
            </span>
            <span className="text-xs text-gray-500">Dual-Check & Auto Double-Entry Refund</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Laporan Pertanggungjawaban (LPJ) & Sisa Dana
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Pencatatan realisasi riil belanja pencairan, bukti nota, verifikasi bendahara/pimpinan, dan pengembalian sisa kas/bank.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchDropdowns();
              fetchLpjs();
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat LPJ Baru</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center space-x-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center space-x-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">Total LPJ Diterbitkan</span>
          <p className="mt-2 text-2xl font-black text-gray-900">{lpjList.length}</p>
          <span className="text-[11px] text-gray-400">Seluruh dokumen LPJ</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-blue-700 uppercase">Menunggu Pemeriksaan</span>
          <p className="mt-2 text-2xl font-black text-blue-700">
            {lpjList.filter((l) => l.status === 'DIAJUKAN').length}
          </p>
          <span className="text-[11px] text-blue-600">Perlu review bendahara</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase">LPJ Disetujui (Selesai)</span>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {lpjList.filter((l) => l.status === 'DISETUJUI').length}
          </p>
          <span className="text-[11px] text-emerald-600">Terverifikasi lengkap</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
          <span className="text-xs font-bold text-amber-900 uppercase">Sisa Dana Belum Kembali</span>
          <p className="mt-2 text-2xl font-black text-amber-900">
            {formatRupiah(
              lpjList
                .filter((l) => l.refundStatus === 'MENUNGGU_PENGEMBALIAN')
                .reduce((acc, curr) => acc + (Number(curr.remainingAmount) || 0), 0)
            )}
          </p>
          <span className="text-[11px] text-amber-700">Perlu disetor ke kas/bank</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari LPJ, unit, keperluan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="">Semua Status LPJ</option>
              <option value="DIAJUKAN">DIAJUKAN (Menunggu Review)</option>
              <option value="DISETUJUI">DISETUJUI (Valid)</option>
              <option value="DITOLAK">DITOLAK (Perlu Revisi)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <select
              value={refundStatusFilter}
              onChange={(e) => setRefundStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none"
            >
              <option value="">Semua Status Sisa Dana</option>
              <option value="NONE">TIDAK ADA SISA (Pas / Habis)</option>
              <option value="PENDING">PENDING (Ada Sisa Belum Setor)</option>
              <option value="REFUNDED">REFUNDED (Sudah Disetor ke Kas/Bank)</option>
            </select>
          </div>
        </div>

        {/* Notice of Disbursed Requests Waiting for LPJ */}
        {disbursedRequests.length > 0 && (
          <div className="flex items-center space-x-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 border border-blue-200">
            <Clock className="h-4 w-4 text-blue-700" />
            <span>Ada {disbursedRequests.length} pencairan dana yang siap dibuatkan LPJ.</span>
          </div>
        )}
      </div>

      {/* Main LPJ Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="p-3.5">No. LPJ & Pengajuan</th>
              <th className="p-3.5">Unit / Pemohon</th>
              <th className="p-3.5 text-right">Dana Dicairkan</th>
              <th className="p-3.5 text-right">Realisasi Riil</th>
              <th className="p-3.5 text-right">Sisa Dana</th>
              <th className="p-3.5 text-center">Status LPJ</th>
              <th className="p-3.5 text-center">Status Sisa Dana</th>
              <th className="p-3.5 text-center">Aksi & Proses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Memuat data LPJ...
                </td>
              </tr>
            ) : filteredLpjs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Belum ada dokumen LPJ tercatat.
                </td>
              </tr>
            ) : (
              filteredLpjs.map((lpj) => (
                <tr key={lpj.id} className="hover:bg-gray-50/70">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-gray-900 block">{lpj.lpjNumber}</span>
                    <span className="text-[11px] font-mono text-emerald-800">{lpj.requestNumber}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-gray-900 block">{lpj.unitName}</span>
                    <span className="text-[11px] text-gray-500">{lpj.requesterName}</span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-semibold text-gray-700">
                    {formatRupiah(lpj.amountReceived)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-teal-800">
                    {formatRupiah(lpj.totalSpent)}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-amber-900">
                    {formatRupiah(lpj.remainingAmount)}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        lpj.status === 'DISETUJUI' || lpj.status === 'SELESAI'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : lpj.status === 'PERLU_PERBAIKAN'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {lpj.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        lpj.refundStatus === 'SUDAH_DIKEMBALIKAN'
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : lpj.refundStatus === 'MENUNGGU_PENGEMBALIAN'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lpj.refundStatus === 'SUDAH_DIKEMBALIKAN'
                        ? 'SUDAH DISETOR'
                        : lpj.refundStatus === 'MENUNGGU_PENGEMBALIAN'
                        ? 'ADA SISA (PENDING)'
                        : 'HABIS (NIHIL)'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Review LPJ (Bendahara / Pimpinan / SuperAdmin) */}
                      {lpj.status === 'DIAJUKAN' && (isBendahara || isPimpinan || isSuperAdmin) && (
                        <button
                          onClick={() => handleOpenReview(lpj)}
                          className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100"
                          title="Periksa dan setujui kelengkapan LPJ"
                        >
                          Verifikasi
                        </button>
                      )}

                      {/* Refund Modal Trigger (Jika ada sisa dana & status MENUNGGU_PENGEMBALIAN) */}
                      {Number(lpj.remainingAmount) > 0 && lpj.refundStatus === 'MENUNGGU_PENGEMBALIAN' && (
                        <button
                          onClick={() => handleOpenRefund(lpj)}
                          className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 shadow-xs"
                          title="Setorkan sisa dana kembali ke Kas/Bank"
                        >
                          Setor Sisa
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedLpj(lpj);
                          setDetailModalOpen(true);
                        }}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                        title="Lihat Rincian & Nota"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: BUAT FORM LPJ BARU */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Formulir Laporan Pertanggungjawaban (LPJ)
                </h2>
                <span className="text-xs text-gray-500">
                  Rincikan seluruh realisasi pengeluaran riil dari dana yang telah dicairkan.
                </span>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLpj} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Pilih Pengajuan Dana yang Telah Dicairkan *
                </label>
                <select
                  value={formRequestId}
                  onChange={(e) => setFormRequestId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                >
                  <option value="">-- Pilih Nomor Pengajuan --</option>
                  {disbursedRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.requestNumber} - {req.unitName} ({formatRupiah(req.amountDisbursed || req.amountRequested)}) - {req.purpose}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReqForForm && (
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Dana Diterima</span>
                    <span className="font-mono font-bold text-blue-900">
                      {formatRupiah(amountReceivedForm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Total Terpakai Riil</span>
                    <span className="font-mono font-bold text-teal-800">
                      {formatRupiah(totalFormSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Kelebihan / Sisa Dana</span>
                    <span className="font-mono font-bold text-amber-900">
                      {formatRupiah(remainingCalculated)}
                    </span>
                  </div>
                </div>
              )}

              {/* Dynamic Expense Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">
                    Rincian Belanja & Nota Pengeluaran *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center rounded-xl border border-gray-200 bg-gray-50/50 p-2 text-xs"
                    >
                      <div className="col-span-3">
                        <input
                          type="date"
                          value={item.date}
                          onChange={(e) => handleItemChange(idx, 'date', e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-800 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Uraian belanja / nota..."
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-800 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Nominal Rp"
                          value={item.amount || ''}
                          onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          required
                          className="w-full rounded-lg border border-gray-200 bg-white p-1.5 text-xs text-gray-800 font-mono focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Catatan Tambahan LPJ
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Catatan pelaksanaan kegiatan, kendala, atau hasil belanja..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Link / URL Bukti Nota / Berkas Scan LPJ
                </label>
                <input
                  type="text"
                  value={formAttachment}
                  onChange={(e) => setFormAttachment(e.target.value)}
                  placeholder="Contoh: https://drive.google.com/scan-nota-lpj.pdf"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Menyimpan...' : 'Kirim LPJ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VERIFIKASI LPJ (BENDAHARA / PIMPINAN) */}
      {reviewModalOpen && selectedLpj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Verifikasi Dokumen LPJ</h2>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">No. LPJ:</span>
                  <span className="font-bold font-mono">{selectedLpj.lpjNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit:</span>
                  <span className="font-semibold">{selectedLpj.unitName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dana Dicairkan:</span>
                  <span className="font-mono">{formatRupiah(selectedLpj.amountReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Riil Belanja:</span>
                  <span className="font-mono font-bold text-teal-800">
                    {formatRupiah(selectedLpj.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sisa Dana:</span>
                  <span className="font-mono font-bold text-amber-900">
                    {formatRupiah(selectedLpj.remainingAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Keputusan Verifikasi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`rounded-xl p-2.5 text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      reviewAction === 'APPROVE'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Setujui LPJ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`rounded-xl p-2.5 text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                      reviewAction === 'REJECT'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Perlu Perbaikan</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Catatan Pemeriksa *
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  required
                  placeholder="Tuliskan catatan kelengkapan berkas atau alasan jika perlu perbaikan..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : 'Simpan Keputusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGEMBALIAN SISA DANA (SETOR KAS/BANK) */}
      {refundModalOpen && selectedLpj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Setor Sisa Dana ke Kas/Bank</h2>
                <span className="text-xs text-emerald-800 font-semibold">
                  Mekanisme Akuntansi FASE 2: Debit Kas/Bank & Kredit Beban
                </span>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="mt-4 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs space-y-1 text-amber-950">
                <div className="flex justify-between">
                  <span>No. LPJ Terkait:</span>
                  <span className="font-mono font-bold">{selectedLpj.lpjNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa Dana Riil:</span>
                  <span className="font-mono font-bold text-sm">
                    {formatRupiah(selectedLpj.remainingAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Tanggal Pengembalian *
                </label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Disetorkan ke *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setRefundType('BANK')}
                    className={`rounded-xl p-2 text-xs font-bold ${
                      refundType === 'BANK'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    Rekening Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType('KAS')}
                    className={`rounded-xl p-2 text-xs font-bold ${
                      refundType === 'KAS'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 text-gray-700'
                    }`}
                  >
                    Kas Tunai
                  </button>
                </div>

                {refundType === 'BANK' ? (
                  <select
                    value={refundBankId}
                    onChange={(e) => setRefundBankId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={refundCashId}
                    onChange={(e) => setRefundCashId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  >
                    {cashList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.accountCode ? `(${c.accountCode})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nominal Disetorkan (Rp) *
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Keterangan Setoran
                </label>
                <input
                  type="text"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Link / Bukti Setor Bank
                </label>
                <input
                  type="text"
                  value={refundReceiptUrl}
                  onChange={(e) => setRefundReceiptUrl(e.target.value)}
                  placeholder="https://drive.google.com/bukti-setor.pdf"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Posting Pengembalian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DETAIL LPJ & NOTA ITEM */}
      {detailModalOpen && selectedLpj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Rincian Dokumen LPJ</h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Nomor LPJ</span>
                  <span className="font-mono font-bold text-gray-900">{selectedLpj.lpjNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">No. Pengajuan</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {selectedLpj.requestNumber}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Unit & Pemohon</span>
                  <span className="font-medium">{selectedLpj.unitName} - {selectedLpj.requesterName}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Status Dokumen</span>
                  <span className="font-bold text-emerald-800">{selectedLpj.status}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 uppercase text-[10px] block font-bold mb-1">
                  Item Belanja Terdaftar ({selectedLpj.items?.length || 0} Bukti)
                </span>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                  {selectedLpj.items && selectedLpj.items.length > 0 ? (
                    selectedLpj.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between p-2.5 hover:bg-gray-50">
                        <div>
                          <span className="font-medium text-gray-900 block">{it.description}</span>
                          <span className="text-[11px] text-gray-400">{it.date}</span>
                        </div>
                        <span className="font-mono font-bold text-teal-800">
                          {formatRupiah(it.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-400">Tidak ada item rincian</div>
                  )}
                </div>
              </div>

              {selectedLpj.notes && (
                <div>
                  <span className="text-gray-400 uppercase text-[10px] block">Catatan LPJ</span>
                  <p className="mt-0.5 p-2.5 bg-gray-50 rounded-xl text-gray-800">{selectedLpj.notes}</p>
                </div>
              )}

              {selectedLpj.examinerNotes && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
                  <span className="font-bold block text-[10px] uppercase">Catatan Verifikator:</span>
                  <p className="mt-0.5">{selectedLpj.examinerNotes}</p>
                </div>
              )}

              {selectedLpj.attachmentUrl && (
                <div>
                  <a
                    href={selectedLpj.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh / Buka Lampiran Berkas LPJ</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
