import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Building2,
  Calendar,
  Briefcase,
  TrendingUp,
  RotateCcw,
  BadgePercent,
  CheckCircle2,
  AlertTriangle,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, InvestmentTransaction, InvestmentReconciliation, Fund, Unit } from '../../types/index.ts';

type ReportTab =
  | 'ALL_INVESTMENTS'
  | 'ACTIVE_INVESTMENTS'
  | 'MATURED_INVESTMENTS'
  | 'COMPLETED_INVESTMENTS'
  | 'PROFIT_SHARING'
  | 'CAPITAL_RETURN'
  | 'CURRENT_BOOK_VALUE'
  | 'RECONCILIATION'
  | 'TRANSACTION_HISTORY';

export const InvestmentReportsView: React.FC = () => {
  const { authFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('ALL_INVESTMENTS');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [reconciliations, setReconciliations] = useState<InvestmentReconciliation[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [investeeFilter, setInvesteeFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [fundFilter, setFundFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, txRes, recRes, fundsRes, unitsRes] = await Promise.all([
        authFetch('/api/investments'),
        authFetch('/api/investment-transactions'),
        authFetch('/api/investment-reconciliations'),
        authFetch('/api/funds'),
        authFetch('/api/units'),
      ]);

      if (invRes.ok) setInvestments(await invRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (recRes.ok) setReconciliations(await recRes.json());
      if (fundsRes.ok) setFunds(await fundsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filtered investments
  const filteredInvestments = investments.filter((item) => {
    if (investeeFilter && !item.investeeName.toLowerCase().includes(investeeFilter.toLowerCase())) return false;
    if (typeFilter && item.investmentType !== typeFilter) return false;
    if (fundFilter && String(item.fundId) !== fundFilter) return false;
    if (startDate && item.placementDate < startDate) return false;
    if (endDate && item.placementDate > endDate) return false;

    if (activeTab === 'ACTIVE_INVESTMENTS') return item.status === 'ACTIVE';
    if (activeTab === 'MATURED_INVESTMENTS') return item.status === 'MATURED';
    if (activeTab === 'COMPLETED_INVESTMENTS') return item.status === 'COMPLETED';
    return true;
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (investeeFilter && tx.investeeName && !tx.investeeName.toLowerCase().includes(investeeFilter.toLowerCase())) return false;
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;

    if (activeTab === 'PROFIT_SHARING') return tx.type === 'BAGI_HASIL';
    if (activeTab === 'CAPITAL_RETURN') return tx.type === 'PENGEMBALIAN_MODAL';
    return true;
  });

  // Filtered reconciliations
  const filteredReconciliations = reconciliations.filter((rec) => {
    if (investeeFilter && rec.investeeName && !rec.investeeName.toLowerCase().includes(investeeFilter.toLowerCase())) return false;
    if (startDate && rec.asOfDate < startDate) return false;
    if (endDate && rec.asOfDate > endDate) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'PROFIT_SHARING' || activeTab === 'CAPITAL_RETURN' || activeTab === 'TRANSACTION_HISTORY') {
      csvContent += 'No Transaksi,Tanggal,Investasi,Jenis,Rekening,Nominal,Status,No Jurnal\n';
      filteredTransactions.forEach((tx) => {
        csvContent += `"${tx.transactionNumber}","${tx.date}","${tx.investeeName || ''}","${tx.type}","${tx.bankName || tx.cashName || ''}","${tx.amount}","${tx.status}","${tx.journalNumber || ''}"\n`;
      });
    } else if (activeTab === 'RECONCILIATION') {
      csvContent += 'No Rekonsiliasi,Tanggal Posisi,Investasi,Nilai Sistem,Laporan Mitra,Selisih,Status\n';
      filteredReconciliations.forEach((r) => {
        csvContent += `"${r.reconciliationNumber}","${r.asOfDate}","${r.investeeName || ''}","${r.systemBookValue}","${r.investeeReportedValue}","${r.difference}","${r.status}"\n`;
      });
    } else {
      csvContent += 'No Investasi,Mitra,Jenis,Tanggal Mulai,Jatuh Tempo,Modal Awal,Nilai Berjalan,Bagi Hasil,Modal Kembali,Status\n';
      filteredInvestments.forEach((i) => {
        csvContent += `"${i.investmentNumber}","${i.investeeName}","${i.investmentType}","${i.startDate}","${i.dueDate || ''}","${i.initialCapital}","${i.currentValue}","${i.totalReturnProfit}","${i.totalCapitalReturned}","${i.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_investasi_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
            Laporan Akuntansi Investasi Pesantren
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Laporan komprehensif penempatan dana, nilai buku berjalan, perolehan bagi hasil, pengembalian pokok modal, dan rekonsiliasi.
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 text-xs font-bold shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2 print:hidden">
        {[
          { id: 'ALL_INVESTMENTS', label: 'Daftar Seluruh Investasi' },
          { id: 'ACTIVE_INVESTMENTS', label: 'Investasi Aktif' },
          { id: 'MATURED_INVESTMENTS', label: 'Jatuh Tempo' },
          { id: 'COMPLETED_INVESTMENTS', label: 'Investasi Selesai' },
          { id: 'CURRENT_BOOK_VALUE', label: 'Nilai Modal Berjalan' },
          { id: 'PROFIT_SHARING', label: 'Pendapatan Bagi Hasil' },
          { id: 'CAPITAL_RETURN', label: 'Pengembalian Modal' },
          { id: 'RECONCILIATION', label: 'Rekonsiliasi Investasi' },
          { id: 'TRANSACTION_HISTORY', label: 'Riwayat Transaksi' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Perusahaan / Mitra
            </label>
            <input
              type="text"
              placeholder="Filter nama..."
              value={investeeFilter}
              onChange={(e) => setInvesteeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Jenis Investasi
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Semua Jenis</option>
              <option value="BAGI_HASIL">Bagi Hasil</option>
              <option value="PENYERTAAN_MODAL">Penyertaan Modal</option>
              <option value="DEPOSITO">Deposito Syariah</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Sumber Dana
            </label>
            <select
              value={fundFilter}
              onChange={(e) => setFundFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Semua Sumber Dana</option>
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-xl font-black text-slate-900">PONDOK PESANTREN DARUL ISTIQOMAH</h2>
        <p className="text-xs text-slate-600">Sistem Akuntansi Keuangan Terpadu & Modul Investasi Pesantren</p>
        <h3 className="text-sm font-bold text-slate-800 mt-2 uppercase">
          LAPORAN {activeTab.replace(/_/g, ' ')}
        </h3>
        <p className="text-[10px] text-slate-500">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* TAB TABLES */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {/* TAB 1, 2, 3, 4, 5: Investment Master / Status / Book Value */}
          {(activeTab === 'ALL_INVESTMENTS' ||
            activeTab === 'ACTIVE_INVESTMENTS' ||
            activeTab === 'MATURED_INVESTMENTS' ||
            activeTab === 'COMPLETED_INVESTMENTS' ||
            activeTab === 'CURRENT_BOOK_VALUE') && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Investasi</th>
                  <th className="py-3 px-3">Nama Mitra / Lembaga</th>
                  <th className="py-3 px-3">Akad / Jenis</th>
                  <th className="py-3 px-3">Tanggal Mulai</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Modal Awal</th>
                  <th className="py-3 px-3 text-right">Modal Berjalan</th>
                  <th className="py-3 px-3 text-right">Total Bagi Hasil</th>
                  <th className="py-3 px-3 text-right">Modal Dikembalikan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada data investasi untuk kriteria laporan ini.
                    </td>
                  </tr>
                ) : (
                  filteredInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-slate-800">
                        {inv.investmentNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{inv.investeeName}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">{inv.investmentType}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">{inv.startDate}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">{inv.dueDate || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">
                        {formatRupiah(inv.initialCapital)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-emerald-800">
                        {formatRupiah(inv.currentValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-amber-700">
                        {formatRupiah(inv.totalReturnProfit)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-blue-700">
                        {formatRupiah(inv.totalCapitalReturned)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 6 & 7: Profit Sharing & Capital Return */}
          {(activeTab === 'PROFIT_SHARING' || activeTab === 'CAPITAL_RETURN' || activeTab === 'TRANSACTION_HISTORY') && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Transaksi</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Investasi / Mitra</th>
                  <th className="py-3 px-3">Jenis Transaksi</th>
                  <th className="py-3 px-3">Rekening Kas/Bank</th>
                  <th className="py-3 px-3">Periode / Ref</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3">No. Jurnal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Tidak ada transaksi pada kategori ini.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-slate-800">{tx.transactionNumber}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{tx.investeeName}</td>
                      <td className="py-3 px-3 text-xs text-slate-700 font-medium">{tx.type}</td>
                      <td className="py-3 px-3 text-xs text-slate-600">
                        {tx.bankName ? `${tx.bankName} (${tx.bankAccountNumber})` : tx.cashName || '-'}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 font-mono">{tx.period || tx.reference || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-slate-900">
                        {formatRupiah(tx.amount)}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-600">{tx.journalNumber || '-'}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 8: Reconciliation */}
          {activeTab === 'RECONCILIATION' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Rekonsiliasi</th>
                  <th className="py-3 px-3">Tanggal Posisi</th>
                  <th className="py-3 px-3">Investasi / Mitra</th>
                  <th className="py-3 px-3 text-right">Nilai Menurut Sistem</th>
                  <th className="py-3 px-3 text-right">Laporan Mitra</th>
                  <th className="py-3 px-3 text-right">Selisih</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Catatan Klarifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada rekonsiliasi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredReconciliations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono text-xs font-bold text-slate-800">{r.reconciliationNumber}</td>
                      <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">{r.asOfDate}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{r.investeeName}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-600">{formatRupiah(r.systemBookValue)}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold text-slate-900">{formatRupiah(r.investeeReportedValue)}</td>
                      <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                        <span className={Number(r.difference) !== 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatRupiah(r.difference)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 max-w-xs truncate">{r.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
