import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import JsBarcode from 'jsbarcode';
import { getBusinessProfile } from '../services/businessService';

const ReceiptBarcode = ({ value }) => {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value.toString(), {
          format: "CODE128",
          lineColor: "#000000",
          width: 1.6,
          height: 38,
          displayValue: false,
          margin: 0,
          background: "transparent"
        });
      } catch (err) {
        console.error("Barcode drawing error:", err);
      }
    }
  }, [value]);
  if (!value) return null;
  return <svg ref={svgRef} className="mx-auto my-1 block max-w-[220px]" />;
};

const ThermalReceipt = ({ invoice, items = [], dateString = null }) => {
  const { data: profileData } = useQuery({
    queryKey: ['business-profile'],
    queryFn: getBusinessProfile,
  });

  const profile = profileData?.data || {};
  const currency = profile.currency || '₹';

  if (!invoice) return null;

  const displayDate = dateString || new Date(invoice.invoiceDate || Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const listItems = items.length > 0 ? items : (invoice.items || []);
  const itemCount = listItems.length;
  const totalQty = listItems.reduce((acc, it) => acc + Number(it.quantity || 0), 0) || Number(invoice.totalQuantity || 0);

  // Calculate totals and adapt item structure
  let computedSubTotal = 0;
  const renderedItems = listItems.map((item, idx) => {
    const pName = item.product?.productName || item.productName || 'Unknown Product';
    const pSize = item.product?.size || item.size || '';
    const pUnit = item.product?.unit || item.unit || 'Pcs';
    const rate = parseFloat(item.product?.sellingPrice || item.unitPrice || item.rate || 0);
    const qty = Number(item.quantity || 0);
    const amt = parseFloat(item.subTotal || (rate * qty));
    computedSubTotal += amt;
    return { id: item.id || idx, name: pName, size: pSize, unit: pUnit, rate, qty, amt };
  });

  const discountVal = Number(invoice.discount || 0);
  const netTotal = parseFloat(invoice.grandTotal || (computedSubTotal - discountVal));

  return (
    <div className="flex flex-col items-center w-full">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
            background: #fff !important;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible !important;
            color: #000 !important;
          }
          #thermal-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            max-width: 4in !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            font-size: 11pt !important;
            font-family: 'Courier New', Courier, monospace !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: 4in auto;
            margin: 0mm;
          }
        }
      `}</style>

      <div 
        id="thermal-receipt" 
        className="w-[384px] bg-white text-slate-950 p-6 rounded-none border-2 border-slate-300 shadow-2xl font-mono text-xs leading-relaxed transition-all relative"
      >
        {/* Receipt Header */}
        <div className="text-center pb-3 border-b-2 border-dashed border-slate-800">
          <h3 className="text-base font-black uppercase tracking-tight text-slate-950">
            {profile.businessName || 'YOUR STORE NAME'}
          </h3>
          {profile.tagline && (
            <p className="text-[11px] font-semibold text-slate-800">
              {profile.tagline}
            </p>
          )}
          {profile.address && (
            <p className="text-[10px] font-medium text-slate-700 mt-0.5 px-2 leading-tight">
              {profile.address}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-3 text-[10px] font-bold text-slate-800 mt-0.5">
            {profile.phone && <span>Ph: {profile.phone}</span>}
            {profile.gstin && <span>GSTIN: {profile.gstin}</span>}
          </div>
          <p className="text-[11px] font-medium text-slate-700 mt-1">Date: {displayDate}</p>
          <p className="text-xs font-black mt-1 bg-slate-100 py-0.5 rounded px-2 inline-block">INV: {invoice.invoiceNumber}</p>
        </div>

        {/* Customer Info */}
        <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>Customer:</span>
            <span className="text-right uppercase truncate max-w-[200px]">{invoice.customerName || 'Walk-in Customer'}</span>
          </div>
          {invoice.customerMobile && (
            <div className="flex justify-between font-semibold mt-0.5">
              <span>Phone:</span>
              <span>{invoice.customerMobile}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold mt-0.5">
            <span>Pay Mode:</span>
            <span className="font-bold uppercase text-blue-900">{invoice.paymentMode || 'Cash'}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="py-2.5 border-b-2 border-dashed border-slate-800">
          <div className="grid grid-cols-12 gap-1 font-black text-[11px] border-b border-slate-300 pb-1 mb-2 text-slate-950 uppercase">
            <span className="col-span-5">Item Details</span>
            <span className="col-span-3 text-center">Qty/Unit</span>
            <span className="col-span-4 text-right">Amount</span>
          </div>

          <div className="space-y-2.5">
            {renderedItems.map((item, index) => (
              <div key={item.id || index} className="text-[11px] font-semibold text-slate-900">
                <div className="font-bold text-slate-950 leading-tight">
                  {index + 1}. {item.name}
                </div>
                <div className="grid grid-cols-12 gap-1 text-slate-800 pl-2 mt-0.5 items-baseline">
                  <span className="col-span-5 text-[10px] text-slate-600 font-medium">
                    @ ₹{item.rate.toFixed(2)}
                    {item.size ? ` [${item.size}]` : ''}
                  </span>
                  <span className="col-span-3 text-center font-bold font-mono">
                    {item.qty} {item.unit}
                  </span>
                  <span className="col-span-4 text-right font-black font-mono text-slate-950 text-xs">
                    ₹{item.amt.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="py-3 border-b-2 border-dashed border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between font-semibold text-slate-700">
            <span>Total Items / Qty:</span>
            <span className="font-bold font-mono text-slate-900">{itemCount} Items ({Number(totalQty).toFixed(2)} Qty)</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-700">
            <span>Subtotal Amount:</span>
            <span className="font-bold font-mono text-slate-900">{currency}{computedSubTotal.toFixed(2)}</span>
          </div>
          {discountVal > 0 && (
            <div className="flex justify-between font-bold text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded">
              <span>Discount Applied:</span>
              <span className="font-mono text-slate-900">- {currency}{discountVal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-black text-sm pt-2.5 border-t border-slate-400 text-slate-950">
            <span className="uppercase tracking-tight text-base">NET TOTAL:</span>
            <span className="font-mono text-lg font-black">{currency}{netTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Remarks/Notes */}
        {invoice.notes && (
          <div className="py-2 border-b border-dashed border-slate-400 text-[10px] italic text-slate-700">
            <span className="font-bold block text-slate-900 not-italic uppercase text-[9px]">Customer Remarks / Notes:</span>
            {invoice.notes}
          </div>
        )}

        {/* Footer & Scannable Barcode */}
        <div className="pt-4 text-center space-y-2">
          {profile.footerMessage && (
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-950">
              {profile.footerMessage}
            </p>
          )}
          {profile.termsAndConditions && (
            <p className="text-[10px] text-slate-600 leading-tight">
              {profile.termsAndConditions}
            </p>
          )}
          <div className="pt-2 flex flex-col items-center">
            <ReceiptBarcode value={invoice.invoiceNumber || invoice.id} />
            <span className="text-[10px] font-mono font-extrabold tracking-widest text-slate-950 uppercase mt-0.5">
              {invoice.invoiceNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
