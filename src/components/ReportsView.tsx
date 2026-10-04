import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  BookOpenCheck,
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  Landmark,
  Printer,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Account,
  BankAccount,
  CashAccount,
  Fund,
  Journal,
  Transaction,
  Unit,
} from '../types/index.ts';

type ReportTab =
  | 'buku-kas'
  | 'buku-bank'
  | 'jurnal-umum'
  | 'buku-besar'
  | 'daftar-penerimaan'
  | 'daftar-pengeluaran'
  | 'pendapatan'
  | 'beban'
  | 'saldo-kas-bank';

export const ReportsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('buku-kas');

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');

  // Specific selectors
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [selectedBankId, setSelectedBankId] = useState<number>(0);
  const [selectedCashId, setSelectedCashId] = useState<number>(0);

  // Data sets
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashAccountsList, setCashAccountsList] = useState<CashAccount[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);

  // Report results
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  // Initial master fetch
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [uRes, fRes, aRes, cRes, bRes] = await Promise.all([
          authFetch('/api/units'),
          authFetch('/api/funds'),
          authFetch('/api/accounts'),
          authFetch('/api/cash-accounts'),
          authFetch('/api/bank-accounts'),
        ]);

        if (uRes.ok) setUnits(await uRes.json());
        if (fRes.ok) setFunds(await fRes.json());
        if (aRes.ok) {
          const accs: Account[] = await aRes.json();
          setAccounts(accs);
          if (accs.length > 0) setSelectedAccountId(accs[0].id);
        }
        if (cRes.ok) {
          const c: CashAccount[] = await cRes.json();
          setCashAccountsList(c);
          if (c.length > 0) setSelectedCashId(c[0].id);
        }
        if (bRes.ok) {
          const b: BankAccount[] = await bRes.json();
          setBankAccountsList(b);
          if (b.length > 0) setSelectedBankId(b[0].id);
        }
      } catch (err) {
        console.error('Error fetching master in reports:', err);
      }
    };
    fetchMaster();
  }, []);

  const fetchActiveReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (unitFilter) params.append('unitId', unitFilter);
      if (fundFilter) params.append('fundId', fundFilter);

      let url = '';

      switch (activeTab) {
        case 'buku-kas': {
          if (!selectedCashId) break;
          params.append('cashAccountId', String(selectedCashId));
          url = `/api/cash-book?${params.toString()}`;
          break;
        }
        case 'buku-bank': {
          if (!selectedBankId) break;
          params.append('bankAccountId', String(selectedBankId));
          url = `/api/bank-book?${params.toString()}`;
          break;
        }
        case 'jurnal-umum': {
          url = `/api/journals?${params.toString()}`;
          break;
        }
        case 'buku-besar': {
          if (!selectedAccountId) break;
          params.append('accountId', String(selectedAccountId));
          url = `/api/ledger?${params.toString()}`;
          break;
        }
        case 'daftar-penerimaan': {
          params.append('type', 'PENERIMAAN');
          url = `/api/transactions?${params.toString()}`;
          break;
        }
        case 'daftar-pengeluaran': {
          params.append('type', 'PENGELUARAN');
          url = `/api/transactions?${params.toString()}`;
          break;
        }
        case 'pendapatan': {
          url = `/api/dashboard?${params.toString()}`;
          break;
        }
        case 'beban': {
          url = `/api/dashboard?${params.toString()}`;
          break;
        }
        case 'saldo-kas-bank': {
          url = `/api/dashboard`;
          break;
        }
      }

      if (url) {
        const res = await authFetch(url);
        if (res.ok) {
          setReportData(await res.json());
        }
      }
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveReport();
  }, [
    activeTab,
    startDate,
    endDate,
    unitFilter,
    fundFilter,
    selectedCashId,
    selectedBankId,
    selectedAccountId,
  ]);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    let csvRows: string[][] = [];
    let filename = `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'daftar-penerimaan' || activeTab === 'daftar-pengeluaran') {
      csvRows.push(['No. Transaksi', 'Tanggal', 'Keterangan', 'Unit', 'Sumber Dana', 'Nominal', 'Status']);
      const trxs: Transaction[] = Array.isArray(reportData) ? reportData : [];
      trxs.forEach((t) => {
        csvRows.push([
          `"${t.transactionNumber}"`,
          `"${t.date}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          `"${t.unitName || '-'}"`,
          `"${t.fundName || '-'}"`,
          t.totalAmount,
          t.status,
        ]);
      });
    } else if (activeTab === 'jurnal-umum') {
      csvRows.push(['No. Jurnal', 'Tanggal', 'Keterangan', 'Total Debit', 'Total Kredit', 'Status']);
      const jrns: Journal[] = Array.isArray(reportData) ? reportData : [];
      jrns.forEach((j) => {
        csvRows.push([
          `"${j.journalNumber}"`,
          `"${j.date}"`,
          `"${(j.description || '').replace(/"/g, '""')}"`,
          j.totalDebit,
          j.totalCredit,
          j.status,
        ]);
      });
    } else if (activeTab === 'buku-kas') {
      csvRows.push(['Tanggal', 'No. Referensi', 'Keterangan', 'Penerimaan', 'Pengeluaran', 'Saldo']);
      (reportData.entries || []).forEach((e: any) => {
        csvRows.push([
          `"${e.date}"`,
          `"${e.transactionNumber}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.penerimaan,
          e.pengeluaran,
          e.runningBalance,
        ]);
      });
    } else if (activeTab === 'buku-bank') {
      csvRows.push(['Tanggal', 'No. Referensi', 'Keterangan', 'Penerimaan', 'Pengeluaran', 'Transfer Masuk', 'Transfer Keluar', 'Saldo']);
      (reportData.entries || []).forEach((e: any) => {
        csvRows.push([
          `"${e.date}"`,
          `"${e.transactionNumber}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.penerimaan,
          e.pengeluaran,
          e.transferIn,
          e.transferOut,
          e.runningBalance,
        ]);
      });
    } else if (activeTab === 'buku-besar') {
      csvRows.push(['Tanggal', 'No. Jurnal', 'Keterangan', 'Debit', 'Kredit', 'Saldo Berjalan']);
      (reportData.entries || []).forEach((e: any) => {
        csvRows.push([
          `"${e.date}"`,
          `"${e.journalNumber}"`,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.debit,
          e.credit,
          e.runningBalance,
        ]);
      });
    } else if (activeTab === 'saldo-kas-bank') {
      csvRows.push(['Jenis', 'Nama Akun / Bank', 'No. Rekening', 'Saldo']);
      csvRows.push(['KAS FISIK', 'Kas Tunai Utama Pondok', '-', String(reportData.saldoKas || 0)]);
      (reportData.bankBalances || []).forEach((b: any) => {
        csvRows.push(['BANK', b.bankName, b.accountNumber, String(b.balance || 0)]);
      });
      csvRows.push(['TOTAL', 'Total Kas + Bank', '-', String(reportData.totalKasBank || 0)]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'buku-kas', label: '1. Buku Kas', icon: Wallet },
    { id: 'buku-bank', label: '2. Buku Bank', icon: Landmark },
    { id: 'jurnal-umum', label: '3. Jurnal Umum', icon: BookOpenCheck },
    { id: 'buku-besar', label: '4. Buku Besar', icon: BookMarked },
    { id: 'daftar-penerimaan', label: '5. Daftar Penerimaan', icon: TrendingUp },
    { id: 'daftar-pengeluaran', label: '6. Daftar Pengeluaran', icon: TrendingDown },
    { id: 'pendapatan', label: '7. Laporan Pendapatan', icon: TrendingUp },
    { id: 'beban', label: '8. Laporan Beban', icon: TrendingDown },
    { id: 'saldo-kas-bank', label: '9. Saldo Kas & Bank', icon: Scale },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <FileSpreadsheet className="h-4 w-4" />
            <span>PUSAT LAPORAN KEUANGAN (FASE 2)</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Laporan Akuntansi Terintegrasi
          </h1>
          <p className="text-xs text-gray-500">
            9 Laporan dasar akuntansi pondok pesantren yang bersumber langsung dari database transaksi riil
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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

      {/* 9 Report Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 pb-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs sm:grid-cols-2 md:grid-cols-4 items-end">
        {/* Periode Dari */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">DARI TANGGAL</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        {/* Sampai Tanggal */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">SAMPAI TANGGAL</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          />
        </div>

        {/* Filter Unit */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">FILTER UNIT</label>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Unit --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Sumber Dana */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">FILTER DANA</label>
          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
          >
            <option value="">-- Semua Sumber Dana --</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.code} - {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Selectors depending on Active Tab */}
        {activeTab === 'buku-kas' && (
          <div className="sm:col-span-2 md:col-span-4">
            <label className="block text-[11px] font-bold text-gray-500 mb-1">REKENING KAS</label>
            <select
              value={selectedCashId}
              onChange={(e) => setSelectedCashId(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              {cashAccountsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatRupiah(c.currentBalance)})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'buku-bank' && (
          <div className="sm:col-span-2 md:col-span-4">
            <label className="block text-[11px] font-bold text-gray-500 mb-1">REKENING BANK</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              {bankAccountsList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} ({b.accountName})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'buku-besar' && (
          <div className="sm:col-span-2 md:col-span-4">
            <label className="block text-[11px] font-bold text-gray-500 mb-1">AKUN BUKU BESAR</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-800 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* REPORT CONTENT BODY */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-700 mb-2" />
            <span>Menghitung data laporan akuntansi...</span>
          </div>
        ) : (
          <>
            {/* 1. BUKU KAS */}
            {activeTab === 'buku-kas' && reportData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Laporan Buku Kas: {reportData.cashAccount?.name}
                    </h3>
                    <p className="text-xs text-gray-500">Saldo Awal: {formatRupiah(reportData.openingBalance)} • Saldo Akhir: {formatRupiah(reportData.endingBalance)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">No. Referensi</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-right">Penerimaan (Rp)</th>
                        <th className="p-3 text-right">Pengeluaran (Rp)</th>
                        <th className="p-3 text-right">Saldo (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {(reportData.entries || []).map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3">{e.date}</td>
                          <td className="p-3 font-mono font-bold text-emerald-900">{e.transactionNumber}</td>
                          <td className="p-3 text-gray-800">{e.description}</td>
                          <td className="p-3 text-right font-mono text-emerald-700">{e.penerimaan > 0 ? formatRupiah(e.penerimaan) : '-'}</td>
                          <td className="p-3 text-right font-mono text-rose-700">{e.pengeluaran > 0 ? formatRupiah(e.pengeluaran) : '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-gray-900">{formatRupiah(e.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. BUKU BANK */}
            {activeTab === 'buku-bank' && reportData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Laporan Buku Bank: {reportData.bankAccount?.bankName} - {reportData.bankAccount?.accountNumber}
                    </h3>
                    <p className="text-xs text-gray-500">Saldo Awal: {formatRupiah(reportData.openingBalance)} • Saldo Akhir: {formatRupiah(reportData.endingBalance)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">No. Jurnal</th>
                        <th className="p-3">Jenis</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-right">Penerimaan</th>
                        <th className="p-3 text-right">Pengeluaran</th>
                        <th className="p-3 text-right">Trf Masuk</th>
                        <th className="p-3 text-right">Trf Keluar</th>
                        <th className="p-3 text-right">Saldo Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {(reportData.entries || []).map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3">{e.date}</td>
                          <td className="p-3 font-mono font-bold text-teal-900">{e.transactionNumber}</td>
                          <td className="p-3">{e.type}</td>
                          <td className="p-3 text-gray-800">{e.description}</td>
                          <td className="p-3 text-right font-mono text-emerald-700">{e.penerimaan > 0 ? formatRupiah(e.penerimaan) : '-'}</td>
                          <td className="p-3 text-right font-mono text-rose-700">{e.pengeluaran > 0 ? formatRupiah(e.pengeluaran) : '-'}</td>
                          <td className="p-3 text-right font-mono text-teal-700">{e.transferIn > 0 ? formatRupiah(e.transferIn) : '-'}</td>
                          <td className="p-3 text-right font-mono text-amber-700">{e.transferOut > 0 ? formatRupiah(e.transferOut) : '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-teal-950">{formatRupiah(e.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. JURNAL UMUM */}
            {activeTab === 'jurnal-umum' && Array.isArray(reportData) && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Daftar Buku Jurnal Umum</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">No. Jurnal</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3 text-right">Total Debit</th>
                        <th className="p-3 text-right">Total Kredit</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {reportData.map((j: Journal) => (
                        <tr key={j.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3 font-mono font-bold text-emerald-900">{j.journalNumber}</td>
                          <td className="p-3 text-gray-600">{j.date}</td>
                          <td className="p-3 text-gray-800">{j.description}</td>
                          <td className="p-3 text-right font-mono">{formatRupiah(j.totalDebit)}</td>
                          <td className="p-3 text-right font-mono">{formatRupiah(j.totalCredit)}</td>
                          <td className="p-3 text-center">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              {j.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. BUKU BESAR */}
            {activeTab === 'buku-besar' && reportData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Buku Besar Akun: {reportData.account?.code} - {reportData.account?.name}
                    </h3>
                    <p className="text-xs text-gray-500">Kategori: {reportData.account?.category} • Saldo Normal: {reportData.account?.normalBalance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Saldo Akhir</p>
                    <p className="font-mono text-base font-bold text-emerald-900">{formatRupiah(reportData.endingBalance)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">No. Jurnal</th>
                        <th className="p-3">Keterangan Baris</th>
                        <th className="p-3 text-right">Debit (Rp)</th>
                        <th className="p-3 text-right">Kredit (Rp)</th>
                        <th className="p-3 text-right">Saldo Berjalan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {(reportData.entries || []).map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3">{e.date}</td>
                          <td className="p-3 font-mono font-bold text-emerald-900">{e.journalNumber}</td>
                          <td className="p-3 text-gray-800">{e.description}</td>
                          <td className="p-3 text-right font-mono">{Number(e.debit) > 0 ? formatRupiah(e.debit) : '-'}</td>
                          <td className="p-3 text-right font-mono">{Number(e.credit) > 0 ? formatRupiah(e.credit) : '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-950">{formatRupiah(e.runningBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. DAFTAR PENERIMAAN */}
            {activeTab === 'daftar-penerimaan' && Array.isArray(reportData) && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Daftar Seluruh Transaksi Penerimaan (KM)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">No. Transaksi</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3">Unit / Divisi</th>
                        <th className="p-3">Sumber Dana</th>
                        <th className="p-3 text-right">Nominal (Rp)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {reportData.map((t: Transaction) => (
                        <tr key={t.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3 font-mono font-bold text-emerald-900">{t.transactionNumber}</td>
                          <td className="p-3 text-gray-600">{t.date}</td>
                          <td className="p-3 text-gray-800">{t.description}</td>
                          <td className="p-3 text-gray-500">{t.unitName || '-'}</td>
                          <td className="p-3 text-gray-500">{t.fundName || '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">+{formatRupiah(t.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. DAFTAR PENGELUARAN */}
            {activeTab === 'daftar-pengeluaran' && Array.isArray(reportData) && (
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-gray-900">Daftar Seluruh Transaksi Pengeluaran (KK)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">No. Transaksi</th>
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Penerima</th>
                        <th className="p-3">Keterangan</th>
                        <th className="p-3">Unit / Divisi</th>
                        <th className="p-3 text-right">Nominal (Rp)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {reportData.map((t: Transaction) => (
                        <tr key={t.id} className="hover:bg-gray-50 font-sans">
                          <td className="p-3 font-mono font-bold text-rose-900">{t.transactionNumber}</td>
                          <td className="p-3 text-gray-600">{t.date}</td>
                          <td className="p-3 text-gray-800 font-semibold">{t.recipient || '-'}</td>
                          <td className="p-3 text-gray-800">{t.description}</td>
                          <td className="p-3 text-gray-500">{t.unitName || '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700">-{formatRupiah(t.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 7. LAPORAN PENDAPATAN */}
            {activeTab === 'pendapatan' && reportData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Laporan Rincian Pendapatan</h3>
                    <p className="text-xs text-gray-500">Infak, Donasi, Hibah, Sumbangan, dan SPP Agregat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Pendapatan</p>
                    <p className="font-mono text-lg font-bold text-green-700">
                      {formatRupiah(reportData.pendapatan || 0)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/60">
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="font-medium text-gray-700">Akun Pendapatan Teregistrasi:</span>
                    <span className="font-mono font-bold text-green-800">{accounts.filter(a => a.category === 'PENDAPATAN').length} Akun</span>
                  </div>
                  <div className="mt-2 divide-y divide-gray-200">
                    {accounts.filter(a => a.category === 'PENDAPATAN').map(acc => (
                      <div key={acc.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-gray-700">{acc.code}</span> - <span className="font-medium text-gray-900">{acc.name}</span>
                          <span className="ml-2 text-[10px] text-gray-400">({acc.subCategory})</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAccountId(acc.id);
                            setActiveTab('buku-besar');
                          }}
                          className="text-[11px] font-semibold text-emerald-800 hover:underline"
                        >
                          Lihat Buku Besar →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. LAPORAN BEBAN */}
            {activeTab === 'beban' && reportData && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Laporan Rincian Beban Operasional</h3>
                    <p className="text-xs text-gray-500">Biaya Dapur, Sarpras, Listrik, SDM, dan Operasional</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total Beban</p>
                    <p className="font-mono text-lg font-bold text-rose-700">
                      {formatRupiah(reportData.beban || 0)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/60">
                  <div className="flex items-center justify-between text-xs py-2">
                    <span className="font-medium text-gray-700">Akun Beban Teregistrasi:</span>
                    <span className="font-mono font-bold text-rose-800">{accounts.filter(a => a.category === 'BEBAN').length} Akun</span>
                  </div>
                  <div className="mt-2 divide-y divide-gray-200">
                    {accounts.filter(a => a.category === 'BEBAN').map(acc => (
                      <div key={acc.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-gray-700">{acc.code}</span> - <span className="font-medium text-gray-900">{acc.name}</span>
                          <span className="ml-2 text-[10px] text-gray-400">({acc.subCategory})</span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAccountId(acc.id);
                            setActiveTab('buku-besar');
                          }}
                          className="text-[11px] font-semibold text-rose-800 hover:underline"
                        >
                          Lihat Buku Besar →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 9. SALDO KAS DAN BANK (REKAPITULASI) */}
            {activeTab === 'saldo-kas-bank' && reportData && (
              <div className="space-y-6">
                <div className="border-b pb-3">
                  <h3 className="font-bold text-sm text-gray-900">
                    Rekapitulasi Saldo Kas Tunai dan Rekening Bank
                  </h3>
                  <p className="text-xs text-gray-500">
                    Ringkasan seluruh aset likuid yang dimiliki oleh Pondok Pesantren
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <span className="text-xs font-semibold text-emerald-800">Saldo Kas Tunai</span>
                    <p className="mt-2 font-mono text-xl font-bold text-emerald-950">
                      {formatRupiah(reportData.saldoKas || 0)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                    <span className="text-xs font-semibold text-teal-800">Total Seluruh Bank</span>
                    <p className="mt-2 font-mono text-xl font-bold text-teal-950">
                      {formatRupiah(reportData.saldoBank || 0)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                    <span className="text-xs font-semibold text-blue-800">Total Likuiditas (Kas + Bank)</span>
                    <p className="mt-2 font-mono text-xl font-bold text-blue-950">
                      {formatRupiah(reportData.totalKasBank || reportData.saldoKas + reportData.saldoBank)}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                      <tr>
                        <th className="p-3">Pos Likuiditas</th>
                        <th className="p-3">Nama Bank / Kas</th>
                        <th className="p-3">No. Rekening</th>
                        <th className="p-3 text-right">Saldo Saat Ini (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-xs">
                      <tr>
                        <td className="p-3 font-sans font-semibold text-gray-800">KAS TUNAI FISIK</td>
                        <td className="p-3 font-sans text-gray-600">Kas Tunai Utama Pondok</td>
                        <td className="p-3 text-gray-400">-</td>
                        <td className="p-3 text-right font-bold text-emerald-900">{formatRupiah(reportData.saldoKas || 0)}</td>
                      </tr>
                      {(reportData.bankBalances || []).map((b: any) => (
                        <tr key={b.id}>
                          <td className="p-3 font-sans font-semibold text-gray-800">REKENING BANK</td>
                          <td className="p-3 font-sans text-gray-600">{b.bankName}</td>
                          <td className="p-3 text-gray-500 font-mono">{b.accountNumber}</td>
                          <td className="p-3 text-right font-bold text-teal-900">{formatRupiah(Number(b.balance))}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold font-sans">
                        <td colSpan={3} className="p-3 text-right text-gray-900">TOTAL LIKUIDITAS:</td>
                        <td className="p-3 text-right font-mono text-emerald-950 text-sm">
                          {formatRupiah(reportData.totalKasBank || reportData.saldoKas + reportData.saldoBank)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
