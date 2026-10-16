import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { rankListings } from './content'
import { Reveal, Shutter } from './Reveal'
import { ShortlistCard } from './ShortlistCard'

const topListing = rankListings('BALANCED')[0]

interface Tile {
  title: string
  text: string
  span: string
  visual: ReactNode
  /** A UI fragment needs its full height on phones, so it skips the photo crop. */
  isCard?: boolean
}

const photo = (src: string, alt: string, position = 'center') => (
  <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: position }} />
)

const tiles: Tile[] = [
  {
    title: 'Both sites, one search',
    text: 'Craigslist and Kijiji read in one pass, filtered to your rent before anything is scored. Up to 60 apartments weighed every time.',
    span: 'md:col-span-7',
    visual: photo('/photos/shaw-street.jpg', 'Victorian row houses in brick and grey siding along Shaw Street in Toronto, on a summer morning'),
  },
  {
    title: 'The same flat, once',
    text: 'The same link never shows up twice, and reposts with the same title, price and rooms are dropped.',
    span: 'md:col-span-5',
    visual: photo('/photos/niagara-street.jpg', 'A row of near-identical brick houses on Niagara Street in Toronto after a snowfall', '30% center'),
  },
  {
    title: 'Every score explained',
    text: 'Price and space are worth 30 points each, amenities and lease 20 each. Every result shows the split.',
    span: 'md:col-span-5',
    isCard: true,
    visual: (
      <div className="flex h-full items-center justify-center bg-dawn p-4">
        <ShortlistCard listing={topListing} className="shadow-none" />
      </div>
    ),
  },
  {
    title: 'Your top 20, best first',
    text: 'The 20 highest scores in order, each with its price, size and lease, and a link straight to the original listing.',
    span: 'md:col-span-7',
    visual: photo('/photos/lit-window.jpg', 'A Toronto apartment tower at night with a single window lit'),
  },
]

export function WhyChapter() {
  return (
    <section id="why" data-field="day" className="field-day chapter pt-20 pb-24">
      <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-8">
        <Reveal as="h2" className="display text-[clamp(3rem,1rem+5.4vw,6.5rem)] md:col-span-6">
          Why Nest
        </Reveal>
        <Reveal order={1} as="p" className="step-lead max-w-[28rem] md:col-span-5 md:col-start-8">
          Four things the listing sites leave to you, done before you see a single result.
        </Reveal>
      </div>

      <ul className="mt-10 grid gap-3 md:grid-cols-12">
        {tiles.map((tile, i) => (
          <Reveal key={tile.title} as="li" order={i % 2} rise={32} className={cn('flex flex-col overflow-hidden rounded-xl bg-paper', tile.span)}>
            <Shutter className={cn('overflow-hidden md:h-[clamp(260px,32svh,320px)]', tile.isCard ? 'min-h-[20rem] md:min-h-0' : 'aspect-[4/3] md:aspect-auto')}>
              {tile.visual}
            </Shutter>
            <div className="grid gap-1.5 p-5">
              <h3 className="text-xl leading-tight font-extrabold tracking-[-0.025em]">{tile.title}</h3>
              <p className="max-w-[36rem] text-base leading-normal">{tile.text}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
