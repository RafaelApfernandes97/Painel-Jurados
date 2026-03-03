import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import CoreographiesPage from "./pages/CoreographiesPage";
import DashboardPage from "./pages/DashboardPage";
import EventsPage from "./pages/EventsPage";
import JudgesPage from "./pages/JudgesPage";
import LiveEvaluationPage from "./pages/LiveEvaluationPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage";
import ResultsPage from "./pages/ResultsPage";
import JuryPage from "./pages/JuryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/jury/:token" element={<JuryPage />} />
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
