import React, { useState } from 'react';
import { AccountsView } from './components/AccountsView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { BankBookView } from './components/BankBookView.tsx';
import { CashBankView } from './components/CashBankView.tsx';
import { CashBookView } from './components/CashBookView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { FundsView } from './components/FundsView.tsx';
import { GeneralLedgerView } from './components/GeneralLedgerView.tsx';
import { JournalsView } from './components/JournalsView.tsx';
import { Navbar } from './components/Navbar.tsx';
import { PenerimaanView } from './components/PenerimaanView.tsx';
import { PengeluaranView } from './components/PengeluaranView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { Sidebar, ViewType } from './components/Sidebar.tsx';
import { TestingView } from './components/TestingView.tsx';
import { TransactionsView } from './components/TransactionsView.tsx';
import { TransferView } from './components/TransferView.tsx';
import { UnitsView } from './components/UnitsView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { AuthProvider } from './context/AuthContext.tsx';

function MainLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [newTrxModalOpen, setNewTrxModalOpen] = useState<boolean>(false);

  const handleOpenNewTransaction = () => {
    setCurrentView('transactions');
    setNewTrxModalOpen(true);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 font-sans text-gray-900 antialiased overflow-hidden">
      {/* Top Navbar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Body with Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentView === 'dashboard' && (
              <DashboardView
                setCurrentView={setCurrentView}
                openNewTransactionModal={handleOpenNewTransaction}
              />
            )}
            {/* KEUANGAN (FASE 2) */}
            {currentView === 'penerimaan' && <PenerimaanView />}
            {currentView === 'pengeluaran' && <PengeluaranView />}
            {currentView === 'transfer' && <TransferView />}
            {currentView === 'journals' && <JournalsView />}
            {currentView === 'cash-book' && <CashBookView />}
            {currentView === 'bank-book' && <BankBookView />}
            {currentView === 'ledger' && <GeneralLedgerView />}
            {currentView === 'transactions' && (
              <TransactionsView
                modalOpen={newTrxModalOpen}
                setModalOpen={setNewTrxModalOpen}
              />
            )}
            {currentView === 'testing' && <TestingView />}

            {/* MASTER DATA */}
            {currentView === 'units' && <UnitsView />}
            {currentView === 'funds' && <FundsView />}
            {currentView === 'accounts' && <AccountsView />}
            {currentView === 'cash-bank' && <CashBankView />}
            {currentView === 'users' && <UsersView />}

            {/* LAPORAN & AUDIT */}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'audit-logs' && <AuditTrailView />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
