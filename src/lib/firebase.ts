import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  terminate
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Validate config
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
  console.error("Firebase API Key is missing or invalid. Please check firebase-applet-config.json");
}

const app = initializeApp(firebaseConfig);

// Initialize Firestore with forceLongPolling to avoid WebSocket issues in proxy environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth();

console.log('System Profile: Firestore initialized with Long Polling on database', firebaseConfig.firestoreDatabaseId);

export { getDoc, getDocFromServer };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Test connection on boot using getDocFromServer
export async function testConnection() {
  try {
    console.log('[System] Verifying Firestore uplink...');
    // We use a small delay to ensure the network stack is fully ready in the preview environment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Using getDocFromServer forces a network request, satisfying the diagnostic requirement
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[System] Firestore uplink established.');
  } catch (error) {
    // If it fails with "offline", it's likely a network issue in the preview or an unprovisioned DB
    if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Failed to get document'))) {
      console.warn("[System] Firestore reports offline. This may be temporary during environment boot.");
    } else {
      console.error('[System] Firestore diagnostic failure:', error);
    }
  }
}
testConnection();
