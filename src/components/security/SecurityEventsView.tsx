import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  UserCheck,
  UserX,
  Key,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Info,
  Database,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  user: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  ipAddress?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export const SecurityEventsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const eventTypesList = [
    { key: 'ALL', label: 'Semua Event' },
    { key: 'LOGIN_SUCCESS', label: 'LOGIN_SUCCESS (Login Berhasil)' },
    { key: 'LOGIN_FAILED', label: 'LOGIN_FAILED (Gagal Login)' },
    { key: 'LOGOUT', label: 'LOGOUT (Keluar Sistem)' },
    { key: 'PERMISSION_CHANGED', label: 'PERMISSION_CHANGED (Ubah Izin)' },
    { key: 'ROLE_CHANGED', label: 'ROLE_CHANGED (Ubah Role)' },
    { key: 'PERIOD_CLOSED', label: 'PERIOD_CLOSED (Tutup Periode)' },
    { key: 'PERIOD_REOPENED', label: 'PERIOD_REOPENED (Buka Periode)' },
    { key: 'BACKUP', label: 'BACKUP (Cadangan Data)' },
    { key: 'RESTORE', label: 'RESTORE (Pemulihan)' },
    { key: 'SESSION_EXPIRED', label: 'SESSION_EXPIRED (Sesi Habis)' },
  ];

  const fetchSecurityEvents = async () => {
    setLoading(true);
    try {
      let url = '/api/security-events?limit=150';
      if (selectedType !== 'ALL') url += `&eventType=${selectedType}`;
      if (selectedSeverity !== 'ALL') url += `&severity=${selectedSeverity}`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}`;

      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to load security events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, [selectedType, selectedSeverity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSecurityEvents();
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return <UserCheck className="h-4 w-4 text-emerald-600" />;
      case 'LOGIN_FAILED':
        return <UserX className="h-4 w-4 text-rose-600" />;
      case 'LOGOUT':
        return <User className="h-4 w-4 text-gray-500" />;
      case 'PERIOD_CLOSED':
        return <Lock className="h-4 w-4 text-amber-600" />;
      case 'PERIOD_REOPENED':
        return <RotateCcw className="h-4 w-4 text-emerald-600" />;
      case 'BACKUP':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'PERMISSION_CHANGED':
      case 'ROLE_CHANGED':
        return <Key className="h-4 w-4 text-purple-600" />;
      default:
        return <ShieldAlert className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Tahap 8D — Keamanan Sistem
            </span>
            <span className="text-xs text-gray-500">Log Peristiwa Keamanan Terpisah</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Security Events Log
          </h1>
          <p className="text-sm text-gray-600">
            Pencatatan peristiwa autentikasi, eskalasi peran, perubahan izin, kontrol periode, dan operasi cadangan data. Bersih dari kata sandi, token, dan rahasia sistem.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSecurityEvents}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>
      </div>

      {/* Security Privacy Guarantee */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-950">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-950">
              Kebijakan Privasi & Sanitasi Log Keamanan:
            </p>
            <p className="text-emerald-900 leading-relaxed">
              Seluruh kredensial rahasia (kata sandi, token otorisasi Bearer, kunci API, dan secret) secara ketat disaring otomatis ([REDACTED]) sebelum disimpan ke audit database, mencegah kebocoran informasi kredensial pada riwayat audit.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2 relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari detail peristiwa, nama pengguna, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              {eventTypesList.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Tingkat Keparahan</option>
              <option value="INFO">Hanya INFO</option>
              <option value="WARNING">Hanya WARNING</option>
              <option value="CRITICAL">Hanya CRITICAL</option>
            </select>
          </div>
        </form>
      </div>

      {/* Table of Events */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Daftar Peristiwa Keamanan ({events.length} Peristiwa)
          </h2>
          <span className="text-xs text-gray-500">
            Pencatatan real-time audit database
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Memuat peristiwa keamanan...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-500">
            Tidak ada peristiwa keamanan yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3.5">Waktu</th>
                  <th className="px-4 py-3.5">Tipe Event</th>
                  <th className="px-4 py-3.5">Tingkat</th>
                  <th className="px-4 py-3.5">Pengguna & Peran</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-6 py-3.5">Rincian Peristiwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      <div className="font-mono text-gray-800">
                        {new Date(ev.timestamp).toLocaleDateString('id-ID', { dateStyle: 'short' })}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(ev.timestamp).toLocaleTimeString('id-ID', { timeStyle: 'medium' })}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getEventIcon(ev.eventType)}
                        <span className="font-semibold text-xs text-gray-900 font-mono">
                          {ev.eventType}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-bold ${getSeverityBadge(
                          ev.severity
                        )}`}
                      >
                        {ev.severity}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs">
                      <div className="font-semibold text-gray-900">{ev.user?.name || 'Sistem'}</div>
                      <div className="text-gray-500 text-[11px]">
                        {ev.user?.role || 'SYSTEM'} {ev.user?.email ? `• ${ev.user.email}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs font-mono text-gray-600">
                      {ev.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-6 py-4 text-xs max-w-md">
                      <div className="text-gray-900">{ev.details}</div>
                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-gray-500">
                          {Object.entries(ev.metadata).map(([k, v]) => (
                            <span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
