import { Search, Bell, User, Package, WifiOff } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOfflineInvoices } from '../utils/offlineSync';

const Navbar = () => {
  const { user } = useAuth();
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setOfflineCount(getOfflineInvoices().length);
    };

    updateCount();
    window.addEventListener('offline-invoices-updated', updateCount);
    window.addEventListener('online', updateCount);
    window.addEventListener('offline', updateCount);

    return () => {
      window.removeEventListener('offline-invoices-updated', updateCount);
      window.removeEventListener('online', updateCount);
      window.removeEventListener('offline', updateCount);
    };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10">
      <div className="flex items-center flex-1 gap-4">
        <div className="flex items-center gap-2.5 lg:hidden text-blue-600">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shadow-xs">
            <Package className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">Uno Tech</span>
        </div>
        <div className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            placeholder="Search anywhere..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {offlineCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 animate-pulse text-xs font-bold shadow-xs">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{offlineCount} Unsynced Bills</span>
          </div>
        )}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <Link 
          to="/profile" 
          title="Open Business Profile"
          className="flex items-center gap-3 p-1.5 -mr-1.5 rounded-2xl hover:bg-slate-50 transition-all group"
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{user?.fullName || 'Admin User'}</span>
            <span className="text-xs text-slate-500">Administrator</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
