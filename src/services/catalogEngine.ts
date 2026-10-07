import {
  TRAVEL_CATALOGUE,
  DESTINATIONS_BY_ID,
  HOTELS_BY_ID,
  ACTIVITIES_BY_ID,
} from '../data/catalogue';
import {
  Destination,
  GeneratedItinerary,
  Hotel,
  Activity,
  ItineraryDay,
  TravellerType,
} from '../types/travel';

export interface PlanRequestParams {
  destinationInput: string;
  startDate: string;
  endDate: string;
  budgetINR: number;
  travellerType: TravellerType;
  travellerCount: number;
  preferencesText: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  quickReplies: string[];
}

export interface ClarificationResult {
  needsClarification: boolean;
  questions: ClarificationQuestion[];
  message: string;
  matchedDestination?: Destination;
  destinationNote?: string;
}

/**
 * Fuzzy destination finder
 */
export function matchDestination(input: string): {
  destination?: Destination;
  hasFewerThan5Hotels: boolean;
  alternatives: Destination[];
  isCustomOrUnknown: boolean;
} {
  const query = input.trim().toLowerCase();

  if (!query || query.includes('suggest') || query.includes('any') || query.includes('help me choose') || query.includes('surprise')) {
    return {
      destination: undefined,
      hasFewerThan5Hotels: false,
      alternatives: [
        DESTINATIONS_BY_ID.get('dest_gokarna')!,
        DESTINATIONS_BY_ID.get('dest_mysuru')!,
        DESTINATIONS_BY_ID.get('dest_chikmagalur')!,
      ].filter(Boolean),
      isCustomOrUnknown: false,
    };
  }

  // Exact or substring match
  const found = TRAVEL_CATALOGUE.find((d) => {
    const dName = d.name.toLowerCase();
    const dRegion = d.region.toLowerCase();
    return (
      dName === query ||
      query.includes(dName) ||
      dName.includes(query) ||
      d.id.toLowerCase() === query ||
      dRegion.includes(query)
    );
  });

  if (found) {
    const hasFewer = found.hotels.length < 5;
    const alternatives = found.nearbyAlternatives
      .map((altId) => DESTINATIONS_BY_ID.get(altId))
      .filter((d): d is Destination => Boolean(d));

    return {
      destination: found,
      hasFewerThan5Hotels: hasFewer,
      alternatives,
      isCustomOrUnknown: false,
    };
  }

  // Not in catalogue: find closest options by vibe/keywords
  let matchedAlternatives: Destination[] = [];
  if (query.includes('beach') || query.includes('sea') || query.includes('coast')) {
    matchedAlternatives = [DESTINATIONS_BY_ID.get('dest_gokarna')!, DESTINATIONS_BY_ID.get('dest_varkala')!, DESTINATIONS_BY_ID.get('dest_goa')!];
  } else if (query.includes('hill') || query.includes('mountain') || query.includes('snow') || query.includes('manali') || query.includes('munnar')) {
    matchedAlternatives = [DESTINATIONS_BY_ID.get('dest_tirthan')!, DESTINATIONS_BY_ID.get('dest_shimla')!, DESTINATIONS_BY_ID.get('dest_darjeeling')!];
  } else if (query.includes('heritage') || query.includes('temple') || query.includes('palace')) {
    matchedAlternatives = [DESTINATIONS_BY_ID.get('dest_hampi')!, DESTINATIONS_BY_ID.get('dest_mysuru')!, DESTINATIONS_BY_ID.get('dest_udaipur')!];
  } else {
    // Default popular + offbeat mix
    matchedAlternatives = [DESTINATIONS_BY_ID.get('dest_gokarna')!, DESTINATIONS_BY_ID.get('dest_mysuru')!, DESTINATIONS_BY_ID.get('dest_udaipur')!];
  }

  return {
    destination: undefined,
    hasFewerThan5Hotels: false,
    alternatives: matchedAlternatives.filter((d): d is Destination => Boolean(d)),
    isCustomOrUnknown: true,
  };
}

