import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Layout, 
  FileText, 
  Globe, 
  Type, 
  Image as ImageIcon, 
  Layers,
  ChevronRight,
  Settings,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface PageBlock {
  id: string;
  type: 'hero' | 'text' | 'image' | 'features';
  content: any;
}

interface Page {
  id?: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  blocks: PageBlock[];
  createdAt?: any;
  updatedAt?: any;
}

export default function PageBuilder() {
  const [pages, setPages] = useState<Page[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Page));
      setPages(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pages');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setCurrentPage({
      title: '',
      slug: '',
      status: 'draft',
      blocks: [],
    });
    setIsEditing(true);
  };

  const handleEdit = (page: Page) => {
    setCurrentPage(page);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await deleteDoc(doc(db, 'pages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `pages/${id}`);
    }
  };

  const handleSave = async () => {
    if (!currentPage) return;
    if (!currentPage.title || !currentPage.slug) return alert('Title and Slug are required');

    const data = {
      title: currentPage.title,
      slug: currentPage.slug,
      status: currentPage.status,
      content: JSON.stringify(currentPage.blocks),
      updatedAt: serverTimestamp(),
    };

    try {
      if (currentPage.id) {
        await updateDoc(doc(db, 'pages', currentPage.id), data);
      } else {
        await addDoc(collection(db, 'pages'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentPage(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pages');
    }
  };

  const addBlock = (type: PageBlock['type']) => {
    if (!currentPage) return;
    const newBlock: PageBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'hero' ? { title: 'New Hero', subtitle: 'Subtitle' } :
               type === 'text' ? { body: 'Rich text content here...' } :
               type === 'image' ? { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f' } :
               { items: ['Feature 1', 'Feature 2'] }
    };
    setCurrentPage({ ...currentPage, blocks: [...currentPage.blocks, newBlock] });
  };

  const removeBlock = (id: string) => {
    if (!currentPage) return;
    setCurrentPage({ ...currentPage, blocks: currentPage.blocks.filter(b => b.id !== id) });
  };

  const updateBlockContent = (id: string, newContent: any) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      blocks: currentPage.blocks.map(b => b.id === id ? { ...b, content: newContent } : b)
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Content <span className="text-whatsapp">Architect</span></h1>
          <p className="text-slate-400 text-sm font-medium">Build and deploy dynamic landing pages</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="bg-whatsapp text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-xs shadow-[0_4px_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Deployment
        </button>
      </div>

      {!isEditing ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Filter deployments by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-whatsapp/50 outline-none transition-all placeholder:text-slate-600 focus:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            />
          </div>

          {/* List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.filter(p => 
              p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.slug.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((page) => (
              <motion.div
                key={page.id}
                layout
                className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-6 group hover:border-whatsapp/30 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-slate-900/60 rounded-2xl flex items-center justify-center border border-white/5 text-whatsapp shadow-xl group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black italic uppercase tracking-tighter text-slate-100 truncate">{page.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> /{page.slug}</span>
                    <span className={cn(
                      "flex items-center gap-1",
                      page.status === 'published' ? "text-whatsapp" : "text-yellow-500"
                    )}>
                      {page.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {page.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(page)}
                    className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-slate-400 hover:text-whatsapp transition-all shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(page.id!)}
                    className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-slate-400 hover:text-red-500 transition-all shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        /* Visual Editor */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setIsEditing(false)}
              className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all group shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="bg-whatsapp text-slate-900 px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow-xl flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Deploy Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/60 rounded-[2rem] border border-white/5 p-6 space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 text-whatsapp">
                  <Settings className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Configuration</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Page Title</label>
                    <input 
                      type="text" 
                      value={currentPage?.title}
                      onChange={(e) => setCurrentPage(prev => ({ ...prev!, title: e.target.value }))}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:border-whatsapp/50 outline-none transition-all"
                      placeholder="e.g. Summer Collection 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">URL Slug</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm">/</span>
                      <input 
                        type="text" 
                        value={currentPage?.slug}
                        onChange={(e) => setCurrentPage(prev => ({ ...prev!, slug: e.target.value }))}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-8 pr-4 py-3 text-sm focus:border-whatsapp/50 outline-none transition-all"
                        placeholder="summer-collection"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Publish Status</label>
                    <select 
                      value={currentPage?.status}
                      onChange={(e) => setCurrentPage(prev => ({ ...prev!, status: e.target.value as any }))}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:border-whatsapp/50 outline-none transition-all appearance-none"
                    >
                      <option value="draft">Draft - Private</option>
                      <option value="published">Published - Live</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-[2rem] border border-white/5 p-6 space-y-6 shadow-2xl">
                <div className="flex items-center gap-2 text-whatsapp">
                  <Layers className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Inventory Modules</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ModuleButton icon={<Layout />} label="Hero" onClick={() => addBlock('hero')} />
                  <ModuleButton icon={<Type />} label="Text" onClick={() => addBlock('text')} />
                  <ModuleButton icon={<ImageIcon />} label="Image" onClick={() => addBlock('image')} />
                  <ModuleButton icon={<CheckCircle2 />} label="Features" onClick={() => addBlock('features')} />
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#0F172A] rounded-[2.5rem] border border-slate-700/50 min-h-[600px] flex flex-col p-8 overflow-y-auto scrollbar-hide shadow-[-20px_20px_50px_rgba(0,0,0,0.5)]">
                {currentPage?.blocks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale">
                    <div className="w-24 h-24 border-2 border-dashed border-slate-700 rounded-3xl flex items-center justify-center animate-pulse">
                      <Layout className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-widest">Empty Canvas</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deploy modules from the sidebar</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentPage?.blocks.map((block) => (
                      <div key={block.id} className="relative group">
                        <div className="absolute -left-12 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                          <button 
                            onClick={() => removeBlock(block.id)}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-red-500 shadow-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-whatsapp/30 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-whatsapp italic">{block.type} Module</span>
                            <MoreVertical className="w-4 h-4 text-slate-600" />
                          </div>
                          
                          {block.type === 'hero' && (
                            <div className="space-y-3">
                              <input 
                                value={block.content.title}
                                onChange={(e) => updateBlockContent(block.id, { ...block.content, title: e.target.value })}
                                className="w-full bg-transparent text-xl font-black italic uppercase tracking-tighter border-b border-slate-800 focus:border-whatsapp outline-none pb-1"
                              />
                              <input 
                                value={block.content.subtitle}
                                onChange={(e) => updateBlockContent(block.id, { ...block.content, subtitle: e.target.value })}
                                className="w-full bg-transparent text-xs font-medium text-slate-400 border-b border-slate-800 focus:border-whatsapp outline-none pb-1"
                              />
                            </div>
                          )}

                          {block.type === 'text' && (
                            <textarea 
                              value={block.content.body}
                              onChange={(e) => updateBlockContent(block.id, { ...block.content, body: e.target.value })}
                              className="w-full bg-slate-900/60 rounded-xl p-4 text-sm font-medium text-slate-300 border border-white/5 focus:border-whatsapp outline-none min-h-[100px]"
                            />
                          )}

                          {block.type === 'image' && (
                            <div className="space-y-4 text-center">
                              <img src={block.content.url} className="w-full h-32 object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all" />
                              <input 
                                value={block.content.url}
                                onChange={(e) => updateBlockContent(block.id, { ...block.content, url: e.target.value })}
                                className="w-full bg-slate-900/60 rounded-xl p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-white/5 focus:border-whatsapp outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-800 hover:border-whatsapp/30 transition-all group"
    >
      <div className="text-slate-400 group-hover:text-whatsapp transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{label}</span>
    </button>
  );
}
