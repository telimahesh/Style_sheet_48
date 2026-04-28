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
    <div className="space-y-12 animate-in fade-in duration-1000 pb-24">
      {/* Refined Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-amber-500 rounded-full" />
             <h1 className="text-4xl font-bold tracking-tight">
               {categoryParam ? (
                 <><span className="text-amber-500">{categoryParam}</span> Collection</>
               ) : queryParam ? (
                 <>Results for <span className="text-amber-500">"{queryParam}"</span></>
               ) : (
                 <>Full <span className="text-amber-500">Catalog</span></>
               )}
             </h1>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            {filteredProducts.length} Premium items discovered in our vault
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 md:flex-none lg:hidden flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all bg-slate-900 shadow-2xl border border-white/5 text-slate-400 hover:border-amber-500/30"
          >
            <SlidersHorizontal className="w-4 h-4" /> Refine Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
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
                className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-950 z-50 lg:hidden shadow-[0_0_100px_rgba(0,0,0,1)] overflow-y-auto"
              >
                <div className="p-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Refine <span className="text-amber-500">Search</span></h2>
                    <button 
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-4 bg-slate-900 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all shadow-2xl"
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
        <div className="lg:col-span-3 space-y-8">
          {/* AI Scout Insight */}
          <AnimatePresence>
            {(isAiLoading || aiAnalysis) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/10 p-8 rounded-[3rem] space-y-6 relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 -mr-10 -mt-10">
                  <Sparkles className="w-48 h-48 text-amber-500" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Executive AI Advisor</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Curated Market Intelligence</p>
                  </div>
                </div>

                {isAiLoading ? (
                  <div className="flex items-center gap-4 py-4 relative z-10">
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce" />
                       <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Analyzing collection signals...</span>
                  </div>
                ) : (
                  <div className="relative z-10 space-y-6">
                    <p className="text-lg text-slate-200 font-medium leading-relaxed max-w-2xl">
                      "{aiAnalysis}"
                    </p>
                    {aiSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {aiSuggestions.map((query, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSearchParams({ q: query })}
                            className="px-6 py-2.5 bg-slate-950/60 border border-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-slate-950 transition-all shadow-xl"
                          >
                            Explore: {query}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/5] bg-slate-900/40 rounded-[3rem] animate-pulse shadow-2xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center space-y-8 bg-slate-900/40 rounded-[4rem] border border-dashed border-slate-800 shadow-2xl">
              <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto opacity-30 shadow-inner">
                <Search className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight">Portfolio <span className="text-amber-500">Clear</span></h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">No items match your sophisticated selection.</p>
              </div>
              <button 
                onClick={resetFilters}
                className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-amber-500/30 pb-1 hover:opacity-70 transition-opacity"
              >
                Clear All Preferences
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-950/40 border border-white/5 rounded-[3rem] overflow-hidden group hover:border-amber-500/30 transition-all duration-700 flex flex-col p-6 shadow-2xl hover:shadow-amber-500/5"
                >
                  <Link to={`/product/${product.id}`} className="space-y-6 flex-1">
                    <div className="aspect-[4/3] bg-slate-950 rounded-[2rem] relative overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                      <img 
                        src={(product.images && product.images[0]) || product.image || "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"} 
                        alt={product.name}
                        className="w-full h-full object-contain p-8 group-hover:scale-110 group-hover:rotate-1 transition-all duration-1000"
                      />
                      <div className="absolute top-5 left-5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] bg-slate-900/90 backdrop-blur-xl px-3 py-1.5 rounded-xl text-slate-500 group-hover:text-amber-500 border border-white/10 transition-colors shadow-2xl">
                          {product.brand}
                        </span>
                      </div>
                      {product.stock <= 5 && product.stock > 0 && (
                        <div className="absolute bottom-5 right-5">
                          <span className="bg-amber-500 text-slate-950 text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl shadow-amber-500/30">
                            Limited Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-2 space-y-4">
                       <div className="flex items-center justify-between">
                         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">{product.category}</span>
                         <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                           <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shadow-amber-500/50 shadow-lg" />
                           <span className="text-xs font-bold text-slate-200">{product.rating}</span>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1 group-hover:text-amber-500 transition-colors duration-500">
                           {product.name}
                         </h3>
                         <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Premium Tier Selection</p>
                       </div>
                       <div className="flex items-baseline justify-between pt-4">
                         <span className="text-2xl font-bold text-amber-500 tracking-tight">{formatCurrency(product.price)}</span>
                         <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{product.stock} Available</span>
                       </div>
                    </div>
                  </Link>
                  
                  <button className="w-full mt-8 bg-slate-900/50 border border-white/5 text-slate-500 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all duration-500 shadow-inner group-hover:shadow-2xl group-hover:shadow-amber-500/10">
                    Acquire via WhatsApp <ChevronRight className="w-3 h-3 ml-1" />
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
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-amber-500 transition-colors">{title}</span>
      <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform duration-300", openSections.includes(id) ? "rotate-180" : "")} />
    </button>
  );

  return (
    <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 space-y-8 sticky top-24 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Refinement</h3>
        <button onClick={resetFilters} className="text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">Clear All</button>
      </div>

      {/* Price Range */}
      <div className="space-y-4 border-b border-white/5 pb-6">
        <SectionHeader id="price" title="Value Range" />
        <AnimatePresence>
          {openSections.includes('price') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-6 pt-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-500 tracking-tight">Up to {formatCurrency(priceRange[1])}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brands */}
      <div className="space-y-4 border-b border-white/5 pb-6">
        <SectionHeader id="brand" title="Maison / Brand" />
        <AnimatePresence>
          {openSections.includes('brand') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {BRANDS.map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all text-left truncate",
                      selectedBrands.includes(brand) 
                        ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10" 
                        : "bg-slate-950 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-900"
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
      <div className="space-y-4 border-b border-white/5 pb-6">
        <SectionHeader id="rating" title="Excellence Tier" />
        <AnimatePresence>
          {openSections.includes('rating') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-4"
            >
              <div className="flex gap-3">
                {[3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                      minRating === rating
                        ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10"
                        : "bg-slate-950 border-white/5 text-slate-500 hover:border-white/10 hover:bg-slate-900"
                    )}
                  >
                    <span className="text-[10px] font-bold">{rating}+</span>
                    <Star className={cn("w-3.5 h-3.5", minRating === rating ? "fill-amber-500 text-amber-500" : "fill-slate-600 text-slate-600")} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Related Search / AI Suggestions - NEW ACCORDION */}
      <div className="space-y-4 border-b border-white/5 pb-6">
        <SectionHeader id="related" title="Curated Suggestions" />
        <AnimatePresence>
          {openSections.includes('related') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-4 space-y-4"
            >
              <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[8px] font-bold uppercase text-slate-500 tracking-[0.2em]">Advisor Insights</span>
                </div>
                {aiSuggestions.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {aiSuggestions.map((suggestion, i) => (
                      <Link 
                        key={i}
                        to={`/search?q=${suggestion}`}
                        className="text-[10px] font-bold uppercase tracking-tight text-slate-400 hover:text-amber-500 transition-colors flex items-center justify-between group/link"
                      >
                        {suggestion}
                        <ChevronRight className="w-3 h-3 text-slate-800 group-hover/link:text-amber-500 transition-all translate-x-0 group-hover/link:translate-x-1" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-medium text-slate-600 italic">Curating related signals...</p>
                )}
              </div>

              {/* Quick Jump for Category */}
              {categoryParam && (
                 <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 space-y-3">
                    <span className="text-[8px] font-bold uppercase text-amber-500/70 tracking-[0.2em] block leading-none">Category Context</span>
                    <Link to="/categories" className="text-[10px] font-bold uppercase text-slate-300 hover:text-amber-500 flex items-center justify-between transition-colors">
                       Full Directory
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
        <SectionHeader id="availability" title="Collection Status" />
        <AnimatePresence>
          {openSections.includes('availability') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden pt-4"
            >
              <div className="flex items-center justify-between p-5 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Stock Only</span>
                <button 
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={cn(
                    "w-12 h-6 rounded-full relative transition-all duration-500",
                    onlyInStock ? "bg-amber-500 shadow-lg shadow-amber-500/30" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md",
                    onlyInStock ? "left-7" : "left-1"
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
          className="w-full bg-amber-500 text-slate-950 py-5 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-amber-500/20 mt-6 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Apply Preferences
        </button>
      )}
    </div>
  );
}
