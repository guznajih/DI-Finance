import React, { useState } from 'react';
import {
  Building2,
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

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, firebaseUser, loginWithGoogle, loginAsRole, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: { key: RoleName; label: string; desc: string }[] = [
    { key: 'SUPER_ADMIN', label: 'SUPER ADMIN', desc: 'Akses penuh seluruh modul & setting' },
    { key: 'BENDAHARA', label: 'BENDAHARA', desc: 'Kelola kas, bank & posting jurnal' },
    { key: 'PIMPINAN', label: 'PIMPINAN', desc: 'Monitoring laporan, surplus/defisit' },
    { key: 'PETUGAS_KEUANGAN', label: 'PETUGAS KEUANGAN', desc: 'Pencatatan draft transaksi harian' },
    { key: 'UNIT', label: 'UNIT / DIVISI', desc: 'Pencatatan pengajuan unit (Dapur)' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-emerald-950/20 bg-emerald-900 px-4 text-white shadow-md sm:px-6">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-emerald-100 hover:bg-emerald-800 focus:outline-none lg:hidden"
          title="Toggle Menu"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 font-bold text-emerald-950 shadow-inner">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-wide text-white sm:text-lg">
                DARUL ISTIQOMAH
              </span>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-xs font-semibold text-amber-300">
                FINANCE
              </span>
            </div>
            <p className="hidden text-xs text-emerald-200 sm:block">
              Pesantren Darul Istiqomah Bojonegoro • Akuntansi Double-Entry
            </p>
          </div>
        </div>
      </div>

      {/* Right: Role Switcher & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2 rounded-lg border border-emerald-700 bg-emerald-800/80 px-2.5 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-700/80 sm:px-3 sm:text-sm"
          >
            <Shield className="h-3.5 w-3.5 text-amber-400 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline text-emerald-200">Peran:</span>
            <span className="font-semibold text-amber-300">
              {user?.roleName?.replace('_', ' ') || 'SUPER ADMIN'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-emerald-300" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-2 text-gray-800 shadow-2xl z-50">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Uji Coba Hak Akses Role
                </p>
                <p className="text-xs text-gray-400">
                  Pilih peran untuk mensimulasikan otorisasi
                </p>
              </div>
              <div className="mt-1 space-y-1">
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
                          ? 'bg-emerald-50 text-emerald-900 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center space-x-1.5">
                          <span>{r.label}</span>
                          {isActive && (
                            <span className="text-emerald-600 font-normal text-[10px]">
                              (Aktif)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">{r.desc}</p>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
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
              <p className="text-xs font-semibold text-white">
                {firebaseUser.displayName || user?.displayName}
              </p>
              <p className="text-[11px] text-emerald-200">{firebaseUser.email}</p>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-emerald-200 transition hover:bg-rose-900 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="flex items-center space-x-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow transition hover:bg-amber-300"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Login Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
