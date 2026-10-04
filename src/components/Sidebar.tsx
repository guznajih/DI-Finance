import React from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookMarked,
  BookOpenCheck,
  Coins,
  FileSpreadsheet,
  FlaskConical,
  FolderTree,
  History,
  Landmark,
  LayoutDashboard,
  Network,
  Receipt,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react';

export type ViewType =
  | 'dashboard'
  | 'penerimaan'
  | 'pengeluaran'
  | 'transfer'
  | 'journals'
  | 'cash-book'
  | 'bank-book'
  | 'ledger'
  | 'transactions'
  | 'units'
  | 'funds'
  | 'accounts'
  | 'cash-bank'
  | 'reports'
  | 'audit-logs'
  | 'users'
  | 'testing';

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
        { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'testing' as ViewType, label: 'Pengujian Akuntansi', icon: FlaskConical },
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
      ],
    },
    {
      title: 'LAPORAN & AUDIT',
      items: [
        { id: 'reports' as ViewType, label: 'Laporan Keuangan', icon: FileSpreadsheet },
        { id: 'audit-logs' as ViewType, label: 'Riwayat Audit Trail', icon: History },
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-6 border-b border-gray-100 lg:hidden">
          <span className="text-base font-bold text-emerald-950">Menu Navigasi</span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </h3>
              <div className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-950'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-amber-300' : 'text-gray-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Double-entry Info Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
            <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
              <ShieldAlert className="h-4 w-4 text-emerald-700 flex-shrink-0" />
              <span>Double-Entry Validated</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 leading-snug">
              Setiap transaksi otomatis menghasilkan jurnal seimbang. Saldo kas/bank dicegah dari nilai negatif.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-100 p-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-800">PP Darul Istiqomah</p>
          <p className="text-[11px] text-gray-400">Bojonegoro, Jawa Timur</p>
        </div>
      </aside>
    </>
  );
};
