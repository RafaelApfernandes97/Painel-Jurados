import { Navigate, Route, Routes } from "react-router-dom";
import JuryPage from "@legacy/pages/JuryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/jury/:token" element={<JuryPage />} />
      <Route path="*" element={<Navigate to="/jury/invalid" replace />} />
    </Routes>
  );
}
