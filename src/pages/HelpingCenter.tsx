import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, Sparkles, MessageSquare, Package, Group, MessageCircle, Copy, Check, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import { HelpingAiService } from '../helping/HelpingAiService';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';

export default function HelpingCenter() {
  const [activeTab, setActiveTab] = useState<'support' | 'auto-messages' | 'product-pitches'>('support');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  
  // For Auto Messages
  const [groupMessage, setGroupMessage] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), limit(10));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
    };
    fetchProducts();
  }, []);

  const handleSupport = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const res = await HelpingAiService.answerCustomerQuery(query);
    setResponse(res);
    setLoading(false);
  };

  const handleGenerateGroupMessage = async () => {
    const selected = products.filter(p => selectedProductIds.includes(p.id));
    if (selected.length === 0) return;
    setLoading(true);
    const msg = await HelpingAiService.generateGroupMessage(selected);
    setGroupMessage(msg);
    setLoading(false);
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-whatsapp rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Bot className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-100">Helping <span className="text-whatsapp">Center</span></h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Advanced AI Operational Support</p>
          </div>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-2xl">
        {[
          { id: 'support', icon: <MessageSquare className="w-4 h-4" />, label: 'Customer Service' },
          { id: 'auto-messages', icon: <Group className="w-4 h-4" />, label: 'Group Automation' },
          { id: 'product-pitches', icon: <Zap className="w-4 h-4" />, label: 'Asset Pitching' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id ? "bg-whatsapp text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-white/5 p-8 rounded-[3rem] shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <Sparkles className="w-64 h-64" />
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl min-h-[200px] flex flex-col">
                    {response ? (
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2 text-whatsapp">
                          <Bot className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest italic">AI Agent Response</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed italic">"{response}"</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                        <MessageCircle className="w-12 h-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command Input...</p>
                      </div>
                    )}
                  </div>

                  <div className="relative flex gap-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSupport()}
                      placeholder="Transmission: Ask any question about store operations..."
                      className="flex-1 bg-slate-950 border border-white/5 rounded-2xl py-5 px-8 text-sm focus:outline-none focus:border-whatsapp/50 transition-all font-medium italic"
                    />
                    <button
                      onClick={handleSupport}
                      disabled={loading}
                      className="bg-whatsapp text-slate-950 p-5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <Zap className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "What are your delivery protocols?",
                    "How do I return a technical asset?",
                    "Do you have neon peripherals in stock?",
                    "How to verify tactical hardware?"
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => { setQuery(prompt); }}
                      className="bg-slate-950/50 border border-white/5 p-4 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left hover:border-whatsapp/30 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'auto-messages' && (
              <motion.div
                key="auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-2">Select Assets for Group Broadcast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
                        className={cn(
                          "p-3 rounded-xl border text-[9px] font-black uppercase tracking-tight text-center transition-all",
                          selectedProductIds.includes(p.id) 
                            ? "bg-whatsapp/20 border-whatsapp text-whatsapp shadow-lg" 
                            : "bg-slate-950 border-white/5 text-slate-500 hover:border-whatsapp/30"
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleGenerateGroupMessage}
                    disabled={loading}
                    className="w-full bg-slate-950 border border-whatsapp/30 text-whatsapp py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-whatsapp hover:text-slate-950 transition-all shadow-xl"
                  >
                    {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Group Deployment Message
                  </button>
                )}

                {groupMessage && (
                  <div className="bg-slate-950 border border-white/5 p-8 rounded-2xl space-y-4 relative group">
                    <button 
                      onClick={() => copyToClipboard(groupMessage)}
                      className="absolute top-4 right-4 p-2 bg-slate-900 border border-white/10 rounded-lg text-slate-400 hover:text-whatsapp transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-whatsapp" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2 text-whatsapp mb-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Broadcast Signal</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">{groupMessage}</p>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(groupMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all mt-4"
                    >
                      <MessageCircle className="w-4 h-4" /> Deploy to WhatsApp
                    </a>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'product-pitches' && (
              <motion.div
                key="pitches"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.slice(0, 6).map(p => (
                    <PitchCard key={p.id} product={p} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-whatsapp/[0.03] border border-whatsapp/20 p-6 rounded-2xl">
        <AlertCircle className="w-6 h-6 text-whatsapp animate-pulse" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Operational Security Warning: AI signals are generated targets. Verify tactical accuracy before public broadcast deployment.
        </p>
      </div>
    </div>
  );
}

function PitchCard({ product }: { product: any; key?: string | number }) {
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePitch = async () => {
    setLoading(true);
    const msg = await HelpingAiService.generateAutoMessage(product);
    setPitch(msg);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl space-y-4 hover:border-whatsapp/30 transition-all group">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-tight">{product.name}</h4>
        <span className="text-[9px] font-black text-whatsapp italic">${product.price}</span>
      </div>
      
      {pitch ? (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-400 italic leading-relaxed">"{pitch}"</p>
          <div className="flex gap-2">
            <button 
              onClick={copyToClipboard}
              className="flex-1 bg-slate-900 border border-white/10 text-slate-400 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-whatsapp transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Captured' : 'Copy'}
            </button>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(pitch)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={generatePitch}
          disabled={loading}
          className="w-full py-3 bg-slate-900 border border-white/10 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:text-whatsapp group-hover:border-whatsapp/30 transition-all"
        >
          {loading ? <Zap className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generate Intelligence
        </button>
      )}
    </div>
  );
}
