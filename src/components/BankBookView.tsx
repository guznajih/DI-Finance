import React, { useEffect, useState } from 'react';
import {
  Download,
  Filter,
  Landmark,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { BankAccount, BankBookData, Fund, Unit } from '../types/index.ts';

export const BankBookView: React.FC = () => {
  const { authFetch } = useAuth();
  const [bankList, setBankList] = useState<BankAccount[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);

  const [selectedBankId, setSelectedBankId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');

  const [data, setData] = useState<BankBookData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial master data
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [bRes, uRes, fRes] = await Promise.all([
          authFetch('/api/bank-accounts'),
          authFetch('/api/units'),
          authFetch('/api/funds'),
        ]);

        if (bRes.ok) {
          const list: BankAccount[] = await bRes.json();
          setBankList(list);
          if (list.length > 0) setSelectedBankId(list[0].id);
        }
        if (uRes.ok) setUnits(await uRes.json());
        if (fRes.ok) setFunds(await fRes.json());
      } catch (err) {
        console.error('Error fetching master for bank book:', err);
      }
    };
    fetchMaster();
  }, []);

  const fetchBook = async () => {
    if (!selectedBankId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('bankAccountId', String(selectedBankId));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (unitFilter) params.append('unitId', unitFilter);
      if (fundFilter) params.append('fundId', fundFilter);

      const res = await authFetch(`/api/bank-book?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching bank book:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBankId) fetchBook();
  }, [selectedBankId, startDate, endDate, unitFilter, fundFilter]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = [
      'Tanggal',
      'No. Referensi / Jurnal',
      'Jenis Mutasi',
      'Keterangan Transaksi',
      'Unit / Sumber',
      'Penerimaan (Rp)',
      'Pengeluaran (Rp)',
      'Transfer Masuk (Rp)',
      'Transfer Keluar (Rp)',
      'Saldo Berjalan (Rp)',
    ];
    const rows = data.entries.map((e) => [
      `"${e.date}"`,
      `"${e.transactionNumber}"`,
      `"${e.type}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.unitName || e.fundName || '-').replace(/"/g, '""')}"`,
      e.penerimaan,
      e.pengeluaran,
      e.transferIn,
      e.transferOut,
      e.runningBalance,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Buku_Bank_${data.bankAccount.bankName}_${data.bankAccount.accountNumber}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
            <Landmark className="h-4 w-4" />
            <span>KEUANGAN → BUKU BANK</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Buku Bank (Bank Ledger & Mutasi)
          </h1>
          <p className="text-xs text-gray-500">
            Monitoring mutasi rekening bank pesantren: Saldo awal, Penerimaan, Pengeluaran, Transfer masuk/keluar, dan Saldo akhir
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

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:grid-cols-2 md:grid-cols-5 items-end">
        {/* Rekening Filter */}
        <div className="sm:col-span-2 md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">
            PILIH REKENING BANK
          </label>
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
          >
            {bankList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankName} - {b.accountNumber} ({b.accountName}) • {formatRupiah(b.currentBalance)}
              </option>
            ))}
          </select>
        </div>

        {/* Periode Dari */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">PERIODE DARI</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        {/* Sampai Dengan */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">SAMPAI DENGAN</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={fetchBook}
            className="flex w-full items-center justify-center space-x-1 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Terapkan</span>
          </button>
        </div>

        {/* Unit Filter */}
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">FILTER UNIT / DIVISI</label>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Unit / Divisi --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sumber Dana Filter */}
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">FILTER SUMBER DANA</label>
          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Sumber Dana --</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} - {f.name} ({f.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards: Saldo Awal, Penerimaan, Pengeluaran, Transfer Masuk, Transfer Keluar, Saldo Akhir */}
      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Saldo Awal */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-medium text-gray-500">1. Saldo Awal</span>
            <p className="mt-1 font-mono text-base font-bold text-gray-900">
              {formatRupiah(data.openingBalance)}
            </p>
          </div>

          {/* 2. Penerimaan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-medium text-gray-500">2. Penerimaan (+)</span>
            <p className="mt-1 font-mono text-base font-bold text-emerald-700">
              +{formatRupiah(data.totalPenerimaan)}
            </p>
          </div>

          {/* 3. Pengeluaran */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-medium text-gray-500">3. Pengeluaran (-)</span>
            <p className="mt-1 font-mono text-base font-bold text-rose-700">
              -{formatRupiah(data.totalPengeluaran)}
            </p>
          </div>

          {/* 4. Transfer Masuk */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-medium text-gray-500">4. Transfer Masuk (+)</span>
            <p className="mt-1 font-mono text-base font-bold text-teal-700">
              +{formatRupiah(data.totalTransferIn)}
            </p>
          </div>

          {/* 5. Transfer Keluar */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <span className="text-[11px] font-medium text-gray-500">5. Transfer Keluar (-)</span>
            <p className="mt-1 font-mono text-base font-bold text-amber-700">
              -{formatRupiah(data.totalTransferOut)}
            </p>
          </div>

          {/* 6. Saldo Akhir */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-teal-900">6. Saldo Akhir Bank</span>
            <p className="mt-1 font-mono text-base font-extrabold text-teal-950">
              {formatRupiah(data.endingBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Mutation Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            <tr>
              <th className="px-3.5 py-3.5">Tanggal</th>
              <th className="px-3.5 py-3.5">No. Referensi / Jurnal</th>
              <th className="px-3.5 py-3.5">Jenis</th>
              <th className="px-3.5 py-3.5">Keterangan</th>
              <th className="px-3.5 py-3.5">Unit / Sumber</th>
              <th className="px-3.5 py-3.5 text-right text-emerald-800">Penerimaan</th>
              <th className="px-3.5 py-3.5 text-right text-rose-800">Pengeluaran</th>
              <th className="px-3.5 py-3.5 text-right text-teal-800">Trf Masuk</th>
              <th className="px-3.5 py-3.5 text-right text-amber-800">Trf Keluar</th>
              <th className="px-3.5 py-3.5 text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center font-sans text-gray-400">
                  Memuat data buku bank...
                </td>
              </tr>
            ) : !data || data.entries.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center font-sans text-gray-400">
                  Tidak ada mutasi bank pada filter periode ini. Saldo rekening: {data ? formatRupiah(data.openingBalance) : '-'}
                </td>
              </tr>
            ) : (
              data.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50/70 font-sans">
                  <td className="px-3.5 py-2.5 text-gray-600 whitespace-nowrap">{entry.date}</td>
                  <td className="px-3.5 py-2.5 font-mono font-bold text-teal-900 whitespace-nowrap">
                    {entry.transactionNumber}
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-gray-800 max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="px-3.5 py-2.5 text-gray-500 whitespace-nowrap">
                    {entry.unitName || entry.fundName || '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-emerald-700">
                    {entry.penerimaan > 0 ? formatRupiah(entry.penerimaan) : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-rose-700">
                    {entry.pengeluaran > 0 ? formatRupiah(entry.pengeluaran) : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-teal-700">
                    {entry.transferIn > 0 ? formatRupiah(entry.transferIn) : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-amber-700">
                    {entry.transferOut > 0 ? formatRupiah(entry.transferOut) : '-'}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono font-bold text-teal-950 whitespace-nowrap">
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
