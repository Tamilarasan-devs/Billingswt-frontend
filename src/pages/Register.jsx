import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2, Key } from 'lucide-react';
import { register as registerService } from '../services/authService';

import toast from 'react-hot-toast';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Please enter a valid email address'),
  mobileNumber: z.string().min(10, 'Mobile Number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  licenseKey: z.string().min(5, 'SaaS License Key is required to register')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Register = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = await registerService(data);
      if (response.success) {
        toast.success('Account created successfully!');
        navigate('/login');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to register';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create an account.</h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">Start managing your billing efficiently with Uno Tech.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('fullName')}
              type="text"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                errors.fullName 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-slate-300 shadow-sm'
              }`}
              placeholder="John Doe"
            />
          </div>
          {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                errors.email 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-slate-300 shadow-sm'
              }`}
              placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mobile Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('mobileNumber')}
              type="text"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                errors.mobileNumber 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-slate-300 shadow-sm'
              }`}
              placeholder="+1 234 567 8900"
            />
          </div>
          {errors.mobileNumber && <p className="mt-1 text-sm text-red-500">{errors.mobileNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('password')}
              type="password"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                errors.password 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-slate-300 shadow-sm'
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              {...register('confirmPassword')}
              type="password"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl text-sm font-medium transition-all duration-200 ${
                errors.confirmPassword 
                  ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-slate-300 shadow-sm'
              }`}
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-sm font-semibold text-slate-800 mb-1">SaaS License Key <span className="text-red-500">*</span></label>
          <p className="text-xs text-slate-500 mb-2">Required for activation. Contact sales or support if you do not have an invitation key.</p>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-blue-500" />
            </div>
            <input
              {...register('licenseKey')}
              type="text"
              className={`block w-full pl-11 pr-4 py-3 border rounded-xl font-mono text-sm uppercase transition-all duration-200 ${
                errors.licenseKey 
                  ? 'border-red-300 bg-red-50/50 text-red-900 placeholder-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'bg-blue-50/30 border-blue-200 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 hover:border-blue-300 shadow-sm'
              }`}
              placeholder="TB-2026-XXXX-XXXX"
            />
          </div>
          {errors.licenseKey && <p className="mt-1 text-sm text-red-500">{errors.licenseKey.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg mt-8"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
