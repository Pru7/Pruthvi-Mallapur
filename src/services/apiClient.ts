import { PlanRequestParams, ClarificationResult, analyzeForClarifications, buildCatalogueItinerary } from './catalogEngine';
import { GeneratedItinerary } from '../types/travel';
import { sanitizeFreeText } from '../lib/privacy';

export async function requestClarifications(params: PlanRequestParams): Promise<ClarificationResult> {
  const sanitizedPrefs = sanitizeFreeText(params.preferencesText);
  const cleanParams: PlanRequestParams = {
    ...params,
    preferencesText: sanitizedPrefs.sanitized,
  };

  try {
    const res = await fetch('/api/clarify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanParams),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Network call to /api/clarify failed, using local engine:', err);
  }

  // Fallback to local engine
  return analyzeForClarifications(cleanParams);
}

export async function requestTripPlan(params: PlanRequestParams): Promise<GeneratedItinerary> {
  const sanitizedPrefs = sanitizeFreeText(params.preferencesText);
  const cleanParams: PlanRequestParams = {
    ...params,
    preferencesText: sanitizedPrefs.sanitized,
  };

  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanParams),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.days && data.days.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Network call to /api/plan failed, using local engine:', err);
  }

  // Fallback to strict catalogue engine
  return buildCatalogueItinerary(cleanParams);
}
