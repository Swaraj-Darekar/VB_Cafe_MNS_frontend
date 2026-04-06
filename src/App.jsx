import React, { useState } from 'react';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard'; // Import AdminDashboard

function App() {
  const [viewState, setViewState] = useState(() => {
    const path = window.location.pathname;
    const isSuperAdminView = path.startsWith('/superadmin');
    
    // Only auto-login for regular admin; Super Admin always requires a fresh session check or login
    const userRole = isSuperAdminView 
      ? localStorage.getItem('vb_role_superadmin') 
      : localStorage.getItem('vb_role_admin');      
    return { isSuperAdminView, userRole };
  });

  const { isSuperAdminView, userRole } = viewState;

  const setUserRole = (role) => {
    setViewState(prev => ({ ...prev, userRole: role }));
  };

  const handleSuperAdminLogin = () => {
    localStorage.setItem('vb_role_superadmin', 'superadmin');
    setUserRole('superadmin');
  };

  const handleAdminLogin = () => {
    localStorage.setItem('vb_role_admin', 'admin');
    setUserRole('admin');
  };

  const handleLogout = () => {
    if (isSuperAdminView) {
      localStorage.removeItem('vb_role_superadmin');
    } else {
      localStorage.removeItem('vb_role_admin');
    }
    setUserRole(null);
    // Reload to clear sensitive state
    window.location.reload(); 
  };

  if (isSuperAdminView && userRole === 'superadmin') {
    return <SuperAdminDashboard onLogout={handleLogout} />;
  }
  
  if (!isSuperAdminView && userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Otherwise show Login screen
  // If ?view=superadmin, Login will know they are trying to login as superadmin
  return (
    <Login 
      onSuperAdminLogin={handleSuperAdminLogin} 
      onAdminLogin={handleAdminLogin} 
      isSuperAdminView={isSuperAdminView}
    />
  );
}

export default App;
