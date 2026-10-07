import React, { useState } from 'react';
import {
  GeneratedItinerary,
  TravellerType,
  ItineraryDay,
} from '../types/travel';
import {
  DESTINATIONS_BY_ID,
  HOTELS_BY_ID,
  ACTIVITIES_BY_ID,
} from '../data/catalogue';
import { formatINR, formatIndianDate, isNewerListing } from '../lib/formatters';
import { BookingModal } from './BookingModal';
import {
  Calendar,
  Share2,
  Bookmark,
  BookmarkCheck,
  Building,
  Activity as ActivityIcon,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Baby,
  Info,
} from 'lucide-react';

interface ItineraryViewProps {
  itinerary: GeneratedItinerary;
  budgetINR: number;
  startDate: string;
  endDate: string;
  travellerType: TravellerType;
  travellerCount: number;
  preferencesText: string;
  onSaveFullTrip: (itinerary: GeneratedItinerary) => Promise<void>;
  onToggleSavedItem: (itemId: string) => Promise<void>;
  savedItemIds: string[];
  isTripSaved: boolean;
  onPlanAnother: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itinerary,
  budgetINR,
  startDate,
  endDate,
  travellerType,
  travellerCount,
  onSaveFullTrip,
  onToggleSavedItem,
  savedItemIds,
  isTripSaved,
  onPlanAnother,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [bookingModalState, setBookingModalState] = useState<{
    isOpen: boolean;
    itemType: 'hotel' | 'activity';
    title: string;
    price: number;
    dateStr?: string;
  }>({
    isOpen: false,
    itemType: 'hotel',
    title: '',
    price: 0,
  });

  const destObj = DESTINATIONS_BY_ID.get(itinerary.destinationId);
  const budgetUtilization = Math.round((itinerary.totalCostINR / Math.max(1, budgetINR)) * 100);

