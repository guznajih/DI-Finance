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

// FASE 3: SPP AGREGAT
import { SppImportView } from './components/spp/SppImportView.tsx';
import { SppInputView } from './components/spp/SppInputView.tsx';
import { SppReconciliationView } from './components/spp/SppReconciliationView.tsx';
import { SppRekapView } from './components/spp/SppRekapView.tsx';
import { SppReportsView } from './components/spp/SppReportsView.tsx';
import { SppTestingView } from './components/spp/SppTestingView.tsx';

// FASE 4: ANGGARAN, PENGAJUAN DANA, LPJ, LEADERSHIP MONITORING & TESTING
import { BudgetView } from './components/budget/BudgetView.tsx';
import { Fase4TestingView } from './components/budget/Fase4TestingView.tsx';
import { FundRequestsView } from './components/budget/FundRequestsView.tsx';
import { LeadershipMonitoringView } from './components/budget/LeadershipMonitoringView.tsx';
import { LpjManagementView } from './components/budget/LpjManagementView.tsx';

// FASE 5: MODUL INVESTASI PESANTREN
import { InvestmentDashboardView } from './components/investment/InvestmentDashboardView.tsx';
import { InvestmentListView } from './components/investment/InvestmentListView.tsx';
import { InvestmentPlacementView } from './components/investment/InvestmentPlacementView.tsx';
import { InvestmentProfitView } from './components/investment/InvestmentProfitView.tsx';
import { InvestmentReturnView } from './components/investment/InvestmentReturnView.tsx';
import { InvestmentReconciliationView } from './components/investment/InvestmentReconciliationView.tsx';
import { InvestmentDocumentsView } from './components/investment/InvestmentDocumentsView.tsx';
import { InvestmentReportsView } from './components/investment/InvestmentReportsView.tsx';
import { Fase5TestingView } from './components/investment/Fase5TestingView.tsx';

// FASE 6: LAPORAN KEUANGAN, REKONSILIASI KAS & BANK, DIAGNOSTIK & TESTING
import { CashBankReconciliationView } from './components/reports/CashBankReconciliationView.tsx';
import { AccountingHealthDiagnosticView } from './components/reports/AccountingHealthDiagnosticView.tsx';
import { Fase6TestingView } from './components/reports/Fase6TestingView.tsx';

// TAHAP 7: TRANSAKSI OPERASIONAL SEDERHANA, ATURAN AKUNTANSI, DASHBOARD BENDAHARA & PIMPINAN, HEALTH CHECK & TESTING
import { BendaharaDashboardView } from './components/dashboard/BendaharaDashboardView.tsx';
import { PimpinanDashboardView } from './components/dashboard/PimpinanDashboardView.tsx';
import { SimpleTransactionModal } from './components/transactions/SimpleTransactionModal.tsx';
import { TransactionCorrectionsView } from './components/transactions/TransactionCorrectionsView.tsx';
import { AccountingRulesCategoriesView } from './components/accounting/AccountingRulesCategoriesView.tsx';
import { Tahap7HealthCheckView } from './components/accounting/Tahap7HealthCheckView.tsx';
import { Fase7TestingView } from './components/testing/Fase7TestingView.tsx';

// TAHAP 8A: KEAMANAN, MAKER-CHECKER & LEAST PRIVILEGE
import { SecurityPolicyView } from './components/security/SecurityPolicyView.tsx';

// TAHAP 8C-8E: AUDIT, PERIOD CONTROL, SECURITY & BACKUP
import { AccountingPeriodsView } from './components/accounting/AccountingPeriodsView.tsx';
import { AccountingIntegrityCheckView } from './components/accounting/AccountingIntegrityCheckView.tsx';
import { SecurityEventsView } from './components/security/SecurityEventsView.tsx';
import { BackupRecoveryView } from './components/security/BackupRecoveryView.tsx';
import { SecurityAuditDashboardView } from './components/security/SecurityAuditDashboardView.tsx';

import { AuthProvider } from './context/AuthContext.tsx';

function MainLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('bendahara-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [newTrxModalOpen, setNewTrxModalOpen] = useState<boolean>(false);
  const [simpleModalOpen, setSimpleModalOpen] = useState<boolean>(false);
  const [simpleModalType, setSimpleModalType] = useState<string>('PENERIMAAN');

  const handleOpenSimpleModal = (type: string = 'PENERIMAAN') => {
    setSimpleModalType(type);
    setSimpleModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setCurrentView('transactions');
    setNewTrxModalOpen(true);
  };

  const handleOpenLpjModal = () => {
    setCurrentView('lpj-management');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#f4f7f6] font-sans text-slate-900 antialiased overflow-hidden">
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

            {/* FASE 5: MODUL INVESTASI PESANTREN */}
            {currentView === 'investment-dashboard' && (
              <InvestmentDashboardView setCurrentView={setCurrentView} />
            )}
            {currentView === 'investment-list' && (
              <InvestmentListView setCurrentView={setCurrentView} />
            )}
            {currentView === 'investment-placement' && <InvestmentPlacementView />}
            {currentView === 'investment-profit' && <InvestmentProfitView />}
            {currentView === 'investment-return' && <InvestmentReturnView />}
            {currentView === 'investment-reconciliation' && <InvestmentReconciliationView />}
            {currentView === 'investment-documents' && <InvestmentDocumentsView />}
            {currentView === 'investment-reports' && <InvestmentReportsView />}
            {currentView === 'fase5-testing' && <Fase5TestingView />}

            {/* FASE 4: ANGGARAN & REALISASI */}
            {(currentView === 'budget-plan' ||
              currentView === 'budget-units' ||
              currentView === 'budget-realization' ||
              currentView === 'budget-vs-realization') && <BudgetView />}

            {/* FASE 4: PENGAJUAN DANA & PENCAIRAN */}
            {(currentView === 'fund-requests' || currentView === 'fund-disbursements') && (
              <FundRequestsView onOpenLpjModal={handleOpenLpjModal} />
            )}

            {/* FASE 4: LPJ & SISA DANA */}
            {currentView === 'lpj-management' && <LpjManagementView />}

            {/* FASE 4: MONITORING PIMPINAN */}
            {currentView === 'monitoring-leadership' && <LeadershipMonitoringView />}

            {/* FASE 4: UJI OTOMATIS */}
            {currentView === 'fase4-testing' && <Fase4TestingView />}

            {/* SPP AGREGAT (FASE 3) */}
            {currentView === 'spp-rekap' && <SppRekapView setCurrentView={setCurrentView} />}
            {currentView === 'spp-input' && <SppInputView setCurrentView={setCurrentView} />}
            {currentView === 'spp-import' && <SppImportView setCurrentView={setCurrentView} />}
            {currentView === 'spp-reconciliation' && <SppReconciliationView />}
            {currentView === 'spp-reports' && <SppReportsView />}
            {currentView === 'spp-testing' && <SppTestingView />}

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
            {currentView === 'security-policy' && <SecurityPolicyView />}

            {/* TAHAP 7: DASHBOARD BENDAHARA & PIMPINAN, ATURAN AKUNTANSI, KOREKSI & HEALTH CHECK */}
            {currentView === 'bendahara-dashboard' && (
              <BendaharaDashboardView
                onOpenSimpleModal={handleOpenSimpleModal}
                onNavigateToView={setCurrentView}
              />
            )}
            {currentView === 'pimpinan-dashboard' && (
              <PimpinanDashboardView onNavigateToView={setCurrentView} />
            )}
            {currentView === 'accounting-rules' && <AccountingRulesCategoriesView />}
            {currentView === 'transaction-corrections' && <TransactionCorrectionsView />}
            {currentView === 'tahap7-health' && <Tahap7HealthCheckView />}
            {currentView === 'fase7-testing' && <Fase7TestingView />}

            {/* LAPORAN & AUDIT (FASE 6) */}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'bank-reconciliation' && <CashBankReconciliationView />}
            {currentView === 'accounting-health' && <AccountingHealthDiagnosticView />}
            {currentView === 'audit-logs' && <AuditTrailView />}
            {currentView === 'fase6-testing' && <Fase6TestingView />}

            {/* TAHAP 8C-8E: AUDIT, PERIOD CONTROL, SECURITY & BACKUP */}
            {currentView === 'security-dashboard' && (
              <SecurityAuditDashboardView onNavigateToView={setCurrentView} />
            )}
            {currentView === 'accounting-periods' && <AccountingPeriodsView />}
            {currentView === 'integrity-check' && <AccountingIntegrityCheckView />}
            {currentView === 'security-events' && <SecurityEventsView />}
            {currentView === 'backup-recovery' && <BackupRecoveryView />}
          </div>
        </main>
      </div>

      {/* Tahap 7 Modal Transaksi Sederhana (Bahasa Operasional) */}
      <SimpleTransactionModal
        isOpen={simpleModalOpen}
        onClose={() => setSimpleModalOpen(false)}
        onSuccess={() => {
          setSimpleModalOpen(false);
        }}
        defaultType={simpleModalType}
      />
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
