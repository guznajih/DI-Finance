import React, { useEffect, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Journal } from '../types/index.ts';

export const JournalsView: React.FC = () => {
  const { authFetch } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await authFetch(`/api/journals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJournals(data);
      }
    } catch (err) {
      console.error('Error fetching journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, [startDate, endDate]);

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const filtered = journals.filter((j) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = j.journalNumber.toLowerCase().includes(q);
      const matchDesc = j.description.toLowerCase().includes(q);
      if (!matchNum && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Buku Jurnal Umum (General Journal)
          </h1>
          <p className="text-xs text-gray-500">
            Daftar kronologis seluruh entri jurnal akuntansi sistem berpasangan (Double-Entry)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchJournals}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs min-w-[200px]">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor jurnal atau keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-gray-800"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <span>Periode:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none text-xs"
          />
          <span>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Journals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
            Memuat data jurnal umum...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
            Belum ada jurnal umum yang tercatat pada periode ini.
          </div>
        ) : (
          filtered.map((jrn) => (
            <div
              key={jrn.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition hover:border-emerald-300"
            >
              {/* Journal Card Header */}
              <div className="flex flex-col justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <BookOpenCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {jrn.journalNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          jrn.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {jrn.status}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle className="h-3 w-3" />
                        <span>Balanced</span>
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-800 mt-0.5">{jrn.description}</p>
                  </div>
                </div>

                <div className="mt-2 text-left sm:mt-0 sm:text-right text-xs">
                  <span className="text-gray-400">Tanggal Posting: </span>
                  <span className="font-semibold text-gray-700">{jrn.date}</span>
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/40 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-2.5">Kode & Nama Akun</th>
                      <th className="px-5 py-2.5">Unit / Divisi</th>
                      <th className="px-5 py-2.5">Sumber Dana</th>
                      <th className="px-5 py-2.5">Keterangan Baris</th>
                      <th className="px-5 py-2.5 text-right">Debit (Rp)</th>
                      <th className="px-5 py-2.5 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-mono text-[11px]">
                    {jrn.lines.map((line, idx) => {
                      const isDebit = Number(line.debit) > 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td
                            className={`px-5 py-2 font-sans ${
                              isDebit ? 'font-semibold text-gray-900' : 'pl-9 text-gray-700'
                            }`}
                          >
                            <span className="font-mono text-gray-500 mr-1.5">[{line.accountCode}]</span>
                            <span>{line.accountName}</span>
                          </td>
                          <td className="px-5 py-2 font-sans text-gray-600">
                            {line.unitName || '-'}
                          </td>
                          <td className="px-5 py-2 font-sans text-gray-600">
                            {line.fundName || 'Operasional'}
                          </td>
                          <td className="px-5 py-2 font-sans text-gray-500 max-w-xs truncate">
                            {line.description || '-'}
                          </td>
                          <td className="px-5 py-2 text-right font-medium text-gray-900">
                            {Number(line.debit) > 0 ? formatRupiah(line.debit) : '-'}
                          </td>
                          <td className="px-5 py-2 text-right font-medium text-gray-900">
                            {Number(line.credit) > 0 ? formatRupiah(line.credit) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Journal Balance Footer */}
                  <tfoot className="border-t border-gray-100 bg-gray-50/60 font-mono text-xs font-bold">
                    <tr>
                      <td colSpan={4} className="px-5 py-2.5 text-right font-sans text-gray-600">
                        Total Jurnal:
                      </td>
                      <td className="px-5 py-2.5 text-right text-emerald-900">
                        {formatRupiah(jrn.totalDebit)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-emerald-900">
                        {formatRupiah(jrn.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
