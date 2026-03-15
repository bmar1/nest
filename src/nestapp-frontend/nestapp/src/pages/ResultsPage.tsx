import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Home,
  Trophy,
  Star,
  MapPin,
  Bed,
  Maximize2,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
  CheckCircle2,
  Shirt,
  Car,
  Dumbbell,
  Wifi,
  Dog,
  X,
  Heart,
  Share2,
  TrendingUp,
  Eye,
  BarChart3,
  DollarSign,
  Layout,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Hardcoded Demo Data ──────────────── */

interface Apartment {
  id: string
  rank: number
  title: string
  address: string
  price: number
  sqft: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  leaseTermMonths: number
  sourceUrl: string
  image: string
  finalScore: number
  matchLabel: string
  highlights: string[]
  scoreBreakdown: {
    priceScore: number
    spaceScore: number
    amenitiesScore: number
    leaseScore: number
  }
}

const amenityIconMap: Record<string, typeof Shirt> = {
  'In-unit laundry': Shirt,
  Parking: Car,
  Gym: Dumbbell,
  'High-speed internet': Wifi,
  'Pet friendly': Dog,
}

const apartments: Apartment[] = [
  {
    id: '1',
    rank: 1,
    title: 'The Sunlit Gallery',
    address: '142 Maple Avenue, Brooklyn, NY',
    price: 2150,
    sqft: 1050,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['In-unit laundry', 'Parking', 'Gym', 'High-speed internet'],
    leaseTermMonths: 12,
    sourceUrl: '#',
    image: '/apartment-hero.png',
    finalScore: 97,
    matchLabel: 'Perfect Match',
    highlights: [
      'Natural light all day — south-facing windows',
      'Recently renovated kitchen with quartz countertops',
      'Walking distance to 3 subway lines',
    ],
    scoreBreakdown: {
      priceScore: 92,
      spaceScore: 98,
      amenitiesScore: 100,
      leaseScore: 95,
    },
  },
  {
    id: '2',
    rank: 2,
    title: 'Harbor View Studio',
    address: '88 Atlantic Blvd, Jersey City, NJ',
    price: 1850,
    sqft: 680,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['Gym', 'High-speed internet', 'Pet friendly'],
    leaseTermMonths: 12,
    sourceUrl: '#',
    image: '/apartment-studio.png',
    finalScore: 91,
    matchLabel: 'Great Value',
    highlights: [
      'Stunning harbor views from 12th floor',
      'Pet-friendly building with dog park',
    ],
    scoreBreakdown: {
      priceScore: 96,
      spaceScore: 78,
      amenitiesScore: 88,
      leaseScore: 95,
    },
  },
  {
    id: '3',
    rank: 3,
    title: 'The Maple Residence',
    address: '301 Park Street, Hoboken, NJ',
    price: 2400,
    sqft: 1200,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['In-unit laundry', 'Parking', 'Gym', 'High-speed internet', 'Pet friendly'],
    leaseTermMonths: 6,
    sourceUrl: '#',
    image: '/apartment-modern.png',
    finalScore: 88,
    matchLabel: 'Most Spacious',
    highlights: [
      'Full 2 bed / 2 bath with walk-in closet',
      'Flexible 6-month lease option',
    ],
    scoreBreakdown: {
      priceScore: 72,
      spaceScore: 100,
      amenitiesScore: 100,
      leaseScore: 85,
    },
  },
  {
    id: '4',
    rank: 4,
    title: 'Greenpoint Corner',
    address: '55 Franklin St, Brooklyn, NY',
    price: 1950,
    sqft: 750,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['In-unit laundry', 'High-speed internet'],
    leaseTermMonths: 12,
    sourceUrl: '#',
    image: '/apartment-studio.png',
    finalScore: 84,
    matchLabel: 'Cozy Pick',
    highlights: [
      'Quiet tree-lined street',
      'In-unit washer/dryer',
    ],
    scoreBreakdown: {
      priceScore: 88,
      spaceScore: 82,
      amenitiesScore: 70,
      leaseScore: 95,
    },
  },
  {
    id: '5',
    rank: 5,
    title: 'Riverside Loft',
    address: '12 River Rd, Long Island City, NY',
    price: 2800,
    sqft: 1400,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['Parking', 'Gym', 'High-speed internet', 'Pet friendly'],
    leaseTermMonths: 12,
    sourceUrl: '#',
    image: '/apartment-modern.png',
    finalScore: 79,
    matchLabel: 'Family Friendly',
    highlights: [
      'Largest layout with dedicated office space',
      'Rooftop access with river views',
    ],
    scoreBreakdown: {
      priceScore: 58,
      spaceScore: 100,
      amenitiesScore: 92,
      leaseScore: 95,
    },
  },
]

/* ─── Score Bar Component ──────────────── */

