import React, { useState, useEffect } from 'react';
import { TravellerType, GeneratedItinerary, PlannerDraft } from '../types/travel';
import { PlanRequestParams, ClarificationQuestion } from '../services/catalogEngine';
import { requestClarifications, requestTripPlan } from '../services/apiClient';
import { sanitizeFreeText } from '../lib/privacy';
import { formatINR, calculateTripDays } from '../lib/formatters';
import { PersonaPresets } from './PersonaPresets';
import {
  Compass,
  Sparkles,
  Calendar,
  Users,
  IndianRupee,
  MapPin,
  Send,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Bot,
  User as UserIcon,
  HelpCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ChatPlannerProps {
  onPlanGenerated: (itinerary: GeneratedItinerary, params: PlanRequestParams) => void;
  onDraftAutoSave: (draftData: Partial<PlannerDraft>) => void;
  initialDraft?: PlannerDraft | null;
}

export const ChatPlanner: React.FC<ChatPlannerProps> = ({
  onPlanGenerated,
  onDraftAutoSave,
  initialDraft,
}) => {
  // Form State
  const [destinationInput, setDestinationInput] = useState(
    initialDraft?.formData?.destinationInput || ''
  );
  const [startDate, setStartDate] = useState(initialDraft?.formData?.startDate || '');
  const [endDate, setEndDate] = useState(initialDraft?.formData?.endDate || '');
  const [budgetINR, setBudgetINR] = useState<number>(
    initialDraft?.formData?.budgetINR || 25000
  );
  const [travellerType, setTravellerType] = useState<TravellerType>(
    initialDraft?.formData?.travellerType || 'Couple'
  );
  const [travellerCount, setTravellerCount] = useState<number>(
    initialDraft?.formData?.travellerCount || 2
  );
  const [preferencesText, setPreferencesText] = useState(
    initialDraft?.formData?.preferencesText || ''
  );

  // Chat & Follow-up State
  const [messages, setMessages] = useState<
    {
      role: 'assistant' | 'user';
      content: string;
      quickReplies?: string[];
      questionId?: string;
    }[]
  >(
    initialDraft?.chatHistory?.length
      ? initialDraft.chatHistory
      : [
          {
            role: 'assistant',
            content:
              'Namaste! I am your MakeMyTrip personal assistant. Tell me where you’d like to go (or type "suggest for me"), your dates, budget in ₹, and vibe. I will craft a bias-free itinerary from real, verified stays.',
            quickReplies: [
              'Suggest for me: Quiet beaches',
              'Suggest for me: Misty hill stations',
              'Gokarna 3 days',
              'Mysuru family trip',
            ],
          },
        ]
  );

  const [activeQuestions, setActiveQuestions] = useState<ClarificationQuestion[]>([]);
  const [destinationNote, setDestinationNote] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasRedactedPII, setHasRedactedPII] = useState(false);
  const [draftResumeNotice, setDraftResumeNotice] = useState(Boolean(initialDraft));

  // Initialize dates with defaults if empty
  useEffect(() => {
    if (!startDate) {
      const today = new Date();
      const start = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, []);

  // Auto-save draft on form or chat change
  useEffect(() => {
    const timer = setTimeout(() => {
      onDraftAutoSave({
        step: 'conversation',
        formData: {
          destinationInput,
          startDate,
          endDate,
          budgetINR,
          travellerType,
          travellerCount,
          preferencesText,
        },
        chatHistory: messages,
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [
    destinationInput,
    startDate,
    endDate,
    budgetINR,
    travellerType,
    travellerCount,
    preferencesText,
    messages,
  ]);

  // Privacy monitoring on preferences text
  const handlePreferencesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const { sanitized, hadRedactions } = sanitizeFreeText(rawVal);
    setPreferencesText(rawVal);
    setHasRedactedPII(hadRedactions);
  };

  // Preset Selection
  const handleSelectPreset = (preset: PlanRequestParams) => {
    setDestinationInput(preset.destinationInput);
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
    setBudgetINR(preset.budgetINR);
    setTravellerType(preset.travellerType);
    setTravellerCount(preset.travellerCount);
    setPreferencesText(preset.preferencesText);
    setDraftResumeNotice(false);

    // Add assistant acknowledgment to chat
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `Loaded pre-set for ${preset.destinationInput}: ${preset.travellerType}, ₹${preset.budgetINR.toLocaleString('en-IN')}`,
      },
      {
        role: 'assistant',
        content: `Great choice! I have configured the parameters for ${preset.destinationInput} (${preset.travellerType}, ₹${preset.budgetINR.toLocaleString('en-IN')}). Ready whenever you are to build your day-by-day plan.`,
        quickReplies: ['Generate Itinerary Now', 'Add more preferences'],
      },
    ]);
  };

  // Submit / Clarify Flow
  const handlePlanSubmit = async () => {
    // 1. Sanitize text
    const { sanitized, hadRedactions } = sanitizeFreeText(preferencesText);
    if (hadRedactions) {
      setHasRedactedPII(true);
    }

    const currentParams: PlanRequestParams = {
      destinationInput: destinationInput.trim() || 'suggest for me',
      startDate,
      endDate,
      budgetINR: Number(budgetINR) || 25000,
      travellerType,
      travellerCount: Number(travellerCount) || 1,
      preferencesText: sanitized,
    };

    setIsAnalyzing(true);

    try {
      // Check for clarifications or edge cases (up to 3 questions)
      const clarification = await requestClarifications(currentParams);

      if (clarification.destinationNote) {
        setDestinationNote(clarification.destinationNote);
      }

      if (clarification.needsClarification && clarification.questions.length > 0) {
        setActiveQuestions(clarification.questions);

        // Add assistant questions to conversation
        const assistantMsgs = clarification.questions.map((q) => ({
          role: 'assistant' as const,
          content: q.question,
          quickReplies: q.quickReplies,
          questionId: q.id,
        }));

        setMessages((prev) => [
          ...prev,
          {
            role: 'user',
            content: `Planning trip to ${currentParams.destinationInput} (Budget: ${formatINR(currentParams.budgetINR)}, ${currentParams.travellerType})`,
          },
          {
            role: 'assistant',
            content: clarification.message,
          },
          ...assistantMsgs,
        ]);
        setIsAnalyzing(false);
        return;
      }

      // If no clarification needed, proceed directly to full generation!
      await triggerFullGeneration(currentParams);
    } catch (err) {
      console.error('Clarification error:', err);
      // Fallback directly to generation
      await triggerFullGeneration(currentParams);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFullGeneration = async (params: PlanRequestParams) => {
    setIsGenerating(true);
    try {
      const plan = await requestTripPlan(params);
      onPlanGenerated(plan, params);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Quick Reply Pill click from assistant message
  const handleQuickReplyClick = async (reply: string, questionId?: string) => {
    // Append user answer to conversation
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: reply,
      },
    ]);

    // Apply answer to form fields if applicable
    if (questionId === 'pref_budget' || reply.startsWith('₹')) {
      const num = parseInt(reply.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) setBudgetINR(num);
    } else if (questionId === 'choose_alternative') {
      setDestinationInput(reply);
    } else if (questionId === 'pref_vibe') {
      setPreferencesText((prev) => `${prev} ${reply}`.trim());
    } else if (reply.includes('Quiet beaches')) {
      setDestinationInput('Gokarna');
      setPreferencesText((prev) => `${prev} quiet beaches`.trim());
    } else if (reply.includes('Misty hill')) {
      setDestinationInput('Chikmagalur');
      setPreferencesText((prev) => `${prev} misty mountain coffee hills`.trim());
    } else if (reply.includes('Gokarna 3 days')) {
      setDestinationInput('Gokarna');
    } else if (reply.includes('Mysuru family')) {
      setDestinationInput('Mysuru');
      setTravellerType('Family');
      setTravellerCount(4);
    } else if (reply === 'Generate Itinerary Now') {
      handlePlanSubmit();
      return;
    }

    // Dismiss this question from active questions
    if (questionId) {
      setActiveQuestions((prev) => prev.filter((q) => q.id !== questionId));
    }

    // Re-check if ready to generate
    const currentParams: PlanRequestParams = {
      destinationInput: (destinationInput || reply).trim(),
      startDate,
      endDate,
      budgetINR: Number(budgetINR) || 25000,
      travellerType,
      travellerCount: Number(travellerCount) || 1,
      preferencesText: `${preferencesText} ${reply}`.trim(),
    };

    // If active questions are finished, trigger generation!
    if (activeQuestions.length <= 1) {
      await triggerFullGeneration(currentParams);
    }
  };

  const tripDays = calculateTripDays(startDate, endDate);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Draft Resume Notice */}
      {draftResumeNotice && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Draft resumed:</strong> We reloaded your previous planning session from Firestore where you stopped.
            </span>
          </div>
          <button
            onClick={() => setDraftResumeNotice(false)}
            className="text-red-700 font-bold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Persona Pre-Sets Section */}
      <PersonaPresets onSelectPreset={handleSelectPreset} />

      {/* Main Interactive Planning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Where would you like to travel?
            </h2>
            <p className="text-xs text-slate-500">
              Input destination, dates, budget in ₹, and travellers. No commercial ranking bias.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Destination Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  Destination
                </span>
                <button
                  type="button"
                  onClick={() => setDestinationInput('Suggest for me (Offbeat & Tier-2)')}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline"
                >
                  Suggest for me
                </button>
              </label>
              <input
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="e.g. Gokarna, Mysuru, Hampi, Spiti Valley or 'Suggest for me'..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Destination Edge Note (e.g. Spiti Valley < 5 hotels, or unknown) */}
            {destinationNote && (
              <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{destinationNote}</span>
              </div>
            )}

            {/* 2. Travel Dates & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-red-600" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>End Date</span>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    {tripDays} {tripDays === 1 ? 'Day' : 'Days'}
                  </span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* 3. Budget in INR (₹) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-red-600" />
                  Trip Budget (in Indian Rupees ₹)
                </label>
                <span className="text-sm font-black text-slate-900">
                  {formatINR(budgetINR)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[15000, 25000, 50000, 75000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBudgetINR(preset)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      budgetINR === preset
                        ? 'bg-red-50 text-red-600 border-red-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {formatINR(preset)}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min={5000}
                max={500000}
                step={1000}
                value={budgetINR}
                onChange={(e) => setBudgetINR(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                placeholder="Or enter custom budget (e.g. 60000)"
              />
            </div>

            {/* 4. Traveller Type & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-red-600" />
                  Traveller Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Solo', 'Couple', 'Family', 'Group'] as TravellerType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setTravellerType(type);
                        if (type === 'Solo') setTravellerCount(1);
                        else if (type === 'Couple') setTravellerCount(2);
                        else if (type === 'Family') setTravellerCount(4);
                      }}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        travellerType === type
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Number of Travellers
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={travellerCount}
                  onChange={(e) => setTravellerCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Counts only. We never collect traveller names.
                </span>
              </div>
            </div>

            {/* 5. Free-Text Preferences with Privacy Scanning */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Free-Text Preferences & Style
                </label>
                <span className="text-[11px] text-amber-600 font-medium">
                  Don't enter phone, ID or payment details
                </span>
              </div>

              <textarea
                rows={3}
                value={preferencesText}
                onChange={handlePreferencesChange}
                placeholder="e.g. Quiet beaches, low-crowd stays, vegetarian local food, gentle pace with kids..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
              />

              {hasRedactedPII && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Privacy Shield Active: Phone/ID patterns detected were automatically redacted before processing.
                  </span>
                </div>
              )}
            </div>

            {/* Main Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlanSubmit}
                disabled={isAnalyzing || isGenerating}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {isAnalyzing || isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {isAnalyzing ? 'Analyzing Preferences...' : 'Building Verified Catalogue Itinerary...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Compass className="w-5 h-5" />
                    <span>Generate Personalized Itinerary</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Assistant Dialogue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Assistant Conversation
                </h3>
                <p className="text-[10px] text-slate-400">
                  Follow-up questions & clarification
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Assistant
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[520px] pr-1 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed space-y-2.5 ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/70 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Clickable Quick Reply Chips */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleQuickReplyClick(reply, msg.questionId)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {(isAnalyzing || isGenerating) && (
              <div className="flex gap-2.5 justify-start animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-500 border border-slate-200">
                  Checking catalogued inventory and calibrating budget...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
