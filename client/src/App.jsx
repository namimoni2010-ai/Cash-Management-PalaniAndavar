import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ModePage from './pages/ModePage.jsx';
import Transactions from './pages/Transactions.jsx';
import MonthlyReports from './pages/MonthlyReports.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-10 text-center text-slate-500">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gpay" element={<ModePage mode="GPAY" />} />
        <Route path="/cash" element={<ModePage mode="CASH" />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/reports" element={<MonthlyReports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}