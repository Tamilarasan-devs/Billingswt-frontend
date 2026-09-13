import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, History, Menu } from 'lucide-react';

const BottomNav = ({ onOpenMenu }) => {
  const leftItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
  ];

  const rightItems = [
    { name: 'History', path: '/sales', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-1.5 flex items-center justify-around lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden">
      {leftItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-2 py-1 rounded-xl min-w-[56px] transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 scale-105' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Center Highlighted POS Billing Action */}
      <NavLink
        to="/billing"
        className="flex flex-col items-center justify-center min-w-[64px] group"
      >
        {({ isActive }) => (
          <>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 -mt-3 border-2 border-white ${
              isActive 
                ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-600/40 scale-105' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
            }`}>
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className={`text-[10px] font-extrabold tracking-tight mt-0.5 ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
              Billing
            </span>
          </>
        )}
      </NavLink>

      {rightItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-2 py-1 rounded-xl min-w-[56px] transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 scale-105' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* More / Menu Action */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open MORE Navigation Menu"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl min-w-[56px] text-slate-500 hover:text-slate-800 font-medium transition-all duration-200"
      >
        <div className="p-1.5 rounded-xl">
          <Menu className="w-5 h-5 stroke-[1.75]" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
      </button>
    </nav>
  );
};

export default BottomNav;
