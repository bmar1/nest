import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthButton } from '@/components/AuthButton'
import { cn } from '@/lib/utils'

export type Field = 'hero' | 'night' | 'turn' | 'day' | 'ink' | 'dawn'

const fieldColours: Record<Field, { background: string; color: string }> = {
  hero: { background: 'transparent', color: 'oklch(0.98 0.01 80)' },
  night: { background: 'var(--color-night)', color: 'var(--color-night-ink)' },
  turn: { background: 'var(--turn-field)', color: 'var(--turn-ink)' },
  day: { background: 'var(--color-day)', color: 'var(--color-day-ink)' },
  ink: { background: 'var(--color-ink)', color: 'var(--color-ink-ink)' },
  dawn: { background: 'var(--color-dawn)', color: 'var(--color-dawn-ink)' },
}

const lightFields: Field[] = ['day', 'dawn']

const PROBE_Y = 36

/** Tracks which [data-field] chapter sits under the bar. */
function useFieldUnderBar(initial: Field) {
  const [field, setField] = useState<Field>(initial)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const chapters = document.querySelectorAll<HTMLElement>('[data-field]')
      for (const chapter of chapters) {
        const rect = chapter.getBoundingClientRect()
        if (rect.top <= PROBE_Y && rect.bottom > PROBE_Y) {
          setField(chapter.dataset.field as Field)
          return
        }
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return field
}

interface SiteNavProps {
  initialField?: Field
  /** On the landing page the links are in-page anchors; elsewhere they lead back to it. */
  onLanding?: boolean
}

export function SiteNav({ initialField = 'hero', onLanding = true }: SiteNavProps) {
  const field = useFieldUnderBar(initialField)
  const colours = fieldColours[field]
  const base = onLanding ? '' : '/'
  const darkInkOnField = lightFields.includes(field)

  const links = [
    { href: `${base}#problem`, label: 'The problem' },
    { href: `${base}#how`, label: 'How it works' },
    { href: `${base}#open`, label: 'Open source' },
  ]

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        backgroundColor: colours.background,
        color: colours.color,
        transition: 'background-color 300ms ease, color 300ms ease',
      }}
    >
      <nav
        className="flex h-[4.5rem] items-center justify-between gap-6 px-[var(--margin)]"
        aria-label="Main"
      >
        <Link to="/" className="flex min-h-11 items-center gap-2.5" aria-label="Nest home">
          <img src="/nest-logo-transparent-cropped.png" alt="" width={30} height={30} />
          <span className="text-xl font-extrabold tracking-[-0.04em]">Nest</span>
        </Link>

        <div className="flex items-center gap-7">
          <ul className="hidden items-center gap-7 font-semibold md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="link-u">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <AuthButton className="inline-flex font-semibold" />
          {onLanding ? (
            <a href="#search" className={cn('btn min-h-11 px-5', darkInkOnField ? 'btn-ink' : 'btn-dawn')}>
              Find your nest
            </a>
          ) : (
            <Link to="/" className="link-u font-semibold">
              Back to home
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
