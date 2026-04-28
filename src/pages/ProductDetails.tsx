import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { ShoppingCart, MessageCircle, Star, ShieldCheck, Truck, ChevronLeft, ChevronRight, Zap, Maximize2, Send, User, Clock, AlertCircle, Facebook, Mail, Link2, Sparkles, ThumbsUp } from 'lucide-react';
import { formatCurrency, generateWhatsAppLink, cn } from '@/src/lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, serverTimestamp, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../context/CartContext';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Product {
  id: string;
  name: string;
  price: number;
  rating?: number;
  reviews_count?: number;
  description: string;
  image?: string;
  images: string[];
  cat_id: string;
  brand?: string;
  category?: string;
  variations: {
    sizes: string[];
    colors: string[];
  };
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: any;
  user_id: string;
  helpful_count?: number;
  helpful_users?: string[];
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { addItem } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // AI Recommendations State
  const [aiSuggestions, setAiSuggestions] = useState<{name: string, reason: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest' | 'helpfulness'>('recent');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    const unsubscribeReviews = fetchReviews();
    return () => unsubscribeReviews?.();
  }, [id, reviewSort]);

  useEffect(() => {
    if (product) {
      generateAiRecommendations();
    }
  }, [product]);

  const generateAiRecommendations = async () => {
    if (!product) return;
    setIsAiLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am looking at this product: ${product.name} (Category: ${product.category}, Brand: ${product.brand}).
        Suggest 2 other types of high-tech hardware or accessories that would go perfectly with this.
        Give me a very short tactical reason for each.
        Format as JSON with keys "suggestions" which is an array of objects with "name" and "reason".`
      });

      const text = response.text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(text);
      setAiSuggestions(data.suggestions);
    } catch (error) {
      console.error("AI Recommendation Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'products', id!);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const productData = { 
          id: docSnap.id, 
          ...data,
          images: data.images || (data.image ? [data.image] : [])
        } as Product;
        setProduct(productData);
        setSelectedColor(productData.variations?.colors?.[0] || '');
        fetchRelatedProducts(productData);
      } else {
        console.error("No such product!");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `products/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct: Product) => {
    try {
      const q = query(
        collection(db, 'products'),
        where('cat_id', '==', currentProduct.cat_id),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const related = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            images: data.images || (data.image ? [data.image] : [])
          } as Product;
        })
        .filter(p => p.id !== currentProduct.id);
      setRelatedProducts(related);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `products (related)`);
    }
  };

  const fetchReviews = () => {
    if (!id) return;
    
    let q;
    const reviewsRef = collection(db, 'reviews');
    const baseFilter = where('product_id', '==', id);

    switch (reviewSort) {
      case 'highest':
        q = query(reviewsRef, baseFilter, orderBy('rating', 'desc'), orderBy('created_at', 'desc'));
        break;
      case 'lowest':
        q = query(reviewsRef, baseFilter, orderBy('rating', 'asc'), orderBy('created_at', 'desc'));
        break;
      case 'helpfulness':
        q = query(reviewsRef, baseFilter, orderBy('helpful_count', 'desc'), orderBy('created_at', 'desc'));
        break;
      default:
        q = query(reviewsRef, baseFilter, orderBy('created_at', 'desc'));
    }
    
    return onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
      setReviews(reviewsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `reviews (product: ${id})`);
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !id) return;
    
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        product_id: id,
        user_id: currentUser.uid,
        user_name: currentUser.displayName || 'Anonymous Agent',
        rating: reviewRating,
        comment: reviewComment,
        created_at: serverTimestamp(),
        helpful_count: 0,
        helpful_users: []
      });
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleHelpfulClick = async (review: Review) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const reviewRef = doc(db, 'reviews', review.id);
    const isHelpful = review.helpful_users?.includes(currentUser.uid);

    try {
      if (isHelpful) {
        await updateDoc(reviewRef, {
          helpful_users: arrayRemove(currentUser.uid),
          helpful_count: (review.helpful_count || 1) - 1
        });
      } else {
        await updateDoc(reviewRef, {
          helpful_users: arrayUnion(currentUser.uid),
          helpful_count: (review.helpful_count || 0) + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reviews/${review.id}`);
    }
  };

  const handleDragEnd = (_, info) => {
    if (!product) return;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -50 || velocity < -500) {
      if (currentImageIndex < (product.images?.length || 1) - 1) {
        setCurrentImageIndex(prev => prev + 1);
      }
    } else if (offset > 50 || velocity > 500) {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
      }
    }
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const message = `Hello LockingStyle! I want to order:\n\n🔥 Product: ${product.name}\n🎨 Color: ${selectedColor}\n📏 Size: ${selectedSize}\n💰 Price: ${formatCurrency(product.price)}\n\nIs it available?`;
    window.open(generateWhatsAppLink('1234567890', message), '_blank');
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
      image: product.images[0],
      color: selectedColor,
      size: selectedSize
    });
    setAddedToCart(true);
    setShowToast(true);
    setTimeout(() => {
      setAddedToCart(false);
      setShowToast(false);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-14 h-14 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.2)]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Refining Portfolio Details...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in zoom-in-95 duration-1000">
        <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-[3rem] flex items-center justify-center shadow-2xl">
          <AlertCircle className="w-10 h-10 text-red-500/30" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Selection <span className="text-red-500">Unavailable</span></h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">This particular piece is currently removed from our active collections.</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-amber-500/30 pb-1">Return to Collections</button>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm"
          >
            <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex items-center gap-4 backdrop-blur-xl">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-amber-500/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Selection Secured</h4>
                <p className="text-[10px] font-medium text-slate-400 leading-tight line-clamp-1">
                  Synchronized to your portfolio.
                </p>
              </div>
              <div className="bg-amber-500/10 px-3 py-1.5 rounded-xl text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                Executive
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <button onClick={() => navigate(-1)} className="bg-slate-900 p-4 rounded-2xl border border-white/5 shadow-2xl hover:border-amber-500/30 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-slate-500">Collections / <span className="text-slate-300">Curated</span></span>
        </div>
        <Link to="/cart" className="bg-slate-900 p-4 rounded-2xl border border-white/5 shadow-2xl text-amber-500 hover:border-amber-500/30 transition-all">
          <ShoppingCart className="w-5 h-5" />
        </Link>
      </div>

      {/* Image Gallery */}
      <div className="space-y-6">
        <div className="relative bg-slate-900 shadow-2xl border border-white/5 rounded-[3.5rem] aspect-square overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent opacity-50 z-0" />
          
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="w-full h-full flex cursor-grab active:cursor-grabbing items-center justify-center p-12 z-10 relative"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(245,158,11,0.2)] select-none"
              />
            </AnimatePresence>
          </motion.div>

          <div className="absolute top-8 right-8 bg-amber-500 text-slate-950 text-[9px] font-bold px-4 py-2 rounded-xl shadow-2xl uppercase tracking-[0.2em] z-20">Premium Availability</div>
          
          {/* Navigation Arrows (Desktop) */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex z-20">
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
              className="p-4 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/5 text-slate-200 pointer-events-auto disabled:opacity-30 transition-all hover:bg-amber-500 hover:text-slate-950"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.min(product.images.length - 1, prev + 1))}
              disabled={currentImageIndex === product.images.length - 1}
              className="p-4 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/5 text-slate-200 pointer-events-auto disabled:opacity-30 transition-all hover:bg-amber-500 hover:text-slate-950"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Indicator Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {product.images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-700",
                  currentImageIndex === i ? "w-10 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "w-3 bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={cn(
                "flex-shrink-0 w-24 h-24 rounded-[2rem] border transition-all duration-700 overflow-hidden bg-slate-950/50 shadow-xl",
                currentImageIndex === i ? "border-amber-500 scale-110 shadow-amber-500/10" : "border-white/5 opacity-40 hover:opacity-100 hover:scale-105"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Info Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-10 bg-slate-900/40 p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-1000 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-1000 rotate-12 group-hover:rotate-0">
            <Zap className="w-48 h-48 text-amber-500" />
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 shadow-lg shadow-amber-500/50" />
                  <span className="text-xs font-bold text-slate-100">{product.rating || '4.9'}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{product.reviews_count || 124} PATRONS VERIFIED</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">{product.name}</h1>
              <div className="text-5xl font-bold text-amber-500 tracking-tighter">{formatCurrency(product.price)}</div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-0.5 bg-amber-500/30" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">Executive Brief</span>
              </div>
              <p className="text-base text-slate-400 leading-relaxed font-medium">"{product.description}"</p>
            </div>
          </div>
        </div>

        {/* Action / Buy Card */}
        <div className="md:col-span-1 bg-slate-900/60 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/10 flex flex-col justify-between gap-10 h-full shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="space-y-8">
            {product.variations?.colors?.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Refined Colorway</span>
                <div className="flex flex-wrap gap-3">
                  {product.variations.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-10 h-10 rounded-[1.25rem] border-2 transition-all p-1 shadow-lg",
                        selectedColor === color ? "border-amber-500 scale-115 shadow-amber-500/20" : "border-white/5"
                      )}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    >
                       {selectedColor === color && <div className="w-full h-full rounded-full border border-white/20" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variations?.sizes?.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Dimensions</span>
                <div className="flex flex-wrap gap-3">
                  {product.variations.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "flex-1 min-w-[60px] h-14 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center shadow-xl",
                        selectedSize === size ? "bg-amber-500 text-slate-950 border-amber-500 shadow-amber-500/20" : "bg-slate-950/50 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">
               <span>Availability</span>
               <span className="text-amber-500">Exclusive Priority</span>
             </div>
             <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden shadow-inner">
               <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
             </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <AnimatePresence>
        {(isAiLoading || aiSuggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/10 p-10 rounded-[3.5rem] space-y-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><Zap className="w-24 h-24 text-amber-500" /></div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <Sparkles className="w-7 h-7 text-slate-950" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Executive Pairing Insight</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">AI Curated Synergy Recommendation</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {isAiLoading ? (
                <div className="col-span-2 flex items-center gap-4 py-6">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Curating the perfect matches...</span>
                </div>
              ) : (
                aiSuggestions.map((s, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-6 rounded-[2rem] border border-white/5 space-y-3 group hover:border-amber-500/30 transition-all duration-700 shadow-xl">
                    <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-amber-500 transition-colors">{s.name}</h4>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">"{s.reason}"</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logistics & Features */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Truck className="w-5 h-5 text-amber-500" />, label: 'Prime Delivery', val: 'Global Priority' },
          { icon: <ShieldCheck className="w-5 h-5 text-amber-500" />, label: 'Guaranteed', val: '24M Full Coverage' },
          { icon: <Clock className="w-5 h-5 text-amber-500" />, label: 'Live Assistance', val: '24/7 Priority Support' },
          { icon: <Zap className="w-5 h-5 text-amber-500" />, label: 'Peak Performance', val: 'Quality Assured' }
        ].map((feat, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4 group hover:border-amber-500/30 transition-all duration-700 shadow-2xl">
            <div className="w-12 h-12 bg-slate-950/50 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-700 shadow-inner">
              {feat.icon}
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-200 uppercase tracking-tight leading-none">{feat.label}</span>
              <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-widest">{feat.val}</span>
            </div>
          </div>
        ))}
      </div>

        {/* Social Share */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Share Selection</span>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} - Explore this collection at LockingStyle: ${window.location.href}`)}`, '_blank')}
              className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition-all duration-500 shadow-xl group"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-none group-hover:fill-slate-950 transition-colors" />
            </button>
            <button 
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-xl group"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5 fill-none group-hover:fill-blue-500 transition-colors" />
            </button>
            <button 
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`${product.name} - Available at LockingStyle`)}`, '_blank')}
              className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all shadow-xl group"
              title="Share on Telegram"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(`LockingStyle Collection: ${product.name}`)}&body=${encodeURIComponent(`A new addition to the LockingStyle collection:\n\n${product.name}\n\nValue: ${formatCurrency(product.price)}\n\nLink: ${window.location.href}`)}`}
              className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl group"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-amber-500 transition-all shadow-xl group"
              title="Copy link"
            >
              <Link2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02]"><Zap className="w-16 h-16" /></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Technical Specification</span>
          <p className="text-base text-slate-400 leading-relaxed font-medium">{product.description}</p>
        </div>

        {/* User Reviews Section */}
        <div className="space-y-8 pt-12 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h2 className="text-2xl font-bold tracking-tight">Patron <span className="text-amber-500">Feedback</span></h2>
            <div className="flex items-center gap-4">
              <select 
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="bg-slate-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 rounded-2xl outline-none focus:border-amber-500/50 transition-all cursor-pointer shadow-xl"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Excellence Tier</option>
                <option value="lowest">Critical Insights</option>
                <option value="helpfulness">Top Recommended</option>
              </select>
              <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl shadow-xl">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{reviews.length} Verified Reviews</span>
              </div>
            </div>
          </div>

          {/* Review Form */}
          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quality Assessment</span>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-125 transition-transform duration-500"
                    >
                      <Star className={cn("w-7 h-7 transition-all duration-500", reviewRating >= s ? "text-amber-500 fill-amber-500 shadow-amber-500/50" : "text-slate-800")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Review Details</span>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Describe your experience with this selection..."
                  className="w-full bg-slate-950/50 border border-white/5 rounded-[1.5rem] p-6 text-sm focus:border-amber-500/50 outline-none transition-all h-32 font-medium shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-amber-500 text-slate-950 py-5 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-amber-500/20 disabled:opacity-50"
              >
                {submittingReview ? (
                  <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>Submit Review <Send className="w-3 h-3" /></>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-slate-900/20 p-12 rounded-[3.5rem] border border-dashed border-white/5 text-center space-y-6 shadow-inner">
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                <User className="w-10 h-10 text-slate-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold uppercase text-white tracking-tight">Authentication Required</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Sign in to provide your feedback on this collection.</p>
              </div>
              <Link to="/login" className="inline-block bg-amber-500 text-slate-950 px-10 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-amber-500/20">
                Login
              </Link>
            </div>
          )}

          <div className="space-y-6">
            {reviews.map((review) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={review.id}
                className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 space-y-6 group hover:border-amber-500/20 transition-all duration-700 shadow-2xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <User className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-tight text-white">{review.user_name}</h4>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-2.5 h-2.5 transition-all duration-700", review.rating >= s ? "text-amber-500 fill-amber-500" : "text-slate-800")} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleHelpfulClick(review)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all duration-700",
                      review.helpful_users?.includes(currentUser?.uid)
                        ? "bg-amber-500/20 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/20"
                        : "bg-slate-950 border-white/5 text-slate-500 hover:text-amber-500 hover:border-amber-500/30 shadow-xl"
                    )}
                  >
                    <ThumbsUp className={cn("w-3.5 h-3.5", !review.helpful_users?.includes(currentUser?.uid) && "group-hover:scale-125")} />
                    {review.helpful_count || 0}
                  </button>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">"{review.comment}"</p>
                  <div className="flex items-center gap-2 text-slate-600 border-t border-white/5 pt-4">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Published: {review.created_at?.toDate ? new Date(review.created_at.toDate()).toLocaleDateString() : 'Just now'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="space-y-8 pt-16">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Complete <span className="text-amber-500">The Collection</span></h2>
              <Link to="/search" className="text-amber-500/50 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-amber-500 transition-colors">View Portfolio</Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-8 px-2 scrollbar-hide">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="flex-shrink-0 w-56 bg-slate-900/40 p-6 rounded-[2.5rem] border border-white/5 group hover:border-amber-500/30 transition-all duration-1000 space-y-4 shadow-2xl"
                >
                  <div className="aspect-square bg-slate-950 rounded-[2rem] overflow-hidden flex items-center justify-center p-6 shadow-inner relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <img
                      src={p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-contain filter brightness-75 group-hover:brightness-100 group-hover:scale-110 transition-all duration-1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-tight text-slate-200 line-clamp-1 group-hover:text-amber-500 transition-colors">{p.name}</h3>
                    <span className="text-sm font-bold text-amber-500 tracking-tighter">{formatCurrency(p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="fixed bottom-8 left-8 right-8 z-40 max-w-lg mx-auto space-y-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className={cn(
              "w-full py-5 rounded-[2rem] font-bold uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-700 shadow-2xl",
              addedToCart 
                ? "bg-amber-500 text-slate-950 shadow-amber-500/30" 
                : "bg-slate-900 border border-white/10 text-white hover:bg-slate-800 hover:border-amber-500/30"
            )}
          >
            {addedToCart ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                Successfully Added <Zap className="w-4 h-4 fill-slate-950" />
              </motion.div>
            ) : (
              <>Secure Item to Cart <ShoppingCart className="w-5 h-5" /></>
            )}
          </motion.button>
          
          <div className="flex gap-4">
            <Link 
              to="/cart"
              className="flex-[0.3] bg-slate-950/80 backdrop-blur-xl border border-white/5 text-slate-400 py-6 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest flex items-center justify-center hover:text-amber-500 hover:border-amber-500/20 transition-all shadow-2xl relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {addedToCart && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-slate-950 font-bold shadow-lg"
                >
                  !
                </motion.div>
              )}
            </Link>
            <button
              onClick={handleWhatsAppOrder}
              className="flex-1 bg-slate-900 border border-white/10 text-white rounded-[2rem] py-6 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 hover:border-amber-500/30 shadow-2xl transition-all"
            >
              Inquire via WhatsApp <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
  );
}
