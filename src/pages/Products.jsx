import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Package, Grid, List, ArrowUpDown, Barcode as BarcodeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, updateProduct, deleteProduct } from '../services/productService';
import ConfirmDialog from '../components/ConfirmDialog';

// Stock status thresholds, kept in one place so the gauge and badges never disagree
const stockStatus = (qty) => {
  if (qty > 10) return { level: 'healthy', label: 'In stock', bars: 3, text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-600/20', dot: 'bg-emerald-500', stripe: 'bg-emerald-500' };
  if (qty > 0) return { level: 'low', label: 'Low stock', bars: 2, text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-600/20', dot: 'bg-amber-500', stripe: 'bg-amber-500' };
  return { level: 'out', label: 'Out of stock', bars: 1, text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-600/20', dot: 'bg-rose-500', stripe: 'bg-rose-500' };
};

// Signature element: a compact three-bar gauge instead of a plain colored pill.
// Reads like a warehouse shelf-tag indicator — quick to scan across a whole table.
const StockGauge = ({ quantity }) => {
  const s = stockStatus(quantity);
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="flex items-end gap-[3px]" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-full transition-colors ${bar <= s.bars ? s.stripe : 'bg-slate-200'}`}
            style={{ height: `${bar * 4 + 4}px` }}
          />
        ))}
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-800 tabular-nums">{quantity}</p>
        <p className={`text-[10px] font-medium uppercase tracking-wide ${s.text}`}>{s.label}</p>
      </div>
    </div>
  );
};

const SkuTag = ({ code }) => (
  <span className="inline-flex items-center font-mono text-[11px] font-semibold tracking-tight text-slate-600 bg-slate-50 border border-dashed border-slate-300 rounded px-2 py-1">
    {code}
  </span>
);

const Products = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 10;

  // View mode state
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries
  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, limit, debouncedSearch],
    queryFn: () => getProducts(page, limit, debouncedSearch),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted');
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast.error('Could not delete this product');
      setIsDeleteOpen(false);
    }
  });

  // Handlers
  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const products = data?.data?.products || [];
  const totalPages = data?.data?.totalPages || 1;
  const totalCount = data?.data?.total ?? products.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[11px] font-mono font-semibold tracking-[0.18em] text-emerald-700 uppercase mb-1">Inventory</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product management</h1>
          <p className="text-slate-500 text-sm mt-1">Track catalog, pricing, and stock levels across your inventory.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/barcodes"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm hover:shadow"
          >
            <BarcodeIcon className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            Print Barcode Stickers
          </Link>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-300"
          >
            <Plus className="w-4 h-4" />
            Add product
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
            placeholder="Search by name or SKU..."
          />
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && !isError && (
            <span className="hidden sm:inline text-xs font-medium text-slate-400 tabular-nums">
              {totalCount} {totalCount === 1 ? 'product' : 'products'}
            </span>
          )}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'table' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`p-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-slate-100 rounded-lg w-full"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4 items-center p-2 border-b border-slate-50">
                    <div className="h-5 bg-slate-100 rounded w-24"></div>
                    <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-5 bg-slate-100 rounded w-20"></div>
                    <div className="h-5 bg-slate-100 rounded w-16"></div>
                    <div className="h-5 bg-slate-100 rounded w-24 ml-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-4">
              <Package className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Couldn't load products</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">Check your connection and try refreshing the page.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {search ? `No products match "${search}"` : 'No products yet'}
            </h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
              {search ? 'Try a different name or SKU.' : 'Add your first product to start tracking inventory.'}
            </p>
            {!search && (
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add product
              </Link>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Desktop Table View */}
            <div className={`${viewMode === 'table' ? 'hidden md:block' : 'hidden'} overflow-x-auto`}>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider">
                      <span className="inline-flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3 text-slate-300" /></span>
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-6 py-4"><SkuTag code={product.productCode} /></td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{product.productName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                        ₹{parseFloat(product.sellingPrice).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StockGauge quantity={product.stockQuantity} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/products/edit/${product.id}`}
                            aria-label={`Edit ${product.productName}`}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            aria-label={`Delete ${product.productName}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grid / Mobile View */}
            <div className={`${viewMode === 'grid' ? 'block' : 'block md:hidden'} p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 bg-slate-50/30`}>
              {products.map((product) => {
                const s = stockStatus(product.stockQuantity);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col relative overflow-hidden"
                  >
                    {/* Barcode-style top edge instead of a flat color strip */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 flex gap-[2px] px-3 pt-0.5" aria-hidden="true">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <span
                          key={i}
                          className={`flex-1 rounded-b-sm ${i % 3 === 0 ? s.stripe : 'bg-slate-100'}`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.bg} ${s.text}`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/products/edit/${product.id}`}
                          aria-label={`Edit ${product.productName}`}
                          className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors bg-slate-50 md:bg-transparent"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenDelete(product)}
                          aria-label={`Delete ${product.productName}`}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-slate-50 md:bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <SkuTag code={product.productCode} />
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                          {(product.category || 'MISC').toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 line-clamp-2">{product.productName}</h3>
                    </div>

                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-5">
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Selling price</p>
                        <p className="text-xl font-black text-slate-900 tabular-nums">
                          ₹{parseFloat(product.sellingPrice).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">Inventory</p>
                        <StockGauge quantity={product.stockQuantity} />
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Modals */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete product"
        message={`Delete ${selectedProduct?.productName}? This action can't be undone.`}
        isProcessing={deleteMutation.isPending}
      />
    </div>
  );
};

export default Products;