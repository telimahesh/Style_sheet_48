import { useEffect, useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, limit, orderBy, getDoc, doc } from 'firebase/firestore';

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
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) return;

      // Check if user is staff (admin, manager, or clerk)
      const checkStaffStatus = async (retryCount = 0) => {
        try {
          // Increase initial delay to ensure network and auth are fully settled
          if (retryCount === 0) await new Promise(r => setTimeout(r, 2000));
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const isStaff = userData?.role === 'admin' || userData?.role === 'branch_manager' || userData?.role === 'inventory_clerk' || user.email === 'telimahesh36@gmail.com';

          if (!isStaff) return;

          const q = query(
            collection(db, 'products'),
            where('stock', '<=', 5),
            where('stock', '>', 0),
            limit(5)
          );

          unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
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
            // Only report serious errors, ignore temporary offline state in snapshot
            const errorMsg = error.message.toLowerCase();
            if (!errorMsg.includes('offline') && !errorMsg.includes('failed to get document')) {
              handleFirestoreError(error, OperationType.LIST, 'products (low stock)');
            }
          });
        } catch (error) {
          const errorMsg = (error instanceof Error ? error.message : String(error)).toLowerCase();
          const isOffline = errorMsg.includes('offline') || errorMsg.includes('failed to get document');

          if (isOffline && retryCount < 5) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff max 10s
            console.warn(`[System] Staff check offline, retrying in ${delay/1000}s (${retryCount + 1}/5)...`);
            setTimeout(() => checkStaffStatus(retryCount + 1), delay);
          } else if (isOffline) {
            console.warn("[System] Staff check remained offline after multiple attempts. Notification service will sync once online.");
          } else {
            console.error("Error checking staff status:", error);
          }
        }
      };

      await checkStaffStatus();
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [permission]);

  // Listen for order status changes
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) return;

      const q = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(10)
      );

      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
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
        handleFirestoreError(error, OperationType.LIST, 'orders (status updates)');
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [permission]);

  return { permission, requestPermission };
}
