import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { StartPage } from "../pages/StartPage";
import { HomePage } from "../pages/HomePage";
import { DrawingPage } from "../pages/DrawingPage";
import { ResultPage } from "../pages/ResultPage";
import { MealFormPage } from "../pages/MealFormPage";
import { HistoryPage } from "../pages/HistoryPage";
import { SettingsPage } from "../pages/SettingsPage";
import { LegalPage } from "../pages/LegalPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/privacy" element={<LegalPage type="privacy" />} />
      <Route path="/terms" element={<LegalPage type="terms" />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/record" element={<MealFormPage />} />
          <Route path="/record/:id" element={<MealFormPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/drawing" element={<DrawingPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
