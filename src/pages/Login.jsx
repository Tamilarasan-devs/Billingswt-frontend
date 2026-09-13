import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { login as loginService } from '../services/authService';
import { useAuth } from '../store/AuthContext';

import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = await loginService(data);
      if (response.success) {
        toast.success('Login successful!');
        loginUser(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to login';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back.</h2>
        <p className="text-slate-500 text-sm mt-2 font-medium">Log in to your Uno Tech dashboard to continue.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg mt-8"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>
              Sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
