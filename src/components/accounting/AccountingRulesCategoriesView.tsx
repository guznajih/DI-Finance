import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  BookOpen,
  Plus,
  Edit,
  CheckCircle,
  HelpCircle,
  X,
  Search,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AccountingRulesCategoriesView: React.FC = () => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'RULES' | 'CATEGORIES'>('RULES');
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Explanation Modal
  const [explainModalRule, setExplainModalRule] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [explaining, setExplaining] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes, aRes] = await Promise.all([
        authFetch('/api/fase7/rules'),
        authFetch('/api/fase7/categories'),
        authFetch('/api/accounts'),
      ]);

      if (rRes.ok) setRules(await rRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (aRes.ok) setAccounts(await aRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (rule: any) => {
    setExplainModalRule(rule);
    setExplaining(true);
    setExplanation(null);
    try {
      const res = await authFetch('/api/fase7/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleCode: rule.ruleCode,
          transactionType: rule.transactionType,
          amount: 5000000,
        }),
      });
      if (res.ok) {
        setExplanation(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Konfigurasi Master Akuntansi
            </span>
            <span className="text-xs text-gray-500">
              Aturan Transaksi Otomatis Terhubung COA
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
            Aturan Akuntansi & Master Kategori
          </h1>
          <p className="text-xs text-gray-500">
            Konfigurasi template aturan debit-kredit dan kategori transaksi operasional pesantren.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('RULES')}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === 'RULES'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Database Aturan Akuntansi ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === 'CATEGORIES'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kategori Transaksi ({categories.length})
          </button>
        </div>
      </div>

      {/* TAB 1: ACCOUNTING RULES */}
      {activeTab === 'RULES' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Daftar Aturan Debit & Kredit Otomatis
            </h2>
            <span className="text-xs text-gray-400">
              Semua aturan mengikat Account ID / COA sebenarnya
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Kode & Nama Aturan</th>
                  <th className="px-4 py-3">Jenis Transaksi</th>
                  <th className="px-4 py-3">Debit (Akun Bertambah)</th>
                  <th className="px-4 py-3">Kredit (Akun Berkurang)</th>
                  <th className="px-4 py-3 text-right">Edukasi Akuntansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div>
                        <span className="font-bold">{r.name}</span>
                        <div className="text-[10px] text-gray-400 font-mono">{r.ruleCode}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                        {r.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-900 font-mono text-[11px] font-bold">
                        {r.debitAccountCode ? `${r.debitAccountCode} - ${r.debitAccountName}` : 'Kas / Bank Terpilih'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-purple-900 font-mono text-[11px] font-bold">
                        {r.creditAccountCode ? `${r.creditAccountCode} - ${r.creditAccountName}` : 'Kas / Bank Terpilih'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleExplain(r)}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                      >
                        Kenapa jurnalnya begini?
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTION CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Master Kategori Pendapatan & Pengeluaran
            </h2>
            <span className="text-xs text-gray-400">
              Dihubungkan ke COA untuk penentuan pos otomatis
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Nama Kategori</th>
                  <th className="px-4 py-3">Klasifikasi</th>
                  <th className="px-4 py-3">Pos Akun COA Terkait</th>
                  <th className="px-4 py-3">Catatan Pencegahan Salah Klasifikasi</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
                        c.type === 'PENDAPATAN'
                          ? 'bg-teal-100 text-teal-800'
                          : c.type === 'PENGELUARAN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {c.accountCode ? `${c.accountCode} - ${c.accountName}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {c.warningNotice || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        AKTIF
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanation Modal */}
      {explainModalRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {explainModalRule.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Penjelasan Logika Debit / Kredit Berdasarkan Kaidah Akuntansi
                </p>
              </div>
              <button
                onClick={() => setExplainModalRule(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {explaining ? (
              <p className="text-center py-6 text-xs text-gray-500">Memuat penjelasan...</p>
            ) : explanation ? (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <span className="font-bold text-emerald-950">Ringkasan Sederhana:</span>
                  <p className="mt-1 text-emerald-900 leading-relaxed font-medium">
                    {explanation.summaryText}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-gray-700">Kaidah Akuntansi:</span>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    {explanation.plainReasons?.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <span className="font-bold text-gray-800">Ilustrasi Jurnal:</span>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-blue-900">
                      <span>Debit: {explanation.debitAccountName || 'Akun Terkait'}</span>
                      <span>Rp 5.000.000</span>
                    </div>
                    <div className="flex justify-between text-purple-900 pl-4">
                      <span>Kredit: {explanation.creditAccountName || 'Akun Terkait'}</span>
                      <span>Rp 5.000.000</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Penjelasan tidak tersedia.</p>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setExplainModalRule(null)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
