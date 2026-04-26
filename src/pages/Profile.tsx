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
import { auth, db } from '../lib/firebase';
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-whatsapp/20 border-t-whatsapp rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Syncing Profile Data...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-8 px-4">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto border border-white/5 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-red-500/10 animate-pulse rounded-[2rem]" />
          <Shield className="w-10 h-10 text-red-500 relative z-10" />
        </motion.div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Access <span className="text-red-500">Denied</span></h2>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest leading-relaxed">Authorization protocol failed. Login required to intercept data streams.</p>
        </div>

        <Link to="/login" className="flex items-center justify-center gap-3 bg-whatsapp text-slate-900 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_15px_40px_rgba(34,197,94,0.3)] hover:scale-105 active:scale-95 transition-all w-full">
          Intercept Signal <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4 sm:px-0">
      {/* Tactical Header Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-slate-900 border border-white/5 p-8 rounded-[3rem] flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Globe className="w-64 h-64 text-whatsapp animate-spin-slow" />
          </div>
          
          <div className="relative z-10">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-950 flex items-center justify-center border-2 border-white/5 overflow-hidden relative group-hover:border-whatsapp/50 transition-all duration-500 shadow-inner">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-700 group-hover:text-whatsapp group-hover:scale-110 transition-all duration-500" />
              )}
              <div className="absolute inset-0 bg-whatsapp/0 group-hover:bg-whatsapp/5 transition-colors" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-whatsapp p-2.5 rounded-2xl border-4 border-slate-950 shadow-2xl">
              <Zap className="w-4 h-4 text-slate-950" />
            </div>
          </div>

          <div className="space-y-4 text-center sm:text-left relative z-10">
            <div className="space-y-1">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{currentUser.displayName || 'Network Agent'}</h1>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] italic">Deployment Status: Optimal</p>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-whatsapp/20 text-whatsapp text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-whatsapp/20">Elite Operator</span>
              <span className="bg-slate-800/40 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-white/5 italic">Verified Signal</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 bg-slate-900 border border-white/5 p-8 rounded-[3rem] flex flex-col justify-between group shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-whatsapp/5 rounded-full blur-3xl" />
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 block">Protocol Age</span>
            <div className="text-3xl font-black italic uppercase tracking-tighter text-slate-100">214 <span className="text-whatsapp whitespace-nowrap">Days</span></div>
          </div>
          <div className="space-y-1">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-whatsapp" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Sync Strength: 75%</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Column */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 p-2 bg-slate-900 border border-white/5 rounded-[2.5rem] shadow-2xl">
            <TabButton 
              active={activeTab === 'info'} 
              onClick={() => setActiveTab('info')}
              icon={<Cpu className="w-4 h-4" />}
              label="Account Info"
            />
            <TabButton 
              active={activeTab === 'orders'} 
              onClick={() => setActiveTab('orders')}
              icon={<Activity className="w-4 h-4" />}
              label="Order History"
            />
            <TabButton 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')}
              icon={<MapPin className="w-4 h-4" />}
              label="Address Book"
            />
          </div>

          <div className="p-6 bg-slate-900/40 border border-white/5 rounded-[2.5rem] space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickActionLink icon={<Shield className="w-5 h-5 text-whatsapp" />} label="Security" to="/admin" />
              <QuickActionLink icon={<Bot className="w-5 h-5 text-blue-400" />} label="Helping" to="/helping" />
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full group bg-red-500/5 border border-red-500/20 py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-red-500/10 hover:border-red-500/40 transition-all shadow-xl"
          >
            <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="font-black italic uppercase tracking-tighter text-slate-200 group-hover:text-red-500">Terminate Protocol Session</span>
          </button>
        </div>

        {/* Content Column */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] -rotate-12">
                    <User className="w-48 h-48" />
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Identification Fields</h3>
                    <div className="space-y-6">
                      <ProfileItem icon={<Mail className="w-4 h-4" />} label="Access Email" value={currentUser.email} color="text-yellow-400" />
                      <ProfileItem icon={<CheckCircle2 className="w-4 h-4" />} label="Registry ID" value={currentUser.uid.slice(0, 16)} color="text-whatsapp" />
                      <ProfileItem icon={<Clock className="w-4 h-4" />} label="Deployment Epoch" value="Phase 2.0" color="text-purple-400" />
                    </div>
                  </div>

                  <button className="w-full bg-slate-950 text-slate-400 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-whatsapp hover:border-whatsapp/30 border border-white/5 transition-all active:scale-95 shadow-inner">
                    Recalibrate Identity Signals
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                     <MapPin className="w-48 h-48" />
                   </div>
                   
                   <div className="space-y-10 relative z-10">
                      {/* Address Book */}
                      <div className="space-y-6">
                         <div className="flex items-center justify-between border-b border-white/5 pb-4">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 leading-none italic">Drop Zone Registry</h3>
                           <button className="text-[10px] font-black uppercase bg-whatsapp text-slate-950 px-4 py-1.5 rounded-lg hover:scale-105 active:scale-95 transition-all">Add New Vector</button>
                         </div>
                         
                         <div className="space-y-4">
                            {[
                              { label: 'Primary Terminal', address: '123 Tactical Way, Sector 7G, Cyber City, CC 90210' },
                              { label: 'Secondary Node', address: '456 Stealth Lane, Underworld District, CC 88123' }
                            ].map((addr, i) => (
                              <div key={i} className="bg-slate-950 p-6 rounded-2xl border border-white/5 group hover:border-whatsapp/30 transition-all shadow-inner relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                                    <MapPin className="w-12 h-12" />
                                 </div>
                                 <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-whatsapp shadow-xl">
                                          <MapPin className="w-5 h-5" />
                                       </div>
                                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-100 italic">{addr.label}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button className="text-[8px] font-black uppercase text-slate-500 hover:text-whatsapp">Edit</button>
                                      <button className="text-[8px] font-black uppercase text-slate-500 hover:text-red-500">Delete</button>
                                    </div>
                                 </div>
                                 <p className="text-sm text-slate-400 font-medium italic pl-14">{addr.address}</p>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-whatsapp/[0.03] border border-whatsapp/20 p-6 rounded-2xl flex items-center gap-4">
                        <AlertCircle className="w-5 h-5 text-whatsapp" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          Secure Logistics Protocol active. All addresses are verified against the tactical geo-fencing system.
                        </p>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {orders.length === 0 ? (
                  <div className="bg-slate-900 border border-dashed border-white/10 rounded-[3rem] p-16 text-center space-y-6 shadow-2xl">
                    <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto opacity-20 grayscale border border-white/5">
                      <Package className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-500">No Operations Recorded</h3>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] leading-relaxed">The history of your deployments is clear. Start a mission today.</p>
                    </div>
                    <Link to="/" className="inline-flex items-center gap-3 text-whatsapp text-[10px] font-black uppercase tracking-widest bg-whatsapp/5 px-8 py-3 rounded-xl border border-whatsapp/20 hover:scale-105 transition-all">
                      Begin Tactical Looting <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  orders.map((order, idx) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-slate-900 rounded-[3rem] border border-white/5 overflow-hidden group hover:border-whatsapp/30 transition-all shadow-2xl"
                    >
                      {/* Accordion Header */}
                      <button 
                        onClick={() => toggleOrder(order.id)}
                        className="w-full text-left p-8 space-y-6 relative"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                          <Truck className="w-20 h-20 text-whatsapp" />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Deployment ID</span>
                            <span className="text-2xl font-black italic uppercase tracking-tighter text-slate-100 italic group-hover:text-whatsapp transition-colors">#{order.id.slice(-8)}</span>
                          </div>
                          <div className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-inner",
                            order.status === 'delivered' ? "bg-whatsapp/10 text-whatsapp border border-whatsapp/20" : 
                            order.status === 'cancelled' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                          )}>
                            {order.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            {order.status}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                          <div className="flex -space-x-3">
                            {order.items?.slice(0, 3).map((item, i) => (
                              <div key={i} className="w-12 h-12 rounded-xl bg-slate-950 border-2 border-slate-900 overflow-hidden shadow-xl ring-2 ring-slate-900/50">
                                <img src={item.image || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=40`} className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500" alt={item.name} />
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                               <div className="w-12 h-12 rounded-xl bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500">
                                 +{order.items.length - 3}
                               </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Value</span>
                              <span className="text-2xl font-black italic text-whatsapp tracking-tighter italic">{formatCurrency(order.total)}</span>
                            </div>
                            <ChevronDown className={cn("w-6 h-6 text-slate-700 transition-transform duration-500", expandedOrder === order.id && "rotate-180 text-whatsapp")} />
                          </div>
                        </div>
                      </button>

                      {/* Accordion Content */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="bg-slate-950/50 border-t border-white/5"
                          >
                            <div className="p-8 space-y-6">
                               <div className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 pb-2">Hardware Manifest</h4>
                                  {order.items?.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group/item">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 bg-slate-900 rounded-lg border border-white/5 flex items-center justify-center p-2">
                                             <img src={item.image || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=40`} className="w-full h-full object-contain" alt={item.name} />
                                          </div>
                                          <div>
                                             <div className="text-xs font-black text-slate-200 group-hover/item:text-whatsapp transition-colors">{item.name}</div>
                                             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Qty: {item.quantity}</div>
                                          </div>
                                       </div>
                                       <span className="text-xs font-black text-slate-400 italic">{formatCurrency(item.price)}</span>
                                    </div>
                                  ))}
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4">
                                  <Link to={`/track-order?id=${order.id}`} className="flex items-center justify-center gap-2 bg-slate-900 border border-white/5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-whatsapp hover:border-whatsapp/30 transition-all">
                                    <Activity className="w-3.5 h-3.5" />
                                    Live Tracking
                                  </Link>
                                  <button className="flex items-center justify-center gap-2 bg-slate-900 border border-white/5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-whatsapp hover:border-whatsapp/30 transition-all">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Invoice Intel
                                  </button>
                               </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
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
        "flex items-center gap-3 px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all w-full",
        active ? "bg-whatsapp text-slate-950 shadow-[0_10px_25px_rgba(34,197,94,0.3)]" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
      )}
    >
      <div className={cn("transition-transform duration-500", active && "scale-125")}>{icon}</div>
      <span className="italic">{label}</span>
    </button>
  );
}

function QuickActionLink({ icon, label, to }: { icon: ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-3 bg-slate-950 px-5 py-6 rounded-2xl border border-white/5 hover:border-whatsapp/30 transition-all group shadow-inner">
      <div className="p-3 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 italic">{label}</span>
    </Link>
  );
}

function ProfileItem({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-6">
        <div className={cn("w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all", color)}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{label}</span>
          <span className="text-base font-black italic uppercase tracking-tighter text-slate-200 mt-1 italic">{value}</span>
        </div>
      </div>
      <ExternalLink className="w-5 h-5 text-slate-800 group-hover:text-whatsapp transition-colors" />
    </div>
  );
}
