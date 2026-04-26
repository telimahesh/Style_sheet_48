import { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  // Listen for low stock alerts
  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('stock', '<=', 5),
      where('stock', '>', 0),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const product = change.doc.data();
          if (permission === 'granted') {
            new Notification('Low Stock Alert', {
              body: `${product.name} is running low (${product.stock} units left!)`,
              icon: '/manifest.json'
            });
          }
        }
      });
    }, (error) => {
      console.error("Low stock snapshot error:", error);
    });

    return () => unsubscribe();
  }, [permission]);

  // Listen for order status changes
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const q = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const order = change.doc.data();
            new Notification('Order Updated', {
                body: `Your order #${change.doc.id.slice(-8)} status is now: ${order.status}`,
                icon: '/manifest.json'
              });
          }
        });
      }, (error) => {
        console.error("Order snapshot error:", error);
      });

      return () => unsubscribe();
    });

    return () => unsubscribeAuth();
  }, [permission]);

  return { permission, requestPermission };
}
