import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Alerts from './pages/Alerts';
import Network from './pages/Network';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import SystemHealth from './pages/SystemHealth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route 
        path="/login" 
        element={<Login />} 
      />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/network" element={<Network />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/system-health" element={<SystemHealth />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
