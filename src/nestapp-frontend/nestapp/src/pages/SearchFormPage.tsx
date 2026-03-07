import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DollarSign,
  Layout,
  Sparkles,
  Scale,
  ArrowLeft,
  Search,
  Home,
  Car,
  Dumbbell,
  Shirt,
  Wifi,
  Dog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Priority = 'BUDGET' | 'SPACE' | 'AMENITIES' | 'BALANCED'

interface SearchFormData {
  priority: Priority
  maxPrice: number
  minSqft: number
  desiredAmenities: string[]
  maxLeaseMonths: number
}

const priorities: { value: Priority; label: string; icon: typeof DollarSign }[] =
  [
    { value: 'BUDGET', label: 'Budget focused', icon: DollarSign },
    { value: 'SPACE', label: 'Space focused', icon: Layout },
    { value: 'AMENITIES', label: 'Amenities focused', icon: Sparkles },
    { value: 'BALANCED', label: 'Balanced', icon: Scale },
  ]

const amenityOptions = [
  { id: 'laundry', label: 'In-unit laundry', icon: Shirt },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'gym', label: 'Gym / Fitness', icon: Dumbbell },
  { id: 'wifi', label: 'High-speed internet', icon: Wifi },
  { id: 'pets', label: 'Pet friendly', icon: Dog },
]

/** Preset form values per priority - adjust fields to match the focus */
const priorityPresets: Record<Priority, Partial<SearchFormData>> = {
  BUDGET: {
    maxPrice: 1800,
    minSqft: 600,
    maxLeaseMonths: 12,
    desiredAmenities: [],
  },
  SPACE: {
    maxPrice: 3000,
    minSqft: 1100,
    maxLeaseMonths: 12,
    desiredAmenities: [],
  },
  AMENITIES: {
    maxPrice: 2500,
    minSqft: 700,
    maxLeaseMonths: 12,
    desiredAmenities: ['laundry', 'parking', 'gym'],
  },
  BALANCED: {
    maxPrice: 2500,
    minSqft: 800,
    maxLeaseMonths: 12,
    desiredAmenities: ['laundry', 'parking'],
  },
}

export function SearchFormPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SearchFormData>({
    priority: 'BALANCED',
    maxPrice: 2500,
    minSqft: 800,
    desiredAmenities: [],
    maxLeaseMonths: 12,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      desiredAmenities: prev.desiredAmenities.includes(id)
        ? prev.desiredAmenities.filter((a) => a !== id)
        : [...prev.desiredAmenities, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await axios.post(
        'http://localhost:8080/api/v1/search',
        formData
      )
      navigate(`/search/${response.data.searchId}/results`)
    } catch (err) {
      console.error('Error submitting search:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2" aria-label="Nest home">
            <Home className="h-6 w-6 text-primary" aria-hidden />
            <span className="text-lg font-bold text-foreground">Nest</span>
          </Link>
          <div className="w-20" aria-hidden />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Find your perfect apartment
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Tell us what matters most. We&apos;ll search and rank results for you.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">
          {/* Priority */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <label className="block text-sm font-medium text-foreground">
              What matters most?
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll weight your results accordingly.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    const preset = priorityPresets[p.value]
                    setFormData((prev) => ({
                      ...prev,
                      priority: p.value,
                      ...preset,
                    }))
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    formData.priority === p.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                  )}
                  aria-pressed={formData.priority === p.value}
                  aria-label={`Select ${p.label}`}
                >
                  <p.icon
                    className={cn(
                      'h-6 w-6',
                      formData.priority === p.value ? 'text-primary' : ''
                    )}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </motion.section>

          {/* Budget & space */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-border/80 p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Budget & space
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="maxPrice"
                    className="block text-sm font-medium text-foreground"
                  >
                    Max rent ($/month)
                  </label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min={500}
                    value={formData.maxPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPrice: parseInt(e.target.value) || 500,
                      })
                    }
                    className="mt-2 font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="minSqft"
                    className="block text-sm font-medium text-foreground"
                  >
                    Min square feet
                  </label>
                  <Input
                    id="minSqft"
                    type="number"
                    min={300}
                    value={formData.minSqft}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minSqft: parseInt(e.target.value) || 300,
                      })
                    }
                    className="mt-2 font-mono"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="maxLease"
                  className="block text-sm font-medium text-foreground"
                >
                  Max lease length (months)
                </label>
                <Input
                  id="maxLease"
                  type="number"
                  min={1}
                  max={24}
                  value={formData.maxLeaseMonths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxLeaseMonths: parseInt(e.target.value) || 12,
                    })
                  }
                  className="mt-2 font-mono"
                />
              </div>
            </Card>
          </motion.section>

          {/* Amenities */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-foreground">
              Desired amenities
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Select any that matter to you.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {amenityOptions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    formData.desiredAmenities.includes(a.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/40'
                  )}
                  aria-pressed={formData.desiredAmenities.includes(a.id)}
                  aria-label={`Toggle ${a.label}`}
                >
                  <a.icon className="h-4 w-4" aria-hidden />
                  {a.label}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 w-full text-base sm:h-14 sm:text-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" aria-hidden />
                  Start search
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  )
}
