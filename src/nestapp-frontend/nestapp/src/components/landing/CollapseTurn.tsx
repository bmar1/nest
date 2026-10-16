import { useRef } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { rankListings, tabPile } from './content'
import { ShortlistCard } from './ShortlistCard'

/* Hex stand-ins for the oklch chapter tokens, so framer can interpolate between them. */
const NIGHT = '#1d1915'
const DAWN = '#e4b382'
const DAY = '#f5efe3'
const PAPER_INK = '#f6f0e4'
const DARK_INK = '#2a2219'

/** Where each tab starts, as [x vw, y vh, rotation deg] from the centre of the stage. */
const scatter: [number, number, number][] = [
  [-30, -20, -6], [8, -28, 4], [30, -14, -3], [-20, -4, 3],
  [22, 2, -5], [-36, 12, -2], [2, -8, 2], [32, 18, 6],
  [-10, 22, -4], [14, 30, 3], [-28, 30, 5], [36, -30, -2],
]

const topListing = rankListings('BALANCED')[0]

interface TabProps {
  index: number
  progress: MotionValue<number>
  /** Where the pile lands: the centre of the shortlist card, in vw / vh from the stage centre. */
  target: [number, number]
  wide: boolean
}

function Tab({ index, progress, target, wide }: TabProps) {
  const tab = tabPile[index]
  const [sx, sy, r] = scatter[index]
  const x = wide ? sx : sx * 0.6
  const y = wide ? sy : sy * 0.6 + 10
  const dropped = Boolean(tab.dupeOf || tab.dead)
  const stackY = (index % 4) * 6

  const tx = useTransform(progress, [0.08, 0.5], [`${x}vw`, `${target[0]}vw`])
  const ty = useTransform(progress, [0.08, 0.5], [`${y}vh`, `calc(${target[1]}vh + ${stackY - 40}px)`])
  const rotate = useTransform(progress, [0.08, 0.5], [r, 0])
  const opacity = useTransform(progress, dropped ? [0.16, 0.3] : [0.5, 0.6], [1, 0])
  const scale = useTransform(progress, dropped ? [0.16, 0.3] : [0.5, 0.6], [1, 0.9])

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -mt-6 -ml-[min(9.5rem,40vw)] flex h-12 w-[min(19rem,80vw)] items-center gap-2.5 rounded-t-lg bg-[#2f2923] px-3 text-[13px] text-[#ece5d8]"
      style={{ x: tx, y: ty, rotate, opacity, scale, zIndex: dropped ? 1 : 2 }}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-dawn text-[11px] font-extrabold text-[#2a2219]">
        {tab.site.startsWith('kijiji') ? 'K' : 'C'}
      </span>
      <span className="min-w-0 flex-1 truncate">{tab.title}</span>
      <span aria-hidden className="text-[#9c9184]">
        ×
      </span>
    </motion.div>
  )
}

function StaticTurn() {
  return (
    <section data-field="day" className="field-day chapter py-28">
      <h2 className="display step-head">One list</h2>
      <p className="step-lead mt-6 max-w-[36rem]">
        Ranked for you. Nest reads both sites, drops the reposts and the dead links, and keeps what fits.
      </p>
      <ul data-ui className="mt-10 flex flex-wrap gap-2">
        {tabPile.map((tab, i) => (
          <li key={i} className="rounded-t-lg bg-[#2f2923] px-3 py-2 text-[13px] text-[#ece5d8]">
            {tab.title}
          </li>
        ))}
      </ul>
      <ShortlistCard listing={topListing} className="mt-10" />
    </section>
  )
}

export function CollapseTurn() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const field = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.85], [NIGHT, NIGHT, DAWN, DAY])
  const ink = useTransform(scrollYProgress, [0.32, 0.34], [PAPER_INK, DARK_INK])

  useMotionValueEvent(field, 'change', (value) => document.documentElement.style.setProperty('--turn-field', value))
  useMotionValueEvent(ink, 'change', (value) => document.documentElement.style.setProperty('--turn-ink', value))

  const pileOpacity = useTransform(scrollYProgress, [0, 0.12, 0.2], [1, 1, 0])
  const pileY = useTransform(scrollYProgress, [0, 0.2], [0, -24])
  const cardOpacity = useTransform(scrollYProgress, [0.52, 0.64], [0, 1])
  const cardScale = useTransform(scrollYProgress, [0.52, 0.66], [0.94, 1])
  const headOpacity = useTransform(scrollYProgress, [0.64, 0.76], [0, 1])
  const headY = useTransform(scrollYProgress, [0.64, 0.78], [28, 0])

  if (reduce) return <StaticTurn />

  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  const target: [number, number] = wide ? [26, 2] : [0, 16]

  return (
    <section ref={ref} data-field="turn" className="relative h-[280svh]" aria-label="From forty tabs to one list">
      <motion.div className="sticky top-0 h-[100svh] overflow-hidden" style={{ backgroundColor: field, color: ink }}>
        <motion.p
          className="step-lead absolute top-24 left-[var(--margin)] z-20 max-w-[24rem] pr-[var(--margin)] font-semibold"
          style={{ opacity: pileOpacity, y: pileY }}
        >
          Two sites, twelve tabs, and the same flat posted twice.
        </motion.p>

        <div data-ui aria-hidden className="absolute inset-0">
          {tabPile.map((_, i) => (
            <Tab key={i} index={i} progress={scrollYProgress} target={target} wide={wide} />
          ))}
        </div>

        <div className="absolute inset-0 z-10 grid content-center gap-10 px-[var(--margin)] pt-16 md:grid-cols-12 md:items-center">
          <motion.div className="md:col-span-6 md:col-start-1" style={{ opacity: headOpacity, y: headY }}>
            <h2 className="display text-[clamp(3.5rem,1rem+8vw,9rem)]">One list</h2>
            <p className="step-lead mt-6 max-w-[30rem]">
              Ranked for you. Nest reads both sites, drops the reposts and the dead links, and keeps what fits.
            </p>
          </motion.div>
          <motion.div
            className="justify-self-center md:col-span-5 md:col-start-8"
            style={{ opacity: cardOpacity, scale: cardScale }}
          >
            <ShortlistCard listing={topListing} />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
