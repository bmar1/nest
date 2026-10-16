import { credits } from './content'
import { Reveal } from './Reveal'

const EMAIL = 'hello@nestsearch.co'
const REPO = 'https://github.com/bmar1/nest'

const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'On this page',
    links: [
      { label: 'The problem', href: '#problem' },
      { label: 'Why Nest', href: '#why' },
      { label: 'How it works', href: '#how' },
      { label: 'Nothing hidden', href: '#open' },
      { label: 'Your search', href: '#search' },
    ],
  },
  {
    title: 'Open source',
    links: [
      { label: 'Code on GitHub', href: REPO, external: true },
      { label: 'The scoring formula', href: `${REPO}/blob/main/src/main/java/com/nest/nestapp/service/ScoringService.java`, external: true },
      { label: 'Report an issue', href: `${REPO}/issues`, external: true },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: EMAIL, href: `mailto:${EMAIL}` },
      { label: 'Suggest a listing site', href: `mailto:${EMAIL}?subject=A%20listing%20site%20Nest%20should%20read` },
    ],
  },
]

export function Closing() {
  return (
    <footer data-field="night" className="field-night overflow-hidden px-[var(--margin)] pt-28 pb-8">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
        <Reveal as="h2" className="display text-[clamp(3rem,1rem+5.4vw,6.5rem)] lg:col-span-7">
          Find your nest
        </Reveal>
        <Reveal order={1} className="flex flex-col items-start gap-6 lg:col-span-5">
          <p className="step-lead max-w-[28rem]">One search across Craigslist and Kijiji, ranked by what you care about.</p>
          <a href="#search" className="btn btn-dawn min-h-14 px-8 text-lg">
            Start a search
          </a>
        </Reveal>
      </div>

      <nav aria-label="Footer" className="mt-28 grid gap-10 sm:grid-cols-3 lg:grid-cols-12 lg:gap-8">
        {columns.map((column) => (
          <div key={column.title} className="lg:col-span-4">
            <h3 className="text-[15px] font-semibold opacity-70">{column.title}</h3>
            <ul className="mt-4 grid gap-2.5 text-lg font-semibold">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="link-u break-words"
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <a href="#top" aria-label="Back to top" className="mt-20 flex items-center gap-[0.18em] text-[clamp(4.5rem,2rem+12vw,13rem)]">
        <img src="/nest-logo-transparent-cropped.png" alt="" className="h-[0.86em] w-auto shrink-0" />
        <span aria-hidden className="display leading-[0.8] tracking-[-0.06em] text-dawn">
          Nest
        </span>
      </a>

      <div className="mt-8 grid gap-3 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-10">
        <p>
          Photos:{' '}
          {credits.map((c, i) => (
            <span key={c.href}>
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="link-u">
                {c.title}
              </a>{' '}
              by {c.creator}, {c.licence}
              {i < credits.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </p>
        <p className="sm:text-right">Nest, Toronto, {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
