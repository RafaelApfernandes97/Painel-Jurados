import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@legacy/components/ProtectedRoute";
import AppShell from "@legacy/components/layout/AppShell";
import CoreographiesPage from "@legacy/pages/CoreographiesPage";
import DashboardPage from "@legacy/pages/DashboardPage";
import EventsPage from "@legacy/pages/EventsPage";
import JudgesPage from "@legacy/pages/JudgesPage";
import LiveEvaluationPage from "@legacy/pages/LiveEvaluationPage";
import LoginPage from "@legacy/pages/LoginPage";
import BlocksPage from "@legacy/pages/BlocksPage";
import OrderPage from "@legacy/pages/OrderPage";
import PublicRegistrationPage from "@legacy/pages/PublicRegistrationPage";
import RegistrationsPage from "@legacy/pages/RegistrationsPage";
import ResultsPage from "@legacy/pages/ResultsPage";
import FinancialPage from "@legacy/pages/FinancialPage";
import SchedulePage from "@legacy/pages/SchedulePage";
import CertificatesPage from "@legacy/pages/CertificatesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Public registration page - no auth required */}
      <Route path="/inscricao/:eventId" element={<PublicRegistrationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId/registrations" element={<RegistrationsPage />} />
          <Route path="/events/:eventId/financial" element={<FinancialPage />} />
          <Route path="/events/:eventId/coreographies" element={<CoreographiesPage />} />
          <Route path="/events/:eventId/blocks" element={<BlocksPage />} />
          <Route path="/events/:eventId/judges" element={<JudgesPage />} />
          <Route path="/events/:eventId/order" element={<OrderPage />} />
          <Route path="/events/:eventId/schedule" element={<SchedulePage />} />
          <Route path="/events/:eventId/live" element={<LiveEvaluationPage />} />
          <Route path="/events/:eventId/results" element={<ResultsPage />} />
          <Route path="/events/:eventId/certificates" element={<CertificatesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
