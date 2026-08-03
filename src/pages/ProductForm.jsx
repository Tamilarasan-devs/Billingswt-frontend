import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft, Scissors, Tag, Layers, Barcode as BarcodeIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getProduct } from '../services/productService';

const generateEanBarcode = () => {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString().substring(0, 10);
  return `890${randomDigits}`;
};

const TEXTILE_UNITS = [
  { value: 'Pcs', label: 'Pcs (Pieces / Garments)' },
  { value: 'Meters', label: 'Meters (Fabrics / Rolls)' },
  { value: 'Yards', label: 'Yards (Suiting / Shirting)' },
  { value: 'Sets', label: 'Sets (Combo / Suit Sets)' },
  { value: 'Pairs', label: 'Pairs' },
  { value: 'Rolls', label: 'Rolls (Whole Fabric Roll)' },
];

const TEXTILE_CATEGORIES = [
  "Sarees & Ethnic Wear",
  "Men's Readymade",
  "Women's Readymade",
  "Kids & Infants Wear",
  "Unstitched Fabrics & Suiting",
  "Silk & Designer Wear",
  "Home Furnishings & Towels",
  "Innerwear & Accessories"
];

const COMMON_FABRICS = [
  "Pure Silk",
  "100% Cotton",
  "Linen",
  "Chiffon & Georgette",
  "Rayon",
  "Polyester Blend",
  "Denim",
  "Velvet",
  "Khadi / Handloom"
];

const COMMON_SIZES = [
  "Free Size",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2.5 Meters",
  "Unstitched"
];

const productSchema = z.object({
  productName: z.string().min(2, 'Product Name is required'),
  productCode: z.string().min(1, 'Product Code / SKU is required'),
  barcode: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  fabricType: z.string().optional(),
  unit: z.string().default('Pcs'),
  purchasePrice: z.number({ invalid_type_error: "Must be a valid number" }).min(0, 'Purchase price cannot be negative').default(0),
  sellingPrice: z.number({ invalid_type_error: "Must be a valid number" }).min(0, 'Selling price cannot be negative'),
  stockQuantity: z.number({ invalid_type_error: "Must be a valid number" }).min(0, 'Stock quantity cannot be negative'),
  description: z.string().optional(),
});

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productData, isLoading: isFetching } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: isEditing,
    onError: () => {
      toast.error('Failed to load textile details');
      navigate('/products');
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      productCode: '',
      barcode: generateEanBarcode(),
      category: 'Sarees & Ethnic Wear',
      subCategory: '',
      color: '',
      size: '',
      fabricType: '',
      unit: 'Pcs',
      purchasePrice: 0,
      sellingPrice: 0,
      stockQuantity: 10,
      description: ''
    }
  });

  useEffect(() => {
    if (isEditing && productData?.data?.product) {
      const p = productData.data.product;
      reset({
        productName: p.productName || '',
        productCode: p.productCode || '',
        barcode: p.barcode || '',
        category: p.category || 'Sarees & Ethnic Wear',
        subCategory: p.subCategory || '',
        color: p.color || '',
        size: p.size || '',
        fabricType: p.fabricType || '',
        unit: p.unit || 'Pcs',
        purchasePrice: Number(p.purchasePrice || 0),
        sellingPrice: Number(p.sellingPrice || 0),
        stockQuantity: Number(p.stockQuantity || 0),
        description: p.description || '',
      });
    }
  }, [isEditing, productData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? updateProduct(id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success(isEditing ? 'Textile item updated successfully' : 'Textile item added to catalog');
      navigate('/products');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} item`);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const isProcessing = mutation.isPending;

  if (isEditing && isFetching) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          to="/products"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit textile catalog item' : 'New textile catalog item'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Enter fabric attributes, barcodes, and pricing for your inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Identification */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <BarcodeIcon className="w-4 h-4 text-emerald-700" />
            <span>Product identification & barcodes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('productName')}
                type="text"
                placeholder="e.g. Kanjivaram Pure Silk Wedding Saree"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors font-medium"
              />
              {errors.productName && <p className="mt-1 text-xs text-rose-500">{errors.productName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Code / SKU <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('productCode')}
                type="text"
                placeholder="e.g. PRD-8821"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
              {errors.productCode && <p className="mt-1 text-xs text-rose-500">{errors.productCode.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Barcode (Auto-Generated EAN-13)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newCode = generateEanBarcode();
                    setValue('barcode', newCode);
                    toast.success('Generated new barcode: ' + newCode);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  {...register('barcode')}
                  type="text"
                  readOnly
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-100/80 text-slate-900 font-mono text-base font-extrabold tracking-wider focus:outline-none transition-colors shadow-inner"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold tracking-normal font-sans">
                    AUTO GS1-13
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Textile & Garment Attributes */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Scissors className="w-4 h-4 text-emerald-700" />
            <span>Textile & garment attributes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <input
                {...register('category')}
                type="text"
                list="textile-cats"
                placeholder="Select or type..."
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
              <datalist id="textile-cats">
                {TEXTILE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sub Category
              </label>
              <input
                {...register('subCategory')}
                type="text"
                placeholder="e.g. Wedding wear / Formal"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fabric Type
              </label>
              <input
                {...register('fabricType')}
                type="text"
                list="textile-fabrics"
                placeholder="e.g. Pure Silk / Cotton"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
              <datalist id="textile-fabrics">
                {COMMON_FABRICS.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Color
              </label>
              <input
                {...register('color')}
                type="text"
                placeholder="e.g. Royal Blue / Maroon"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Size / Cut
              </label>
              <input
                {...register('size')}
                type="text"
                list="textile-sizes"
                placeholder="e.g. XL / Free Size / 2.5 Mtr"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              />
              <datalist id="textile-sizes">
                {COMMON_SIZES.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit of Measure (UOM)
              </label>
              <select
                {...register('unit')}
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors"
              >
                {TEXTILE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
            <Tag className="w-4 h-4 text-emerald-700" />
            <span>Pricing & inventory stock</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Purchase Price (₹)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  ₹
                </div>
                <input
                  {...register('purchasePrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="block w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors tabular-nums"
                />
              </div>
              {errors.purchasePrice && <p className="mt-1 text-xs text-rose-500">{errors.purchasePrice.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600 font-bold text-sm">
                  ₹
                </div>
                <input
                  {...register('sellingPrice', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="block w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors tabular-nums"
                />
              </div>
              {errors.sellingPrice && <p className="mt-1 text-xs text-rose-500">{errors.sellingPrice.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Stock Qty <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('stockQuantity', { valueAsNumber: true })}
                type="number"
                min="0"
                className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-colors tabular-nums"
              />
              {errors.stockQuantity && <p className="mt-1 text-xs text-rose-500">{errors.stockQuantity.message}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/products"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 min-w-[140px]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? 'Save changes' : 'Add textile item'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
