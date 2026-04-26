import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, SlidersHorizontal, Star, 
  Trash2, X, ChevronDown, CheckCircle2, 
  Package, ShoppingBag, Zap, ChevronRight, MessageSquare, Sparkles
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  rating: number;
  image?: string;
  images?: string[];
  stock: number;
}

const BRANDS = ['Razer', 'Logitech', 'Corsair', 'SteelSeries', 'HyperX', 'ASUS'];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // AI Assistant State
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Filters State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [queryParam, categoryParam]);

  useEffect(() => {
    if ((queryParam || categoryParam) && products.length > 0) {
      generateAiInsights();
    }
  }, [products]);

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const productNames = products.slice(0, 5).map(p => p.name).join(', ');
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the LockingStyle Tactical AI Scout. I found these products for the search "${queryParam || categoryParam}": ${productNames}.
        1. Give a very brief (max 20 words) tactical advice about these results for a gamer.
        2. Suggest 3 short related search keywords.
        Format your response as a valid JSON object with keys "advice" (string) and "queries" (array of strings).`
      });

      const text = response.text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(text);
      setAiAnalysis(data.advice);
      setAiSuggestions(data.queries);
    } catch (error) {
      console.error("AI Insights Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'products'));
      
      if (categoryParam) {
        q = query(q, where('category', '==', categoryParam));
      }

      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

      // Client-side search (Firestore doesn't support full-text search easily)
      if (queryParam) {
        results = results.filter(p => 
          p.name.toLowerCase().includes(queryParam.toLowerCase()) || 
          p.brand.toLowerCase().includes(queryParam.toLowerCase())
        );
      }

      setProducts(results);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
    const matchesRating = p.rating >= minRating;
    const matchesStock = !onlyInStock || p.stock > 0;
    return matchesPrice && matchesBrand && matchesRating && matchesStock;
  });

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedBrands([]);
    setMinRating(0);
    setOnlyInStock(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            {categoryParam ? (
              <><span className="text-whatsapp">{categoryParam}</span> Reserves</>
            ) : queryParam ? (
              <>Search: <span className="text-whatsapp">"{queryParam}"</span></>
            ) : (
              <>All <span className="text-whatsapp">Intel</span></>
            )}
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            {filteredProducts.length} hardware nodes discovered in this sectors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 md:flex-none lg:hidden flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border bg-slate-900/60 text-slate-400 border-white/5 hover:border-whatsapp/30"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <FilterContent 
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedBrands={selectedBrands}
            toggleBrand={toggleBrand}
            minRating={minRating}
            setMinRating={setMinRating}
            onlyInStock={onlyInStock}
            setOnlyInStock={setOnlyInStock}
            resetFilters={resetFilters}
            queryParam={queryParam}
            categoryParam={categoryParam}
            aiSuggestions={aiSuggestions}
          />
        </div>

        {/* Mobile Filter Slide-in Panel */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 z-50 lg:hidden shadow-2xl overflow-y-auto"
              >
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Adjust <span className="text-whatsapp">Intel</span></h2>
                    <button 
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-3 bg-slate-800 rounded-xl border border-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FilterContent 
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    selectedBrands={selectedBrands}
                    toggleBrand={toggleBrand}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    onlyInStock={onlyInStock}
                    setOnlyInStock={setOnlyInStock}
                    resetFilters={resetFilters}
                    queryParam={queryParam}
                    categoryParam={categoryParam}
                    aiSuggestions={aiSuggestions}
                    onApply={() => setIsMobileFilterOpen(false)}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Scout Insight */}
          <AnimatePresence>
            {(isAiLoading || aiAnalysis) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-whatsapp/5 border border-whatsapp/20 p-6 rounded-[2rem] space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                  <Sparkles className="w-24 h-24 text-whatsapp" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-whatsapp rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    <Zap className="w-5 h-5 text-slate-900 fill-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-whatsapp">Tactical AI Scout</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Sector Intelligence Analysis</p>
                  </div>
                </div>

                {isAiLoading ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-2 h-2 bg-whatsapp rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-whatsapp rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-2 h-2 bg-whatsapp rounded-full animate-bounce [animation-delay:-.5s]" />
                    <span className="text-[10px] font-black uppercase text-slate-500">Scanning Signal...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-300 font-medium italic leading-relaxed max-w-2xl relative z-10">
                      "{aiAnalysis}"
                    </p>
                    {aiSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {aiSuggestions.map((query, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSearchParams({ q: query })}
                            className="px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-whatsapp hover:border-whatsapp/30 transition-all"
                          >
                            Refine: {query}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square bg-slate-900/40 rounded-[2rem] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-6 bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-800">
              <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto opacity-30">
                <Search className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Zero Nodes <span className="text-whatsapp">Discovered</span></h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Adjust filters or refine search query.</p>
              </div>
              <button 
                onClick={resetFilters}
                className="text-whatsapp text-[10px] font-black uppercase tracking-widest border-b border-whatsapp pb-0.5"
              >
                Clear All Constraints
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-whatsapp/30 transition-all flex flex-col p-4"
                >
                  <Link to={`/product/${product.id}`} className="space-y-4 flex-1">
                    <div className="aspect-[4/3] bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={(product.images && product.images[0]) || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"} 
                        alt={product.name}
                        className="w-full h-full object-cover scale-90 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-slate-400 group-hover:text-whatsapp transition-colors">
                          {product.brand}
                        </span>
                      </div>
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute bottom-4 right-4 animate-pulse">
                          <span className="bg-red-500/90 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-xl">
                            Critical Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-2 space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{product.category}</span>
                         <div className="flex items-center gap-1">
                           <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                           <span className="text-[10px] font-black text-slate-200">{product.rating}</span>
                         </div>
                       </div>
                       <h3 className="text-sm font-black italic uppercase tracking-tight text-slate-100 line-clamp-1 group-hover:text-whatsapp transition-colors">
                         {product.name}
                       </h3>
                       <div className="flex items-baseline justify-between pt-2">
                         <span className="text-lg font-black italic tracking-tighter text-whatsapp">{formatCurrency(product.price)}</span>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{product.stock} Units</span>
                       </div>
                    </div>
                  </Link>
                  
                  <button className="w-full mt-6 bg-whatsapp/10 border border-whatsapp/20 text-whatsapp py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-whatsapp hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                    WhatsApp Acquire <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterContent({ 
  priceRange, setPriceRange, selectedBrands, toggleBrand, 
  minRating, setMinRating, onlyInStock, setOnlyInStock, 
  resetFilters, queryParam, categoryParam, aiSuggestions, onApply 
}: {
  priceRange: [number, number],
  setPriceRange: (range: [number, number]) => void,
  selectedBrands: string[],
  toggleBrand: (brand: string) => void,
  minRating: number,
  setMinRating: (rating: number) => void,
  onlyInStock: boolean,
  setOnlyInStock: (val: boolean) => void,
  resetFilters: () => void,
  queryParam: string,
  categoryParam: string,
  aiSuggestions: string[],
  onApply?: () => void
}) {
  const [openSections, setOpenSections] = useState<string[]>(['price', 'brand', 'rating', 'availability', 'related']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const SectionHeader = ({ id, title }: { id: string, title: string }) => (
    <button 
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-2 group"
    >
      <span className="text-xs font-black italic uppercase tracking-tight text-slate-300 group-hover:text-whatsapp transition-colors">{title}</span>
      <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-300", openSections.includes(id) ? "rotate-180" : "")} />
    </button>
  );

  return (
    <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-6 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</h3>
        <button onClick={resetFilters} className="text-whatsapp text-[10px] font-black uppercase tracking-widest hover:underline">Reset</button>
      </div>

      {/* Price Range */}
      <div className="space-y-4 border-b border-white/5 pb-4">
        <SectionHeader id="price" title="Price Sector" />
        <AnimatePresence>
          {openSections.includes('price') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-whatsapp tracking-tighter">{formatCurrency(priceRange[1])} Max</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-whatsapp"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brands */}
      <div className="space-y-4 border-b border-white/5 pb-4">
        <SectionHeader id="brand" title="Manufacturer" />
        <AnimatePresence>
          {openSections.includes('brand') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="grid grid-cols-2 gap-2">
                {BRANDS.map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all text-left truncate",
                      selectedBrands.includes(brand) 
                        ? "bg-whatsapp/10 border-whatsapp text-whatsapp" 
                        : "bg-slate-900 border-white/5 text-slate-500 hover:border-slate-700"
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating */}
      <div className="space-y-4 border-b border-white/5 pb-4">
        <SectionHeader id="rating" title="Performance Rating" />
        <AnimatePresence>
          {openSections.includes('rating') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="flex gap-2">
                {[3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border transition-all",
                      minRating === rating
                        ? "bg-whatsapp/10 border-whatsapp text-whatsapp"
                        : "bg-slate-900 border-white/5 text-slate-500 hover:border-slate-700"
                    )}
                  >
                    <span className="text-[10px] font-black">{rating}+</span>
                    <Star className={cn("w-3 h-3", minRating === rating ? "fill-whatsapp" : "fill-slate-600")} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Related Search / AI Suggestions - NEW ACCORDION */}
      <div className="space-y-4 border-b border-white/5 pb-4">
        <SectionHeader id="related" title="Related Reservoirs" />
        <AnimatePresence>
          {openSections.includes('related') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2 space-y-3"
            >
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-whatsapp" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest italic">AI Suggested Targets</span>
                </div>
                {aiSuggestions.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {aiSuggestions.map((suggestion, i) => (
                      <Link 
                        key={i}
                        to={`/search?q=${suggestion}`}
                        className="text-[10px] font-black uppercase tracking-tight text-slate-400 hover:text-whatsapp transition-colors flex items-center justify-between group/link"
                      >
                        {suggestion}
                        <ChevronRight className="w-3 h-3 text-slate-800 group-hover/link:text-whatsapp transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-medium text-slate-600 italic">Scanning sector for related hardware signals...</p>
                )}
              </div>

              {/* Quick Jump for Category */}
              {categoryParam && (
                 <div className="bg-whatsapp/5 p-4 rounded-xl border border-whatsapp/20 space-y-2">
                    <span className="text-[8px] font-black uppercase text-whatsapp tracking-widest block leading-none">Category Cluster</span>
                    <Link to="/categories" className="text-[10px] font-black uppercase text-slate-200 hover:text-whatsapp flex items-center justify-between">
                       Sector Directory
                       <ChevronRight className="w-3 h-3" />
                    </Link>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <SectionHeader id="availability" title="Asset Status" />
        <AnimatePresence>
          {openSections.includes('availability') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-2"
            >
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Only Active Stock</span>
                <button 
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    onlyInStock ? "bg-whatsapp" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                    onlyInStock ? "left-6" : "left-1"
                  )} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onApply && (
        <button 
          onClick={onApply}
          className="w-full bg-whatsapp text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-whatsapp/20 mt-4"
        >
          Apply Tactical Filters
        </button>
      )}
    </div>
  );
}
