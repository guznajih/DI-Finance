import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle,
  Download,
  Filter,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Account, Fund, Journal, Unit } from '../types/index.ts';

interface JurnalLineForm {
  accountId: number;
  debit: string;
  credit: string;
  description: string;
}

export const JournalsView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for New Jurnal Umum
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [fundId, setFundId] = useState<string>('');
  const [statusTarget, setStatusTarget] = useState<'DRAFT' | 'POSTED'>('POSTED');

  const [lines, setLines] = useState<JurnalLineForm[]>([
    { accountId: 0, debit: '0', credit: '0', description: '' },
    { accountId: 0, debit: '0', credit: '0', description: '' },
  ]);

  const fetchMasterAndJournals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [jRes, aRes, uRes, fRes] = await Promise.all([
        authFetch(`/api/journals?${params.toString()}`),
        authFetch('/api/accounts'),
        authFetch('/api/units'),
        authFetch('/api/funds'),
      ]);

      if (jRes.ok) setJournals(await jRes.json());
      if (aRes.ok) {
        const accs: Account[] = await aRes.json();
        setAccounts(accs);
        if (accs.length >= 2 && lines[0].accountId === 0) {
          setLines([
            { accountId: accs[0].id, debit: '0', credit: '0', description: '' },
            { accountId: accs[1].id, debit: '0', credit: '0', description: '' },
          ]);
        }
      }
      if (uRes.ok) setUnits(await uRes.json());
      if (fRes.ok) setFunds(await fRes.json());
    } catch (err) {
      console.error('Error fetching journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterAndJournals();
  }, [startDate, endDate]);

  const formatRupiah = (val: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Calculations for form balance
  const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && difference < 0.01;

  const handleAddLine = () => {
    const defaultAccId = accounts.length > 0 ? accounts[0].id : 0;
    setLines([...lines, { accountId: defaultAccId, debit: '0', credit: '0', description: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: keyof JurnalLineForm, val: string | number) => {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setLines(updated);
  };

  const openCreateModal = () => {
    setFormError(null);
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setReference('');
    setAttachmentUrl('');
    setUnitId('');
    setFundId('');
    setStatusTarget('POSTED');
    if (accounts.length >= 2) {
      setLines([
        { accountId: accounts[0].id, debit: '0', credit: '0', description: '' },
        { accountId: accounts[1].id, debit: '0', credit: '0', description: '' },
      ]);
    }
    setModalOpen(true);
  };

  const handleSubmitJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError('Keterangan jurnal wajib diisi');
      return;
    }

    if (!isBalanced && statusTarget === 'POSTED') {
      setFormError(
        `Jurnal tidak balance! Total Debit (${formatRupiah(totalDebit)}) harus sama dengan Total Kredit (${formatRupiah(totalCredit)}). Selisih: ${formatRupiah(difference)}`
      );
      return;
    }

    // Validate account selection
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].accountId) {
        setFormError(`Baris #${i + 1}: Akun belum dipilih`);
        return;
      }
      const d = parseFloat(lines[i].debit) || 0;
      const c = parseFloat(lines[i].credit) || 0;
      if (d === 0 && c === 0) {
        setFormError(`Baris #${i + 1}: Nominal Debit atau Kredit harus lebih dari 0`);
        return;
      }
    }

    setFormLoading(true);
    try {
      const payload = {
        date,
        description,
        reference,
        attachmentUrl,
        unitId: unitId ? parseInt(unitId, 10) : null,
        fundId: fundId ? parseInt(fundId, 10) : null,
        status: statusTarget,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || description,
        })),
      };

      const res = await authFetch('/api/jurnal-umum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Gagal menyimpan Jurnal Umum');
      }

      setModalOpen(false);
      fetchMasterAndJournals();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan Jurnal Umum');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredJournals = journals.filter((j) => {
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
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <BookOpenCheck className="h-4 w-4" />
            <span>KEUANGAN → JURNAL UMUM</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Buku Jurnal Umum (General Journal)
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan transaksi akuntansi double-entry, penyesuaian memorial, serta validasi ketat Debit = Kredit
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Jurnal Umum</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak</span>
          </button>
          <button
            onClick={fetchMasterAndJournals}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 focus:outline-none"
          />
          <span>s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Journals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
            Memuat buku jurnal umum...
          </div>
        ) : filteredJournals.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-xs text-gray-400">
            Tidak ada jurnal yang sesuai dengan pencarian atau periode filter.
          </div>
        ) : (
          filteredJournals.map((journal) => (
            <div
              key={journal.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs"
            >
              {/* Journal Card Header */}
              <div className="flex flex-col justify-between border-b border-gray-100 bg-gray-50/60 p-4 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-emerald-900">
                      {journal.journalNumber}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        journal.status === 'POSTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {journal.status}
                    </span>
                    {journal.isBalanced && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                        Balanced ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{journal.description}</p>
                </div>

                <div className="mt-2 sm:mt-0 sm:text-right">
                  <span className="text-[11px] font-medium text-gray-500">
                    Tanggal: <strong className="text-gray-800">{journal.date}</strong>
                  </span>
                  <div className="text-[11px] text-gray-400">
                    Total: {formatRupiah(journal.totalDebit)}
                  </div>
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                    <tr>
                      <th className="px-4 py-2 w-12 text-center">#</th>
                      <th className="px-4 py-2">Kode & Nama Akun</th>
                      <th className="px-4 py-2">Keterangan Baris</th>
                      <th className="px-4 py-2">Unit / Dana</th>
                      <th className="px-4 py-2 text-right">Debit (Rp)</th>
                      <th className="px-4 py-2 text-right">Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {journal.lines.map((line, idx) => {
                      const isCredit = Number(line.credit) > 0;
                      return (
                        <tr key={line.id || idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2 text-center font-mono text-[11px] text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2">
                            <div className={`${isCredit ? 'pl-6' : ''}`}>
                              <span className="font-mono font-bold text-gray-700">
                                {line.accountCode}
                              </span>{' '}
                              - <span className="text-gray-900 font-medium">{line.accountName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-gray-500 max-w-xs truncate">
                            {line.description || '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-500 whitespace-nowrap text-[11px]">
                            {line.unitName || line.fundName || '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-medium text-gray-900">
                            {Number(line.debit) > 0 ? formatRupiah(line.debit) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-medium text-gray-900">
                            {Number(line.credit) > 0 ? formatRupiah(line.credit) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-gray-200 bg-gray-50/70 font-mono text-xs font-bold text-gray-900">
                    <tr>
                      <td colSpan={4} className="px-4 py-2.5 text-right font-sans font-bold">
                        TOTAL KESEIMBANGAN:
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-800">
                        {formatRupiah(journal.totalDebit)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-800">
                        {formatRupiah(journal.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Buat Jurnal Umum Baru */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Entri Jurnal Umum Baru</h3>
                <p className="text-xs text-gray-500">
                  Pencatatan memorial berpasangan dengan validasi ketat Debit = Kredit
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitJournal} className="mt-4 space-y-4">
              {/* Top Row Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    TANGGAL TRANSAKSI *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    KETERANGAN JURNAL *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penyesuaian akhir bulan, depresiasi, memorial..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Second Row: Unit, Fund, Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    UNIT / DIVISI
                  </label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="">-- Tidak Terikat Unit Tertentu --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    SUMBER DANA
                  </label>
                  <select
                    value={fundId}
                    onChange={(e) => setFundId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="">-- Tidak Terikat Dana Tertentu --</option>
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} - {f.name} ({f.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    STATUS ENTRY
                  </label>
                  <select
                    value={statusTarget}
                    onChange={(e: any) => setStatusTarget(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
                  >
                    <option value="POSTED">POSTING SEGERA (Balance Wajib)</option>
                    <option value="DRAFT">SIMPAN SEBAGAI DRAFT</option>
                  </select>
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Pos Akun Jurnal (Minimal 2 Baris: Debit & Kredit)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center space-x-1 text-xs font-bold text-emerald-800 hover:text-emerald-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase font-bold text-gray-600">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center">#</th>
                        <th className="px-3 py-2 min-w-[200px]">Akun Perkiraan *</th>
                        <th className="px-3 py-2 min-w-[150px]">Keterangan Baris</th>
                        <th className="px-3 py-2 min-w-[120px] text-right">Debit (Rp)</th>
                        <th className="px-3 py-2 min-w-[120px] text-right">Kredit (Rp)</th>
                        <th className="px-3 py-2 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-center text-gray-400 font-mono">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={line.accountId}
                              onChange={(e) =>
                                handleLineChange(index, 'accountId', parseInt(e.target.value, 10))
                              }
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs font-medium text-gray-800 focus:outline-none"
                            >
                              <option value={0}>-- Pilih Akun --</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} - {a.name} ({a.category})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="Keterangan rincian (opsional)"
                              value={line.description}
                              onChange={(e) =>
                                handleLineChange(index, 'description', e.target.value)
                              }
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.debit}
                              onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-right font-mono text-xs font-bold text-gray-800 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.credit}
                              onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-right font-mono text-xs font-bold text-gray-800 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(index)}
                              disabled={lines.length <= 2}
                              className="rounded p-1 text-gray-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200 bg-gray-50 font-mono text-xs">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-right font-sans font-bold">
                          TOTAL DEBIT & KREDIT:
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-800">
                          {formatRupiah(totalDebit)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-800">
                          {formatRupiah(totalCredit)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Balance Notification Banner */}
                <div
                  className={`mt-2 flex items-center justify-between rounded-xl p-3 text-xs font-semibold ${
                    isBalanced
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isBalanced ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>
                      {isBalanced
                        ? 'JURNAL SEIMBANG (DEBIT = KREDIT) - Siap diposting ke Buku Besar.'
                        : `TIDAK SEIMBANG! Selisih: ${formatRupiah(difference)}. Sistem menolak posting jika tidak balance.`}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    Selisih: {formatRupiah(difference)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading || (!isBalanced && statusTarget === 'POSTED')}
                  className="rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan & Posting Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
