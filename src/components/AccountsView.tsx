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
            className="flex items-center space-x-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Akun Baru</span>
          </button>
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['SEMUA', 'ASET', 'KEWAJIBAN', 'DANA', 'PENDAPATAN', 'BEBAN'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                activeCategory === cat
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat === 'DANA' ? 'DANA / ASET NETO' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs sm:w-72">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari kode atau nama akun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Accounts Table with Hierarchical Grouping & Indentation */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-5 py-3.5">Kode Akun</th>
              <th className="px-5 py-3.5">Nama Akun & Klasifikasi</th>
              <th className="px-5 py-3.5">Kelompok</th>
              <th className="px-5 py-3.5">Sub-Kategori</th>
              <th className="px-5 py-3.5 text-center">Saldo Normal</th>
              <th className="px-5 py-3.5 text-center">Status</th>
              {isSuperAdminOrBendahara && <th className="px-5 py-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Memuat bagan akun pesantren...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Tidak ada akun ditemukan pada filter ini.
                </td>
              </tr>
            ) : (
              (() => {
                // Group accounts by Category + SubCategory for crystal clear visual presentation
                let lastGroup = '';
                return filtered.map((acc) => {
                  const currentGroup = `${acc.category} — ${acc.subCategory}`;
                  const isNewGroup = currentGroup !== lastGroup && !searchQuery;
                  if (isNewGroup) {
                    lastGroup = currentGroup;
                  }

                  return (
                    <React.Fragment key={acc.id}>
                      {isNewGroup && (
                        <tr className="bg-slate-50/90 border-t border-slate-200">
                          <td colSpan={7} className="px-5 py-2">
                            <div className="flex items-center space-x-2">
                              <FolderTree className="h-3.5 w-3.5 text-teal-700" />
                              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                                {acc.subCategory}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({acc.category})
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3 font-mono font-bold text-teal-800">
                          <span className="inline-block rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-900 border border-teal-100">
                            {acc.code}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center space-x-2">
                            {/* Visual tree indentation connector */}
                            <span className="text-slate-300 font-mono select-none">└─</span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {acc.name}
                            </span>
                          </div>
                          {acc.description && (
                            <p className="text-[10.5px] text-slate-400 pl-5 mt-0.5">
                              {acc.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold border ${
                              acc.category === 'ASET'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : acc.category === 'KEWAJIBAN'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : acc.category === 'DANA'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : acc.category === 'PENDAPATAN'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {acc.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-medium">{acc.subCategory}</td>
                        <td className="px-5 py-3 text-center font-mono">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                              acc.normalBalance === 'DEBIT'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {acc.normalBalance}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              acc.isActive
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {acc.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        {isSuperAdminOrBendahara && (
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => openEditModal(acc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-800 transition"
                              title="Edit Akun"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    </React.Fragment>
                  );
                });
              })()
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
                <label className="block font-semibold text-slate-700">Kode Akun</label>
                <input
                  type="text"
                  required
                  disabled={!!editingAccount}
                  placeholder="Contoh: 1115, 5215"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-mono text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Nama Akun</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Dapur Santri, Beban Perawatan Asrama"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700">Kelompok</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="ASET">ASET</option>
                    <option value="KEWAJIBAN">KEWAJIBAN</option>
                    <option value="DANA">DANA / ASET NETO</option>
                    <option value="PENDAPATAN">PENDAPATAN</option>
                    <option value="BEBAN">BEBAN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Saldo Normal</label>
                  <select
                    value={normalBalance}
                    onChange={(e) => setNormalBalance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-teal-600 focus:outline-none"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="KREDIT">KREDIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Sub-Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas, Bank, Utilitas, SDM, dll"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Keterangan Akun</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan akun..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="accActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <label htmlFor="accActive" className="font-medium text-slate-700 cursor-pointer">
                  Akun aktif digunakan dalam transaksi
                </label>
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-700 px-5 py-2 font-bold text-white shadow-2xs hover:bg-teal-800 disabled:bg-slate-300 transition"
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
