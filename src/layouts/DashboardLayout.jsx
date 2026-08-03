import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import LicenseExpiredModal from '../components/LicenseExpiredModal';
import { useAuth } from '../store/AuthContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Check if normal user license is expired or revoked
  const isExpired = user && user.role !== 'SUPER_ADMIN' && (
    !user.license || 
    user.license.status === 'EXPIRED' || 
    user.license.status === 'DISABLED' || 
    (user.license.expiresAt && new Date() > new Date(user.license.expiresAt))
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:h-auto print:bg-white print:overflow-visible relative">
      <LicenseExpiredModal isOpen={isExpired} />
      <div className="print:hidden">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible w-full min-w-0">
        <div className="print:hidden">
          <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8 print:overflow-visible print:bg-white print:p-0">
          <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