function ScoreBar({ label, score, icon: Icon, delay = 0 }: {
  label: string
  score: number
  icon: typeof DollarSign
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const getColor = (s: number) => {
    if (s >= 90) return 'bg-primary'
    if (s >= 75) return 'bg-sage'
    if (s >= 60) return 'bg-amber-500'
    return 'bg-red-400'
  }

  return (
    <div ref={ref} className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" aria-hidden />
          {label}
        </span>
        <span className="font-mono font-semibold text-foreground">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-sage-muted/20">
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: `${score}%` } : { width: 0 }}
          transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn('h-full rounded-full', getColor(score))}
        />
      </div>
    </div>
  )
}

/* ─── Celebration Confetti ─────────────── */

function ConfettiDots() {
  const colors = ['bg-primary', 'bg-sage', 'bg-warm', 'bg-amber-400', 'bg-emerald-400']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            y: -20,
            x: Math.random() * 100 - 50,
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, 100 + Math.random() * 200],
            x: (Math.random() - 0.5) * 200,
            scale: [0, 1, 1, 0.5],
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            delay: Math.random() * 0.8,
            ease: 'easeOut',
          }}
          className={cn(
            'absolute top-1/4 left-1/2 rounded-full',
            Math.random() > 0.5 ? 'h-2 w-2' : 'h-3 w-3',
            colors[Math.floor(Math.random() * colors.length)]
          )}
          style={{ left: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  )
}

/* ─── #1 Apartment Detail Modal ──────── */

