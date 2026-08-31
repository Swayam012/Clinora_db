import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientProfilePage from './pages/PatientProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentViewerPage from './pages/DocumentViewerPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/patients/:id" element={<PatientProfilePage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<DocumentViewerPage />} />
      <Route path="/viewer/:id" element={<DocumentViewerPage />} />
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Catch-all for future pages */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
