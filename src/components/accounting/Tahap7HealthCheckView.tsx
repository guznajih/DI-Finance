import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Search,
  HelpCircle,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const Tahap7HealthCheckView: React.FC = () => {
  const { authFetch } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ERROR' | 'WARNING' | 'PASS'>('ALL');

  const fetchHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/fase7/health-check');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  const checks = healthData?.checks || [];
  const filteredChecks = checks.filter((c: any) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ERROR') return c.level === 'ERROR';
    if (selectedFilter === 'WARNING') return c.level === 'WARNING';
    if (selectedFilter === 'PASS') return c.passed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-900 to-emerald-950 p-6 text-white shadow-md sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-full bg-teal-800/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-200">
              Pengaturan • Diagnostik Akuntansi
            </span>
            <span className="flex items-center text-xs text-teal-300">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              14 Titik Uji Konsistensi Finansial
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Accounting Health Check & Diagnostic Tool
          </h1>
          <p className="mt-1 text-xs text-teal-200 max-w-xl">
            Pemeriksaan menyeluruh: Keseimbangan double-entry, keabsahan jurnal, konsistensi buku kas/bank, portofolio investasi, neraca seimbang, hingga keaslian audit trail dengan rekomendasi solusi otomatis.
          </p>
        </div>

        <button
          onClick={fetchHealthCheck}
          disabled={loading}
          className="flex items-center space-x-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-4 py-2.5 text-xs font-bold text-gray-950 shadow-xs transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Jalankan Health Check Ulang</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-gray-500">Status Kesehatan Buku</span>
          <div className="mt-2 flex items-center space-x-2">
            {healthData?.isHealthy ? (
              <span className="inline-flex items-center text-sm font-bold text-emerald-700">
                <CheckCircle className="mr-1.5 h-4 w-4 text-emerald-600" />
                SEHAT & BALANCE ✓
              </span>
            ) : (
              <span className="inline-flex items-center text-sm font-bold text-rose-700">
                <XCircle className="mr-1.5 h-4 w-4 text-rose-600" />
                PERLU PERHATIAN ✕
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {healthData?.passedCount || 0} dari {healthData?.totalChecks || 0} parameter terpenuhi
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('ERROR')}
          className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
            selectedFilter === 'ERROR' ? 'border-rose-500 bg-rose-50/70' : 'border-rose-100 bg-white'
          }`}
        >
          <span className="text-xs font-semibold text-rose-700">Tingkat ERROR (Kritis)</span>
          <div className="mt-2 text-2xl font-bold text-rose-800">
            {healthData?.errorCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-rose-600">
            Membutuhkan penyesuaian segera
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('WARNING')}
          className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
            selectedFilter === 'WARNING' ? 'border-amber-500 bg-amber-50/70' : 'border-amber-100 bg-white'
          }`}
        >
          <span className="text-xs font-semibold text-amber-700">Tingkat WARNING</span>
          <div className="mt-2 text-2xl font-bold text-amber-800">
            {healthData?.warningCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-amber-600">
            Perlu dicocokkan atau diverifikasi
          </p>
        </div>

        <div
          onClick={() => setSelectedFilter('PASS')}
          className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
            selectedFilter === 'PASS' ? 'border-emerald-500 bg-emerald-50/70' : 'border-emerald-100 bg-white'
          }`}
        >
          <span className="text-xs font-semibold text-emerald-700">Lolos Verifikasi</span>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {healthData?.passedCount || 0}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600">
            Memenuhi standar akuntansi
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedFilter('ALL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'ALL'
              ? 'bg-emerald-800 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Semua Pemeriksaan ({checks.length})
        </button>
        <button
          onClick={() => setSelectedFilter('ERROR')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'ERROR'
              ? 'bg-rose-800 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Error Saja ({healthData?.errorCount || 0})
        </button>
        <button
          onClick={() => setSelectedFilter('WARNING')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'WARNING'
              ? 'bg-amber-800 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Warning Saja ({healthData?.warningCount || 0})
        </button>
        <button
          onClick={() => setSelectedFilter('PASS')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            selectedFilter === 'PASS'
              ? 'bg-emerald-800 text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Lolos Saja ({healthData?.passedCount || 0})
        </button>
      </div>

      {/* Check Items List */}
      <div className="space-y-3">
        {filteredChecks.map((item: any, idx: number) => (
          <div
            key={idx}
            className={`rounded-2xl border p-4.5 bg-white shadow-xs transition ${
              !item.passed
                ? item.level === 'ERROR'
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-amber-300 bg-amber-50/20'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                {item.passed ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : item.level === 'ERROR' ? (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-0.5 text-xs text-gray-600">{item.problemDescription}</p>
                </div>
              </div>

              <span
                className={`self-start sm:self-center rounded-full px-3 py-0.5 text-[10px] font-bold ${
                  item.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.level === 'ERROR'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {item.statusText}
              </span>
            </div>

            {/* Solusi yang disarankan jika ada isu */}
            {!item.passed && item.suggestedSolution && (
              <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
                <span className="font-bold text-indigo-900">Solusi yang Disarankan:</span>
                <p className="mt-0.5 text-gray-700">{item.suggestedSolution}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
