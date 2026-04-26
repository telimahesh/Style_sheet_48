import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Package, CheckCircle2, Truck, Clock, Timer } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const STEPS = [
  { id: 'pending', label: 'Order Received', icon: <Clock className="w-5 h-5" />, time: '10:30 AM' },
  { id: 'packing', label: 'Quality Check & Packing', icon: <Package className="w-5 h-5" />, time: '11:15 AM' },
  { id: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck className="w-5 h-5" />, time: '02:45 PM' },
  { id: 'completed', label: 'Delivered Successfully', icon: <CheckCircle2 className="w-5 h-5" />, time: '03:20 PM' }
];

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [tracking, setTracking] = useState(false);
  const currentStep = 2; // Mocking "Out for Delivery"

  const handleTrack = () => {
    if (!orderId) return;
    setTracking(true);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto px-2">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-3">
          <Package className="w-6 h-6 text-whatsapp animate-bounce" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Track <span className="text-whatsapp">Movement</span></h1>
        </div>
        <p className="text-slate-400 text-sm font-medium">Inject your protocol ID to monitor logistics flow.</p>
      </div>

      {/* Search Field */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-whatsapp group-focus-within:scale-125 transition-all" />
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="ORDER ID (e.g. LS-9921-X)"
            className="w-full bg-slate-900 border border-white/5 rounded-[2rem] py-6 pl-14 pr-6 outline-none focus:border-whatsapp/50 text-xs font-black uppercase tracking-widest placeholder:text-slate-700 shadow-2xl transition-all"
          />
        </div>
        <button
          onClick={handleTrack}
          className="bg-whatsapp text-slate-900 px-10 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-[0_15px_40px_rgba(34,197,94,0.3)] active:scale-95 transition-all"
        >
          Locate
        </button>
      </div>

      {tracking ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Status Overview Card */}
          <div className="bg-slate-900/60 p-8 rounded-[3rem] border border-white/5 flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <Truck className="w-24 h-24 text-whatsapp" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-whatsapp rounded-full animate-ping" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Active Dispatch Sensor</span>
              </div>
              <h3 className="font-black italic uppercase text-2xl tracking-tighter text-slate-100 italic">Out for Delivery</h3>
            </div>
            
            <div className="text-right space-y-2 relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Arrival ETA</span>
              <div className="flex items-center justify-end gap-2 text-2xl font-black text-whatsapp italic tracking-tighter">
                <Timer className="w-6 h-6" /> 15 MINS
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-10 space-y-8">
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-800/50 rounded-full" />
            
            {STEPS.map((step, index) => {
              const isPast = index < currentStep;
              const isCurrent = index === currentStep;
              const isFuture = index > currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="relative group"
                >
                  <div className={cn(
                    "absolute -left-[31px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl border-4 transition-all duration-500 flex items-center justify-center z-10",
                    isPast ? "bg-whatsapp border-slate-950 scale-100" :
                    isCurrent ? "bg-slate-950 border-whatsapp scale-125 shadow-[0_0_20px_rgba(34,197,94,0.3)]" :
                    "bg-slate-950 border-slate-800 scale-90"
                  )}>
                    {isPast ? <CheckCircle2 className="w-5 h-5 text-slate-950" /> : 
                     <div className={cn("w-2 h-2 rounded-full", isCurrent ? "bg-whatsapp animate-pulse" : "bg-slate-700")} />}
                  </div>

                  <div className={cn(
                    "bg-slate-900 border transition-all duration-500 p-6 rounded-[2.5rem] flex items-center justify-between",
                    isCurrent ? "border-whatsapp/30 bg-whatsapp/[0.03] scale-[1.02] shadow-2xl" : "border-white/5 opacity-50"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        isCurrent ? "bg-whatsapp text-slate-950 rotate-6" : "bg-slate-950 text-slate-500"
                      )}>
                        {step.icon}
                      </div>
                      <div className="space-y-0.5">
                        <span className={cn(
                          "block text-sm font-black italic uppercase tracking-tight",
                          isFuture ? "text-slate-600" : "text-slate-100"
                        )}>{step.label}</span>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">System Verification Point</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[12px] font-black text-slate-500 italic font-mono tracking-tighter">{step.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">Waiting for Order ID verification...</p>
        </div>
      )}
    </div>
  );
}