function ApartmentDetailModal({ apartment, onClose }: { apartment: Apartment; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-cream shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white hover:shadow-lg"
            aria-label="Close details"
          >
            <X className="h-5 w-5 text-charcoal" />
          </button>

          {/* Hero image */}
          <div className="relative h-64 w-full overflow-hidden rounded-t-3xl sm:h-80">
            <img
              src={apartment.image}
              alt={apartment.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                  <Trophy className="h-5 w-5 text-white" aria-hidden />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-primary/90 px-3 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                    #1 BEST MATCH
                  </span>
                </div>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{apartment.title}</h2>
              <p className="flex items-center gap-1 text-sm text-white/80">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {apartment.address}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                <DollarSign className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-primary">${apartment.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                <Maximize2 className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-foreground">{apartment.sqft.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">sq ft</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                <Bed className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-foreground">{apartment.bedrooms}bd / {apartment.bathrooms}ba</p>
                  <p className="text-xs text-muted-foreground">bedrooms</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-foreground">{apartment.leaseTermMonths}</p>
                  <p className="text-xs text-muted-foreground">mo lease</p>
                </div>
              </div>
            </div>

            {/* Why this is your #1 */}
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                Why this is your #1
              </h3>
              <ul className="mt-3 space-y-2">
                {apartment.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Score breakdown */}
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
                Score Breakdown
              </h3>
              <Card className="mt-3 border-sage-muted/30 bg-white/70 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Match</span>
                  <span className="font-mono text-3xl font-bold text-primary">
                    {apartment.finalScore}
                    <span className="text-base font-normal text-muted-foreground">/100</span>
                  </span>
                </div>
                <div className="space-y-3">
                  <ScoreBar label="Price" score={apartment.scoreBreakdown.priceScore} icon={DollarSign} delay={0} />
                  <ScoreBar label="Space" score={apartment.scoreBreakdown.spaceScore} icon={Layout} delay={0.1} />
                  <ScoreBar label="Amenities" score={apartment.scoreBreakdown.amenitiesScore} icon={Sparkles} delay={0.2} />
                  <ScoreBar label="Lease" score={apartment.scoreBreakdown.leaseScore} icon={Clock} delay={0.3} />
                </div>
              </Card>
            </div>

            {/* Amenities */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground">Amenities</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {apartment.amenities.map((a) => {
                  const Icon = amenityIconMap[a] || CheckCircle2
                  return (
                    <span
                      key={a}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {a}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex gap-3">
              <Button size="lg" className="h-14 flex-1 text-base font-semibold" asChild>
                <a href={apartment.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  View listing
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-5" aria-label="Save listing">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-5" aria-label="Share listing">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Ranking List Card ────────────────── */

function RankingCard({ apartment, onViewDetails }: {
  apartment: Apartment
  onViewDetails?: () => void
}) {
  const isFirst = apartment.rank === 1
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: apartment.rank * 0.08 }}
      whileHover={isFirst ? { scale: 1.01, y: -4 } : { scale: 1.005, y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
        isFirst
          ? 'cursor-pointer border-primary/40 bg-white shadow-xl shadow-primary/10 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/15'
          : 'cursor-default border-sage-muted/30 bg-white shadow-sm hover:border-sage-muted/50 hover:shadow-md'
      )}
      onClick={isFirst ? onViewDetails : undefined}
    >
      {/* #1 crown badge */}
      {isFirst && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1 rounded-bl-2xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            BEST MATCH
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className={cn(
          'relative overflow-hidden',
          isFirst ? 'h-52 sm:h-auto sm:w-72' : 'h-40 sm:h-auto sm:w-56'
        )}>
          <img
            src={apartment.image}
            alt={apartment.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />

          {/* Rank badge */}
          <div className={cn(
            'absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-lg',
            isFirst
              ? 'bg-primary text-white'
              : 'bg-white/95 text-charcoal backdrop-blur-sm'
          )}>
            #{apartment.rank}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  'font-semibold',
                  isFirst ? 'text-xl text-foreground' : 'text-lg text-foreground'
                )}>
                  {apartment.title}
                </h3>
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  isFirst
                    ? 'bg-primary/10 text-primary'
                    : 'bg-sage-muted/30 text-muted-foreground'
                )}>
                  {apartment.matchLabel}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {apartment.address}
              </p>
            </div>

            {/* Score circle */}
            <div className={cn(
              'flex flex-col items-center justify-center rounded-2xl px-4 py-2',
              isFirst ? 'bg-primary/10' : 'bg-sage-muted/20'
            )}>
              <span className={cn(
                'font-mono text-2xl font-bold',
                isFirst ? 'text-primary' : 'text-foreground'
              )}>
                {apartment.finalScore}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                score
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono font-semibold text-primary">
              <DollarSign className="h-3.5 w-3.5" aria-hidden />
              ${apartment.price.toLocaleString()}/mo
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              {apartment.sqft.toLocaleString()} ft²
            </span>
            <span className="flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5" aria-hidden />
              {apartment.bedrooms}bd / {apartment.bathrooms}ba
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {apartment.leaseTermMonths} mo
            </span>
          </div>

          {/* Score mini bars */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Price', score: apartment.scoreBreakdown.priceScore },
              { label: 'Space', score: apartment.scoreBreakdown.spaceScore },
              { label: 'Amenities', score: apartment.scoreBreakdown.amenitiesScore },
              { label: 'Lease', score: apartment.scoreBreakdown.leaseScore },
            ].map(({ label, score }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{label}</span>
                  <span className="font-mono font-medium">{score}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-sage-muted/20">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      score >= 90 ? 'bg-primary' : score >= 75 ? 'bg-sage' : score >= 60 ? 'bg-amber-500' : 'bg-red-400'
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Amenity chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {apartment.amenities.slice(0, isFirst ? 5 : 3).map((a) => {
              const Icon = amenityIconMap[a] || CheckCircle2
              return (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 rounded-md bg-sage-muted/15 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <Icon className="h-3 w-3" aria-hidden />
                  {a}
                </span>
              )
            })}
            {apartment.amenities.length > (isFirst ? 5 : 3) && (
              <span className="rounded-md bg-sage-muted/15 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                +{apartment.amenities.length - (isFirst ? 5 : 3)} more
              </span>
            )}
          </div>

          {/* Click hint for #1 */}
          {isFirst && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Click to view full details
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Results Page ────────────────── */

export function ResultsPage() {
  const [showDetail, setShowDetail] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const topApartment = apartments[0]

  // Auto-dismiss confetti after 3s
  useState(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3500)
    return () => clearTimeout(timer)
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-cream to-sage-muted/10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sage-muted/30 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            to="/search"
            className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="New search"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="text-sm font-medium">New search</span>
          </Link>
          <Link
            to="/"
            className="flex min-h-[44px] items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Nest home"
          >
            <Home className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-lg font-bold text-foreground">Nest</span>
          </Link>
          <div className="w-20" aria-hidden />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* ─── Celebration Header ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative text-center"
        >
          {showConfetti && <ConfettiDots />}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
          >
            <Trophy className="h-10 w-10 text-primary" aria-hidden />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            We found your next home
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-auto mt-3 max-w-lg text-lg text-muted-foreground"
          >
            <span className="font-mono font-semibold text-primary">{apartments.length}</span>{' '}
            apartments ranked by your priorities.{' '}
            <span className="font-medium text-foreground">{topApartment.title}</span> scored highest.
          </motion.p>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" aria-hidden />
              Verified listings
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" aria-hidden />
              47 sources scanned
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-primary" aria-hidden />
              Transparent scoring
            </span>
          </motion.div>
        </motion.div>

        {/* ─── Apartment List ──────────────── */}
        <div className="mt-10 space-y-4">
          {apartments.map((apt) => (
            <RankingCard
              key={apt.id}
              apartment={apt}
              onViewDetails={apt.rank === 1 ? () => setShowDetail(true) : undefined}
            />
          ))}
        </div>

        {/* ─── Bottom CTA ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl border border-sage-muted/30 bg-white/60 p-8 text-center backdrop-blur-sm"
        >
          <p className="text-lg font-semibold text-foreground">
            Not quite right?
          </p>
          <p className="mt-1 text-muted-foreground">
            Adjust your priorities and search again — it&apos;s always free.
          </p>
          <Button size="lg" className="mt-5 h-14 px-10 text-base" asChild>
            <Link to="/search" className="inline-flex items-center gap-2">
              Refine search
              <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden />
            </Link>
          </Button>
        </motion.div>
      </main>

      {/* ─── Detail Modal for #1 ─────────── */}
      <AnimatePresence>
        {showDetail && (
          <ApartmentDetailModal
            apartment={topApartment}
            onClose={() => setShowDetail(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
