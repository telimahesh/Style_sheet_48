import { useState } from 'react';
import { Search, ShoppingCart, Trash2, Printer, MessageSquare, Plus, Minus, User, CreditCard, ChevronLeft } from 'lucide-react';
import { formatCurrency, generateWhatsAppLink } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const PRODUCTS = [
  { id: '1', name: 'Logitech G-Pro Mouse', price: 99.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200' },
  { id: '2', name: 'Corsair K70 Keyboard', price: 159.99, image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=200' },
  { id: '3', name: 'Razer Kraken V3', price: 89.99, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200' },
  { id: '4', name: 'ASUS ROG Monitor', price: 299.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200' },
];

export default function POS() {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const addToCart = (product: typeof PRODUCTS[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const handleWhatsAppInvoice = () => {
    const itemsText = cart.map(item => `📦 ${item.name} x${item.qty} - ${formatCurrency(item.price * item.qty)}`).join('\n');
    const message = `⚡ DIGITAL INVOICE - LockingStyle\n\nBranch: Main Outlet\nDate: ${new Date().toLocaleDateString()}\n\nItems:\n${itemsText}\n\n------------------\n💰 Total Amount: ${formatCurrency(total)}\n\nThank you for shopping with us!`;
    window.open(generateWhatsAppLink('1234567890', message), '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar (Product Search) */}
      <div className="w-full md:w-[60%] lg:w-[65%] flex flex-col h-full border-r border-slate-700/50 bg-[#0F172A]/80 backdrop-blur-xl">
        {/* Top Header */}
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-4">
          <Link to="/admin" className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all group shadow-xl">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search assets or scan terminal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-700/50 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:border-whatsapp/50 outline-none transition-all placeholder:text-slate-600 focus:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            />
          </div>
          <div className="hidden sm:flex items-center gap-3 px-5 py-3 bg-slate-900/60 border border-white/5 rounded-[1.25rem] shadow-xl">
            <User className="w-4 h-4 text-whatsapp" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin_Terminal_01</span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 scrollbar-hide">
          {PRODUCTS.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
            <motion.div
              key={product.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(product)}
              className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-[2rem] cursor-pointer hover:border-whatsapp/40 transition-all group relative overflow-hidden flex flex-col"
            >
              <div className="aspect-square rounded-2xl bg-slate-900/30 mb-3 flex items-center justify-center p-3 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-whatsapp/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-xl" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-300 line-clamp-2 min-h-[30px] leading-tight">{product.name}</h3>
              <div className="mt-auto pt-3 flex items-center justify-between">
                <span className="text-sm font-black text-whatsapp italic tracking-tighter">{formatCurrency(product.price)}</span>
                <div className="w-7 h-7 bg-whatsapp text-slate-900 rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-90 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart (Billing Panel) */}
      <div className="w-full md:w-[40%] lg:w-[35%] h-full bg-[#0F172A] flex flex-col shadow-2xl relative z-10">
        <div className="p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-whatsapp/10 rounded-xl flex items-center justify-center border border-whatsapp/20">
              <ShoppingCart className="w-5 h-5 text-whatsapp" />
            </div>
            <div>
              <h2 className="font-black italic uppercase tracking-tighter text-lg leading-none">Order <span className="text-whatsapp">Queue</span></h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cart.length} active units</span>
            </div>
          </div>
          <button onClick={() => setCart([])} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide bg-gradient-to-b from-transparent to-slate-900/20">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 bg-slate-800/20 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white/5 hover:border-whatsapp/20 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-100 truncate">{item.name}</h4>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatCurrency(item.price)} / Unit</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/60 rounded-xl p-1.5 border border-white/5">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-400 hover:text-whatsapp transition-colors"><Minus className="w-3 h-3" /></button>
                  <span className="text-[10px] font-black w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-400 hover:text-whatsapp transition-colors"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-xs font-black text-whatsapp italic tracking-tighter">{formatCurrency(item.price * item.qty)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-6 py-20 grayscale">
              <div className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-3xl flex items-center justify-center group animate-pulse">
                <ShoppingCart className="w-10 h-10 text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest">Queue Empty</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deploy items from terminal</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-8 bg-slate-900/60 backdrop-blur-xl border-t border-white/5 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-300">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>Operations Tax (5%)</span>
              <span className="text-slate-300">{formatCurrency(tax)}</span>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Payload</span>
                <span className="text-4xl font-black text-whatsapp italic tracking-tighter leading-none">{formatCurrency(total)}</span>
              </div>
              <div className="p-3 bg-whatsapp/10 rounded-2xl border border-whatsapp/20">
                <CreditCard className="w-6 h-6 text-whatsapp animate-bounce" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleWhatsAppInvoice}
              className="bg-slate-800/80 border border-slate-700 py-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl"
            >
              <MessageSquare className="w-5 h-5 text-whatsapp" /> WhatsApp
            </button>
            <button className="bg-slate-800/80 border border-slate-700 py-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl">
              <Printer className="w-5 h-5 text-blue-400" /> Print Receipt
            </button>
          </div>

          <button
            disabled={cart.length === 0}
            className="w-full bg-whatsapp text-slate-900 py-6 rounded-[2rem] font-black text-xl italic tracking-tighter uppercase flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_rgba(34,197,94,0.4)] disabled:opacity-20 disabled:grayscale disabled:scale-100"
          >
            Authorize Payment Protocol
          </button>
        </div>
      </div>
    </div>
  );
}
