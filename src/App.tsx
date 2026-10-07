import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  testConnection,
} from './lib/firebase';
import {
  TripPlan,
  GeneratedItinerary,
  PlannerDraft,
} from './types/travel';
import { PlanRequestParams } from './services/catalogEngine';
import {
  saveTripToFirestore,
  toggleSavedItemInTrip,
  subscribeToUserTrips,
  saveDraftToFirestore,
  loadDraftFromFirestore,
  clearDraftFromFirestore,
} from './services/tripStore';

import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { ChatPlanner } from './components/ChatPlanner';
import { ItineraryView } from './components/ItineraryView';
import { MyTrips } from './components/MyTrips';
import { DeleteDataModal } from './components/DeleteDataModal';
import { CatalogueExplorerModal } from './components/CatalogueExplorerModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tab State: 'plan' | 'trips' | 'catalogue'
  const [currentTab, setCurrentTab] = useState<'plan' | 'trips' | 'catalogue'>('plan');

  // Planning / Itinerary State
  const [activePlan, setActivePlan] = useState<GeneratedItinerary | null>(null);
  const [activePlanParams, setActivePlanParams] = useState<PlanRequestParams | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);
  const [isTripSaved, setIsTripSaved] = useState(false);

  // Draft state loaded from Firestore
  const [savedDraft, setSavedDraft] = useState<PlannerDraft | null>(null);

  // User's saved trips
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>([]);

  // Delete Data Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 1. Firebase Auth listener & Connection test
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Load in-progress draft from Firestore
        try {
          const draft = await loadDraftFromFirestore();
          if (draft && draft.formData) {
            setSavedDraft(draft);
          }
        } catch (err) {
          console.warn('Failed to load draft:', err);
        }
      } else {
        setSavedTrips([]);
        setActivePlan(null);
        setSavedDraft(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time subscription to user's trips from Firestore
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserTrips((trips) => {
      setSavedTrips(trips);
    });
    return () => unsub();
  }, [user]);

  // Google Sign-In
  const handleSignIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  // Sign Out
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Draft auto-save handler
  const handleDraftAutoSave = async (draftData: Partial<PlannerDraft>) => {
    if (!user) return;
    try {
      await saveDraftToFirestore(draftData);
    } catch (err) {
      console.warn('Auto-save draft error:', err);
    }
  };

  // Save generated trip to Firestore
  const handleSaveFullTrip = async (itinerary: GeneratedItinerary) => {
    if (!user || !activePlanParams) return;

    const tripId = activeTripId || `trip_${Date.now()}`;
    const newTrip: TripPlan = {
      id: tripId,
      userId: user.uid,
      destinationId: itinerary.destinationId,
      destinationName: itinerary.destinationName,
      startDate: activePlanParams.startDate,
      endDate: activePlanParams.endDate,
      budgetINR: activePlanParams.budgetINR,
      travellerType: activePlanParams.travellerType,
      travellerCount: activePlanParams.travellerCount,
      preferencesText: activePlanParams.preferencesText,
      whyThisItinerary: itinerary.whyThisItinerary,
      lesserKnownSpotlight: itinerary.lesserKnownSpotlight,
      totalCostINR: itinerary.totalCostINR,
      days: itinerary.days,
      savedItemIds: savedItemIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveTripToFirestore(newTrip);
      setActiveTripId(tripId);
      setIsTripSaved(true);
      // Clean up in-progress draft since trip is now generated and saved
      await clearDraftFromFirestore();
    } catch (err) {
      console.error('Save full trip error:', err);
    }
  };

  // Handle plan generated from ChatPlanner
  const handlePlanGenerated = async (itinerary: GeneratedItinerary, params: PlanRequestParams) => {
    setActivePlan(itinerary);
    setActivePlanParams(params);
    setActiveTripId(`trip_${Date.now()}`);
    setSavedItemIds([]);
    setIsTripSaved(false);

    // Auto-save generated trip directly to Firestore under user
    if (user) {
      const tripId = `trip_${Date.now()}`;
      const newTrip: TripPlan = {
        id: tripId,
        userId: user.uid,
        destinationId: itinerary.destinationId,
        destinationName: itinerary.destinationName,
        startDate: params.startDate,
        endDate: params.endDate,
        budgetINR: params.budgetINR,
        travellerType: params.travellerType,
        travellerCount: params.travellerCount,
        preferencesText: params.preferencesText,
        whyThisItinerary: itinerary.whyThisItinerary,
        lesserKnownSpotlight: itinerary.lesserKnownSpotlight,
        totalCostINR: itinerary.totalCostINR,
        days: itinerary.days,
        savedItemIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveTripToFirestore(newTrip);
        setActiveTripId(tripId);
        setIsTripSaved(true);
      } catch (err) {
        console.warn('Auto-save on generation failed:', err);
      }
    }
  };

  // Toggle item saved status in current trip
  const handleToggleSavedItem = async (itemId: string) => {
    let updated: string[];
    if (savedItemIds.includes(itemId)) {
      updated = savedItemIds.filter((id) => id !== itemId);
    } else {
      updated = [...savedItemIds, itemId];
    }
    setSavedItemIds(updated);

    if (activeTripId && isTripSaved) {
      try {
        await toggleSavedItemInTrip(activeTripId, itemId);
      } catch (err) {
        console.warn('Toggle item saved in Firestore failed:', err);
      }
    }
  };

  // Reopen trip from My Trips
  const handleReopenTrip = (trip: TripPlan) => {
    setActivePlan({
      destinationId: trip.destinationId,
      destinationName: trip.destinationName,
      whyThisItinerary: trip.whyThisItinerary,
      lesserKnownSpotlight: trip.lesserKnownSpotlight,
      totalCostINR: trip.totalCostINR,
      days: trip.days,
    });
    setActivePlanParams({
      destinationInput: trip.destinationName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetINR: trip.budgetINR,
      travellerType: trip.travellerType,
      travellerCount: trip.travellerCount,
      preferencesText: trip.preferencesText,
    });
    setActiveTripId(trip.id);
    setSavedItemIds(trip.savedItemIds || []);
    setIsTripSaved(true);
    setCurrentTab('plan');
  };

  // Reset to new trip planner
  const handleNewTrip = () => {
    setActivePlan(null);
    setActivePlanParams(null);
    setActiveTripId(null);
    setSavedItemIds([]);
    setIsTripSaved(false);
  };

  // After "Delete all data" completes
  const handleDataDeleted = () => {
    setSavedTrips([]);
    handleNewTrip();
    setCurrentTab('plan');
  };

  // Render Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Connecting to MMT Trip Assistant...</p>
        </div>
      </div>
    );
  }

  // 1. Enforce Google Sign-In before using the app
  if (!user) {
    return <LoginScreen onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-red-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedTripsCount={savedTrips.length}
        onOpenDeleteDataModal={() => setIsDeleteModalOpen(true)}
        onSignOut={handleSignOut}
        onNewTrip={handleNewTrip}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'plan' && (
          <>
            {activePlan && activePlanParams ? (
              <ItineraryView
                itinerary={activePlan}
                budgetINR={activePlanParams.budgetINR}
                startDate={activePlanParams.startDate}
                endDate={activePlanParams.endDate}
                travellerType={activePlanParams.travellerType}
                travellerCount={activePlanParams.travellerCount}
                preferencesText={activePlanParams.preferencesText}
                onSaveFullTrip={handleSaveFullTrip}
                onToggleSavedItem={handleToggleSavedItem}
                savedItemIds={savedItemIds}
                isTripSaved={isTripSaved}
                onPlanAnother={handleNewTrip}
              />
            ) : (
              <ChatPlanner
                onPlanGenerated={handlePlanGenerated}
                onDraftAutoSave={handleDraftAutoSave}
                initialDraft={savedDraft}
              />
            )}
          </>
        )}

        {currentTab === 'trips' && (
          <MyTrips
            trips={savedTrips}
            onReopenTrip={handleReopenTrip}
            onPlanNew={() => {
              handleNewTrip();
              setCurrentTab('plan');
            }}
            onTripsUpdated={() => {}}
          />
        )}

        {currentTab === 'catalogue' && (
          <CatalogueExplorerModal
            onSelectDestination={(destName) => {
              handleNewTrip();
              setCurrentTab('plan');
            }}
          />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            MakeMyTrip Trip Assistant • Bias-Free Indian Travel Planning with Verified Inventory
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>₹ Indian Currency Formatting</span>
            <span>•</span>
            <span>PII Redaction Protected</span>
            <span>•</span>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-slate-500 hover:text-red-600 underline cursor-pointer"
            >
              Delete My Data
            </button>
          </div>
        </div>
      </footer>

      {/* Delete My Data Modal */}
      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDataDeleted={handleDataDeleted}
      />
    </div>
  );
}
