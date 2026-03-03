import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@legacy/components/ProtectedRoute";
import AppShell from "@legacy/components/layout/AppShell";
import CoreographiesPage from "@legacy/pages/CoreographiesPage";
import DashboardPage from "@legacy/pages/DashboardPage";
import EventsPage from "@legacy/pages/EventsPage";
import JudgesPage from "@legacy/pages/JudgesPage";
import LiveEvaluationPage from "@legacy/pages/LiveEvaluationPage";
import LoginPage from "@legacy/pages/LoginPage";
import OrderPage from "@legacy/pages/OrderPage";
import ResultsPage from "@legacy/pages/ResultsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId/coreographies" element={<CoreographiesPage />} />
          <Route path="/events/:eventId/judges" element={<JudgesPage />} />
          <Route path="/events/:eventId/order" element={<OrderPage />} />
          <Route path="/events/:eventId/live" element={<LiveEvaluationPage />} />
          <Route path="/events/:eventId/results" element={<ResultsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
