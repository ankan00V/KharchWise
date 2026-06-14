import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Groups } from './pages/Groups';
import { Analytics } from './pages/Analytics';
import { GroupDetail } from './pages/GroupDetail';
import { MembersTab } from './pages/tabs/MembersTab';
import { ExpensesTab } from './pages/tabs/ExpensesTab';
import { BalancesTab } from './pages/tabs/BalancesTab';
import { ImportTab } from './pages/tabs/ImportTab';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<><Navbar /><div className="pt-[160px] pb-[96px] max-w-[1200px] mx-auto px-[16px] sm:px-[24px]"><Outlet /></div></>}>
          <Route path="/" element={<Landing />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/groups" element={<Groups />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/groups/:id" element={<GroupDetail />}>
              <Route index element={<Navigate to="expenses" replace />} />
              <Route path="members" element={<MembersTab />} />
              <Route path="expenses" element={<ExpensesTab />} />
              <Route path="balances" element={<BalancesTab />} />
              <Route path="import" element={<ImportTab />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen font-sans selection:bg-[#3CE370]/30 selection:text-white overflow-x-hidden">
          <AnimatedRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
