import React, { useState } from 'react';
import { TripPlan } from '../types/travel';
import { formatINR, formatIndianDate } from '../lib/formatters';
import { deleteTripFromFirestore } from '../services/tripStore';
import {
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Trash2,
  ExternalLink,
  Share2,
  Sparkles,
  CheckCircle2,
  Luggage,
  PlusCircle,
  Clock,
  BookmarkCheck,
} from 'lucide-react';

interface MyTripsProps {
  trips: TripPlan[];
  onReopenTrip: (trip: TripPlan) => void;
  onPlanNew: () => void;
  onTripsUpdated: () => void;
}

export const MyTrips: React.FC<MyTripsProps> = ({
  trips,
  onReopenTrip,
  onPlanNew,
  onTripsUpdated,
}) => {
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [copiedTripId, setCopiedTripId] = useState<string | null>(null);

  const handleDelete = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip itinerary?')) return;

    try {
      setDeletingTripId(tripId);
      await deleteTripFromFirestore(tripId);
      onTripsUpdated();
    } catch (err) {
      console.error('Delete trip error:', err);
    } finally {
      setDeletingTripId(null);
    }
  };

  const handleShare = async (trip: TripPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    let shareText = `✈️ My Trip to ${trip.destinationName} (${trip.days.length} Days)\n`;
    shareText += `🗓️ Dates: ${formatIndianDate(trip.startDate)} to ${formatIndianDate(trip.endDate)}\n`;
    shareText += `💰 Total Estimated Cost: ${formatINR(trip.totalCostINR)} (Budget: ${formatINR(trip.budgetINR)})\n`;
    shareText += `💡 Why this itinerary: "${trip.whyThisItinerary}"\n\n`;

    trip.days.forEach((d) => {
      shareText += `Day ${d.dayNumber}: ${d.daySummary || 'Explore & relax'} (${formatINR(d.dayCostINR)})\n`;
    });

    shareText += `\nCurated with MMT Trip Assistant.`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedTripId(trip.id);
        setTimeout(() => setCopiedTripId(null), 2500);
      }
    } catch (err) {
      console.warn('Share copy error:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Saved Trips
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-200">
              {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Persisted in your private Cloud Firestore account. Reopen, edit or share anytime.
          </p>
        </div>

        <button
          onClick={onPlanNew}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Plan New Trip</span>
        </button>
      </div>

      {/* Trips List / Empty State */}
      {trips.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Luggage className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">No Saved Trips Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start a conversational planning session to find offbeat stays and bespoke itineraries matching your exact budget.
            </p>
          </div>
          <button
            onClick={onPlanNew}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            Create Your First Itinerary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => {
            const isDeleting = deletingTripId === trip.id;
            const isCopied = copiedTripId === trip.id;

            return (
              <div
                key={trip.id}
                onClick={() => onReopenTrip(trip)}
                className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-red-500/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer relative"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1">
                        <MapPin className="w-3 h-3" />
                        {trip.destinationName}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors">
                        {trip.days.length}-Day Plan to {trip.destinationName}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 block">
                        {formatINR(trip.totalCostINR)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        of {formatINR(trip.budgetINR)} budget
                      </span>
                    </div>
                  </div>

                  {/* Date & Travellers Row */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatIndianDate(trip.startDate)} - {formatIndianDate(trip.endDate)}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {trip.travellerType} ({trip.travellerCount})
                    </span>
                    {trip.savedItemIds && trip.savedItemIds.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                        <BookmarkCheck className="w-3 h-3 text-emerald-600" />
                        {trip.savedItemIds.length} saved
                      </span>
                    )}
                  </div>

                  {/* Why this itinerary snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{trip.whyThisItinerary}"
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Saved {new Date(trip.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShare(trip, e)}
                      title="Share trip itinerary"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDelete(trip.id, e)}
                      disabled={isDeleting}
                      title="Delete trip"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-bold text-red-600 pl-1 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Open Plan →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
