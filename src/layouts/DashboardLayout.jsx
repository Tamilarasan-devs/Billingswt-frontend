import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import LicenseExpiredModal from '../components/LicenseExpiredModal';
import { useAuth } from '../store/AuthContext';
import { getBusinessProfile } from '../services/businessService';
import { useQueryClient } from '@tanstack/react-query';
import { syncOfflineInvoices } from '../utils/offlineSync';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Attempt syncing immediately on load if online
    if (navigator.onLine) {
      syncOfflineInvoices(queryClient);
    }

    const handleOnline = () => {
      syncOfflineInvoices(queryClient);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [queryClient]);

  useEffect(() => {
    const updateTitleWithBusinessName = async () => {
      try {
        if (user?.role === 'SUPER_ADMIN') {
          document.title = 'Super Admin - SaaS Control Center';
          return;
        }
        const res = await getBusinessProfile();
        if (res?.data?.businessProfile?.businessName) {
          document.title = `${res.data.businessProfile.businessName} | Uno Tech`;
        } else {
          document.title = 'Uno Tech';
        }
      } catch (error) {
        document.title = 'Uno Tech';
      }
    };

    updateTitleWithBusinessName();
  }, [user]);

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
          <Navbar />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-24 lg:pb-8 print:overflow-visible print:bg-white print:p-0">
          <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="print:hidden">
        <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} />
      </div>
    </div>
  );
};

export default DashboardLayout;
