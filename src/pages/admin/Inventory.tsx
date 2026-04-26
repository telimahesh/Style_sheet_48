import React, { useState } from 'react';
import { Package, Search, AlertTriangle, ArrowRightLeft, Plus, Edit, MoreVertical, Filter, Terminal, Zap, X, Send } from 'lucide-react';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BRANCHES = [
  { id: '1', name: 'Main Outlet' },
  { id: '2', name: 'North Branch' },
  { id: '3', name: 'DHA Store' }
];

const INVENTORY = [
  { id: '1', name: 'Ultra-X Mechanical Keyboard', global_stock: 124, branch_stock: 45, threshold: 20, price: 129.99, description: 'High-performance mechanical keyboard with RGB.' },
  { id: '2', name: 'Pro-G Gaming Mouse', global_stock: 240, branch_stock: 12, threshold: 15, price: 59.99, description: 'Precision gaming mouse with adjustable DPI.' },
  { id: '3', name: 'Surround Sound Headset v2', global_stock: 85, branch_stock: 32, threshold: 10, price: 89.99, description: 'True surround sound experience for competitive play.' },
  { id: '4', name: 'Custom RBG Light Strip (5m)', global_stock: 450, branch_stock: 140, threshold: 50, price: 24.99, description: 'Immersive lighting setup for any desk setup.' },
  { id: '5', name: 'Monitor Arm - Single', global_stock: 30, branch_stock: 4, threshold: 5, price: 45.00, description: 'Ergonomic monitor mounting solution.' },
];

export default function Inventory() {
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const generateAiDescription = async () => {
    if (!editingItem) return;
    setIsAiGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short, tactical, high-tech product description for an e-commerce site specializing in gaming gear. 
        Product Name: ${editingItem.name}
        Current Description: ${editingItem.description}
        Keep it under 3 sentences and use a "LockingStyle" brand voice (cyberpunk, professional, tactical).`
      });
      
      const newDesc = response.text;
      if (newDesc) {
        setEditingItem({ ...editingItem, description: newDesc.trim() });
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight italic">Inventory <span className="text-whatsapp">Protocol</span></h1>
          <p className="text-slate-500 text-sm font-medium">Multi-branch stock sync and threshold monitoring</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-whatsapp text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
          <button className="glass px-4 py-2.5 rounded-xl text-slate-200 font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Stock Transfer
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 glass rounded-3xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-whatsapp" />
          <input
            type="text"
            placeholder="Search by SKU, Name or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-whatsapp/50 text-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-whatsapp/50"
          >
            {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button className="glass p-3 rounded-2xl hover:text-whatsapp transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-whatsapp/10 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6 text-whatsapp" />
          </div>
          <div>
            <div className="text-2xl font-black">1,420</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total SKU Units</span>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl flex items-center gap-4 border-red-500/10">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-red-500">12</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Stock Alerts</span>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
            <Terminal className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-black">{formatCurrency(45200)}</div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory Value</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Asset Name</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Global Stock</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Branch Stock</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-widest">Threshold</th>
                <th className="px-6 py-4 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {INVENTORY.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                const isLow = item.branch_stock <= item.threshold;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-800/20 transition-colors group ${isLow ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">SKU-LS-{item.id}00X</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="bg-slate-800/50 w-16 text-center py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-700">
                        {item.global_stock}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`w-16 text-center py-1 rounded-full text-xs font-black border transition-colors ${
                        isLow ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-whatsapp/10 text-whatsapp border-whatsapp/20'
                      }`}>
                        {item.branch_stock}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                        {item.threshold} <span className="text-[9px] uppercase tracking-tighter opacity-50">Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingItem(item)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-whatsapp transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Edit <span className="text-whatsapp">Asset</span></h2>
                    <button 
                      onClick={() => setEditingItem(null)}
                      className="p-2 bg-slate-800 rounded-xl hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Designation</label>
                      <input 
                        type="text" 
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm outline-none focus:border-whatsapp/50 transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mission Brief (Description)</label>
                        <button 
                          onClick={generateAiDescription}
                          disabled={isAiGenerating}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tight text-whatsapp hover:text-whatsapp/80 disabled:opacity-50 transition-all"
                        >
                          {isAiGenerating ? (
                            <div className="w-3 h-3 border-2 border-whatsapp/20 border-t-whatsapp rounded-full animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 fill-whatsapp" />
                          )}
                          Combat-Enhance with AI
                        </button>
                      </div>
                      <textarea 
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm outline-none focus:border-whatsapp/50 transition-all min-h-[120px] font-medium leading-relaxed"
                        placeholder="Technical briefing for this asset..."
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setEditingItem(null)}
                    className="w-full bg-whatsapp text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Authorize Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
