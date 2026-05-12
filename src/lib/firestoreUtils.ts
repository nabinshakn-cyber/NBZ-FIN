import { auth, db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
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
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Reusable hooks or helper functions for common operations
export const subscribeToCollection = (
  path: string, 
  onData: (data: any[]) => void,
  userFilters: { field: string, value: any }[] = []
) => {
  if (!auth.currentUser) return () => {};

  let q = query(
    collection(db, path), 
    where('userId', '==', auth.currentUser.uid)
  );

  userFilters.forEach(f => {
    q = query(q, where(f.field, '==', f.value));
  });

  // Default sorting if applicable
  if (path === 'transactions') {
    q = query(q, orderBy('date', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onData(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const createDocument = async (path: string, data: any) => {
  try {
    const docData = {
      ...data,
      userId: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    return await addDoc(collection(db, path), docData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateDocument = async (path: string, id: string, data: any) => {
  try {
    const docRef = doc(db, path, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
};

export const deleteDocument = async (path: string, id: string) => {
  try {
    await deleteDoc(doc(db, path, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
};
