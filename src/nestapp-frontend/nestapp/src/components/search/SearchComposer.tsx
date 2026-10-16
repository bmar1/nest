import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Slider } from '@/components/ui/slider'
import { LoginModal } from '@/components/LoginModal'
import { SearchSubmitLoadingOverlay } from '@/components/SearchSubmitLoadingOverlay'
import {
  amenityOptions,
  leaseOptions,
  priceStops,
  priorities,
  roomOptions,
  type Priority,
} from '@/lib/searchDraft'
import type { SearchDraftState } from '@/lib/useSearchDraft'
import { cn } from '@/lib/utils'

const blank =
  'inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-dawn-soft px-2.5 align-baseline font-extrabold tracking-[-0.03em] transition-[background-color,transform] duration-150 hover:bg-dawn active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current'

export function InlineSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const current = options.find((o) => o.value === value)?.label ?? ''

  return (
    <label className={cn(blank, 'relative focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-current')}>
      <span aria-hidden>{current}</span>
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        value={String(value)}
        onChange={(e) => {
          const picked = options.find((o) => String(o.value) === e.target.value)
          if (picked) onChange(picked.value)
        }}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** A value in the sentence that opens a slider beneath it. */
function SliderBlank({
  label,
  display,
  children,
}: {
  label: string
  display: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        className={blank}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}: ${display}`}
        onClick={() => setOpen((o) => !o)}
      >
        {display}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            id={panelId}
            data-ui
            role="group"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-0 z-30 mt-2 block w-[min(20rem,80vw)] origin-top-left rounded-xl bg-white p-4 text-base font-normal tracking-normal text-[oklch(0.2_0.02_60)] shadow-[0_18px_48px_oklch(0.2_0.03_60/0.25)]" /* taste-skill-ignore: open popover floats */
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function PriorityBlank({ search }: { search: SearchDraftState }) {
  return (
    <InlineSelect<Priority>
      label="Priority"
      value={search.draft.priority}
      options={priorities.map((p) => ({ value: p.value, label: p.phrase }))}
      onChange={search.selectPriority}
    />
  )
}

export function RentBlank({ search }: { search: SearchDraftState }) {
  const { draft, update } = search
  return (
    <SliderBlank label="Maximum rent" display={`$${draft.maxPrice.toLocaleString()}`}>
      <span className="flex flex-wrap gap-1.5">
        {priceStops.map((price) => (
          <button
            key={price}
            type="button"
            onClick={() => update({ maxPrice: price })}
            className={cn(
              'tabular min-h-9 cursor-pointer rounded-md px-2.5 text-sm font-semibold transition-colors duration-150',
              draft.maxPrice === price ? 'bg-ink text-ink-ink' : 'bg-day-soft hover:bg-day',
            )}
          >
            ${price.toLocaleString()}
          </button>
        ))}
      </span>
      <Slider
        className="mt-4"
        value={[draft.maxPrice]}
        min={500}
        max={5000}
        step={50}
        onValueChange={([v]) => update({ maxPrice: v })}
        aria-label="Maximum rent"
      />
    </SliderBlank>
  )
}

const roomChoices = [
  { value: 0, label: 'any number of' },
  ...roomOptions.map((n) => ({ value: n, label: `${n}+` })),
]

export function SearchComposer({ search }: { search: SearchDraftState }) {
  const { draft, update, toggleAmenity, submit, isSubmitting, error, loginOpen, closeLogin, isAuthenticated } = search

  return (
    <>
      <SearchSubmitLoadingOverlay open={isSubmitting} />
      <LoginModal
        open={loginOpen}
        onClose={closeLogin}
        title="Sign in before searching"
        description="Each search runs a live scrape of both sites, so Nest asks for a Google account first."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <p className="text-[clamp(1.375rem,1rem+1.4vw,2.25rem)] leading-[1.6] font-semibold tracking-[-0.025em]">
          I want to <PriorityBlank search={search} />
          , paying at most <RentBlank search={search} />{' '}
          a month, for at least{' '}
          <SliderBlank label="Minimum size" display={`${draft.minSqft.toLocaleString()} sq ft`}>
            <Slider
              value={[draft.minSqft]}
              min={300}
              max={2500}
              step={50}
              onValueChange={([v]) => update({ minSqft: v })}
              aria-label="Minimum size in square feet"
            />
            <span className="tabular mt-3 block text-sm">{draft.minSqft.toLocaleString()} square feet or more</span>
          </SliderBlank>
          , with{' '}
          <InlineSelect<number>
            label="Bedrooms"
            value={draft.desiredBedrooms ?? 0}
            options={roomChoices}
            onChange={(v) => update({ desiredBedrooms: v || null })}
          />{' '}
          bedrooms and{' '}
          <InlineSelect<number>
            label="Bathrooms"
            value={draft.desiredBathrooms ?? 0}
            options={roomChoices}
            onChange={(v) => update({ desiredBathrooms: v || null })}
          />{' '}
          bathrooms, on a lease up to{' '}
          <InlineSelect<number>
            label="Maximum lease"
            value={draft.maxLeaseMonths}
            options={leaseOptions}
            onChange={(v) => update({ maxLeaseMonths: v })}
          />
          . It has to have{' '}
          <span role="group" aria-label="Must-have amenities" className="inline">
            {amenityOptions.map((a, i) => {
              const on = draft.desiredAmenities.includes(a.id)
              return (
                <span key={a.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAmenity(a.id)}
                    className={cn(blank, on ? 'bg-ink text-ink-ink hover:bg-[oklch(0.28_0.02_60)]' : 'font-semibold opacity-75')}
                  >
                    {a.label}
                  </button>
                  {i < amenityOptions.length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </span>
          .
        </p>

        <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <button type="submit" disabled={isSubmitting} className="btn btn-ink min-h-14 px-8 text-lg">
            {isSubmitting ? 'Searching…' : isAuthenticated ? 'Find your nest' : 'Sign in to search'}
          </button>
          <p className="text-base">Sign in with Google, free to use, results in about a minute.</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 max-w-[40rem] text-lg font-semibold"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </>
  )
}
