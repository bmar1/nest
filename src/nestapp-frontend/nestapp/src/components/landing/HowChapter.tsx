import { motion, useReducedMotion } from 'framer-motion'
import { priorities, type Priority } from '@/lib/searchDraft'
import { cn } from '@/lib/utils'
import { rankListings } from './content'
import { Reveal } from './Reveal'

interface HowChapterProps {
  priority: Priority
  onPriority: (priority: Priority) => void
}

const stages = [
  { name: 'Choose what matters', text: 'Pick a priority. It sets how much price, space, amenities and lease count.' },
  { name: 'We read both sites', text: 'Nest searches Craigslist and Kijiji across Toronto and drops the reposts.' },
  { name: 'Your shortlist', text: 'Every apartment scored out of 100 and ranked, in about a minute.' },
]

const partLabels = [
  { label: 'Price', max: 30 },
  { label: 'Space', max: 30 },
  { label: 'Amenities', max: 20 },
  { label: 'Lease', max: 20 },
]

function PriorityPicker({ priority, onPriority }: HowChapterProps) {
  return (
    <div role="radiogroup" aria-label="Priority" className="flex flex-wrap gap-2">
      {priorities.map((p) => {
        const active = p.value === priority
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPriority(p.value)}
            className={cn(
              'min-h-11 cursor-pointer rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97]',
              active ? 'bg-ink text-ink-ink' : 'bg-day-soft hover:bg-dawn-soft',
            )}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

function LiveRanking({ priority, onPriority }: HowChapterProps) {
  const reduce = useReducedMotion()
  const ranked = rankListings(priority)

  return (
    <div data-ui className="rounded-xl bg-paper p-4 text-day-ink sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PriorityPicker priority={priority} onPriority={onPriority} />
        <p className="text-[15px] font-semibold">Four sample apartments, scored out of 100</p>
      </div>

      <ol aria-live="polite" className="mt-6 grid gap-2">
        {ranked.map((listing, i) => (
          <motion.li
            key={listing.id}
            layout={!reduce}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'grid items-center gap-4 rounded-lg px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:px-6',
              i === 0 ? 'bg-ink text-ink-ink' : 'bg-day',
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-[-0.02em]">{listing.title}</span>
              <span className="block text-[14px] opacity-80">
                ${listing.price.toLocaleString()}/mo, {listing.sqft} sq ft, {listing.amenities.join(', ')}
              </span>
            </span>
            <span className="hidden grid-cols-4 gap-3 md:grid" aria-hidden>
              {listing.parts.map((part, j) => (
                <span key={partLabels[j].label} className="grid gap-1.5 text-[12px]">
                  {partLabels[j].label}
                  <span className="h-1.5 overflow-hidden rounded-full bg-current/15">
                    <span className="block h-full rounded-full bg-current" style={{ width: `${(part / partLabels[j].max) * 100}%` }} />
                  </span>
                </span>
              ))}
            </span>
            <span className="tabular text-[2rem] leading-none font-extrabold tracking-[-0.04em] sm:text-right">
              {listing.score.toFixed(1)}
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

export function HowChapter({ priority, onPriority }: HowChapterProps) {
  return (
    <section id="how" data-field="dawn" className="field-dawn chapter py-32">
      <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-8">
        <Reveal as="h2" className="display text-[clamp(3rem,1rem+5.4vw,6.5rem)] md:col-span-6">
          How it works
        </Reveal>
        <Reveal order={1} as="p" className="step-lead max-w-[28rem] md:col-span-5 md:col-start-8">
          Pick a priority and watch the order change. These are the same weights Nest uses on real listings.
        </Reveal>
      </div>

      <Reveal order={2} className="mt-14">
        <LiveRanking priority={priority} onPriority={onPriority} />
      </Reveal>

      <ol className="mt-14 grid gap-8 md:grid-cols-3 md:gap-8">
        {stages.map((stage, i) => (
          <Reveal key={stage.name} as="li" order={i} rise={16} className="border-t-2 border-current pt-5">
            <p className="text-[1.625rem] leading-[1.05] font-extrabold tracking-[-0.03em]">{stage.name}</p>
            <p className="mt-2 max-w-[22rem] text-base leading-normal">{stage.text}</p>
          </Reveal>
        ))}
      </ol>

      <a href="#search" className="btn btn-ink mt-14">
        Search with this priority
      </a>
    </section>
  )
}
