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
    <div className="min-h-[90vh] flex flex-col items-center justify-center space-y-8 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/60 border border-white/5 p-8 rounded-[2rem] space-y-8 relative backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Create <span className="text-whatsapp">Protocol</span></h1>
          <p className="text-slate-400 text-sm font-medium">Join the elite retail ecosystem</p>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    errors.fullName ? "text-red-500" : "text-slate-500"
                  )} />
                  <input 
                    type="text" 
                    placeholder="John D." 
                    {...register('fullName')}
                    className={cn(
                      "w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all",
                      errors.fullName 
                        ? "border-red-500/50 focus:border-red-500 bg-red-500/5" 
                        : "border-slate-700 focus:border-whatsapp/50"
                    )}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 leading-none">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp No</label>
                <div className="relative">
                  <MessageCircle className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    errors.whatsappNo ? "text-red-500" : "text-slate-500"
                  )} />
                  <input 
                    type="tel" 
                    placeholder="+123..." 
                    {...register('whatsappNo')}
                    className={cn(
                      "w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all",
                      errors.whatsappNo 
                        ? "border-red-500/50 focus:border-red-500 bg-red-500/5" 
                        : "border-slate-700 focus:border-whatsapp/50"
                    )}
                  />
                </div>
                {errors.whatsappNo && (
                  <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 leading-none">
                    {errors.whatsappNo.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  errors.email ? "text-red-500" : "text-slate-500"
                )} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  {...register('email')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all",
                    errors.email 
                      ? "border-red-500/50 focus:border-red-500 bg-red-500/5" 
                      : "border-slate-700 focus:border-whatsapp/50"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 leading-none">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Secret</label>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  errors.password ? "text-red-500" : "text-slate-500"
                )} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  {...register('password')}
                  className={cn(
                    "w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all",
                    errors.password 
                      ? "border-red-500/50 focus:border-red-500 bg-red-500/5" 
                      : "border-slate-700 focus:border-whatsapp/50"
                  )}
                />
              </div>
              {errors.password && (
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider ml-1 mt-1 leading-none">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">
              By joining, you agree to our <span className="text-slate-300 font-bold uppercase cursor-pointer">System Terms</span> and <span className="text-slate-300 font-bold uppercase cursor-pointer">Privacy Protocols</span>.
            </p>
          </div>

          <button
            disabled={loading}
            className="w-full bg-whatsapp text-slate-900 font-black uppercase text-xs py-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_40px_rgba(34,197,94,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> <span>Deploy Account Protocol</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Already verified? <Link to="/login" className="text-whatsapp font-black">Log back in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


