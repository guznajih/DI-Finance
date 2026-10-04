import React, { useEffect, useState } from 'react';
import {
  Edit2,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account } from '../types/index.ts';

export const AccountsView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('ASET');
  const [subCategory, setSubCategory] = useState<string>('Kas');
  const [normalBalance, setNormalBalance] = useState<string>('DEBIT');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setCode('');
    setName('');
    setCategory('ASET');
    setSubCategory('Kas');
    setNormalBalance('DEBIT');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setCode(acc.code);
    setName(acc.name);
    setCategory(acc.category);
    setSubCategory(acc.subCategory);
    setNormalBalance(acc.normalBalance);
    setDescription(acc.description || '');
    setIsActive(acc.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat === 'ASET' || newCat === 'BEBAN') {
      setNormalBalance('DEBIT');
    } else {
      setNormalBalance('KREDIT');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      if (editingAccount) {
        const res = await authFetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            category,
            subCategory,
            normalBalance,
            description,
            isActive,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal memperbarui akun');
        }
      } else {
        const res = await authFetch('/api/accounts', {
          method: 'POST',
          body: JSON.stringify({
            code,
            name,
            category,
            subCategory,
            normalBalance,
            description,
            isActive,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Gagal menambah akun');
        }
      }
      setModalOpen(false);
      await fetchAccounts();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdminOrBendahara =
    user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  const filtered = accounts.filter((a) => {
    if (activeCategory !== 'SEMUA' && a.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = a.code.toLowerCase().includes(q);
      const matchName = a.name.toLowerCase().includes(q);
      const matchSub = a.subCategory.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchSub) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Bagan Akun (Chart of Accounts)
          </h1>
          <p className="text-xs text-gray-500">
            Struktur akun standar double-entry: Aset, Kewajiban, Dana Neto, Pendapatan, dan Beban
          </p>
        </div>

        {isSuperAdminOrBendahara && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Akun Baru</span>
          </button>
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['SEMUA', 'ASET', 'KEWAJIBAN', 'DANA', 'PENDAPATAN', 'BEBAN'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activeCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'DANA' ? 'DANA / ASET NETO' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs sm:w-64">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-5 py-3.5">Kode Akun</th>
              <th className="px-5 py-3.5">Nama Akun</th>
              <th className="px-5 py-3.5">Kelompok</th>
              <th className="px-5 py-3.5">Sub-Kategori</th>
              <th className="px-5 py-3.5 text-center">Saldo Normal</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              {isSuperAdminOrBendahara && <th className="px-5 py-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  Memuat data akun...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  Tidak ada akun ditemukan pada kategori ini.
                </td>
              </tr>
            ) : (
              filtered.map((acc) => (
                <tr key={acc.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-3 font-mono font-bold text-emerald-900">{acc.code}</td>
                  <td className="px-5 py-3 font-semibold text-gray-800">{acc.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        acc.category === 'ASET'
                          ? 'bg-blue-100 text-blue-800'
                          : acc.category === 'KEWAJIBAN'
                          ? 'bg-rose-100 text-rose-800'
                          : acc.category === 'DANA'
                          ? 'bg-purple-100 text-purple-800'
                          : acc.category === 'PENDAPATAN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {acc.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{acc.subCategory}</td>
                  <td className="px-5 py-3 text-center font-mono font-semibold">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        acc.normalBalance === 'DEBIT'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {acc.normalBalance}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        acc.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {acc.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  {isSuperAdminOrBendahara && (
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-emerald-800"
                        title="Edit Akun"
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
                {editingAccount ? 'Edit Akun COA' : 'Tambah Akun COA Baru'}
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
                <label className="block font-semibold text-gray-700">Kode Akun</label>
                <input
                  type="text"
                  required
                  disabled={!!editingAccount}
                  placeholder="Contoh: 1115, 5215"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-gray-800 focus:border-emerald-600 focus:outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Nama Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Dapur Santri, Beban Perawatan Asrama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700">Kelompok</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="ASET">ASET</option>
                    <option value="KEWAJIBAN">KEWAJIBAN</option>
                    <option value="DANA">DANA / ASET NETO</option>
                    <option value="PENDAPATAN">PENDAPATAN</option>
                    <option value="BEBAN">BEBAN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Saldo Normal</label>
                  <select
                    value={normalBalance}
                    onChange={(e) => setNormalBalance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="KREDIT">KREDIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Sub-Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas, Bank, Utilitas, SDM, dll"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700">Keterangan Akun</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan akun..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="accActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-700"
                />
                <label htmlFor="accActive" className="font-medium text-gray-700 cursor-pointer">
                  Akun aktif digunakan dalam transaksi
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
                  {saving ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