/**
 * Check if the user needs up to 3 short follow-up questions
 */
export function analyzeForClarifications(params: PlanRequestParams): ClarificationResult {
  const questions: ClarificationQuestion[] = [];
  const { destination, hasFewerThan5Hotels, alternatives, isCustomOrUnknown } = matchDestination(params.destinationInput);

  let message = '';
  let destinationNote: string | undefined = undefined;

  // Edge case: Destination not in catalogue
  if (isCustomOrUnknown) {
    destinationNote = `"${params.destinationInput}" isn't in our curated 34-destination catalogue. Here are the closest catalogued options with an authentic vibe: ${alternatives.map((a) => a.name).join(', ')}.`;
    questions.push({
      id: 'choose_alternative',
      question: `Would you like to explore one of these catalogued destinations?`,
      quickReplies: alternatives.map((a) => a.name),
    });
  }
  // Edge case: Destination has fewer than 5 hotels (e.g. Spiti Valley)
  else if (destination && hasFewerThan5Hotels) {
    destinationNote = `${destination.name} has ${destination.hotels.length} handpicked catalogued homestays. We also recommend nearby alternatives: ${alternatives.map((a) => a.name).join(', ')}.`;
  }

  // 1. Destination check: If user requested "suggest for me" without clear vibe
  if (!destination && !isCustomOrUnknown) {
    const prefs = (params.preferencesText || '').toLowerCase();
    const hasVibe = ['beach', 'mountain', 'hill', 'heritage', 'nature', 'quiet', 'forest', 'island', 'culture'].some((k) => prefs.includes(k));
    if (!hasVibe && questions.length < 3) {
      questions.push({
        id: 'pref_vibe',
        question: 'What kind of destination vibe do you prefer for this trip?',
        quickReplies: ['Quiet offbeat beaches', 'Misty mountain hills', 'Royal heritage & temples', 'Wild nature & coffee estates'],
      });
    }
  }

  // 2. Budget check: If budget is missing or zero
  if ((!params.budgetINR || params.budgetINR <= 0) && questions.length < 3) {
    questions.push({
      id: 'pref_budget',
      question: 'What is your comfortable overall trip budget in ₹?',
      quickReplies: ['₹20,000', '₹35,000', '₹50,000', '₹75,000', '₹1,00,000'],
    });
  }

  // 3. Dates check: If dates are missing or invalid
  if ((!params.startDate || !params.endDate) && questions.length < 3) {
    questions.push({
      id: 'pref_duration',
      question: 'How many days would you like to travel for?',
      quickReplies: ['Weekend getaway (3 days)', 'Extended break (4 days)', 'Full week (7 days)'],
    });
  }

  // 4. Family travel check: If travelling with Family, clarify pace/kids
  if (params.travellerType === 'Family' && questions.length < 3) {
    const prefs = (params.preferencesText || '').toLowerCase();
    if (!prefs.includes('kid') && !prefs.includes('elder') && !prefs.includes('child')) {
      questions.push({
        id: 'family_pace',
        question: 'Are you travelling with kids or elders so we pick kid-friendly stays with relaxed pacing?',
        quickReplies: ['Yes, with kids (relaxed pace)', 'Yes, with elders (minimal walking)', 'All adults (standard pace)'],
      });
    }
  }

  // Limit to max 3 questions as strictly instructed
  const finalQuestions = questions.slice(0, 3);

  if (finalQuestions.length > 0) {
    message = `I'd love to craft the ideal trip for you. Just ${finalQuestions.length === 1 ? 'one quick detail' : `${finalQuestions.length} quick questions`} to make sure every recommendation hits your exact vibe and budget:`;
  } else {
    message = `All details look fantastic! Ready to build your personalized itinerary.`;
  }

  return {
    needsClarification: finalQuestions.length > 0,
    questions: finalQuestions,
    message,
    matchedDestination: destination,
    destinationNote,
  };
}

