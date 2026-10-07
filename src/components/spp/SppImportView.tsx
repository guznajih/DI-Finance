import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  RefreshCw,
  Upload,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ViewType } from '../Sidebar.tsx';

interface SppImportViewProps {
  setCurrentView?: (v: ViewType) => void;
}

export const SppImportView: React.FC<SppImportViewProps> = ({ setCurrentView }) => {
  const { authFetch, user } = useAuth();

  // Workflow steps: 1: UPLOAD, 2: PREVIEW & VALIDATE, 3: RESULT
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [commitLoading, setCommitLoading] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState<boolean>(false);

  const sampleTemplate = `Tanggal,Periode,Tahun Ajaran,Unit,Rekening,Nominal,Jumlah Pembayaran,Referensi,Keterangan
2026-10-01,Oktober 2026,2026/2027,MTs,Bank Syariah Indonesia,45000000,150,VA-MTS-202610-01,Penerimaan SPP Gelombang 1 MTs
2026-10-02,Oktober 2026,2026/2027,MA,Bank Syariah Indonesia,38000000,120,VA-MA-202610-01,Penerimaan SPP Gelombang 1 MA
2026-10-03,Oktober 2026,2026/2027,Tahfidz,Bank Muamalat,18000000,60,VA-THF-202610-01,Penerimaan SPP Gelombang 1 Tahfidz`;

  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Import_SPP_Agregat.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
    };
    reader.readAsText(file);
  };

  const parseCsvToObjects = (text: string) => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (currentline.length < 3) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = currentline[idx] || '';
        if (h.includes('tanggal') || h.includes('date')) obj.date = val;
        else if (h.includes('periode') || h.includes('period')) obj.period = val;
        else if (h.includes('tahun') || h.includes('ajaran') || h.includes('academic')) obj.academicYear = val;
        else if (h.includes('unit')) obj.unit = val;
        else if (h.includes('rekening') || h.includes('bank') || h.includes('kas')) obj.account = val;
        else if (h.includes('nominal') || h.includes('amount')) obj.amount = val;
        else if (h.includes('pembayaran') || h.includes('santri') || h.includes('count')) obj.paymentCount = val;
        else if (h.includes('referensi') || h.includes('ref')) obj.reference = val;
        else if (h.includes('keterangan') || h.includes('desc')) obj.description = val;
      });

      rows.push(obj);
    }
    return rows;
  };

  const handleProcessPreview = async () => {
    setError(null);
    if (!rawText.trim()) {
      setError('Silakan pilih file CSV/Excel atau tempelkan data terlebih dahulu.');
      return;
    }

    const parsedRows = parseCsvToObjects(rawText);
    if (parsedRows.length === 0) {
      setError('Format CSV tidak valid atau baris data kosong.');
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await authFetch('/api/spp/import-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pratinjau import');

      setPreviewData(data);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses data import');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) return;
    setError(null);
    setCommitLoading(true);

    try {
      const res = await authFetch('/api/spp/import-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: previewData.validRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hasil import');

      setCommitResult(data);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan batch import SPP');
    } finally {
      setCommitLoading(false);
    }
  };

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
          <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
            <UploadCloud className="h-4 w-4" />
            <span>SPP → IMPORT REKAPITULASI (CSV / EXCEL)</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Import Batch Penerimaan SPP
          </h1>
          <p className="text-xs text-gray-500">
            Import data agregat pembayaran dari bank virtual account atau file laporan aplikasi SPP eksternal
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={downloadSampleTemplate}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Template CSV</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Wizard Steps */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 1 ? 'text-teal-900' : 'text-gray-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? 'bg-teal-800 text-white' : 'bg-gray-200'}`}>
            1
          </span>
          <span>Upload File / Teks</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-4" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step >= 2 ? 'text-teal-900' : 'text-gray-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? 'bg-teal-800 text-white' : 'bg-gray-200'}`}>
            2
          </span>
          <span>Pratinjau & Validasi Duplikat</span>
        </div>
        <div className="h-0.5 flex-1 bg-gray-200 mx-4" />
        <div className={`flex items-center space-x-2 text-xs font-bold ${step === 3 ? 'text-teal-900' : 'text-gray-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 3 ? 'bg-teal-800 text-white' : 'bg-gray-200'}`}>
            3
          </span>
          <span>Posting Jurnal Berhasil</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD & INPUT */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">1. Unggah File Rekap SPP</h2>
            
            {/* Dropzone */}
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-teal-500 bg-gray-50/50 transition">
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-700">
                Pilih file CSV / Excel rekap dari komputer Anda
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Format yang didukung: .csv, .txt (kolom dipisahkan tanda koma)
              </p>
              <label className="mt-4 cursor-pointer rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700">
                <span>Pilih File</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <span className="mt-2 text-xs font-medium text-emerald-800">
                  File terpilih: <strong>{fileName}</strong>
                </span>
              )}
            </div>

            {/* Paste alternative */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-600">
                  ATAU TEMPEL KONTEN CSV DI SINI:
                </label>
                <button
                  type="button"
                  onClick={() => setRawText(sampleTemplate)}
                  className="text-[11px] font-semibold text-teal-800 hover:underline"
                >
                  Gunakan Contoh Data Demo
                </button>
              </div>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Tanggal,Periode,Tahun Ajaran,Unit,Rekening,Nominal,Jumlah Pembayaran,Referensi,Keterangan..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProcessPreview}
                disabled={previewLoading || !rawText.trim()}
                className="flex items-center space-x-2 rounded-xl bg-teal-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50"
              >
                {previewLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Memvalidasi Data...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjutkan ke Pratinjau</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & VALIDATION */}
      {step === 2 && previewData && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-gray-500">Total Baris File</span>
              <p className="mt-1 font-mono text-lg font-bold text-gray-900">{previewData.totalRows}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <span className="text-xs text-emerald-800 font-medium">Siap Diposting</span>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-900">{previewData.validRows.length} Baris</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <span className="text-xs text-amber-800 font-medium">Peringatan Duplikat</span>
              <p className="mt-1 font-mono text-lg font-bold text-amber-900">{previewData.duplicateWarnings.length} Baris</p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
              <span className="text-xs text-teal-800 font-medium">Total Nominal Diimpor</span>
              <p className="mt-1 font-mono text-lg font-bold text-teal-950">{formatRupiah(previewData.totalAmount)}</p>
            </div>
          </div>

          {/* Duplicate Warnings Banner if Any */}
          {previewData.duplicateWarnings.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                <span>Terdeteksi {previewData.duplicateWarnings.length} data dengan kriteria yang mirip transaksi sebelumnya:</span>
              </div>
              <ul className="list-disc pl-6 space-y-1 text-amber-900">
                {previewData.duplicateWarnings.map((d: any, idx: number) => (
                  <li key={idx}>
                    Baris #{d.lineNo}: Periode "{d.period}" - Unit "{d.unitName}" - Nominal {formatRupiah(d.amount)}
                  </li>
                ))}
              </ul>
              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="confirmDup"
                  checked={confirmedDuplicate}
                  onChange={(e) => setConfirmedDuplicate(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-0 h-4 w-4"
                />
                <label htmlFor="confirmDup" className="font-semibold cursor-pointer">
                  Saya telah memeriksa dan mengonfirmasi bahwa baris di atas adalah sah dan tetap ingin mengimpornya.
                </label>
              </div>
            </div>
          )}

          {/* Invalid Rows if Any */}
          {previewData.invalidRows.length > 0 && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <XCircle className="h-5 w-5 text-rose-700" />
                <span>Terdapat {previewData.invalidRows.length} baris tidak valid yang akan dilewati:</span>
              </div>
              <div className="space-y-1">
                {previewData.invalidRows.map((inv: any, idx: number) => (
                  <p key={idx} className="font-mono text-[11px] text-rose-900">
                    • Baris #{inv.lineNo}: {inv.errors.join(', ')}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-xs text-gray-800 uppercase">
                Pratinjau Data yang Akan Diposting ke Akuntansi
              </h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Periode</th>
                  <th className="p-3">Tahun Ajaran</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Rekening Bank</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-center">Jml Santri</th>
                  <th className="p-3">Status Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {previewData.validRows.map((row: any) => (
                  <tr key={row.lineNo} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-400 font-mono">{row.lineNo}</td>
                    <td className="p-3 text-gray-600">{row.date}</td>
                    <td className="p-3 font-semibold text-gray-900">{row.period}</td>
                    <td className="p-3 text-gray-500">{row.academicYear}</td>
                    <td className="p-3 text-emerald-800 font-semibold">{row.unitName}</td>
                    <td className="p-3 text-gray-700">{row.bankOrCashName}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-900">{formatRupiah(row.amount)}</td>
                    <td className="p-3 text-center font-mono">{row.paymentCount || '-'}</td>
                    <td className="p-3">
                      {row.isDuplicate ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          ⚠ Duplikat Mirip
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          ✓ Valid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Confirmation */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              ← Kembali ke Upload
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={
                commitLoading ||
                previewData.validRows.length === 0 ||
                (previewData.duplicateWarnings.length > 0 && !confirmedDuplicate)
              }
              className="flex items-center space-x-2 rounded-xl bg-teal-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commitLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Memposting Jurnal Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Konfirmasi & Simpan ke Jurnal Akuntansi</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === 3 && commitResult && (
        <div className="rounded-2xl border border-emerald-300 bg-white p-8 shadow-xs text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Batch Import Penerimaan SPP Berhasil Diposting!
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Sebanyak <strong>{commitResult.importedCount}</strong> transaksi SPP agregat dengan total{' '}
              <strong>{formatRupiah(commitResult.totalImportedAmount)}</strong> telah resmi masuk ke Buku Bank, Jurnal Umum, dan Buku Besar.
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <button
              onClick={() => {
                setStep(1);
                setRawText('');
                setFileName('');
                setPreviewData(null);
                setCommitResult(null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Import File Lain
            </button>
            {setCurrentView && (
              <button
                onClick={() => setCurrentView('spp-rekap')}
                className="rounded-xl bg-teal-800 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                Lihat Rekapitulasi SPP →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
