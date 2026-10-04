import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog } from '../types/index.ts';

export const AuditTrailView: React.FC = () => {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/audit-logs?limit=200');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchEmail = log.userEmail?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchEntity = log.entityType?.toLowerCase().includes(q);
      if (!matchEmail && !matchDetails && !matchEntity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Riwayat Audit Trail (Jejak Aktivitas)
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan kepatuhan & transparansi: login, posting transaksi, pembalikan (reversal), perubahan master data
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs min-w-[220px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari user, aktivitas, atau rincian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
        >
          <option value="">Semua Aktivitas</option>
          <option value="POST">POST (Posting Transaksi)</option>
          <option value="REVERSE">REVERSE (Pembalikan Transaksi)</option>
          <option value="CREATE">CREATE (Tambah Data)</option>
          <option value="UPDATE">UPDATE (Perubahan Data)</option>
          <option value="LOGIN">LOGIN (Masuk Sistem)</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3.5">Waktu</th>
              <th className="px-5 py-3.5">Pengguna</th>
              <th className="px-5 py-3.5">Aktivitas</th>
              <th className="px-5 py-3.5">Entitas</th>
              <th className="px-5 py-3.5">Rincian Perubahan / Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Memuat riwayat audit...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Tidak ada catatan audit ditemukan.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-800">
                      {log.userName || log.userEmail?.split('@')[0] || 'Sistem'}
                    </div>
                    <div className="text-[10px] text-gray-400">{log.userEmail || 'system'}</div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        log.action === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'REVERSE'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'CREATE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.action === 'UPDATE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {log.entityType} #{log.entityId || ''}
                  </td>
                  <td className="px-5 py-3 text-gray-800 leading-relaxed">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
