import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { ShoppingCart, MessageCircle, Star, ShieldCheck, Truck, ChevronLeft, ChevronRight, Zap, Maximize2, Send, User, Clock, AlertCircle, Facebook, Mail, Link2, Sparkles, ThumbsUp } from 'lucide-react';
import { formatCurrency, generateWhatsAppLink, cn } from '@/src/lib/utils';
import { db, auth } from '../lib/firebase';
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
      console.error("Error fetching product:", error);
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
      console.error("Error fetching related products:", error);
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
      console.error("Error submitting review:", error);
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
      console.error("Error updating helpfulness:", error);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-whatsapp/20 border-t-whatsapp rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Decrypting Hardware Data...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500/50" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Node <span className="text-red-500">Not Found</span></h2>
        <button onClick={() => navigate(-1)} className="text-whatsapp text-[10px] font-black uppercase tracking-widest border-b border-whatsapp">Return to Sector</button>
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
            <div className="bg-slate-900 border border-whatsapp/50 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4">
              <div className="w-10 h-10 bg-whatsapp/20 rounded-xl flex items-center justify-center text-whatsapp shadow-inner border border-whatsapp/30">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-whatsapp">Intel Secured</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1">
                  {product.name} synchronized to cart.
                </p>
              </div>
              <div className="bg-whatsapp/10 px-2 py-1 rounded text-[8px] font-black text-whatsapp uppercase tracking-widest">
                Deploying
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-black text-sm tracking-widest uppercase italic text-slate-500">Hardware / <span className="text-slate-200">Details</span></span>
        <button className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shadow-xl text-whatsapp">
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>

      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-[2.5rem] aspect-square overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-whatsapp/10 via-transparent to-transparent opacity-50 z-0" />
          
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            className="w-full h-full flex cursor-grab active:cursor-grabbing items-center justify-center p-6 z-10 relative"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(34,197,94,0.3)] select-none"
              />
            </AnimatePresence>
          </motion.div>

          <div className="absolute top-6 right-6 bg-whatsapp text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest italic z-20">In Stock</div>
          
          {/* Navigation Arrows (Desktop) */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex z-20">
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
              className="p-3 bg-slate-900/80 rounded-xl border border-white/5 text-slate-200 pointer-events-auto disabled:opacity-30 transition-all hover:bg-whatsapp hover:text-slate-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prev => Math.min(product.images.length - 1, prev + 1))}
              disabled={currentImageIndex === product.images.length - 1}
              className="p-3 bg-slate-900/80 rounded-xl border border-white/5 text-slate-200 pointer-events-auto disabled:opacity-30 transition-all hover:bg-whatsapp hover:text-slate-900"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {product.images.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentImageIndex === i ? "w-6 bg-whatsapp" : "bg-slate-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {product.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-2xl border transition-all overflow-hidden",
                currentImageIndex === i ? "border-whatsapp ring-2 ring-whatsapp/20" : "border-slate-800 opacity-50 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-8 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-whatsapp/30 transition-all shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Zap className="w-32 h-32 text-whatsapp" />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{product.reviews_count || 0} VERIFIED DEPLOYMENTS</span>
              </div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-100 leading-none">{product.name}</h1>
              <div className="text-4xl font-black text-whatsapp italic tracking-tighter">{formatCurrency(product.price)}</div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 underline decoration-whatsapp/30 underline-offset-4">Sector Brief</span>
              <p className="text-sm text-slate-400 leading-relaxed font-medium italic">"{product.description}"</p>
            </div>
          </div>
        </div>

        {/* Action / Buy Card */}
        <div className="md:col-span-1 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between gap-8 h-full shadow-2xl">
          <div className="space-y-6">
            {product.variations?.colors?.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Color</span>
                <div className="flex flex-wrap gap-2">
                  {product.variations.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all p-0.5",
                        selectedColor === color ? "border-whatsapp scale-125 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "border-slate-800"
                      )}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.variations?.sizes?.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Scale</span>
                <div className="flex gap-2">
                  {product.variations.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-12 h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center",
                        selectedSize === size ? "bg-whatsapp text-slate-900 border-whatsapp" : "bg-slate-950 border-slate-800 text-slate-500"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-6 border-t border-white/5">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
               <span>Availability</span>
               <span className="text-whatsapp">Optimal</span>
             </div>
             <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-whatsapp" />
             </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <AnimatePresence>
        {(isAiLoading || aiSuggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-whatsapp/5 border border-whatsapp/20 p-8 rounded-[3rem] space-y-6 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-16 h-16 text-whatsapp" /></div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-whatsapp rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(34,197,94,0.4)]">
                <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-whatsapp">Tactical AI Pairing</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Synergy Optimization Algorithm</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {isAiLoading ? (
                <div className="col-span-2 flex items-center gap-3 py-4">
                  <div className="w-1.5 h-1.5 bg-whatsapp rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase text-slate-500 italic">Calculating tactical advantage...</span>
                </div>
              ) : (
                aiSuggestions.map((s, idx) => (
                  <div key={idx} className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 space-y-2 group hover:border-whatsapp/30 transition-all">
                    <h4 className="text-xs font-black uppercase text-slate-200 group-hover:text-whatsapp transition-colors">{s.name}</h4>
                    <p className="text-[10px] font-medium text-slate-500 italic leading-relaxed">"{s.reason}"</p>
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
          { icon: <Truck className="w-5 h-5" />, label: 'Standard Dispatch', val: 'Global Ops' },
          { icon: <ShieldCheck className="w-5 h-5" />, label: 'Secured Data', val: '24M Warrant' },
          { icon: <Clock className="w-5 h-5" />, label: 'Instant Connect', val: '24/7 Intel' },
          { icon: <Zap className="w-5 h-5" />, label: 'Turbo Grade', val: 'Elite Performance' }
        ].map((feat, idx) => (
          <div key={idx} className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 group hover:border-whatsapp/30 transition-all shadow-xl">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-whatsapp group-hover:text-slate-900 transition-all shadow-inner">
              {feat.icon}
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-black text-slate-200 uppercase tracking-tighter leading-none">{feat.label}</span>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">{feat.val}</span>
            </div>
          </div>
        ))}
      </div>

        {/* Social Share */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 underline decoration-whatsapp/30 underline-offset-4">Distribute Intel</span>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${product.name} - Check out this hardware at LockingStyle: ${window.location.href}`)}`, '_blank')}
              className="p-3 bg-whatsapp/10 border border-whatsapp/20 rounded-xl text-whatsapp hover:bg-whatsapp hover:text-slate-900 transition-all shadow-lg shadow-whatsapp/5 group"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-none group-hover:fill-slate-900 transition-colors" />
            </button>
            <button 
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg group"
              title="Share on Facebook"
            >
              <Facebook className="w-5 h-5 fill-none group-hover:fill-white transition-colors" />
            </button>
            <button 
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`${product.name} - Available at LockingStyle`)}`, '_blank')}
              className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500 hover:bg-sky-500 hover:text-white transition-all shadow-lg group"
              title="Share on Telegram"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent(`LockingStyle Intel Report: ${product.name}`)}&body=${encodeURIComponent(`New hardware detected at LockingStyle:\n\n${product.name}\n\nPrice: ${formatCurrency(product.price)}\n\nLink: ${window.location.href}`)}`}
              className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-all shadow-lg group"
              title="Share via Email"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Could add a toast here
              }}
              className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-700 transition-all shadow-lg group"
              title="Copy link to clipboard"
            >
              <Link2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden">

          <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="w-12 h-12" /></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tech Specs & Brief</span>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">{product.description}</p>
        </div>

        {/* User Reviews Section */}
        <div className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Agent <span className="text-whatsapp">Feedback</span></h2>
            <div className="flex items-center gap-3">
              <select 
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-300 px-4 py-2 rounded-xl outline-none focus:border-whatsapp/50 transition-all cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Caliber</option>
                <option value="lowest">Critical Alerts</option>
                <option value="helpfulness">Top Intel (Helpful)</option>
              </select>
              <div className="px-3 py-2 bg-whatsapp/10 border border-whatsapp/20 rounded-xl">
                <span className="text-[10px] font-black text-whatsapp uppercase tracking-widest">{reviews.length} Intel Reports</span>
              </div>
            </div>
          </div>

          {/* Review Form */}
          {currentUser ? (
            <form onSubmit={handleReviewSubmit} className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assign Rating</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={cn("w-6 h-6 transition-colors", reviewRating >= s ? "text-yellow-500 fill-yellow-500" : "text-slate-700")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observation Data</span>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this hardware..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:border-whatsapp/50 outline-none transition-all h-24 font-medium"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-whatsapp text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-whatsapp/90 transition-all disabled:opacity-50"
              >
                {submittingReview ? (
                  <div className="w-4 h-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>Submit Intelligence <Send className="w-3 h-3" /></>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-slate-900/40 p-12 rounded-[2rem] border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-slate-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-slate-100">Authentication Required</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sign in to contribute to the mission logs.</p>
              </div>
              <Link to="/login" className="inline-block bg-whatsapp/10 border border-whatsapp/20 text-whatsapp px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-whatsapp hover:text-slate-900 transition-all">
                Login
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={review.id}
                className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 space-y-4 group hover:border-whatsapp/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-100">{review.user_name}</h4>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-2 h-2", review.rating >= s ? "text-whatsapp fill-whatsapp" : "text-slate-800")} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleHelpfulClick(review)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all",
                      review.helpful_users?.includes(currentUser?.uid)
                        ? "bg-whatsapp/20 border-whatsapp/50 text-whatsapp shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                        : "bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300 hover:border-whatsapp/30"
                    )}
                  >
                    <ThumbsUp className={cn("w-3 h-3 transition-transform", !review.helpful_users?.includes(currentUser?.uid) && "group-hover:scale-110")} />
                    {review.helpful_count || 0}
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">"{review.comment}"</p>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Report Filed: {review.created_at?.toDate ? new Date(review.created_at.toDate()).toLocaleDateString() : 'Active'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Sync <span className="text-whatsapp">Related</span> Intel</h2>
              <Link to="/search" className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-whatsapp transition-colors">View All</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {relatedProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/product/${p.id}`}
                  className="flex-shrink-0 w-44 bg-slate-900/60 p-4 rounded-[2rem] border border-white/5 group hover:border-whatsapp/30 transition-all space-y-3"
                >
                  <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-contain grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-tighter text-slate-200 line-clamp-1">{p.name}</h3>
                    <span className="text-xs font-black text-whatsapp italic">{formatCurrency(p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="fixed bottom-6 left-6 right-6 z-40 max-w-md mx-auto space-y-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className={cn(
              "w-full py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl",
              addedToCart 
                ? "bg-whatsapp text-slate-900" 
                : "bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700"
            )}
          >
            {addedToCart ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2"
              >
                Intelligence Added <Zap className="w-3 h-3 fill-slate-900" />
              </motion.div>
            ) : (
              <>Quick Add to Cart <ShoppingCart className="w-4 h-4" /></>
            )}
          </motion.button>
          
          <div className="flex gap-3">
            <Link 
              to="/cart"
              className="flex-[0.3] bg-slate-900/80 border border-white/5 text-slate-400 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:bg-slate-800 transition-all shadow-2xl relative"
            >
              <ShoppingCart className="w-4 h-4" />
              {addedToCart && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-whatsapp rounded-full flex items-center justify-center text-[8px] text-slate-900 font-bold"
                >
                  !
                </motion.div>
              )}
            </Link>
            <button
              onClick={handleWhatsAppOrder}
              className="flex-1 bg-whatsapp text-slate-900 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_rgba(34,197,94,0.4)]"
            >
              <MessageCircle className="w-5 h-5 fill-slate-900" /> WhatsApp Deploy
            </button>
          </div>
        </div>
      </div>
  );
}
