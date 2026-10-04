import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Landmark,
  Plus,
  RefreshCw,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, BankAccount, CashAccount, Unit } from '../types/index.ts';

export const CashBankView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'KAS' | 'BANK'>('KAS');
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [bankList, setBankList] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Kas form state
  const [cashName, setCashName] = useState<string>('');
  const [cashAccountId, setCashAccountId] = useState<number>(0);
  const [cashUnitId, setCashUnitId] = useState<string>('');
  const [cashInitialBalance, setCashInitialBalance] = useState<string>('0');

  // Bank form state
  const [bankAccountName, setBankAccountName] = useState<string>('');
  const [bankName, setBankName] = useState<string>('Bank Syariah Indonesia (BSI)');
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<number>(0);
  const [bankInitialBalance, setBankInitialBalance] = useState<string>('0');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes, aRes, uRes] = await Promise.all([
        authFetch('/api/cash-accounts'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/accounts'),
        authFetch('/api/units'),
      ]);

      if (cRes.ok) setCashList(await cRes.json());
      if (bRes.ok) setBankList(await bRes.json());
      if (aRes.ok) {
        const accs: Account[] = await aRes.json();
        setAccounts(accs);
        const kasAcc = accs.find((a) => a.code === '1110');
        const bnkAcc = accs.find((a) => a.code === '1120');
        if (kasAcc) setCashAccountId(kasAcc.id);
        if (bnkAcc) setBankAccountId(bnkAcc.id);
      }
      if (uRes.ok) setUnits(await uRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormError(null);
    setCashName('');
    setCashInitialBalance('0');
    setBankAccountName('Pondok Pesantren Darul Istiqomah');
    setBankAccountNumber('');
    setBankInitialBalance('0');
    setModalOpen(true);
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await authFetch('/api/cash-accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: cashName,
          accountId: cashAccountId,
          unitId: cashUnitId ? parseInt(cashUnitId, 10) : null,
          initialBalance: cashInitialBalance,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat rekening kas');
      }
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const res = await authFetch('/api/bank-accounts', {
        method: 'POST',
        body: JSON.stringify({
          accountId: bankAccountId,
          accountName: bankAccountName,
          bankName,
          accountNumber: bankAccountNumber,
          initialBalance: bankInitialBalance,
          isActive: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal membuat rekening bank');
      }
      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const isSuperAdminOrBendahara =
    user?.roleName === 'SUPER_ADMIN' || user?.roleName === 'BENDAHARA';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Master Kas & Rekening Bank
          </h1>
          <p className="text-xs text-gray-500">
            Pengelolaan buku kas fisik bendahara/unit dan rekening perbankan pesantren
          </p>
        </div>

        {isSuperAdminOrBendahara && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah {activeTab === 'KAS' ? 'Kas Tunai' : 'Rekening Bank'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('KAS')}
          className={`flex items-center space-x-2 border-b-2 py-3 px-5 text-xs font-bold transition ${
            activeTab === 'KAS'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Kas Tunai ({cashList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BANK')}
          className={`flex items-center space-x-2 border-b-2 py-3 px-5 text-xs font-bold transition ${
            activeTab === 'BANK'
              ? 'border-emerald-800 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Rekening Bank ({bankList.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'KAS' ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Nama Kas Tunai</th>
                <th className="px-5 py-3.5">Akun COA</th>
                <th className="px-5 py-3.5">Unit Terkait</th>
                <th className="px-5 py-3.5 text-right">Saldo Awal</th>
                <th className="px-5 py-3.5 text-right">Saldo Saat Ini</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Memuat data kas...
                  </td>
                </tr>
              ) : cashList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Belum ada kas tunai terdaftar.
                  </td>
                </tr>
              ) : (
                cashList.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">
                      [{c.accountCode}] {c.accountName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.unitName || 'Pusat Pondok'}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-500">
                      {formatRupiah(c.initialBalance)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-900">
                      {formatRupiah(c.currentBalance)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {c.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-5 py-3.5">Bank</th>
                <th className="px-5 py-3.5">No. Rekening</th>
                <th className="px-5 py-3.5">Atas Nama</th>
                <th className="px-5 py-3.5">Akun COA</th>
                <th className="px-5 py-3.5 text-right">Saldo Awal</th>
                <th className="px-5 py-3.5 text-right">Saldo Saat Ini</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Memuat data rekening bank...
                  </td>
                </tr>
              ) : bankList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Belum ada rekening bank terdaftar.
                  </td>
                </tr>
              ) : (
                bankList.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-3 font-semibold text-gray-900">{b.bankName}</td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-800">
                      {b.accountNumber}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{b.accountName}</td>
                    <td className="px-5 py-3 font-mono text-gray-500">
                      [{b.accountCode}] {b.coaAccountName}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-500">
                      {formatRupiah(b.initialBalance)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-900">
                      {formatRupiah(b.currentBalance)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {b.isActive ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {activeTab === 'KAS' ? 'Tambah Kas Tunai Baru' : 'Tambah Rekening Bank Baru'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeTab === 'KAS' ? (
              <form onSubmit={handleCashSubmit} className="mt-4 space-y-3 text-xs">
                {formError && (
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-700">{formError}</div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700">Nama Kas Tunai</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kas Kecil Bendahara, Kas Dapur"
                    value={cashName}
                    onChange={(e) => setCashName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Akun Bagan (COA)</label>
                  <select
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {accounts
                      .filter((a) => a.category === 'ASET')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Unit / Divisi</label>
                  <select
                    value={cashUnitId}
                    onChange={(e) => setCashUnitId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Pusat Pondok (Umum) --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cashInitialBalance}
                    onChange={(e) => setCashInitialBalance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
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
                    {saving ? 'Menyimpan...' : 'Simpan Kas'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBankSubmit} className="mt-4 space-y-3 text-xs">
                {formError && (
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-700">{formError}</div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700">Nama Bank</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bank Syariah Indonesia (BSI), Bank Muamalat"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 7123456789"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Atas Nama Rekening</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pondok Pesantren Darul Istiqomah"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Akun Bagan (COA)</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-gray-800 focus:border-emerald-600 focus:outline-none"
                  >
                    {accounts
                      .filter((a) => a.category === 'ASET')
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.code}] {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={bankInitialBalance}
                    onChange={(e) => setBankInitialBalance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 font-mono text-gray-800 focus:border-emerald-600 focus:outline-none"
                  />
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
                    {saving ? 'Menyimpan...' : 'Simpan Rekening Bank'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
