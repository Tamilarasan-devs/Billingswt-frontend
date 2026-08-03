import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Barcode as BarcodeIcon, Printer, Search, CheckSquare, Square, 
  Layers, Download, Plus, Minus, RotateCcw, Tag, Check, Filter,
  FileText, Copy, AlertCircle, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import { getProducts } from '../services/productService';
import { getBusinessProfile } from '../services/businessService';

const StickerBarcode = ({ value, width = 1.8, height = 40, fontSize = 12 }) => {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value.toString().trim(), {
          format: "CODE128",
          lineColor: "#000000",
          width: width,
          height: height,
          displayValue: true,
          fontSize: fontSize,
          font: "monospace",
          textMargin: 4,
          margin: 2,
          background: "#ffffff"
        });
      } catch (err) {
        console.error("Sticker barcode error:", err);
      }
    }
  }, [value, width, height, fontSize]);
  if (!value) return <span className="text-xs text-rose-500 font-mono">Invalid Barcode</span>;
  return <svg ref={svgRef} className="max-w-full h-auto mx-auto block" />;
};

const BarcodeGenerator = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [copiesMap, setCopiesMap] = useState({});
  const [printLayout, setPrintLayout] = useState('grid'); // 'grid' (A4 Sheet 3 columns) | 'roll' (Thermal Sticker Roll 50x30mm)
  const [printTarget, setPrintTarget] = useState(null); // null means print selected/all, or specific product ID when clicking single print

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch all products for sticker generation
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products-barcodes', debouncedSearch],
    queryFn: () => getProducts(1, 10000, debouncedSearch),
  });

  const { data: profileData } = useQuery({
    queryKey: ['business-profile'],
    queryFn: getBusinessProfile,
  });

  const profile = profileData?.data || {};
  const currency = profile.currency || '₹';
  const storeBrandName = profile.businessName || 'STORE NAME';

  const products = data?.data?.products || [];

  // Initialize copies map with default 1 copy per product when loaded
  useEffect(() => {
    if (products.length > 0) {
      setCopiesMap(prev => {
        const next = { ...prev };
        products.forEach(p => {
          if (!(p.id in next)) {
            next[p.id] = 1;
          }
        });
        return next;
      });
    }
  }, [products]);

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
      toast.success('Deselected all products');
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
      toast.success(`Selected all ${products.length} products`);
    }
  };

  const toggleSelectProduct = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const updateCopies = (id, count) => {
    const val = Math.max(1, Math.min(500, Number(count) || 1));
    setCopiesMap(prev => ({ ...prev, [id]: val }));
  };

  const handleMatchStock = () => {
    const nextCopies = { ...copiesMap };
    products.forEach(p => {
      if (selectedIds.size === 0 || selectedIds.has(p.id)) {
        nextCopies[p.id] = Math.max(1, Number(p.stockQuantity) || 1);
      }
    });
    setCopiesMap(nextCopies);
    toast.success('Updated sticker quantities to match inventory stock!');
  };

  // Compute total stickers that will be generated
  const productsToPrint = printTarget 
    ? products.filter(p => p.id === printTarget)
    : (selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : products);

  const totalStickerCount = productsToPrint.reduce((sum, p) => sum + (copiesMap[p.id] || 1), 0);

  const handlePrint = (singleTargetId = null) => {
    if (singleTargetId) {
      setPrintTarget(singleTargetId);
    } else {
      setPrintTarget(null);
      if (productsToPrint.length === 0) {
        toast.error('No products available to print');
        return;
      }
    }
    toast.success('Preparing sticker labels for printer...');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Generate expanded array of individual sticker items to print based on copies count
  const expandedStickers = [];
  productsToPrint.forEach(p => {
    const count = printTarget ? 1 : (copiesMap[p.id] || 1);
    for (let i = 0; i < count; i++) {
      expandedStickers.push({ product: p, index: i });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Dynamic Print Stylesheet for Stickers */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
            background: #ffffff !important;
          }
          #sticker-print-area, #sticker-print-area * {
            visibility: visible !important;
            color: #000000 !important;
          }
          #sticker-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
          }
          ${printLayout === 'roll' ? `
            @page {
              size: 50mm 30mm;
              margin: 2mm;
            }
            .sticker-card {
              width: 100% !important;
              height: 100% !important;
              break-after: page !important;
              page-break-after: always !important;
              margin-bottom: 0 !important;
              border: 1px solid #ddd !important;
              padding: 2mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
              text-align: center !important;
            }
          ` : `
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            .sticker-grid-container {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 4mm !important;
              width: 100% !important;
            }
            .sticker-card {
              border: 1px dashed #bbb !important;
              border-radius: 4px !important;
              padding: 3mm !important;
              text-align: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
          `}
        }
      `}</style>

      {/* Top Title & Summary Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <BarcodeIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Barcode Sticker Studio</h1>
              <p className="text-slate-500 text-sm">Generate, customize quantities, and print high-resolution optical garment & textile labels.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleMatchStock}
            className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs flex items-center justify-center gap-2 border border-slate-200"
            title="Set print copies to match available inventory stock"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Match Stock Qty</span>
          </button>

          <button
            onClick={() => handlePrint(null)}
            disabled={products.length === 0 || isLoading}
            className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>
              {selectedIds.size > 0 
                ? `Print Selected (${selectedIds.size} Items / ${totalStickerCount} Stickers)` 
                : `Print All (${products.length} Items / ${totalStickerCount} Stickers)`}
            </span>
          </button>
        </div>
      </div>

      {/* Toolbar & Layout Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by Name or SKU / Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
          {/* Select All Checkbox */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            {products.length > 0 && selectedIds.size === products.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{selectedIds.size === products.length && products.length > 0 ? 'Deselect All' : 'Select All'}</span>
          </button>

          {/* Print Layout Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setPrintLayout('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all ${printLayout === 'grid' ? 'bg-white shadow-sm text-emerald-700' : 'hover:text-slate-900'}`}
              title="Standard A4 Sticker Paper (3 Columns Grid)"
            >
              📄 A4 Sticker Sheet (Grid)
            </button>
            <button
              onClick={() => setPrintLayout('roll')}
              className={`px-3 py-1.5 rounded-lg transition-all ${printLayout === 'roll' ? 'bg-white shadow-sm text-emerald-700' : 'hover:text-slate-900'}`}
              title="Individual thermal barcode printer roll (50x30mm)"
            >
              🖨️ Thermal Roll (Single)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid of Barcode Cards */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold">Loading product inventory & generating optical barcodes...</p>
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-rose-600 bg-rose-50 rounded-3xl border border-rose-200 font-medium">
          Failed to load inventory for barcode generation. Please check server connection.
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center bg-slate-50/70 rounded-3xl border border-dashed border-slate-300">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
          <p className="text-slate-500 text-sm mt-1">Try clearing your search filter or add products in Inventory first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const copies = copiesMap[product.id] || 1;
            const price = parseFloat(product.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

            return (
              <div 
                key={product.id} 
                className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                  isSelected ? 'border-emerald-500/80 ring-2 ring-emerald-500/10 bg-emerald-50/10' : 'border-slate-200/80'
                }`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelectProduct(product.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors pt-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <div className="overflow-hidden">
                        <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 truncate" title={product.productName}>
                          {product.productName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>SKU: <strong className="font-mono text-slate-700">{product.productCode}</strong></span>
                          {product.size && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase">
                              {product.size}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200/60 font-mono shrink-0">
                      ₹{price}
                    </span>
                  </div>

                  {/* Barcode Preview Badge */}
                  <div className="my-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden">
                    <div className="text-[10px] font-black tracking-widest uppercase text-slate-800 mb-1 truncate max-w-full px-1">
                      {storeBrandName}
                    </div>
                    <div className="bg-white py-1.5 px-3 rounded-lg border border-slate-100 shadow-sm w-full flex justify-center">
                      <StickerBarcode value={product.barcode || product.productCode || product.id} width={1.6} height={38} fontSize={11} />
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-700 mt-1.5 flex items-center justify-between w-full px-1">
                      <span>MRP: {currency}{price}</span>
                      <span className="text-slate-500 font-normal">{product.fabricType || product.category || 'Retail'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Control Section */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Copies Adjuster */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 mr-0.5">Copies:</span>
                    <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
                      <button
                        onClick={() => updateCopies(product.id, copies - 1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={copies}
                        onChange={(e) => updateCopies(product.id, e.target.value)}
                        className="w-10 text-center text-xs font-black font-mono bg-transparent focus:outline-none text-slate-900"
                      />
                      <button
                        onClick={() => updateCopies(product.id, copies + 1)}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Print Single Button */}
                  <button
                    onClick={() => handlePrint(product.id)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 border border-blue-200/50 shadow-xs"
                    title="Print only this sticker"
                  >
                    <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Print Target Area (Only active during window.print()) */}
      <div id="sticker-print-area" className="hidden print:block">
        <div className={printLayout === 'grid' ? 'sticker-grid-container' : ''}>
          {expandedStickers.map(({ product, index }, i) => {
            const priceFormatted = parseFloat(product.sellingPrice || 0).toFixed(2);
            const barcodeVal = product.barcode || product.productCode || product.id;
            return (
              <div key={`${product.id}-${index}-${i}`} className="sticker-card p-3 bg-white font-mono text-slate-950">
                <div className="text-[11px] font-black uppercase tracking-wider text-center text-slate-950 truncate max-w-full">
                  {storeBrandName}
                </div>
                <div className="text-[10px] font-bold truncate text-center my-0.5 text-slate-900">
                  {product.productName} {product.size ? `(${product.size})` : ''}
                </div>
                <div className="w-full flex justify-center my-1">
                  <StickerBarcode value={barcodeVal} width={1.7} height={36} fontSize={10} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black px-2 mt-0.5 border-t border-slate-200 pt-0.5 text-slate-950">
                  <span>SKU: {product.productCode}</span>
                  <span className="font-extrabold text-[11px]">MRP: {currency}{priceFormatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BarcodeGenerator;
