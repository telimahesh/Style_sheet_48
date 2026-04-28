import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, Sparkles, MessageSquare, Package, Group, MessageCircle, Copy, Check, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import { HelpingAiService } from '../helping/HelpingAiService';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { cn, formatCurrency } from '@/src/lib/utils';

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
    <div className="min-h-screen space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-whatsapp rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Bot className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Helping <span className="text-whatsapp">Center</span></h1>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AI Powered Retail Operations Assistant</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-2xl">
        {[
          { id: 'support', icon: <MessageSquare className="w-4 h-4" />, label: 'Customer Support' },
          { id: 'auto-messages', icon: <Group className="w-4 h-4" />, label: 'Group Messages' },
          { id: 'product-pitches', icon: <Sparkles className="w-4 h-4" />, label: 'Auto Pitches' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id ? "bg-whatsapp text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <Bot className="w-32 h-32" />
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
                  <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl min-h-[150px] flex flex-col">
                    {response ? (
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-whatsapp">
                          <Bot className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-widest">HelpingAI Response</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">"{response}"</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 opacity-20">
                        <MessageCircle className="w-10 h-10" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Command...</p>
                      </div>
                    )}
                  </div>

                  <div className="relative flex gap-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSupport()}
                      placeholder="Enter customer query..."
                      className="flex-1 bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-xs focus:outline-none focus:border-whatsapp/50 transition-all font-medium"
                    />
                    <button
                      onClick={handleSupport}
                      disabled={loading}
                      className="bg-whatsapp text-slate-950 px-6 py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? <Bot className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "How long does delivery take?",
                    "What is your return policy?",
                    "Do you fix keyboards?",
                    "Where is my order?"
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => { setQuery(prompt); }}
                      className="bg-slate-950/50 border border-white/5 p-3 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest text-left hover:border-whatsapp/30 hover:text-slate-300 transition-all"
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
                className="space-y-6"
              >
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Select Products for Status Update</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
                        className={cn(
                          "p-3 rounded-xl border text-[9px] font-black uppercase tracking-tight text-center transition-all",
                          selectedProductIds.includes(p.id) 
                            ? "bg-whatsapp/10 border-whatsapp text-whatsapp shadow-lg" 
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
                    className="w-full bg-slate-950 border border-whatsapp/30 text-whatsapp py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-whatsapp hover:text-slate-950 transition-all"
                  >
                    {loading ? <Bot className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate Group Notice
                  </button>
                )}

                {activeTab === 'auto-messages' && groupMessage && (
                  <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl space-y-4 relative group">
                    <button 
                      onClick={() => copyToClipboard(groupMessage)}
                      className="absolute top-4 right-4 p-2 bg-slate-900 border border-white/10 rounded-lg text-slate-400 hover:text-whatsapp transition-all"
                    >
                      {copied ? <Check className="w-4 h-4 text-whatsapp" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2 text-whatsapp mb-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-whatsapp">Draft Message</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">"{groupMessage}"</p>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(groupMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#25D366]/20"
                    >
                      <MessageCircle className="w-4 h-4" /> Send to WhatsApp
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
                className="space-y-4"
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
    <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl space-y-4 hover:border-whatsapp/20 transition-all group">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-tight">{product.name}</h4>
        <span className="text-[10px] font-black text-whatsapp italic">{formatCurrency(product.price)}</span>
      </div>
      
      {pitch ? (
        <div className="space-y-4">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">"{pitch}"</p>
          <div className="flex gap-2">
            <button 
              onClick={copyToClipboard}
              className="flex-1 bg-slate-900 border border-white/10 text-slate-500 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-whatsapp hover:border-whatsapp/20 transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Pitch'}
            </button>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(pitch)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 bg-[#25D366] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={generatePitch}
          disabled={loading}
          className="w-full py-3 bg-slate-900 border border-white/10 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:text-whatsapp group-hover:border-whatsapp/20 transition-all"
        >
          {loading ? <Bot className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Pitch
        </button>
      )}
    </div>
  );
}
