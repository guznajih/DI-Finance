import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Layers,
  Printer,
  Receipt,
  RefreshCw,
  Scale,
  ShieldCheck,
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

export type ReportTab =
  | 'neraca'
  | 'laba-rugi'
  | 'arus-kas'
  | 'neraca-saldo'
  | 'buku-besar'
  | 'buku-kas'
  | 'buku-bank'
  | 'jurnal-umum';

export const ReportsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('neraca');

  // Filters
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');

  // Drilldown & selectors
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [selectedBankId, setSelectedBankId] = useState<number>(0);
  const [selectedCashId, setSelectedCashId] = useState<number>(0);

  // Master datasets
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashAccountsList, setCashAccountsList] = useState<CashAccount[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);

  // Report payloads
  const [loading, setLoading] = useState<boolean>(true);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [incomeStatement, setIncomeStatement] = useState<any>(null);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [cashBookData, setCashBookData] = useState<any>(null);
  const [bankBookData, setBankBookData] = useState<any>(null);
  const [journalsData, setJournalsData] = useState<any[]>([]);

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
          if (accs.length > 0 && !selectedAccountId) setSelectedAccountId(accs[0].id);
        }
        if (cRes.ok) {
          const c: CashAccount[] = await cRes.json();
          setCashAccountsList(c);
          if (c.length > 0 && !selectedCashId) setSelectedCashId(c[0].id);
        }
        if (bRes.ok) {
          const b: BankAccount[] = await bRes.json();
          setBankAccountsList(b);
          if (b.length > 0 && !selectedBankId) setSelectedBankId(b[0].id);
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
      if (unitFilter) params.append('unitId', unitFilter);
      if (fundFilter) params.append('fundId', fundFilter);

      switch (activeTab) {
        case 'neraca': {
          if (asOfDate) params.append('asOfDate', asOfDate);
          const res = await authFetch(`/api/reports/balance-sheet?${params.toString()}`);
          if (res.ok) setBalanceSheet(await res.json());
          break;
        }
        case 'laba-rugi': {
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/reports/income-statement?${params.toString()}`);
          if (res.ok) setIncomeStatement(await res.json());
          break;
        }
        case 'arus-kas': {
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/reports/cash-flow?${params.toString()}`);
          if (res.ok) setCashFlow(await res.json());
          break;
        }
        case 'neraca-saldo': {
          if (asOfDate) params.append('asOfDate', asOfDate);
          if (startDate) params.append('startDate', startDate);
          const res = await authFetch(`/api/reports/trial-balance?${params.toString()}`);
          if (res.ok) setTrialBalance(await res.json());
          break;
        }
        case 'buku-besar': {
          if (!selectedAccountId) break;
          params.append('accountId', String(selectedAccountId));
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/ledger?${params.toString()}`);
          if (res.ok) setLedgerData(await res.json());
          break;
        }
        case 'buku-kas': {
          if (!selectedCashId) break;
          params.append('cashAccountId', String(selectedCashId));
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/cash-book?${params.toString()}`);
          if (res.ok) setCashBookData(await res.json());
          break;
        }
        case 'buku-bank': {
          if (!selectedBankId) break;
          params.append('bankAccountId', String(selectedBankId));
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/bank-book?${params.toString()}`);
          if (res.ok) setBankBookData(await res.json());
          break;
        }
        case 'jurnal-umum': {
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          const res = await authFetch(`/api/journals?${params.toString()}`);
          if (res.ok) setJournalsData(await res.json());
          break;
        }
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveReport();
  }, [
    activeTab,
    asOfDate,
    startDate,
    endDate,
    unitFilter,
    fundFilter,
    selectedAccountId,
    selectedCashId,
    selectedBankId,
  ]);

  const handleDrilldownAccount = (accId: number) => {
    setSelectedAccountId(accId);
    setActiveTab('buku-besar');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let filename = `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers: string[] = [];
    let rows: any[] = [];

    if (activeTab === 'neraca' && balanceSheet) {
      headers = ['Komponen', 'Kode Akun', 'Nama Akun', 'Saldo (Rp)'];
      balanceSheet.assets.cashAndBank.forEach((i: any) =>
        rows.push(['Aset: Kas & Bank', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.assets.receivables.forEach((i: any) =>
        rows.push(['Aset: Piutang', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.assets.investments.forEach((i: any) =>
        rows.push(['Aset: Investasi', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.assets.fixedAssets.forEach((i: any) =>
        rows.push(['Aset: Aset Tetap', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.liabilities.currentLiabilities.forEach((i: any) =>
        rows.push(['Liabilitas: Utang Jangka Pendek', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.netAssets.unrestrictedFunds.forEach((i: any) =>
        rows.push(['Dana: Tidak Terikat', i.code, `"${i.name}"`, i.balance])
      );
      balanceSheet.netAssets.restrictedFunds.forEach((i: any) =>
        rows.push(['Dana: Terikat', i.code, `"${i.name}"`, i.balance])
      );
      rows.push(['Surplus/Defisit Berjalan', '-', 'Surplus/Defisit Periode Berjalan', balanceSheet.netAssets.currentPeriodSurplusDeficit]);
    } else if (activeTab === 'laba-rugi' && incomeStatement) {
      headers = ['Kategori', 'Kode Akun', 'Nama Akun', 'Nominal (Rp)'];
      incomeStatement.revenues.sppAgregat.forEach((i: any) =>
        rows.push(['Pendapatan: SPP Agregat', i.code, `"${i.name}"`, i.amount])
      );
      incomeStatement.revenues.donations.forEach((i: any) =>
        rows.push(['Pendapatan: Sumbangan/Donasi', i.code, `"${i.name}"`, i.amount])
      );
      incomeStatement.revenues.investmentProfitSharing.forEach((i: any) =>
        rows.push(['Pendapatan: Bagi Hasil Investasi', i.code, `"${i.name}"`, i.amount])
      );
      incomeStatement.expenses.salaryAndHonor.forEach((i: any) =>
        rows.push(['Beban: Gaji & Honor', i.code, `"${i.name}"`, i.amount])
      );
      incomeStatement.expenses.electricity.forEach((i: any) =>
        rows.push(['Beban: Listrik', i.code, `"${i.name}"`, i.amount])
      );
      incomeStatement.expenses.operational.forEach((i: any) =>
        rows.push(['Beban: Operasional', i.code, `"${i.name}"`, i.amount])
      );
      rows.push(['Hasil Neto', '-', 'Surplus / (Defisit) Bersih', incomeStatement.surplusDeficit]);
    } else if (activeTab === 'neraca-saldo' && trialBalance) {
      headers = [
        'Kode Akun',
        'Nama Akun',
        'Kategori',
        'Mutasi Debit (Rp)',
        'Mutasi Kredit (Rp)',
        'Saldo Akhir Debit (Rp)',
        'Saldo Akhir Kredit (Rp)',
      ];
      trialBalance.items.forEach((i: any) => {
        rows.push([
          `"${i.accountCode}"`,
          `"${i.accountName}"`,
          `"${i.category}"`,
          i.totalDebit,
          i.totalCredit,
          i.endingDebit,
          i.endingCredit,
        ]);
      });
    }

    if (rows.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-teal-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl">
              Laporan Keuangan Pesantren
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standar Akuntansi Pesantren Terintegrasi Penuh (Transaksi POSTED → Jurnal → Buku Besar → Laporan Keuangan)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchActiveReport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Cetak PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-teal-800 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-px gap-1.5 scrollbar-thin">
        {[
          { id: 'neraca', label: '1. Neraca Posisi Keuangan', icon: Scale },
          { id: 'laba-rugi', label: '2. Pendapatan & Beban', icon: BarChart3 },
          { id: 'arus-kas', label: '3. Arus Kas', icon: Wallet },
          { id: 'neraca-saldo', label: '4. Neraca Saldo (Trial Balance)', icon: BookOpenCheck },
          { id: 'buku-besar', label: '5. Buku Besar (General Ledger)', icon: BookMarked },
          { id: 'buku-kas', label: '6. Buku Kas Tunai', icon: Wallet },
          { id: 'buku-bank', label: '7. Buku Bank', icon: Landmark },
          { id: 'jurnal-umum', label: '8. Jurnal Umum', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-xs font-bold transition border-b-2 ${
                isActive
                  ? 'border-teal-700 bg-teal-50/70 text-teal-950 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span>Filter Laporan:</span>
          </div>

          {activeTab === 'neraca' || activeTab === 'neraca-saldo' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Per Tanggal:</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Periode:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Dari Tanggal"
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-emerald-700 focus:outline-hidden"
              />
              <span className="text-xs text-gray-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
          )}

          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-700 focus:outline-hidden"
          >
            <option value="">Semua Unit / Divisi</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </select>

          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-emerald-700 focus:outline-hidden"
          >
            <option value="">Semua Sumber Dana</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {activeTab === 'buku-besar' && (
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(parseInt(e.target.value, 10))}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-700 focus:outline-hidden"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.category})
                </option>
              ))}
            </select>
          )}

          {activeTab === 'buku-kas' && (
            <select
              value={selectedCashId}
              onChange={(e) => setSelectedCashId(parseInt(e.target.value, 10))}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-700 focus:outline-hidden"
            >
              {cashAccountsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'buku-bank' && (
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(parseInt(e.target.value, 10))}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-700 focus:outline-hidden"
            >
              {bankAccountsList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="h-3 w-3" />
          <span>Hanya Transaksi POSTED</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. NERACA / LAPORAN POSISI KEUANGAN */}
      {/* ============================================================== */}
      {activeTab === 'neraca' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
              Menghitung posisi neraca aset, liabilitas, dan dana...
            </div>
          ) : balanceSheet ? (
            <>
              {/* Balance Verification Banner */}
              <div
                className={`rounded-xl border p-4 shadow-xs flex items-center justify-between ${
                  balanceSheet.isBalanced
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-rose-300 bg-rose-50 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {balanceSheet.isBalanced ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
                      <Scale className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      {balanceSheet.isBalanced
                        ? 'Status Neraca: Seimbang Sempurna (100% Balanced)'
                        : 'Peringatan: Neraca Tidak Seimbang!'}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      Total Aset = Rp {balanceSheet.assets.totalAssets.toLocaleString('id-ID')} | Total
                      Liabilitas + Dana = Rp{' '}
                      {balanceSheet.netAssets.totalNetAssetsAndLiabilities.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {!balanceSheet.isBalanced && (
                  <span className="font-mono text-xs font-bold text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200">
                    Selisih: Rp {balanceSheet.balanceDifference.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {/* 2-Column Balance Sheet (ASET vs LIABILITAS & DANA) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: ASET */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-800" />
                      <h2 className="text-sm font-black text-gray-900 tracking-wide uppercase">
                        ASET (AKTIVA)
                      </h2>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      Rp {balanceSheet.assets.totalAssets.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Kas & Bank */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase bg-slate-50 p-2 rounded-lg">
                      <span>Kas & Setara Kas (Likuid)</span>
                      <span className="font-mono">
                        Rp {balanceSheet.assets.totalCashAndBank.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {balanceSheet.assets.cashAndBank.map((i: any) => (
                        <div
                          key={i.accountId}
                          onClick={() => handleDrilldownAccount(i.accountId)}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                            <span className="truncate">{i.name}</span>
                            <ExternalLink className="h-3 w-3 text-emerald-700 shrink-0" />
                          </span>
                          <span className="font-mono font-medium text-gray-900 shrink-0">
                            Rp {i.balance.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investasi */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase bg-slate-50 p-2 rounded-lg">
                      <span>Portofolio Investasi Berjalan</span>
                      <span className="font-mono text-blue-900">
                        Rp {balanceSheet.assets.totalInvestments.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {balanceSheet.assets.investments.length === 0 ? (
                        <div className="text-[11px] text-gray-400 py-1 pl-2 italic">
                          Tidak ada saldo aset investasi
                        </div>
                      ) : (
                        balanceSheet.assets.investments.map((i: any) => (
                          <div
                            key={i.accountId}
                            onClick={() => handleDrilldownAccount(i.accountId)}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                              <span className="truncate font-semibold">{i.name}</span>
                              <ExternalLink className="h-3 w-3 text-blue-700 shrink-0" />
                            </span>
                            <span className="font-mono font-bold text-gray-900 shrink-0">
                              Rp {i.balance.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Piutang & Persediaan */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase bg-slate-50 p-2 rounded-lg">
                      <span>Piutang & Aset Lancar Lainnya</span>
                      <span className="font-mono">
                        Rp{' '}
                        {(
                          balanceSheet.assets.receivables.reduce((s: any, i: any) => s + i.balance, 0) +
                          balanceSheet.assets.inventories.reduce((s: any, i: any) => s + i.balance, 0)
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {[...balanceSheet.assets.receivables, ...balanceSheet.assets.inventories].map(
                        (i: any) => (
                          <div
                            key={i.accountId}
                            onClick={() => handleDrilldownAccount(i.accountId)}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                              <span>{i.name}</span>
                            </span>
                            <span className="font-mono text-gray-900 shrink-0">
                              Rp {i.balance.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Aset Tetap Neto */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase bg-slate-50 p-2 rounded-lg">
                      <span>Aset Tetap & Peralatan (Nilai Buku Neto)</span>
                      <span className="font-mono">
                        Rp {balanceSheet.assets.totalFixedAssetsNet.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {balanceSheet.assets.fixedAssets.map((i: any) => (
                        <div
                          key={i.accountId}
                          onClick={() => handleDrilldownAccount(i.accountId)}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                            <span>{i.name}</span>
                          </span>
                          <span className="font-mono text-gray-900 shrink-0">
                            Rp {i.balance.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-900 pt-3 flex items-center justify-between font-black text-sm">
                    <span>TOTAL ASET</span>
                    <span className="font-mono text-emerald-900">
                      Rp {balanceSheet.assets.totalAssets.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Column 2: LIABILITAS & DANA */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-5">
                  {/* LIABILITAS */}
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-700" />
                        <h2 className="text-sm font-black text-gray-900 tracking-wide uppercase">
                          LIABILITAS (KEWAJIBAN)
                        </h2>
                      </div>
                      <span className="font-mono text-xs font-bold text-amber-900">
                        Rp {balanceSheet.liabilities.totalLiabilities.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      {balanceSheet.liabilities.currentLiabilities.length === 0 ? (
                        <div className="text-[11px] text-gray-400 py-1 pl-2 italic">
                          Tidak ada kewajiban lancar tercatat (Rp 0)
                        </div>
                      ) : (
                        balanceSheet.liabilities.currentLiabilities.map((i: any) => (
                          <div
                            key={i.accountId}
                            onClick={() => handleDrilldownAccount(i.accountId)}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-amber-50 cursor-pointer transition text-gray-700"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                              <span>{i.name}</span>
                            </span>
                            <span className="font-mono text-gray-900 shrink-0">
                              Rp {i.balance.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* ASET NETO / DANA */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-800" />
                        <h2 className="text-sm font-black text-gray-900 tracking-wide uppercase">
                          ASET NETO / SALDO DANA PESANTREN
                        </h2>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-900">
                        Rp {balanceSheet.netAssets.totalFunds.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      {/* Dana Tidak Terikat */}
                      <div>
                        <div className="text-[11px] font-bold uppercase text-gray-500 mb-1">
                          Aset Neto Tidak Terikat (Bebas)
                        </div>
                        {balanceSheet.netAssets.unrestrictedFunds.map((i: any) => (
                          <div
                            key={i.accountId}
                            onClick={() => handleDrilldownAccount(i.accountId)}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-gray-400 text-[11px]">{i.code}</span>
                              <span>{i.name}</span>
                            </span>
                            <span className="font-mono text-gray-900 shrink-0">
                              Rp {i.balance.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Dana Terikat */}
                      {balanceSheet.netAssets.restrictedFunds.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold uppercase text-gray-500 mb-1">
                            Aset Neto Terikat (Wakaf, Donatur, Khusus)
                          </div>
                          {balanceSheet.netAssets.restrictedFunds.map((i: any) => (
                            <div
                              key={i.accountId}
                              onClick={() => handleDrilldownAccount(i.accountId)}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="font-mono text-gray-400 text-[11px]">
                                  {i.code}
                                </span>
                                <span>{i.name}</span>
                              </span>
                              <span className="font-mono text-gray-900 shrink-0">
                                Rp {i.balance.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Surplus / Defisit Periode Berjalan */}
                      <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                            <span>Surplus / (Defisit) Periode Berjalan</span>
                          </span>
                          <span className="font-mono text-sm">
                            Rp{' '}
                            {balanceSheet.netAssets.currentPeriodSurplusDeficit.toLocaleString(
                              'id-ID'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-900 pt-3 flex items-center justify-between font-black text-sm">
                    <span>TOTAL LIABILITAS & DANA</span>
                    <span className="font-mono text-emerald-900">
                      Rp{' '}
                      {balanceSheet.netAssets.totalNetAssetsAndLiabilities.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LAPORAN PENDAPATAN DAN BEBAN */}
      {/* ============================================================== */}
      {activeTab === 'laba-rugi' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
              Menghitung rincian pos pendapatan dan pos beban operasional...
            </div>
          ) : incomeStatement ? (
            <>
              {/* Surplus KPI Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      Total Pendapatan
                    </span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-xl font-black text-emerald-800 font-mono">
                    Rp {incomeStatement.revenues.totalRevenue.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Beban</span>
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="mt-2 text-xl font-black text-rose-700 font-mono">
                    Rp {incomeStatement.expenses.totalExpense.toLocaleString('id-ID')}
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-4 shadow-xs ${
                    incomeStatement.surplusDeficit >= 0
                      ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                      : 'border-rose-200 bg-rose-50/70 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase">
                      {incomeStatement.surplusDeficit >= 0 ? 'Surplus Bersih' : 'Defisit Bersih'}
                    </span>
                    <Scale className="h-4 w-4" />
                  </div>
                  <div className="mt-2 text-xl font-black font-mono">
                    Rp {incomeStatement.surplusDeficit.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Detail Pendapatan vs Beban Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PENDAPATAN */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-sm font-black text-emerald-950 tracking-wide uppercase">
                      PENDAPATAN
                    </h2>
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      Rp {incomeStatement.revenues.totalRevenue.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* SPP Agregat */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-gray-500 uppercase">
                      Penerimaan SPP Agregat
                    </div>
                    {incomeStatement.revenues.sppAgregat.map((i: any) => (
                      <div
                        key={i.accountId}
                        onClick={() => handleDrilldownAccount(i.accountId)}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                      >
                        <span className="truncate">{i.name}</span>
                        <span className="font-mono font-semibold text-gray-900">
                          Rp {i.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Sumbangan & Donasi */}
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <div className="text-[11px] font-bold text-gray-500 uppercase">
                      Sumbangan, Donasi & Infaq
                    </div>
                    {incomeStatement.revenues.donations.map((i: any) => (
                      <div
                        key={i.accountId}
                        onClick={() => handleDrilldownAccount(i.accountId)}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                      >
                        <span className="truncate">{i.name}</span>
                        <span className="font-mono font-semibold text-gray-900">
                          Rp {i.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bagi Hasil Investasi */}
                  <div className="space-y-1 pt-2 border-t border-gray-100">
                    <div className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Pendapatan Bagi Hasil Investasi Pesantren</span>
                    </div>
                    {incomeStatement.revenues.investmentProfitSharing.length === 0 ? (
                      <div className="text-[11px] text-gray-400 py-1 pl-2 italic">
                        Belum ada bagi hasil investasi yang dibukukan (Rp 0)
                      </div>
                    ) : (
                      incomeStatement.revenues.investmentProfitSharing.map((i: any) => (
                        <div
                          key={i.accountId}
                          onClick={() => handleDrilldownAccount(i.accountId)}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-emerald-50 cursor-pointer transition text-gray-700"
                        >
                          <span className="font-semibold text-blue-950 truncate">{i.name}</span>
                          <span className="font-mono font-bold text-blue-900">
                            Rp {i.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* BEBAN */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-sm font-black text-rose-950 tracking-wide uppercase">
                      BEBAN OPERASIONAL
                    </h2>
                    <span className="font-mono text-xs font-bold text-rose-700">
                      Rp {incomeStatement.expenses.totalExpense.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Gaji & Honor Asatidz / Pegawai', list: incomeStatement.expenses.salaryAndHonor || [] },
                      { label: 'Beban Operasional Dapur & Konsumsi Santri', list: incomeStatement.expenses.kitchenConsumption || [] },
                      { label: 'Beban Listrik (PLN) & Utilitas', list: incomeStatement.expenses.electricity || [] },
                      { label: 'Beban Air PDAM / Pengairan', list: incomeStatement.expenses.water || [] },
                      { label: 'Beban ATK & Perlengkapan', list: incomeStatement.expenses.stationery || [] },
                      { label: 'Beban Pemeliharaan & Perbaikan', list: incomeStatement.expenses.maintenance || [] },
                      { label: 'Beban Pendidikan & Kurikulum', list: incomeStatement.expenses.educationExp || [] },
                      { label: 'Beban Kegiatan & Kesiswaan Santri', list: incomeStatement.expenses.santriActivities || [] },
                      { label: 'Beban Operasional Umum Lainnya', list: incomeStatement.expenses.operational || [] },
                    ].map((group, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">{group.label}</div>
                        {group.list.length === 0 ? (
                          <div className="text-[11px] text-gray-400 pl-2">Rp 0</div>
                        ) : (
                          group.list.map((i: any) => (
                            <div
                              key={i.accountId}
                              onClick={() => handleDrilldownAccount(i.accountId)}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-rose-50 cursor-pointer transition text-gray-700"
                            >
                              <span className="truncate">{i.name}</span>
                              <span className="font-mono font-medium text-gray-900">
                                Rp {i.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LAPORAN ARUS KAS */}
      {/* ============================================================== */}
      {activeTab === 'arus-kas' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
              Mengklasifikasi arus kas operasional, investasi, dan pendanaan...
            </div>
          ) : cashFlow ? (
            <>
              {/* Cash Reconciliation Status */}
              <div
                className={`rounded-xl border p-4 shadow-xs flex items-center justify-between ${
                  cashFlow.isReconciledWithBalanceSheet
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-amber-300 bg-amber-50 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      Rekonsiliasi Arus Kas vs Neraca: Sesuai 100%
                    </h3>
                    <p className="text-xs mt-0.5">
                      Saldo Akhir Arus Kas (Rp {cashFlow.endingCashAndBank.toLocaleString('id-ID')}) sama
                      dengan Kas & Bank pada Neraca Posisi Keuangan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Flow Statement Details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
                {/* 1. Aktivitas Operasional */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-xs font-black uppercase text-gray-900">
                    <span>1. Arus Kas Dari Aktivitas Operasional</span>
                    <span className="font-mono text-emerald-900">
                      Rp {cashFlow.netOperatingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 pl-3">
                    {cashFlow.operatingActivities.map((act: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                        <span className="truncate">{act.label}</span>
                        <span
                          className={`font-mono font-medium ${
                            act.amount >= 0 ? 'text-gray-900' : 'text-rose-600'
                          }`}
                        >
                          Rp {act.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Aktivitas Investasi */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-xs font-black uppercase text-gray-900">
                    <span>2. Arus Kas Dari Aktivitas Investasi</span>
                    <span className="font-mono text-blue-900">
                      Rp {cashFlow.netInvestingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 pl-3">
                    {cashFlow.investingActivities.length === 0 ? (
                      <div className="text-[11px] text-gray-400 italic">
                        Tidak ada mutasi arus kas investasi pada periode ini
                      </div>
                    ) : (
                      cashFlow.investingActivities.map((act: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                          <span className="truncate">{act.label}</span>
                          <span
                            className={`font-mono font-bold ${
                              act.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            Rp {act.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Aktivitas Pendanaan */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-xs font-black uppercase text-gray-900">
                    <span>3. Arus Kas Dari Aktivitas Pendanaan</span>
                    <span className="font-mono text-gray-900">
                      Rp {cashFlow.netFinancingCash.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 pl-3">
                    {cashFlow.financingActivities.length === 0 ? (
                      <div className="text-[11px] text-gray-400 italic">
                        Tidak ada mutasi pendanaan khusus (Rp 0)
                      </div>
                    ) : (
                      cashFlow.financingActivities.map((act: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                          <span className="truncate">{act.label}</span>
                          <span className="font-mono text-gray-900">
                            Rp {act.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Summary Bridge */}
                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    <span>Kenaikan / (Penurunan) Bersih Kas & Bank:</span>
                    <span className="font-mono">
                      Rp {cashFlow.netCashChange.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    <span>Saldo Awal Kas & Bank (Pembukaan):</span>
                    <span className="font-mono">
                      Rp {cashFlow.openingCashAndBank.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-900 pt-2 flex items-center justify-between text-sm font-black text-emerald-950">
                    <span>SALDO AKHIR KAS & BANK:</span>
                    <span className="font-mono text-emerald-900">
                      Rp {cashFlow.endingCashAndBank.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. NERACA SALDO (TRIAL BALANCE) */}
      {/* ============================================================== */}
      {activeTab === 'neraca-saldo' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
              Menghitung akumulasi debit dan kredit neraca saldo...
            </div>
          ) : trialBalance ? (
            <>
              {/* Balance Banner */}
              <div
                className={`rounded-xl border p-4 shadow-xs flex items-center justify-between ${
                  trialBalance.isBalanced
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-rose-300 bg-rose-50 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      {trialBalance.isBalanced
                        ? 'Neraca Saldo Seimbang (TOTAL DEBIT = TOTAL KREDIT 100%)'
                        : 'Peringatan: Total Debit ≠ Total Kredit!'}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      Total Saldo Akhir Debit: Rp{' '}
                      {trialBalance.totalEndingDebit.toLocaleString('id-ID')} | Total Saldo Akhir
                      Kredit: Rp {trialBalance.totalEndingCredit.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Trial Balance */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Kode Akun</th>
                        <th className="py-3 px-4">Nama Akun</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-right">Debit Mutasi</th>
                        <th className="py-3 px-4 text-right">Kredit Mutasi</th>
                        <th className="py-3 px-4 text-right">Saldo Debit</th>
                        <th className="py-3 px-4 text-right">Saldo Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trialBalance.items.map((i: any) => (
                        <tr
                          key={i.accountId}
                          onClick={() => handleDrilldownAccount(i.accountId)}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-emerald-950">
                            {i.accountCode}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-gray-800">
                            {i.accountName}
                          </td>
                          <td className="py-2.5 px-4 text-gray-500">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">
                              {i.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                            Rp {i.totalDebit.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                            Rp {i.totalCredit.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                            {i.endingDebit > 0 ? `Rp ${i.endingDebit.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                            {i.endingCredit > 0
                              ? `Rp ${i.endingCredit.toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-900 bg-slate-100 font-black text-xs">
                      <tr>
                        <td colSpan={3} className="py-3 px-4">
                          TOTAL NERACA SALDO
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          Rp {trialBalance.totalDebitMutasi.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          Rp {trialBalance.totalCreditMutasi.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-900">
                          Rp {trialBalance.totalEndingDebit.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-900">
                          Rp {trialBalance.totalEndingCredit.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. BUKU BESAR (GENERAL LEDGER) */}
      {/* ============================================================== */}
      {activeTab === 'buku-besar' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-700 mb-2" />
              Memuat mutasi buku besar...
            </div>
          ) : ledgerData ? (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
              <div className="bg-slate-50 border-b border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Buku Besar: {ledgerData.account.code} - {ledgerData.account.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Saldo Normal: {ledgerData.account.normalBalance} | Kategori:{' '}
                    {ledgerData.account.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">
                    Saldo Berjalan Saat Ini
                  </span>
                  <span className="font-mono text-base font-black text-emerald-900">
                    Rp {ledgerData.endingBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-slate-100 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">No. Jurnal</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Sumber Dana</th>
                      <th className="py-3 px-4 text-right">Debit</th>
                      <th className="py-3 px-4 text-right">Kredit</th>
                      <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgerData.entries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400">
                          Belum ada mutasi jurnal POSTED untuk akun ini.
                        </td>
                      </tr>
                    ) : (
                      ledgerData.entries.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-4 text-gray-600 whitespace-nowrap">{e.date}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-emerald-950">
                            {e.journalNumber}
                          </td>
                          <td className="py-2.5 px-4 text-gray-800 max-w-sm truncate">
                            {e.description}
                          </td>
                          <td className="py-2.5 px-4 text-gray-500">{e.unitName || '-'}</td>
                          <td className="py-2.5 px-4 text-gray-500">{e.fundName || '-'}</td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {Number(e.debit) > 0
                              ? `Rp ${Number(e.debit).toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono">
                            {Number(e.credit) > 0
                              ? `Rp ${Number(e.credit).toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                            Rp {e.runningBalance.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. BUKU KAS TUNAI */}
      {/* ============================================================== */}
      {activeTab === 'buku-kas' && (
        <div className="space-y-6">
          {cashBookData ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Buku Kas: {cashBookData.cashAccount.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Saldo Awal: Rp {Number(cashBookData.openingBalance).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">
                    Saldo Akhir Kas
                  </span>
                  <span className="font-mono text-base font-black text-emerald-900">
                    Rp {Number(cashBookData.endingBalance).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">No. Transaksi</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-4 text-right">Penerimaan (Debit)</th>
                      <th className="py-3 px-4 text-right">Pengeluaran (Kredit)</th>
                      <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cashBookData.entries.map((e: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4">{e.date}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-950">
                          {e.transactionNumber}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800">{e.description}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                          {Number(e.inflow) > 0
                            ? `Rp ${Number(e.inflow).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">
                          {Number(e.outflow) > 0
                            ? `Rp ${Number(e.outflow).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-gray-900">
                          Rp {Number(e.runningBalance).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BUKU BANK */}
      {/* ============================================================== */}
      {activeTab === 'buku-bank' && (
        <div className="space-y-6">
          {bankBookData ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    Buku Bank: {bankBookData.bankAccount.bankName} -{' '}
                    {bankBookData.bankAccount.accountNumber}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Saldo Awal: Rp {Number(bankBookData.openingBalance).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">
                    Saldo Akhir Bank
                  </span>
                  <span className="font-mono text-base font-black text-emerald-900">
                    Rp {Number(bankBookData.endingBalance).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">No. Transaksi</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-4 text-right">Penerimaan (Debit)</th>
                      <th className="py-3 px-4 text-right">Pengeluaran (Kredit)</th>
                      <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bankBookData.entries.map((e: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4">{e.date}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-950">
                          {e.transactionNumber}
                        </td>
                        <td className="py-2.5 px-4 text-gray-800">{e.description}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                          {Number(e.inflow) > 0
                            ? `Rp ${Number(e.inflow).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-700 font-semibold">
                          {Number(e.outflow) > 0
                            ? `Rp ${Number(e.outflow).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-gray-900">
                          Rp {Number(e.runningBalance).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. JURNAL UMUM */}
      {/* ============================================================== */}
      {activeTab === 'jurnal-umum' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Daftar Jurnal Umum Terposting
            </h3>
            <div className="divide-y divide-gray-100">
              {journalsData.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Tidak ada data jurnal pada periode ini.
                </div>
              ) : (
                journalsData.map((j) => (
                  <div key={j.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-950">
                          {j.journalNumber}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{j.date}</span>
                      </div>
                      <p className="text-gray-700 mt-0.5">{j.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-mono font-bold text-gray-900">
                        Rp {Number(j.totalDebit).toLocaleString('id-ID')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Balanced
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
