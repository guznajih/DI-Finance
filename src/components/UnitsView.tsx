import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit2,
  Network,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Unit } from '../types/index.ts';

export const UnitsView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Form states
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/units');
      if (res.ok) {
        setUnits(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const openCreateModal = () => {
    setEditingUnit(null);
    setCode('');
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setCode(unit.code);
    setName(unit.name);
    setDescription(unit.description || '');
    setIsActive(unit.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingUnit) {
        // Update
        const res = await authFetch(`/api/units/${editingUnit.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description, isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal memperbarui unit');
        }
      } else {
        // Create
        const res = await authFetch('/api/units', {
          method: 'POST',
          body: JSON.stringify({ code: code.toUpperCase(), name, description, isActive }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambah unit');
        }
      }
      setModalOpen(false);
      await fetchUnits();
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
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Master Unit / Divisi</h1>
          <p className="text-xs text-gray-500">
            Unit operasional pesantren (Madrasah, Kesantrean, Sarpras, Dapur, Kesehatan, dll)
          </p>
        </div>

        {isSuperAdminOrBendahara && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Unit / Divisi</span>
          </button>
        )}
      </div>

      {/* Units Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3.5">Kode Unit</th>
              <th className="px-5 py-3.5">Nama Unit / Divisi</th>
              <th className="px-5 py-3.5">Keterangan</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              {isSuperAdminOrBendahara && <th className="px-5 py-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Memuat data unit...
                </td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  Belum ada unit terdaftar.
                </td>
              </tr>
            ) : (
              units.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3 font-mono font-bold text-emerald-900">{u.code}</td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{u.name}</td>
                  <td className="px-5 py-3 text-gray-500">{u.description || '-'}</td>
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
                  {isSuperAdminOrBendahara && (
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-800"
                        title="Edit Unit"
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
                {editingUnit ? 'Edit Unit / Divisi' : 'Tambah Unit / Divisi Baru'}
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
                <label className="block font-semibold text-gray-700">Kode Unit</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUnit}
                  placeholder="Contoh: DPR, MDR, SARPRAS"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 uppercase font-mono text-gray-800 focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Nama Unit / Divisi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dapur Santri, Sarana Prasarana"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan unit tugas operasional..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="unitActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="unitActive" className="font-medium text-gray-700 cursor-pointer">
                  Unit aktif untuk transaksi
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
                  {saving ? 'Menyimpan...' : 'Simpan Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
