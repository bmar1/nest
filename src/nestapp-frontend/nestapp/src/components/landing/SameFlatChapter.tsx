import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Reveal } from './Reveal'

/** One flat, three tabs. Only where and when it was posted changes. */
const copies = [
  { site: 'Kijiji', posted: 'Posted 6 days ago', photo: '/apartment-listing.png', lift: 'md:mt-0' },
  { site: 'Craigslist', posted: 'Posted 5 days ago', photo: '/apartment-studio.png', lift: 'md:mt-16' },
  { site: 'Craigslist', posted: 'Reposted 2 hours ago', photo: '/apartment-modern.png', lift: 'md:mt-32' },
]

function Mark({ children, order }: { children: string; order: number }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-block px-1 -mx-1">
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-left rounded-sm bg-dawn"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.5, delay: 0.6 + order * 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="relative">{children}</span>
    </span>
  )
}

export function SameFlatChapter() {
  return (
    <section id="problem" data-field="day" className="field-day chapter grid content-center gap-12 py-32 lg:grid-cols-12 lg:gap-8">
      <Reveal as="h2" className="display text-[10vw] sm:text-[clamp(3rem,1rem+5.4vw,6.5rem)] lg:col-span-12">
        Same flat.
        <br />
        Third time today.
      </Reveal>
      <div className="lg:col-span-4">
        <Reveal order={1} as="p" className="step-lead max-w-[30rem]">
          A one-bed in the Junction, posted to Kijiji on Monday, copied to Craigslist on Tuesday, and bumped back to the top this
          morning.
        </Reveal>
        <Reveal order={2} as="p" className="step-body mt-5 max-w-[30rem]">
          Three tabs to open, three sets of photos to compare, one apartment. Neither site tells you. Nest checks the title, the price
          and the rooms, and keeps one.
        </Reveal>
      </div>

      <ul data-ui className="grid gap-3 sm:grid-cols-3 lg:col-span-8 lg:gap-4" aria-label="The same listing, three times">
        {copies.map((copy, i) => (
          <Reveal key={copy.posted} as="li" order={i + 1} rise={40} className={cn('min-w-0', copy.lift)}>
            <article className="flex gap-4 rounded-xl bg-paper p-3 sm:block sm:p-0">
              <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-lg sm:aspect-[4/5] sm:w-full sm:rounded-b-none sm:rounded-t-xl">
                <img src={copy.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 text-[15px] sm:p-4">
                <p className="font-semibold">
                  <Mark order={i}>{copy.site}</Mark>
                </p>
                <h3 className="mt-1.5 text-lg leading-tight font-extrabold tracking-[-0.02em]">1 bed + den in the Junction</h3>
                <p className="mt-1">$1,950/mo, 720 sq ft</p>
                <p className="mt-3 text-[13px]">
                  <Mark order={i + 1}>{copy.posted}</Mark>
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
