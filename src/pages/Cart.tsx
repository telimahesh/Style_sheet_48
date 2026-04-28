import { motion } from 'motion/react';
import { ShoppingCart, Trash2, ChevronRight, MessageSquare, CreditCard, ShoppingBag } from 'lucide-react';
import { formatCurrency, generateWhatsAppLink } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { useCart } from '@/src/context/CartContext';

export default function Cart() {
  const { items, removeItem, totalPrice } = useCart();

  const subtotal = totalPrice;
  const total = subtotal;

  const handleWhatsAppOrder = () => {
    const itemsText = items.map(item => `📦 ${item.name} ${item.color ? `(${item.color})` : ''} ${item.size ? `(Size: ${item.size})` : ''} x${item.qty}`).join('\n');
    const message = `Hello LockingStyle! I want to order from my cart:\n\n${itemsText}\n\n💰 Subtotal: ${formatCurrency(total)}\n\nPlease confirm availability!`;
    window.open(generateWhatsAppLink('1234567890', message), '_blank');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-24">
      <div className="space-y-2 border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold tracking-tight">Your <span className="text-amber-500">Selection</span></h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Review your curated technology portfolio</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <motion.div
                key={`${item.id}-${item.color}-${item.size}`}
                layout
                className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-6 group hover:border-amber-500/20 transition-all duration-700 shadow-2xl"
              >
                <div className="w-24 h-24 bg-slate-950 rounded-[1.5rem] flex items-center justify-center p-4 border border-white/5 group-hover:scale-105 transition-transform duration-700">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 text-left space-y-1">
                  <h3 className="font-bold text-slate-100 truncate text-lg">{item.name}</h3>
                  <div className="flex gap-3 text-[9px] uppercase font-bold tracking-widest text-slate-500">
                    {item.color && <span className="bg-white/5 px-2 py-0.5 rounded-full">{item.color}</span>}
                    {item.size && <span className="bg-white/5 px-2 py-0.5 rounded-full">Size: {item.size}</span>}
                  </div>
                  <div className="text-amber-500 font-bold text-lg pt-1">{formatCurrency(item.price)}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Quantity</span>
                    <span className="text-lg font-bold text-slate-400">x{item.qty}</span>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-3 bg-slate-950 border border-white/5 text-slate-600 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all duration-500 shadow-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-10 -mt-10 group-hover:bg-amber-500/10 transition-colors duration-1000" />
              
              <h2 className="font-bold text-xl flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
                  <CreditCard className="w-5 h-5 text-slate-950" />
                </div>
                Order Summary
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Standard Delivery</span>
                  <span className="text-amber-500 font-bold uppercase text-[9px] tracking-widest">Complimentary</span>
                </div>
                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">Total Amount</span>
                  <span className="text-3xl font-bold text-amber-500 tracking-tighter">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-amber-500 text-slate-950 py-4.5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-amber-500/20"
                >
                  <MessageSquare className="w-5 h-5 fill-slate-950" /> Complete via WhatsApp
                </button>
                <Link
                  to="/checkout"
                  className="w-full bg-slate-950 border border-white/5 py-4.5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl"
                >
                  Proceed to Checkout <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="bg-amber-500/5 backdrop-blur-sm border border-amber-500/10 p-6 rounded-3xl flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                 <ShoppingCart className="w-6 h-6 text-amber-500" />
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                   Executive Privilege
                 </p>
                 <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                   Complimentary white-glove delivery on all premium selections.
                 </p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-1000">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
            <div className="relative w-32 h-32 bg-slate-900 rounded-[3rem] border border-white/5 flex items-center justify-center shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShoppingBag className="w-12 h-12 text-slate-600 group-hover:text-amber-500 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Portfolio Empty</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">Your selection portfolio is currently clear. Explore our curated collections to begin.</p>
          </div>
          <Link to="/categories" className="bg-amber-500 text-slate-950 px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-amber-500/20">
            Explore Collections
          </Link>
        </div>
      )}
    </div>
  );
}
