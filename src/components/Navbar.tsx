import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RoleName } from '../types/index.ts';
import { BrandLogo } from './common/BrandLogo.tsx';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onOpenNewTransaction?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
}) => {
  const { user, firebaseUser, loginWithGoogle, loginAsRole, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { key: RoleName; label: string; desc: string; badge?: string }[] = [
    { key: 'SUPER_ADMIN', label: 'SUPER ADMIN', desc: 'Konfigurasi & izin sistem, audit penuh', badge: 'Full Access' },
    { key: 'BENDAHARA', label: 'BENDAHARA', desc: 'Transaksi operasional, kas/bank, pencairan & jurnal', badge: 'Keuangan' },
    { key: 'VERIFIKATOR', label: 'VERIFIKATOR', desc: 'Pemeriksa kelengkapan & RAB, bukan approval final', badge: 'Checker' },
    { key: 'APPROVER', label: 'APPROVER / PIMPINAN', desc: 'Persetujuan pengajuan dana (Maker != Checker)', badge: 'Approver' },
    { key: 'PETUGAS_UNIT', label: 'PETUGAS UNIT', desc: 'Pengajuan & LPJ unit sendiri (Divisi Dapur)', badge: 'Unit Scope' },
    { key: 'AUDITOR', label: 'AUDITOR', desc: 'Pemeriksaan laporan & buku besar (Read-Only)', badge: 'Read-Only' },
    { key: 'VIEWER', label: 'VIEWER', desc: 'Peninjau seluruh modul tanpa izin ubah', badge: 'Read-Only' },
  ];

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Brand Palette Top Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#009b9e] via-[#0d8487] to-[#f59e0b]" />

      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none lg:hidden transition"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu Navigasi"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Official Brand Logo */}
          <div className="flex items-center">
            <BrandLogo size="md" variant="full" theme="light" />
          </div>
        </div>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center space-x-3">
          {/* Institution Status Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-1 text-[11px] font-semibold text-teal-900">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
            <span>PP. Darul Istiqomah</span>
          </div>

          {/* Role Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 sm:px-3 sm:text-xs"
            >
              <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline text-slate-500 font-normal">Peran:</span>
              <span className="font-bold text-teal-800">
                {user?.roleName?.replace('_', ' ') || 'SUPER ADMIN'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Uji Coba Hak Akses Role
                </p>
                <p className="text-xs text-slate-500">
                  Pilih peran untuk simulasi otorisasi Maker-Checker
                </p>
              </div>
              <div className="mt-1 space-y-0.5 max-h-80 overflow-y-auto">
                {roles.map((r) => {
                  const isActive = user?.roleName === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => {
                        loginAsRole(r.key);
                        setRoleDropdownOpen(false);
                      }}
                      className={`flex w-full items-start justify-between rounded-lg p-2 text-left text-xs transition ${
                        isActive
                          ? 'bg-teal-50 text-teal-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center space-x-1.5 flex-wrap">
                          <span>{r.label}</span>
                          {r.badge && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                              {r.badge}
                            </span>
                          )}
                          {isActive && (
                            <span className="text-teal-700 font-bold text-[10px]">
                              ✓ Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal">{r.desc}</p>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Login */}
        {firebaseUser ? (
          <div className="flex items-center space-x-2">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                {firebaseUser.displayName || user?.displayName}
              </p>
              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{firebaseUser.email}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-bold ring-1 ring-teal-200">
              {(firebaseUser.displayName || user?.displayName || 'U')[0].toUpperCase()}
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-slate-900">
                {user?.displayName || 'Guz Najih'}
              </p>
              <p className="text-[10px] text-teal-700 font-medium">Super Administrator</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-800 text-white text-xs font-bold shadow-xs">
              {(user?.displayName || 'G')[0]}
            </div>
            <button
              onClick={loginWithGoogle}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
              title="Login akun Google"
            >
              <LogIn className="h-3.5 w-3.5 text-teal-700" />
              <span className="hidden sm:inline">Google</span>
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
};
