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
      active ? "text-whatsapp scale-110" : "text-slate-500 hover:text-slate-300"
    )}
  >
    <div className={cn(
      "p-1 rounded-lg transition-transform",
      active && "bg-whatsapp/10"
    )}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
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
    <div className="min-h-screen pb-20 bg-background text-slate-100">
      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-50 p-3 bg-whatsapp text-slate-900 rounded-2xl shadow-[0_10px_30px_rgba(34,197,94,0.4)] hover:scale-110 active:scale-95 transition-all outline-none"
          >
            <ChevronUp className="w-5 h-5" strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between gap-4">
        {/* Scroll Progress Bar */}
        {showScrollProgress && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-whatsapp origin-left z-[60]"
            style={{ scaleX }}
          />
        )}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-whatsapp rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.4)]">
            <span className="text-slate-900 font-black text-lg">LS</span>
          </div>
          <span className="font-black text-xl tracking-tight italic uppercase hidden sm:block">
            locking<span className="text-whatsapp">style</span>
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-whatsapp/50 transition-colors"
          />
        </form>

        {/* Branch Selector & Notification Toggle */}
        <div className="flex items-center gap-2">
          {permission !== 'granted' && (
            <button 
              onClick={requestPermission}
              className="p-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-whatsapp hover:border-whatsapp/30 transition-colors hidden md:flex"
              title="Enable Intelligence Alerts"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-sm hover:border-whatsapp/30 transition-colors">
            <MapPin className="w-4 h-4 text-whatsapp" />
            <span className="hidden md:inline">Main Branch</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 border-t border-white/5 px-2 h-16 flex justify-around items-center max-w-md mx-auto sm:rounded-t-2xl">
        <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Home" active={location.pathname === '/'} />
        <NavItem to="/categories" icon={<Grid className="w-5 h-5" />} label="Shop" active={location.pathname === '/categories'} />
        
        <Link to="/cart" className="relative -mt-8 flex flex-col items-center group">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border-4 border-background shadow-lg transition-all duration-300 relative",
            location.pathname === '/cart' ? "bg-whatsapp text-slate-900 scale-110 shadow-whatsapp/40" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
          )}>
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                {totalItems}
              </span>
            )}
          </div>
          <span className={cn(
            "text-[10px] font-bold mt-1 uppercase transition-all duration-300",
            location.pathname === '/cart' ? "text-whatsapp" : "opacity-0"
          )}>Cart</span>
        </Link>

        <NavItem to="/track-order" icon={<Search className="w-5 h-5" />} label="Track" active={location.pathname === '/track-order'} />
        <NavItem to="/profile" icon={<User className="w-5 h-5" />} label="Profile" active={location.pathname === '/profile'} />
      </nav>
    </div>
  );
}
