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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">ORDER <span className="text-whatsapp">LOGISTICS</span></h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Finalizing Procurement Dispatch sequence</p>
      </div>

      <form onSubmit={handleFinish} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping Info */}
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl space-y-6 relative overflow-hidden group">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-whatsapp" /> Dispatch Coordinates
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Agent</label>
                <input name="firstName" required type="text" placeholder="First Name" className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs font-black uppercase tracking-widest focus:border-whatsapp/50 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Agent</label>
                <input required type="text" placeholder="Last Name" className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs font-black uppercase tracking-widest focus:border-whatsapp/50 outline-none transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication Line</label>
              <input name="email" required type="email" placeholder="Email Address for encrypted briefing" className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs font-black uppercase tracking-widest focus:border-whatsapp/50 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Drop Zone Location</label>
              <textarea required rows={3} placeholder="Full physical address for high-speed transit..." className="w-full bg-slate-950 border border-white/5 rounded-xl py-3.5 px-5 text-xs font-black uppercase tracking-widest focus:border-whatsapp/50 outline-none resize-none transition-all" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-whatsapp" /> Asset Transfer Protocol
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button type="button" className="bg-whatsapp/10 border border-whatsapp p-4 rounded-2xl flex flex-col items-center gap-2 relative overflow-hidden transition-all shadow-lg shadow-whatsapp/5">
                <div className="w-10 h-10 bg-whatsapp/20 rounded-xl flex items-center justify-center text-whatsapp shadow-lg">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-whatsapp leading-none">C.O.D.</span>
                  <span className="block text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Direct Handover</span>
                </div>
              </button>
              
              <button type="button" className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 grayscale opacity-30 cursor-not-allowed transition-all">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-700">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">Net Bank</span>
                  <span className="block text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-1">Pending Sync</span>
                </div>
              </button>

              <button type="button" className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2 grayscale opacity-30 cursor-not-allowed transition-all">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">Card Base</span>
                  <span className="block text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-1">Unauthorized</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl space-y-6 sticky top-24 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black italic uppercase tracking-widest text-slate-100 leading-none">Package <span className="text-whatsapp">Manifest</span></h2>
              <div className="px-2.5 py-1 bg-whatsapp/10 rounded-full text-[8px] font-black uppercase tracking-widest text-whatsapp border border-whatsapp/20">LIVE</div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-white/5 group hover:border-whatsapp/20 transition-all">
                <div className="w-16 h-16 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf" className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-200 truncate leading-none">Hardware Protocol</h4>
                  <span className="block text-[7px] font-bold text-slate-600 uppercase tracking-widest mt-1">Batch #472</span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-black text-whatsapp italic leading-none">{formatCurrency(189.99)}</span>
                  <span className="block text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">x1</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">
                  <span>Subtotal Value</span>
                  <span className="text-slate-300">{formatCurrency(189.99)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">Total Commitment</span>
                    <div className="text-3xl font-black text-white italic leading-none">{formatCurrency(189.99)}</div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-whatsapp/20 mb-1" />
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <button
                  disabled={loading}
                  className="w-full bg-whatsapp text-slate-950 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-whatsapp/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 transition-all"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirm Procurement <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 justify-center py-2 border-t border-white/5 mt-2">
                  <ShieldCheck className="w-3 h-3 text-whatsapp" /> 
                  <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Secured Retail Intelligence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
