import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, LogOut, Bot,
  ChevronRight, Package, Clock, Mail, ExternalLink,
  CheckCircle2, AlertCircle,
  Truck, ArrowRight, Zap, Globe, Cpu, CreditCard, Activity,
  Settings, MapPin, Phone, Lock, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { formatCurrency, cn } from '../lib/utils';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
  items: OrderItem[];
}

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'settings'>('info');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const q = query(
          collection(db, 'orders'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        
        const unsubscribeOrders = onSnapshot(q, (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order));
          setOrders(ordersData);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'orders (profile)');
          setLoading(false);
        });

        return () => unsubscribeOrders();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-14 h-14 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Curating your experience...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-10 px-6">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-amber-500/5 animate-pulse rounded-[2rem]" />
          <Lock className="w-10 h-10 text-amber-500 relative z-10" />
        </motion.div>
        
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Private <span className="text-amber-500">Access</span></h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed">Please sign in to your executive account to manage your collection and history.</p>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-3 bg-amber-500 text-slate-950 py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all w-full">
          Sign In Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32 px-4 sm:px-0 relative">
      {/* Premium Background Ambiance */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Premium Header Profile */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-3 bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3.5rem] flex flex-col sm:flex-row items-center gap-10 relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.4)]"
        >
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
          
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
            <Globe className="w-64 h-64 text-amber-500 animate-spin-slow" />
          </div>
          
          <div className="relative z-10">
            <div className="w-40 h-40 rounded-[3.5rem] bg-slate-950 flex items-center justify-center border-2 border-amber-500/20 overflow-hidden relative group-hover:border-amber-500/40 transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-20 h-20 text-slate-800 group-hover:text-amber-500/50 group-hover:scale-110 transition-all duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 p-3.5 rounded-2xl border-4 border-slate-950 shadow-2xl z-20"
            >
              <Zap className="w-4 h-4 text-slate-950" />
            </motion.div>
          </div>

          <div className="space-y-6 text-center sm:text-left relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] px-3 py-1 bg-amber-500/5 rounded-full border border-amber-500/10 mb-2 inline-block">Executive Tier</span>
              <h1 className="text-5xl font-black tracking-tighter leading-tight text-white drop-shadow-2xl italic uppercase">{currentUser.displayName || 'AGENT'}</h1>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <span className="bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-xl border border-white/5 backdrop-blur-md">Collection Specialist</span>
              <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-xl border border-amber-500/10 backdrop-blur-md">Verified Authenticity</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1 bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3.5rem] flex flex-col justify-between group shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="space-y-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 block">Longevity</span>
            <div className="text-5xl font-black tracking-tighter text-white italic">214 <span className="text-amber-500 text-2xl uppercase not-italic tracking-normal">Days</span></div>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="w-full h-2 bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: '92%' }} 
                transition={{ duration: 1.5, ease: 'circOut' }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500" 
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 block">Resource Allocation: 92%</span>
          </div>
        </motion.div>
      </div>

      {/* Primary Experience Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Navigation Sidebar */}
        <div className="space-y-8">
          <div className="flex flex-col gap-2 p-3 bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] shadow-2xl">
            <TabButton 
              active={activeTab === 'info'} 
              onClick={() => setActiveTab('info')}
              icon={<Shield className="w-4 h-4" />}
              label="Identity Protocol"
            />
            <TabButton 
              active={activeTab === 'orders'} 
              onClick={() => setActiveTab('orders')}
              icon={<Cpu className="w-4 h-4" />}
              label="Asset Ledger"
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              icon={<Globe className="w-4 h-4" />}
              label="Dispatch Nodes"
            />
          </div>

          <div className="p-10 bg-slate-950/50 border border-white/5 rounded-[3rem] space-y-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/[0.01] group-hover:bg-amber-500/[0.03] transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 relative z-10">CORE SYSTEMS</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <QuickActionLink icon={<Activity className="w-5 h-5 text-amber-500" />} label="Metrics" to="/admin" />
              <QuickActionLink icon={<Bot className="w-5 h-5 text-amber-500" />} label="A.I. Link" to="/helping" />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full group bg-slate-900/40 border border-white/5 py-7 rounded-[2.5rem] flex items-center justify-center gap-4 hover:bg-red-500 transition-all duration-700 shadow-xl"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            <span className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 group-hover:text-white">Terminate Access</span>
          </motion.button>
        </div>

        {/* Dynamic Detail Column */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] space-y-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                  {/* Executive Pattern Overlay */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none rotate-12" style={{ backgroundImage: 'linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b), linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b)', backgroundSize: '100px 100px', backgroundPosition: '0 0, 50px 50px' }} />
                  
                  <div className="space-y-10 relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/50 border-b border-white/5 pb-8 italic">Credential Authentication Layer</h3>
                    <div className="space-y-10">
                      <ProfileItem icon={<Mail className="w-5 h-5" />} label="Encrypted Channel" value={currentUser.email} color="text-amber-500" />
                      <ProfileItem icon={<CheckCircle2 className="w-5 h-5" />} label="Digital Signature ID" value={currentUser.uid.slice(0, 16).toUpperCase()} color="text-amber-500" />
                      <ProfileItem icon={<Clock className="w-5 h-5" />} label="Membership Class" value="PLATINUM EXECUTIVE" color="text-amber-500" />
                    </div>
                  </div>

                  <button className="w-full bg-slate-950 border border-white/10 text-amber-500 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-slate-950 transition-all duration-700 shadow-inner group">
                    Configure Identity Parameters
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] space-y-12 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-16 opacity-[0.02]">
                     <MapPin className="w-64 h-64 text-amber-500" />
                   </div>
                   
                   <div className="space-y-12 relative z-10">
                      <div className="space-y-8">
                         <div className="flex items-center justify-between border-b border-white/5 pb-8">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/50 leading-none italic">Distribution Manifest</h3>
                           <button className="text-[10px] font-black uppercase bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 px-8 py-3.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20">Sync New Node</button>
                         </div>
                         
                         <div className="space-y-6">
                            {[
                              { label: 'Executive Command Center', address: '123 Mayfair Avenue, Central London, W1J 7JZ' },
                              { label: 'Offshore Logistics Hub', address: '456 Windsor Close, Berkshire, SL4 1PJ' }
                            ].map((addr, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-950/40 p-8 rounded-[2.5rem] border border-white/5 group hover:border-amber-500/30 transition-all duration-700 shadow-inner relative overflow-hidden"
                              >
                                 <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <MapPin className="w-16 h-16 text-amber-500" />
                                 </div>
                                 <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-6">
                                       <div className="w-14 h-14 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-amber-500 shadow-2xl group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-700">
                                          <MapPin className="w-7 h-7" />
                                       </div>
                                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-100 group-hover:text-amber-500 transition-colors italic">{addr.label}</span>
                                    </div>
                                    <div className="flex gap-6 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <button className="text-[10px] font-black uppercase text-slate-500 hover:text-amber-500 transition-colors">calibrate</button>
                                      <button className="text-[10px] font-black uppercase text-slate-500 hover:text-red-500 transition-colors">purge</button>
                                    </div>
                                 </div>
                                 <p className="text-sm text-slate-500 font-bold pl-20 leading-relaxed uppercase tracking-tighter opacity-70">{addr.address}</p>
                              </motion.div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-amber-500/[0.02] border border-amber-500/10 p-8 rounded-[2.5rem] flex items-center gap-8 backdrop-blur-md">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xl">
                          <Shield className="w-6 h-6 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                          Your navigational coordinates are isolated via quantum-encrypted transit protocols. Privacy is institutionalized.
                        </p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {orders.length === 0 ? (
                  <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[4rem] p-24 text-center space-y-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <div className="w-32 h-32 bg-slate-950 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-white/5 opacity-50 relative group">
                      <div className="absolute inset-0 bg-amber-500/5 rounded-full animate-ping opacity-20" />
                      <Package className="w-12 h-12 text-slate-700 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">Vested Interest <span className="text-amber-500">Nullified</span></h3>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] leading-relaxed max-w-xs mx-auto">No procurement sequences detected in the central ledger.</p>
                    </div>
                    <Link to="/" className="inline-flex items-center gap-4 text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] bg-gradient-to-br from-amber-400 to-amber-600 px-12 py-5 rounded-2xl shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all">
                      ACCESS INVENTORY <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {orders.map((order, idx) => (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8, ease: 'circOut' }}
                        className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 overflow-hidden group hover:border-amber-500/30 transition-all duration-700 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                      >
                        {/* Premium Accordion Header */}
                        <button 
                          onClick={() => toggleOrder(order.id)}
                          className="w-full text-left p-10 space-y-8 relative"
                        >
                          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-all duration-1000">
                            <Truck className="w-24 h-24 text-amber-500" />
                          </div>

                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block">TRANSACTION HASH</span>
                                <span className="text-3xl font-black tracking-tighter text-white group-hover:text-amber-500 transition-colors uppercase italic">#{order.id.slice(-8)}</span>
                              </div>
                            </div>
                            <div className={cn(
                              "flex items-center gap-3 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl backdrop-blur-md transition-all duration-700",
                              order.status === 'delivered' ? "bg-amber-500/5 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950" : 
                              order.status === 'cancelled' ? "bg-red-500/5 text-red-500 border border-red-500/20" :
                              "bg-indigo-400/5 text-indigo-400 border border-indigo-400/20 group-hover:bg-indigo-400 group-hover:text-slate-950"
                            )}>
                              {order.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                              {order.status}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-10 border-t border-white/5 relative z-10">
                            <div className="flex -space-x-5">
                              {order.items?.slice(0, 4).map((item, i) => (
                                <div key={i} className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-slate-900 overflow-hidden shadow-2xl ring-4 ring-slate-900/10 group-hover:ring-amber-500/10 transition-all duration-700">
                                  <img src={item.image || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=40`} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt={item.name} />
                                </div>
                              ))}
                              {order.items?.length > 4 && (
                                 <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-2xl">
                                   +{order.items.length - 4}
                                 </div>
                              )}
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-1">TOTAL VALUATION</span>
                                <span className="text-4xl font-black text-white italic group-hover:text-amber-500 transition-colors tracking-tighter drop-shadow-2xl">{formatCurrency(order.total)}</span>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                <ChevronDown className={cn("w-6 h-6 text-white transition-transform duration-700", expandedOrder === order.id && "rotate-180 text-amber-500")} />
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Detail Accordion Content */}
                        <AnimatePresence>
                          {expandedOrder === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.6, ease: "circOut" }}
                              className="bg-slate-950/50 border-t border-white/5 relative overflow-hidden"
                            >
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

                              <div className="p-12 space-y-12 relative z-10">
                                 <div className="space-y-8">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.6em] text-amber-500/50 border-b border-white/5 pb-6 italic">PROVISIONING MANIFEST</h4>
                                    <div className="grid gap-6">
                                      {order.items?.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between group/item bg-slate-900/40 p-6 rounded-3xl border border-white/5 hover:border-amber-500/20 transition-all duration-500 shadow-inner">
                                           <div className="flex items-center gap-6">
                                              <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center p-2 shadow-2xl group-hover/item:border-amber-500/30 transition-all overflow-hidden relative">
                                                 <img src={item.image || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=40`} className="w-full h-full object-contain group-hover/item:scale-110 transition-transform duration-700" alt={item.name} />
                                              </div>
                                              <div>
                                                 <div className="text-lg font-black text-white italic tracking-tight group-hover/item:text-amber-500 transition-colors uppercase">{item.name}</div>
                                                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 inline-block">Quantity: {item.quantity} units</div>
                                              </div>
                                           </div>
                                           <div className="text-right">
                                              <span className="text-[10px] font-black text-slate-600 block uppercase tracking-widest mb-1">UNIT COST</span>
                                              <span className="text-xl font-black text-amber-500 tracking-tighter italic">{formatCurrency(item.price)}</span>
                                           </div>
                                        </div>
                                      ))}
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-8 pt-4">
                                    <Link to={`/track-order?id=${order.id}`} className="flex items-center justify-center gap-4 bg-slate-900/60 border border-white/10 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-700 group/btn shadow-xl shadow-black/20">
                                      <Activity className="w-5 h-5 group-hover/btn:animate-pulse" />
                                      REAL-TIME TRACKING
                                    </Link>
                                    <button className="flex items-center justify-center gap-4 bg-slate-900/60 border border-white/10 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-700 shadow-xl shadow-black/20 group">
                                      <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                      ENCRYPTED VOID INVOICE
                                    </button>
                                 </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-5 px-10 py-6 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 w-full group italic",
        active 
          ? "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_20px_50px_rgba(245,158,11,0.3)] border border-amber-400 scale-[1.02]" 
          : "text-slate-500 hover:text-amber-500/80 hover:bg-white/5 border border-transparent"
      )}
    >
      <div className={cn("transition-all duration-700", active ? "scale-150 rotate-12 drop-shadow-lg" : "group-hover:scale-110 group-hover:text-amber-500")}>{icon}</div>
      <span className="tracking-[0.4em]">{label}</span>
      {active && (
        <motion.div layoutId="tab-pill" className="ml-auto w-1.5 h-6 bg-slate-950/20 rounded-full" />
      )}
    </button>
  );
}

function QuickActionLink({ icon, label, to }: { icon: ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-5 bg-slate-950/40 px-6 py-10 rounded-[2.5rem] border border-white/5 hover:border-amber-500/40 transition-all duration-700 group shadow-inner relative overflow-hidden">
      <div className="absolute inset-0 bg-amber-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5 bg-slate-900 rounded-3xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 shadow-[0_15px_30px_rgba(0,0,0,0.4)] group-hover:shadow-amber-500/10 border border-white/5 group-hover:border-amber-500/20">
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 group-hover:text-amber-500/80 transition-colors relative z-10">{label}</span>
    </Link>
  );
}

function ProfileItem({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-10">
        <div className={cn("w-16 h-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center border border-white/5 group-hover:border-amber-500/40 transition-all duration-1000 shadow-2xl relative", color)}>
          <div className="absolute inset-0 bg-amber-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]" />
          <div className="relative z-10 group-hover:scale-110 transition-transform duration-700">{icon}</div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] leading-none italic">{label}</span>
          <span className="text-xl font-black tracking-tight text-white italic group-hover:text-amber-500 transition-colors duration-500">{value}</span>
        </div>
      </div>
      <motion.div whileHover={{ x: 5 }} className="p-3 bg-white/5 rounded-xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700">
        <ExternalLink className="w-5 h-5 text-amber-500" />
      </motion.div>
    </div>
  );
}
