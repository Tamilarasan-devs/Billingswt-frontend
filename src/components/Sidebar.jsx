import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, History, LogOut, Barcode as BarcodeIcon, Store, Shield, Users } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products & Inventory', path: '/products', icon: Package },
  { name: 'Barcode Studio', path: '/barcodes', icon: BarcodeIcon },
  { name: 'Billing POS', path: '/billing', icon: FileText },
  { name: 'Sales History', path: '/sales', icon: History },
  { name: 'Business Profile', path: '/profile', icon: Store },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logoutUser } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">BillingPro</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}

          {user?.role === 'SUPER_ADMIN' && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Admin Control
              </div>
              <NavLink
                to="/admin/licenses"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-blue-700 bg-blue-50/60 hover:bg-blue-100/70 hover:text-blue-900'
                  }`
                }
              >
                <Shield className="w-5 h-5 text-blue-500" />
                License Manager
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 to-teal-900 text-white shadow-md shadow-slate-900/10'
                      : 'text-teal-700 bg-teal-50/60 hover:bg-teal-100/70 hover:text-teal-900'
                  }`
                }
              >
                <Users className="w-5 h-5 text-teal-600" />
                Registered Clients
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-200">
        <button
          onClick={logoutUser}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
