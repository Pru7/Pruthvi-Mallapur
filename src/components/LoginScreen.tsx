import React, { useState } from 'react';
import { Compass, ShieldCheck, Sparkles, MapPin, CheckCircle2, IndianRupee, HeartHandshake } from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMsg(err.message || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* Top Banner Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                <span className="text-red-500">MakeMyTrip</span> Trip Assistant
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
                v2.0 • AI Edition
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Commercial Bias Active</span>
          </div>
        </div>
      </div>

      {/* Main Hero & Sign-in Box */}
      <div className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Product Value Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Travel Planning for Indian Travellers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Plan what <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">YOU asked for</span>, not what makes high commission.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Tired of standard booking engines pushing the same expensive, crowded commercial hotels in big cities? MMT Trip Assistant tailors verified, offbeat and value stays inside your exact ₹ budget.
            </p>

            {/* Persona Callout Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs">N</span>
                  <span>Like Neha (UX Designer, 29)</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Wants serene, low-crowd coastal or plantation retreats (Gokarna, Hampi, Varkala) comfortably within ₹25,000.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">R</span>
                  <span>Like Rajesh (Finance Mgr, 41)</span>
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  Plans 1-2 family trips/year. Strict ₹60k budget cap, kid-friendly stays only, zero surprise surge pricing.
                </p>
              </div>
            </div>

            {/* Guarantees */}
            <div className="space-y-2.5 pt-2 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>34 Handpicked destinations: 10 Metros, 10 Tier-2, 10 Offbeat gems + 4 International</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real catalogue only: Zero hallucinated hotels, activities, or prices</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Privacy First: Automatic redaction of phone numbers & Aadhaar-like IDs</span>
              </div>
            </div>
          </div>

          {/* Right Column: Google Sign-in Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 text-slate-900 shadow-2xl shadow-black/50 border border-slate-100 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Sign in to Continue</h2>
                <p className="text-xs text-slate-500">
                  Save your personalized itineraries, resume planning drafts, and manage your trips securely.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center space-y-1">
                <p>🔒 Secured by Firebase Authentication</p>
                <p>Private Firestore documents accessible only to your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/30 py-4 text-center text-xs text-slate-500">
        MMT Trip Assistant • Designed for Indian Travellers seeking authentic, crowd-free experiences.
      </footer>
    </div>
  );
};
