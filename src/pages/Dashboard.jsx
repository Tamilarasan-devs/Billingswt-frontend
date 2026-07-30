import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  FileText, 
  Package, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/dashboardService';

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="glass-card p-6 relative overflow-hidden group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-').replace('-100', '-600')}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-4 text-sm">
        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
        <span className="text-emerald-500 font-medium">{trend}</span>
        <span className="text-slate-400 ml-1">vs last month</span>
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-blue-600 font-bold text-lg">
          ₹{parseFloat(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-8">
        <div>
          <div className="h-8 bg-slate-200 rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-80"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 h-32 flex flex-col justify-between">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3 mt-2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 h-[400px]">
            <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
            <div className="h-64 bg-slate-100 rounded w-full"></div>
          </div>
          <div className="glass-card p-6 h-[400px]">
            <div className="h-6 bg-slate-200 rounded w-48 mb-6"></div>
            <div className="space-y-6 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl">
        <h3 className="text-lg font-bold">Failed to load dashboard</h3>
        <p>Please check your connection and try again.</p>
      </div>
    );
  }

  const { stats, chartData, recentBills } = data?.data || {};

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Here is what's happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`₹${parseFloat(stats?.todaySales || 0).toLocaleString()}`}
          icon={TrendingUp}
          colorClass="bg-blue-100 text-blue-600"
          trend="+12.5%"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${parseFloat(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600"
          trend="+8.2%"
        />
        <StatCard 
          title="Invoices Generated" 
          value={stats?.totalBills || 0}
          icon={FileText}
          colorClass="bg-purple-100 text-purple-600"
        />
        <StatCard 
          title="Total Products" 
          value={stats?.totalProducts || 0}
          icon={Package}
          colorClass="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Analytics</h3>
              <p className="text-slate-500 text-sm">Last 7 days performance</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#14b8a6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Invoices */}
        <div className="glass-card flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
            <Link to="/sales" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {recentBills && recentBills.length > 0 ? (
              <div className="space-y-6">
                {recentBills.map(bill => (
                  <div key={bill.id} className="flex items-center gap-4 group cursor-default">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{bill.customerName}</p>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(bill.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        +${parseFloat(bill.grandTotal).toLocaleString()}
                      </p>
                      <p className="text-xs text-emerald-500 font-medium bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-1">
                        Completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-3 text-slate-200" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
