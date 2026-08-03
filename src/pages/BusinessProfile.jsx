import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, Store, MapPin, Phone, Mail, Globe, ShieldCheck, 
  FileText, Printer, Save, Loader2, Sparkles, CheckCircle2, DollarSign,
  Receipt, Barcode as BarcodeIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import { getBusinessProfile, updateBusinessProfile } from '../services/businessService';

const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  tagline: z.string().optional(),
  address: z.string().min(5, 'Address is required for valid invoicing'),
  phone: z.string().min(5, 'Contact number is required'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  gstin: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().default('₹'),
  termsAndConditions: z.string().optional(),
  footerMessage: z.string().optional(),
});

const PreviewBarcode = ({ value }) => {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value.toString().trim(), {
          format: "CODE128",
          lineColor: "#0f172a",
          width: 1.6,
          height: 34,
          displayValue: false,
          margin: 0,
          background: "transparent"
        });
      } catch (err) {
        console.error("Preview barcode error:", err);
      }
    }
  }, [value]);
  return <svg ref={svgRef} className="mx-auto block max-w-full" />;
};

const BusinessProfile = () => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      tagline: '',
      address: '',
      phone: '',
      email: '',
      gstin: '',
      website: '',
      currency: '₹',
      termsAndConditions: '',
      footerMessage: '',
    }
  });

  // Query profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ['business-profile'],
    queryFn: getBusinessProfile,
  });

  useEffect(() => {
    if (data?.data) {
      reset(data.data);
    }
  }, [data, reset]);

  // Mutation
  const mutation = useMutation({
    mutationFn: updateBusinessProfile,
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      if (responseData?.data) {
        reset(responseData.data);
      }
      toast.success('Business identity & POS billing configuration saved successfully!');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to save business profile settings');
    }
  });

  const onSubmit = (formData) => {
    mutation.mutate(formData);
  };

  // Live watch fields for reactive print preview
  const watchedValues = watch();

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Profile & POS Identity</h1>
              <span className="bg-blue-50 text-blue-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200/60 uppercase">
                Active Tenant
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Customize your enterprise branding, tax IDs, and legal disclaimers displayed on all receipts and labels.
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Save Business Settings</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Forms (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 1: Enterprise Identity & Branding */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3.5">
                <Store className="w-5 h-5 text-blue-600" />
                <span>Store Identity & Legal Entity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Business / Store Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('businessName')}
                    type="text"
                    placeholder="Enter your Business / Store Name"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  {errors.businessName && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.businessName.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Store Subtitle / Tagline
                  </label>
                  <input
                    {...register('tagline')}
                    type="text"
                    placeholder="e.g. Exclusive Wedding Silks & Designer Wear"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>GSTIN / Tax Registration No.</span>
                  </label>
                  <input
                    {...register('gstin')}
                    type="text"
                    placeholder="e.g. 33AABCU9603R1ZM"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-extrabold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    <span>Currency Symbol</span>
                  </label>
                  <input
                    {...register('currency')}
                    type="text"
                    placeholder="₹"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Contact Information & Location */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3.5">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Showroom Headquarters & Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Official Business Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    placeholder="e.g. 123 Main Bazaar Road, Fashion District, Tamil Nadu"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  {errors.address && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.address.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Support Line / Mobile <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    {...register('phone')}
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Official Email</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="e.g. support@techbruce.com"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    <span>Website / Instagram Handle</span>
                  </label>
                  <input
                    {...register('website')}
                    type="text"
                    placeholder="e.g. www.techbruce.com or @techbrucetextiles"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Billing Receipt Disclaimers & Notes */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base border-b border-slate-100 pb-3.5">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>POS Receipt Footers & Store Policy</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Thank You / Farewell Banner (Footer)
                  </label>
                  <input
                    {...register('footerMessage')}
                    type="text"
                    placeholder="e.g. *** THANK YOU! VISIT AGAIN ***"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Return Policy / Terms & Conditions
                  </label>
                  <textarea
                    {...register('termsAndConditions')}
                    rows={3}
                    placeholder="e.g. Goods once sold cannot be exchanged without original receipt & garment tags."
                    className="block w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-base transition-all shadow-lg hover:shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>Save All Business Configuration</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive POS Previews (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-6">
            {/* Live Thermal Receipt Preview */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                  <Printer className="w-4 h-4 animate-pulse" />
                  <span>Live POS thermal receipt Preview</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">4-INCH BILL</span>
              </div>

              <div className="bg-white text-slate-950 p-5 rounded-sm border border-slate-300 font-mono text-xs leading-relaxed shadow-lg max-w-[360px] mx-auto">
                {/* Header preview */}
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-800">
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-950 leading-tight">
                    {watchedValues.businessName || 'Your Store Name'}
                  </h3>
                  {watchedValues.tagline && (
                    <p className="text-[11px] font-semibold text-slate-800 mt-0.5">{watchedValues.tagline}</p>
                  )}
                  {watchedValues.address && (
                    <p className="text-[10px] text-slate-700 font-medium mt-1 leading-normal px-2">
                      {watchedValues.address}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 text-[10px] font-bold text-slate-800">
                    {watchedValues.phone && <span>Ph: {watchedValues.phone}</span>}
                    {watchedValues.gstin && <span>GSTIN: {watchedValues.gstin}</span>}
                  </div>
                  <p className="text-xs font-black mt-2 bg-slate-100 py-0.5 rounded px-2 inline-block">INV: INV-8921-DEMO</p>
                </div>

                {/* Sample items line */}
                <div className="py-2.5 border-b-2 border-dashed border-slate-800 text-[11px]">
                  <div className="flex justify-between font-bold text-slate-500 mb-1 text-[10px]">
                    <span>ITEM (DEMO PREVIEW)</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>1. Kanjivaram Silk Saree (1 Pcs)</span>
                    <span className="font-mono">{watchedValues.currency || '₹'}14,500.00</span>
                  </div>
                </div>

                {/* Totals sample */}
                <div className="py-2 border-b-2 border-dashed border-slate-800 flex justify-between items-center font-black text-sm text-slate-950">
                  <span className="uppercase">NET TOTAL:</span>
                  <span className="font-mono text-base font-black">{watchedValues.currency || '₹'}14,500.00</span>
                </div>

                {/* Footer Disclaimers Preview */}
                <div className="pt-3 text-center space-y-1.5 text-slate-800">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-950">
                    {watchedValues.footerMessage || '*** THANK YOU! VISIT AGAIN ***'}
                  </p>
                  <p className="text-[10px] text-slate-600 leading-tight italic">
                    {watchedValues.termsAndConditions || 'Goods once sold cannot be exchanged without receipt.'}
                  </p>
                  <div className="pt-2">
                    <PreviewBarcode value="INV8921DEMO" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Barcode Sticker Studio Preview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BarcodeIcon className="w-4 h-4 text-emerald-600" />
                <span>Garment Barcode Sticker Preview</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center max-w-[240px] mx-auto shadow-inner text-center font-mono text-slate-950">
                <div className="text-[11px] font-black uppercase tracking-wider text-center text-slate-950 truncate max-w-full px-1">
                  {watchedValues.businessName || 'YOUR STORE NAME'}
                </div>
                <div className="text-[10px] font-bold text-center my-0.5 text-slate-800 font-sans">
                  Silk Wedding Saree (XL)
                </div>
                <div className="w-full my-1 flex justify-center bg-white p-2 rounded border border-slate-100 shadow-xs">
                  <PreviewBarcode value="890123456789" />
                </div>
                <div className="flex justify-between items-center w-full text-[10px] font-black px-1 pt-1 border-t border-slate-200 mt-1">
                  <span className="text-[10px]">SKU: PRD-101</span>
                  <span className="font-extrabold text-[11px] text-emerald-800">MRP: {watchedValues.currency || '₹'}1,250.00</span>
                </div>
              </div>
            </div>
          </div>
        </form>
    </div>
  );
};

export default BusinessProfile;
