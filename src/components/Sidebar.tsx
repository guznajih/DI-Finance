import React from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  Coins,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderTree,
  GraduationCap,
  History,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  Lock,
  Network,
  PlusCircle,
  Receipt,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { BrandLogo } from './common/BrandLogo.tsx';

export type ViewType =
  | 'dashboard'
  | 'security-policy'
  | 'bendahara-dashboard'
  | 'pimpinan-dashboard'
  | 'accounting-rules'
  | 'transaction-corrections'
  | 'tahap7-health'
  | 'fase7-testing'
  // FASE 5: MODUL INVESTASI PESANTREN
  | 'investment-dashboard'
  | 'investment-list'
  | 'investment-placement'
  | 'investment-profit'
  | 'investment-return'
  | 'investment-reconciliation'
  | 'investment-documents'
  | 'investment-reports'
  | 'fase5-testing'
  // FASE 4: ANGGARAN & PENGAJUAN DANA
  | 'budget-plan'
  | 'budget-units'
  | 'budget-realization'
  | 'budget-vs-realization'
  | 'fund-requests'
  | 'fund-disbursements'
  | 'lpj-management'
  | 'monitoring-leadership'
  | 'fase4-testing'
  // FASE 3: SPP AGREGAT
  | 'spp-rekap'
  | 'spp-input'
  | 'spp-import'
  | 'spp-reconciliation'
  | 'spp-reports'
  | 'spp-testing'
  // FASE 2: KEUANGAN UTAMA
  | 'penerimaan'
  | 'pengeluaran'
  | 'transfer'
  | 'journals'
  | 'cash-book'
  | 'bank-book'
  | 'ledger'
  | 'transactions'
  // MASTER DATA
  | 'units'
  | 'funds'
  | 'accounts'
  | 'cash-bank'
  | 'users'
  // LAPORAN & AUDIT (FASE 6 & 8)
  | 'reports'
  | 'bank-reconciliation'
  | 'accounting-health'
  | 'audit-logs'
  | 'fase6-testing'
  | 'testing'
  // TAHAP 8C-8E: AUDIT, PERIOD CONTROL, SECURITY & BACKUP
  | 'security-dashboard'
  | 'accounting-periods'
  | 'integrity-check'
  | 'security-events'
  | 'backup-recovery'
  | 'security-policy';

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const navSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'bendahara-dashboard' as ViewType, label: 'Dashboard Bendahara', icon: Wallet },
        { id: 'pimpinan-dashboard' as ViewType, label: 'Dashboard Pimpinan', icon: Landmark },
        { id: 'dashboard' as ViewType, label: 'Dashboard Ikhtisar', icon: LayoutDashboard },
        { id: 'monitoring-leadership' as ViewType, label: 'Monitoring Anggaran', icon: BarChart3 },
      ],
    },
    {
      title: 'AKUNTANSI OPERASIONAL (TAHAP 7)',
      items: [
        { id: 'accounting-rules' as ViewType, label: 'Aturan & Kategori Jurnal', icon: FolderTree },
        { id: 'transaction-corrections' as ViewType, label: 'Koreksi Transaksi (Audit)', icon: RotateCcw },
        { id: 'tahap7-health' as ViewType, label: 'Accounting Health Check', icon: ShieldCheck },
        { id: 'fase7-testing' as ViewType, label: 'Uji Otomatis Tahap 7', icon: FlaskConical },
      ],
    },
    {
      title: 'INVESTASI PESANTREN (FASE 5)',
      items: [
        { id: 'investment-dashboard' as ViewType, label: 'Dashboard Investasi', icon: TrendingUp },
        { id: 'investment-list' as ViewType, label: 'Daftar Investasi', icon: Briefcase },
        { id: 'investment-placement' as ViewType, label: 'Penempatan Dana', icon: ArrowUpRight },
        { id: 'investment-profit' as ViewType, label: 'Pendapatan Bagi Hasil', icon: BadgePercent },
        { id: 'investment-return' as ViewType, label: 'Pengembalian Modal', icon: RotateCcw },
        { id: 'investment-reconciliation' as ViewType, label: 'Rekonsiliasi Investasi', icon: Scale },
        { id: 'investment-documents' as ViewType, label: 'Dokumen Investasi', icon: FileText },
        { id: 'investment-reports' as ViewType, label: 'Laporan Investasi', icon: FileSpreadsheet },
        { id: 'fase5-testing' as ViewType, label: 'Uji Otomatis FASE 5', icon: FlaskConical },
      ],
    },
    {
      title: 'ANGGARAN & REALISASI (FASE 4)',
      items: [
        { id: 'budget-plan' as ViewType, label: 'Rencana Anggaran', icon: Layers },
        { id: 'budget-units' as ViewType, label: 'Anggaran Unit/Divisi', icon: Network },
        { id: 'budget-realization' as ViewType, label: 'Realisasi Anggaran', icon: Receipt },
        { id: 'budget-vs-realization' as ViewType, label: 'Anggaran vs Realisasi', icon: BarChart3 },
      ],
    },
    {
      title: 'PENGAJUAN DANA & LPJ (FASE 4)',
      items: [
        { id: 'fund-requests' as ViewType, label: 'Pengajuan Dana', icon: Send },
        { id: 'fund-disbursements' as ViewType, label: 'Pencairan Dana', icon: Wallet },
        { id: 'lpj-management' as ViewType, label: 'LPJ & Sisa Dana', icon: FileCheck },
        { id: 'fase4-testing' as ViewType, label: 'Uji Otomatis FASE 4', icon: FlaskConical },
      ],
    },
    {
      title: 'SPP AGREGAT (FASE 3)',
      items: [
        { id: 'spp-rekap' as ViewType, label: 'Rekap Penerimaan', icon: GraduationCap },
        { id: 'spp-input' as ViewType, label: 'Input Penerimaan', icon: PlusCircle },
        { id: 'spp-import' as ViewType, label: 'Import Rekap (CSV/Excel)', icon: UploadCloud },
        { id: 'spp-reconciliation' as ViewType, label: 'Rekonsiliasi Bank', icon: CheckSquare },
        { id: 'spp-reports' as ViewType, label: 'Laporan SPP', icon: BarChart3 },
        { id: 'spp-testing' as ViewType, label: 'Uji Otomatis FASE 3', icon: FlaskConical },
      ],
    },
    {
      title: 'KEUANGAN (FASE 2)',
      items: [
        { id: 'penerimaan' as ViewType, label: 'Penerimaan', icon: ArrowDownLeft },
        { id: 'pengeluaran' as ViewType, label: 'Pengeluaran', icon: ArrowUpRight },
        { id: 'transfer' as ViewType, label: 'Transfer Kas/Bank', icon: ArrowLeftRight },
        { id: 'journals' as ViewType, label: 'Jurnal Umum', icon: BookOpenCheck },
        { id: 'cash-book' as ViewType, label: 'Buku Kas', icon: Wallet },
        { id: 'bank-book' as ViewType, label: 'Buku Bank', icon: Landmark },
        { id: 'ledger' as ViewType, label: 'Buku Besar', icon: BookMarked },
        { id: 'transactions' as ViewType, label: 'Semua Transaksi & Alur', icon: Receipt },
        { id: 'testing' as ViewType, label: 'Pengujian Akuntansi (FASE 2)', icon: FlaskConical },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { id: 'units' as ViewType, label: 'Unit / Divisi', icon: Network },
        { id: 'funds' as ViewType, label: 'Sumber Dana', icon: Coins },
        { id: 'accounts' as ViewType, label: 'Bagan Akun (COA)', icon: FolderTree },
        { id: 'cash-bank' as ViewType, label: 'Master Kas & Bank', icon: Wallet },
        { id: 'users' as ViewType, label: 'Pengguna & Role', icon: Users },
        { id: 'security-policy' as ViewType, label: 'Keamanan & Maker-Checker', icon: Lock },
      ],
    },
    {
      title: 'LAPORAN & AUDIT (FASE 6)',
      items: [
        { id: 'reports' as ViewType, label: 'Laporan Keuangan', icon: FileSpreadsheet },
        { id: 'bank-reconciliation' as ViewType, label: 'Rekonsiliasi Kas & Bank', icon: Scale },
        { id: 'accounting-health' as ViewType, label: 'Diagnostik & Bantuan Bendahara', icon: ShieldCheck },
        { id: 'fase6-testing' as ViewType, label: 'Uji Otomatis FASE 6', icon: FlaskConical },
      ],
    },
    {
      title: 'AUDIT, PERIODE & KEAMANAN (TAHAP 8)',
      items: [
        { id: 'security-dashboard' as ViewType, label: 'Security & Audit Dashboard', icon: ShieldCheck },
        { id: 'accounting-periods' as ViewType, label: 'Periode Akuntansi (Tutup Buku)', icon: Calendar },
        { id: 'integrity-check' as ViewType, label: 'Accounting Integrity Check', icon: Scale },
        { id: 'audit-logs' as ViewType, label: 'Riwayat Audit Trail (8B)', icon: History },
        { id: 'security-events' as ViewType, label: 'Log Peristiwa Keamanan', icon: Lock },
        { id: 'backup-recovery' as ViewType, label: 'Backup & Recovery Data', icon: Database },
        { id: 'security-policy' as ViewType, label: 'Kebijakan Role & Maker-Checker', icon: KeyRound },
      ],
    },
  ];

  const handleSelect = (view: ViewType) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#162a33] bg-[#0b191e] text-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        {/* Mobile Header with BrandLogo and Close Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#162a33] bg-[#081317] lg:hidden">
          <BrandLogo size="sm" variant="full" theme="dark" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[10.5px] font-bold uppercase tracking-wider text-teal-400/80">
                {section.title}
              </h3>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`flex w-full items-center space-x-2.5 rounded-lg px-3 py-2 text-xs transition text-left ${
                        isActive
                          ? 'bg-[#009b9e] text-white shadow-xs font-bold border-l-4 border-amber-400 pl-2'
                          : 'text-slate-300 hover:bg-white/[0.07] hover:text-white font-medium'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Institutional Tagline Footer */}
        <div className="p-3.5 border-t border-[#162a33] bg-[#081317] hidden lg:block">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-[10.5px] text-teal-300 font-semibold tracking-wide">
              Sistem Akuntansi Aktif
            </p>
          </div>
          <p className="text-[9.5px] text-slate-400 mt-0.5">
            Darul Istiqomah · Woro Bojonegoro
          </p>
        </div>
      </aside>
    </>
  );
};
