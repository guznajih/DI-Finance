import React, { useEffect, useState } from 'react';
import {
  Coins,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Fund } from '../types/index.ts';

export const FundsView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);

  // Form states
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('tidak_terikat');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchFunds = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/funds');
      if (res.ok) {
        setFunds(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  const openCreateModal = () => {
    setEditingFund(null);
    setCode('');
    setName('');
    setType('tidak_terikat');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (f: Fund) => {
    setEditingFund(f);
    setCode(f.code);
    setName(f.name);
    setType(f.type);
    setDescription(f.description || '');
    setIsActive(f.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingFund) {
        const res = await authFetch(`/api/funds/${editingFund.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, type, description, isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal memperbarui sumber dana');
        }
      } else {
        const res = await authFetch('/api/funds', {
          method: 'POST',
          body: JSON.stringify({ code: code.toUpperCase(), name, type, description, isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambah sumber dana');
        }
      }
      setModalOpen(false);
      await fetchFunds();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdminOrBendahara =
    user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Master Sumber Dana</h1>
          <p className="text-xs text-gray-500">
            Klasifikasi dana operasional, pembangunan, wakaf, infak, sedekah, beasiswa, dan hibah
          </p>
        </div>

        {isSuperAdminOrBendahara && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Sumber Dana</span>
          </button>
        )}
      </div>

      {/* Funds Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3.5">Kode Dana</th>
              <th className="px-5 py-3.5">Nama Sumber Dana</th>
              <th className="px-5 py-3.5">Jenis Dana</th>
              <th className="px-5 py-3.5">Keterangan</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              {isSuperAdminOrBendahara && <th className="px-5 py-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Memuat data sumber dana...
                </td>
              </tr>
            ) : funds.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Belum ada sumber dana terdaftar.
                </td>
              </tr>
            ) : (
              funds.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3 font-mono font-bold text-emerald-900">{f.code}</td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{f.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        f.type === 'terikat'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {f.type === 'terikat' ? 'Dana Terikat' : 'Tidak Terikat'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{f.description || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        f.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  {isSuperAdminOrBendahara && (
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEditModal(f)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-800"
                        title="Edit Sumber Dana"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingFund ? 'Edit Sumber Dana' : 'Tambah Sumber Dana Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              {formError && (
                <div className="rounded-lg bg-rose-50 p-2 text-rose-700">{formError}</div>
              )}

              <div>
                <label className="block font-semibold text-gray-700">Kode Sumber Dana</label>
                <input
                  type="text"
                  required
                  disabled={!!editingFund}
                  placeholder="Contoh: DOP, DPB, WKF, INF"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 uppercase font-mono text-gray-800 focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Nama Sumber Dana</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Wakaf Tunai, Donasi Khusus"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Jenis Dana</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="tidak_terikat">Dana Tidak Terikat (Bebas Peruntukan)</option>
                  <option value="terikat">Dana Terikat (Khusus Syarat/Akad Donatur)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan atau akad dana..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="fundActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="fundActive" className="font-medium text-gray-700 cursor-pointer">
                  Sumber dana aktif digunakan
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
                  {saving ? 'Menyimpan...' : 'Simpan Sumber Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
