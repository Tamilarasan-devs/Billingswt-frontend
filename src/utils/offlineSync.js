import toast from 'react-hot-toast';
import { createInvoice } from '../services/billingService';

const STORAGE_KEY = 'offline_invoices';

export const getOfflineInvoices = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading offline invoices:', error);
    return [];
  }
};

export const saveOfflineInvoice = (payload) => {
  const offlineInvoices = getOfflineInvoices();
  const timestamp = Date.now();
  const tempInvoiceNumber = `TXB-OFFLINE-${timestamp}`;

  // Create a mock invoice object for immediate printing/display in the frontend
  const mockInvoice = {
    id: `temp-${timestamp}`,
    invoiceNumber: tempInvoiceNumber,
    invoiceDate: new Date().toISOString(),
    customerName: payload.customerName,
    customerMobile: payload.customerMobile,
    paymentMode: payload.paymentMode,
    discount: payload.discount,
    notes: payload.notes,
    totalQuantity: payload.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    grandTotal: 0, // Will be computed in receipt, but let's store it
    isOffline: true,
    payload // Save the raw payload for later sync
  };

  offlineInvoices.push(mockInvoice);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineInvoices));

  // Trigger custom event to notify other components (e.g. Navbar) that pending invoice count changed
  window.dispatchEvent(new Event('offline-invoices-updated'));

  return mockInvoice;
};

export const syncOfflineInvoices = async (queryClient = null) => {
  if (!navigator.onLine) return;

  const offlineInvoices = getOfflineInvoices();
  if (offlineInvoices.length === 0) return;

  const toastId = toast.loading(`Syncing ${offlineInvoices.length} offline invoice(s)...`);
  let successCount = 0;
  let failCount = 0;
  const remainingInvoices = [];

  for (const invoice of offlineInvoices) {
    try {
      // Send the saved payload to the backend
      await createInvoice(invoice.payload);
      successCount++;
    } catch (error) {
      console.error(`Failed to sync invoice for ${invoice.customerName}:`, error);
      // Keep it in the queue for retry if it was a network error, or discard if it was a bad request
      const isNetworkError = !error.response || error.message === 'Network Error';
      if (isNetworkError) {
        remainingInvoices.push(invoice);
      } else {
        // Discard invalid data but log it
        failCount++;
      }
    }
  }

  // Update storage with remaining unsynced invoices
  if (remainingInvoices.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingInvoices));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event('offline-invoices-updated'));

  toast.dismiss(toastId);

  if (successCount > 0) {
    toast.success(`Successfully synced ${successCount} offline invoice(s)!`);
    if (queryClient) {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardStats']);
      queryClient.invalidateQueries(['productsSearch']);
    }
  }

  if (failCount > 0) {
    toast.error(`Failed to sync ${failCount} invalid invoice(s). Checked details for errors.`);
  }
};
