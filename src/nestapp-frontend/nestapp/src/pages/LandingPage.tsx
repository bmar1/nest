import { useSearchDraft } from '@/lib/useSearchDraft'
import { SiteNav } from '@/components/landing/SiteNav'
import { Hero } from '@/components/landing/Hero'
import { SameFlatChapter } from '@/components/landing/SameFlatChapter'
import { CollapseTurn } from '@/components/landing/CollapseTurn'
import { WhyChapter } from '@/components/landing/WhyChapter'
import { HowChapter } from '@/components/landing/HowChapter'
import { OpenChapter } from '@/components/landing/OpenChapter'
import { SearchChapter } from '@/components/landing/SearchChapter'
import { Closing } from '@/components/landing/Closing'

export function LandingPage() {
  const search = useSearchDraft()

  return (
    <div id="top" className="bg-night">
      <SiteNav />
      <main>
        <Hero />
        <SameFlatChapter />
        <CollapseTurn />
        <WhyChapter />
        <HowChapter priority={search.draft.priority} onPriority={search.selectPriority} />
        <OpenChapter priority={search.draft.priority} />
        <SearchChapter search={search} />
      </main>
      <Closing />
    </div>
  )
}
