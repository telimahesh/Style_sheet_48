import { motion } from 'motion/react';
import { TrendingUp, Users, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Clock, MapPin, Layout } from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

const STATS = [
  { label: 'Total Revenue', value: 12450.80, trend: '+12.5%', isUp: true, icon: <TrendingUp className="w-5 h-5 text-whatsapp" /> },
  { label: 'Total Orders', value: 342, trend: '+5.2%', isUp: true, icon: <ShoppingCart className="w-5 h-5 text-whatsapp" /> },
  { label: 'Active Users', value: 1204, trend: '-2.1%', isUp: false, icon: <Users className="w-5 h-5 text-slate-400" /> },
  { label: 'Global Stock', value: 8420, trend: 'Normal', isUp: true, icon: <Package className="w-5 h-5 text-slate-400" /> },
];

const RECENT_ORDERS = [
  { id: 'LS-9921', user: 'Zayan Khan', total: 129.99, type: 'Online', status: 'Pending', time: '2m ago' },
  { id: 'LS-9920', user: 'Walk-in Customer', total: 45.00, type: 'POS', status: 'Completed', time: '15m ago' },
  { id: 'LS-9919', user: 'Sara Ahmed', total: 299.99, type: 'Online', status: 'Packing', time: '1h ago' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">System <span className="text-whatsapp">Analytics</span></h1>
          <p className="text-slate-400 text-sm font-medium">Real-time performance across all functional branches</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/pages" className="bg-slate-800/80 border border-slate-700 px-6 py-3 rounded-xl text-slate-100 font-black uppercase text-xs hover:bg-slate-700 transition-all flex items-center gap-2 shadow-xl">
            <Layout className="w-4 h-4 text-whatsapp" /> Manage Content
          </Link>
          <Link to="/admin/pos" className="bg-whatsapp text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-xs shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Open POS
          </Link>
          <button className="bg-slate-800/80 border border-slate-700 px-4 py-3 rounded-xl text-slate-100 font-bold text-xs hover:bg-slate-700 transition-colors uppercase tracking-widest">
            Export .CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-[2rem] hover:border-whatsapp/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {stat.icon}
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className="bg-slate-900/60 p-3 rounded-2xl group-hover:bg-whatsapp/10 transition-colors border border-white/5">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${
                stat.isUp ? 'bg-whatsapp/10 text-whatsapp' : 'bg-red-500/10 text-red-400'
              }`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <div className={cn(
                "text-2xl font-black tracking-tight",
                stat.label.includes('Revenue') ? "text-whatsapp" : "text-slate-100"
              )}>
                {typeof stat.value === 'number' && stat.label.includes('Revenue') ? formatCurrency(stat.value) : stat.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-whatsapp" /> Live Order Stream
            </h2>
            <button className="text-[10px] text-whatsapp font-bold uppercase tracking-widest">Refresh Feed</button>
          </div>
          <div className="glass rounded-[2rem] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-400">Order ID</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Customer</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Type</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Amount</th>
                  <th className="px-6 py-4 font-bold text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {RECENT_ORDERS.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono text-whatsapp font-bold">{order.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">{order.user}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                        order.type === 'POS' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-100">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'Completed' ? 'bg-whatsapp' : 'bg-yellow-500 animate-pulse'
                        }`} />
                        <span className="text-xs font-medium text-slate-400">{order.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Operations */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-whatsapp" /> Branch Health
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((branch) => (
              <div key={branch} className="glass p-4 rounded-2xl flex items-center justify-between border-transparent hover:border-slate-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-400">
                    B{branch}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold">Branch {branch === 1 ? 'Main' : branch === 2 ? 'North' : 'DHA'}</h4>
                    <span className="text-[10px] text-whatsapp font-bold uppercase">Online & Operational</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-100">{formatCurrency(2450)}</div>
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Today</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 py-3 rounded-xl text-xs font-bold transition-colors">
            Manage All Outlets
          </button>
        </div>
      </div>
    </div>
  );
}
