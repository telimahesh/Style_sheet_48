import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async (user: any, retryCount = 0) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData?.role === 'admin' || user.email === 'telimahesh36@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else if (user.email === 'telimahesh36@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        const errorMsg = (error instanceof Error ? error.message : String(error)).toLowerCase();
        const isOffline = errorMsg.includes('offline') || errorMsg.includes('failed to get document');
        
        if (isOffline && retryCount < 3) {
          console.warn(`[System] Admin check offline, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => checkAdmin(user, retryCount + 1), 2000);
          return;
        }
        
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkAdmin(user);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-whatsapp/20 border-t-whatsapp rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
