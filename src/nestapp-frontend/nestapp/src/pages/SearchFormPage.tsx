import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
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
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ────────────────────────────── */

type Priority = 'BUDGET' | 'SPACE' | 'AMENITIES' | 'BALANCED'

interface SearchFormData {
  priority: Priority
  maxPrice: number
  minSqft: number
  desiredAmenities: string[]
  maxLeaseMonths: number
}

/* ─── Data ─────────────────────────────── */

const priorities: {
  value: Priority
  label: string
  tagline: string
  description: string
  icon: typeof DollarSign
  emoji: string
}[] = [
  {
    value: 'BUDGET',
    label: 'Save money',
    tagline: 'Under $1,800/mo',
    description: 'Lower rent, flexible on size & amenities',
    icon: DollarSign,
    emoji: '',
  },
  {
    value: 'SPACE',
    label: 'More space',
    tagline: '1,100+ sq ft',
    description: 'Room to breathe, flexible on price',
    icon: Layout,
    emoji: '',
  },
  {
    value: 'AMENITIES',
    label: 'All the perks',
    tagline: 'Laundry, gym, parking',
    description: 'Must-have amenities, flexible on size',
    icon: Sparkles,
    emoji: '',
  },
  {
    value: 'BALANCED',
    label: 'Balanced',
    tagline: 'Best overall',
    description: 'A bit of everything, no compromise',
    icon: Scale,
    emoji: '',
  },
]

const amenityOptions = [
  { id: 'laundry', label: 'Laundry', icon: Shirt },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'wifi', label: 'Internet', icon: Wifi },
  { id: 'pets', label: 'Pets OK', icon: Dog },
]

