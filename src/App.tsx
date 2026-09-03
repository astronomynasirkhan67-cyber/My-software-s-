import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Reports } from './pages/Reports';
import { BackupRestore } from './pages/BackupRestore';
import { QuickSearchModal } from './pages/QuickSearchModal';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  ShoppingCart, 
  FileText, 
  Database, 
  Search, 
  LogOut, 
  Settings as SettingsIcon,
  Sparkles
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isInitialSetup, login, logout, checkSetupStatus } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'sales' | 'reports' | 'backup'>('dashboard');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);

  // Setup Screen State
  const [setupShop, setSetupShop] = useState('My Shop');
  const [setupUser, setSetupUser] = useState('admin');
  const [setupPass, setSetupPass] = useState('');

  // Login Screen State
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Global Keyboard Shortcuts (Ctrl+F, Ctrl+B, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCurrentTab('backup');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePerformSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.api.auth.setup({
      shopName: setupShop,
      currency: '$',
      username: setupUser,
      password: setupPass
    });
    await checkSetupStatus();
    login(setupUser);
  };

  const handlePerformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await window.api.auth.login({ username: loginUser, password: loginPass });
    if (res.success && res.username) {
      login(res.username);
    } else {
      setLoginError(res.message || 'Authentication failed');
    }
  };

  const loadDemoData = async () => {
    await window.api.dev.loadDemoData();
    alert('Demo product catalog loaded successfully!');
    window.location.reload();
  };

  // 1. Initial Launch Wizard
  if (isInitialSetup) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-100">Shop Setup Wizard</h2>
          <p className="text-sm text-slate-400 mt-1">Initialize your private offline SQLite inventory database.</p>
          <form onSubmit={handlePerformSetup} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Shop Name</label>
              <input
                type="text"
                required
                value={setupShop}
                onChange={(e) => setSetupShop(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Admin Username</label>
              <input
                type="text"
                required
                value={setupUser}
                onChange={(e) => setSetupUser(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Admin Password</label>
              <input
                type="password"
                required
                value={setupPass}
                onChange={(e) => setSetupPass(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition"
            >
              Complete Initialization
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Admin Login Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-100">My Shop Inventory</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to access local store records</p>
          </div>
          {loginError && <p className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg">{loginError}</p>}
          <form onSubmit={handlePerformLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Username</label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase">Password</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Authenticated Shop Terminal Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-extrabold text-indigo-400 text-lg tracking-wide">MY SHOP MANAGER</h2>
            <p className="text-xs text-slate-500">Offline SQLite v1.0.0</p>
          </div>
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('sales')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'sales' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="w-4 h-4" /> Sales / Stock Out
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" /> Reports & Audits
            </button>
            <button
              onClick={() => setCurrentTab('backup')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                currentTab === 'backup' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" /> Backup & Restore
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={loadDemoData}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-400 rounded-lg border border-slate-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5" /> Seed Demo Catalog
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 rounded-lg border border-rose-500/30 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout Terminal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar with Instant Lookup shortcut */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between">
          <button
            onClick={() => setIsQuickSearchOpen(true)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 text-sm text-slate-400 transition w-96 justify-between"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Search products & scan barcodes...</span>
            </span>
            <kbd className="text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-400">Ctrl+F</kbd>
          </button>

          <div className="text-xs text-slate-400">
            Offline Mode: <span className="text-emerald-400 font-bold">ACTIVE (Local SQLite)</span>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'sales' && <Sales />}
          {currentTab === 'reports' && <Reports />}
          {currentTab === 'backup' && <BackupRestore />}
        </main>
      </div>

      {/* Barcode & Global Product Lookup Modal */}
      <QuickSearchModal isOpen={isQuickSearchOpen} onClose={() => setIsQuickSearchOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
