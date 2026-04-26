import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { CreditCard, MapPin, Truck, ShieldCheck, ChevronRight, ShoppingBag, Zap } from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Extract form data
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const firstName = formData.get('firstName') as string;

    try {
      // Logic for actual payment would go here.
      // After success, trigger email confirmation.
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `LS-${Math.floor(1000 + Math.random() * 9000)}`,
          customerEmail: email,
          customerName: firstName,
          orderDetails: '1x Aero-X Headset'
        })
      });

      setLoading(false);
      navigate('/track-order');
    } catch (error) {
      console.error('Email confirmation error:', error);
      setLoading(false);
      navigate('/track-order'); // Proceed anyway for the demo
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Finalize <span className="text-whatsapp">Deployment</span></h1>
        <p className="text-slate-400 text-sm font-medium">Provide your coordinates mapping for hardware delivery</p>
      </div>

      <form onSubmit={handleFinish} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping Info */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5"><MapPin className="w-20 h-20" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <MapPin className="w-5 h-5 text-whatsapp" /> Delivery Vector
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">First Marker</label>
                <input name="firstName" required type="text" placeholder="First Name" className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium focus:border-whatsapp/50 outline-none transition-all" />
              </div>
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Last Marker</label>
                <input required type="text" placeholder="Last Name" className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium focus:border-whatsapp/50 outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirmation Channel</label>
              <input name="email" required type="email" placeholder="Email Address for tracking briefing" className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium focus:border-whatsapp/50 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Target Address</label>
              <textarea required rows={3} placeholder="Full physical address for drop-off..." className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-sm font-medium focus:border-whatsapp/50 outline-none resize-none transition-all" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5"><CreditCard className="w-20 h-20" /></div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-whatsapp" /> Transaction Protocol
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button type="button" className="bg-whatsapp/10 border-2 border-whatsapp/50 p-6 rounded-3xl flex flex-col items-center gap-3 group/btn relative overflow-hidden">
                <div className="absolute inset-0 bg-whatsapp/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                <div className="w-12 h-12 bg-whatsapp/20 rounded-2xl flex items-center justify-center text-whatsapp shadow-xl border border-whatsapp/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-whatsapp">Cash On Delivery</span>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Direct Exchange</span>
                </div>
              </button>
              
              <button type="button" className="bg-slate-900/40 border-2 border-slate-700/50 p-6 rounded-3xl flex flex-col items-center gap-3 grayscale opacity-40 cursor-not-allowed group/btn">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-white/5">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Crypto Sync</span>
                  <span className="block text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Reason: Syncing...</span>
                </div>
              </button>

              <button type="button" className="bg-slate-900/40 border-2 border-slate-700/50 p-6 rounded-3xl flex flex-col items-center gap-3 grayscale opacity-40 cursor-not-allowed group/btn">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-white/5">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">System Credit</span>
                  <span className="block text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">Reason: Offline</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-white/5 p-8 rounded-[2.5rem] space-y-8 sticky top-24 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-black italic uppercase tracking-tighter text-lg leading-none">System <span className="text-whatsapp">Output</span></h2>
              <div className="px-3 py-1 bg-whatsapp/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-whatsapp animate-pulse">Live Tracking</div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-800/30 p-3 rounded-2xl border border-white/5 group hover:border-whatsapp/20 transition-all">
                <div className="w-16 h-16 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-100 truncate">Aero-X Headset</h4>
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Unit #01 / Alpha</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-whatsapp italic tracking-tighter">{formatCurrency(189.99)}</span>
                  <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">QTY: 01</span>
                </div>
              </div>
              
              <div className="pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                  <span>Subtotal Payload</span>
                  <span className="text-slate-300">{formatCurrency(189.99)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Terminal Total</span>
                  <span className="text-4xl font-black text-whatsapp italic tracking-tighter leading-none">{formatCurrency(189.99)}</span>
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <button
                  disabled={loading}
                  className="w-full bg-whatsapp text-slate-900 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirm Deployment <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 justify-center py-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-whatsapp" /> 
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">Secured Retail Protocol v4.0.2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
