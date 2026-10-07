import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { TripPlan, PlannerDraft } from '../types/travel';

/**
 * Save or update a trip under users/{uid}/trips/{tripId}
 */
export async function saveTripToFirestore(trip: TripPlan): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in to save trip');

  const path = `users/${user.uid}/trips/${trip.id}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'trips', trip.id);
    await setDoc(docRef, {
      ...trip,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update saved items array in a trip document
 */
export async function toggleSavedItemInTrip(tripId: string, itemId: string): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in');

  const path = `users/${user.uid}/trips/${tripId}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'trips', tripId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];

    const data = snap.data();
    const currentSaved: string[] = data.savedItemIds || [];
    let updatedSaved: string[];

    if (currentSaved.includes(itemId)) {
      updatedSaved = currentSaved.filter((id) => id !== itemId);
    } else {
      updatedSaved = [...currentSaved, itemId];
    }

    await updateDoc(docRef, {
      savedItemIds: updatedSaved,
      updatedAt: new Date().toISOString(),
    });

    return updatedSaved;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return [];
  }
}

/**
 * Fetch all trips for current user
 */
export async function getUserTrips(): Promise<TripPlan[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const path = `users/${user.uid}/trips`;
  try {
    const colRef = collection(db, 'users', user.uid, 'trips');
    const snapshot = await getDocs(colRef);
    const trips: TripPlan[] = [];
    snapshot.forEach((d) => {
      trips.push(d.data() as TripPlan);
    });
    // Sort newest first
    trips.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return trips;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Subscribe to realtime trips list
 */
export function subscribeToUserTrips(onTrips: (trips: TripPlan[]) => void): () => void {
  const user = auth.currentUser;
  if (!user) {
    onTrips([]);
    return () => {};
  }

  const path = `users/${user.uid}/trips`;
  const colRef = collection(db, 'users', user.uid, 'trips');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const trips: TripPlan[] = [];
      snapshot.forEach((d) => {
        trips.push(d.data() as TripPlan);
      });
      trips.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onTrips(trips);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Delete a specific trip
 */
export async function deleteTripFromFirestore(tripId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in');

  const path = `users/${user.uid}/trips/${tripId}`;
  try {
    const docRef = doc(db, 'users', user.uid, 'trips', tripId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save user in-progress draft session
 */
export async function saveDraftToFirestore(draft: Partial<PlannerDraft>): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/drafts/current`;
  try {
    const docRef = doc(db, 'users', user.uid, 'drafts', 'current');
    await setDoc(
      docRef,
      {
        ...draft,
        id: 'current',
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load user in-progress draft session
 */
export async function loadDraftFromFirestore(): Promise<PlannerDraft | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/drafts/current`;
  try {
    const docRef = doc(db, 'users', user.uid, 'drafts', 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as PlannerDraft;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Clear user in-progress draft
 */
export async function clearDraftFromFirestore(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const path = `users/${user.uid}/drafts/current`;
  try {
    const docRef = doc(db, 'users', user.uid, 'drafts', 'current');
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * "Delete my data" feature: Completely purges all trips and drafts for the user
 */
export async function deleteAllUserData(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in');

  const tripsPath = `users/${user.uid}/trips`;
  try {
    // 1. Delete all trips
    const colRef = collection(db, 'users', user.uid, 'trips');
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // 2. Delete draft
    await clearDraftFromFirestore();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, tripsPath);
  }
}
