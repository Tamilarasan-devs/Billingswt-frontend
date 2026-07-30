import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, getProduct } from '../services/productService';

const productSchema = z.object({
  productName: z.string().min(2, 'Product Name is required'),
  productCode: z.string().min(2, 'Product Code is required'),
  category: z.string().optional(),
  sellingPrice: z.number({ invalid_type_error: "Must be a number" }).min(0, 'Selling Price cannot be negative'),
  stockQuantity: z.number({ invalid_type_error: "Must be a number" }).min(0, 'Stock Quantity cannot be negative'),
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
      toast.error('Failed to load product details');
      navigate('/products');
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: '',
      productCode: '',
      category: '',
      sellingPrice: 0,
      stockQuantity: 0,
    }
  });

  useEffect(() => {
    if (isEditing && productData?.data?.product) {
      const p = productData.data.product;
      reset({
        productName: p.productName,
        productCode: p.productCode,
        category: p.category || '',
        sellingPrice: Number(p.sellingPrice),
        stockQuantity: Number(p.stockQuantity),
      });
    }
  }, [isEditing, productData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => isEditing ? updateProduct(id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      navigate('/products');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const isProcessing = mutation.isPending;

  if (isEditing && isFetching) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          to="/products"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-slate-500 text-sm mt-1">{isEditing ? 'Update the details of your product.' : 'Create a new product in your inventory.'}</p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name</label>
              <input
                {...register('productName')}
                type="text"
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                placeholder="e.g. Wireless Mouse"
              />
              {errors.productName && <p className="mt-1 text-sm text-red-500">{errors.productName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Code</label>
              <input
                {...register('productCode')}
                type="text"
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                placeholder="e.g. WM-001"
              />
              {errors.productCode && <p className="mt-1 text-sm text-red-500">{errors.productCode.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <input
                {...register('category')}
                type="text"
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                placeholder="e.g. Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price (₹)</label>
              <input
                {...register('sellingPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              {errors.sellingPrice && <p className="mt-1 text-sm text-red-500">{errors.sellingPrice.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Stock Quantity</label>
              <input
                {...register('stockQuantity', { valueAsNumber: true })}
                type="number"
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              {errors.stockQuantity && <p className="mt-1 text-sm text-red-500">{errors.stockQuantity.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <Link
              to="/products"
              className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 min-w-[140px]"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
