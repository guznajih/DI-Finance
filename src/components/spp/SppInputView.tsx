import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Coins,
  GraduationCap,
  Landmark,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BankAccount, CashAccount, Unit } from '../../types/index.ts';
import { ViewType } from '../Sidebar.tsx';

interface SppInputViewProps {
  setCurrentView?: (v: ViewType) => void;
}

export const SppInputView: React.FC<SppInputViewProps> = ({ setCurrentView }) => {
  const { authFetch, user } = useAuth();

  const [units, setUnits] = useState<Unit[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [cashList, setCashList] = useState<CashAccount[]>([]);
  const [loadingMaster, setLoadingMaster] = useState<boolean>(true);

  // Form Fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('Oktober 2026');
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [unitId, setUnitId] = useState<string>('');
  const [cashBankType, setCashBankType] = useState<'KAS' | 'BANK'>('BANK');
  const [cashBankId, setCashBankId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentCount, setPaymentCount] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('Aplikasi SPP');
  const [reference, setReference] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');

  // Status & Confirmation
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Role authorization check
  const isAllowedToInput =
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'BENDAHARA' ||
    user?.roleName === 'PETUGAS_KEUANGAN';

  const fetchMaster = async () => {
    setLoadingMaster(true);
    try {
      const [uRes, bRes, cRes] = await Promise.all([
        authFetch('/api/units'),
        authFetch('/api/bank-accounts'),
        authFetch('/api/cash-accounts'),
      ]);

      if (uRes.ok) {
        const uList: Unit[] = await uRes.json();
        setUnits(uList);
        if (uList.length > 0) setUnitId(String(uList[0].id));
      }
      if (bRes.ok) {
        const bList: BankAccount[] = await bRes.json();
        setBanks(bList);
        if (bList.length > 0) setCashBankId(String(bList[0].id));
      }
      if (cRes.ok) {
        setCashList(await cRes.json());
      }
    } catch (e) {
      console.error('Error fetching master in SppInput:', e);
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    fetchMaster();
  }, []);

  const formatRupiah = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const handleDuplicateCheckAndSubmit = async (e: React.FormEvent, skipCheck = false) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Nominal penerimaan SPP harus lebih dari Rp 0.');
      return;
    }

    if (!unitId || !cashBankId) {
      setError('Unit pendidikan dan rekening tujuan wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. If not skipping check, perform duplicate probe
      if (!skipCheck) {
        const dupRes = await authFetch('/api/spp/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period,
            academicYear,
            unitId: parseInt(unitId, 10),
            amount: numAmount,
            reference,
          }),
        });

        if (dupRes.ok) {
          const dupData = await dupRes.json();
          if (dupData.isDuplicate) {
            setDuplicateWarning(dupData);
            setShowDuplicateModal(true);
            setSubmitting(false);
            return;
          }
        }
      }

      // 2. Perform actual creation & double-entry posting
      const res = await authFetch('/api/spp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          period,
          academicYear,
          unitId: parseInt(unitId, 10),
          cashBankType,
          cashBankId: parseInt(cashBankId, 10),
          amount: numAmount,
          paymentCount: paymentCount ? parseInt(paymentCount, 10) : 0,
          dataSource,
          reference,
          description: description || `Penerimaan SPP Agregat Periode ${period} (${academicYear})`,
          attachmentUrl,
          status: 'POSTED',
          skipDuplicateCheck: skipCheck,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 409 && resData.isDuplicate) {
          setDuplicateWarning(resData);
          setShowDuplicateModal(true);
          return;
        }
        throw new Error(resData.error || 'Gagal menyimpan penerimaan SPP');
      }

      setSuccessResult(resData);
      setShowDuplicateModal(false);
      setDuplicateWarning(null);
      // Reset amount and reference
      setAmount('');
      setPaymentCount('');
      setReference('');
      setDescription('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses penerimaan SPP');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTargetName =
    cashBankType === 'BANK'
      ? banks.find((b) => String(b.id) === cashBankId)?.bankName || 'Rekening Bank'
      : cashList.find((c) => String(c.id) === cashBankId)?.name || 'Kas Tunai';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <GraduationCap className="h-4 w-4" />
            <span>SPP → INPUT PENERIMAAN AGREGAT</span>
          </div>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
            Input Penerimaan SPP Agregat
          </h1>
          <p className="text-xs text-gray-500">
            Pencatatan total penerimaan SPP dari sistem eksternal tanpa data nama santri individu
          </p>
        </div>

        {setCurrentView && (
          <button
            onClick={() => setCurrentView('spp-rekap')}
            className="flex items-center space-x-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>Lihat Daftar Rekap SPP</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Notice */}
      {!isAllowedToInput && (
        <div className="flex items-center space-x-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          <ShieldAlert className="h-5 w-5 text-amber-700 flex-shrink-0" />
          <div>
            <strong className="block font-bold">Batasan Akses Role:</strong>
            <span>
              Role Anda saat ini ({user?.roleName || 'PENGGUNA'}) hanya memiliki hak akses melihat (*read-only*). Penginputan dan posting jurnal SPP hanya dapat dilakukan oleh <strong>Super Admin, Bendahara, atau Petugas Keuangan</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {successResult && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-xs text-emerald-950">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                Penerimaan SPP Agregat Berhasil Diposting ke Akuntansi!
              </h3>
              <p className="text-xs text-emerald-900">
                Data rekapitulasi tersimpan dengan nomor <strong>{successResult.rekapNumber}</strong>. Sistem telah otomatis membuat jurnal akuntansi double-entry yang seimbang.
              </p>
              <div className="mt-3 rounded-xl bg-white/80 p-3 border border-emerald-200 text-xs font-mono space-y-1">
                <div>• No. Jurnal: <strong>{successResult.journal?.journalNumber || '-'}</strong></div>
                <div>• DEBIT: <strong>{selectedTargetName}</strong> = {formatRupiah(successResult.amount)}</div>
                <div>• KREDIT: <strong>4110 - Pendapatan SPP (Rekap Agregat)</strong> = {formatRupiah(successResult.amount)}</div>
                <div>• Status Jurnal: <strong className="text-emerald-700">POSTED (Balance ✓)</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Input Form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
        <form onSubmit={(e) => handleDuplicateCheckAndSubmit(e, false)} className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Formulir Rekapitulasi SPP</h2>
            <p className="text-xs text-gray-500">
              Pastikan nominal dan rekening tujuan sesuai dengan mutasi rekening bank pondok pesantren
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {/* Tanggal Penerimaan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                TANGGAL PENERIMAAN *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
              />
            </div>

            {/* Periode SPP */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                PERIODE BULAN SPP *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                <option value="Juli 2026">Juli 2026</option>
                <option value="Agustus 2026">Agustus 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="Desember 2026">Desember 2026</option>
                <option value="Januari 2027">Januari 2027</option>
                <option value="Februari 2027">Februari 2027</option>
                <option value="Maret 2027">Maret 2027</option>
                <option value="April 2027">April 2027</option>
                <option value="Mei 2027">Mei 2027</option>
                <option value="Juni 2027">Juni 2027</option>
              </select>
            </div>

            {/* Tahun Ajaran */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                TAHUN AJARAN *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
              </select>
            </div>

            {/* Unit Pendidikan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                UNIT PENDIDIKAN *
              </label>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.code} - {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Akun Penerima: Bank / Kas */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                JENIS REKENING TUJUAN *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCashBankType('BANK');
                    if (banks.length > 0) setCashBankId(String(banks[0].id));
                  }}
                  className={`flex items-center justify-center space-x-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    cashBankType === 'BANK'
                      ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <Landmark className="h-4 w-4" />
                  <span>Rekening Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashBankType('KAS');
                    if (cashList.length > 0) setCashBankId(String(cashList[0].id));
                  }}
                  className={`flex items-center justify-center space-x-1.5 rounded-xl border py-2.5 text-xs font-bold transition ${
                    cashBankType === 'KAS'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  <span>Kas Tunai</span>
                </button>
              </div>
            </div>

            {/* Pilihan Rekening */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                PILIH {cashBankType === 'BANK' ? 'BANK' : 'KAS'} PENERIMA *
              </label>
              <select
                required
                value={cashBankId}
                onChange={(e) => setCashBankId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                {cashBankType === 'BANK' ? (
                  banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({formatRupiah(b.currentBalance)})
                    </option>
                  ))
                ) : (
                  cashList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatRupiah(c.currentBalance)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Nominal SPP */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                TOTAL NOMINAL REKAP SPP (RP) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="Contoh: 150000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-mono text-sm font-bold text-emerald-950 focus:outline-none"
              />
              {amount && (
                <span className="block mt-1 font-mono text-[11px] text-emerald-700 font-bold">
                  {formatRupiah(amount)}
                </span>
              )}
            </div>

            {/* Jumlah Transaksi Santri (Opsional) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                JUMLAH TRANSAKSI SANTRI (OPSIONAL)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 300"
                value={paymentCount}
                onChange={(e) => setPaymentCount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 font-mono text-xs text-gray-800 focus:outline-none"
              />
              <span className="block mt-1 text-[10px] text-gray-400">
                Jumlah pembayaran santri pada aplikasi eksternal
              </span>
            </div>

            {/* Sumber Data */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                SUMBER DATA *
              </label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none"
              >
                <option value="Aplikasi SPP">Aplikasi SPP Eksternal</option>
                <option value="Bank Virtual Account BSI">Bank Virtual Account BSI</option>
                <option value="Virtual Account Muamalat">Virtual Account Muamalat</option>
                <option value="Kasir Kantor Pondok">Kasir Kantor Pondok (Manual)</option>
                <option value="Import Rekap File">Import Rekap File</option>
              </select>
            </div>

            {/* Nomor Referensi / Batch */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                NOMOR REFERENSI / BATCH
              </label>
              <input
                type="text"
                placeholder="Contoh: BATCH-SPP-202610-01"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
              />
            </div>

            {/* Keterangan */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                KETERANGAN TRANSAKSI
              </label>
              <input
                type="text"
                placeholder="Contoh: Penerimaan SPP Agregat Santri MTs Bulan Oktober 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Double-Entry Preview Box */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-950">
              <BookOpenCheck className="h-4 w-4 text-emerald-700" />
              <span>Pratinjau Jurnal Otomatis yang Akan Dibuat:</span>
            </span>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-xl bg-white p-2.5 border border-emerald-200">
                <span className="text-gray-500 block text-[10px]">POSISI DEBIT:</span>
                <span className="font-bold text-gray-900">{selectedTargetName}</span>
                <span className="block text-emerald-800 font-extrabold mt-0.5">
                  {amount ? formatRupiah(amount) : 'Rp 0'}
                </span>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-emerald-200">
                <span className="text-gray-500 block text-[10px]">POSISI KREDIT:</span>
                <span className="font-bold text-gray-900">4110 - Pendapatan SPP (Rekap Agregat)</span>
                <span className="block text-emerald-800 font-extrabold mt-0.5">
                  {amount ? formatRupiah(amount) : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAmount('');
                setReference('');
                setDescription('');
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting || !isAllowedToInput}
              className="flex items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Memproses Jurnal...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Simpan & Posting Jurnal SPP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* DUPLICATE WARNING MODAL */}
      {showDuplicateModal && duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-800">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  Peringatan Kemungkinan Transaksi SPP Duplikat!
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Sistem mendeteksi transaksi SPP dengan kriteria serupa yang sudah pernah dicatat sebelumnya.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs space-y-1.5">
              <p className="font-bold text-amber-950">Detail Transaksi Sebelumnya:</p>
              <div className="font-mono text-[11px] text-amber-900 space-y-0.5">
                <div>• No. Rekap: <strong>{duplicateWarning.details?.rekapNumber || duplicateWarning.matchedRecord?.rekapNumber}</strong></div>
                <div>• Periode: <strong>{duplicateWarning.details?.period || duplicateWarning.matchedRecord?.period}</strong></div>
                <div>• Tahun Ajaran: <strong>{duplicateWarning.details?.academicYear || duplicateWarning.matchedRecord?.academicYear}</strong></div>
                <div>• Nominal: <strong>{formatRupiah(duplicateWarning.details?.amount || duplicateWarning.matchedRecord?.amount)}</strong></div>
                <div>• No. Ref: <strong>{duplicateWarning.details?.reference || duplicateWarning.matchedRecord?.reference || '-'}</strong></div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Apakah Anda yakin bahwa transaksi yang Anda masukkan ini adalah batch yang sah dan <strong>BUKAN</strong> entri ganda?
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Batal (Periksa Kembali)
              </button>
              <button
                type="button"
                onClick={(e) => handleDuplicateCheckAndSubmit(e, true)}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
              >
                Saya Yakin, Tetap Posting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
