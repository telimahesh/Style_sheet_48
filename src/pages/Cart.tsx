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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping <span className="text-whatsapp">Vault</span></h1>
        <p className="text-slate-400 text-sm">Review your selected high-performance hardware</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={`${item.id}-${item.color}-${item.size}`}
                layout
                className="glass p-4 rounded-3xl flex items-center gap-4 group hover:border-whatsapp/20 transition-all"
              >
                <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center p-2">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-bold text-slate-100 truncate">{item.name}</h3>
                  <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                    {item.color && <span>{item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                  <div className="text-whatsapp font-bold">{formatCurrency(item.price)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500">x{item.qty}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="glass p-6 rounded-[2.5rem] space-y-6">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-whatsapp" /> Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Shipping</span>
                  <span className="text-whatsapp font-bold uppercase text-[10px]">Free for Elite Members</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold uppercase tracking-widest text-xs">Total</span>
                  <span className="text-2xl font-black text-whatsapp">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-whatsapp text-slate-900 py-4 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <MessageSquare className="w-4 h-4 fill-slate-900" /> Order via WhatsApp
                </button>
                <Link
                  to="/checkout"
                  className="w-full glass py-4 rounded-2xl font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                >
                  Pro Checkout <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="glass p-4 rounded-2xl flex items-center gap-3 border-dashed border-whatsapp/30">
               <div className="w-10 h-10 bg-whatsapp/10 rounded-xl flex items-center justify-center">
                 <ShoppingCart className="w-5 h-5 text-whatsapp" />
               </div>
               <p className="text-[10px] font-bold text-slate-400 leading-tight">
                 Add <span className="text-whatsapp">$20.00</span> more to unlock <br/> Priority System Shipping
               </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center animate-bounce">
            <ShoppingBag className="w-10 h-10 text-slate-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">System Empty</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Your cart is currently offline. Explore our hardware catalog to begin.</p>
          </div>
          <Link to="/" className="bg-whatsapp text-slate-900 px-8 py-3 rounded-2xl font-black text-sm uppercase hover:scale-105 transition-transform">
            Start Protocol
          </Link>
        </div>
      )}
    </div>
  );
}
