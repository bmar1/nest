import { Link } from 'react-router-dom'
import { PriorityBlank, RentBlank } from '@/components/search/SearchComposer'
import type { SearchDraftState } from '@/lib/useSearchDraft'
import { Reveal } from './Reveal'

const strip = [
  { src: '/photos/shaw-street.jpg', ratio: 'aspect-[3/2]' },
  { src: '/apartment-listing.png', ratio: 'aspect-[3/4]' },
  { src: '/photos/toronto-streetcar.jpg', ratio: 'aspect-[3/2]' },
  { src: '/apartment-studio.png', ratio: 'aspect-square' },
  { src: '/photos/niagara-street.jpg', ratio: 'aspect-square' },
  { src: '/hero-apartment.png', ratio: 'aspect-[3/2]' },
  { src: '/apartment-modern.png', ratio: 'aspect-[3/4]' },
  { src: '/photos/toronto-night.jpg', ratio: 'aspect-[3/2]' },
]

/** The first two answers of the search. The rest is asked on /search, which reads the same saved draft. */
export function SearchChapter({ search }: { search: SearchDraftState }) {
  return (
    <section id="search" data-field="day" className="field-day relative pt-28 pb-32">
      <div className="overflow-hidden" aria-hidden>
        <div className="marquee-track gap-2">
          {[...strip, ...strip].map((photo, i) => (
            <img key={i} src={photo.src} alt="" loading="lazy" className={`${photo.ratio} h-[110px] w-auto shrink-0 object-cover sm:h-[150px]`} />
          ))}
        </div>
      </div>

      <div className="grid gap-10 px-[var(--margin)] pt-[72px] lg:grid-cols-12 lg:gap-8">
        <Reveal as="h2" className="display text-[clamp(3rem,1rem+5.4vw,6.5rem)] lg:col-span-4">
          Your search
        </Reveal>

        <Reveal order={1} className="lg:col-span-8">
          <p className="text-[clamp(1.375rem,1rem+1.4vw,2.25rem)] leading-[1.6] font-semibold tracking-[-0.025em]">
            I want to <PriorityBlank search={search} />, paying at most <RentBlank search={search} /> a month.
          </p>

          <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <Link to="/search" className="btn btn-ink min-h-14 px-8 text-lg">
              Set the rest of your search
            </Link>
            <p className="max-w-[26rem] text-base">Size, rooms, lease and must-haves come next. Results in about a minute.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
