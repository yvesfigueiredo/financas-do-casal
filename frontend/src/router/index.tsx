import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TransactionsPage } from "../pages/TransactionsPage";
import { InstallmentsPage } from "../pages/InstallmentsPage";
import { CreditCardsPage } from "../pages/CreditCardsPage";
import { BankAccountsPage } from "../pages/BankAccountsPage";
import { RecurringExpensesPage } from "../pages/RecurringExpensesPage";
import { AnnualPage } from "../pages/AnnualPage";
import { CashFlowPage } from "../pages/CashFlowPage";
import { SimulatorPage } from "../pages/SimulatorPage";
import { CalendarPage } from "../pages/CalendarPage";
import { AlertsPage } from "../pages/AlertsPage";
import { ExecutiveDashboardPage } from "../pages/ExecutiveDashboardPage";
import { ProjectionPage } from "../pages/ProjectionPage";
import { GoalsPage } from "../pages/GoalsPage";
import { TimelinePage } from "../pages/TimelinePage";
import { BankImportPage } from "../pages/BankImportPage";
import { AppLayout } from "../components/layout/AppLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/executive" element={<ExecutiveDashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/installments" element={<InstallmentsPage />} />
            <Route path="/credit-cards" element={<CreditCardsPage />} />
            <Route path="/bank-accounts" element={<BankAccountsPage />} />
            <Route path="/bank-import" element={<BankImportPage />} />
            <Route path="/recurring" element={<RecurringExpensesPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/annual" element={<AnnualPage />} />
            <Route path="/cashflow" element={<CashFlowPage />} />
            <Route path="/projection" element={<ProjectionPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
