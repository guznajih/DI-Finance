import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Eye,
  Filter,
  History,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User as UserIcon,
  X,
  FileText,
  ArrowRight,
  Database,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog } from '../types/index.ts';

export const AuditTrailView: React.FC = () => {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [recordIdFilter, setRecordIdFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Log for Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '300');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (actionFilter) params.append('action', actionFilter);
      if (moduleFilter) params.append('module', moduleFilter);
      if (recordIdFilter) params.append('recordId', recordIdFilter);
      if (searchQuery) params.append('searchQuery', searchQuery);

      const res = await authFetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, actionFilter, moduleFilter]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActionFilter('');
    setModuleFilter('');
    setUserQuery('');
    setRecordIdFilter('');
    setSearchQuery('');
  };

  // Client-side filtering for user & search query if needed
  const filteredLogs = logs.filter((log) => {
    if (userQuery) {
      const uq = userQuery.toLowerCase();
      const matchName = log.userName?.toLowerCase().includes(uq);
      const matchEmail = log.userEmail?.toLowerCase().includes(uq);
      const matchRole = log.userRole?.toLowerCase().includes(uq);
      if (!matchName && !matchEmail && !matchRole) return false;
    }
    if (recordIdFilter) {
      const rid = String(log.recordId || log.entityId || '');
      if (!rid.toLowerCase().includes(recordIdFilter.toLowerCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDetails = log.details?.toLowerCase().includes(q) || log.summary?.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      const matchEntity = (log.record || log.entityType)?.toLowerCase().includes(q);
      const matchModule = log.module?.toLowerCase().includes(q);
      const matchAction = log.action?.toLowerCase().includes(q);
      if (!matchDetails && !matchReason && !matchEntity && !matchModule && !matchAction) return false;
    }
    return true;
  });

  const getActionColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'POST':
      case 'APPROVE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'REVERSE':
      case 'VOID':
      case 'REJECT':
      case 'DELETE':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'CREATE':
      case 'SUBMIT':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'VERIFY':
      case 'EXAMINE':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'UPDATE':
      case 'PERMISSION_CHANGE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'LOGIN':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Immutability Badge */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tahap 8B: Audit Trail & Perlindungan Transaksi
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              <Lock className="h-3 w-3 text-slate-500" />
              Immutable Log (Read-Only)
            </span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Riwayat Jejak Audit (Audit Trail)
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan kepatuhan & transparansi seluruh aktivitas: CREATE, UPDATE, SUBMIT, VERIFY, APPROVE, REJECT, POST, VOID, REVERSE, LOGIN, LOGOUT, PERMISSION_CHANGE.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Security Protection Notice Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 shadow-xs">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Integritas & Immutabilitas Transaksi Keuangan:
            </p>
            <p className="text-amber-800 leading-relaxed">
              Transaksi dengan status <strong>POSTED</strong> terkunci otomatis dan dilarang diedit langsung atau dihapus. Koreksi hanya dapat dilakukan melalui mekanisme <strong>REVERSAL</strong> atau <strong>VOID</strong> dengan jurnal pembalik seimbang (Debit = Kredit) dan alasan akuntansi yang wajib tercatat permanen di jejak audit ini.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700">
            <Filter className="h-3.5 w-3.5 text-gray-500" />
            <span>Filter Jejak Audit</span>
          </div>
          {(startDate || endDate || actionFilter || moduleFilter || userQuery || recordIdFilter || searchQuery) && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Tanggal Mulai */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Dari Tanggal
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-gray-800 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Tanggal Akhir */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Sampai Tanggal
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-gray-800 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Aksi (Aktivitas)
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">Semua Aksi</option>
              <option value="CREATE">CREATE (Tambah Data)</option>
              <option value="UPDATE">UPDATE (Perubahan Data)</option>
              <option value="SUBMIT">SUBMIT (Pengajuan)</option>
              <option value="VERIFY">VERIFY (Verifikasi)</option>
              <option value="APPROVE">APPROVE (Persetujuan)</option>
              <option value="REJECT">REJECT (Penolakan)</option>
              <option value="POST">POST (Posting Transaksi)</option>
              <option value="VOID">VOID (Pembatalan Dokumen)</option>
              <option value="REVERSE">REVERSE (Jurnal Pembalik)</option>
              <option value="LOGIN">LOGIN (Masuk Sistem)</option>
              <option value="LOGOUT">LOGOUT (Keluar Sistem)</option>
              <option value="PERMISSION_CHANGE">PERMISSION_CHANGE (Ubah Role/Izin)</option>
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Modul Sistem
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none"
            >
              <option value="">Semua Modul</option>
              <option value="TRANSAKSI">TRANSAKSI (Keuangan)</option>
              <option value="PENGESAHAN_DANA">PENGESAHAN_DANA (Workflow)</option>
              <option value="ANGGARAN">ANGGARAN (Budget)</option>
              <option value="LPJ">LPJ (Pertanggungjawaban)</option>
              <option value="INVESTASI">INVESTASI (Aset Produktif)</option>
              <option value="SPP">SPP (Penerimaan Santri)</option>
              <option value="USER_MGMT">USER_MGMT (Pengguna & Role)</option>
              <option value="AUTH">AUTH (Autentikasi & Sesi)</option>
              <option value="COA">COA (Bagan Akun)</option>
              <option value="KAS_BANK">KAS_BANK (Rekening)</option>
              <option value="MASTER_DATA">MASTER_DATA (Unit & Dana)</option>
            </select>
          </div>

          {/* Filter Pengguna */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Pengguna (User)
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs">
              <UserIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Nama / email / role..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="w-full bg-transparent text-gray-800 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Filter Record ID */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              ID Data (Record ID)
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs">
              <Database className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Contoh: 101, TRX..."
                value={recordIdFilter}
                onChange={(e) => setRecordIdFilter(e.target.value)}
                className="w-full bg-transparent text-gray-800 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* Global Search query */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs">
          <Search className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Cari rincian transaksi, alasan pembatalan, nomor bukti, atau kata kunci lainnya..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchLogs();
            }}
            className="w-full bg-transparent text-gray-800 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-xs font-semibold text-gray-700">
            Daftar Catatan Jejak Audit ({filteredLogs.length} Aktivitas)
          </div>
          <div className="text-[11px] text-gray-500">
            Urutan: Aktivitas Terbaru ke Terlama
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Kapan (Waktu)</th>
                <th className="px-5 py-3.5">Siapa (Pengguna)</th>
                <th className="px-5 py-3.5">Melakukan Apa (Aksi)</th>
                <th className="px-5 py-3.5">Terhadap Data Apa</th>
                <th className="px-5 py-3.5">Keterangan & Alasan</th>
                <th className="px-5 py-3.5 text-center">Detail Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-gray-400" />
                    Memuat riwayat audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Tidak ada catatan audit yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    {/* KAPAN */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-gray-800">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '-'}
                      </div>
                      {log.ipAddress && (
                        <div className="text-[10px] text-gray-400 font-mono">IP: {log.ipAddress}</div>
                      )}
                    </td>

                    {/* SIAPA */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">
                        {log.userName || log.user?.name || log.userEmail?.split('@')[0] || 'Sistem'}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-gray-500">
                        <span className="font-mono font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {log.userRole || log.user?.role || 'PENGGUNA'}
                        </span>
                        <span>·</span>
                        <span>{log.userEmail || 'system'}</span>
                      </div>
                    </td>

                    {/* MELAKUKAN APA */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        {log.module && (
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {log.module}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* TERHADAP DATA APA */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">
                        {log.record || log.entityType}
                      </div>
                      <div className="font-mono text-[10px] text-gray-500">
                        ID: #{log.recordId || log.entityId || '-'}
                      </div>
                    </td>

                    {/* KETERANGAN */}
                    <td className="px-5 py-3.5 text-gray-800 max-w-md">
                      <div className="line-clamp-2 leading-relaxed">
                        {log.summary || log.details || '-'}
                      </div>
                      {log.reason && (
                        <div className="mt-1 text-[11px] font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/80">
                          Alasan: {log.reason}
                        </div>
                      )}
                    </td>

                    {/* INSPEKSI NILAI */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center space-x-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition shadow-2xs"
                      >
                        <Eye className="h-3 w-3 text-gray-500" />
                        <span>Inspeksi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail / Value Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-900">
                  Inspeksi Detail Jejak Audit #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3.5 text-xs text-gray-700">
              <div>
                <span className="font-semibold text-gray-500 block text-[10px] uppercase">Pengguna (Aktor)</span>
                <span className="font-bold text-gray-900">
                  {selectedLog.userName || selectedLog.user?.name || selectedLog.userEmail || 'Sistem'}
                </span>
                <span className="text-[10px] text-gray-500 block">
                  Role: {selectedLog.userRole || selectedLog.user?.role || '-'} ({selectedLog.userEmail})
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block text-[10px] uppercase">Waktu Pencatatan</span>
                <span className="font-mono text-gray-900">
                  {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString('id-ID') : '-'}
                </span>
                {selectedLog.ipAddress && (
                  <span className="text-[10px] text-gray-500 block">IP: {selectedLog.ipAddress}</span>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-500 block text-[10px] uppercase">Aksi & Modul</span>
                <span className={`inline-block rounded px-1.5 py-0.5 font-bold text-[10px] border ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <span className="ml-1.5 text-gray-700 font-semibold">{selectedLog.module}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-500 block text-[10px] uppercase">Target Data (Record)</span>
                <span className="font-semibold text-gray-900">{selectedLog.record || selectedLog.entityType}</span>
                <span className="text-[10px] text-gray-500 block">ID Data: #{selectedLog.recordId || selectedLog.entityId || '-'}</span>
              </div>
            </div>

            {/* Description & Reason */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Rincian Aktivitas</h4>
              <p className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 leading-relaxed">
                {selectedLog.summary || selectedLog.details || '-'}
              </p>
            </div>

            {selectedLog.reason && (
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase mb-1">Alasan / Catatan Resmi</h4>
                <p className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 font-medium">
                  {selectedLog.reason}
                </p>
              </div>
            )}

            {/* Before vs After comparison */}
            {(selectedLog.beforeValue != null || selectedLog.afterValue != null) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-gray-500" />
                  Perbandingan Nilai (Before vs After)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Nilai Sebelum (Before Value)
                    </span>
                    <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedLog.beforeValue != null
                        ? JSON.stringify(selectedLog.beforeValue, null, 2)
                        : '(Tidak ada / Data baru)'}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Nilai Sesudah (After Value)
                    </span>
                    <pre className="text-[10px] font-mono text-emerald-900 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {selectedLog.afterValue != null
                        ? JSON.stringify(selectedLog.afterValue, null, 2)
                        : '(Tidak ada)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Immutability footer */}
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1 text-slate-600">
                <Lock className="h-3 w-3 text-slate-400" />
                Catatan ini terkunci secara permanen dan tidak dapat diedit atau dihapus.
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-200 transition"
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
