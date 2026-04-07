import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Home, History, BarChart2, Receipt, Settings, LogOut, Lock,
  User, Calendar, ChevronDown, Coffee, Coins, WalletCards,
  CalendarDays, TrendingDown, TrendingUp, Trash2, Eye, X,
  Plus, Minus, ShoppingCart, Search, Pencil, CreditCard, Info, Printer,
  AlertTriangle, Menu
} from 'lucide-react';
import './AdminDashboard.css';
import './History.css';
import './Analytics.css';
import './Expenses.css';
import './AdminSettings.css';
import './Modals.css';
import { API_URL } from '../config';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Modals Data & State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null); // Init to null to avoid "blocked" state on load
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [viewingSettlementExpenses, setViewingSettlementExpenses] = useState(null);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isSettleConfirmOpen, setIsSettleConfirmOpen] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState({
    today: { total: 0, online: 0, cash: 0, count: 0 },
    yesterday: { total: 0, online: 0, cash: 0, count: 0 },
    monthly: { sales: 0, expenses: 0, profit: 0 }
  });
  
  // Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [billDiscount, setBillDiscount] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Section Security State
  const [isSectionUnlocked, setIsSectionUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [sectionPassword, setSectionPassword] = useState('');
  const [pendingTab, setPendingTab] = useState(null);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderCategory, setOrderCategory] = useState('All');
  const [printingOrder, setPrintingOrder] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);

  // History Accordion & Details State
  const [expandedDays, setExpandedDays] = useState([]); // Array of date keys
  const [viewingOrder, setViewingOrder] = useState(null); // The order to show in detail modal

  // Dashboard Fetching overrides
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchCategories();
      fetchMenuItems();
      fetchWalletBalance();
    }
    if (activeTab === 'history') {
      fetchOrderHistory();
    }
    if (activeTab === 'analytics') {
      fetchAnalyticsSummary();
      fetchSettlements();
    }
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab]);

  // Cart State Management
  const [paymentMode, setPaymentMode] = useState('Cash'); 

  // Tab Switching Logic with Security Guard
  const handleTabClick = (tab) => {
    const sensitiveTabs = ['analytics', 'expenses', 'settings'];
    if (sensitiveTabs.includes(tab) && !isSectionUnlocked) {
      setPendingTab(tab);
      setIsPasswordModalOpen(true);
      setSectionPassword(''); // Clear previous input
    } else {
      setActiveTab(tab);
    }
  };

  const handleSecurityUnlock = (e) => {
    e.preventDefault();
    if (sectionPassword === 'admin') {
      setIsSectionUnlocked(true);
      if (pendingTab) setActiveTab(pendingTab);
      setIsPasswordModalOpen(false);
      setPendingTab(null);
    } else {
      alert("Invalid Security Password. Access Denied.");
      setSectionPassword('');
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (data.data) {
        setCategories(data.data);
        if (data.data.length > 0 && !itemCategoryId) {
          setItemCategoryId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const handleReprintOrder = (order) => {
    if (!order) return;
    
    // Transform History Order to Printing Format
    // Use token_no if available, else fallback to a readable slice of the ID
    const displayId = order.token_no ? `#${order.token_no}` : `#${(order.id || '').toString().slice(0, 8).toUpperCase()}`;

    const printData = {
      id: displayId,
      timestamp: new Date(order.created_at).toLocaleString(),
      items: order.order_items ? order.order_items.map(oi => ({
        name: oi.item_name,
        qty: oi.qty,
        price: oi.price_at_time
      })) : [],
      subtotal: order.order_items ? order.order_items.reduce((acc, oi) => acc + (oi.price_at_time * oi.qty), 0) : 0,
      discount: parseFloat(order.discount || 0),
      total: parseFloat(order.total_amount),
      payment_mode: order.payment_mode
    };
    
    setPrintingOrder(printData);
    
    // Auto-trigger window print
    setTimeout(() => {
      window.print();
      // Cleanup printable state
      setTimeout(() => setPrintingOrder(null), 2000);
    }, 1500);
  };

  // Fetch Menu Items
  const fetchMenuItems = async () => {
    try {
      const res = await fetch(`${API_URL}/menu_items`);
      const data = await res.json();
      if (data.data) setMenuItems(data.data);
    } catch (err) {
      console.error("Failed to fetch menu items", err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/balance`);
      if (!res.ok) throw new Error("Wallet not configured");
      const data = await res.json();
      setWalletBalance(data.balance); // Set to actual number (0, 10, etc)
    } catch (err) {
      console.error("Failed to fetch wallet balance", err);
      // Fallback to high balance only if absolutely failing (to prevent block)
      if (walletBalance === null) setWalletBalance(100); 
    }
  };

  // Fetch Order History
  const fetchOrderHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`);
      const data = await res.json();
      if (data.data) setOrderHistory(data.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/expenses`);
      const data = await res.json();
      if (data.data) setExpenses(data.data);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    }
  };

  // Fetch Analytics Summary
  const fetchAnalyticsSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/analytics/summary`);
      const data = await res.json();
      if (data) setAnalyticsSummary(data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  // Fetch Settlement History
  const fetchSettlements = async () => {
    try {
      const res = await fetch(`${API_URL}/settlements`);
      const data = await res.json();
      if (data.data) setSettlements(data.data);
    } catch (err) {
      console.error("Failed to fetch settlements", err);
    }
  };

  const fetchSettlementExpenses = async (settlement) => {
    try {
      const res = await fetch(`${API_URL}/settlements/${settlement.id}/expenses`);
      const data = await res.json();
      if (data.data) {
        setViewingSettlementExpenses(data.data);
        setSelectedSettlement(settlement);
      }
    } catch (err) {
      console.error("Failed to fetch settlement expenses", err);
    }
  };

  const handleSettleMonth = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/analytics/settle`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsSettleConfirmOpen(false);
        fetchAnalyticsSummary();
        fetchSettlements();
        fetchExpenses(); // Should be empty now
        fetchWalletBalance(); // Should be 0 now
        fetchOrderHistory(); // Should only show new orders
        alert(data.message);
      } else {
        alert(data.detail || 'Settlement failed');
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  // Helper to group History by Date
  const groupHistoryByDay = () => {
    const groups = {};
    
    // Helper to get local date string YYYY-MM-DD
    const getLocalDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    orderHistory.forEach(order => {
      const dateObj = new Date(order.created_at);
      const dateKey = getLocalDateStr(dateObj); // Local YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          orders: [],
          totalAmount: 0,
          cashCount: 0,
          onlineCount: 0
        };
      }
      
      groups[dateKey].orders.push(order);
      groups[dateKey].totalAmount += parseFloat(order.total_amount);
      if (order.payment_mode === 'Online') groups[dateKey].onlineCount++;
      else groups[dateKey].cashCount++;
    });

    // Format for Rendering
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date)).map(group => {
      const now = new Date();
      const todayStr = getLocalDateStr(now);
      const yestDate = new Date();
      yestDate.setDate(yestDate.getDate() - 1);
      const yesterdayStr = getLocalDateStr(yestDate);
      
      let label = group.date;
      if (group.date === todayStr) label = "Today";
      else if (group.date === yesterdayStr) label = "Yesterday";
      else {
        // Build Date obj manually from YYYY-MM-DD to avoid timezone shifting again
        const [y, m, d] = group.date.split('-');
        label = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
          weekday: 'short', day: '2-digit', month: 'short'
        });
      }
      
      return { ...group, label };
    });
  };

  const toggleDay = (dateKey) => {
    setExpandedDays(prev => 
      prev.includes(dateKey) ? prev.filter(d => d !== dateKey) : [...prev, dateKey]
    );
  };

  // Add Expense Handler
  const handleAddExpense = async () => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    setIsLoading(true);
    
    // Save current values and clear inputs immediately for snappy UI
    const nameToSave = newExpenseName.trim();
    const amountToSave = parseFloat(newExpenseAmount);
    const dateToSave = newExpenseDate;
    
    setNewExpenseName('');
    setNewExpenseAmount('');
    
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: nameToSave, 
          amount: amountToSave,
          created_at: dateToSave
        })
      });
      if (res.ok) {
        fetchExpenses();
        fetchAnalyticsSummary(); // Update analytics immediately
      } else {
        // Restore on failure
        setNewExpenseName(nameToSave);
        setNewExpenseAmount(amountToSave.toString());
        alert('Failed to save expense');
      }
    } catch (err) {
      console.error(err);
      setNewExpenseName(nameToSave);
      setNewExpenseAmount(amountToSave.toString());
      alert('Error connecting to backend');
    }
    setIsLoading(false);
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpenseId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/expenses/${deletingExpenseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingExpenseId(null);
        fetchExpenses();
        fetchAnalyticsSummary();
      } else {
        alert('Failed to delete expense');
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  // Add Category Handler
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsLoading(true);
    const nameToAdd = newCategoryName.trim();
    setNewCategoryName(''); // Clear input immediately for snappy feel
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToAdd })
      });
      if (res.ok) {
        fetchCategories(); // Refresh in background, no await needed
      } else {
        const errData = await res.json();
        setNewCategoryName(nameToAdd); // Restore input on failure
        alert(errData.detail || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
      setNewCategoryName(nameToAdd);
      alert('Error connecting to backend');
    }
    setIsLoading(false);
  };

  // Delete Category Handler
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? It might fail if there are items still inside it!")) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCategories();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };

  // Add Item Handler
  const handleAddItem = async () => {
    if (!itemCategoryId || !newItemName.trim() || !newItemPrice) return;
    setIsLoading(true);
    const nameSaved = newItemName.trim();
    const priceSaved = newItemPrice;
    setNewItemName('');
    setNewItemPrice('');
    try {
      const res = await fetch(`${API_URL}/menu_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: itemCategoryId,
          name: nameSaved,
          price: parseFloat(priceSaved)
        })
      });
      if (res.ok) {
        fetchMenuItems(); // Refresh in background
      } else {
        setNewItemName(nameSaved);
        setNewItemPrice(priceSaved);
        alert('Failed to add item');
      }
    } catch (err) {
      console.error(err);
      setNewItemName(nameSaved);
      setNewItemPrice(priceSaved);
      alert('Error connecting to backend');
    }
    setIsLoading(false);
  };

  // Update Item Price Handler
  const handleUpdateMenuItem = async (id) => {
    if (!editItemPrice) return;
    try {
      const res = await fetch(`${API_URL}/menu_items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(editItemPrice) })
      });
      if (res.ok) {
        setEditingItemId(null);
        await fetchMenuItems();
      } else {
        alert('Failed to update price');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };

  const handleUpdateCategory = async (catId) => {
    if (!editCatName.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName })
      });
      if (res.ok) {
        setEditingCatId(null);
        setIsEditCatModalOpen(false);
        await fetchCategories();
        await fetchMenuItems(); 
      } else {
        alert('Failed to update category');
      }
    } catch (err) {
      console.error("Failed to update category", err);
    }
    setIsLoading(false);
  };

  // Delete Item Handler
  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`${API_URL}/menu_items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMenuItems();
      } else {
        alert('Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };

  // Cart Logic
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const clearCart = () => setCart([]);
  
  const handleGenerateBill = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          total_amount: subtotal - billDiscount, 
          payment_mode: paymentMode,
          discount: billDiscount,
          items: cart.map(item => ({
            item_id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty
          }))
        })
      });
      if (res.ok) {
        const orderData = await res.json();
        
        const displayId = orderData.token_no ? `#${orderData.token_no}` : `#${(orderData.order_id || '').toString().slice(0, 8).toUpperCase()}`;
        
        const fullOrderForPrint = {
          id: displayId,
          timestamp: new Date().toLocaleString(),
          items: [...cart],
          subtotal: subtotal,
          discount: billDiscount,
          total: subtotal - billDiscount,
          payment_mode: paymentMode
        };
        setPrintingOrder(fullOrderForPrint);
        
        // Clean up UI
        setIsNewOrderOpen(false);
        setBillDiscount(0);
        setIsDiscountModalOpen(false);
        clearCart();
        fetchWalletBalance();
        fetchAnalyticsSummary();
        
        // Auto-print after state reflects
        setTimeout(() => {
          window.print();
          // Clear printing state after a delay to reset the DOM
          setTimeout(() => setPrintingOrder(null), 2000);
        }, 1500);
      } else {
        alert('Failed to save order');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving order');
    }
    setIsLoading(false);
  };

  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  // --- Navigation & Back Button Handling ---
  useEffect(() => {
    // 1. Handle Modal States
    if (isNewOrderOpen) {
      window.history.pushState({ view: 'modal' }, '');
    } 
    // 2. Handle Tab States (for navigation safety)
    else if (activeTab !== 'dashboard') {
      window.history.pushState({ view: activeTab }, '');
    }

    const handlePopState = (event) => {
      // Priority 1: Close Modals
      if (isNewOrderOpen) {
        setIsNewOrderOpen(false);
        return;
      }
      
      // Priority 2: Return to Dashboard if in another tab
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNewOrderOpen, activeTab]);

  // Only fetch when a modal opens (not closes), and only if we don't have data yet
  useEffect(() => {
    if (isAddItemOpen || isViewMenuOpen || isNewOrderOpen) {
      if (categories.length === 0) fetchCategories();
      if (menuItems.length === 0) fetchMenuItems();
    }
  }, [isAddItemOpen, isViewMenuOpen, isNewOrderOpen]);

  // --- Render Sections ---
  const renderDashboard = () => {
    // Filter items for Dashboard view
    const dashboardFilteredItems = menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="admin-dashboard-body">
        <div className="dashboard-sticky-header">
          {/* Wallet Threshold Alerts */}
          {walletBalance !== null && walletBalance < 15 && walletBalance >= 10 && (
            <div style={{ 
              backgroundColor: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412',
              padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600
            }}>
              <AlertTriangle size={18} color="#f97316" />
              <span>Low Balance Alert: Your wallet is below ₹15. Please recharge soon to avoid interruption.</span>
            </div>
          )}

          {walletBalance !== null && walletBalance < 10 && (
            <div style={{ 
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '12px 16px', borderRadius: '12px', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600
            }}>
              <Lock size={18} color="#ef4444" />
              <span>Action Required: Wallet balance below ₹10. New orders are temporarily restricted.</span>
            </div>
          )}

          {/* Header containing Wallet & Action */}
          <div className="dashboard-topbar-actions">
            <div className="dashboard-actions-left">
              <h2 style={{margin: 0, color: '#1e1e2d', fontSize: '1.2rem', fontWeight: 700}}>Menu POS</h2>
              <p style={{margin: 0, color: '#a1a5b7', fontSize: '0.85rem'}}>View available inventory</p>
            </div>
            <div className="dashboard-actions-right">
              <button 
                className={`new-order-btn top-btn ${walletBalance !== null && walletBalance < 10 ? 'blocked' : ''}`} 
                onClick={() => (walletBalance === null || walletBalance >= 10) && setIsNewOrderOpen(true)}
                style={{ 
                  opacity: (walletBalance !== null && walletBalance < 10) ? 0.5 : 1, 
                  cursor: (walletBalance !== null && walletBalance < 10) ? 'not-allowed' : 'pointer',
                  backgroundColor: (walletBalance !== null && walletBalance < 10) ? '#a1a5b7' : '#6366f1'
                }}
                disabled={walletBalance !== null && walletBalance < 10}
              >
                <ShoppingCart size={18} style={{ marginRight: '8px' }} />
                {walletBalance !== null && walletBalance < 10 ? 'Blocked' : 'New Order'}
              </button>
              <div className={`wallet-card-admin top-card ${walletBalance !== null && walletBalance < 10 ? 'low-bal' : ''}`} style={{
                 border: walletBalance !== null && walletBalance < 10 ? '1px solid #ef4444' : '1px solid #eef0f5'
              }}>
                <span className="label">Wallet Balance</span>
                <span className="value" style={{ color: (walletBalance !== null && walletBalance < 10) ? '#ef4444' : '#0369a1' }}>
                  ₹{(walletBalance || 0).toLocaleString('en-IN', {minimumFractionDigits: 0})}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="dashboard-controls-row">
            <div className="search-bar-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search items..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="dashboard-search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="category-filter-tabs">
              <button 
                className={`filter-tab ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  className={`filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Display Grid representing the POS View */}
        <div className="pos-menu-grid">
          {dashboardFilteredItems.length === 0 ? (
            <div className="empty-state-msg">No items found matching your filters.</div>
          ) : (
             dashboardFilteredItems.map(item => (
                <div key={item.id} className="pos-item-card">
                  <div className="pos-item-cat">
                    {item.menu_categories ? item.menu_categories.name : 'Unknown'}
                  </div>
                  <span className="pos-item-name">{item.name}</span>
                  <span className="pos-item-price">₹{item.price}</span>
                </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const groupedDays = groupHistoryByDay();

    return (
      <div className="admin-dashboard-body">
        <div className="history-header">
          <div className="history-title-container">
            <h1>Session History</h1>
            <div className="history-subtitle">
              <div className="history-subtitle-bar"></div>
              <span>Detailed record of all table sessions and takeaways</span>
            </div>
          </div>
          <button className="history-filter-btn">Last 30 Days</button>
        </div>
        
        <div className="history-accordion">
          {groupedDays.length === 0 ? (
            <div className="empty-history">No orders found. Click "New Order" to start.</div>
          ) : (
            groupedDays.map(day => (
              <div key={day.date} className={`day-group ${expandedDays.includes(day.date) ? 'is-expanded' : ''}`}>
                <div className="day-header" onClick={() => toggleDay(day.date)}>
                  <div className="day-info">
                    <span className="day-label">{day.label}</span>
                    <div className="day-summaries">
                      <div className="summary-pill online">
                        <CreditCard size={14} /> {day.onlineCount} Online
                      </div>
                      <div className="summary-pill cash">
                        <Coins size={14} /> {day.cashCount} Cash
                      </div>
                    </div>
                  </div>
                  <div className="day-right">
                    <span className="day-total">₹{day.totalAmount.toLocaleString('en-IN')}</span>
                    <ChevronDown className={`chevron ${expandedDays.includes(day.date) ? 'up' : ''}`} size={20} />
                  </div>
                </div>

                {expandedDays.includes(day.date) && (
                  <div className="day-orders-list">
                    {day.orders.map(order => (
                      <div key={order.id} className="order-row">
                        <div className="order-time">
                          <span style={{ fontWeight: 800, color: '#6366f1', marginRight: '10px' }}>
                            {order.token_no ? `#${order.token_no}` : `#${(order.id || '').slice(0, 4)}`}
                          </span>
                          {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                        </div>
                        
                        <div className="order-badges">
                          <span className={`payment-badge ${order.payment_mode.toLowerCase()}`}>
                            {order.payment_mode}
                          </span>
                          <button className="info-btn" onClick={() => setViewingOrder(order)}>
                            <Info size={14} />
                          </button>
                        </div>

                        <div className="order-amount">
                          ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="admin-dashboard-body">
      <div className="analytics-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div className="analytics-title-container">
          <h1>Business Analytics</h1>
          <p>Real-time performance overview</p>
        </div>
        <button className="settle-btn" onClick={() => setIsSettleConfirmOpen(true)}>
          <CalendarDays size={18} /> Settle This Month
        </button>
      </div>

      <div className="analytics-overview-grid">
        {/* Today's Sales Card */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Today's Sale</h3>
            <span className="badge today">Total Bills: {analyticsSummary.today.count}</span>
          </div>
          <div className="analytics-card-value">₹{analyticsSummary.today.total.toLocaleString('en-IN')}</div>
          <div className="analytics-card-footer">
            <div className="footer-item"><span className="dot online"></span> Online: ₹{analyticsSummary.today.online.toLocaleString('en-IN')}</div>
            <div className="footer-item"><span className="dot cash"></span> Cash: ₹{analyticsSummary.today.cash.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* Yesterday's Sales Card */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Yesterday's Sale</h3>
          </div>
          <div className="analytics-card-value">₹{analyticsSummary.yesterday.total.toLocaleString('en-IN')}</div>
          <div className="analytics-card-footer">
             <div className="footer-item">Performance vs Today</div>
          </div>
        </div>

        {/* Monthly Sales Card */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>This Month Sell</h3>
          </div>
          <div className="analytics-card-value">₹{analyticsSummary.monthly.sales.toLocaleString('en-IN')}</div>
          <div className="analytics-card-footer">Settled months not included</div>
        </div>

        {/* Monthly Expense Card */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>This Month Expense</h3>
          </div>
          <div className="analytics-card-value red">₹{analyticsSummary.monthly.expenses.toLocaleString('en-IN')}</div>
          <div className="analytics-card-footer">Current active expenditures</div>
        </div>

        {/* Monthly Profit Card */}
        <div className="analytics-card highlighted">
          <div className="analytics-card-header">
            <h3>This Month Profit</h3>
            <Coins size={20} color="#10b981" />
          </div>
          <div className="analytics-card-value green">₹{analyticsSummary.monthly.profit.toLocaleString('en-IN')}</div>
          <div className="analytics-card-footer">Sales minus Expenses</div>
        </div>
      </div>

      {/* Monthly Settlement History */}
      <div className="settlement-history-container" style={{marginTop: '3rem'}}>
        <div className="section-header">
          <h2 style={{fontSize: '1.4rem', fontWeight: 700, color: '#1e1e2d'}}>Monthly Settlement History</h2>
          <p style={{color: '#a1a5b7', fontSize: '0.9rem'}}>Overview of archived months and finalized profits</p>
        </div>

        <div className="expense-card" style={{marginTop: '1.5rem', padding: '0'}}>
          <table className="expense-table" style={{borderRadius: '16px', overflow: 'hidden'}}>
            <thead style={{backgroundColor: '#fcfcfd'}}>
              <tr>
                <th style={{padding: '1.2rem'}}>Month & Year</th>
                <th>Total Sell</th>
                <th>Total Expense</th>
                <th>Net Profit</th>
                <th style={{textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '3rem', color: '#a1a5b7'}}>
                    No settled months yet. Use the "Settle This Month" button to archive data.
                  </td>
                </tr>
              ) : (
                settlements.map(s => (
                  <tr key={s.id}>
                    <td style={{padding: '1.2rem', fontWeight: 700}}>{s.month_label}</td>
                    <td style={{fontWeight: 600}}>₹{parseFloat(s.total_sales).toLocaleString('en-IN')}</td>
                    <td 
                      style={{color: '#ef4444', fontWeight: 600, cursor: 'pointer'}} 
                      onClick={() => fetchSettlementExpenses(s)}
                      title="Click to view details"
                    >
                      ₹{parseFloat(s.total_expenses).toLocaleString('en-IN')}
                    </td>
                    <td style={{color: '#10b981', fontWeight: 800}}>₹{parseFloat(s.net_profit).toLocaleString('en-IN')}</td>
                    <td>
                      <div style={{display: 'flex', justifyContent: 'center'}}>
                        <button className="history-filter-btn" onClick={() => fetchSettlementExpenses(s)} style={{fontSize: '0.75rem'}}>
                          View Expenses
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="admin-dashboard-body">
      <div className="analytics-header">
        <h1>Expense Management</h1>
        <p>Track and manage your business expenditures</p>
      </div>

      <div className="expenses-layout">
        {/* Left Column: Form */}
        <div className="expense-card">
          <h3 className="expense-card-title">Add New Expense</h3>
          
          <div className="expense-form-group">
            <label>Expense Name</label>
            <input 
              type="text" 
              className="expense-input" 
              placeholder="e.g. Rent, Electricity" 
              value={newExpenseName} 
              onChange={(e) => setNewExpenseName(e.target.value)}
            />
          </div>

          <div className="expense-form-group">
            <label>Amount (₹)</label>
            <input 
              type="number" 
              className="expense-input" 
              placeholder="0.00" 
              value={newExpenseAmount} 
              onChange={(e) => setNewExpenseAmount(e.target.value)}
            />
          </div>

          <div className="expense-form-group">
            <label>Date</label>
            <input 
              type="date" 
              className="expense-input" 
              value={newExpenseDate} 
              onChange={(e) => setNewExpenseDate(e.target.value)}
            />
          </div>

          <button 
            className="expense-submit-btn" 
            onClick={handleAddExpense}
            disabled={isLoading || !newExpenseName.trim() || !newExpenseAmount}
          >
            {isLoading ? 'Wait...' : 'Add Expense'}
          </button>
        </div>

        {/* Right Column: List */}
        <div className="expense-card">
          <h3 className="expense-card-title">Recent Expenses</h3>
          
          <div className="expense-list-container">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount (₹)</th>
                  <th>Date</th>
                  <th style={{textAlign: 'center'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '3rem', color: '#a1a5b7'}}>
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.description}</td>
                      <td className="exp-amount">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                      <td className="exp-date">{new Date(exp.created_at).toLocaleDateString('en-GB')}</td>
                      <td>
                        <div style={{display: 'flex', justifyContent: 'center'}}>
                          <button className="exp-delete-btn" onClick={() => setDeletingExpenseId(exp.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-dashboard-body">
      <div className="expenses-header">
        <div className="expenses-title-container">
          <h1>Settings</h1>
        </div>
      </div>

      <div className="admin-settings-layout">
        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <span className="admin-settings-card-title">Payment & UPI</span>
            <span className="admin-settings-badge">Account</span>
          </div>
          <div className="admin-setting-group">
            <label>Receiver UPI ID</label>
            <input type="text" className="admin-setting-input" defaultValue="paytm.example@upi" />
          </div>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <span className="admin-settings-card-title">Menu Management</span>
            <span className="admin-settings-badge gray">Inventory</span>
          </div>
          
          <button className="btn-primary-purple" onClick={() => setIsAddItemOpen(true)}>
            + Add Item
          </button>
          
          <button className="btn-secondary-white" onClick={() => setIsViewMenuOpen(true)}>
            <Eye size={16} /> View Menu ({menuItems.length})
          </button>
        </div>

        <div className="admin-settings-card">
          <div className="admin-settings-card-header">
            <span className="admin-settings-card-title">Active Commission</span>
            <span className="admin-settings-badge gray">₹2</span>
          </div>
          <div className="toggle-group">
            <div className="toggle-btn active-green">Enable</div>
            <div className="toggle-btn">Disable</div>
          </div>
        </div>
      </div>
      
      <div className="bottom-save-container">
        <button className="save-all-btn">Save All Changes</button>
      </div>
    </div>
  );

  return (
    <div className={`admin-dashboard ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>}
      
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'show' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon">P</div>
          <span className="admin-logo-title">PoolCafe</span>
          <button className="mobile-close-sidebar" onClick={() => setIsMobileSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { handleTabClick('dashboard'); setIsMobileSidebarOpen(false); }}><Home size={20} /><span>Dashboard</span></div>
        <div className={`admin-menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { handleTabClick('history'); setIsMobileSidebarOpen(false); }}><History size={20} /><span>History</span></div>
        <div className={`admin-menu-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { handleTabClick('analytics'); setIsMobileSidebarOpen(false); }}>
          <BarChart2 size={20} /><span>Analytics</span><Lock size={14} className="lock-icon" />
        </div>
        <div className={`admin-menu-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => { handleTabClick('expenses'); setIsMobileSidebarOpen(false); }}>
          <Receipt size={20} /><span>Expenses</span><Lock size={14} className="lock-icon" />
        </div>
        <div className={`admin-menu-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { handleTabClick('settings'); setIsMobileSidebarOpen(false); }}>
          <Settings size={20} /><span>Settings</span><Lock size={14} className="lock-icon" />
        </div>
        
        <div className="admin-sidebar-footer">
          <div 
            onClick={() => window.open(window.location.origin + '/superadmin', '_blank')}
            style={{ 
              fontSize: '10px', color: '#a1a5b7', textAlign: 'center', 
              cursor: 'default', padding: '5px', opacity: 0.3 
            }}
          >
            Super Admin View
          </div>
          <button className="admin-logout-btn" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu-btn" onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="admin-topbar-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</div>
          <div className="user-profile">
            <div className="user-info"><span className="user-name">Admin</span></div>
            <div className="avatar"><User size={20} /></div>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="modal-overlay" onClick={() => setIsAddItemOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Menu Configuration</h2>
              <button className="close-modal-btn" onClick={() => setIsAddItemOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-section">
              <h3 className="modal-section-title">1. Create Category</h3>
              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Category Name</label>
                  <input type="text" className="modal-form-input" placeholder="e.g. Hot Drinks" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                </div>
                <button className="modal-btn-add" onClick={handleAddCategory} disabled={isLoading || !newCategoryName.trim()}>
                  {isLoading ? 'Saving...' : 'Add Category'}
                </button>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">2. Add Menu Item</h3>
              <div className="modal-form-row" style={{marginBottom: '1rem'}}>
                <div className="modal-form-group">
                  <label>Select Category</label>
                  <select className="modal-form-input" value={itemCategoryId} onChange={(e) => setItemCategoryId(e.target.value)}>
                    <option value="">-- Choose Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-form-row">
                <div className="modal-form-group" style={{flex: 2}}>
                  <label>Item Name</label>
                  <input type="text" className="modal-form-input" placeholder="e.g. Cappuccino" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                </div>
                <div className="modal-form-group" style={{flex: 1}}>
                  <label>Price (₹)</label>
                  <input type="number" className="modal-form-input" placeholder="150" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} />
                </div>
                <button className="modal-btn-add" onClick={handleAddItem} disabled={isLoading || !newItemName.trim() || !newItemPrice || !itemCategoryId}>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Menu Modal */}
      {isViewMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsViewMenuOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Current Menu</h2>
              <button className="close-modal-btn" onClick={() => setIsViewMenuOpen(false)}><X size={24} /></button>
            </div>
            
            {menuItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a1a5b7' }}>No items in the menu yet. Add some first!</div>
            ) : (
              <div className="grouped-menu-container">
                {categories.map(cat => {
                  const catItems = menuItems.filter(item => item.category_id === cat.id);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.id} className="menu-group">
                      <div className="menu-group-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #eef0f5', marginBottom: '0.8rem', paddingBottom: '0.4rem' }}>
                        <h3 className="menu-group-title" style={{ borderBottom: 'none', margin: 0, padding: 0 }}>{cat.name}</h3>
                        <div className="cat-action-btns" style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            className="icon-action-btn edit" 
                            onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setIsEditCatModalOpen(true); }} 
                            title="Rename Category" 
                            style={{ 
                              padding: '6px', backgroundColor: '#f3f6ff', border: 'none', borderRadius: '6px', 
                              cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center' 
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            className="icon-action-btn delete" 
                            onClick={() => handleDeleteCategory(cat.id)} 
                            title="Delete Category"
                            style={{ 
                              padding: '6px', backgroundColor: '#fff5f8', border: 'none', borderRadius: '6px', 
                              cursor: 'pointer', color: '#f1416c', display: 'flex', alignItems: 'center' 
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="menu-group-grid">
                        {catItems.map(item => (
                          <div key={item.id} className="menu-item-card">
                            <span className="item-name">{item.name}</span>
                            
                            {editingItemId === item.id ? (
                              <div className="inline-edit-group">
                                <span className="currency-symbol">₹</span>
                                <input 
                                  type="number" 
                                  className="inline-edit-input" 
                                  value={editItemPrice} 
                                  onChange={(e) => setEditItemPrice(e.target.value)} 
                                  autoFocus 
                                />
                                <button className="inline-save-btn" onClick={() => handleUpdateMenuItem(item.id)}>Save</button>
                                <button className="inline-cancel-btn" onClick={() => setEditingItemId(null)}><X size={14}/></button>
                              </div>
                            ) : (
                              <div className="item-price-row">
                                <span className="item-price">₹{item.price}</span>
                                <div className="item-actions">
                                  <button className="icon-action-btn edit" onClick={() => { setEditingItemId(item.id); setEditItemPrice(item.price); }} title="Edit Price">
                                    <Pencil size={14} />
                                  </button>
                                  <button className="icon-action-btn delete" onClick={() => handleDeleteMenuItem(item.id)} title="Delete Item">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {isNewOrderOpen && (
        <div className="modal-overlay" onClick={() => setIsNewOrderOpen(false)}>
          <div className="modal-content new-order-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2>Create New Order</h2>
                <div className="wallet-badge-mini" style={{
                  backgroundColor: '#f0fdf4', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600
                }}>
                  Balance: ₹{walletBalance}
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setIsNewOrderOpen(false)}><X size={24} /></button>
            </div>
        
            <div className="new-order-layout">
              {/* Left Side: Categories & Menu */}
              <div className="new-order-left">
                {/* Search and Filter Inputs (Sticky) */}
                <div className="order-filter-header sticky-filters" style={{ 
                  position: 'sticky', 
                  top: 0, 
                  backgroundColor: '#fff', 
                  zIndex: 10, 
                  padding: '0.8rem 0', 
                  marginBottom: '1rem',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.8rem',
                  borderBottom: '1px solid #f8f9fa'
                }}>
                  <div className="search-box order-search" style={{ position: 'relative' }}>
                    <Search className="search-icon-pos" size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a5b7' }} />
                    <input 
                      type="text" 
                      placeholder="Search menu..." 
                      className="order-search-input"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      style={{ padding: '0.6rem 2.2rem 0.6rem 2.2rem', width: '100%', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                    {orderSearch && (
                      <button 
                        className="clear-search-btn"
                        onClick={() => setOrderSearch('')}
                        title="Clear search"
                        style={{ right: '0.6rem' }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="category-filter-pills" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
                    <button 
                      className={`pill-btn ${orderCategory === 'All' ? 'active' : ''}`}
                      onClick={() => setOrderCategory('All')}
                      style={{ padding: '0.4rem 1rem', borderRadius: '50px', border: '1px solid #eef0f5', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.8rem', background: orderCategory === 'All' ? '#6366f1' : '#fff', color: orderCategory === 'All' ? '#fff' : '#5e6278' }}
                    >
                      All Items
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        className={`pill-btn ${orderCategory === cat.name ? 'active' : ''}`}
                        onClick={() => setOrderCategory(cat.name)}
                        style={{ padding: '0.4rem 1rem', borderRadius: '50px', border: '1px solid #eef0f5', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.8rem', background: orderCategory === cat.name ? '#6366f1' : '#fff', color: orderCategory === cat.name ? '#fff' : '#5e6278' }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grouped-menu-container">
                  {categories
                    .filter(cat => orderCategory === 'All' || orderCategory === cat.name)
                    .map(cat => {
                    const filteredItems = menuItems.filter(item => 
                      item.category_id === cat.id && 
                      item.name.toLowerCase().includes(orderSearch.toLowerCase())
                    );
                    
                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={cat.id} className="menu-group">
                        <h3 className="order-category-title">{cat.name}</h3>
                        <div className="order-items-grid">
                          {filteredItems.map(item => (
                            <div key={item.id} className="order-item-card" onClick={() => addToCart(item)}>
                              <span className="name">{item.name}</span>
                              <span className="price">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Side: Cart */}
              <div className="new-order-right">
                <h3 className="cart-title">Order Cart</h3>
                <div className="cart-items-container">
                  {cart.length === 0 ? (
                    <div className="empty-cart-msg">Cart is empty. Click items to add.</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="cart-item-row" style={{ padding: '0.5rem 0', marginBottom: '0.4rem' }}>
                        <div className="cart-item-info">
                          <span className="cart-item-name" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</span>
                          <span className="cart-item-price" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>₹{item.price * item.qty}</span>
                        </div>
                        <div className="cart-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, -1)} style={{ width: '24px', height: '24px', border: '1px solid #eef0f5', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}><Minus size={12} /></button>
                          <span className="cart-qty-val" style={{ fontWeight: 600, minWidth: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{item.qty}</span>
                          <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, 1)} style={{ width: '24px', height: '24px', border: '1px solid #eef0f5', background: '#fff', borderRadius: '4px', cursor: 'pointer' }}><Plus size={12} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="cart-footer" style={{ padding: '0.6rem 1rem' }}>
                  <div className="payment-mode-selector" style={{ marginBottom: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                    <button 
                      className={`mode-btn ${paymentMode === 'Cash' ? 'active' : ''}`}
                      onClick={() => setPaymentMode('Cash')}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #eef0f5', fontSize: '0.8rem', fontWeight: 600, backgroundColor: paymentMode === 'Cash' ? '#1e1e2d' : '#fff', color: paymentMode === 'Cash' ? '#fff' : '#5e6278' }}
                    >
                      Cash
                    </button>
                    <button 
                      className={`mode-btn ${paymentMode === 'Online' ? 'active' : ''}`}
                      onClick={() => setPaymentMode('Online')}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #eef0f5', fontSize: '0.8rem', fontWeight: 600, backgroundColor: paymentMode === 'Online' ? '#1e1e2d' : '#fff', color: paymentMode === 'Online' ? '#fff' : '#5e6278' }}
                    >
                      Online
                    </button>
                  </div>
                  
                  {/* Small Discount Toggle Button */}
                  <div className="cart-discount-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                    <button 
                      className="add-discount-link" 
                      onClick={() => { setTempDiscount(billDiscount); setIsDiscountModalOpen(true); }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: billDiscount > 0 ? '#10b981' : '#6366f1', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        padding: '0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.3rem' 
                      }}
                    >
                      {billDiscount > 0 ? <Pencil size={12} /> : <Plus size={12} />}
                      {billDiscount > 0 ? `Edit Discount (₹${billDiscount})` : 'Add Discount (₹)'}
                    </button>
                    {billDiscount > 0 && (
                      <button 
                        onClick={() => setBillDiscount(0)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="cart-total-section" style={{ marginTop: '0.4rem' }}>
                    {billDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#5e6278', marginBottom: '0.1rem' }}>
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {billDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.1rem' }}>
                        <span>Discount</span>
                        <span>- ₹{billDiscount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#1e1e2d' }}>
                      <span style={{ fontWeight: 700 }}>Total</span>
                      <span>₹{(subtotal - billDiscount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <button 
                    className="gen-bill-btn" 
                    style={{
                      width: '100%',
                      marginTop: '0.6rem',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      background: walletBalance < 10 ? '#cbd5e1' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: walletBalance < 10 ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onClick={handleGenerateBill}
                    disabled={cart.length === 0 || isLoading || walletBalance < 10}
                  >
                    {isLoading ? 'Processing...' : walletBalance < 10 ? 'Balance Low (₹10 Req)' : 'Generate Bill'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-left">
                <h2>Order Details</h2>
                <span className="detail-time">
                  {new Date(viewingOrder.created_at).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                  })}
                </span>
              </div>
              <div className="detail-header-actions" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <button 
                  className="reprint-header-btn" 
                  onClick={() => handleReprintOrder(viewingOrder)}
                  title="Re-print Receipt"
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: '#6366f1', 
                    border: 'none', 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.color = '#6366f1'; }}
                >
                  <Printer size={18} />
                </button>
                <button className="close-modal-btn" onClick={() => setViewingOrder(null)}><X size={24} /></button>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-items-list">
                <div className="detail-item-header">
                  <span>Item Name</span>
                  <span style={{textAlign: 'center'}}>Qty</span>
                  <span style={{textAlign: 'right'}}>Price</span>
                </div>
                {viewingOrder.order_items && viewingOrder.order_items.map((item, idx) => (
                  <div key={idx} className="detail-item-row">
                    <span className="name">{item.item_name}</span>
                    <span className="qty">× {item.qty}</span>
                    <span className="subtotal">₹{item.price_at_time * item.qty}</span>
                  </div>
                ))}
              </div>
              
              <div className="detail-footer">
                <div className="price-summary">
                  <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#5e6278', fontSize: '0.9rem' }}>
                    <span>Subtotal</span>
                    <span>₹{(viewingOrder.order_items?.reduce((acc, mi) => acc + (mi.price_at_time * mi.qty), 0) || 0).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {parseFloat(viewingOrder.discount || 0) > 0 && (
                    <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#ef4444', fontSize: '0.9rem' }}>
                      <span>Discount</span>
                      <span>- ₹{parseFloat(viewingOrder.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="summary-line total">
                    <span>Grand Total</span>
                    <span>₹{parseFloat(viewingOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="summary-line pmode">
                    <span>Payment Mode</span>
                    <span className={`pmode-val ${viewingOrder.payment_mode.toLowerCase()}`}>
                      {viewingOrder.payment_mode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation */}
      {deletingExpenseId && (
        <div className="modal-overlay" onClick={() => setDeletingExpenseId(null)}>
          <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-container">
              <Trash2 size={32} />
            </div>
            <h2>Are you sure?</h2>
            <p style={{color: '#5e6278', marginTop: '0.5rem'}}>Do you really want to delete this expense? This action cannot be undone.</p>
            
            <div className="confirm-modal-btns">
              <button className="confirm-btn-cancel" onClick={() => setDeletingExpenseId(null)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleDeleteExpense} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Month Confirmation */}
      {isSettleConfirmOpen && (
        <div className="modal-overlay" onClick={() => setIsSettleConfirmOpen(false)}>
          <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-container" style={{backgroundColor: '#eef2ff', color: '#6366f1'}}>
              <CalendarDays size={32} />
            </div>
            <h2>Settle This Month?</h2>
            <p style={{color: '#5e6278', marginTop: '0.5rem'}}>
              This will archive all current sales and expenses. Your dashboard counters will reset to ₹0 for the new period.
            </p>
            
            <div className="confirm-modal-btns">
              <button className="confirm-btn-cancel" onClick={() => setIsSettleConfirmOpen(false)}>Cancel</button>
              <button className="confirm-btn-delete" onClick={handleSettleMonth} disabled={isLoading} style={{backgroundColor: '#6366f1'}}>
                {isLoading ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settled Expenses Detail Modal */}
      {viewingSettlementExpenses && selectedSettlement && (
        <div className="modal-overlay" onClick={() => setViewingSettlementExpenses(null)}>
          <div className="modal-content expense-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="expense-detail-header">
              <div className="expense-detail-titles">
                <h2>Expense Details</h2>
                <p>Breakdown for {selectedSettlement.month_label}</p>
              </div>
              <button className="close-expense-modal" onClick={() => setViewingSettlementExpenses(null)}><X size={20} /></button>
            </div>
            
            <div className="expense-detail-body">
              <table className="expense-detail-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DESCRIPTION</th>
                    <th style={{textAlign: 'right'}}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingSettlementExpenses.length === 0 ? (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '3rem', color: '#a1a5b7'}}>No expenses recorded.</td></tr>
                  ) : (
                    viewingSettlementExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td className="exp-dt">{new Date(exp.created_at).toISOString().split('T')[0]}</td>
                        <td className="exp-desc">{exp.description}</td>
                        <td className="exp-amt">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="expense-detail-footer">
              <span className="total-label">Total Expenditure</span>
              <span className="total-value">₹{parseFloat(selectedSettlement.total_expenses).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Order Detail Modal --- */}
      {viewingOrder && (
        <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
          <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-left">
                <h2>Order Details</h2>
                <span className="detail-time">
                  {new Date(viewingOrder.created_at).toLocaleString('en-GB', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
                  })}
                </span>
              </div>
              <div className="detail-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button 
                  className="reprint-header-btn" 
                  onClick={() => handleReprintOrder(viewingOrder)}
                  title="Re-print Receipt"
                  style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    color: '#6366f1', 
                    border: 'none', 
                    padding: '0.6rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Printer size={18} />
                </button>
                <button className="close-modal-btn" onClick={() => setViewingOrder(null)}><X size={24} /></button>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-item-header">
                <span>ITEMS</span>
                <span style={{textAlign: 'center'}}>QTY</span>
                <span style={{textAlign: 'right'}}>AMOUNT</span>
              </div>
              <div className="detail-items-list">
                {viewingOrder.order_items?.map((item, idx) => (
                  <div key={idx} className="detail-item-row">
                    <span className="name">{item.item_name}</span>
                    <span className="qty">{item.qty}</span>
                    <span className="subtotal">₹{(item.price_at_time * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              
              <div className="detail-footer">
                <div className="price-summary">
                  <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#5e6278', fontSize: '0.9rem' }}>
                    <span>Subtotal</span>
                    <span>₹{(viewingOrder.order_items?.reduce((acc, mi) => acc + (mi.price_at_time * mi.qty), 0) || 0).toLocaleString('en-IN')}</span>
                  </div>
                  
                  {parseFloat(viewingOrder.discount || 0) > 0 && (
                    <div className="summary-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#ef4444', fontSize: '0.9rem' }}>
                      <span>Discount</span>
                      <span>- ₹{parseFloat(viewingOrder.discount).toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="summary-line total">
                    <span>Grand Total</span>
                    <span>₹{parseFloat(viewingOrder.total_amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="summary-line pmode">
                    <span>Payment Mode</span>
                    <span className={`pmode-val ${viewingOrder.payment_mode.toLowerCase()}`}>
                      {viewingOrder.payment_mode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Discount Modal */}
      {isDiscountModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setIsDiscountModalOpen(false)}>
          <div className="modal-content mini-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '320px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>Apply Discount</h3>
            <div className="modal-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Amount (₹)</label>
              <input 
                autoFocus
                type="number"
                className="modal-form-input"
                placeholder="0"
                value={tempDiscount === 0 ? '' : tempDiscount}
                onChange={(e) => setTempDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                onKeyPress={(e) => e.key === 'Enter' && (setBillDiscount(tempDiscount), setIsDiscountModalOpen(false))}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="confirm-btn-cancel" 
                style={{ flex: 1, padding: '0.6rem' }} 
                onClick={() => setIsDiscountModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="generate-bill-btn" 
                style={{ flex: 1, padding: '0.6rem' }} 
                onClick={() => { setBillDiscount(tempDiscount); setIsDiscountModalOpen(false); }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PERFECT THERMAL RECEIPT (80mm POS Style) --- */}
      {/* Rendered via Portal directly into <body> so CSS body > .receipt-print-area selector works */}
      {printingOrder && ReactDOM.createPortal(
        <div className="receipt-print-area">

          {/* ═══════════════════════════════════
              PAGE 1 — CUSTOMER BILL
              ═══════════════════════════════════ */}
          <div className="print-bill-section">

            {/* ── CAFE HEADER ── */}
            <div className="receipt-cafe-name">YB'S Cafe</div>
            <div className="receipt-cafe-address">Marunji Road, Hinjawadi Phase 1, Pune</div>

            <hr className="receipt-header-divider" />

            {/* ── BILL META ── */}
            <div className="receipt-meta-row">
              <span>Token:</span>
              <span>{printingOrder.id}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Date:</span>
              <span>{new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Time:</span>
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
            <div className="receipt-meta-row">
              <span>Payment:</span>
              <span>{printingOrder.payment_mode}</span>
            </div>

            <hr className="divider-dotted" />

            {/* ── ITEMS TABLE ── */}
            <table className="receipt-table">
              <thead>
                <tr>
                  <th className="it-name">ITEM</th>
                  <th className="it-qty">QTY</th>
                  <th className="it-price">PRICE</th>
                </tr>
              </thead>
              <tbody>
                {printingOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="it-name">{item.name}</td>
                    <td className="it-qty">{item.qty}</td>
                    <td className="it-price">Rs.{(item.price * item.qty).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="divider-solid" />

            {/* ── TOTALS ── */}
            <div className="tot-row">
              <span>Subtotal</span>
              <span>Rs.{printingOrder.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {printingOrder.discount > 0 && (
              <div className="tot-row">
                <span>Discount</span>
                <span>- Rs.{printingOrder.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="tot-row grand">
              <span>GRAND TOTAL</span>
              <span>Rs.{printingOrder.total.toLocaleString('en-IN')}</span>
            </div>

            <hr className="receipt-header-divider" />

            {/* ── FOOTER ── */}
            <div className="receipt-footer">
              <span className="thanks-msg">Thank You!</span>
              <span className="receipt-footer-sub">Visit Again &bull; YB'S Cafe</span>
              <span className="receipt-footer-sub" style={{ marginTop: '1mm' }}>System by VB Designs</span>
            </div>

          </div>
          {/* END PAGE 1 */}

          {/* ═══════════════════════════════════
              PAGE 2 — KITCHEN TOKEN SLIP
              (Prints as a separate page)
              ═══════════════════════════════════ */}
          <div className="print-token-section">

            <div className="token-slip-title">🎫 KITCHEN TOKEN</div>

            <div className="token-number-display">{printingOrder.id}</div>

            <hr className="divider-solid" />

            <table className="token-items-table">
              <tbody>
                {printingOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="tok-name">{item.name}</td>
                    <td className="tok-qty">× {item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <hr className="divider-solid" />

            <div className="token-slip-footer">YB'S CAFE — KITCHEN</div>

          </div>
          {/* END PAGE 2 */}

        </div>,

        document.body
      )}
      {/* Section Security Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content security-access-modal animate-fade-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', textAlign: 'center' }}>
              <div style={{ margin: '0 auto', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Lock size={30} color="#6366f1" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Secure Access</h2>
              <p style={{ color: '#a1a5b7', fontSize: '0.9rem' }}>Enter the master password to unlock sensitive system sections.</p>
            </div>
            <form onSubmit={handleSecurityUnlock} style={{ padding: '0 1rem' }}>
              <div className="modal-form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5e6278' }}>Password Required</label>
                <div className="input-wrapper" style={{ marginTop: '0.5rem' }}>
                  <Lock size={16} className="input-icon" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a5b7' }} />
                  <input 
                    type="password" 
                    className="modal-form-input" 
                    placeholder="••••••••"
                    value={sectionPassword}
                    onChange={(e) => setSectionPassword(e.target.value)}
                    autoFocus
                    style={{ padding: '12px 12px 12px 40px', fontSize: '1rem', border: '1px solid #eef0f5', color: '#1e1e2d' }} 
                  />
                </div>
              </div>
              <div className="modal-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem', paddingBottom: '1.5rem' }}>
                <button type="button" className="modal-btn-cancel" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" className="modal-btn-add" style={{ margin: 0, backgroundColor: '#6366f1' }}>Unlock</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Rename Category Modal */}
      {isEditCatModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-fade-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Rename Category</h2>
              <button className="close-modal-btn" onClick={() => setIsEditCatModalOpen(false)}><X size={24} /></button>
            </div>
            <div className="modal-form-group" style={{ padding: '0 1.5rem' }}>
              <label>Category Name</label>
              <input 
                type="text" 
                className="modal-form-input" 
                value={editCatName} 
                onChange={(e) => setEditCatName(e.target.value)} 
                autoFocus
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            <div className="modal-actions" style={{ marginTop: '1.5rem', padding: '1.5rem', borderTop: '1px solid #eef0f5' }}>
              <button 
                className="modal-btn-add" 
                style={{ width: '100%', margin: 0 }} 
                onClick={() => handleUpdateCategory(editingCatId)}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Name'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
