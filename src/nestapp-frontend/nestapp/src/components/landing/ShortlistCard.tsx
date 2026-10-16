import type { RankedListing } from './content'
import { cn } from '@/lib/utils'

const partLabels: { label: string; max: number }[] = [
  { label: 'Price', max: 30 },
  { label: 'Space', max: 30 },
  { label: 'Amenities', max: 20 },
  { label: 'Lease', max: 20 },
]

/** One Nest result, drawn the way the results page shows it. */
export function ShortlistCard({ listing, className }: { listing: RankedListing; className?: string }) {
  return (
    <article
      data-ui
      className={cn('w-[min(24rem,86vw)] rounded-xl bg-paper p-5 text-[oklch(0.2_0.02_60)] shadow-[0_24px_60px_oklch(0.2_0.03_60/0.25)]', className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-[oklch(0.5_0.11_58)]">Top match</p>
          <h3 className="mt-1 text-lg leading-tight font-extrabold tracking-[-0.03em]">{listing.title}</h3>
          <p className="mt-1 text-[14px]">
            ${listing.price.toLocaleString()}/mo, {listing.sqft} sq ft, {listing.lease}-month lease
          </p>
        </div>
        <p className="tabular flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-dawn text-xl font-extrabold">
          {Math.round(listing.score)}
        </p>
      </div>
      <dl className="mt-5 grid gap-2.5">
        {listing.parts.map((part, i) => (
          <div key={partLabels[i].label} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-[13px]">
            <dt>{partLabels[i].label}</dt>
            <div className="h-1.5 overflow-hidden rounded-full bg-[oklch(0.92_0.02_80)]">
              <div className="h-full rounded-full bg-ink" style={{ width: `${(part / partLabels[i].max) * 100}%` }} />
            </div>
            <dd className="tabular text-right font-semibold">
              {Math.round(part)}/{partLabels[i].max}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
