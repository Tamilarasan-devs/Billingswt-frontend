import { X, Printer, Package } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import ThermalReceipt from './ThermalReceipt';

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
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" 
        onClick={onClose}
      />
      
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col relative z-10 animate-fade-in overflow-hidden border border-slate-200 print:shadow-none print:w-full print:max-w-full print:h-auto print:overflow-visible print:bg-white print:border-none">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200/80 print:hidden shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">4-Inch Thermal POS Receipt</h3>
              <p className="text-[11px] font-mono text-slate-500 font-semibold">{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-xs shadow-sm hover:shadow"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Bill</span>
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
        
        {/* Printable Content Area with Thermal Receipt Preview */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto flex justify-center print:overflow-visible print:p-0 print:block bg-slate-100/80 print:bg-white">
          <div className="py-2 w-full flex justify-center">
            <ThermalReceipt invoice={invoice} />
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="px-6 py-3 bg-white border-t border-slate-200/80 print:hidden shrink-0 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Format: Standard 4" (100mm) Thermal Roll</span>
          <button
            onClick={onClose}
            className="text-slate-600 font-bold hover:underline"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InvoiceModal;
