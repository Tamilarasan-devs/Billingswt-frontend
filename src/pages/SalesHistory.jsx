import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, FileText, Eye, List, Grid, Download } from 'lucide-react';
import { getInvoices } from '../services/billingService';
import InvoiceModal from '../components/InvoiceModal';

const SalesHistory = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices', page, limit],
    queryFn: () => getInvoices(page, limit),
    keepPreviousData: true,
  });

  const invoices = data?.data?.invoices || [];
  const totalPages = data?.data?.totalPages || 1;
  const totalRevenue = data?.data?.totalRevenue || 0;

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const getProductNames = (items) => {
    if (!items || items.length === 0) return 'No items';
    const names = items.map(item => item.product?.productName).filter(Boolean);
    if (names.length === 0) return 'Unknown items';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await getInvoices(1, 100000); // Fetch all for export
      const allInvoices = res?.data?.invoices || [];
      
      const headers = ['Invoice No', 'Date', 'Customer Name', 'Customer Mobile', 'Total Items', 'Grand Total (INR)'];
      const csvRows = [headers.join(',')];
      
      allInvoices.forEach(inv => {
        const row = [
          inv.invoiceNumber,
          new Date(inv.invoiceDate).toLocaleDateString(),
          `"${inv.customerName}"`,
          inv.customerMobile || 'N/A',
          inv.totalQuantity,
          inv.grandTotal
        ];
        csvRows.push(row.join(','));
      });
      
      // Add total revenue row at the bottom
      const finalTotal = res?.data?.totalRevenue || 0;
      csvRows.push('');
      csvRows.push(`"","","","","Total Revenue:",${finalTotal}`);
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sales_History_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500 text-sm mt-1">View all your past transactions and generated invoices.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto mt-4 sm:mt-0">
          {/* Total Revenue Badge */}
          {!isLoading && !isError && (
            <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider hidden lg:inline">Total Revenue:</span>
              <span className="text-lg font-black text-emerald-700">₹{parseFloat(totalRevenue).toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={isExporting || isLoading || invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>

          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Card view"
              aria-pressed={viewMode === 'grid'}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 items-center p-2 border-b border-slate-50">
                    <div className="h-5 bg-slate-100 rounded w-32"></div>
                    <div className="h-5 bg-slate-100 rounded w-24"></div>
                    <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-5 bg-slate-100 rounded w-16"></div>
                    <div className="h-5 bg-slate-100 rounded w-24 ml-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500">Failed to load sales history.</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No sales yet</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't generated any invoices. Create a bill to see it here.
            </p>
          </div>
        ) : (
          <div>
            <div className={`${viewMode === 'table' ? 'hidden md:block' : 'hidden'} overflow-x-auto`}>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Invoice No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4 text-right">Grand Total</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 capitalize">{invoice.customerName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-700 truncate max-w-[200px]" title={getProductNames(invoice.items)}>
                            {getProductNames(invoice.items)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 shrink-0">
                            x{invoice.totalQuantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        ₹{parseFloat(invoice.grandTotal).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Grid Card View */}
            <div className={`${viewMode === 'grid' ? 'block' : 'block md:hidden'} p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 bg-slate-50/30`}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1 capitalize">{invoice.customerName}</h3>
                      <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">{invoice.invoiceNumber}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 shrink-0">
                      {invoice.totalQuantity} items
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      <span className="font-semibold text-slate-700">Items: </span>
                      {getProductNames(invoice.items)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50 mt-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                      <p className="text-xl font-black text-slate-900 tabular-nums">₹{parseFloat(invoice.grandTotal).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      View Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm text-slate-500 tabular-nums">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:hover:shadow-none transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default SalesHistory;
