import { Navigate, Route, Routes } from "react-router-dom";
import JuryPage from "@legacy/pages/JuryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/juri/:token" element={<JuryPage />} />
      <Route path="*" element={<Navigate to="/juri/invalid" replace />} />
    </Routes>
  );
}
