import React from 'react';
import { Sparkles, UserCheck, Heart, Users2, ShieldAlert } from 'lucide-react';
import { PlanRequestParams } from '../services/catalogEngine';

interface PersonaPresetsProps {
  onSelectPreset: (params: PlanRequestParams) => void;
}

export const PersonaPresets: React.FC<PersonaPresetsProps> = ({ onSelectPreset }) => {
  const getDates = (daysCount: number) => {
    const today = new Date();
    const start = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    const end = new Date(start.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const presets = [
    {
      id: 'neha',
      title: 'Neha\'s Escape (Bengaluru UX Designer, 29)',
      badge: 'Offbeat Beach & Low-Crowd',
      description: 'Frustrated by crowded commercial resorts. Wants quiet beaches, offbeat stays, and peaceful cliff walks under ₹25,000.',
      color: 'from-rose-500 to-red-600',
      data: {
        destinationInput: 'Gokarna',
        ...getDates(3),
        budgetINR: 25000,
        travellerType: 'Couple' as const,
        travellerCount: 2,
        preferencesText: 'Quiet beaches, low crowd stays, peaceful walks, no noisy resorts, good local food from Bengaluru',
      },
    },
    {
      id: 'rajesh',
      title: 'Rajesh\'s Family Plan (Pune Finance Mgr, 41)',
      badge: 'Kid-Friendly & Budget-Capped',
      description: 'Fears overspending and tourist traps. Wants kid-friendly hotel with heritage sights, gentle pacing under ₹60,000.',
      color: 'from-blue-600 to-indigo-600',
      data: {
        destinationInput: 'Mysuru',
        ...getDates(4),
        budgetINR: 60000,
        travellerType: 'Family' as const,
        travellerCount: 4,
        preferencesText: 'Family of 4 with young kids, kid-friendly hotels only, relaxed daily pace, royal palaces and nature walks under budget',
      },
    },
    {
      id: 'spiti_edge',
      title: 'Spiti Valley Mountain Discovery',
      badge: '3-Hotel Edge Case Test',
      description: 'Tests curated destination with exactly 3 catalogued homestays, high altitude views, and nearby alternative suggestions.',
      color: 'from-amber-500 to-orange-600',
      data: {
        destinationInput: 'Spiti Valley',
        ...getDates(4),
        budgetINR: 35000,
        travellerType: 'Solo' as const,
        travellerCount: 1,
        preferencesText: 'High altitude monasteries, stargazing, authentic village homestay, cold desert exploration',
      },
    },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Quick Persona Pre-Sets (Tested Scenarios)
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Click any persona to auto-populate preferences
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => onSelectPreset(preset.data)}
            className="group relative p-4.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-red-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  {preset.badge}
                </span>
                <span className="text-xs font-black text-emerald-400">
                  ₹{preset.data.budgetINR.toLocaleString('en-IN')}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                {preset.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {preset.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>{preset.data.destinationInput} • {preset.data.travellerType}</span>
              <span className="text-red-400 font-bold group-hover:translate-x-1 transition-transform">
                Load Preset →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
