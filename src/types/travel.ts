export type DestinationType = 'metro' | 'tier2' | 'offbeat' | 'international';
export type TravellerType = 'Solo' | 'Couple' | 'Family' | 'Group';

export interface Hotel {
  id: string;
  name: string;
  pricePerNightINR: number;
  reviewCount: number;
  kidFriendly: boolean;
  vibeTags: string[];
  area?: string;
  rating?: number;
}

export interface Activity {
  id: string;
  name: string;
  costINR: number;
  durationHours: number;
  tags: string[];
  description?: string;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  type: DestinationType;
  popularityRank: number;
  description: string;
  highlights: string[];
  nearbyAlternatives: string[]; // Destination IDs
  hotels: Hotel[];
  activities: Activity[];
}

export interface ItineraryItemBooking {
  itemId: string;
  itemType: 'hotel' | 'activity';
  name: string;
  costINR: number;
  isSaved?: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  hotelId: string;
  activityIds: string[];
  dayCostINR: number;
  daySummary?: string;
  notes?: string;
}

export interface GeneratedItinerary {
  destinationId: string;
  destinationName: string;
  whyThisItinerary: string;
  lesserKnownSpotlight?: {
    name: string;
    whyYouMightLoveIt: string;
  };
  totalCostINR: number;
  days: ItineraryDay[];
  disclaimerNotes?: string;
}

export interface TripPlan {
  id: string;
  userId: string;
  destinationId: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  budgetINR: number;
  travellerType: TravellerType;
  travellerCount: number;
  preferencesText: string;
  whyThisItinerary: string;
  lesserKnownSpotlight?: {
    name: string;
    whyYouMightLoveIt: string;
  };
  totalCostINR: number;
  days: ItineraryDay[];
  savedItemIds: string[]; // specific hotel/activity IDs marked as saved
  createdAt: string;
  updatedAt: string;
}

export interface PlannerDraft {
  id: string;
  userId: string;
  step: 'conversation' | 'ready' | 'generated';
  formData: {
    destinationInput: string;
    startDate: string;
    endDate: string;
    budgetINR: number | null;
    travellerType: TravellerType;
    travellerCount: number;
    preferencesText: string;
  };
  chatHistory: {
    role: 'assistant' | 'user';
    content: string;
    quickReplies?: string[];
  }[];
  generatedItinerary?: GeneratedItinerary | null;
  updatedAt: string;
}
