import { PRIORITY_WEIGHTS, priorities, type Priority } from '@/lib/searchDraft'
import { cn } from '@/lib/utils'
import { Reveal } from './Reveal'

const SCORING_SOURCE = 'https://github.com/bmar1/nest/blob/main/src/main/java/com/nest/nestapp/service/ScoringService.java'

const promises = [
  'Sign in with Google. There is nothing else to fill in.',
  'Free to use.',
  'No reviews to trust and no paid placements. The order comes from the formula.',
]

export function OpenChapter({ priority }: { priority: Priority }) {
  return (
    <section id="open" data-field="ink" className="field-ink chapter grid content-center gap-16 py-36 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        <Reveal as="h2" className="display text-[clamp(3rem,1rem+5.4vw,6.5rem)]">
          Nothing
          <br />
          hidden
        </Reveal>
        <Reveal order={1} as="p" className="step-lead mt-8 max-w-[28rem]">
          The ranking is a few lines of public code. These are the real weights each priority applies to the four scores.
        </Reveal>
        <ul className="mt-10 grid gap-3 text-[1.0625rem] sm:text-[1.125rem]">
          {promises.map((line, i) => (
            <Reveal key={line} as="li" order={i + 2} rise={16}>
              {line}
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal order={1} className="min-w-0 lg:col-span-6 lg:col-start-7 lg:self-end">
        <table data-ui className="tabular w-full border-separate border-spacing-y-1.5 text-left">
          <caption className="sr-only">Weights applied by each priority</caption>
          <thead>
            <tr className="text-[13px] sm:text-[15px]">
              <th scope="col" className="pb-3 pl-3 font-semibold sm:pl-4">Priority</th>
              {['Price', 'Space', 'Amenities', 'Lease'].map((h, i) => (
                <th key={h} scope="col" className={cn('pb-3 pl-2 text-right font-semibold', i === 3 && 'pr-3 sm:pr-4')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[clamp(1.125rem,0.8rem+1.4vw,2.25rem)] font-extrabold tracking-[-0.02em]">
            {priorities.map((p) => {
              const active = p.value === priority
              return (
                <tr
                  key={p.value}
                  className={cn('transition-colors duration-300', active ? 'bg-dawn text-dawn-ink' : 'bg-ink-soft')}
                  aria-current={active ? 'true' : undefined}
                >
                  <th scope="row" className="py-3 pl-3 text-left sm:pl-4">
                    {p.label}
                  </th>
                  {PRIORITY_WEIGHTS[p.value].map((w, i) => (
                    <td key={i} className={cn('py-3 pl-2 text-right', i === 3 && 'pr-3 sm:pr-4')}>
                      {w.toFixed(1)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-6 text-base">
          Your chosen priority is highlighted. Read the full formula in{' '}
          <a href={SCORING_SOURCE} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
            ScoringService.java on GitHub
          </a>
          .
        </p>
      </Reveal>
    </section>
  )
}
