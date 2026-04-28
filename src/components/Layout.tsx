import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Search, User, MapPin, Bell, ChevronUp } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useCart } from '../context/CartContext';
import type { ReactNode } from 'react';

// Helper for Nav Items
const NavItem = ({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={cn(
      "flex flex-col items-center gap-1 transition-all duration-300",
      active ? "text-whatsapp scale-105" : "text-slate-500 hover:text-slate-300"
    )}
  >
    <div className={cn(
      "p-1.5 rounded-xl transition-all duration-500",
      active && "bg-whatsapp/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
    )}>
      {icon}
    </div>
    <span className="text-[10px] font-medium uppercase tracking-[0.15em]">{label}</span>
  </Link>
);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { permission, requestPermission } = useNotifications();
  const { totalItems } = useCart();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const showScrollProgress = location.pathname.startsWith('/product/') || location.pathname === '/search';

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background text-slate-100 font-sans">
      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-28 right-6 z-50 p-4 bg-whatsapp text-slate-950 rounded-2xl shadow-2xl shadow-whatsapp/20 hover:scale-110 active:scale-95 transition-all outline-none"
          >
            <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex items-center justify-between gap-6">
        {/* Scroll Progress Bar */}
        {showScrollProgress && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-whatsapp origin-left z-[60]"
            style={{ scaleX }}
          />
        )}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-11 h-11 bg-whatsapp rounded-xl flex items-center justify-center shadow-2xl shadow-whatsapp/20 rotate-3 hover:rotate-0 transition-transform">
            <span className="text-slate-950 font-bold text-xl tracking-tight">LS</span>
          </div>
          <span className="font-bold text-2xl tracking-tight hidden sm:block">
            locking<span className="text-whatsapp">style</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 group-focus-within:text-whatsapp transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search our collection..."
            className="w-full bg-slate-800/30 border border-slate-700/50 rounded-2xl py-2.5 pl-12 pr-6 focus:outline-none focus:border-whatsapp/50 focus:bg-slate-800/60 transition-all text-sm font-medium"
          />
        </form>

        <div className="flex items-center gap-3">
          {permission !== 'granted' && (
            <button 
              onClick={requestPermission}
              className="p-2.5 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:text-whatsapp hover:border-whatsapp/30 transition-all hidden lg:flex"
              title="Enable Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
            </button>
          )}
          <button className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-sm font-semibold hover:border-whatsapp/30 transition-all">
            <MapPin className="w-4 h-4 text-whatsapp" />
            <span className="hidden md:inline">London Central</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/60 backdrop-blur-2xl border border-white/10 px-4 h-20 flex justify-around items-center w-[92%] max-w-md rounded-[2.5rem] shadow-2xl shadow-black/50">
        <NavItem to="/" icon={<Home className="w-6 h-6" />} label="Home" active={location.pathname === '/'} />
        <NavItem to="/categories" icon={<Grid className="w-6 h-6" />} label="Shop" active={location.pathname === '/categories'} />
        
        <Link to="/cart" className="relative -mt-12 flex flex-col items-center group">
          <div className={cn(
            "w-16 h-16 rounded-[2rem] flex items-center justify-center border-4 border-background shadow-2xl transition-all duration-500 relative",
            location.pathname === '/cart' ? "bg-whatsapp text-slate-950 scale-110 shadow-whatsapp/30 rotate-12" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:-translate-y-1"
          )}>
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-slate-950 text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                {totalItems}
              </span>
            )}
          </div>
          <span className={cn(
            "text-[10px] font-bold mt-2 uppercase tracking-widest transition-all duration-300",
            location.pathname === '/cart' ? "text-whatsapp" : "opacity-0"
          )}>Cart</span>
        </Link>

        <NavItem to="/track-order" icon={<Search className="w-6 h-6" />} label="Track" active={location.pathname === '/track-order'} />
        <NavItem to="/profile" icon={<User className="w-6 h-6" />} label="Profile" active={location.pathname === '/profile'} />
      </nav>
    </div>
  );
}
