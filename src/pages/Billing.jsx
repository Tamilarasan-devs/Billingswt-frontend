import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Package, CheckCircle2, 
  ChevronDown, Barcode as BarcodeIcon, User, Phone, Calendar, Hash, Printer, 
  Save, CreditCard, Wallet, Smartphone, Building, MoreHorizontal, History, 
  X, RotateCcw, FileText, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../services/productService';
import { createInvoice } from '../services/billingService';
import ThermalReceipt from '../components/ThermalReceipt';

const PAYMENT_MODES = [
  { id: 'Cash', label: 'Cash', icon: Wallet },
  { id: 'Card', label: 'Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'Net Banking', label: 'Net Banking', icon: Building },
  { id: 'Others', label: 'Others', icon: MoreHorizontal },
];

const Billing = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Form & Cart State
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [cart, setCart] = useState([]);

  // Search State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Success / Print State
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [shouldPrint, setShouldPrint] = useState(false);

  // Current Date Display
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date().toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Products for Search
  const { data: productsData, isLoading: isSearching } = useQuery({
    queryKey: ['productsSearch', debouncedSearch],
    queryFn: () => getProducts(1, 50, debouncedSearch),
  });

  const searchResults = productsData?.data?.products || [];

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['productsSearch']);
      queryClient.invalidateQueries(['dashboardStats']);
      queryClient.invalidateQueries(['invoices']);
      const inv = res.data.invoice;
      setCreatedInvoice(inv);
      setIsSuccess(true);
      toast.success('Invoice saved successfully!');
      if (shouldPrint) {
        toast.success('Sending 4-inch bill to printer...');
        setTimeout(() => {
          window.print();
        }, 600);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  });

  const handleAddToCart = (product) => {
    if (Number(product.stockQuantity) <= 0 && product.itemType !== 'Service') {
      toast.error(`"${product.productName}" is out of stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= Number(product.stockQuantity) && product.itemType !== 'Service') {
          toast.error('Cannot add more than available stock in inventory');
          return prevCart;
        }
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Number((item.quantity + 1).toFixed(2)) }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setSearch('');
    setIsDropdownOpen(false);
    toast.success(`Added ${product.productName} to bill`, { duration: 1500, position: 'bottom-right' });
  };

  const updateQuantity = (productId, newQty) => {
    const qtyNum = Number(newQty);
    if (isNaN(qtyNum) || qtyNum <= 0) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          if (qtyNum > Number(item.product.stockQuantity) && item.product.itemType !== 'Service') {
            toast.error(`Exceeded maximum available stock (${item.product.stockQuantity})`);
            return item;
          }
          return { ...item, quantity: qtyNum };
        }
        return item;
      });
    });
  };

  const incrementQty = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = Number((item.quantity + delta).toFixed(2));
          if (newQty <= 0) return item;
          if (newQty > Number(item.product.stockQuantity) && item.product.itemType !== 'Service') {
            toast.error(`Exceeded maximum available stock (${item.product.stockQuantity})`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear the current bill?')) {
      setCart([]);
      setDiscount(0);
      setNotes('');
      toast.success('Bill cleared');
    }
  };

  const handleSaveInvoice = (printAfterSave = false) => {
    if (!customerName.trim()) {
      toast.error('Customer Name is required to generate the bill');
      return;
    }
    if (!customerMobile.trim()) {
      toast.error('Customer Phone Number is required to generate the bill');
      return;
    }
    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart before saving');
      return;
    }

    setShouldPrint(printAfterSave);

    const payload = {
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      paymentMode,
      discount: Number(discount || 0),
      notes: notes.trim(),
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity)
      }))
    };

    createMutation.mutate(payload);
  };

  // Keyboard Shortcuts via useEffect
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

      if (e.key === 'F9') {
        e.preventDefault();
        handleSaveInvoice(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSaveInvoice(false);
      } else if (e.key === 'F7') {
        e.preventDefault();
        navigate('/sales');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      } else if (e.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        } else if (!isInput && cart.length > 0) {
          handleClearCart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerName, customerMobile, paymentMode, discount, notes, isDropdownOpen]);

  // Calculations
  const subTotal = cart.reduce((acc, item) => acc + (parseFloat(item.product.sellingPrice) * item.quantity), 0);
  const totalItemsCount = cart.length;
  const totalQtyCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = Math.max(0, subTotal - Number(discount || 0));

  if (isSuccess && createdInvoice) {
    return (
      <div className="max-w-6xl mx-auto my-6 animate-fade-in px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Success Status & Action Controls */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bill Saved Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1 mb-6">
              Invoice No: <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md ml-1">{createdInvoice.invoiceNumber}</span>
            </p>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/80 mb-6 w-full text-left text-xs text-blue-900 font-medium leading-relaxed">
              <strong>🖨️ 4-Inch Thermal POS Bill Ready:</strong> The printer layout on the right is calibrated specifically for a standard 4-inch (100mm) thermal receipt roll. Its length adjusts dynamically according to the number of products listed.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mb-4">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md text-sm"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Print 4-Inch Bill</span>
              </button>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setCreatedInvoice(null);
                  setCart([]);
                  setDiscount(0);
                  setNotes('');
                  setCustomerName('');
                  setCustomerMobile('');
                  setSearch('');
                }}
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>New Bill (F8/F9)</span>
              </button>
            </div>
            <Link
              to="/sales"
              className="w-full py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100/80 transition-colors text-xs block text-center"
            >
              View Recent Bills & Sales History
            </Link>
          </div>

          {/* Right: 4-Inch Thermal POS Bill Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-blue-600" />
              <span>4-Inch Thermal Receipt (Live Printer Preview)</span>
            </div>

            <ThermalReceipt invoice={createdInvoice} items={cart} dateString={currentDate} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] pb-12 animate-fade-in space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">New Bill</h1>
            <p className="text-xs text-slate-500 font-medium">Textile Point of Sale (POS) Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/sales"
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5"
            title="Shortcut: F7"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Recent Bills</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-500 font-mono">F7</kbd>
          </Link>
          <button
            type="button"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-700 font-semibold text-xs hover:bg-rose-100/60 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* Customer & Bill Details Card (White Top Banner) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          {/* Customer Name */}
          <div className="flex flex-col pr-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-blue-600" /> Customer Name <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name *"
              className="font-bold text-slate-900 text-sm bg-transparent border-0 border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-0 py-1 transition-colors placeholder-slate-400 font-medium"
            />
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col sm:pl-4 sm:pr-2 pt-3 sm:pt-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-600" /> Phone Number <span className="text-rose-500">*</span>
            </span>
            <input
              type="text"
              required
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Enter phone number *"
              className="font-mono text-slate-900 text-sm bg-transparent border-0 border-b border-slate-300 focus:border-emerald-600 focus:ring-0 px-0 py-1 transition-colors placeholder-slate-400"
            />
          </div>

          {/* Bill Date & Time */}
          <div className="flex flex-col sm:pl-4 sm:pr-2 pt-3 sm:pt-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" /> Bill Date & Time
            </span>
            <span className="font-semibold text-slate-800 text-sm py-1 font-mono">
              {currentDate}
            </span>
          </div>

          {/* Bill No indicator */}
          <div className="flex flex-col sm:pl-4 pt-3 sm:pt-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3 text-purple-600" /> Bill No.
            </span>
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-100">
                TXB-AUTO
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Assigned on save</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Left Cart / Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Scan Bar + Product Table + Payment Methods (8 cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          
          {/* Scan Bar / Product Search */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full" ref={searchContainerRef}>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BarcodeIcon className="h-5 w-5 text-blue-600" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="block w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50/70 text-slate-900 placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
                placeholder="Scan Barcode or Search Product (Name, SKU, Fabric, Color)... [Ctrl+F]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {isSearching ? (
                    <div className="p-6 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Searching inventory...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={Number(product.stockQuantity) <= 0 && product.itemType !== 'Service'}
                        className="w-full text-left p-3 hover:bg-blue-50/50 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm flex items-center gap-2 flex-wrap">
                            <span>{product.productName}</span>
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              {product.productCode}
                            </span>
                            {product.barcode && (
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/50">
                                || | {product.barcode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>{product.category || 'Textile'}</span>
                            {product.color && <span>• Color: <strong className="text-slate-700">{product.color}</strong></span>}
                            {product.size && <span>• Size/Cut: <strong className="text-slate-700">{product.size}</strong></span>}
                            <span>• Unit: <strong className="text-slate-700">{product.unit || 'Pcs'}</strong></span>
                            <span>• Stock: <strong className={Number(product.stockQuantity) > 0 ? 'text-emerald-600' : 'text-rose-500'}>{product.stockQuantity}</strong></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-extrabold text-blue-600">₹{parseFloat(product.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <div className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-blue-700 mt-0.5">
                            + Select Item
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 flex flex-col items-center">
                      <Package className="w-7 h-7 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No products found</p>
                      <p className="text-xs text-slate-400 mt-1">Try another keyword or scan barcode</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/products/new"
              target="_blank"
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Product</span>
            </Link>
          </div>

          {/* Cart Table Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[350px]">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 pl-4 w-12 text-center">#</th>
                    <th className="p-3">Product Details</th>
                    <th className="p-3 text-center">Color</th>
                    <th className="p-3 text-center">Size</th>
                    <th className="p-3 text-center w-36">Qty & Unit</th>
                    <th className="p-3 text-right">Rate (₹)</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3 pr-4 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-300">
                            <ShoppingCart className="w-8 h-8 stroke-[1.5]" />
                          </div>
                          <p className="font-bold text-slate-600 text-base">Your cart is empty</p>
                          <p className="text-xs text-slate-400 mt-1">Scan barcode or search products above to add garments or fabric rolls to the invoice.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const itemRate = parseFloat(item.product.sellingPrice);
                      const itemAmount = itemRate * item.quantity;
                      return (
                        <tr key={item.product.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 pl-4 text-center font-mono text-xs text-slate-400 font-semibold">{idx + 1}</td>
                          <td className="p-3 max-w-[220px]">
                            <div className="font-bold text-slate-900 truncate">{item.product.productName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span>SKU: {item.product.productCode}</span>
                              {item.product.barcode && <span>| BC: {item.product.barcode}</span>}
                            </div>
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-700">
                            {item.product.color || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-700">
                            {item.product.size || <span className="text-slate-300">-</span>}
                          </td>
                          
                          {/* Qty with Unit Sublabel */}
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center">
                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50/80 p-0.5">
                                <button
                                  type="button"
                                  onClick={() => incrementQty(item.product.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors shadow-sm"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                                  className="w-12 text-center text-xs font-mono font-extrabold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 tabular-nums"
                                />
                                <button
                                  type="button"
                                  onClick={() => incrementQty(item.product.id, 1)}
                                  disabled={item.quantity >= Number(item.product.stockQuantity) && item.product.itemType !== 'Service'}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-colors shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                ({item.product.unit || 'Pcs'})
                              </span>
                            </div>
                          </td>

                          <td className="p-3 text-right font-mono text-slate-800 font-bold tabular-nums">
                            ₹{itemRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-blue-600 tabular-nums text-base">
                            ₹{itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors mx-auto"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Actions */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Clear Cart</span>
              </button>
              <span className="text-xs font-bold text-slate-500">
                Cart count: <span className="text-blue-600">{cart.length} unique items</span>
              </span>
            </div>
          </div>

          {/* Bottom Card: Customer Notes & Payment Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Notes */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer / Bill Notes</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, warranty terms, or tailor adjustment specifications..."
                className="block w-full flex-1 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/60 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none"
              />
            </div>

            {/* Payment Mode Tiles */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Mode
              </label>
              <div className="grid grid-cols-5 gap-2 flex-1 items-center">
                {PAYMENT_MODES.map((mode) => {
                  const IconComp = mode.icon;
                  const isActive = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`h-full flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1 text-center ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-sm'
                          : 'border-slate-200/80 bg-slate-50/40 text-slate-600 font-medium hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 ${isActive ? 'text-blue-600 stroke-[2.5]' : 'text-slate-500'}`} />
                      <span className="text-[11px] leading-tight">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Invoice Summary & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col space-y-6 sticky top-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Invoice Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time calculations for textile billing</p>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Total Items</span>
              <span className="font-bold text-slate-900 font-mono text-base">{totalItemsCount}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Total Qty</span>
              <span className="font-bold text-slate-900 font-mono text-base">
                {totalQtyCount.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600 font-medium pt-2 border-t border-slate-100">
              <span>Sub Total</span>
              <span className="font-bold text-slate-900 font-mono text-base">
                ₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Discount Input */}
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Discount (₹)</span>
              <div className="relative w-28">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount === 0 ? '' : discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="block w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 tabular-nums"
                />
              </div>
            </div>

            {/* Total Amount (Big Blue Display) */}
            <div className="pt-5 border-t-2 border-dashed border-slate-200 flex justify-between items-center bg-blue-50/40 p-4 rounded-2xl border border-blue-100 mt-2">
              <div>
                <span className="text-xs font-black uppercase text-blue-800 block tracking-wider">Total Amount</span>
                <span className="text-[11px] text-slate-500 font-medium">Inclusive of all taxes & rates</span>
              </div>
              <span className="text-3xl font-black text-blue-600 font-mono tracking-tight tabular-nums">
                ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => handleSaveInvoice(true)}
              disabled={cart.length === 0 || createMutation.isPending}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-base hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:pointer-events-none group"
              title="Shortcut: F9"
            >
              {createMutation.isPending && shouldPrint ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Printer className="w-5 h-5 stroke-[2.5]" />
              )}
              <span>Save & Print (F9)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveInvoice(false)}
              disabled={cart.length === 0 || createMutation.isPending}
              className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200/80 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-sm"
              title="Shortcut: F8"
            >
              {createMutation.isPending && !shouldPrint ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <Save className="w-4 h-4 text-slate-700" />
              )}
              <span>Save Bill (F8)</span>
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER: Keyboard Shortcuts Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-300 py-2 px-6 shadow-2xl z-40 border-t border-slate-800 flex items-center justify-between text-xs overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-4 sm:gap-6 font-medium">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[11px] shadow">F9</kbd>
            <span>Save & Print</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono font-bold text-[11px] shadow">F8</kbd>
            <span>Save Bill</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono font-bold text-[11px] shadow">F7</kbd>
            <span>Recent Bills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono font-bold text-[11px] shadow">Ctrl+F</kbd>
            <span>Search Product</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-mono font-bold text-[11px] shadow">Esc</kbd>
            <span>Clear Cart / Close</span>
          </div>
        </div>

        <div className="font-mono text-[11px] font-bold text-slate-400 hidden md:block">
          TexBilling POS v2.5
        </div>
      </div>
    </div>
  );
};

export default Billing;
