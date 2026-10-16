import type { Priority } from '@/lib/searchDraft'
import { finalScore } from '@/lib/searchDraft'

/** Sample listings for the demo. Not real apartments. */
export interface SampleListing {
  id: string
  title: string
  price: number
  sqft: number
  lease: number
  amenities: string[]
}

export const sampleListings: SampleListing[] = [
  { id: 'ossington', title: 'Bachelor on Ossington', price: 1550, sqft: 420, lease: 6, amenities: ['pets allowed'] },
  { id: 'leslieville', title: '2 bed in Leslieville', price: 2650, sqft: 980, lease: 12, amenities: ['laundry', 'parking'] },
  { id: 'liberty', title: '1 bed in Liberty Village', price: 2200, sqft: 610, lease: 12, amenities: ['laundry', 'parking', 'gym', 'concierge'] },
  { id: 'junction', title: '1 bed + den in the Junction', price: 1950, sqft: 720, lease: 12, amenities: ['laundry'] },
]

/** The same four sub-scores ScoringService computes, relative to the other listings in the set. */
function scoreParts(listing: SampleListing, set: SampleListing[]): [number, number, number, number] {
  const prices = set.map((l) => l.price)
  const sizes = set.map((l) => l.sqft)
  const [minP, maxP] = [Math.min(...prices), Math.max(...prices)]
  const [minS, maxS] = [Math.min(...sizes), Math.max(...sizes)]
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v))

  const price = clamp(((maxP - listing.price) / (maxP - minP)) * 30, 30)
  const space = clamp(((listing.sqft - minS) / (maxS - minS)) * 30, 30)

  const has = (word: string) => listing.amenities.some((a) => a.includes(word))
  let amenities = (has('laundry') ? 10 : 0) + (has('parking') ? 5 : 0) + (has('gym') ? 3 : 0)
  const others = listing.amenities.filter((a) => !['laundry', 'parking', 'gym'].some((w) => a.includes(w))).length
  amenities = Math.min(20, amenities + Math.min(others * 2, 20 - amenities))

  const lease = listing.lease === 1 ? 20 : listing.lease <= 6 ? 15 : listing.lease === 12 ? 10 : 5

  return [price, space, amenities, lease]
}

export interface RankedListing extends SampleListing {
  parts: [number, number, number, number]
  score: number
}

export function rankListings(priority: Priority): RankedListing[] {
  return sampleListings
    .map((listing) => {
      const parts = scoreParts(listing, sampleListings)
      return { ...listing, parts, score: finalScore(parts, priority) }
    })
    .sort((a, b) => b.score - a.score)
}

/** Tab titles for the collapse: the pile a renter keeps open. `dupeOf` marks a repost that Nest drops. */
export const tabPile: { title: string; site: string; dupeOf?: string; dead?: boolean; keep?: boolean }[] = [
  { title: '1 bed + den in the Junction, $1,950', site: 'kijiji.ca', keep: true },
  { title: '1 bed + den in the Junction, $1,950', site: 'craigslist.org', dupeOf: 'junction' },
  { title: 'Page not found', site: 'kijiji.ca', dead: true },
  { title: 'Bachelor on Ossington, $1,550', site: 'craigslist.org' },
  { title: 'Broker fee? Ask in DMs', site: 'craigslist.org', dead: true },
  { title: '2 bed in Leslieville, $2,650', site: 'kijiji.ca' },
  { title: '2 bed in Leslieville, $2,650', site: 'kijiji.ca', dupeOf: 'leslieville' },
  { title: 'Basement, no laundry, $1,400', site: 'craigslist.org' },
  { title: 'Listing removed', site: 'craigslist.org', dead: true },
  { title: '1 bed in Liberty Village, $2,200', site: 'kijiji.ca' },
  { title: 'Apartments for rent, Toronto', site: 'kijiji.ca' },
  { title: 'apts / housing for rent', site: 'craigslist.org' },
]

export const credits = [
  {
    title: 'Homes along Shaw Street',
    creator: 'Dillan Payne',
    licence: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Homes_along_Shaw_Street_in_Toronto,_August_26_2026_(02).jpg',
  },
  {
    title: 'Victorian row houses on Niagara Street',
    creator: 'JosephIWMolto',
    licence: 'public domain',
    href: 'https://commons.wikimedia.org/wiki/File:TorontoNiagaraStreetVictoriaRowHouses.jpg',
  },
  {
    title: 'Living room in an apartment building in Toronto at night',
    creator: 'VV Nincic',
    licence: 'CC BY 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Living_room_in_an_apartment_building_in_Toronto_at_night_(27715627622).jpg',
  },
  {
    title: 'Toronto skyline at night',
    creator: 'TheWxResearcher',
    licence: 'CC0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=174480273',
  },
  {
    title: 'Flexity Outlook Toronto streetcar, September 2019',
    creator: 'Bernard Spragg',
    licence: 'CC0',
    href: 'https://commons.wikimedia.org/w/index.php?curid=84379392',
  },
]
