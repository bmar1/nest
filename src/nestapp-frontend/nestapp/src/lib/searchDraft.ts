export type Priority = 'BUDGET' | 'SPACE' | 'AMENITIES' | 'BALANCED'

export interface SearchDraft {
  priority: Priority
  maxPrice: number
  minSqft: number
  desiredBedrooms: number | null
  desiredBathrooms: number | null
  desiredAmenities: string[]
  maxLeaseMonths: number
}

export const priorities: { value: Priority; label: string; phrase: string }[] = [
  { value: 'BUDGET', label: 'Budget', phrase: 'save money' },
  { value: 'SPACE', label: 'Space', phrase: 'have more space' },
  { value: 'AMENITIES', label: 'Amenities', phrase: 'have all the perks' },
  { value: 'BALANCED', label: 'Balanced', phrase: 'balance it all' },
]

export const amenityOptions = [
  { id: 'laundry', label: 'laundry' },
  { id: 'parking', label: 'parking' },
  { id: 'gym', label: 'a gym' },
  { id: 'wifi', label: 'internet' },
  { id: 'pets', label: 'pets allowed' },
]

export const leaseOptions = [
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
]

export const roomOptions = [1, 2, 3, 4]

export const priceStops = [1500, 1800, 2000, 2500, 3000, 3500]

/** Mirrors Priority.java: price, space, amenities, lease. */
export const PRIORITY_WEIGHTS: Record<Priority, [number, number, number, number]> = {
  BUDGET: [1.5, 0.8, 0.8, 0.9],
  SPACE: [0.8, 1.5, 0.8, 0.9],
  AMENITIES: [0.9, 0.9, 1.5, 0.9],
  BALANCED: [1.0, 1.0, 1.0, 1.0],
}

/** Mirrors ScoringService.normalizeScore: the weighted total out of a possible 150. */
export function finalScore(parts: [number, number, number, number], priority: Priority) {
  const weights = PRIORITY_WEIGHTS[priority]
  const raw = parts.reduce((sum, part, i) => sum + part * weights[i], 0)
  return (raw / 150) * 100
}

export const priorityPresets: Record<Priority, Omit<SearchDraft, 'priority'>> = {
  BUDGET: {
    maxPrice: 1800,
    minSqft: 600,
    desiredBedrooms: null,
    desiredBathrooms: null,
    maxLeaseMonths: 12,
    desiredAmenities: [],
  },
  SPACE: {
    maxPrice: 3000,
    minSqft: 1100,
    desiredBedrooms: 2,
    desiredBathrooms: 2,
    maxLeaseMonths: 12,
    desiredAmenities: [],
  },
  AMENITIES: {
    maxPrice: 2500,
    minSqft: 700,
    desiredBedrooms: null,
    desiredBathrooms: null,
    maxLeaseMonths: 12,
    desiredAmenities: ['laundry', 'parking', 'gym'],
  },
  BALANCED: {
    maxPrice: 2500,
    minSqft: 800,
    desiredBedrooms: 1,
    desiredBathrooms: 1,
    maxLeaseMonths: 12,
    desiredAmenities: ['laundry', 'parking'],
  },
}

export const defaultDraft: SearchDraft = { priority: 'BALANCED', ...priorityPresets.BALANCED }
