import { motion } from 'motion/react';
import { ChevronRight, Zap, Keyboard, Headphones, Mouse, Cpu, Lightbulb, Music, Globe, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const CATEGORIES = [
  { name: 'Keyboards', icon: <Keyboard className="w-10 h-10" />, count: 42, color: 'text-blue-400', desc: 'Mechanical interfaces for low-latency input.' },
  { name: 'Headsets', icon: <Headphones className="w-10 h-10" />, count: 28, color: 'text-purple-400', desc: 'Spatial awareness audio gear.' },
  { name: 'Mice', icon: <Mouse className="w-10 h-10" />, count: 35, color: 'text-whatsapp', desc: 'Precision-tuned targeting sensors.' },
  { name: 'Components', icon: <Cpu className="w-10 h-10" />, count: 156, color: 'text-red-400', desc: 'Core hardware for system builds.' },
  { name: 'Lighting', icon: <Lightbulb className="w-10 h-10" />, count: 64, color: 'text-yellow-400', desc: 'Environmental illumination modules.' },
  { name: 'Audio', icon: <Music className="w-10 h-10" />, count: 19, color: 'text-cyan-400', desc: 'High-fidelity acoustic capture.' },
];

export default function Categories() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 px-4 sm:px-0">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20">
            <Globe className="w-6 h-6 text-slate-950 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Curated <span className="text-amber-500">Universe</span></h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Direct Fulfillment of Premium Technology</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
          >
            <Link
              to={`/search?category=${cat.name}`}
              className="group relative block bg-slate-900 shadow-2xl shadow-black/50 border border-white/5 rounded-[3.5rem] overflow-hidden p-10 hover:border-amber-500/30 transition-all duration-700"
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-all duration-1000 scale-150 -rotate-12 group-hover:rotate-0">
                {cat.icon}
              </div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-8">
                  <div className={cn(
                    "w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center border border-white/5 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:rotate-6",
                    cat.color
                  )}>
                    {cat.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold tracking-tight group-hover:text-amber-500 transition-colors">{cat.name}</h2>
                      <div className="w-2 h-2 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100 shadow-lg shadow-amber-500/50" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-[240px] leading-relaxed group-hover:text-slate-400 transition-colors">{cat.desc}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-16">
                  <div className="text-right space-y-1">
                    <div className="text-3xl font-bold text-slate-100 leading-none group-hover:text-amber-500 transition-colors">{cat.count}</div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Available</div>
                  </div>
                  
                  <div className="w-16 h-16 bg-slate-950/50 border border-white/5 rounded-[1.5rem] flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-700 shadow-2xl group-hover:shadow-amber-500/20">
                    <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 h-1 bg-amber-500/20 w-0 group-hover:w-full transition-all duration-1000" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

