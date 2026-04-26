import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, Globe, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/src/lib/utils';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const checkAdminAndRedirect = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data()?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error("Error checking admin status:", err);
      navigate('/');
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await checkAdminAndRedirect(userCredential.user.uid);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create them
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName || 'New Agent',
          email: user.email,
          whatsapp_no: '',
          role: user.email === 'telimahesh36@gmail.com' ? 'admin' : 'customer',
          created_at: serverTimestamp()
        });
      } else if (user.email === 'telimahesh36@gmail.com' && userDoc.data()?.role !== 'admin') {
        // Ensure this specific user is always admin if they log in
        await setDoc(userRef, { role: 'admin' }, { merge: true });
      }

      await checkAdminAndRedirect(user.uid);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center space-y-8 p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-whatsapp/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/60 border border-white/5 p-10 rounded-[3.5rem] space-y-10 relative overflow-hidden backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-whatsapp/50 to-transparent" />
        
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-950 rounded-[2rem] border-2 border-white/5 mx-auto flex items-center justify-center shadow-2xl relative group overflow-hidden">
             <div className="absolute inset-0 bg-whatsapp/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <LogIn className="w-8 h-8 text-whatsapp relative z-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Protocol <span className="text-whatsapp">Access</span></h1>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic">Identity Verification Required</p>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {error}
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Deployment Mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Mail className={cn(
                    "w-4 h-4 transition-all duration-500",
                    errors.email ? "text-red-500 rotate-12" : "text-slate-600 group-focus-within:text-whatsapp group-focus-within:scale-125"
                  )} />
                </div>
                <input
                  type="email"
                  placeholder="AGENT@PROTOCOL.COM"
                  {...register('email')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-[2rem] py-6 pl-14 pr-6 focus:outline-none transition-all text-[11px] font-black uppercase tracking-widest placeholder:text-slate-800 shadow-inner",
                    errors.email 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-white/5 focus:border-whatsapp/50 focus:bg-slate-900"
                  )}
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-6 mt-2 italic">
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Key</label>
                <button type="button" className="text-[10px] text-slate-600 font-bold uppercase tracking-widest border-b border-slate-800 hover:text-whatsapp hover:border-whatsapp transition-all">Key Recovery</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Lock className={cn(
                    "w-4 h-4 transition-all duration-500",
                    errors.password ? "text-red-500 rotate-12" : "text-slate-600 group-focus-within:text-whatsapp group-focus-within:scale-125"
                  )} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-[2rem] py-6 pl-14 pr-6 focus:outline-none transition-all text-[11px] font-black tracking-[0.5em] placeholder:text-slate-800 shadow-inner",
                    errors.password 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-white/5 focus:border-whatsapp/50 focus:bg-slate-900"
                  )}
                />
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-black text-red-500 uppercase tracking-widest ml-6 mt-2 italic">
                  {errors.password.message}
                </motion.p>
              )}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-whatsapp text-slate-950 font-black uppercase text-xs py-6 rounded-[2rem] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group shadow-[0_20px_50px_rgba(34,197,94,0.3)] disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 italic" />
            
            {loading ? (
              <div className="w-5 h-5 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" /> 
                <span className="tracking-[0.2em] italic">Initialize Signal Access</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-8">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            New Agent? <Link to="/signup" className="text-whatsapp font-black border-b border-whatsapp/30 hover:border-whatsapp transition-colors italic">Registry Initiation</Link>
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.5em] font-black text-slate-700 bg-slate-900/0 px-4">
              Biometric Bypass
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-800/20 text-slate-400 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:border-whatsapp/20 hover:text-slate-200 transition-all flex items-center justify-center gap-3 italic disabled:opacity-50"
          >
            <Globe className="w-4 h-4" /> Global ID Integration
          </button>
        </div>
      </motion.div>
    </div>
  );
}


