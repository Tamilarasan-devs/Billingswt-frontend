import { X, Printer, Package } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:static print:z-0">
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={onClose}
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 animate-fade-in overflow-hidden print:shadow-none print:w-full print:max-w-full print:h-auto print:overflow-visible">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 print:hidden shrink-0">
          <h3 className="text-xl font-bold text-slate-900">Invoice Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Printable Content Area */}
        <div className="flex-1 min-h-0 p-0 overflow-y-auto print:overflow-visible print:p-0" id="printable-invoice">
          {/* Top colored bar for design */}
          <div className="h-2 w-full bg-blue-600 print:bg-blue-600" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
          
          <div className="p-8 sm:p-12">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-3 text-blue-600">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 tracking-tight block">BillingPro</span>
                  <span className="text-xs font-semibold text-blue-600 tracking-widest uppercase">Invoice System</span>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-2">Invoice</h1>
                <p className="text-slate-900 font-bold text-xl">{invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12 pb-12 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billed To</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <p className="text-lg font-bold text-slate-900">{invoice.customerName}</p>
                  {invoice.customerMobile && (
                    <p className="text-slate-500 mt-1 font-medium">{invoice.customerMobile}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                  <p className="text-slate-900 font-semibold">{new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Terms</p>
                  <p className="text-slate-900 font-semibold">Due on Receipt</p>
                </div>
              </div>
            </div>

            <div className="mb-12 rounded-xl overflow-hidden border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <tr>
                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs">Description</th>
                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-center w-24">Qty</th>
                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-right w-32">Rate</th>
                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {invoice.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{item.product?.productName || 'Unknown Product'}</p>
                        <p className="text-slate-500 text-xs mt-0.5">SKU: {item.product?.productCode || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-700 font-medium">{item.quantity}</td>
                      <td className="py-4 px-6 text-right text-slate-700">₹{parseFloat(item.unitPrice).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-slate-900 font-bold">₹{parseFloat(item.subTotal).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-12">
              <div className="w-80 bg-slate-50 rounded-2xl p-6 border border-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="text-slate-900 font-bold text-lg">₹{parseFloat(invoice.grandTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-900 font-black text-lg">Total Due</span>
                  <span className="text-blue-600 font-black text-3xl">₹{parseFloat(invoice.grandTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-slate-900 font-bold mb-1">Thank you for your business!</p>
                  <p className="text-slate-500 text-sm">If you have any questions about this invoice, please contact us.</p>
                </div>
                <div className="text-right sm:text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">BillingPro Inc.</p>
                  <p className="text-slate-500 text-sm">123 Business Avenue, Suite 100<br/>contact@billingpro.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoiceModal;
