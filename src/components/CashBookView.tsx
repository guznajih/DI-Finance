import React, { useEffect, useState } from 'react';
import {
  Download,
  Filter,
  Printer,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { CashAccount, CashBookData } from '../types/index.ts';

export const CashBookView: React.FC = () => {
  const { authFetch } = useAuth();
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [selectedCashId, setSelectedCashId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [data, setData] = useState<CashBookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCashAccounts = async () => {
      try {
        const res = await authFetch('/api/cash-accounts');
        if (res.ok) {
          const list: CashAccount[] = await res.json();
          setCashList(list);
          if (list.length > 0) setSelectedCashId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCashAccounts();
  }, []);

  const fetchBook = async () => {
    if (!selectedCashId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('cashAccountId', String(selectedCashId));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await authFetch(`/api/cash-book?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCashId) fetchBook();
  }, [selectedCashId, startDate, endDate]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Tanggal', 'No. Referensi', 'Keterangan', 'Penerimaan', 'Pengeluaran', 'Saldo'];
    const rows = data.entries.map((e) => [
      `"${e.date}"`,
      `"${e.transactionNumber}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.penerimaan,
      e.pengeluaran,
      e.runningBalance,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Kas_${data.cashAccount.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <Wallet className="h-4 w-4" />
            <span>KEUANGAN → BUKU KAS</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Buku Kas (Cash Book)
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan mutasi kas fisik, saldo awal, penerimaan, pengeluaran, dan saldo berjalan otomatis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={!data || data.entries.length === 0}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Select Kas & Date Range */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">PILIH REKENING KAS</label>
          <select
            value={selectedCashId}
            onChange={(e) => setSelectedCashId(parseInt(e.target.value, 10))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            {cashList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({formatRupiah(c.currentBalance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">PERIODE DARI</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">SAMPAI DENGAN</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchBook}
          className="self-end rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100"
          title="Muat Ulang"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Saldo Awal Periode</span>
            <p className="mt-1 font-mono text-lg font-bold text-gray-900">
              {formatRupiah(data.openingBalance)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Total Penerimaan (+)</span>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-700">
              +{formatRupiah(data.totalPenerimaan)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Total Pengeluaran (-)</span>
            <p className="mt-1 font-mono text-lg font-bold text-rose-700">
              -{formatRupiah(data.totalPengeluaran)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-xs text-gray-500">Saldo Akhir Kas</span>
            <p className="mt-1 font-mono text-lg font-bold text-emerald-950">
              {formatRupiah(data.endingBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-4 py-3.5">Tanggal</th>
              <th className="px-4 py-3.5">No. Transaksi</th>
              <th className="px-4 py-3.5">Keterangan Transaksi</th>
              <th className="px-4 py-3.5">Unit / Sumber</th>
              <th className="px-4 py-3.5 text-right">Penerimaan (Rp)</th>
              <th className="px-4 py-3.5 text-right">Pengeluaran (Rp)</th>
              <th className="px-4 py-3.5 text-right">Saldo Berjalan (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center font-sans text-gray-400">
                  Memuat data buku kas...
                </td>
              </tr>
            ) : !data || data.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center font-sans text-gray-400">
                  Tidak ada mutasi kas tercatat pada periode ini. Saldo kas tetap: {data ? formatRupiah(data.openingBalance) : '-'}
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/70 font-sans">
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-900 whitespace-nowrap">
                    {entry.transactionNumber}
                  </td>
                  <td className="px-4 py-2.5 text-gray-800 max-w-sm truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                    {entry.unitName || entry.fundName || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-emerald-700">
                    {entry.penerimaan > 0 ? formatRupiah(entry.penerimaan) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-rose-700">
                    {entry.pengeluaran > 0 ? formatRupiah(entry.pengeluaran) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-950">
                    {formatRupiah(entry.runningBalance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