const leaseOptions = [
  { value: 6, label: '6 mo' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
]

/** Smart defaults per priority — the core of the sub-5s experience */
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

const priceStops = [1000, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 5000]

/* ─── Component ────────────────────────── */

export function SearchFormPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SearchFormData>({
    priority: 'BALANCED',
    maxPrice: 2500,
    minSqft: 800,
    desiredAmenities: ['laundry', 'parking'],
    maxLeaseMonths: 12,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFineTune, setShowFineTune] = useState(false)

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      desiredAmenities: prev.desiredAmenities.includes(id)
        ? prev.desiredAmenities.filter((a) => a !== id)
        : [...prev.desiredAmenities, id],
    }))
  }

  const selectPriority = (value: Priority) => {
    const preset = priorityPresets[value]
    setFormData((prev) => ({
      ...prev,
      priority: value,
      ...preset,
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

  const selectedPriority = priorities.find((p) => p.value === formData.priority)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-cream to-sage-muted/20 dark-mesh">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-sage-muted/40 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80 dark:border-border dark:bg-surface/95 dark:supports-[backdrop-filter]:bg-surface/80">
        <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link
            to="/"
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Nest home"
          >
            <Home className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-lg font-bold text-foreground">Nest</span>
          </Link>
          <div className="w-16" aria-hidden />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <form onSubmit={handleSubmit}>
          {/* ─── Header Copy ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What matters most to you?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pick one. We&apos;ll handle the rest.
            </p>
          </motion.div>

          {/* ─── Priority Cards (THE main interaction) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-8 grid grid-cols-2 gap-3"
          >
            {priorities.map((p, i) => {
              const isActive = formData.priority === p.value
              return (
                <motion.button
                  key={p.value}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectPriority(p.value)}
                  className={cn(
                    'group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                      : 'border-sage-muted/40 bg-white/80 hover:border-primary/30 hover:bg-white hover:shadow-md dark:border-border dark:bg-surface/80 dark:hover:bg-surface-elevated'
                  )}
                  aria-pressed={isActive}
                  aria-label={`Select ${p.label}`}
                >
                  {/* Active checkmark */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                      >
                        <Check className="h-3.5 w-3.5 text-white" aria-hidden />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200',
                      isActive ? 'bg-primary/15 text-primary' : 'bg-sage-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                  >
                    <p.icon className="h-6 w-6" aria-hidden />
                  </div>

                  <div>
                    <span className={cn(
                      'text-base font-semibold transition-colors',
                      isActive ? 'text-primary' : 'text-foreground'
                    )}>
                      {p.label}
                    </span>
                    <span className={cn(
                      'mt-0.5 block text-xs font-medium',
                      isActive ? 'text-primary/70' : 'text-muted-foreground'
                    )}>
                      {p.tagline}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

          {/* ─── Smart Summary ────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Card className="mt-6 border-sage-muted/30 bg-white/60 p-4 backdrop-blur-sm dark:border-border dark:bg-surface/60">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Smart defaults for &ldquo;{selectedPriority?.label}&rdquo;
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-cream px-2.5 py-0.5 font-mono text-xs font-medium text-foreground dark:bg-surface-elevated">
                      ≤ ${formData.maxPrice.toLocaleString()}/mo
                    </span>
                    <span className="inline-flex items-center rounded-md bg-cream px-2.5 py-0.5 font-mono text-xs font-medium text-foreground dark:bg-surface-elevated">
                      ≥ {formData.minSqft.toLocaleString()} sq ft
                    </span>
                    <span className="inline-flex items-center rounded-md bg-cream px-2.5 py-0.5 font-mono text-xs font-medium text-foreground dark:bg-surface-elevated">
                      {formData.maxLeaseMonths} mo lease
                    </span>
                    {formData.desiredAmenities.length > 0 && (
                      <span className="inline-flex items-center rounded-md bg-cream px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {formData.desiredAmenities.length} amenities
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ─── Fine-tune toggle ────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            className="mt-4"
          >
            <button
              type="button"
              onClick={() => setShowFineTune(!showFineTune)}
              className="mx-auto flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-sage-muted/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-surface-elevated"
              aria-expanded={showFineTune}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {showFineTune ? 'Hide options' : 'Fine-tune (optional)'}
              {showFineTune ? (
                <ChevronUp className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden />
              )}
            </button>
          </motion.div>

          {/* ─── Collapsible Fine-tune Panel ─── */}
          <AnimatePresence>
            {showFineTune && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="space-y-6 pt-4">
                  {/* Budget slider */}
                  <Card className="border-sage-muted/30 bg-white/60 p-5 backdrop-blur-sm dark:border-border dark:bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" aria-hidden />
                        <span className="text-sm font-medium text-foreground">Max rent</span>
                      </div>
                      <span className="font-mono text-lg font-bold text-primary">
                        ${formData.maxPrice.toLocaleString()}
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">/mo</span>
                      </span>
                    </div>
                    {/* Quick taps */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {priceStops.map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, maxPrice: price }))}
                          className={cn(
                            'cursor-pointer rounded-lg px-2.5 py-1 font-mono text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            formData.maxPrice === price
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-sage-muted/20 text-muted-foreground hover:bg-sage-muted/40 dark:bg-surface-elevated dark:hover:bg-surface-overlay'
                          )}
                        >
                          ${price >= 1000 ? `${(price / 1000).toFixed(price % 1000 ? 1 : 0)}k` : price}
                        </button>
                      ))}
                    </div>
                    <Slider
                      value={[formData.maxPrice]}
                      onValueChange={([v]) => setFormData((prev) => ({ ...prev, maxPrice: v }))}
                      min={500}
                      max={5000}
                      step={100}
                      className="mt-3"
                    />
                  </Card>

                  {/* Space slider */}
                  <Card className="border-sage-muted/30 bg-white/60 p-5 backdrop-blur-sm dark:border-border dark:bg-surface/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4 text-primary" aria-hidden />
                        <span className="text-sm font-medium text-foreground">Min size</span>
                      </div>
                      <span className="font-mono text-lg font-bold text-primary">
                        {formData.minSqft.toLocaleString()}
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">sq ft</span>
                      </span>
                    </div>
                    <Slider
                      value={[formData.minSqft]}
                      onValueChange={([v]) => setFormData((prev) => ({ ...prev, minSqft: v }))}
                      min={300}
                      max={2500}
                      step={50}
                      className="mt-3"
                    />
                  </Card>

                  {/* Lease - tap chips instead of number input */}
                  <Card className="border-sage-muted/30 bg-white/60 p-5 backdrop-blur-sm dark:border-border dark:bg-surface/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-sm font-medium text-foreground">Max lease</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {leaseOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, maxLeaseMonths: opt.value }))}
                          className={cn(
                            'flex-1 cursor-pointer rounded-xl py-3 text-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            formData.maxLeaseMonths === opt.value
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-sage-muted/20 text-muted-foreground hover:bg-sage-muted/40 dark:bg-surface-elevated dark:hover:bg-surface-overlay'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* Amenities - compact inline chips */}
                  <Card className="border-sage-muted/30 bg-white/60 p-5 backdrop-blur-sm dark:border-border dark:bg-surface/60">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-sm font-medium text-foreground">Must-have amenities</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {amenityOptions.map((a) => {
                        const isSelected = formData.desiredAmenities.includes(a.id)
                        return (
                          <motion.button
                            key={a.id}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleAmenity(a.id)}
                            className={cn(
                              'inline-flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-sage-muted/30 bg-white text-muted-foreground hover:border-primary/30 dark:border-border dark:bg-surface'
                            )}
                            aria-pressed={isSelected}
                            aria-label={`Toggle ${a.label}`}
                          >
                            {isSelected ? (
                              <Check className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <a.icon className="h-3.5 w-3.5" aria-hidden />
                            )}
                            {a.label}
                          </motion.button>
                        )
                      })}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Error ───────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
                role="alert"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Submit ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                Results in ~2 min
              </span>
              <span className="text-sage-muted">·</span>
              <span>100% free</span>
              <span className="text-sage-muted">·</span>
              <span>No signup</span>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="mt-3 h-14 w-full text-base font-semibold shadow-lg shadow-primary/15 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/20 sm:h-16 sm:text-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" aria-hidden />
                  Find my nest
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </main>
    </div>
  )
}
