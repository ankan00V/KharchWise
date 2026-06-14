import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Groups } from './pages/Groups';
import { GroupDetail } from './pages/GroupDetail';
import { MembersTab } from './pages/tabs/MembersTab';
import { ExpensesTab } from './pages/tabs/ExpensesTab';
import { BalancesTab } from './pages/tabs/BalancesTab';
import { ImportTab } from './pages/tabs/ImportTab';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<><Navbar /><ProtectedRoute /></>}>
              <Route path="/" element={<Navigate to="/groups" replace />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />}>
                <Route index element={<Navigate to="expenses" replace />} />
                <Route path="members" element={<MembersTab />} />
                <Route path="expenses" element={<ExpensesTab />} />
                <Route path="balances" element={<BalancesTab />} />
                <Route path="import" element={<ImportTab />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
