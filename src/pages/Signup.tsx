import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, MessageCircle, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/src/lib/utils';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  whatsappNo: z.string().min(10, 'Please enter a valid WhatsApp number'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.fullName });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: data.fullName,
        email: data.email,
        whatsapp_no: data.whatsappNo,
        role: data.email === 'telimahesh36@gmail.com' ? 'admin' : 'customer',
        created_at: serverTimestamp()
      });

      // Special case: if this email is the one from runtime metadata, make them admin
      // This is a common pattern for "bootstrapping" an admin account.
      // But for now, we follow the blueprint.
      
      navigate('/');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-8 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-white/5 p-8 rounded-3xl space-y-8 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-whatsapp/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-whatsapp" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Staff <span className="text-whatsapp">Registry</span></h1>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Digital Infrastructure Onboarding</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-tight italic">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Identity</label>
              <div className="relative group">
                <User className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  errors.fullName ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
                )} />
                <input 
                  type="text" 
                  placeholder="AGENT NAME" 
                  {...register('fullName')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all",
                    errors.fullName ? "border-red-500/50" : "border-white/5 focus:border-whatsapp/50"
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp No</label>
              <div className="relative group">
                <MessageCircle className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  errors.whatsappNo ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
                )} />
                <input 
                  type="tel" 
                  placeholder="+91..." 
                  {...register('whatsappNo')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3 pl-11 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all",
                    errors.whatsappNo ? "border-red-500/50" : "border-white/5 focus:border-whatsapp/50"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Network Email</label>
            <div className="relative group">
              <Mail className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                errors.email ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
              )} />
              <input 
                type="email" 
                placeholder="AGENT@LOCKINGSTYLE.COM" 
                {...register('email')}
                className={cn(
                  "w-full bg-slate-950 border rounded-xl py-3.5 pl-11 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none transition-all",
                  errors.email ? "border-red-500/50" : "border-white/5 focus:border-whatsapp/50"
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Phrase</label>
            <div className="relative group">
              <Lock className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                errors.password ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
              )} />
              <input 
                type="password" 
                placeholder="••••••••" 
                {...register('password')}
                className={cn(
                  "w-full bg-slate-950 border rounded-xl py-3.5 pl-11 pr-4 text-xs font-black tracking-widest focus:outline-none transition-all",
                  errors.password ? "border-red-500/50" : "border-white/5 focus:border-whatsapp/50"
                )}
              />
            </div>
          </div>

          <p className="text-[9px] text-slate-500 text-center leading-relaxed">
            By registering, you agree to our <span className="text-whatsapp cursor-pointer">Protocol Terms</span> and <span className="text-whatsapp cursor-pointer">Security Charter</span>.
          </p>

          <button
            disabled={loading}
            className="w-full bg-whatsapp text-slate-950 font-black uppercase text-[10px] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-whatsapp/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Initialize Agent Profile
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Existing Dispatcher? <Link to="/login" className="text-whatsapp border-b border-whatsapp/30 ml-1">Secure Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


