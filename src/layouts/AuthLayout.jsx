import { Outlet } from 'react-router-dom';
import { Package } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900">
      {/* Left Panel - Branding & Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-slate-900 p-12">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900"></div>
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob animation-delay-2000"></div>
        
        {/* Content Overlay */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl">
              <Package className="w-7 h-7 text-blue-400" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">Uno Tech</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Streamline your enterprise billing & management.
          </h2>
          <p className="text-lg text-blue-100/80 font-medium">
            Experience the next generation of seamless invoicing, precise reporting, and secure POS integration.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-400 font-medium">
          <span>&copy; {new Date().getFullYear()} Uno Tech</span>
          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>Enterprise SaaS</span>
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-slate-50 lg:bg-white overflow-hidden">
        
        {/* Mobile Background Decorations */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 lg:hidden animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 lg:hidden animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 lg:hidden animate-blob animation-delay-4000"></div>

        {/* Mobile Logo (Visible only on smaller screens) */}
        <div className="lg:hidden flex flex-col items-center gap-3 mb-8 relative z-10 animate-fade-in">
          <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Uno Tech</span>
        </div>

        <div className="w-full max-w-[420px] relative z-10 animate-fade-in lg:p-0 p-8 lg:bg-transparent lg:shadow-none bg-white/70 backdrop-blur-xl shadow-2xl shadow-blue-900/5 border border-white rounded-3xl" style={{ animationDelay: '100ms' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
