import React, { useState, useEffect } from 'react';
import { getAdminUsers } from '../services/licenseService';
import { Users, Search, Shield, Store, Calendar, ExternalLink, Mail, Phone, RefreshCw, Award, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error('Failed to load registered users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const nameMatch = u.fullName?.toLowerCase().includes(query);
    const emailMatch = u.email?.toLowerCase().includes(query);
    const shopMatch = u.businessProfile?.businessName?.toLowerCase().includes(query);
    return nameMatch || emailMatch || shopMatch;
  });

  // Calculate quick metrics
  const totalClients = users.filter(u => u.role === 'USER').length;
  const activeSubscriptions = users.filter(u => u.license?.status === 'ACTIVE').length;
  const enterpriseCount = users.filter(u => u.license?.plan === 'ENTERPRISE' || u.license?.plan === 'PRO').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-teal-500/20 backdrop-blur-md rounded-xl border border-teal-400/30 text-teal-300">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full border border-teal-400/30">
            Client Directory
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Registered Platform Accounts
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl mt-2">
          Oversee all registered business accounts, inspect shop branding profiles, and verify active SaaS subscription tiers and expiration timelines.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Subscribers</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalClients}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Licenses</p>
            <p className="text-2xl font-extrabold text-slate-900">{activeSubscriptions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pro / Enterprise Accounts</p>
            <p className="text-2xl font-extrabold text-slate-900">{enterpriseCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients by name, email, or shop title..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading subscriber profiles...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-base font-semibold text-slate-700">No client accounts found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search filter above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="pb-3.5 font-semibold">Client Details</th>
                  <th className="pb-3.5 font-semibold">Business / Store</th>
                  <th className="pb-3.5 font-semibold">Subscription Plan</th>
                  <th className="pb-3.5 font-semibold">License Status</th>
                  <th className="pb-3.5 font-semibold">Joined Date</th>
                  <th className="pb-3.5 font-semibold text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Client Details */}
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          user.role === 'SUPER_ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{user.fullName}</span>
                            {user.role === 'SUPER_ADMIN' && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.email}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.mobileNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Business / Store */}
                    <td className="py-4">
                      {user.businessProfile ? (
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            {user.businessProfile.businessName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {user.businessProfile.city ? `${user.businessProfile.city}, ${user.businessProfile.state}` : 'Location unlisted'}
                          </p>
                          {user.businessProfile.gstin && (
                            <p className="text-[11px] font-mono text-slate-400">Tax ID: {user.businessProfile.gstin}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No store configured</span>
                      )}
                    </td>

                    {/* Subscription Plan */}
                    <td className="py-4">
                      {user.license ? (
                        <div>
                          <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                            {user.license.plan} Plan
                          </span>
                          <p className="text-[11px] font-mono font-semibold text-slate-500 mt-1">{user.license.key}</p>
                        </div>
                      ) : user.role === 'SUPER_ADMIN' ? (
                        <span className="text-xs font-semibold text-slate-400">Exempt (Master Owner)</span>
                      ) : (
                        <span className="text-xs text-red-500 font-semibold">Unlicensed</span>
                      )}
                    </td>

                    {/* License Status */}
                    <td className="py-4">
                      {user.license ? (
                        <div>
                          {user.license.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                            </span>
                          )}
                          {user.license.status === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Expired
                            </span>
                          )}
                          {user.license.status === 'DISABLED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> Revoked
                            </span>
                          )}
                          {user.license.expiresAt && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Exp: {new Date(user.license.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 text-xs text-slate-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Admin Controls */}
                    <td className="py-4 text-right">
                      <Link
                        to="/admin/licenses"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg inline-flex items-center gap-1 transition-colors"
                        title="Go to License Manager"
                      >
                        Manage License <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
