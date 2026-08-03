import React, { useState, useEffect } from 'react';
import { getLicenses, generateLicenses, toggleLicenseStatus } from '../services/licenseService';
import { Key, Plus, Copy, Check, Shield, AlertCircle, RefreshCw, Lock, User, Calendar, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const LicenseManager = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [filter, setFilter] = useState('ALL');

  // Form states
  const [plan, setPlan] = useState('PRO');
  const [durationDays, setDurationDays] = useState('365');
  const [count, setCount] = useState(1);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await getLicenses();
      setLicenses(res.data.licenses || []);
    } catch (error) {
      toast.error('Failed to load SaaS licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await generateLicenses({ plan, durationDays: parseInt(durationDays), count });
      toast.success(`Generated ${res.data.licenses.length} new license key(s)!`);
      fetchLicenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate licenses');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleLicenseStatus(id);
      toast.success(`Status updated to ${res.data.license.status}`);
      setLicenses(licenses.map(lic => lic.id === id ? { ...lic, status: res.data.license.status } : lic));
    } catch (error) {
      toast.error('Failed to update license status');
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('License key copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'UNUSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Unused</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Expired</span>;
      case 'DISABLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Disabled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const filteredLicenses = licenses.filter(lic => {
    if (filter === 'ALL') return true;
    return lic.status === filter;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-500/20 backdrop-blur-md rounded-xl border border-blue-400/30 text-blue-300">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
            Super Admin Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          SaaS License Control Center
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mt-2">
          Generate, manage, and revoke customer activation keys. Share active license codes with clients to enable self-registration and unlock platform capabilities.
        </p>
      </div>

      {/* Generation Widget & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm col-span-1 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-blue-600" />
            Generate License Keys
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Subscription Tier</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="BASIC">Basic Plan</option>
                <option value="PRO">Pro Plan</option>
                <option value="ENTERPRISE">Enterprise Plan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Validity Duration</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="30">1 Month (30 Days)</option>
                <option value="90">3 Months (90 Days)</option>
                <option value="180">6 Months (180 Days)</option>
                <option value="365">1 Year (365 Days)</option>
                <option value="3650">Lifetime (10 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Quantity to Generate</label>
              <input
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Generate & Save Keys
            </button>
          </form>
        </div>

        {/* List & Filtering */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm col-span-1 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                Issued License Pool
              </h2>
              <p className="text-xs text-slate-500">Total of {licenses.length} keys generated in your system</p>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {['ALL', 'UNUSED', 'ACTIVE', 'EXPIRED', 'DISABLED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    filter === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading software licenses...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <AlertCircle className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-base font-semibold text-slate-700">No licenses match this filter</p>
              <p className="text-xs text-slate-500 mt-1">Try changing your tab filter or generate new keys on the left.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="pb-3 font-semibold">License Key</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold">Client Account</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLicenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-mono text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span>{lic.key}</span>
                          <button
                            onClick={() => copyToClipboard(lic.key)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                            title="Copy License Key"
                          >
                            {copiedKey === lic.key ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5">{getStatusBadge(lic.status)}</td>
                      <td className="py-3.5 font-semibold text-slate-700">{lic.plan}</td>
                      <td className="py-3.5 text-xs">
                        {lic.user ? (
                          <div>
                            <p className="font-bold text-slate-900">{lic.user.fullName}</p>
                            <p className="text-slate-500">{lic.user.email}</p>
                            {lic.expiresAt && (
                              <p className="text-[10px] text-slate-400 mt-0.5">Expires: {new Date(lic.expiresAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned (Ready to claim)</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(lic.id)}
                          className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                            lic.status === 'DISABLED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {lic.status === 'DISABLED' ? 'Enable' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseManager;
