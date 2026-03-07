import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { motion } from 'framer-motion'
import { ApartmentCard } from '@/components/ApartmentCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Loader2 } from 'lucide-react'

interface Apartment {
  id: string
  title: string
  price: number
  sqft: number
  bedrooms: number
  amenities: string[]
  leaseTermMonths: number
  sourceUrl: string
  finalScore: number
  scoreBreakdown: {
    priceScore: number
    spaceScore: number
    amenitiesScore: number
    leaseScore: number
  }
}

export function ResultsPage() {
  const { searchId } = useParams<{ searchId: string }>()
  const [status, setStatus] = useState<string>('PENDING')
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAttempted, setTotalAttempted] = useState<number | null>(null)
  const [totalSuccessful, setTotalSuccessful] = useState<number | null>(null)

  useEffect(() => {
    if (!searchId) return

    const pollResults = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/v1/search/${searchId}/results`
        )
        setStatus(response.data.status)

        if (response.data.status === 'COMPLETED') {
          setApartments(response.data.apartments || [])
          setTotalAttempted(response.data.totalAttempted ?? null)
          setTotalSuccessful(response.data.totalSuccessful ?? null)
          setLoading(false)
        } else if (response.data.status === 'FAILED') {
          setTotalAttempted(response.data.totalAttempted ?? null)
          setTotalSuccessful(response.data.totalSuccessful ?? null)
          setLoading(false)
        } else {
          setTimeout(pollResults, 5000)
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        setLoading(false)
      }
    }

    pollResults()
  }, [searchId])

  if (!searchId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid search. Please try again.</p>
          <Button asChild className="mt-4">
            <Link to="/search">Start new search</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md text-center"
        >
          <Loader2
            className="mx-auto h-14 w-14 animate-spin text-primary"
            aria-hidden
          />
          <h2 className="mt-6 text-xl font-semibold text-foreground">
            Searching for apartments...
          </h2>
          <p className="mt-2 text-muted-foreground">
            We&apos;re scanning multiple sites and ranking results. This usually
            takes under 2 minutes.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Status: {status}
          </p>
        </motion.div>
      </div>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/50 bg-destructive/5 p-8 text-center"
        >
          <h2 className="text-xl font-semibold text-destructive">
            Search failed
          </h2>
          <p className="mt-2 text-muted-foreground">
            We couldn&apos;t complete your search. Please try again.
          </p>
          {(totalAttempted != null || totalSuccessful != null) && (
            <p className="mt-2 text-sm text-muted-foreground">
              Attempted: {totalAttempted ?? '—'}, Successful: {totalSuccessful ?? '—'}
            </p>
          )}
          <Button asChild className="mt-6">
            <Link to="/search">Try again</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/search"
              className="inline-flex items-center gap-2"
              aria-label="New search"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              New search
            </Link>
          </Button>
          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="Nest home"
          >
            <Home className="h-6 w-6 text-primary" aria-hidden />
            <span className="text-lg font-bold text-foreground">Nest</span>
          </Link>
          <div className="w-24" aria-hidden />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Your results
          </h1>
          <p className="mt-2 text-muted-foreground">
            Found {apartments.length} apartments ranked by your preferences
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apartment, i) => (
            <motion.div
              key={apartment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <ApartmentCard apartment={apartment} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
