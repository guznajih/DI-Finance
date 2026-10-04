import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Edit2,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoleName, Unit, User } from '../types/index.ts';

export const UsersView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Edit form states
  const [roleId, setRoleId] = useState<number>(1);
  const [unitId, setUnitId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchUsersAndUnits = async () => {
    setLoading(true);
    try {
      const [uRes, unitRes] = await Promise.all([
        authFetch('/api/users'),
        authFetch('/api/units'),
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndUnits();
  }, []);

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setRoleId(u.roleId || 1);
    setUnitId(u.unitId ? String(u.unitId) : '');
    setIsActive(u.isActive);
    setModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          roleId,
          unitId: unitId ? parseInt(unitId, 10) : null,
          isActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah peran pengguna');
      }

      setModalOpen(false);
      await fetchUsersAndUnits();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.roleName === 'SUPER_ADMIN';

  const roleMap: Record<number, string> = {
    1: 'SUPER_ADMIN',
    2: 'PIMPINAN',
    3: 'BENDAHARA',
    4: 'PETUGAS_KEUANGAN',
    5: 'UNIT',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Manajemen Pengguna & Otoritas Role
          </h1>
          <p className="text-xs text-gray-500">
            Penetapan peran dan hak akses: Super Admin, Pimpinan, Bendahara, Petugas Keuangan, dan Unit/Divisi
          </p>
        </div>

        <button
          onClick={fetchUsersAndUnits}
          className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { title: 'SUPER ADMIN', desc: 'Akses tak terbatas ke seluruh modul dan pengaturan' },
          { title: 'PIMPINAN', desc: 'Pengasuh & Kyai: Tinjauan laporan dan audit trail' },
          { title: 'BENDAHARA', desc: 'Posting jurnal, kelola rekening kas/bank dan buku besar' },
          { title: 'PETUGAS KEUANGAN', desc: 'Kasir harian: Input draft transaksi penerimaan/pengeluaran' },
          { title: 'UNIT / DIVISI', desc: 'Pengurus dapur, madrasah, sarpras: input pengajuan kasbon/belanja' },
        ].map((r, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800">{r.title}</span>
            <p className="mt-1 text-[11px] text-gray-500 leading-snug">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3.5">Nama & Email</th>
              <th className="px-5 py-3.5">Peran / Role</th>
              <th className="px-5 py-3.5">Unit Terkait</th>
              <th className="px-5 py-3.5">Login Terakhir</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              {isSuperAdmin && <th className="px-5 py-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Belum ada pengguna terdaftar.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-gray-900">{u.displayName || 'Staff Pondok'}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold ${
                        u.roleName === 'SUPER_ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : u.roleName === 'BENDAHARA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.roleName === 'PIMPINAN'
                          ? 'bg-amber-100 text-amber-800'
                          : u.roleName === 'PETUGAS_KEUANGAN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {u.roleName?.replace('_', ' ') || 'Belum Ditentukan'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.unitName || 'Semua Unit'}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-[11px]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        u.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-800"
                        title="Edit Peran Pengguna"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Role Modal */}
      {modalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Ubah Peran & Unit Pengguna
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3 text-xs">
              <div className="rounded-lg bg-gray-50 p-2.5">
                <p className="font-semibold text-gray-800">{selectedUser.displayName}</p>
                <p className="text-[11px] text-gray-500">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Peran / Role Pengguna</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                >
                  <option value={1}>SUPER ADMIN (Akses Penuh)</option>
                  <option value={2}>PIMPINAN (Tinjauan & Monitoring)</option>
                  <option value={3}>BENDAHARA (Posting Jurnal & Kas/Bank)</option>
                  <option value={4}>PETUGAS KEUANGAN (Input Draft Transaksi)</option>
                  <option value={5}>UNIT / DIVISI (Pengajuan Transaksi Unit)</option>
                </select>
              </div>

              {roleId === 5 && (
                <div>
                  <label className="block font-semibold text-gray-700">Pilih Unit Terkait</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Pilih Unit --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="userActive" className="font-medium text-gray-700 cursor-pointer">
                  Status akun aktif
                </label>
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-800 px-5 py-2 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:bg-gray-300"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
