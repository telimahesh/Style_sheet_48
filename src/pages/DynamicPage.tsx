import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Zap, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PageBlock {
  id: string;
  type: 'hero' | 'text' | 'image' | 'features';
  content: any;
}

interface Page {
  title: string;
  blocks: PageBlock[];
}

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const q = query(
          collection(db, 'pages'), 
          where('slug', '==', slug), 
          where('status', '==', 'published'),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError(true);
        } else {
          const doc = snapshot.docs[0].data();
          setPage({
            title: doc.title,
            blocks: JSON.parse(doc.content)
          });
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-whatsapp/20 border-t-whatsapp rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !page) {
    return <Navigate to="/" />;
  }

  return (
    <div className="animate-in fade-in duration-700">
      {page.blocks.map((block, i) => (
        <motion.section 
          key={block.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="py-12 px-6 overflow-hidden relative"
        >
          {block.type === 'hero' && (
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-whatsapp/10 border border-whatsapp/20 px-4 py-2 rounded-full mb-4">
                <Zap className="w-4 h-4 text-whatsapp animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-whatsapp">New Release Protocol</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none">
                {block.content.title}
              </h1>
              <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
                {block.content.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button className="bg-whatsapp text-slate-900 px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform">
                  Access Reserves <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {block.type === 'text' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-20 h-20" /></div>
                <div className="text-slate-300 font-medium leading-relaxed prose prose-invert">
                  {block.content.body}
                </div>
              </div>
            </div>
          )}

          {block.type === 'image' && (
            <div className="max-w-5xl mx-auto group">
              <div className="relative rounded-[3rem] overflow-hidden border border-slate-700/50 shadow-2xl">
                <img 
                  src={block.content.url} 
                  className="w-full h-[400px] object-cover mix-blend-luminosity group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-1000" 
                  alt="Page Content"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-10 left-10">
                  <div className="bg-whatsapp/90 text-slate-900 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Visual Archive
                  </div>
                </div>
              </div>
            </div>
          )}

          {block.type === 'features' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
              {block.content.items.map((item: string, idx: number) => (
                <div key={idx} className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-3xl flex items-center gap-4 group hover:border-whatsapp/30 transition-all">
                  <div className="w-12 h-12 bg-slate-900/60 rounded-xl flex items-center justify-center text-whatsapp border border-white/5 group-hover:scale-110 transition-transform">
                    <CheckCircle2Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Module {idx + 1}</span>
                    <span className="text-slate-200 font-black italic uppercase tracking-tight">{item}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      ))}
    </div>
  );
}

function CheckCircle2Icon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
