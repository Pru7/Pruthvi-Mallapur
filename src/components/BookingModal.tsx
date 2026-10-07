import React, { useState } from 'react';
import { CheckCircle2, Calendar, IndianRupee, MapPin, Users, X, Sparkles, Building, Activity as ActivityIcon } from 'lucide-react';
import { formatINR } from '../lib/formatters';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'hotel' | 'activity';
  itemTitle: string;
  itemPriceINR: number;
  destinationName: string;
  dateStr?: string;
  travellerCount: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemTitle,
  itemPriceINR,
  destinationName,
  dateStr,
  travellerCount,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setConfirmed(true);
  };

  const handleDismiss = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 relative space-y-6">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!confirmed ? (
          <>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                {itemType === 'hotel' ? <Building className="w-3.5 h-3.5" /> : <ActivityIcon className="w-3.5 h-3.5" />}
                <span className="capitalize">{itemType} Booking Hold</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                Reserve {itemTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Direct booking lock from verified MakeMyTrip inventory catalog.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Destination
                </span>
                <span className="font-semibold text-slate-900">{destinationName}</span>
              </div>

              {dateStr && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Schedule
                  </span>
                  <span className="font-semibold text-slate-900">{dateStr}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Travellers
                </span>
                <span className="font-semibold text-slate-900">{travellerCount} Guests</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Rate / Night or Session</span>
                <span className="text-base font-black text-slate-900">
                  {formatINR(itemPriceINR)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">💡 No Prepayment Required Today</p>
              <p className="text-[11px] text-amber-700">
                Holds will be confirmed directly with property management. Free cancellation up to 48 hours before check-in.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Start Booking Hold
              </button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce-short">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">Booking Hold Initiated!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We've simulated a placeholder reservation hold for <span className="font-bold text-slate-700">{itemTitle}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 text-left space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span>Hold Reference:</span>
                <span className="font-bold">MMT-HOLD-{(Math.random() * 100000).toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Hold Status:</span>
                <span className="font-bold text-emerald-700">Guaranteed for 24h</span>
              </div>
              <p className="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                You can save this item directly to your trip itinerary in your personal "My Trips" dashboard.
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Back to Itinerary
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
