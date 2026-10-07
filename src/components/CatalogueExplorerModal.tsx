import React, { useState } from 'react';
import { TRAVEL_CATALOGUE } from '../data/catalogue';
import { Destination, DestinationType } from '../types/travel';
import { formatINR, isNewerListing } from '../lib/formatters';
import { MapPin, Building, Activity, Sparkles, Filter, X, ShieldCheck } from 'lucide-react';

interface CatalogueExplorerModalProps {
  onSelectDestination: (destName: string) => void;
}

export const CatalogueExplorerModal: React.FC<CatalogueExplorerModalProps> = ({
  onSelectDestination,
}) => {
  const [selectedType, setSelectedType] = useState<DestinationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDestId, setExpandedDestId] = useState<string | null>(null);

  const filtered = TRAVEL_CATALOGUE.filter((dest) => {
    if (selectedType !== 'all' && dest.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        dest.name.toLowerCase().includes(q) ||
        dest.region.toLowerCase().includes(q) ||
        dest.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Curated Local Inventory (34 Destinations)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Verified Catalogue Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Every single hotel and activity suggested by MMT Trip Assistant exists in this curated database with locked ₹ rates. Zero fabricated listings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Total:</span>
            <span className="px-3 py-1 bg-red-50 text-red-600 font-black text-sm rounded-xl border border-red-200">
              {TRAVEL_CATALOGUE.length} Destinations
            </span>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by city (e.g. Gokarna, Mysuru, Spiti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All (34)' },
              { id: 'offbeat', label: 'Offbeat Gems (10)' },
              { id: 'tier2', label: 'Tier-2 Towns (10)' },
              { id: 'metro', label: 'Metros (10)' },
              { id: 'international', label: 'International (4)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Destinations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dest) => {
          const isExpanded = expandedDestId === dest.id;
          const minHotelPrice = Math.min(...dest.hotels.map((h) => h.pricePerNightINR));
          const maxHotelPrice = Math.max(...dest.hotels.map((h) => h.pricePerNightINR));

          return (
            <div
              key={dest.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{dest.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          dest.type === 'offbeat'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dest.type === 'tier2'
                            ? 'bg-amber-100 text-amber-800'
                            : dest.type === 'metro'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {dest.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {dest.region}
                    </p>
                  </div>

                  {dest.hotels.length < 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      3 Stays
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {dest.description}
                </p>

                {/* Rates & Highlights */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Stays range:</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(minHotelPrice)} - {formatINR(maxHotelPrice)} / night
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Inventory:</span>
                    <span className="font-semibold text-slate-700">
                      {dest.hotels.length} hotels • {dest.activities.length} activities
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Catalogued Hotels ({dest.hotels.length}):
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {dest.hotels.map((h) => (
                          <div
                            key={h.id}
                            className="p-2 rounded-lg bg-slate-50 text-xs border border-slate-200/60 flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-800 truncate">{h.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-slate-500">{h.area}</span>
                                {h.kidFriendly && (
                                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded font-medium">
                                    Kid-Friendly
                                  </span>
                                )}
                                {isNewerListing(h.reviewCount) && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1 rounded font-medium">
                                    Newer listing
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 shrink-0 text-right">
                              {formatINR(h.pricePerNightINR)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Catalogued Activities ({dest.activities.length}):
                      </h4>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
                        {dest.activities.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none"
                          >
                            <span className="text-slate-700 truncate pr-2">{a.name}</span>
                            <span className="font-bold text-slate-900 shrink-0">
                              {a.costINR === 0 ? 'Free' : formatINR(a.costINR)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setExpandedDestId(isExpanded ? null : dest.id)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  {isExpanded ? 'Hide Details' : 'View Stays & Activities'}
                </button>
                <button
                  onClick={() => onSelectDestination(dest.name)}
                  className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Plan Trip Here
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
