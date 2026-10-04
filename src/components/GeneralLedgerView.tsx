import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, GeneralLedgerData } from '../types/index.ts';

export const GeneralLedgerView: React.FC = () => {
  const { authFetch } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<GeneralLedgerData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(true);

  // Fetch accounts list
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await authFetch('/api/accounts');
        if (res.ok) {
          const data: Account[] = await res.json();
          setAccounts(data);
          if (data.length > 0) {
            setSelectedAccountId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch Ledger when account or date changes
  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('accountId', String(selectedAccountId));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await authFetch(`/api/ledger?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLedgerData(data);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger();
    }
  }, [selectedAccountId, startDate, endDate]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Buku Besar (General Ledger)
          </h1>
          <p className="text-xs text-gray-500">
            Catatan mutasi per akun, saldo awal, mutasi debit/kredit, dan saldo berjalan
          </p>
        </div>

        <button
          onClick={fetchLedger}
          className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Account Selector & Date Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            PILIH AKUN BUKU BESAR
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(parseInt(e.target.value, 10))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-medium text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.code}] {a.name} ({a.category} • Normal: {a.normalBalance})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            PERIODE DARI
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            SAMPAI DENGAN
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Account Summary Card */}
      {ledgerData && ledgerData.account && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Saldo Awal Periode</span>
            <p className="mt-1 text-lg font-bold text-gray-900 font-mono">
              {formatRupiah(ledgerData.openingBalance)}
            </p>
            <span className="text-[11px] text-gray-400">
              Saldo sebelum {startDate || 'transaksi pertama'}
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Kategori & Saldo Normal</span>
            <p className="mt-1 text-base font-bold text-emerald-800">
              {ledgerData.account.category} • {ledgerData.account.normalBalance}
            </p>
            <span className="text-[11px] text-gray-400">
              Sub: {ledgerData.account.subCategory}
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Saldo Akhir Berjalan</span>
            <p className="mt-1 text-lg font-bold text-emerald-900 font-mono">
              {formatRupiah(ledgerData.endingBalance)}
            </p>
            <span className="text-[11px] text-gray-400">
              Total posisi akun per saat ini
            </span>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">No. Jurnal</th>
                <th className="px-4 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5">Unit / Sumber</th>
                <th className="px-4 py-3.5 text-right">Debit (Rp)</th>
                <th className="px-4 py-3.5 text-right">Kredit (Rp)</th>
                <th className="px-4 py-3.5 text-right">Saldo Berjalan (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-sans text-gray-400">
                    Memuat data buku besar...
                  </td>
                </tr>
              ) : !ledgerData || ledgerData.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center font-sans text-gray-400">
                    Tidak ada mutasi transaksi untuk akun ini pada periode yang dipilih.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-2.5 font-sans text-gray-600 whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-emerald-800 whitespace-nowrap">
                      {entry.journalNumber}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-gray-800 max-w-sm truncate">
                      {entry.description}
                    </td>
                    <td className="px-4 py-2.5 font-sans text-gray-500 whitespace-nowrap">
                      {entry.unitName || entry.fundName || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900">
                      {Number(entry.debit) > 0 ? formatRupiah(entry.debit) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900">
                      {Number(entry.credit) > 0 ? formatRupiah(entry.credit) : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-950">
                      {formatRupiah(entry.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
