import { useState } from 'react'
import { EthicalHero } from '@/components/ui/hero-5'
import { SearchForm } from './components/SearchForm'
import { ResultsPage } from './components/ResultsPage'
import './App.css'

const heroData = {
  title: (
    <>
      Find your dream home,
      <br />
      cheaper, faster and without the hassle.
    </>
  ),
  subtitle:
    'Nest is an intelligent apartment search platform that aggregates listings, removes fees where possible, and ranks homes based on what actually matters to you. Skip the stress and go straight to the right shortlist.',
  ctaLabel: 'Start your free search',
  ctaHref: '#',
  features: [
    {
      id: 'dream-home',
      title: 'Find your dream home',
      imageUrl:
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop', // bright, aspirational interior
      href: '#',
    },
    {
      id: 'save-money',
      title: 'Save on rent & fees',
      imageUrl:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop', // person looking at listings in a bright living room
      href: '#',
    },
    {
      id: 'no-hassle',
      title: 'No-hassle, guided search',
      imageUrl:
        'https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=800&auto=format&fit=crop', // modern apartment building exterior
      href: '#',
    },
  ],
}

function App() {
  const [searchId, setSearchId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full bg-background">
        <EthicalHero
          title={heroData.title}
          subtitle={heroData.subtitle}
          ctaLabel={heroData.ctaLabel}
          ctaHref={heroData.ctaHref}
          features={heroData.features}
        />
      </div>

      <main className="container mx-auto px-4 pb-8">
        {!searchId ? (
          <SearchForm onSearchSubmitted={setSearchId} />
        ) : (
          <>
            <button
              onClick={() => setSearchId(null)}
              className="mb-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              ← New Search
            </button>
            <ResultsPage searchId={searchId} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
