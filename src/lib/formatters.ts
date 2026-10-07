/**
 * Indian currency & date formatters
 */

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

export function formatIndianDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function calculateTripDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(14, diffDays)); // Support 1 to 14 days
}

export function getFirstName(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    return fullName.trim().split(' ')[0];
  }
  if (email && email.includes('@')) {
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  return 'Traveller';
}

export function isNewerListing(reviewCount: number): boolean {
  return reviewCount < 50;
}