  const handleShare = async () => {
    let shareText = `✈️ MMT Trip Assistant Itinerary: ${itinerary.destinationName}\n`;
    shareText += `🗓️ Dates: ${formatIndianDate(startDate)} to ${formatIndianDate(endDate)} (${itinerary.days.length} Days)\n`;
    shareText += `👥 Travellers: ${travellerType} (${travellerCount} Guests)\n`;
    shareText += `💰 Total Estimated Cost: ${formatINR(itinerary.totalCostINR)} (Target Budget: ${formatINR(budgetINR)})\n`;
    shareText += `💡 Why this itinerary: "${itinerary.whyThisItinerary}"\n\n`;

    itinerary.days.forEach((day) => {
      const hotel = HOTELS_BY_ID.get(day.hotelId)?.hotel;
      shareText += `📅 Day ${day.dayNumber} (${formatIndianDate(day.date)}):\n`;
      if (hotel) {
        shareText += `  🏨 Stay: ${hotel.name} (${formatINR(hotel.pricePerNightINR)}/night) [${hotel.vibeTags.join(', ')}]\n`;
      }
      day.activityIds.forEach((actId) => {
        const act = ACTIVITIES_BY_ID.get(actId)?.activity;
        if (act) {
          shareText += `  🎯 Activity: ${act.name} (${act.costINR === 0 ? 'Free' : formatINR(act.costINR)}) [${act.durationHours}h]\n`;
        }
      });
      shareText += `  📊 Day Cost: ${formatINR(day.dayCostINR)}\n\n`;
    });

    if (itinerary.lesserKnownSpotlight) {
      shareText += `✨ Lesser-Known Spotlight: ${itinerary.lesserKnownSpotlight.name}\n"${itinerary.lesserKnownSpotlight.whyYouMightLoveIt}"\n\n`;
    }

    shareText += `Planned with MakeMyTrip Bias-Free Trip Assistant. Real verified catalogue listings.`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 3000);
      }
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  const openBookingModal = (itemType: 'hotel' | 'activity', title: string, price: number, dateStr?: string) => {
    setBookingModalState({
      isOpen: true,
      itemType,
      title,
      price,
      dateStr,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/5 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header Badges & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
              <MapPin className="w-3.5 h-3.5" />
              {itinerary.destinationName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {formatIndianDate(startDate)} – {formatIndianDate(endDate)} ({itinerary.days.length} Days)
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {travellerType} ({travellerCount} guests)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-all cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Share Itinerary</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSaveFullTrip(itinerary)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                isTripSaved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
              }`}
            >
              {isTripSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  <span>Saved in My Trips</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save Trip</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title & Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Your Tailored Itinerary for {itinerary.destinationName}
            </h1>

            {/* Friendly "Why this itinerary" line */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block mb-0.5">Why this itinerary:</span>
                <span>"{itinerary.whyThisItinerary}"</span>
              </div>
            </div>
          </div>

          {/* Budget Calibration Card */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Budget Calibration</span>
              <span className="font-semibold text-emerald-400">{budgetUtilization}% Utilized</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {formatINR(itinerary.totalCostINR)}
                </span>
                <span className="text-xs text-slate-400 ml-1.5">total estimated</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Stated Budget</span>
                <span className="text-sm font-bold text-slate-300">
                  {formatINR(budgetINR)}
                </span>
              </div>
            </div>

            {/* Visual Budget Progress Bar */}
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilization <= 95 ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Comfortably within budget. All taxes & hotel room rates included.</span>
            </p>
          </div>
        </div>

        {/* Edge Case Warning if < 5 hotels */}
        {itinerary.disclaimerNotes && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{itinerary.disclaimerNotes}</p>
              {destObj?.nearbyAlternatives && destObj.nearbyAlternatives.length > 0 && (
                <p className="text-blue-700 mt-0.5">
                  Suggested nearby alternatives with similar vibe:{' '}
                  {destObj.nearbyAlternatives
                    .map((altId) => DESTINATIONS_BY_ID.get(altId)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lesser-Known Option Spotlight */}
        {itinerary.lesserKnownSpotlight && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lesser-Known Gem Spotlight: {itinerary.lesserKnownSpotlight.name}</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed pl-5">
              <span className="font-semibold">Why you might love it: </span>
              {itinerary.lesserKnownSpotlight.whyYouMightLoveIt}
            </p>
          </div>
        )}
      </div>

      {/* Day by Day Itinerary Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Day-by-Day Travel Plan
          </h2>
          <span className="text-xs text-slate-500">
            {itinerary.days.length} {itinerary.days.length === 1 ? 'Day' : 'Days'} planned
          </span>
        </div>

        <div className="space-y-6">
          {itinerary.days.map((day) => {
            const hotel = HOTELS_BY_ID.get(day.hotelId)?.hotel;
            const isHotelSaved = savedItemIds.includes(day.hotelId);

            return (
              <div
                key={day.dayNumber}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 transition-all hover:border-slate-300"
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-2xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-sm shadow-red-600/30">
                      D{day.dayNumber}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Day {day.dayNumber} • {formatIndianDate(day.date)}
                      </h3>
                      {day.daySummary && (
                        <p className="text-xs text-slate-500">{day.daySummary}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Day Total:</span>
                    <span className="text-base font-black text-slate-900">
                      {formatINR(day.dayCostINR)}
                    </span>
                  </div>
                </div>

                {/* Hotel Card */}
                {hotel && (
                  <div className="p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 uppercase tracking-wider">
                            <Building className="w-3.5 h-3.5" />
                            Overnight Accommodation
                          </span>
                          {hotel.kidFriendly && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Baby className="w-3 h-3" /> Kid-Friendly
                            </span>
                          )}
                          {isNewerListing(hotel.reviewCount) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Newer listing, fewer reviews
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900">{hotel.name}</h4>
                        <p className="text-xs text-slate-500">
                          {hotel.area || itinerary.destinationName} • {hotel.reviewCount} reviews
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-slate-900 block">
                          {formatINR(hotel.pricePerNightINR)}
                        </span>
                        <span className="text-[11px] text-slate-500">per night</span>
                      </div>
                    </div>

                    {/* Vibe Tags */}
                    {hotel.vibeTags && hotel.vibeTags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hotel.vibeTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-600 font-medium capitalize"
                          >
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Item Actions: Save & Start Booking */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onToggleSavedItem(hotel.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isHotelSaved
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isHotelSaved ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                            <span>Save</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          openBookingModal(
                            'hotel',
                            hotel.name,
                            hotel.pricePerNightINR,
                            formatIndianDate(day.date)
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>Start booking</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Activities for the day */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ActivityIcon className="w-3.5 h-3.5" />
                    Day Activities & Experiences ({day.activityIds.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {day.activityIds.map((actId) => {
                      const act = ACTIVITIES_BY_ID.get(actId)?.activity;
                      if (!act) return null;
                      const isActSaved = savedItemIds.includes(act.id);

                      return (
                        <div
                          key={act.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-sm font-bold text-slate-900 leading-snug">
                                {act.name}
                              </h5>
                              <span className="text-sm font-black text-slate-900 shrink-0">
                                {act.costINR === 0 ? 'Free' : formatINR(act.costINR)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {act.durationHours} hours
                              </span>
                              {act.tags.includes('kid-friendly') && (
                                <span className="text-blue-600 font-semibold">• Kid-friendly</span>
                              )}
                            </div>

                            {/* Activity Tags */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {act.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => onToggleSavedItem(act.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                isActSaved
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isActSaved ? (
                                <>
                                  <BookmarkCheck className="w-3 h-3" />
                                  <span>Saved</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3 h-3 text-slate-400" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                openBookingModal(
                                  'activity',
                                  act.name,
                                  act.costINR,
                                  formatIndianDate(day.date)
                                )
                              }
                              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <span>Start booking</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold">Ready to take off or adjust your vibe?</h4>
          <p className="text-xs text-slate-400">
            Trip saved to your personal MakeMyTrip cloud account. You can reopen it anytime in "My Trips".
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onPlanAnother}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Plan Another Destination
          </button>
          <button
            onClick={() => onSaveFullTrip(itinerary)}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
          >
            {isTripSaved ? 'Trip Saved ✓' : 'Save Full Trip'}
          </button>
        </div>
      </div>

      {/* Booking Hold Modal */}
      <BookingModal
        isOpen={bookingModalState.isOpen}
        onClose={() => setBookingModalState((prev) => ({ ...prev, isOpen: false }))}
        itemType={bookingModalState.itemType}
        itemTitle={bookingModalState.title}
        itemPriceINR={bookingModalState.price}
        destinationName={itinerary.destinationName}
        dateStr={bookingModalState.dateStr}
        travellerCount={travellerCount}
      />
    </div>
  );
};
