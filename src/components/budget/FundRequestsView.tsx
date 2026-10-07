import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Landmark,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Account,
  BankAccount,
  Budget,
  CashAccount,
  Fund,
  FundRequest,
  Unit,
} from '../../types/index.ts';

interface FundRequestsViewProps {
  onOpenLpjModal?: (requestId: number) => void;
}

export const FundRequestsView: React.FC<FundRequestsViewProps> = ({ onOpenLpjModal }) => {
  const { authFetch, user } = useAuth();

  const [requestsList, setRequestsList] = useState<FundRequest[]>([]);
  const [budgetsList, setBudgetsList] = useState<Budget[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [detailModalItem, setDetailModalItem] = useState<FundRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FundRequest | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formUnitId, setFormUnitId] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formFundId, setFormFundId] = useState<string>('');
  const [formBudgetId, setFormBudgetId] = useState<string>('');
  const [formPurpose, setFormPurpose] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formItemsDetail, setFormItemsDetail] = useState<string>('');
  const [formAttachment, setFormAttachment] = useState<string>('');
  const [formAllowOverBudget, setFormAllowOverBudget] = useState<boolean>(false);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  // Disburse Form State
  const [disbDate, setDisbDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [disbRecipient, setDisbRecipient] = useState<string>('');
  const [disbType, setDisbType] = useState<'KAS' | 'BANK'>('BANK');
  const [disbBankId, setDisbBankId] = useState<string>('');
  const [disbAmount, setDisbAmount] = useState<string>('');
  const [disbNotes, setDisbNotes] = useState<string>('');
  const [disbReceiptUrl, setDisbReceiptUrl] = useState<string>('');

  // Reject Form State
  const [rejectReason, setRejectReason] = useState<string>('');

  // Permissions based on user role (Tahap 8A Least Privilege & Maker-Checker)
  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';
  const isBendahara = user?.roleName === 'BENDAHARA';
  const isPimpinan = user?.roleName === 'PIMPINAN' || user?.roleName === 'APPROVER';
  const isVerifikator = user?.roleName === 'VERIFIKATOR';
  const isPetugas = user?.roleName === 'PETUGAS_KEUANGAN';
  const isUnitRole = user?.roleName === 'UNIT' || user?.roleName === 'PETUGAS_UNIT';
  const isReadOnly = user?.roleName === 'AUDITOR' || user?.roleName === 'VIEWER';

  const fetchMasterData = async () => {
    try {
      const [uRes, fRes, aRes, bRes, cRes, bgRes] = await Promise.all([
        authFetch('/api/units'),
        authFetch('/api/funds'),
        authFetch('/api/accounts'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/cash-accounts'),
        authFetch('/api/budgets?status=AKTIF'),
      ]);

      if (uRes.ok) {
        const uData: Unit[] = await uRes.json();
        setUnits(uData);
        // Default unit for UNIT role
        if (isUnitRole && user?.unitId) {
          setFormUnitId(String(user.unitId));
        } else if (uData.length > 0 && !formUnitId) {
          setFormUnitId(String(uData[0].id));
        }
      }
      if (fRes.ok) setFunds(await fRes.json());
      if (aRes.ok) {
        const aData: Account[] = await aRes.json();
        const exp = aData.filter((a) => a.category === 'BEBAN' || a.category === 'ASET');
        setAccountsList(exp.length > 0 ? exp : aData);
        if (exp.length > 0 && !formAccountId) setFormAccountId(String(exp[0].id));
      }
      if (bRes.ok) {
        const bList: BankAccount[] = await bRes.json();
        setBanks(bList);
        if (bList.length > 0 && !disbBankId) setDisbBankId(String(bList[0].id));
      }
      if (cRes.ok) setCashList(await cRes.json());
      if (bgRes.ok) setBudgetsList(await bgRes.json());
    } catch (e) {
      console.error('Error fetching master data in FundRequests:', e);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (unitFilter) params.append('unitId', unitFilter);

      const res = await authFetch(`/api/fund-requests?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat daftar pengajuan dana');
      setRequestsList(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat pengajuan dana');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, unitFilter]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Check budget availability on amount or budget selection change
  useEffect(() => {
    if (!formBudgetId || !formAmount) {
      setBudgetWarning(null);
      return;
    }
    const selectedBudget = budgetsList.find((b) => String(b.id) === formBudgetId);
    if (selectedBudget) {
      const remaining = Number(selectedBudget.remainingAmount);
      const reqAmount = parseFloat(formAmount) || 0;
      if (reqAmount > remaining) {
        setBudgetWarning(
          `Peringatan: Pengajuan Rp ${reqAmount.toLocaleString('id-ID')} melebihi sisa anggaran Rp ${remaining.toLocaleString('id-ID')} (Plafon: ${formatRupiah(selectedBudget.allocatedAmount)}). Diperlukan persetujuan khusus over-budget.`
        );
      } else {
        setBudgetWarning(null);
      }
    }
  }, [formBudgetId, formAmount, budgetsList]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const numAmount = parseFloat(formAmount);
      if (!numAmount || numAmount <= 0) {
        throw new Error('Nominal pengajuan dana harus lebih dari Rp 0');
      }

      const res = await authFetch('/api/fund-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          unitId: parseInt(formUnitId, 10),
          accountId: parseInt(formAccountId, 10),
          fundId: formFundId ? parseInt(formFundId, 10) : null,
          budgetId: formBudgetId ? parseInt(formBudgetId, 10) : null,
          purpose: formPurpose,
          amountRequested: numAmount,
          itemsDetail: formItemsDetail,
          attachmentUrl: formAttachment,
          allowOverBudget: formAllowOverBudget,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.isOverBudget) {
          throw new Error(data.error);
        }
        throw new Error(data.error || 'Gagal membuat pengajuan dana');
      }

      setSuccessMsg(`Pengajuan dana ${data.requestNumber} berhasil dikirim dan menunggu verifikasi.`);
      setCreateModalOpen(false);
      setFormPurpose('');
      setFormAmount('');
      setFormItemsDetail('');
      setFormAttachment('');
      setFormAllowOverBudget(false);
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan pengajuan dana');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusAction = async (
    requestId: number,
    action: 'EXAMINE' | 'APPROVE' | 'REJECT',
    payload?: any
  ) => {
    try {
      const res = await authFetch(`/api/fund-requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses aksi');

      setSuccessMsg(`Pengajuan berhasil diperbarui ke status: ${data.status}.`);
      setRejectModalOpen(false);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status pengajuan');
    }
  };

  const openDisburseModal = (item: FundRequest) => {
    setSelectedRequest(item);
    setDisbDate(new Date().toISOString().split('T')[0]);
    setDisbRecipient(item.requesterName);
    setDisbAmount(item.amountApproved || item.amountRequested);
    setDisbNotes(`Pencairan Pengajuan ${item.requestNumber} (${item.purpose})`);
    setDisburseModalOpen(true);
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);

    try {
      const numAmount = parseFloat(disbAmount);
      const res = await authFetch(`/api/fund-requests/${selectedRequest.id}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disbursementDate: disbDate,
          recipientName: disbRecipient,
          cashBankType: disbType,
          cashBankId: parseInt(disbBankId, 10),
          amount: numAmount,
          notes: disbNotes,
          receiptUrl: disbReceiptUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mencairkan dana');

      setSuccessMsg(
        `Dana pengajuan ${selectedRequest.requestNumber} berhasil dicairkan (${data.disbursement.disbursementNumber}). Otomatis masuk Jurnal & Buku Bank/Kas!`
      );
      setDisburseModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mencairkan dana');
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const waitingExamCount = requestsList.filter((r) => r.status === 'DIAJUKAN').length;
  const waitingApproveCount = requestsList.filter((r) => r.status === 'DIPERIKSA').length;
  const approvedReadyDisbCount = requestsList.filter((r) => r.status === 'DISETUJUI').length;
  const totalDisbursedAmount = requestsList.reduce(
    (sum, r) => sum + Number(r.amountDisbursed || 0),
    0
  );

  // Search filter
  const filteredRequests = requestsList.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.requestNumber.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      (r.unitName || '').toLowerCase().includes(q) ||
      r.requesterName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
            <Send className="h-4 w-4" />
            <span>PENGAJUAN DANA, APPROVAL & PENCAIRAN</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Pengajuan Dana & Pencairan
          </h1>
          <p className="text-xs text-gray-500">
            Alur pengajuan unit, kontrol sisa anggaran, approval bertingkat, dan pencairan kas/bank
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isReadOnly ? (
            <div className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
              <span>Mode Read-Only</span>
            </div>
          ) : (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Pengajuan Dana</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak</span>
          </button>
          <button
            onClick={fetchRequests}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Maker-Checker & Role Guidance Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Kontrol Internal & Maker-Checker Aktif:</strong> Pembuat pengajuan (Maker) dilarang menyetujui pengajuannya sendiri. Verifikator memeriksa kelengkapan, Approver memutuskan persetujuan, dan Bendahara memproses pencairan kas/bank.
          </span>
        </div>
        <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-800">
          Peran: {user?.roleName?.replace('_', ' ') || 'VIEWER'}
        </span>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-medium">Menunggu Pemeriksaan</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-amber-950">{waitingExamCount}</p>
          <span className="text-[10px] text-amber-700 font-medium">
            Verifikasi kelengkapan oleh Bendahara/Petugas
          </span>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-800 font-medium">Menunggu Persetujuan</span>
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-blue-950">{waitingApproveCount}</p>
          <span className="text-[10px] text-blue-700 font-medium">
            Pemeriksaan wewenang oleh Pimpinan
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-medium">Disetujui (Siap Cair)</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-emerald-950">{approvedReadyDisbCount}</p>
          <span className="text-[10px] text-emerald-700 font-medium">
            Siap dicairkan melalui Kas / Bank
          </span>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-teal-800 font-medium">Total Dana Dicairkan</span>
            <Banknote className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-teal-950">
            {formatRupiah(totalDisbursedAmount)}
          </p>
          <span className="text-[10px] text-teal-700 font-medium">
            Realisasi pengeluaran dana tercatat
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs min-w-[240px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. pengajuan, keperluan, unit, atau pemohon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-500">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="DIAJUKAN">Menunggu Pemeriksaan</option>
            <option value="DIPERIKSA">Menunggu Approval Pimpinan</option>
            <option value="DISETUJUI">Disetujui (Siap Dicairkan)</option>
            <option value="DICAIRKAN">Sudah Dicairkan</option>
            <option value="SELESAI">Selesai (LPJ Beres)</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>

        {!isUnitRole && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-500">UNIT:</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              <option value="">Semua Unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="p-3.5">No. Pengajuan / Tgl</th>
              <th className="p-3.5">Unit / Pemohon</th>
              <th className="p-3.5">Keperluan Belanja</th>
              <th className="p-3.5">Anggaran Terkait</th>
              <th className="p-3.5 text-right">Nominal Diajukan</th>
              <th className="p-3.5 text-center">Status Alur</th>
              <th className="p-3.5 text-center">LPJ Status</th>
              <th className="p-3.5 text-center">Aksi & Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans text-xs">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Memuat data pengajuan dana...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Belum ada pengajuan dana untuk filter ini.
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/70">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-gray-900 block">
                      {r.requestNumber}
                    </span>
                    <span className="text-[11px] text-gray-400">{r.date}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-gray-900 block">{r.unitName}</span>
                    <span className="text-[11px] text-gray-500 block">{r.requesterName}</span>
                    {Boolean(user?.id && r.requesterId === user.id) && (
                      <span className="inline-block mt-0.5 rounded bg-blue-50 text-[10px] text-blue-700 px-1.5 py-0.5 font-bold border border-blue-200">
                        👤 Anda (Maker)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-medium text-gray-900 block truncate" title={r.purpose}>
                      {r.purpose}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Akun: {r.accountName} ({r.accountCode})
                    </span>
                  </td>
                  <td className="p-3.5">
                    {r.budgetCode ? (
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-950 block">
                          {r.budgetCode}
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          Sisa: {formatRupiah(r.budgetRemaining || 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Non-Anggaran</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                    {formatRupiah(r.amountRequested)}
                    {r.amountApproved && Number(r.amountApproved) !== Number(r.amountRequested) && (
                      <span className="block text-[10px] text-emerald-700">
                        Disetujui: {formatRupiah(r.amountApproved)}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        r.status === 'DIAJUKAN'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : r.status === 'DIPERIKSA'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : r.status === 'DISETUJUI'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : r.status === 'DICAIRKAN'
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : r.status === 'SELESAI'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.status === 'DITOLAK' && r.rejectedReason && (
                      <span
                        className="block text-[10px] text-rose-700 cursor-pointer hover:underline mt-0.5"
                        onClick={() => alert(`Alasan Penolakan: ${r.rejectedReason}`)}
                      >
                        Lihat Alasan
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    {r.status === 'DICAIRKAN' || r.status === 'SELESAI' ? (
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                          r.lpjStatus === 'SELESAI'
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : r.lpjStatus === 'PERLU_PERBAIKAN'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : r.lpjStatus === 'DIAJUKAN'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {r.lpjStatus || 'BELUM_LPJ'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1 flex-wrap gap-1">
                      {isReadOnly ? (
                        <span className="text-[10px] text-gray-400 font-medium">Read-Only</span>
                      ) : (
                        (() => {
                          const isMaker = Boolean(user?.id && r.requesterId === user.id);
                          return (
                            <>
                              {/* 1. Pemeriksaan / Verifikasi (Verifikator / Petugas / Bendahara / SuperAdmin) */}
                              {r.status === 'DIAJUKAN' && (isVerifikator || isPetugas || isBendahara || isSuperAdmin) && (
                                isMaker ? (
                                  <span
                                    className="rounded bg-gray-100 px-1.5 py-1 text-[10px] font-semibold text-gray-500 cursor-not-allowed border border-gray-200"
                                    title="Pelanggaran Maker-Checker: Pembuat pengajuan tidak dapat memverifikasi pengajuannya sendiri"
                                  >
                                    🔒 Maker
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleStatusAction(r.id, 'EXAMINE')}
                                    className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-100 border border-blue-200"
                                    title="Periksa kelengkapan & ketersediaan dana (Verifikator)"
                                  >
                                    Periksa
                                  </button>
                                )
                              )}

                              {/* 2. Approval Pimpinan (Pimpinan / SuperAdmin) */}
                              {r.status === 'DIPERIKSA' && (isPimpinan || isSuperAdmin) && (
                                isMaker ? (
                                  <span
                                    className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 border border-amber-200 cursor-not-allowed"
                                    title="Pelanggaran Maker-Checker: Anda adalah pembuat pengajuan ini. Pengajuan harus disetujui oleh Approver lain."
                                  >
                                    🔒 Maker (Dilarang Approve)
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStatusAction(r.id, 'APPROVE')}
                                      className="rounded-lg bg-emerald-800 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 shadow-xs"
                                      title="Setujui pengajuan dana (Approver)"
                                    >
                                      Setujui
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedRequest(r);
                                        setRejectReason('');
                                        setRejectModalOpen(true);
                                      }}
                                      className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-800 hover:bg-rose-100 border border-rose-200"
                                      title="Tolak pengajuan dana"
                                    >
                                      Tolak
                                    </button>
                                  </>
                                )
                              )}

                              {/* 3. Pencairan Dana (Khusus Bendahara / Petugas / SuperAdmin) */}
                              {r.status === 'DISETUJUI' && (isBendahara || isPetugas || isSuperAdmin) && (
                                <button
                                  onClick={() => openDisburseModal(r)}
                                  className="rounded-lg bg-teal-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-900 shadow-xs"
                                  title="Cairkan dana ke kas/bank (Khusus Bendahara)"
                                >
                                  Cairkan Dana
                                </button>
                              )}

                              {/* 4. Buat LPJ (Jika dicairkan) */}
                              {r.status === 'DICAIRKAN' && (
                                <button
                                  onClick={() => onOpenLpjModal && onOpenLpjModal(r.id)}
                                  className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100 border border-amber-200"
                                >
                                  {r.lpjStatus === 'PERLU_PERBAIKAN' ? 'Revisi LPJ' : 'Form LPJ'}
                                </button>
                              )}
                            </>
                          );
                        })()
                      )}

                      <button
                        onClick={() => setDetailModalItem(r)}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                        title="Lihat Detail"
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

      {/* Modal 1: Buat Pengajuan Baru */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">
                Formulir Pengajuan Dana Unit
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Tanggal Pengajuan *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Unit / Divisi Pemohon *
                  </label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    required
                    disabled={isUnitRole && !!user?.unitId}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none disabled:bg-gray-100"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Keperluan / Judul Kegiatan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengadaan bahan makanan santri pekan 1 Oktober"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Pos Akun Beban *
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    {accountsList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Sumber Dana
                  </label>
                  <select
                    value={formFundId}
                    onChange={(e) => setFormFundId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Operasional / Bebas</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Anggaran Terkait (Plafon & Sisa)
                </label>
                <select
                  value={formBudgetId}
                  onChange={(e) => setFormBudgetId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="">Pilih Anggaran Aktif (Opsional)</option>
                  {budgetsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.budgetCode} - {b.unitName}: {b.accountName} (Sisa: {formatRupiah(b.remainingAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nominal Pengajuan Dana (Rp) *
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 5000000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              {budgetWarning && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span>{budgetWarning}</span>
                    {(isSuperAdmin || isBendahara || isPimpinan) && (
                      <label className="flex items-center space-x-2 font-bold text-emerald-900 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formAllowOverBudget}
                          onChange={(e) => setFormAllowOverBudget(e.target.checked)}
                          className="rounded text-emerald-800"
                        />
                        <span>Izinkan pengajuan over-budget (Kewenangan Khusus)</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Rincian Kebutuhan Belanja
                </label>
                <textarea
                  rows={2}
                  placeholder="Rincian item barang / pos pengeluaran yang dibutuhkan..."
                  value={formItemsDetail}
                  onChange={(e) => setFormItemsDetail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Link Dokumen Lampiran / Proposal (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={formAttachment}
                  onChange={(e) => setFormAttachment(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <span>Kirim Pengajuan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pencairan Dana Kas/Bank */}
      {disburseModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Pencairan Dana Pengajuan
                </h2>
                <span className="text-xs text-gray-400">
                  {selectedRequest.requestNumber} • {selectedRequest.unitName}
                </span>
              </div>
              <button
                onClick={() => setDisburseModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-teal-50 p-3 text-xs text-teal-950">
              <span className="font-bold block">Keperluan:</span>
              <p className="mt-0.5">{selectedRequest.purpose}</p>
            </div>

            <form onSubmit={handleDisburseSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Tanggal Pencairan *
                  </label>
                  <input
                    type="date"
                    value={disbDate}
                    onChange={(e) => setDisbDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Penerima Dana *
                  </label>
                  <input
                    type="text"
                    value={disbRecipient}
                    onChange={(e) => setDisbRecipient(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Sumber Pencairan *
                  </label>
                  <select
                    value={disbType}
                    onChange={(e) => {
                      const t = e.target.value as 'KAS' | 'BANK';
                      setDisbType(t);
                      if (t === 'BANK' && banks.length > 0) setDisbBankId(String(banks[0].id));
                      if (t === 'KAS' && cashList.length > 0) setDisbBankId(String(cashList[0].id));
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="BANK">Rekening Bank</option>
                    <option value="KAS">Kas Tunai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Pilih Rekening *
                  </label>
                  <select
                    value={disbBankId}
                    onChange={(e) => setDisbBankId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    {disbType === 'BANK'
                      ? banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({b.accountNumber}) - Saldo: {formatRupiah(b.currentBalance)}
                          </option>
                        ))
                      : cashList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} - Saldo: {formatRupiah(c.currentBalance)}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nominal Pencairan (Rp) *
                </label>
                <input
                  type="number"
                  value={disbAmount}
                  onChange={(e) => setDisbAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Catatan Pencairan
                </label>
                <input
                  type="text"
                  value={disbNotes}
                  onChange={(e) => setDisbNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-950">
                <span className="font-bold block">Integrasi Akuntansi Otomatis:</span>
                <p className="mt-0.5">
                  Posting akan otomatis membuat Transaksi Pengeluaran Kas/Bank (KK-...) dan
                  Jurnal Akuntansi: <b>DEBIT</b> Beban Terkait vs <b>KREDIT</b> Rekening Kas/Bank.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDisburseModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Pencairan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Penolakan Pengajuan (Wajib Alasan) */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 text-rose-800">
                Tolak Pengajuan Dana
              </h2>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              Pengajuan <b>{selectedRequest.requestNumber}</b> ({selectedRequest.purpose}) senilai{' '}
              <b>{formatRupiah(selectedRequest.amountRequested)}</b> akan ditolak.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Alasan Penolakan (WAJIB DIISI) *
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Dokumen kebutuhan belum melampirkan estimasi harga resmi..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    alert('Alasan penolakan wajib diisi!');
                    return;
                  }
                  handleStatusAction(selectedRequest.id, 'REJECT', {
                    rejectedReason: rejectReason,
                  });
                }}
                className="rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Detail Pengajuan */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Detail Pengajuan Dana</h2>
                <span className="font-mono text-xs text-gray-400">
                  {detailModalItem.requestNumber}
                </span>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Tanggal</span>
                  <span className="font-semibold">{detailModalItem.date}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Unit Pemohon</span>
                  <span className="font-semibold">{detailModalItem.unitName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Nama Pemohon</span>
                  <span className="font-semibold">{detailModalItem.requesterName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Status</span>
                  <span className="font-bold text-emerald-800">{detailModalItem.status}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Keperluan</span>
                <p className="mt-0.5 font-medium text-gray-900">{detailModalItem.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Nominal Diajukan</span>
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {formatRupiah(detailModalItem.amountRequested)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Nominal Dicairkan</span>
                  <span className="font-mono text-sm font-bold text-teal-800">
                    {formatRupiah(detailModalItem.amountDisbursed || 0)}
                  </span>
                </div>
              </div>

              {detailModalItem.budgetCode && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Anggaran Terkait
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    {detailModalItem.budgetCode}
                  </span>
                </div>
              )}

              {detailModalItem.itemsDetail && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Rincian Belanja</span>
                  <p className="mt-0.5 p-2 bg-gray-50 rounded-lg text-gray-800">
                    {detailModalItem.itemsDetail}
                  </p>
                </div>
              )}

              {detailModalItem.rejectedReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                  <span className="font-bold block text-[10px] uppercase">Catatan Penolakan:</span>
                  <p className="mt-0.5">{detailModalItem.rejectedReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setDetailModalItem(null)}
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
