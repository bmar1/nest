import { SiteNav } from '@/components/landing/SiteNav'
import { SearchComposer } from '@/components/search/SearchComposer'
import { useSearchDraft } from '@/lib/useSearchDraft'

export function SearchFormPage() {
  const search = useSearchDraft()

  return (
    <div className="field-day min-h-[100svh]">
      <SiteNav initialField="day" onLanding={false} />
      <main data-field="day" className="grid min-h-[100svh] gap-8 px-[var(--margin)] pt-36 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <h1 className="display text-[clamp(3rem,1rem+6vw,7rem)]">Your search</h1>
          <p className="step-lead mt-6 max-w-[34rem]">Change any highlighted word. Nest scores every match against your answers.</p>
          <div className="mt-12">
            <SearchComposer search={search} />
          </div>
        </div>
        <img
          src="/photos/shaw-street.jpg"
          alt="Victorian row houses along Shaw Street in Toronto on a summer morning"
          className="hidden h-[min(70svh,640px)] w-full rounded-xl object-cover lg:col-span-4 lg:block"
          style={{ objectPosition: '30% center' }}
        />
      </main>
    </div>
  )
}
