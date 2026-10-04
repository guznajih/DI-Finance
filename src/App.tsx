import React, { useState } from 'react';
import { AccountsView } from './components/AccountsView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { CashBankView } from './components/CashBankView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { FundsView } from './components/FundsView.tsx';
import { GeneralLedgerView } from './components/GeneralLedgerView.tsx';
import { JournalsView } from './components/JournalsView.tsx';
import { Navbar } from './components/Navbar.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { Sidebar, ViewType } from './components/Sidebar.tsx';
import { TransactionsView } from './components/TransactionsView.tsx';
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
            {currentView === 'units' && <UnitsView />}
            {currentView === 'funds' && <FundsView />}
            {currentView === 'accounts' && <AccountsView />}
            {currentView === 'cash-bank' && <CashBankView />}
            {currentView === 'transactions' && (
              <TransactionsView
                modalOpen={newTrxModalOpen}
                setModalOpen={setNewTrxModalOpen}
              />
            )}
            {currentView === 'journals' && <JournalsView />}
            {currentView === 'ledger' && <GeneralLedgerView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'audit-logs' && <AuditTrailView />}
            {currentView === 'users' && <UsersView />}
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
