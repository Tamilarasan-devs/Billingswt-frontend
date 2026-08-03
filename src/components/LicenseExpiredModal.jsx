import React, { useState } from 'react';
import { Key, Lock, ShieldAlert, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { renewLicense } from '../services/licenseService';
import { useAuth } from '../store/AuthContext';
import toast from 'react-hot-toast';

const LicenseExpiredModal = ({ isOpen, reason = "LICENSE_EXPIRED" }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { logoutUser } = useAuth();

  if (!isOpen) return null;

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim() || licenseKey.length < 5) {
      setError('Please input a valid license key string.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await renewLicense(licenseKey.trim());
      toast.success('License successfully reactivated! Unlocking platform...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to renew license. Key may be invalid or already used.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-red-100 transform transition-all">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-4 shadow-inner">
            <Lock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">SaaS License Inactive</h2>
          <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-sm mx-auto font-medium">
            Your organization's active subscription period has lapsed or been restricted. Invoicing and POS capabilities are paused.
          </p>
        </div>

        {/* Content & Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">Your data is safe and preserved!</p>
              To reactivate invoicing and unlock your inventory dashboard immediately, enter your new renewal code below or contact our sales team.
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRenew} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Enter Activation / Renewal Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="w-5 h-5 text-amber-500" />
                </div>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="TB-2026-XXXX-YYYY"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Activate License & Resume Operation
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Need assistance?</span>
            <button
              onClick={logoutUser}
              className="text-red-600 hover:underline font-semibold"
            >
              Sign out of this account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseExpiredModal;
