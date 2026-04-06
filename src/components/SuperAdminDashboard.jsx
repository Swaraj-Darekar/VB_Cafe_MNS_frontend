import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Bell, 
  User, 
  ChevronRight,
  Wallet,
  CalendarDays,
  Users,
  TrendingUp,
  IndianRupee,
  Info,
  AlertTriangle,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import './SuperAdminDashboard.css';
import './Settings.css';
import { API_URL } from '../config';

const SuperAdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletBalance, setWalletBalance] = useState(0);
  const [commissionRate, setCommissionRate] = useState(2.0);
  const [stats, setStats] = useState({ today: { count: 0 }, monthly: { count: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  React.useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      const [walletRes, settingsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/wallet/balance`),
        fetch(`${API_URL}/settings`),
        fetch(`${API_URL}/analytics/summary`)
      ]);
      
      const walletData = await walletRes.json();
      const settingsData = await settingsRes.json();
      const analyticsData = await analyticsRes.json();

      setWalletBalance(walletData.balance);
      setCommissionRate(settingsData.commission_rs || 2.0);
      setStats(analyticsData);
    } catch (error) {
      console.error("Failed to fetch super admin data", error);
    }
  };

  const handleAddMoney = async () => {
    const amount = prompt("Enter amount to add to wallet (₹):");
    if (!amount || isNaN(amount)) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/wallet/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Optimistically update the wallet balance from the response
        setWalletBalance(data.new_balance);
        // We don't necessarily need the alert if we want it to feel "instant",
        // but the user might want confirmation. Let's use a non-blocking toast 
        // if possible, but for now just skip fetchInitialData() which is heavy.
        console.log(`Successfully added ₹${amount} to wallet!`);
      }
    } catch (error) {
      alert("Failed to add money");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_rs: parseFloat(commissionRate) })
      });
      if (res.ok) {
        alert("Commission settings saved successfully!");
      }
    } catch (error) {
      alert("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemReset = async () => {
    // Double confirmation for safety
    const firstConfirm = window.confirm("⚠️ DANGER: This will delete ALL menu items, categories, order history, expenses, and transaction data. The whole system will be completely empty. Are you absolutely sure?");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("FINAL WARNING: This action cannot be undone. All your menu configuration will be lost. Proceed?");
    if (!secondConfirm) return;

    setIsResetting(true);
    try {
      const res = await fetch(`${API_URL}/system/reset`, { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        alert("✨ System reset successfully. All transaction data has been cleared.");
        await fetchInitialData(); // Refresh local stats
      } else {
        alert("Error resetting system: " + (data.detail || "Unknown error"));
      }
    } catch (error) {
      alert("Network error: Failed to reset system.");
    } finally {
      setIsResetting(false);
    }
  };

  const renderDashboard = () => (
    <>
      <div className="dashboard-header">
        <div className="welcome-text">
          <h1>Welcome, Super Admin</h1>
          <p>Global platform overview and cafe management.</p>
        </div>
        <button className="monthly-settlement-btn">Monthly Settlement</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card wallet-card">
          <div>
            <div className="wallet-icon">
              <Wallet size={20} />
            </div>
            <div className="wallet-label">Cafe Wallet Balance</div>
            <div className="wallet-amount">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
          </div>
          <button className="add-money-btn" onClick={handleAddMoney} disabled={isLoading}>
            {isLoading ? '...' : 'Add Money'}
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <CalendarDays size={20} />
            </div>
          </div>
          <div>
            <div className="stat-label">Today's Bills</div>
            <div className="stat-value">{stats.today?.count || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon purple">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="stat-label">All-Time Bills</div>
            <div className="stat-value">{stats.monthly?.count || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <TrendingUp size={20} />
            </div>
            <span className="stat-badge green">₹{commissionRate}/ea</span>
          </div>
          <div>
            <div className="stat-label">Today Earnings</div>
            <div className="stat-value">₹{(stats.today?.count || 0) * commissionRate}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon orange">
              <IndianRupee size={20} />
            </div>
          </div>
          <div>
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">₹{(stats.monthly?.count || 0) * commissionRate}</div>
          </div>
        </div>
      </div>

      <div className="bottom-sections">
        <div className="section-card">
          <div className="section-header">
            <h3>Settlement History</h3>
            <span className="section-link">Refresh</span>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a5b7' }}>
            No recent settlements
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3>Quick Links</h3>
          </div>
          <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setActiveTab('settings')}>
            Configure Commission
          </div>
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Configure global platform parameters and commission rates.</p>
      </div>

      <div className="settings-layout">
        <div className="settings-left">
          
          <div className="settings-card">
            <h3>Commission Configuration</h3>
            
            <div className="form-group-settings">
              <label>Commission Per Bill (Fixed RS)</label>
              <div className="input-with-suffix">
                <input 
                  type="number" 
                  className="settings-input" 
                  value={commissionRate} 
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} 
                />
                <span className="input-suffix">RS</span>
              </div>
              <p className="form-hint">This fixed amount will be deducted from the cafe wallet for every bill generated.</p>
            </div>

            <div className="info-alert">
              <Info size={18} />
              <span>Changing this value will only affect future transactions.</span>
            </div>

            <div className="settings-actions">
              <button className="btn-save" onClick={handleSaveSettings} disabled={isLoading}>
                <Save size={16} /> {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="settings-card system-danger-card" style={{ marginTop: '0.5rem' }}>
            <div className="system-danger-header">
              <AlertTriangle className="warn-icon" size={20} />
              <span>System Control</span>
            </div>
            <div style={{ fontSize: '1rem', color: '#1e1e2d', marginTop: '0.8rem' }}>Global System Reset</div>
            <p className="danger-text">Delete all bookings, sessions, expenses, and transactions. Restart application fresh.</p>
            <button 
              className={`btn-danger ${isResetting ? 'loading' : ''}`} 
              onClick={handleSystemReset} 
              disabled={isResetting}
            >
              {isResetting ? (
                <><RefreshCw size={16} className="animate-spin" /> Resetting...</>
              ) : (
                <><Trash2 size={16} /> Reset All Data</>
              )}
            </button>
          </div>

        </div>

        <div className="settings-right">
          <div className="settings-card">
            <h3>Platform Info</h3>
            
            <div className="info-row">
              <span className="info-label">System Version</span>
              <span className="info-value">v2.1.0-wallet</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Last Settlement</span>
              <span className="info-value" style={{color: '#1e1e2d'}}>Monthly Logic Enabled</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Wallet Threshold</span>
              <span className="info-value">₹10.00 (Blocked)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">P</div>
          <div className="logo-text">
            <span className="logo-title">Pool Cafe</span>
            <span className="logo-subtitle">SUPER</span>
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-label">Main Menu</div>
          <div 
            className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="menu-item-left">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
            {activeTab === 'dashboard' && <ChevronRight size={16} />}
          </div>
        </div>

        <div className="menu-section">
          <div className="menu-label">System</div>
          <div 
            className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div className="menu-item-left">
              <SettingsIcon size={18} />
              <span>Settings</span>
            </div>
            {activeTab === 'settings' && <ChevronRight size={16} />}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-bar">
            <Search size={18} color="#a1a5b7" />
            <input type="text" className="search-input" placeholder="Search for something..." />
          </div>
          <div className="topbar-right">
            <Bell className="notification-icon" size={20} />
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">Super Admin</span>
                <span className="user-role">Administrator</span>
              </div>
              <div className="avatar">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="dashboard-body">
          {activeTab === 'dashboard' ? renderDashboard() : renderSettings()}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
