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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 px-2">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-whatsapp animate-spin-slow" />
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sector <span className="text-whatsapp">Index</span></h1>
        </div>
        <p className="text-slate-400 text-sm font-medium pl-8">Global hardware inventory deployment mapping.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 sm:p-0">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/search?category=${cat.name}`}
              className="group relative block bg-slate-900 border border-white/5 rounded-[3rem] overflow-hidden p-8 hover:border-whatsapp/30 transition-all shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                {cat.icon}
              </div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-4">
                  <div className={cn(
                    "w-16 h-16 bg-slate-950 rounded-[1.5rem] flex items-center justify-center border border-white/5 shadow-inner transition-all group-hover:scale-110 group-hover:bg-whatsapp group-hover:text-slate-950",
                    cat.color
                  )}>
                    {cat.icon}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none group-hover:text-whatsapp transition-colors">{cat.name}</h2>
                      <Crosshair className="w-4 h-4 text-whatsapp opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium max-w-[200px] leading-relaxed italic">{cat.desc}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-10">
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-100 italic leading-none">{cat.count}</div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Units Online</div>
                  </div>
                  
                  <div className="w-14 h-14 bg-slate-950 border border-white/5 rounded-2xl flex items-center justify-center group-hover:bg-whatsapp group-hover:text-slate-950 group-hover:rotate-45 transition-all duration-500 shadow-xl">
                    <ChevronRight className="w-8 h-8 group-hover:-rotate-45 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

