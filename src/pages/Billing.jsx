import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Package, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../services/productService';
import { createInvoice } from '../services/billingService';

const billingSchema = z.object({
  customerName: z.string().min(2, 'Customer Name is required'),
  customerMobile: z.string().optional(),
});

const Billing = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Query Products for Search
  const { data: productsData, isLoading: isSearching } = useQuery({
    queryKey: ['productsSearch', debouncedSearch],
    queryFn: () => getProducts(1, 20, debouncedSearch),
    enabled: debouncedSearch.length > 0,
  });

  const searchResults = productsData?.data?.products || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      customerName: '',
      customerMobile: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['productsSearch']);
      queryClient.invalidateQueries(['dashboardStats']);
      toast.success('Invoice generated successfully');
      setCreatedInvoice(res.data.invoice);
      setIsSuccess(true);
      setCart([]);
      reset();
      setSearch('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  });

  const handleAddToCart = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stockQuantity) {
          toast.error('Cannot add more than available stock');
          return prevCart;
        }
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setSearch('');
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > item.product.stockQuantity) {
            toast.error('Cannot exceed available stock');
            return item;
          }
          if (newQuantity < 1) return item; // handle remove separately
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const onSubmit = (data) => {
    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    const payload = {
      ...data,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    createMutation.mutate(payload);
  };

  const subTotal = cart.reduce((acc, item) => acc + (parseFloat(item.product.sellingPrice) * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (isSuccess && createdInvoice) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
        <div className="glass-card p-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Invoice Generated!</h2>
          <p className="text-slate-500 mb-8 text-lg">
            Invoice <span className="font-semibold text-slate-800">{createdInvoice.invoiceNumber}</span> has been created successfully.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-6 w-full text-left space-y-3 mb-8 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium text-slate-900">{createdInvoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Items:</span>
              <span className="font-medium text-slate-900">{createdInvoice.totalQuantity}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200">
              <span className="text-slate-500 font-medium">Grand Total:</span>
              <span className="font-bold text-blue-600 text-xl">₹{parseFloat(createdInvoice.grandTotal).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsSuccess(false)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Create Another Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 pb-6">
      {/* Left Panel: Search & Products */}
      <div className="lg:w-7/12 flex flex-col gap-6 h-[calc(100vh-8rem)]">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Bill</h1>
          <p className="text-slate-500 text-sm mt-1">Search and add products to the invoice.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow premium-shadow text-lg"
            placeholder="Search by product name or code..."
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto glass-card rounded-2xl p-2">
          {debouncedSearch ? (
            searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stockQuantity <= 0}
                    className="flex flex-col text-left p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{product.productName}</span>
                      <span className="font-bold text-slate-700">₹{parseFloat(product.sellingPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end w-full mt-2 text-sm">
                      <span className="text-slate-500">{product.productCode}</span>
                      <span className={`font-medium ${product.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {product.stockQuantity} in stock
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                <Package className="w-12 h-12 mb-4 text-slate-300" />
                <p>No products found matching "{debouncedSearch}"</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <Search className="w-12 h-12 mb-4 text-slate-200" />
              <p>Type above to search for products</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart & Checkout */}
      <div className="lg:w-5/12 flex flex-col glass-card rounded-2xl overflow-hidden h-[calc(100vh-8rem)]">
        <div className="p-5 border-b border-slate-100 bg-white z-10 flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Current Order</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
            {totalItems} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-4 text-slate-200" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4 items-center premium-shadow-sm">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 truncate">{item.product.productName}</h4>
                    <p className="text-sm text-slate-500">₹{parseFloat(item.product.sellingPrice).toLocaleString()} each</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-medium text-slate-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stockQuantity}
                      className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right w-20 shrink-0 font-bold text-slate-900">
                    ₹{(parseFloat(item.product.sellingPrice) * item.quantity).toLocaleString()}
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border-t border-slate-100 p-5 mt-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  {...register('customerName')}
                  type="text"
                  placeholder="Customer Name *"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName.message}</p>}
              </div>
              <div>
                <input
                  {...register('customerMobile')}
                  type="text"
                  placeholder="Mobile Number (Optional)"
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-500 font-medium">Grand Total</span>
                <span className="text-3xl font-black text-blue-600">₹{subTotal.toLocaleString()}</span>
              </div>
              
              <button
                type="submit"
                disabled={cart.length === 0 || createMutation.isPending}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20"
              >
                {createMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Billing;
