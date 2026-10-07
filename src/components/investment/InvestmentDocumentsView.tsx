import React, { useEffect, useState } from 'react';
import {
  FileText,
  PlusCircle,
  ExternalLink,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  Paperclip,
  UploadCloud,
  FileCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Investment, InvestmentDocument, InvestmentDocumentType } from '../../types/index.ts';

export const InvestmentDocumentsView: React.FC = () => {
  const { user, authFetch } = useAuth();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [documents, setDocuments] = useState<InvestmentDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters
  const [filterInvestmentId, setFilterInvestmentId] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    investmentId: '',
    documentType: 'PERJANJIAN' as InvestmentDocumentType,
    title: '',
    fileUrl: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, docRes] = await Promise.all([
        authFetch('/api/investments'),
        authFetch(`/api/investment-documents${filterInvestmentId ? `?investmentId=${filterInvestmentId}` : ''}`),
      ]);

      if (invRes.ok) setInvestments(await invRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat dokumen' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterInvestmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investmentId || !formData.title || !formData.fileUrl) {
      setFeedback({ type: 'error', message: 'Pilih investasi, masukkan judul dan link berkas dokumen' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await authFetch('/api/investment-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investmentId: parseInt(formData.investmentId, 10),
          documentType: formData.documentType,
          title: formData.title,
          fileUrl: formData.fileUrl,
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan dokumen');

      setFeedback({
        type: 'success',
        message: `Dokumen "${data.title}" berhasil diarsipkan dan terhubung dengan investasi!`,
      });

      setModalOpen(false);
      setFormData({
        investmentId: '',
        documentType: 'PERJANJIAN',
        title: '',
        fileUrl: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getDocTypeBadge = (t: InvestmentDocumentType) => {
    const map: Record<InvestmentDocumentType, { label: string; cls: string }> = {
      PERJANJIAN: { label: 'Perjanjian / Akad', cls: 'bg-emerald-100 text-emerald-800' },
      BUKTI_TRANSFER: { label: 'Bukti Transfer Modal', cls: 'bg-blue-100 text-blue-800' },
      LAPORAN_KEUANGAN_MITRA: { label: 'Laporan Mitra', cls: 'bg-purple-100 text-purple-800' },
      BUKTI_BAGI_HASIL: { label: 'Bukti Bagi Hasil', cls: 'bg-amber-100 text-amber-800' },
      BUKTI_PENGEMBALIAN: { label: 'Bukti Pengembalian', cls: 'bg-teal-100 text-teal-800' },
      LAINNYA: { label: 'Dokumen Lainnya', cls: 'bg-slate-100 text-slate-800' },
    };
    const b = map[t] || { label: t, cls: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${b.cls}`}>
        {b.label}
      </span>
    );
  };

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(q) ||
      (doc.investeeName && doc.investeeName.toLowerCase().includes(q)) ||
      (doc.investmentNumber && doc.investmentNumber.toLowerCase().includes(q)) ||
      (doc.notes && doc.notes.toLowerCase().includes(q));

    const matchesType = !filterDocType || doc.documentType === filterDocType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-700" />
            Dokumen & Berkas Investasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Arsip terpusat perjanjian akad, bukti transfer, laporan keuangan mitra, tanda terima bagi hasil, dan pengembalian modal.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95"
        >
          <UploadCloud className="h-4 w-4" />
          Unggah / Catat Dokumen Baru
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline ml-4">
            Tutup
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul, nama mitra, no. investasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={filterInvestmentId}
              onChange={(e) => setFilterInvestmentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">Semua Portofolio Investasi</option>
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.investmentNumber} - {inv.investeeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-700"
            >
              <option value="">Semua Tipe Dokumen</option>
              <option value="PERJANJIAN">Perjanjian / Akad</option>
              <option value="BUKTI_TRANSFER">Bukti Transfer Modal</option>
              <option value="LAPORAN_KEUANGAN_MITRA">Laporan Keuangan Mitra</option>
              <option value="BUKTI_BAGI_HASIL">Bukti Penerimaan Bagi Hasil</option>
              <option value="BUKTI_PENGEMBALIAN">Bukti Pengembalian Modal</option>
              <option value="LAINNYA">Dokumen Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Judul Dokumen</th>
                <th className="py-3 px-4">Tipe Berkas</th>
                <th className="py-3 px-4">Investasi / Mitra</th>
                <th className="py-3 px-4">Pengunggah</th>
                <th className="py-3 px-4">Tanggal Arsip</th>
                <th className="py-3 px-4 text-center">Tautan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Memuat berkas dokumen...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Belum ada dokumen investasi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                        <div>
                          <span>{doc.title}</span>
                          {doc.notes && <p className="text-xs text-slate-500 font-normal">{doc.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getDocTypeBadge(doc.documentType)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{doc.investeeName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{doc.investmentNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {doc.uploaderName || 'Petugas'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        Buka <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Input Dokumen */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-700" />
              Catat Dokumen Investasi Baru
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hubungkan berkas fisik / digital dengan portofolio investasi terkait.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Pilih Investasi / Mitra *
                </label>
                <select
                  required
                  value={formData.investmentId}
                  onChange={(e) => setFormData({ ...formData, investmentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- Pilih Investasi --</option>
                  {investments.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.investmentNumber} - {inv.investeeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jenis Dokumen *
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PERJANJIAN">Perjanjian / Akad Notaris / Kontrak</option>
                  <option value="BUKTI_TRANSFER">Bukti Transfer Penempatan Modal</option>
                  <option value="LAPORAN_KEUANGAN_MITRA">Laporan Keuangan / Neraca Mitra</option>
                  <option value="BUKTI_BAGI_HASIL">Bukti Penerimaan / Slip Bagi Hasil</option>
                  <option value="BUKTI_PENGEMBALIAN">Bukti Pengembalian Pokok Modal</option>
                  <option value="LAINNYA">Dokumen Pendukung Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Dokumen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Akad Mudharabah No. 12/NOT/2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Link / URL Berkas Dokumen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/... atau link berkas"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan / Keterangan Berkas
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pasal, batas waktu berlaku, catatan notaris..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
