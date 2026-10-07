import React from 'react';
import { User } from 'firebase/auth';
import { Compass, Luggage, PlusCircle, Trash2, LogOut, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { getFirstName } from '../lib/formatters';

interface NavbarProps {
  user: User;
  currentTab: 'plan' | 'trips' | 'catalogue';
  setCurrentTab: (tab: 'plan' | 'trips' | 'catalogue') => void;
  savedTripsCount: number;
  onOpenDeleteDataModal: () => void;
  onSignOut: () => void;
  onNewTrip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  setCurrentTab,
  savedTripsCount,
  onOpenDeleteDataModal,
  onSignOut,
  onNewTrip,
}) => {
  const firstName = getFirstName(user.displayName, user.email);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('plan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  <span className="text-red-600">MMT</span> Trip Assistant
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Bias-Free
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Authentic Indian Travel • Real Catalogue Stays
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                onNewTrip();
                setCurrentTab('plan');
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'plan'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plan Trip</span>
            </button>

            <button
              onClick={() => setCurrentTab('trips')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'trips'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Luggage className="w-4 h-4" />
              <span>My Trips</span>
              {savedTripsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-red-600 text-white">
                  {savedTripsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('catalogue')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'catalogue'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>34 Destinations</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                  {firstName.charAt(0)}
                </div>
              )}
              <div className="hidden lg:block text-left leading-tight">
                <span className="text-xs font-semibold text-slate-800 block">
                  Namaste, {firstName}!
                </span>
                <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenDeleteDataModal}
              title="Delete my data (GDPR / Privacy)"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onSignOut}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
