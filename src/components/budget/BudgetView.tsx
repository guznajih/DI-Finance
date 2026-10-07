import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle,
  CheckCircle2,
  Coins,
  DollarSign,
  Download,
  Filter,
  Layers,
  Percent,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Account, Budget, Fund, Unit } from '../../types/index.ts';

export const BudgetView: React.FC = () => {
  const { authFetch, user } = useAuth();

  const [budgetsList, setBudgetsList] = useState<Budget[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('2026/2027');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'by-unit' | 'vs-realization'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Budget Form
  const [formYear, setFormYear] = useState<string>('2026/2027');
  const [formUnitId, setFormUnitId] = useState<string>('');
  const [formFundId, setFormFundId] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'AKTIF'>('AKTIF');

  const canManage =
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'BENDAHARA' ||
    user?.roleName === 'PIMPINAN';

  const fetchDropdowns = async () => {
    try {
      const [uRes, fRes, aRes] = await Promise.all([
        authFetch('/api/units'),
        authFetch('/api/funds'),
        authFetch('/api/accounts'),
      ]);

      if (uRes.ok) {
        const uData: Unit[] = await uRes.json();
        setUnits(uData);
        if (uData.length > 0 && !formUnitId) setFormUnitId(String(uData[0].id));
      }
      if (fRes.ok) setFunds(await fRes.json());
      if (aRes.ok) {
        const aData: Account[] = await aRes.json();
        // filter expense/operational accounts
        const expenseAccs = aData.filter(
          (a) => a.category === 'BEBAN' || a.category === 'ASET'
        );
        setAccountsList(expenseAccs.length > 0 ? expenseAccs : aData);
        if (expenseAccs.length > 0 && !formAccountId) {
          setFormAccountId(String(expenseAccs[0].id));
        }
      }
    } catch (e) {
      console.error('Error fetching dropdown master:', e);
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (fiscalYearFilter) params.append('fiscalYear', fiscalYearFilter);
      if (unitFilter) params.append('unitId', unitFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await authFetch(`/api/budgets?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat daftar anggaran');
      setBudgetsList(await res.json());
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat anggaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fiscalYearFilter, unitFilter, statusFilter]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const numAmount = parseFloat(formAmount);
      if (!numAmount || numAmount <= 0) {
        throw new Error('Nominal anggaran harus lebih dari Rp 0');
      }

      const res = await authFetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear: formYear,
          unitId: parseInt(formUnitId, 10),
          fundId: formFundId ? parseInt(formFundId, 10) : null,
          accountId: parseInt(formAccountId, 10),
          allocatedAmount: numAmount,
          description: formDesc,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan rencana anggaran');

      setSuccessMsg(`Anggaran ${data.budgetCode} berhasil dibuat dan diaktifkan.`);
      setModalOpen(false);
      setFormAmount('');
      setFormDesc('');
      fetchBudgets();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal membuat anggaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (budgetId: number, newStatus: string) => {
    try {
      const res = await authFetch(`/api/budgets/${budgetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal memperbarui status');
      }
      setSuccessMsg(`Status anggaran berhasil diubah menjadi ${newStatus}.`);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status anggaran');
    }
  };

  // KPIs
  const totalAllocated = budgetsList.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
  const totalRealized = budgetsList.reduce((sum, b) => sum + Number(b.realizedAmount), 0);
  const totalRemaining = totalAllocated - totalRealized;
  const overallPercentage =
    totalAllocated > 0 ? Math.round((totalRealized / totalAllocated) * 100) : 0;

  // Filtered list
  const filteredBudgets = budgetsList.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.budgetCode.toLowerCase().includes(q) ||
      (b.unitName || '').toLowerCase().includes(q) ||
      (b.accountName || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    );
  });

  // Group by Unit
  const unitGroupMap = new Map<number, {
    unitName: string;
    unitCode: string;
    allocated: number;
    realized: number;
    remaining: number;
    itemsCount: number;
  }>();

  for (const b of filteredBudgets) {
    const cur = unitGroupMap.get(b.unitId) || {
      unitName: b.unitName || 'Unit',
      unitCode: b.unitCode || '',
      allocated: 0,
      realized: 0,
      remaining: 0,
      itemsCount: 0,
    };
    cur.allocated += Number(b.allocatedAmount);
    cur.realized += Number(b.realizedAmount);
    cur.remaining += Number(b.remainingAmount);
    cur.itemsCount++;
    unitGroupMap.set(b.unitId, cur);
  }

  const exportCSV = () => {
    const headers = [
      'Kode Anggaran',
      'Tahun Anggaran',
      'Unit',
      'Pos Akun',
      'Plafon Anggaran (Rp)',
      'Realisasi (Rp)',
      'Sisa Anggaran (Rp)',
      '% Realisasi',
      'Status',
    ];
    const rows = filteredBudgets.map((b) => [
      `"${b.budgetCode}"`,
      `"${b.fiscalYear}"`,
      `"${b.unitName || ''}"`,
      `"${b.accountName || ''}"`,
      Number(b.allocatedAmount),
      Number(b.realizedAmount),
      Number(b.remainingAmount),
      `"${b.realizationPercentage || 0}%"`,
      `"${b.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Rencana_Anggaran_${fiscalYearFilter.replace(/\//g, '-')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <Calculator className="h-4 w-4" />
            <span>MODUL ANGGARAN & REALISASI (FASE 4)</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Rencana Anggaran & Realisasi
          </h1>
          <p className="text-xs text-gray-500">
            Penetapan plafon belanja per unit, pelacakan otomatis realisasi, dan kontrol sisa dana
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Rencana Anggaran</span>
            </button>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak</span>
          </button>
          <button
            onClick={fetchBudgets}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-teal-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Total Plafon Anggaran</span>
          <p className="mt-2 font-mono text-xl font-bold text-slate-900">
            {formatRupiah(totalAllocated)}
          </p>
          <span className="text-[11px] text-slate-400">Tahun {fiscalYearFilter || 'Semua'}</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Total Realisasi Terpakai</span>
          <p className="mt-2 font-mono text-xl font-bold text-teal-700">
            {formatRupiah(totalRealized)}
          </p>
          <span className="text-[11px] text-teal-600 font-medium">
            Diakumulasi dari pencairan dana kas & bank
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <span className="text-xs text-slate-500 font-semibold">Sisa Anggaran Tersedia</span>
          <p className="mt-2 font-mono text-xl font-bold text-slate-900">
            {formatRupiah(totalRemaining)}
          </p>
          <span className="text-[11px] text-slate-400">
            Sisa = Plafon Anggaran - Realisasi
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-semibold">Persentase Realisasi</span>
            <span className="text-xs font-bold text-teal-800">{overallPercentage}%</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 90
                  ? 'bg-rose-500'
                  : overallPercentage > 75
                  ? 'bg-amber-500'
                  : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
          <span className="mt-1.5 block text-[10.5px] text-slate-400">
            Target penyerapan anggaran pesantren
          </span>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Rencana Anggaran
            </button>
            <button
              onClick={() => setActiveTab('by-unit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'by-unit'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekap Anggaran per Unit
            </button>
            <button
              onClick={() => setActiveTab('vs-realization')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'vs-realization'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anggaran vs Realisasi
            </button>
          </div>

          <div className="flex flex-1 sm:max-w-xs items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari kode, unit, atau akun..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Tahun Anggaran
            </label>
            <select
              value={fiscalYearFilter}
              onChange={(e) => setFiscalYearFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              <option value="">Semua Tahun Anggaran</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Unit / Divisi
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              <option value="">Semua Unit / Divisi</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code} - {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Status Anggaran
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">AKTIF (Dapat Diajukan)</option>
              <option value="DISETUJUI">DISETUJUI</option>
              <option value="DIAJUKAN">DIAJUKAN</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table: Tab 1 - All Budgets */}
      {activeTab === 'all' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="p-3.5">Kode / Tahun</th>
                <th className="p-3.5">Unit / Divisi</th>
                <th className="p-3.5">Pos Akun Belanja</th>
                <th className="p-3.5 text-right">Plafon Anggaran</th>
                <th className="p-3.5 text-right text-teal-800">Realisasi</th>
                <th className="p-3.5 text-right text-emerald-800">Sisa Anggaran</th>
                <th className="p-3.5 text-center">% Realisasi</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Memuat data rencana anggaran...
                  </td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Belum ada rencana anggaran untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((b) => {
                  const pct = b.realizationPercentage || 0;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/70">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-gray-900 block">
                          {b.budgetCode}
                        </span>
                        <span className="text-[11px] text-gray-400">TA {b.fiscalYear}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-gray-900 block">{b.unitName}</span>
                        <span className="text-[11px] text-gray-400">{b.fundName || 'Operasional'}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-gray-900 block">{b.accountName}</span>
                        <span className="font-mono text-[11px] text-gray-400">({b.accountCode})</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                        {formatRupiah(b.allocatedAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-teal-900">
                        {formatRupiah(b.realizedAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-950">
                        {formatRupiah(b.remainingAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            pct > 90
                              ? 'bg-rose-100 text-rose-800'
                              : pct > 75
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            b.status === 'AKTIF'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : b.status === 'DISETUJUI'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'DIAJUKAN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {canManage && b.status !== 'AKTIF' && (
                          <div className="flex items-center justify-center space-x-1">
                            {b.status === 'DRAFT' && (
                              <button
                                onClick={() => handleStatusChange(b.id, 'DIAJUKAN')}
                                className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-100"
                              >
                                Ajukan
                              </button>
                            )}
                            {b.status === 'DIAJUKAN' && (
                              <button
                                onClick={() => handleStatusChange(b.id, 'DISETUJUI')}
                                className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800 hover:bg-blue-100"
                              >
                                Setujui
                              </button>
                            )}
                            {(b.status === 'DISETUJUI' || b.status === 'DRAFT') && (
                              <button
                                onClick={() => handleStatusChange(b.id, 'AKTIF')}
                                className="rounded bg-emerald-800 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-900"
                              >
                                Aktifkan
                              </button>
                            )}
                          </div>
                        )}
                        {b.status === 'AKTIF' && (
                          <span className="text-[11px] font-semibold text-emerald-700">Siap Pakai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Anggaran per Unit Breakdown */}
      {activeTab === 'by-unit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(unitGroupMap.values()).map((u, i) => {
            const uPct = u.allocated > 0 ? Math.round((u.realized / u.allocated) * 100) : 0;
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {u.unitCode || 'UNIT'}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">{u.unitName}</h3>
                    <span className="text-[11px] text-gray-400">
                      {u.itemsCount} Pos Alokasi Anggaran
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium">Persentase</span>
                    <p className="font-mono text-lg font-bold text-emerald-950">{uPct}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      uPct > 90 ? 'bg-rose-500' : uPct > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, uPct)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Plafon</span>
                    <p className="font-mono text-xs font-bold text-gray-900 mt-0.5">
                      {formatRupiah(u.allocated)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Realisasi</span>
                    <p className="font-mono text-xs font-bold text-teal-800 mt-0.5">
                      {formatRupiah(u.realized)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Sisa Dana</span>
                    <p className="font-mono text-xs font-bold text-emerald-900 mt-0.5">
                      {formatRupiah(u.remaining)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Anggaran vs Realisasi (Analisis Selisih) */}
      {activeTab === 'vs-realization' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Matriks Analisis Anggaran vs Realisasi Pengeluaran Riil
              </h3>
              <p className="text-xs text-gray-500">
                Membandingkan alokasi anggaran dengan realisasi pencairan dana riil
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800">
              Deviasi Total: {formatRupiah(totalRemaining)} (Tersedia)
            </span>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="p-3.5">Unit & Akun</th>
                <th className="p-3.5 text-right">Plafon (Anggaran)</th>
                <th className="p-3.5 text-right text-teal-800">Pengeluaran Riil</th>
                <th className="p-3.5 text-right text-emerald-800">Sisa Anggaran</th>
                <th className="p-3.5 text-center">Progress Penyerapan</th>
                <th className="p-3.5 text-center">Status Deviasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans text-xs">
              {filteredBudgets.map((b) => {
                const pct = b.realizationPercentage || 0;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-3.5">
                      <span className="font-semibold text-gray-900 block">{b.unitName}</span>
                      <span className="text-[11px] text-gray-500">{b.accountName} ({b.accountCode})</span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-gray-900">
                      {formatRupiah(b.allocatedAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-teal-900">
                      {formatRupiah(b.realizedAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-950">
                      {formatRupiah(b.remainingAmount)}
                    </td>
                    <td className="p-3.5 text-center min-w-[140px]">
                      <div className="flex items-center space-x-2 justify-center">
                        <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      {pct >= 100 ? (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          Plafon Habis
                        </span>
                      ) : pct > 75 ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Mendekati Plafon
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Sisa Aman
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Buat Anggaran */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">
                Buat Rencana Anggaran Baru
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Tahun Anggaran *
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Unit / Divisi *
                  </label>
                  <select
                    value={formUnitId}
                    onChange={(e) => setFormUnitId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
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
                  Pos Akun Beban / Operasional *
                </label>
                <select
                  value={formAccountId}
                  onChange={(e) => setFormAccountId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  {accountsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Sumber Dana
                  </label>
                  <select
                    value={formFundId}
                    onChange={(e) => setFormFundId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Semua / Operasional</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Plafon Anggaran (Rp) *
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 20000000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Keterangan / Tujuan Rencana Anggaran
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kegiatan atau rincian peruntukan anggaran..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Status Anggaran Awal
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="AKTIF">Langsung Aktif (Siap Diajukan Dana)</option>
                  <option value="DRAFT">Draft Rencana</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-1.5 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Anggaran</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