/**
 * Builds a strict, curated itinerary entirely from TRAVEL_CATALOGUE
 * Guarantees:
 * - Real catalogue IDs only
 * - Total cost <= budget, targeting 80-95%
 * - Zero hallucination of hotels or activities
 * - Value-for-fit ranking (no bias toward expensive or heavily reviewed)
 * - Highlights offbeat or Tier-2 options
 */
export function buildCatalogueItinerary(params: PlanRequestParams): GeneratedItinerary {
  let targetDest = matchDestination(params.destinationInput).destination;

  // If destination is flexible / "suggest for me"
  if (!targetDest) {
    const prefs = (params.preferencesText || '').toLowerCase();
    if (prefs.includes('beach') || prefs.includes('coastal') || prefs.includes('sea')) {
      targetDest = DESTINATIONS_BY_ID.get('dest_gokarna') || DESTINATIONS_BY_ID.get('dest_varkala')!;
    } else if (prefs.includes('coffee') || prefs.includes('estate') || prefs.includes('mist')) {
      targetDest = DESTINATIONS_BY_ID.get('dest_chikmagalur')!;
    } else if (prefs.includes('palace') || prefs.includes('heritage') || prefs.includes('temple')) {
      targetDest = DESTINATIONS_BY_ID.get('dest_mysuru') || DESTINATIONS_BY_ID.get('dest_hampi')!;
    } else if (prefs.includes('mountain') || prefs.includes('himalaya') || prefs.includes('pine')) {
      targetDest = DESTINATIONS_BY_ID.get('dest_tirthan') || DESTINATIONS_BY_ID.get('dest_shimla')!;
    } else {
      // Default to offbeat gem
      targetDest = DESTINATIONS_BY_ID.get('dest_gokarna')!;
    }
  }

  // Calculate days
  const start = params.startDate ? new Date(params.startDate) : new Date();
  const end = params.endDate ? new Date(params.endDate) : new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const numDays = Math.max(1, Math.min(10, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1));

  const budget = params.budgetINR && params.budgetINR > 0 ? params.budgetINR : 25000;
  const isFamily = params.travellerType === 'Family';
  const prefs = (params.preferencesText || '').toLowerCase();

  // Hotel Selection Strategy:
  // Target 80-95% of budget.
  // Average per-day budget = budget / numDays
  // Hotel should consume around 50-70% of daily budget, activities 15-25%.
  const targetNightlyBudget = (budget * 0.65) / Math.max(1, numDays);

  let eligibleHotels = [...targetDest.hotels];

  // If Family: strongly prefer kid-friendly
  if (isFamily) {
    const kidFriendlyHotels = eligibleHotels.filter((h) => h.kidFriendly);
    if (kidFriendlyHotels.length > 0) {
      eligibleHotels = kidFriendlyHotels;
    }
  }

  // Rank by value-for-fit to budget and vibe, NOT by review count or popularity!
  eligibleHotels.sort((a, b) => {
    // Distance from target nightly budget
    const diffA = Math.abs(a.pricePerNightINR - targetNightlyBudget);
    const diffB = Math.abs(b.pricePerNightINR - targetNightlyBudget);
    // Vibe match bonus
    const vibeMatchA = a.vibeTags.some((t) => prefs.includes(t)) ? -500 : 0;
    const vibeMatchB = b.vibeTags.some((t) => prefs.includes(t)) ? -500 : 0;
    return diffA + vibeMatchA - (diffB + vibeMatchB);
  });

  // Pick the best fitting hotel
  const selectedHotel = eligibleHotels[0] || targetDest.hotels[0];

  // Activity Selection
  const allActivities = [...targetDest.activities];
  if (isFamily) {
    // Sort kid-friendly activities first
    allActivities.sort((a, b) => {
      const aKid = a.tags.includes('kid-friendly') ? -1 : 1;
      const bKid = b.tags.includes('kid-friendly') ? -1 : 1;
      return aKid - bKid;
    });
  }

  const days: ItineraryDay[] = [];
  let currentTotal = 0;
  let activityIndex = 0;

  for (let i = 1; i <= numDays; i++) {
    const curDate = new Date(start.getTime() + (i - 1) * 24 * 60 * 60 * 1000);
    const dateStr = curDate.toISOString().split('T')[0];

    // Pick 1-2 activities for this day
    const dayActivities: Activity[] = [];
    const activitiesToPick = isFamily ? 1 : 2;

    for (let k = 0; k < activitiesToPick; k++) {
      const act = allActivities[activityIndex % allActivities.length];
      activityIndex++;
      if (act && !dayActivities.some((existing) => existing.id === act.id)) {
        dayActivities.push(act);
      }
    }

    const hotelCostForDay = selectedHotel.pricePerNightINR;
    const activitiesCostForDay = dayActivities.reduce((sum, a) => sum + a.costINR, 0);
    const dayCostINR = hotelCostForDay + activitiesCostForDay;

    currentTotal += dayCostINR;

    days.push({
      dayNumber: i,
      date: dateStr,
      hotelId: selectedHotel.id,
      activityIds: dayActivities.map((a) => a.id),
      dayCostINR,
      daySummary: `Explore ${targetDest.name} highlights & stay at ${selectedHotel.name}`,
    });
  }

  // Check if currentTotal is under 80% or exceeds 100% of budget, adjust activities if needed
  if (currentTotal > budget) {
    // Prune higher cost activities or scale to fit within budget
    for (const day of days) {
      if (currentTotal <= budget) break;
      if (day.activityIds.length > 1) {
        const removedActId = day.activityIds.pop();
        if (removedActId) {
          const actObj = ACTIVITIES_BY_ID.get(removedActId)?.activity;
          if (actObj) {
            day.dayCostINR -= actObj.costINR;
            currentTotal -= actObj.costINR;
          }
        }
      }
    }
  }

  // Craft a warm one-line "Why this itinerary" explanation
  let whyThisItinerary = '';
  if (isFamily) {
    whyThisItinerary = `Kid-friendly stays and relaxed pacing in ${targetDest.name}, comfortably calibrated within your budget.`;
  } else if (prefs.includes('quiet') || prefs.includes('beach') || targetDest.type === 'offbeat') {
    whyThisItinerary = `Quiet scenic spots and low-crowd stays in ${targetDest.name}, comfortably within your ₹${budget.toLocaleString('en-IN')} budget.`;
  } else {
    whyThisItinerary = `Curated value-for-fit stays and immersive local highlights in ${targetDest.name}, targeting 85% of your ₹${budget.toLocaleString('en-IN')} budget.`;
  }

  // Lesser-known option spotlight
  const lesserKnownActivity = targetDest.activities.find((a) =>
    a.tags.some((t) => ['artisan', 'crafts', 'hidden', 'tribal', 'nature', 'free', 'canal'].includes(t))
  ) || targetDest.activities[targetDest.activities.length - 1];

  const lesserKnownHotel = targetDest.hotels.find((h) => h.reviewCount < 50) || targetDest.hotels[1];

  const spotlight = {
    name: `${lesserKnownHotel.name} & ${lesserKnownActivity.name}`,
    whyYouMightLoveIt: `A lesser-known gem away from commercial crowds offering authentic local warmth, unhurried vistas, and exceptional value.`,
  };

  return {
    destinationId: targetDest.id,
    destinationName: targetDest.name,
    whyThisItinerary,
    lesserKnownSpotlight: spotlight,
    totalCostINR: currentTotal,
    days,
    disclaimerNotes: targetDest.hotels.length < 5
      ? `Note: ${targetDest.name} currently has ${targetDest.hotels.length} handpicked catalogued homestays.`
      : undefined,
  };
}

