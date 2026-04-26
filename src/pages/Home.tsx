import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Zap, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '@/src/lib/utils';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  image?: string;
  images: string[];
}

export default function Home() {
  const [showInstaller, setShowInstaller] = useState(true);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), limit(4));
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          images: data.images || (data.image ? [data.image] : [])
        } as Product;
      });
      setTrendingProducts(products);
    } catch (error) {
      console.error("Error fetching trending products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* PWA Prompt */}
      {showInstaller && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-neon p-4 flex items-center justify-between gap-4 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-whatsapp/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <div className="bg-whatsapp/20 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-whatsapp" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Experience the Speed</h3>
              <p className="text-xs text-slate-400">Install App for Faster Access & Offline Support</p>
            </div>
          </div>
          <button
            onClick={() => setShowInstaller(false)}
            className="bg-whatsapp text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold hover:scale-105 transition-transform"
          >
            Install
          </button>
        </motion.div>
      )}

      {/* Hero Slider */}
      <section className="relative h-[200px] sm:h-[300px] rounded-3xl overflow-hidden glass group">
        <img
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-whatsapp/20 to-slate-900/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <span className="text-whatsapp text-[10px] font-black uppercase tracking-widest bg-whatsapp/10 border border-whatsapp/20 px-2 py-1 rounded">Flash Sale Protocol</span>
          <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-100">Premium Quality <br/>High-Tech Styles</h1>
          <p className="text-xs text-slate-400 max-w-xs font-medium">Deploy the latest hardware to your setup with direct WhatsApp fulfillment.</p>
          <Link to="/search" className="inline-flex items-center gap-2 bg-whatsapp text-slate-900 px-6 py-2.5 rounded-xl font-black uppercase text-xs hover:gap-3 transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)]">
            Infiltrate Stock <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Categories</h2>
          <Link to="/categories" className="text-whatsapp text-[10px] font-black uppercase tracking-widest hover:underline">View All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {['Keyboards', 'Headsets', 'Mice', 'Lighting', 'Components', 'Audio'].map((cat, i) => (
            <Link 
              key={i} 
              to={`/search?category=${cat}`}
              className="flex-shrink-0 group cursor-pointer text-center space-y-2"
            >
              <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center group-hover:border-whatsapp/30 group-hover:bg-whatsapp/5 transition-all duration-300">
                <ShoppingBag className="w-6 h-6 text-slate-500 group-hover:text-whatsapp transition-colors" />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover:text-whatsapp transition-colors">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Trending Now</h2>
          <Link to="/categories" className="text-whatsapp text-[10px] font-black uppercase tracking-widest hover:underline">View More</Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square bg-slate-800/20 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-[2rem] text-center space-y-4">
             <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto opacity-30">
               <Zap className="w-6 h-6" />
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No hardware nodes deployed yet.</p>
             <Link to="/admin" className="text-whatsapp text-[10px] font-black uppercase tracking-widest border-b border-whatsapp">Visit Command Center</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden group hover:border-whatsapp/30 transition-all duration-300"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-square relative flex items-center justify-center p-6 bg-slate-900/20">
                    <img
                      src={product.images[0] || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400`}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-lg border border-white/5">
                      <Star className="w-3 h-3 text-whatsapp fill-whatsapp" />
                      <span className="text-[10px] font-bold text-slate-100">{product.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-xs line-clamp-1 uppercase tracking-tight text-slate-200 group-hover:text-whatsapp transition-colors">{product.name}</h3>
                    <div className="flex items-baseline justify-between">
                      <span className="text-whatsapp font-black text-sm">{formatCurrency(product.price)}</span>
                      {product.oldPrice && (
                        <span className="text-[10px] text-slate-500 font-bold line-through">{formatCurrency(product.oldPrice)}</span>
                      )}
                    </div>
                    <button className="w-full mt-2 bg-whatsapp/10 border border-whatsapp/20 text-whatsapp py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-whatsapp hover:text-slate-900 transition-all shadow-sm group-hover:shadow-lg shadow-whatsapp/5">
                      View Intel
                    </button>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



