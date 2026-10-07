import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  FileText,
  FileCheck,
  RefreshCw,
  Lock,
  X,
  Play,
  Layers,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface BackupSnapshotMeta {
  id: string;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  recordCounts: Record<string, number>;
  totalRecords: number;
  createdByName: string;
  createdByEmail: string;
}

interface BackupStatusResponse {
  lastBackup: string | null;
  backupStatus: string;
  backupSize: string;
  backupFrequency: string;
  lastRestoreTest: string;
  restoreTestStatus: string;
  restoreSafetyPolicy: string;
  restoreChecklist: Array<{ item: string; status: string }>;
  snapshots: BackupSnapshotMeta[];
}

export const BackupRecoveryView: React.FC = () => {
  const { user, authFetch } = useAuth();
  const [status, setStatus] = useState<BackupStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Verification dry run modal
  const [verifyModalOpen, setVerifyModalOpen] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const userRole = (user?.roleName || (user as any)?.role || '').toUpperCase();
  const isAuthorized = userRole === 'SUPER_ADMIN' || userRole === 'BENDAHARA';

  const fetchBackupStatus = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/backup/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to load backup status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    setErrorMessage(null);
    try {
      const res = await authFetch('/api/backup/generate', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat backup');
      }

      setActionMessage(
        `Backup ${data.backup?.id} berhasil dibuat (${data.backup?.sizeFormatted}, ${data.backup?.totalRecords} baris data). Hash SHA-256 tersimpan aman.`
      );
      setConfirmModalOpen(false);
      fetchBackupStatus();

      setTimeout(() => {
        setActionMessage(null);
      }, 6000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses backup');
    } finally {
      setCreating(false);
    }
  };

  const handleVerifySnapshot = async (snapshotId: string) => {
    setVerifying(true);
    setVerifyResult(null);
    setVerifyModalOpen(true);
    try {
      const res = await authFetch(`/api/backup/verify/${snapshotId}`, {
        method: 'POST',
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({
        isValid: false,
        message: err.message || 'Verifikasi snapshot gagal',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Tahap 8D–8E — Cadangan & Pemulihan
            </span>
            <span className="text-xs text-gray-500">Integritas Data & Kebijakan Restore</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Backup & Recovery Database
          </h1>
          <p className="text-sm text-gray-600">
            Pencadangan seluruh data keuangan pesantren (COA, jurnal, transaksi, anggaran, LPJ, investasi, dan jejak audit) secara terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfirmModalOpen(true)}
            disabled={!isAuthorized || creating}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {creating ? 'Memproses Cadangan...' : 'Buat Cadangan Baru (Snapshot)'}
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {actionMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cadangan Terakhir</p>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-lg font-bold text-gray-900">
            {status?.lastBackup
              ? new Date(status.lastBackup).toLocaleDateString('id-ID', { dateStyle: 'medium' })
              : 'Belum Ada'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {status?.lastBackup
              ? new Date(status.lastBackup).toLocaleTimeString('id-ID', { timeStyle: 'short' })
              : 'Sistem siap membuat backup'}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Status Backup</p>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-950">
            {status?.backupStatus || 'READY'}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Ukuran file aktif: {status?.backupSize || '0 KB'}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Frekuensi Backup</p>
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-base font-bold text-gray-900">Harian & On-Demand</p>
          <p className="mt-1 text-xs text-gray-500">Snapshot manual & berkala</p>
        </div>

        {/* RESTORE TEST: MANDATORY "NOT YET TESTED" */}
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Uji Coba Pemulihan</p>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-sm font-bold text-amber-950">
            RESTORE TEST: NOT YET TESTED
          </p>
          <p className="mt-1 text-[11px] text-amber-800">
            Membutuhkan isolated staging environment untuk pengujian aman
          </p>
        </div>
      </div>

      {/* Restore Safety Checklist Policy */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-blue-950">
              Dokumentasi & Checklist Keamanan Pemulihan (Restore Safety Checklist):
            </h3>
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Prinsip Kritis Keamanan Database:</strong> Restore database production{' '}
              <strong>DILARANG DILAKUKAN SECARA OTOMATIS</strong> demi mencegah insiden penimpaan data transaksi aktif (overwriting). Sebelum melakukan pemulihan, tim administrator wajib memastikan seluruh checklist berikut terpenuhi:
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1 text-xs">
              {status?.restoreChecklist.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded bg-white/80 p-2 border border-blue-200/60 text-blue-950"
                >
                  {c.status === 'READY' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                  <span className="font-medium text-[11px]">{c.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Riwayat Berkas Cadangan (Backup Snapshots)
          </h2>
          <span className="text-xs text-gray-500">
            Tersimpan di storage lokal terenkripsi server
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Memeriksa indeks backup...</span>
          </div>
        ) : !status?.snapshots || status.snapshots.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Belum ada berkas cadangan database. Klik tombol "Buat Cadangan Baru" di atas untuk mencadangkan sistem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="border-b border-gray-100 bg-gray-50/75 text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-6 py-3.5">ID Snapshot & Berkas</th>
                  <th className="px-4 py-3.5">Waktu Dibuat</th>
                  <th className="px-4 py-3.5">Ukuran</th>
                  <th className="px-4 py-3.5">Total Baris Data</th>
                  <th className="px-4 py-3.5">Dibuat Oleh</th>
                  <th className="px-4 py-3.5 font-mono">SHA-256 Checksum</th>
                  <th className="px-6 py-3.5 text-right">Aksi Keamanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {status.snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{snap.id}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{snap.filename}</div>
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(snap.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      <div className="text-[11px] text-gray-400">
                        {new Date(snap.timestamp).toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-gray-900">
                      {snap.sizeFormatted}
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-700">
                      <span className="font-bold text-gray-900">{snap.totalRecords.toLocaleString('id-ID')}</span> baris
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-600">
                      <div className="font-medium text-gray-900">{snap.createdByName}</div>
                      <div className="text-[11px] text-gray-400">{snap.createdByEmail}</div>
                    </td>

                    <td className="px-4 py-4 text-xs font-mono text-gray-500">
                      {snap.sha256.substring(0, 16)}...
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleVerifySnapshot(snap.id)}
                          className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50"
                          title="Uji integritas berkas tanpa mengubah database"
                        >
                          <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                          Uji Verifikasi
                        </button>

                        <a
                          href={`/api/backup/download/${snap.filename}`}
                          download
                          className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100"
                        >
                          <Download className="h-3.5 w-3.5 text-emerald-600" />
                          Unduh JSON
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal Before Backup Generation */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Konfirmasi Pembuatan Cadangan</h3>
                <p className="text-xs text-gray-500">Pencadangan snapshot database lengkap</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-gray-600">
              <p>
                Sistem akan mengekspor seluruh master data, bagan akun (COA), buku kas & bank, jurnal double-entry, transaksi, anggaran, pengajuan dana, LPJ, investasi, dan riwayat audit trail.
              </p>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-[11px] text-gray-700 space-y-1 font-mono">
                <div>• Format: Arsip JSON Terstruktur</div>
                <div>• Integritas: Hash SHA-256 Checksum</div>
                <div>• Keamanan: Jejak Audit & Security Event otomatis</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={creating}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={creating}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
              >
                {creating ? 'Mengekspor Data...' : 'Mulai Pencadangan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dry-Run Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Uji Verifikasi Integritas Snapshot</h3>
                  <p className="text-xs text-gray-500">Pemeriksaan integritas tanpa menyentuh live database</p>
                </div>
              </div>
              <button onClick={() => setVerifyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {verifying ? (
                <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  <span>Memverifikasi hash SHA-256 dan keseimbangan jurnal snapshot...</span>
                </div>
              ) : verifyResult ? (
                <div className="space-y-3">
                  <div
                    className={`rounded-lg p-3 text-xs border ${
                      verifyResult.isValid
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-rose-200 bg-rose-50 text-rose-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {verifyResult.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                      )}
                      {verifyResult.isValid ? 'Integritas Berkas Valid (PASS)' : 'Gagal Verifikasi (FAIL)'}
                    </div>
                    <p className="mt-1">{verifyResult.message}</p>
                  </div>

                  {verifyResult.journalCheck && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs space-y-1.5">
                      <div className="font-semibold text-gray-800">Pemeriksaan Jurnal Double-Entry Snapshot:</div>
                      <div className="grid grid-cols-2 gap-2 text-gray-700 font-mono text-[11px]">
                        <div>Debit: Rp {verifyResult.journalCheck.totalDebit.toLocaleString('id-ID')}</div>
                        <div>Kredit: Rp {verifyResult.journalCheck.totalCredit.toLocaleString('id-ID')}</div>
                      </div>
                      <div className="text-emerald-700 font-semibold text-[11px]">
                        {verifyResult.journalCheck.isBalanced ? '✓ Double-Entry Seimbang Sempurna' : '✕ Ada Selisih Jurnal'}
                      </div>
                    </div>
                  )}

                  {verifyResult.sha256 && (
                    <div className="text-[11px] font-mono text-gray-500 break-all bg-gray-100 p-2 rounded">
                      SHA-256: {verifyResult.sha256}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
