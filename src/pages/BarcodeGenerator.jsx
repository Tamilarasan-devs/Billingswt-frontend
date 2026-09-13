import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Barcode as BarcodeIcon, Search, CheckSquare, Square,
  Layers, Download, Plus, Minus, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { getProducts } from '../services/productService';
import { getBusinessProfile } from '../services/businessService';

// Render a barcode SVG (generated on-demand) to a PNG data URL for PDF embedding.
const generateBarcodePng = (value) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, String(value).trim(), {
    format: "CODE128",
    lineColor: "#000000",
    width: 1.7,
    height: 36,
    displayValue: true,
    fontSize: 10,
    font: "monospace",
    textMargin: 4,
    margin: 2,
    background: "#ffffff"
  });
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize barcode'));
    };
  });
};

// Ellipsize text so it never overflows its allocated width on the label.
const truncateForWidth = (pdf, text, maxWidth) => {
  if (pdf.getTextWidth(text) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
};

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
  const [pdfLayout, setPdfLayout] = useState('grid'); // 'grid' (A4 Sheet 3 columns) | 'roll' (Thermal Sticker Roll 50x30mm)
  const [isPdfRendering, setIsPdfRendering] = useState(false);

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

  // Compute total stickers that will be generated for the bulk (non-single) download
  const productsToDownload = selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : products;
  const totalStickerCount = productsToDownload.reduce((sum, p) => sum + (copiesMap[p.id] || 1), 0);

  const handleDownloadPDF = async (singleTargetId = null) => {
    const targetProducts = singleTargetId
      ? products.filter(p => p.id === singleTargetId)
      : productsToDownload;
    if (targetProducts.length === 0) {
      toast.error('No products available to download');
      return;
    }
    setIsPdfRendering(true);
    try {
      // Build the ordered list of individual stickers (product + copy index).
      const stickers = [];
      for (const p of targetProducts) {
        const count = singleTargetId ? 1 : (copiesMap[p.id] || 1);
        const barcodeVal = p.barcode || p.productCode || p.id;
        for (let i = 0; i < count; i++) {
          const img = await generateBarcodePng(barcodeVal);
          stickers.push({ product: p, index: i, img });
        }
      }

      const priceOf = (p) => parseFloat(p.sellingPrice || 0).toFixed(2);

      // jsPDF's built-in fonts only support WinAnsi glyphs, so ₹ prints as a
      // stray apostrophe. Map it to a safe "Rs." prefix; leave other symbols
      // ($, €, £) as-is since those are supported.
      const pdfCurrency = currency === '₹' ? 'Rs. ' : currency;

      const drawSticker = (pdf, sticker, x, y, w, h) => {
        const { product, img } = sticker;
        const padX = 3;

        // Clean white label with a crisp hairline border.
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, w, h, 'F');
        pdf.setDrawColor(210, 210, 210);
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, w, h, 'S');

        // --- Header: brand name ---
        pdf.setTextColor(15, 15, 15);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text(truncateForWidth(pdf, storeBrandName.toUpperCase(), w - padX * 2), x + w / 2, y + 4.5, { align: 'center' });

        // --- Product name + size ---
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.2);
        pdf.setTextColor(70, 70, 70);
        pdf.text(
          truncateForWidth(pdf, `${product.productName}${product.size ? ` (${product.size})` : ''}`, w - padX * 2),
          x + w / 2,
          y + 8,
          { align: 'center' }
        );

        // Divider under the header block.
        pdf.setDrawColor(225, 225, 225);
        pdf.setLineWidth(0.15);
        pdf.line(x + padX, y + 9.6, x + w - padX, y + 9.6);

        // --- Barcode, centered in its own reserved band ---
        const barcodeTop = y + 10.8;
        const barcodeBottom = y + h - 7.2;
        const availW = w - padX * 2 - 2;
        const availH = barcodeBottom - barcodeTop;
        const scale = Math.min(availW / img.width, availH / img.height);
        const iw = img.width * scale;
        const ih = img.height * scale;
        pdf.addImage(img.dataUrl, 'PNG', x + (w - iw) / 2, barcodeTop + (availH - ih) / 2, iw, ih);

        // Divider above the footer block.
        pdf.setDrawColor(225, 225, 225);
        pdf.line(x + padX, y + h - 6, x + w - padX, y + h - 6);

        // --- Footer row: SKU (left), MRP (right), baseline-aligned ---
        const footerY = y + h - 2.6;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.3);
        pdf.setTextColor(15, 15, 15);
        pdf.text(truncateForWidth(pdf, `SKU: ${product.productCode}`, w / 2 - padX), x + padX, footerY);
        pdf.text(`MRP: ${pdfCurrency}${priceOf(product)}`, x + w - padX, footerY, { align: 'right' });
      };

      if (pdfLayout === 'roll') {
        // One professional 50x30mm thermal label per page.
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [50, 30] });
        stickers.forEach((s, i) => {
          if (i > 0) pdf.addPage();
          drawSticker(pdf, s, 1.5, 1.5, 47, 27);
        });
        pdf.save(`barcode-stickers-roll${singleTargetId ? `-${targetProducts[0].productCode}` : ''}.pdf`);
      } else {
        // A4 portrait, clean 3-column grid.
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = 210, pageH = 297, margin = 10, gap = 4;
        const cols = 3;
        const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
        const cellH = 42, rowGap = 4;
        const rowsPerPage = Math.floor((pageH - margin * 2 + rowGap) / (cellH + rowGap));
        const perPage = cols * rowsPerPage;
        stickers.forEach((s, i) => {
          const posOnPage = i % perPage;
          if (i > 0 && posOnPage === 0) pdf.addPage();
          const col = posOnPage % cols;
          const row = Math.floor(posOnPage / cols);
          const x = margin + col * (cellW + gap);
          const y = margin + row * (cellH + rowGap);
          drawSticker(pdf, s, x, y, cellW, cellH);
        });
        pdf.save(`barcode-stickers-a4${singleTargetId ? `-${targetProducts[0].productCode}` : ''}.pdf`);
      }
      toast.success(`PDF downloaded (${stickers.length} stickers)`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsPdfRendering(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Title & Summary Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <BarcodeIcon className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Barcode Sticker Studio</h1>
            <p className="text-slate-500 text-sm">Generate, customize quantities, and export high-resolution garment & textile labels as PDF.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <button
            onClick={handleMatchStock}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs flex items-center justify-center gap-2 border border-slate-200"
            title="Set sticker copies to match available inventory stock"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Match Stock Qty</span>
          </button>

          <button
            onClick={() => handleDownloadPDF()}
            disabled={products.length === 0 || isLoading || isPdfRendering}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-extrabold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPdfRendering ? (
              <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            )}
            <span className="truncate">
              {selectedIds.size > 0
                ? `Download PDF (${selectedIds.size} Items / ${totalStickerCount} Stickers)`
                : `Download PDF (${products.length} Items / ${totalStickerCount} Stickers)`}
            </span>
          </button>
        </div>
      </div>

      {/* Toolbar & Layout Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU / barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 md:justify-end">
          {/* Select All Checkbox */}
          <button
            onClick={toggleSelectAll}
            className="flex items-center justify-center gap-2 text-xs font-extrabold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            {products.length > 0 && selectedIds.size === products.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{selectedIds.size === products.length && products.length > 0 ? 'Deselect All' : 'Select All'}</span>
          </button>

          {/* PDF Layout Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto">
            <button
              onClick={() => setPdfLayout('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${pdfLayout === 'grid' ? 'bg-white shadow-sm text-emerald-700' : 'hover:text-slate-900'}`}
              title="Standard A4 sticker sheet (3 column grid)"
            >
              📄 A4 Sticker Sheet
            </button>
            <button
              onClick={() => setPdfLayout('roll')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${pdfLayout === 'roll' ? 'bg-white shadow-sm text-emerald-700' : 'hover:text-slate-900'}`}
              title="Individual thermal barcode roll (50x30mm, one label per page)"
            >
              🧾 Thermal Roll
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const copies = copiesMap[product.id] || 1;
            const price = parseFloat(product.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between relative shadow-sm hover:shadow-md ${isSelected ? 'border-emerald-500/80 ring-2 ring-emerald-500/10 bg-emerald-50/10' : 'border-slate-200/80'
                  }`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleSelectProduct(product.id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors pt-0.5 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 truncate" title={product.productName}>
                          {product.productName}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
                      <span className="text-slate-500 font-normal truncate max-w-[45%]">{product.fabricType || product.category || 'Retail'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Control Section */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
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

                  {/* Single Item PDF Download */}
                  <button
                    onClick={() => handleDownloadPDF(product.id)}
                    disabled={isPdfRendering}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 border border-emerald-200/50 shadow-xs disabled:opacity-50"
                    title="Download this sticker as a PDF"
                  >
                    {isPdfRendering ? (
                      <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BarcodeGenerator;