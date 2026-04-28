import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Zap, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '@/src/lib/utils';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
      handleFirestoreError(error, OperationType.LIST, 'products (trending)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Installation Hint */}
      {showInstaller && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-whatsapp/10 border border-whatsapp/20 p-4 flex items-center justify-between gap-4 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-whatsapp/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <div className="bg-whatsapp p-2 rounded-xl">
              <Zap className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100">Install LockingStyle</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Get the full retail protocol experience</p>
            </div>
          </div>
          <button
            onClick={() => setShowInstaller(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative h-[200px] sm:h-[350px] rounded-[2rem] overflow-hidden bg-slate-900/60 border border-white/5 group">
        <img
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">
            Elite <span className="text-whatsapp">Retail</span> Protocol
          </h1>
          <p className="text-sm text-slate-400 max-w-sm font-medium">Deploy the latest hardware to your setup with precision and speed.</p>
          <Link to="/categories" className="inline-flex items-center gap-2 bg-whatsapp text-slate-950 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-whatsapp/20">
            Access Catalog <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Categories</h2>
          <Link to="/categories" className="text-whatsapp text-[10px] font-black uppercase tracking-widest">View All</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          {['Keyboards', 'Headsets', 'Mice', 'Lighting', 'Components', 'Audio'].map((cat, i) => (
            <Link 
              key={i} 
              to={`/search?category=${cat}`}
              className="flex-shrink-0 group cursor-pointer text-center space-y-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:border-whatsapp/30 group-hover:bg-whatsapp/5 transition-all duration-300">
                <ShoppingBag className="w-6 h-6 text-slate-600 group-hover:text-whatsapp transition-colors" />
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 group-hover:text-slate-300">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Live Ops <span className="text-whatsapp">// Featured</span></h2>
          <Link to="/categories" className="text-whatsapp text-[10px] font-black uppercase tracking-widest">More Data</Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-slate-900 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : trendingProducts.length === 0 ? (
          <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 p-12 rounded-[2rem] text-center space-y-4">
             <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto opacity-50">
               <Zap className="w-6 h-6" />
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning for available gear...</p>
             <Link to="/admin" className="text-whatsapp text-[10px] font-bold uppercase border-b border-whatsapp/30 pb-0.5">Initialize DB</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trendingProducts.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -5 }}
                className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group hover:border-whatsapp/20 transition-all duration-300"
              >
                <Link to={`/product/${product.id}`}>
                  <div className="aspect-square relative flex items-center justify-center p-6 bg-slate-950/40">
                    <img
                      src={product.images[0] || `https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400`}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                      <Star className="w-3 h-3 text-whatsapp fill-whatsapp" />
                      <span className="text-[10px] font-bold text-slate-300">{product.rating || '4.8'}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-xs tracking-tight text-slate-200 line-clamp-1">{product.name}</h3>
                    <div className="flex items-baseline justify-between">
                      <span className="text-whatsapp font-black text-sm italic">{formatCurrency(product.price)}</span>
                      {product.oldPrice && (
                        <span className="text-[9px] text-slate-600 font-bold line-through">{formatCurrency(product.oldPrice)}</span>
                      )}
                    </div>
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



