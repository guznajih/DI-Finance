import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  FileText,
  Search,
  Eye,
  Building,
  KeyRound,
  Check,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { RoleName } from '../../types/index.ts';

export const SecurityPolicyView: React.FC = () => {
  const { user, authFetch, loginAsRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'matrix' | 'maker_checker' | 'testing' | 'audit'>('matrix');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testingRunning, setTestingRunning] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  // Available minimal roles
  const rolesList: { key: RoleName; label: string; desc: string; category: string }[] = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Akses penuh konfigurasi sistem, izin, dan audit trail', category: 'Administratif' },
    { key: 'BENDAHARA', label: 'Bendahara', desc: 'Pemrosesan transaksi harian, kas/bank, pencairan & posting jurnal', category: 'Keuangan' },
    { key: 'VERIFIKATOR', label: 'Verifikator', desc: 'Pemeriksaan berkas RAB & bukti transaksi (tidak berwenang approve final)', category: 'Kontrol Internal' },
    { key: 'APPROVER', label: 'Approver / Pimpinan', desc: 'Persetujuan akhir pengajuan dana sesuai kewenangan (Maker != Checker)', category: 'Otorisasi' },
    { key: 'PETUGAS_UNIT', label: 'Petugas Unit', desc: 'Pengajuan usulan operasional & LPJ terbatas pada unit masing-masing', category: 'Operasional Unit' },
    { key: 'AUDITOR', label: 'Auditor', desc: 'Akses Read-Only mutlak untuk seluruh modul buku besar & laporan keuangan', category: 'Pengawasan' },
    { key: 'VIEWER', label: 'Viewer', desc: 'Peninjau data keuangan tanpa hak modifikasi atau posting', category: 'Pengawasan' },
  ];

  // Permission Matrix action categories
  const permissionActions = [
    {
      id: 'trx_create',
      name: 'Buat Transaksi Kas/Bank',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Hanya Bendahara & Admin',
    },
    {
      id: 'trx_post_rev',
      name: 'Posting & Reversal Jurnal',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Koreksi double-entry',
    },
    {
      id: 'req_create',
      name: 'Buat Pengajuan Dana',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: true, AUDITOR: false, VIEWER: false },
      note: 'Petugas Unit dibatasi unitnya',
    },
    {
      id: 'req_examine',
      name: 'Verifikasi / Periksa Berkas (Checker)',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: true, APPROVER: false, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Verifikator & Checker',
    },
    {
      id: 'req_approve',
      name: 'Persetujuan Final (Approver)',
      roles: { SUPER_ADMIN: true, BENDAHARA: false, VERIFIKATOR: false, APPROVER: true, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Maker dilarang approve sendiri',
    },
    {
      id: 'req_disburse',
      name: 'Pencairan Kas/Bank (Disbursement)',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Segregation of duties',
    },
    {
      id: 'lpj_submit',
      name: 'Input LPJ & Realisasi',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: true, AUDITOR: false, VIEWER: false },
      note: 'Unit penerima dana',
    },
    {
      id: 'reports_view',
      name: 'Akses Laporan & Buku Besar',
      roles: { SUPER_ADMIN: true, BENDAHARA: true, VERIFIKATOR: true, APPROVER: true, PETUGAS_UNIT: false, AUDITOR: true, VIEWER: true },
      note: 'Read-only tersedia untuk Auditor',
    },
    {
      id: 'sys_config',
      name: 'Konfigurasi Sistem & Role',
      roles: { SUPER_ADMIN: true, BENDAHARA: false, VERIFIKATOR: false, APPROVER: false, PETUGAS_UNIT: false, AUDITOR: false, VIEWER: false },
      note: 'Khusus Super Administrator',
    },
  ];

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await authFetch('/api/audit-logs?limit=25');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setAuditLoading(false);
    }
  };

  const runPhase8Tests = async () => {
    setTestingRunning(true);
    setTestError(null);
    try {
      const res = await authFetch('/api/fase8/testing/run', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menjalankan pengujian TAHAP 8A');
      }
      const data = await res.json();
      setTestResults(data.results || []);
      setActiveTab('testing');
    } catch (e: any) {
      setTestError(e.message || 'Terjadi kesalahan saat menjalankan pengujian');
    } finally {
      setTestingRunning(false);
    }
  };

  const runPhase8BTests = async () => {
    setTestingRunning(true);
    setTestError(null);
    try {
      const res = await authFetch('/api/fase8b/testing/run', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menjalankan pengujian TAHAP 8B');
      }
      const data = await res.json();
      setTestResults(data.results || []);
      setActiveTab('testing');
    } catch (e: any) {
      setTestError(e.message || 'Terjadi kesalahan saat menjalankan pengujian');
    } finally {
      setTestingRunning(false);
    }
  };

  const runPhase8CTests = async () => {
    setTestingRunning(true);
    setTestError(null);
    try {
      const res = await authFetch('/api/fase8c/testing/run', { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menjalankan pengujian TAHAP 8C-8E');
      }
      const data = await res.json();
      setTestResults(data.results || []);
      setActiveTab('testing');
    } catch (e: any) {
      setTestError(e.message || 'Terjadi kesalahan saat menjalankan pengujian');
    } finally {
      setTestingRunning(false);
    }
  };

  const runAllPhase8Tests = async () => {
    setTestingRunning(true);
    setTestError(null);
    try {
      const [resA, resB, resC] = await Promise.all([
        authFetch('/api/fase8/testing/run', { method: 'POST' }),
        authFetch('/api/fase8b/testing/run', { method: 'POST' }),
        authFetch('/api/fase8c/testing/run', { method: 'POST' }),
      ]);
      const dataA = resA.ok ? await resA.json() : { results: [] };
      const dataB = resB.ok ? await resB.json() : { results: [] };
      const dataC = resC.ok ? await resC.json() : { results: [] };
      setTestResults([
        ...(dataA.results || []),
        ...(dataB.results || []),
        ...(dataC.results || []),
      ]);
      setActiveTab('testing');
    } catch (e: any) {
      setTestError(e.message || 'Terjadi kesalahan saat menjalankan pengujian');
    } finally {
      setTestingRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-900/20 bg-gradient-to-r from-emerald-900 to-teal-950 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Tahap 8A: Keamanan & Kontrol Internal
              </span>
              <span className="rounded-lg bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                Maker-Checker Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              Sistem Role, Least Privilege & Maker-Checker
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-3xl">
              Memastikan prinsip <strong>Segregation of Duties</strong> (pembuat tidak dapat menyetujui), batas otorisasi ketat di tingkat API/Backend, isolasi data unit kerja, serta proteksi Read-Only untuk Auditor dan Viewer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runPhase8Tests}
              disabled={testingRunning}
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-400/30 bg-emerald-800/80 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-700 transition"
            >
              <Play className={`h-3.5 w-3.5 ${testingRunning ? 'animate-spin' : ''}`} />
              <span>Uji 8A (Role & Maker)</span>
            </button>
            <button
              onClick={runPhase8BTests}
              disabled={testingRunning}
              className="flex items-center space-x-1.5 rounded-xl border border-teal-400/40 bg-teal-800/80 px-3 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-700 transition"
            >
              <Play className={`h-3.5 w-3.5 ${testingRunning ? 'animate-spin' : ''}`} />
              <span>Uji 8B (Audit & Proteksi)</span>
            </button>
            <button
              onClick={runPhase8CTests}
              disabled={testingRunning}
              className="flex items-center space-x-1.5 rounded-xl border border-indigo-400/40 bg-indigo-800/80 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-700 transition"
            >
              <Play className={`h-3.5 w-3.5 ${testingRunning ? 'animate-spin' : ''}`} />
              <span>Uji 8C-8E (Periode & Backup)</span>
            </button>
            <button
              onClick={runAllPhase8Tests}
              disabled={testingRunning}
              className="flex items-center space-x-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:bg-amber-300 transition"
            >
              <Play className={`h-4 w-4 ${testingRunning ? 'animate-spin' : ''}`} />
              <span>{testingRunning ? 'Menguji...' : 'Uji Lengkap (8A–8E)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active User Security Card & Role Simulator */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">{user?.displayName || 'Pengguna Aktif'}</span>
                <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                  {user?.roleName?.replace('_', ' ') || 'VIEWER'}
                </span>
                {user?.unitName && (
                  <span className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                    Unit: {user.unitName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Email: <span className="font-mono text-gray-700">{user?.email}</span> • User ID: <span className="font-mono font-bold text-gray-700">#{user?.id}</span>
              </p>
            </div>
          </div>

          {/* Quick Role Switcher Buttons */}
          <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Simulasi Otorisasi Role (Klik untuk Beralih):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((r) => {
                const isActive = user?.roleName === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => loginAsRole(r.key)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition flex items-center space-x-1 ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isActive && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'matrix'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          <span>Matriks Hak Akses (Least Privilege)</span>
        </button>

        <button
          onClick={() => setActiveTab('maker_checker')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'maker_checker'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Aturan Maker-Checker & Segregasi</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('testing');
            if (testResults.length === 0 && !testingRunning) runPhase8Tests();
          }}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'testing'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span>Pengujian Otomatis Keamanan 8A ({testResults.length ? `${testResults.filter(t => t.passed).length}/${testResults.length} Lolos` : 'Siap Diuji'})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 border-b-2 px-4 py-3 transition ${
            activeTab === 'audit'
              ? 'border-emerald-800 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Audit Log Otorisasi</span>
        </button>
      </div>

      {/* Tab 1: Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs overflow-x-auto">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-900">Matriks Hak Akses & Pembatasan Otorisasi (Least Privilege)</h2>
              <p className="text-xs text-gray-500">
                Seluruh aturan divalidasi langsung di backend API. Permintaan di luar izin akan ditolak dengan kode respon HTTP 403 Forbidden.
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-600">
                <tr>
                  <th className="p-3 w-1/4">Fungsi / Tindakan Sistem</th>
                  <th className="p-3 text-center">Super Admin</th>
                  <th className="p-3 text-center">Bendahara</th>
                  <th className="p-3 text-center">Verifikator</th>
                  <th className="p-3 text-center">Approver</th>
                  <th className="p-3 text-center">Petugas Unit</th>
                  <th className="p-3 text-center">Auditor</th>
                  <th className="p-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissionActions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50/70">
                    <td className="p-3">
                      <span className="font-semibold text-gray-900 block">{action.name}</span>
                      <span className="text-[10px] text-gray-400">{action.note}</span>
                    </td>
                    {(['SUPER_ADMIN', 'BENDAHARA', 'VERIFIKATOR', 'APPROVER', 'PETUGAS_UNIT', 'AUDITOR', 'VIEWER'] as const).map((rKey) => {
                      const isAllowed = action.roles[rKey];
                      return (
                        <td key={rKey} className="p-3 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold" title="Diizinkan">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-400 text-xs font-bold" title="Dilarang">
                              ✕
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Maker-Checker Details */}
      {activeTab === 'maker_checker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 text-emerald-900">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">1. Maker != Checker (Segregation of Duties)</h3>
                <p className="text-xs text-gray-500">Prinsip dasar pencegahan fraud keuangan</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-900 space-y-2">
              <p>
                <strong>Aturan:</strong> Pengguna yang membuat pengajuan dana (Maker) dilarang keras menyetujui (Approve) pengajuannya sendiri, meskipun pengguna tersebut berstatus Approver atau Super Administrator.
              </p>
              <p className="text-emerald-700">
                Enforcement dilakukan di database layer pada fungsi <code>updateFundRequestStatus()</code> dengan validasi <code>req.requesterId !== user.id</code>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 text-blue-900">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-800">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">2. Alur Tiga Tahap: Verifikasi, Approval, Pencairan</h3>
                <p className="text-xs text-gray-500">Pemisahan tugas berjenjang yang transparan</p>
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 space-y-2">
              <p>
                <strong>Tahap 1:</strong> Verifikator memeriksa kelengkapan berkas dan ketersediaan anggaran (Status: <code>DIPERIKSA</code>).
              </p>
              <p>
                <strong>Tahap 2:</strong> Approver / Pimpinan menyetujui nominal dan kebijakan (Status: <code>DISETUJUI</code>).
              </p>
              <p>
                <strong>Tahap 3:</strong> Bendahara melakukan pencairan dana fisik kas/bank dan menerbitkan jurnal (Status: <code>DICAIRKAN</code>).
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 text-amber-900">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">3. Isolasi Data Unit Kerja (Unit Scoping)</h3>
                <p className="text-xs text-gray-500">Least privilege pada unit organisasi</p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-2">
              <p>
                Pengguna dengan role <strong>Petugas Unit</strong> hanya dapat mengajukan usulan belanja untuk unitnya sendiri (berdasarkan <code>user.unitId</code>).
              </p>
              <p className="text-amber-800">
                Daftar query pengajuan dan LPJ otomatis difilter di server sesuai unit yang bersangkutan, mencegah kebocoran data antar-unit.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 text-purple-900">
              <div className="rounded-xl bg-purple-100 p-2.5 text-purple-800">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">4. Proteksi Ketat Read-Only (Auditor & Viewer)</h3>
                <p className="text-xs text-gray-500">Pencegahan manipulasi data keuangan</p>
              </div>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-purple-900 space-y-2">
              <p>
                Role <strong>Auditor</strong> dan <strong>Viewer</strong> diblokir total dari operasi penulisan, input transaksi, edit anggaran, maupun posting jurnal.
              </p>
              <p className="text-purple-800">
                Tetap diberikan transparansi penuh untuk membaca Buku Kas, Buku Bank, Buku Besar, Neraca, Laba Rugi, dan Audit Log.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Testing Runner */}
      {activeTab === 'testing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Automated Security & Maker-Checker Test Suite (Tahap 8A)</h2>
              <p className="text-xs text-gray-500">
                Menjalankan 8 pengujian otomatis terhadap aturan Maker-Checker, least-privilege, dan boundary enforcement.
              </p>
            </div>
            <button
              onClick={runPhase8Tests}
              disabled={testingRunning}
              className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${testingRunning ? 'animate-spin' : ''}`} />
              <span>{testingRunning ? 'Menjalankan...' : 'Uji Ulang Seluruh Kriteria'}</span>
            </button>
          </div>

          {testError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {testResults.length > 0 && (
            <div className="space-y-3">
              {testResults.map((t, idx) => (
                <div
                  key={t.id}
                  className={`rounded-2xl border p-4 shadow-xs transition ${
                    t.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      {t.passed ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{t.title}</h4>
                        <p className={`text-xs mt-1 ${t.passed ? 'text-emerald-800' : 'text-rose-800'}`}>
                          {t.message}
                        </p>
                        {t.details && (
                          <div className="mt-2 text-[11px] font-mono text-gray-500 bg-white/80 p-2 rounded-lg border border-gray-100">
                            {JSON.stringify(t.details)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.passed ? 'PASSED ✓' : 'FAILED ✕'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Riwayat Audit Trail & Tindakan Administratif</h2>
              <p className="text-xs text-gray-500">Semua perubahan role, kebijakan otorisasi, dan persetujuan dicatat permanen.</p>
            </div>
            <button
              onClick={fetchAuditLogs}
              disabled={auditLoading}
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`h-4 w-4 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase text-gray-600">
                <tr>
                  <th className="p-3">Waktu / Timestamp</th>
                  <th className="p-3">Pengguna / Aktor</th>
                  <th className="p-3 text-center">Aksi</th>
                  <th className="p-3">Entitas</th>
                  <th className="p-3">Keterangan / Detail Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      {auditLoading ? 'Memuat data audit...' : 'Belum ada log audit.'}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-900 block">{l.userName || 'System'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{l.userEmail}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 font-mono">
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-700">
                        {l.entityType || l.tableName || '-'} #{l.entityId || '-'}
                      </td>
                      <td className="p-3 text-gray-600 text-xs max-w-md">
                        {l.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