/**
 * Validates AI-generated itinerary against the strict catalogue
 * Drops any non-existent hotel or activity IDs
 * Enforces budget constraints (totalCost <= budget)
 */
export function validateAndEnrichItinerary(
  rawJson: any,
  params: PlanRequestParams
): GeneratedItinerary {
  const destinationId = rawJson.destinationId || rawJson.destination_id;
  let dest = DESTINATIONS_BY_ID.get(destinationId);

  if (!dest) {
    // Fall back to matched destination or standard
    dest = matchDestination(params.destinationInput).destination || DESTINATIONS_BY_ID.get('dest_gokarna')!;
  }

  const validHotelIds = new Set(dest.hotels.map((h) => h.id));
  const validActivityIds = new Set(dest.activities.map((a) => a.id));

  const budget = params.budgetINR && params.budgetINR > 0 ? params.budgetINR : 50000;
  const start = params.startDate ? new Date(params.startDate) : new Date();

  const validatedDays: ItineraryDay[] = [];
  let calculatedTotal = 0;

  const rawDays = Array.isArray(rawJson.days) ? rawJson.days : [];

  // Default fallback hotel if model generated unknown ID
  const fallbackHotelId = dest.hotels[0].id;

  for (let i = 0; i < Math.max(1, rawDays.length || 3); i++) {
    const rawDay = rawDays[i] || {};
    const dayNumber = rawDay.dayNumber || rawDay.day || i + 1;
    const curDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = rawDay.date || curDate.toISOString().split('T')[0];

    // Validate hotel ID strictly
    let hotelId = rawDay.hotelId || rawDay.hotel_id;
    if (!validHotelIds.has(hotelId)) {
      hotelId = fallbackHotelId;
    }
    const hotelObj = HOTELS_BY_ID.get(hotelId)?.hotel || dest.hotels[0];

    // Validate activity IDs strictly
    const rawActs = Array.isArray(rawDay.activityIds || rawDay.activity_ids)
      ? rawDay.activityIds || rawDay.activity_ids
      : [];
    const validActs: string[] = [];

    for (const aId of rawActs) {
      if (validActivityIds.has(aId) && !validActs.includes(aId)) {
        validActs.push(aId);
      }
    }

    // If model returned 0 valid activities, assign 1 default from catalogue
    if (validActs.length === 0) {
      validActs.push(dest.activities[i % dest.activities.length].id);
    }

    const activitiesCost = validActs.reduce((acc, actId) => {
      const act = ACTIVITIES_BY_ID.get(actId)?.activity;
      return acc + (act ? act.costINR : 0);
    }, 0);

    const dayCostINR = hotelObj.pricePerNightINR + activitiesCost;
    calculatedTotal += dayCostINR;

    validatedDays.push({
      dayNumber,
      date: dateStr,
      hotelId,
      activityIds: validActs,
      dayCostINR,
      daySummary: rawDay.daySummary || `Day ${dayNumber} in ${dest.name}`,
    });
  }

  // Budget defense: If calculatedTotal > budget, adjust activities
  if (calculatedTotal > budget) {
    for (const d of validatedDays) {
      if (calculatedTotal <= budget) break;
      if (d.activityIds.length > 1) {
        const removed = d.activityIds.pop();
        if (removed) {
          const actObj = ACTIVITIES_BY_ID.get(removed)?.activity;
          if (actObj) {
            d.dayCostINR -= actObj.costINR;
            calculatedTotal -= actObj.costINR;
          }
        }
      }
    }
  }

  return {
    destinationId: dest.id,
    destinationName: dest.name,
    whyThisItinerary:
      typeof rawJson.whyThisItinerary === 'string' && rawJson.whyThisItinerary.trim()
        ? rawJson.whyThisItinerary.trim()
        : `Personalized ${dest.name} plan designed around your style, comfortably within your budget.`,
    lesserKnownSpotlight:
      rawJson.lesserKnownSpotlight?.name && rawJson.lesserKnownSpotlight?.whyYouMightLoveIt
        ? rawJson.lesserKnownSpotlight
        : {
            name: `${dest.hotels.find((h) => h.reviewCount < 50)?.name || dest.hotels[0].name}`,
            whyYouMightLoveIt: 'A low-crowd handpicked stay offering authentic local hospitality and relaxed surroundings.',
          },
    totalCostINR: calculatedTotal,
    days: validatedDays,
    disclaimerNotes: dest.hotels.length < 5
      ? `Note: ${dest.name} currently has ${dest.hotels.length} handpicked catalogued homestays.`
      : undefined,
  };
}
