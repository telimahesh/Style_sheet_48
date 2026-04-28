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
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-white/5 p-8 rounded-3xl space-y-8 shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-whatsapp/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-whatsapp" />
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Access <span className="text-whatsapp">Portal</span></h1>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Digital Hardware Dispatch Layer</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-tight italic">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={cn(
                    "w-4 h-4 transition-colors",
                    errors.email ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
                  )} />
                </div>
                <input
                  type="email"
                  placeholder="AGENT@LOCKINGSTYLE.COM"
                  {...register('email')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3.5 pl-11 pr-4 focus:outline-none transition-all text-xs font-black uppercase tracking-widest placeholder:text-slate-800",
                    errors.email 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-white/5 focus:border-whatsapp/50"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-tight ml-1 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Security Code</label>
                <button type="button" className="text-[9px] text-slate-600 font-black uppercase tracking-tight hover:text-whatsapp">Forgot Access?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={cn(
                    "w-4 h-4 transition-colors",
                    errors.password ? "text-red-500" : "text-slate-600 group-focus-within:text-whatsapp"
                  )} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3.5 pl-11 pr-4 focus:outline-none transition-all text-xs font-black tracking-widest placeholder:text-slate-800",
                    errors.password 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-white/5 focus:border-whatsapp/50"
                  )}
                />
              </div>
              {errors.password && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-tight ml-1 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-whatsapp text-slate-950 font-black uppercase text-[10px] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-whatsapp/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In Agent
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-6 pt-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Non-Registered? <Link to="/signup" className="text-whatsapp border-b border-whatsapp/30">Request Credentials</Link>
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-black text-slate-700 bg-slate-900 px-4">
              Cross-Protocol
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-slate-950 border border-white/5 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-whatsapp hover:border-whatsapp/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Globe className="w-4 h-4" /> Sign In with Global ID
          </button>
        </div>
      </motion.div>
    </div>
  );
}


