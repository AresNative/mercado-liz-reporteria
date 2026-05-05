import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  QueryConstraint,
  FirestoreError,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/utils/constants/firebase-config";

type RealtimeCallback<T> = (data: T[]) => void;

export class FirestoreService<T extends { id: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private getCollectionRef() {
    return collection(db, this.collectionName);
  }

  private getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  private convertTimestamps(data: any): any {
    if (!data) return data;
    const converted = { ...data };
    for (const key of Object.keys(converted)) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      }
    }
    return converted;
  }

  // Firestore rechaza campos con valor undefined — los eliminamos siempre
  private stripUndefined(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    );
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...this.convertTimestamps(doc.data()),
    })) as T[];
  }

  async getById(id: string): Promise<T | null> {
    const snap = await getDoc(this.getDocRef(id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...this.convertTimestamps(snap.data()) } as T;
  }

  async create(data: Omit<T, "id">): Promise<string> {
    const docRef = await addDoc(
      this.getCollectionRef(),
      this.stripUndefined({ ...data, createdAt: Timestamp.now() }),
    );
    return docRef.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(
      this.getDocRef(id),
      this.stripUndefined({ ...data, updatedAt: Timestamp.now() }),
    );
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.getDocRef(id));
  }

  subscribe(
    constraints: QueryConstraint[],
    callback: RealtimeCallback<T>,
    onError?: (error: FirestoreError) => void,
  ): Unsubscribe {
    const q = query(this.getCollectionRef(), ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...this.convertTimestamps(doc.data()),
        })) as T[];
        callback(items);
      },
      onError,
    );
  }
}
