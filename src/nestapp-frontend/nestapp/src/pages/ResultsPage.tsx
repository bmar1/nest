import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trophy,
  MapPin,
  Bed,
  Bath,
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
  Star,
  BarChart3,
  DollarSign,
  Layout,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── API Types ────────────────────────── */

type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

interface ApiScoreBreakdown {
  priceScore: number
  spaceScore: number
  amenitiesScore: number
  leaseScore: number
}

interface ApartmentDto {
  id: string
  title: string
  price: number
  sqft: number
  bedrooms: number
  bathrooms?: number
  amenities: string[]
  leaseTermMonths: number
  sourceUrl: string
  imageUrl?: string
  imageUrls?: string[]
  finalScore: number
  scoreBreakdown: ApiScoreBreakdown
}

interface SearchResultsDto {
  searchId: string
  status: JobStatus
  totalApartmentsFound?: number
  totalAttempted?: number
  totalSuccessful?: number
  apartments?: ApartmentDto[]
  estimatedWaitSeconds?: number
}

/* ─── Display Types ────────────────────── */

interface ScoreBreakdown {
  priceScore: number   // 0-100 normalised for display
  spaceScore: number
  amenitiesScore: number
  leaseScore: number
}

interface Apartment {
  id: string
  rank: number
  title: string
  price: number
  sqft: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  leaseTermMonths: number
  sourceUrl: string
  imageUrl?: string
  imageUrls: string[]
  finalScore: number
  matchLabel: string
  scoreBreakdown: ScoreBreakdown
}

/* ─── Helpers ──────────────────────────── */

function getMatchLabel(score: number): string {
  if (score >= 90) return 'Perfect Match'
  if (score >= 80) return 'Great Match'
  if (score >= 70) return 'Strong Pick'
  if (score >= 60) return 'Good Value'
  return 'Listed'
}

/** Normalise raw sub-scores to 0-100 for progress bars */
function normaliseBreakdown(raw: ApiScoreBreakdown): ScoreBreakdown {
  return {
    priceScore: Math.round(Math.min(100, (raw.priceScore / 30) * 100)),
    spaceScore: Math.round(Math.min(100, (raw.spaceScore / 30) * 100)),
    amenitiesScore: Math.round(Math.min(100, (raw.amenitiesScore / 20) * 100)),
    leaseScore: Math.round(Math.min(100, (raw.leaseScore / 20) * 100)),
  }
}

function mapDto(dto: ApartmentDto, index: number): Apartment {
  return {
    id: dto.id,
    rank: index + 1,
    title: dto.title,
    price: dto.price,
    sqft: dto.sqft ?? 0,
    bedrooms: dto.bedrooms ?? 0,
    bathrooms: dto.bathrooms ?? 0,
    amenities: dto.amenities ?? [],
    leaseTermMonths: dto.leaseTermMonths ?? 12,
    sourceUrl: dto.sourceUrl,
    imageUrl: dto.imageUrl,
    imageUrls: [dto.imageUrl, ...(dto.imageUrls ?? [])].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index),
    finalScore: Math.round(Number(dto.finalScore)),
    matchLabel: getMatchLabel(Math.round(Number(dto.finalScore))),
    scoreBreakdown: normaliseBreakdown(dto.scoreBreakdown ?? { priceScore: 0, spaceScore: 0, amenitiesScore: 0, leaseScore: 0 }),
  }
}

const amenityIconMap: Record<string, typeof Shirt> = {
  laundry: Shirt,
  parking: Car,
  gym: Dumbbell,
  wifi: Wifi,
  pets: Dog,
  'In-unit laundry': Shirt,
  Parking: Car,
  Gym: Dumbbell,
  'High-speed internet': Wifi,
  'Pet friendly': Dog,
}

const amenityLabel: Record<string, string> = {
  laundry: 'Laundry',
  parking: 'Parking',
  gym: 'Gym',
  wifi: 'Internet',
  pets: 'Pets OK',
}

function displayAmenity(a: string) {
  return amenityLabel[a] ?? a
}

const RESULT_CARD_IMAGES = [
  '/apartment-modern.png',
  '/apartment-hero.png',
  '/apartment-studio.png',
  '/hero-apartment.png',
] as const

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function getListingSourceName(url: string): string {
  if (url.includes('kijiji.ca')) return 'Kijiji'
  if (url.includes('craigslist.org')) return 'Craigslist'
  return 'Source'
}

function getApartmentImage(apartment: Apartment): string {
  if (apartment.imageUrl) return apartment.imageUrl
  const seed = `${apartment.sourceUrl}|${apartment.title}|${apartment.rank}`
  return RESULT_CARD_IMAGES[hashString(seed) % RESULT_CARD_IMAGES.length]
}

function getApartmentImages(apartment: Apartment): string[] {
  const apiImages = apartment.imageUrls.filter(Boolean)
  if (apiImages.length > 0) {
    return apiImages
  }
  return [getApartmentImage(apartment)]
}

function getScoreNarrative(apartment: Apartment): string {
  const dimensions = [
    {
      key: 'price',
      score: apartment.scoreBreakdown.priceScore,
      good: 'the price is very competitive for your budget',
      bad: 'the price runs a bit high for your target range',
    },
    {
      key: 'space',
      score: apartment.scoreBreakdown.spaceScore,
      good: 'the square footage lines up well with your space needs',
      bad: 'the space is a little tighter than your ideal',
    },
    {
      key: 'amenities',
      score: apartment.scoreBreakdown.amenitiesScore,
      good: 'the amenity mix fits your preferences nicely',
      bad: 'the amenities are more limited than your stronger matches',
    },
    {
      key: 'lease',
      score: apartment.scoreBreakdown.leaseScore,
      good: 'the lease terms look flexible for your search',
      bad: 'the lease terms are less flexible than your target',
    },
  ].sort((a, b) => b.score - a.score)

  const best = dimensions[0]
  const weakest = dimensions[dimensions.length - 1]

  if (!best || !weakest) {
    return 'This listing is a balanced match across the factors you asked us to compare.'
  }

  if (best.score - weakest.score <= 10) {
    return 'This listing is fairly balanced across price, space, amenities, and lease flexibility for your search.'
  }

  return `This one stands out because ${best.good}, but ${weakest.bad}.`
}

const CONFETTI_DOTS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  initialX: ((i * 17) % 100) - 50,
  travelY: 120 + ((i * 37) % 180),
  travelX: ((i * 29) % 200) - 100,
  rotate: (i * 97) % 720,
  duration: 2.5 + ((i * 11) % 10) / 10,
  delay: ((i * 7) % 8) / 10,
  sizeClass: i % 2 === 0 ? 'h-2 w-2' : 'h-3 w-3',
  colorClass: ['bg-primary', 'bg-sage', 'bg-warm', 'bg-amber-400', 'bg-emerald-400'][i % 5],
  left: `${20 + ((i * 13) % 60)}%`,
}))

/* ─── Score Bar ────────────────────────── */

function ScoreBar({ label, score, icon: Icon, delay = 0 }: {
  label: string
  score: number
  icon: typeof DollarSign
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  const getColor = (s: number) =>
    s >= 90 ? 'bg-primary' : s >= 75 ? 'bg-sage' : s >= 60 ? 'bg-amber-500' : 'bg-red-400'

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

/* ─── Confetti ─────────────────────────── */

function ConfettiDots() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI_DOTS.map((dot) => (
        <motion.div
          key={dot.id}
          initial={{ opacity: 0, y: -20, x: dot.initialX, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, dot.travelY],
            x: dot.travelX,
            scale: [0, 1, 1, 0.5],
            rotate: dot.rotate,
          }}
          transition={{ duration: dot.duration, delay: dot.delay, ease: 'easeOut' }}
          className={cn('absolute top-1/4 rounded-full', dot.sizeClass, dot.colorClass)}
          style={{ left: dot.left }}
        />
      ))}
    </div>
  )
}

function ListingImageCarousel({
  apartment,
  className,
  showControls = true,
}: {
  apartment: Apartment
  className?: string
  showControls?: boolean
}) {
  const images = getApartmentImages(apartment)
  const [index, setIndex] = useState(0)
  const activeImage = images[index] ?? images[0]
  const fallbackImage = RESULT_CARD_IMAGES[hashString(apartment.sourceUrl || apartment.title) % RESULT_CARD_IMAGES.length]

  const goToPrevious = (event?: MouseEvent) => {
    event?.stopPropagation()
    setIndex((current) => (current === 0 ? images.length - 1 : current - 1))
  }

  const goToNext = (event?: MouseEvent) => {
    event?.stopPropagation()
    setIndex((current) => (current === images.length - 1 ? 0 : current + 1))
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={activeImage}
        alt={apartment.title}
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = fallbackImage
        }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/5 to-transparent" />

      {showControls && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((image, imageIndex) => (
              <button
                type="button"
                key={`${image}-${imageIndex}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setIndex(imageIndex)
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  imageIndex === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                )}
                aria-label={`View image ${imageIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Detail Modal ─────────────────────── */

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
          className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-background/95 shadow-md backdrop-blur-sm transition-all hover:bg-accent hover:shadow-lg"
            aria-label="Close details"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>

          <div className="relative h-48 w-full overflow-hidden rounded-t-3xl sm:h-64">
            <ListingImageCarousel apartment={apartment} className="h-full w-full" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                  <Trophy className="h-5 w-5 text-white" aria-hidden />
                </div>
                <span className="inline-block rounded-full bg-primary/90 px-3 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                  #1 BEST MATCH
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{apartment.title}</h2>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 shadow-sm dark:bg-surface-elevated">
                <DollarSign className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-primary">${apartment.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              {apartment.sqft > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 shadow-sm dark:bg-surface-elevated">
                  <Maximize2 className="h-4 w-4 text-primary" aria-hidden />
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{apartment.sqft.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">sq ft</p>
                  </div>
                </div>
              )}
              {apartment.bedrooms > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 shadow-sm dark:bg-surface-elevated">
                  <Bed className="h-4 w-4 text-primary" aria-hidden />
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{apartment.bedrooms}bd</p>
                    <p className="text-xs text-muted-foreground">bedrooms</p>
                  </div>
                </div>
              )}
              {apartment.bathrooms > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 shadow-sm dark:bg-surface-elevated">
                  <Bath className="h-4 w-4 text-primary" aria-hidden />
                  <div>
                    <p className="font-mono text-xl font-bold text-foreground">{apartment.bathrooms}ba</p>
                    <p className="text-xs text-muted-foreground">bathrooms</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5 shadow-sm dark:bg-surface-elevated">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
                <div>
                  <p className="font-mono text-xl font-bold text-foreground">{apartment.leaseTermMonths}</p>
                  <p className="text-xs text-muted-foreground">mo lease</p>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="mt-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
                Score Breakdown
              </h3>
              <Card className="mt-3 border-sage-muted/30 bg-muted/30 p-5 dark:bg-surface-elevated/90">
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
                <p className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground dark:border-border dark:bg-background/60">
                  {getScoreNarrative(apartment)}
                </p>
              </Card>
            </div>

            {/* Amenities */}
            {apartment.amenities.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground">Amenities</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {apartment.amenities.map((a) => {
                    const Icon = amenityIconMap[a] ?? CheckCircle2
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                        {displayAmenity(a)}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

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

/* ─── Ranking Card ─────────────────────── */

function RankingCard({ apartment, onViewDetails }: {
  apartment: Apartment
  onViewDetails?: () => void
}) {
  const isFirst = apartment.rank === 1
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const sourceName = getListingSourceName(apartment.sourceUrl)
  const isClickable = Boolean(onViewDetails)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: apartment.rank * 0.07 }}
      whileHover={isClickable ? { scale: 1.01, y: -4 } : { scale: 1.005, y: -2 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
        apartment.rank === 1
          ? 'cursor-pointer border-primary/40 bg-card shadow-xl shadow-primary/10 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/15'
          : 'cursor-pointer border-sage-muted/30 bg-card shadow-sm hover:border-sage-muted/50 hover:shadow-md dark:border-border'
      )}
      onClick={onViewDetails}
    >
      {apartment.rank === 1 && (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1 rounded-bl-2xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg">
            <Trophy className="h-3.5 w-3.5" aria-hidden />
            BEST MATCH
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row">
        <div className={cn(
          'relative shrink-0 overflow-hidden',
          isFirst
            ? 'h-44 sm:h-auto sm:w-64'
            : 'h-32 sm:h-auto sm:w-48'
        )}>
          <ListingImageCarousel apartment={apartment} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
          {/* Rank badge */}
          <div className={cn(
            'absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-md',
            apartment.rank === 1
              ? 'bg-background/95 text-primary backdrop-blur-sm dark:bg-card/95 dark:text-primary'
              : 'bg-background/95 text-foreground backdrop-blur-sm dark:bg-card/95 dark:text-primary'
          )}>
            #{apartment.rank}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn('font-semibold truncate', apartment.rank === 1 ? 'text-xl text-foreground' : 'text-lg text-foreground')}>
                  {apartment.title}
                </h3>
                <span className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  apartment.rank === 1 ? 'bg-primary/10 text-primary' : 'bg-sage-muted/30 text-muted-foreground dark:bg-accent dark:text-foreground'
                )}>
                  {apartment.matchLabel}
                </span>
              </div>
              {apartment.sourceUrl && (
                <a
                  href={apartment.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">View on {sourceName}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                </a>
              )}
            </div>

            {/* Score circle */}
            <div className={cn('shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-2', apartment.rank === 1 ? 'bg-primary/10' : 'bg-sage-muted/20')}>
              <span className={cn('font-mono text-2xl font-bold', apartment.rank === 1 ? 'text-primary' : 'text-foreground')}>
                {apartment.finalScore}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">score</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono font-semibold text-primary">
              <DollarSign className="h-3.5 w-3.5" aria-hidden />
              ${apartment.price.toLocaleString()}/mo
            </span>
            {apartment.sqft > 0 && (
              <span className="flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                {apartment.sqft.toLocaleString()} ft²
              </span>
            )}
            {apartment.bedrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <Bed className="h-3.5 w-3.5" aria-hidden />
                {apartment.bedrooms}bd
              </span>
            )}
            {apartment.bathrooms > 0 && (
              <span className="flex items-center gap-1.5">
                <Bath className="h-3.5 w-3.5" aria-hidden />
                {apartment.bathrooms}ba
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {apartment.leaseTermMonths} mo
            </span>
          </div>

          {/* Mini score bars */}
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
                    className={cn('h-full rounded-full transition-all duration-500', score >= 90 ? 'bg-primary' : score >= 75 ? 'bg-sage' : score >= 60 ? 'bg-amber-500' : 'bg-red-400')}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {getScoreNarrative(apartment)}
          </p>

          {/* Amenity chips */}
          {apartment.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {apartment.amenities.slice(0, apartment.rank === 1 ? 5 : 3).map((a) => {
                const Icon = amenityIconMap[a] ?? CheckCircle2
                return (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1 rounded-md bg-sage-muted/15 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" aria-hidden />
                    {displayAmenity(a)}
                  </span>
                )
              })}
              {apartment.amenities.length > (apartment.rank === 1 ? 5 : 3) && (
                <span className="rounded-md bg-sage-muted/15 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  +{apartment.amenities.length - (apartment.rank === 1 ? 5 : 3)} more
                </span>
              )}
            </div>
          )}

          {isClickable && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Click to view full details
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Loading Screen ───────────────────── */

function LoadingScreen({
  status,
  rateLimited = false,
  retryIn = 0,
}: {
  status: JobStatus
  rateLimited?: boolean
  retryIn?: number
}) {
  const steps = ['Searching listings...', 'Comparing options...', 'Scoring matches...']
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % steps.length), 2500)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-cream to-sage-muted/10 px-4 dark:bg-none dark:bg-background">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="text-primary"
      >
        <Loader2 className="h-12 w-12" aria-hidden />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-2xl font-bold text-foreground"
      >
        Finding your best matches
      </motion.h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-muted-foreground"
        >
          {steps[step]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-8 flex items-center gap-2 rounded-full border border-sage-muted/40 bg-muted/50 px-5 py-2.5 text-sm text-muted-foreground backdrop-blur-sm dark:border-border dark:bg-surface/80">
        <Clock className="h-4 w-4 text-primary" aria-hidden />
        This usually takes under 2 minutes
        {status === 'PROCESSING' && (
          <span className="ml-1 flex h-2 w-2 rounded-full bg-primary">
            <span className="inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
          </span>
        )}
      </div>

      <AnimatePresence>
        {rateLimited && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-50/80 px-5 py-2.5 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            Too many requests — resuming in {retryIn}s
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Main Page ────────────────────────── */

export function ResultsPage() {
  const { searchId } = useParams<{ searchId: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<JobStatus>('PENDING')
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [totalFound, setTotalFound] = useState(0)
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [retryIn, setRetryIn] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!searchId) {
      navigate('/search')
      return
    }

    let cancelled = false
    // Exponential back-off state: starts at 3s, doubles on each non-terminal
    // response, capped at 30s. Resets to 3s after a rate-limit pause clears.
    let delay = 3000
    let networkErrors = 0

    const schedule = (ms: number) => {
      if (cancelled) return
      timeoutRef.current = setTimeout(poll, ms)
    }

    const poll = async () => {
      if (cancelled) return
      try {
        const { data } = await axios.get<SearchResultsDto>(
          `http://localhost:8080/api/v1/search/${searchId}/results`
        )

        networkErrors = 0
        if (cancelled) return
        setStatus(data.status)

        if (data.status === 'COMPLETED') {
          const mapped = (data.apartments ?? []).map(mapDto)
          setApartments(mapped)
          setTotalFound(data.totalApartmentsFound ?? mapped.length)
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3500)
        } else if (data.status === 'FAILED') {
          navigate('/search')
        } else {
          // Still PENDING or PROCESSING — back off and try again
          delay = Math.min(delay * 2, 30000)
          schedule(delay)
        }
      } catch (err) {
        if (cancelled) return

        if (axios.isAxiosError(err) && err.response?.status === 429) {
          // Rate limited — honour Retry-After then resume
          const retryAfter = parseInt(err.response.headers['retry-after'] ?? '60', 10)
          setRateLimited(true)
          setRetryIn(retryAfter)

          let remaining = retryAfter
          const countdownId = setInterval(() => {
            remaining -= 1
            setRetryIn(remaining)
            if (remaining <= 0) {
              clearInterval(countdownId)
              if (!cancelled) {
                setRateLimited(false)
                delay = 3000 // reset back-off after the pause
                schedule(0)
              }
            }
          }, 1000)
        } else if (axios.isAxiosError(err) && err.response && err.response.status >= 500) {
          navigate('/search')
        } else {
          // Transient network error — retry up to 3 times before giving up
          networkErrors += 1
          if (networkErrors >= 3) {
            navigate('/search')
          } else {
            delay = Math.min(delay * 2, 30000)
            schedule(delay)
          }
        }
      }
    }

    poll() // immediate first check

    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [searchId, navigate])

  /* ── Loading ── */
  if (status !== 'COMPLETED') {
    return <LoadingScreen status={status} rateLimited={rateLimited} retryIn={retryIn} />
  }

  const topApartment = apartments[0]

  return (
    <div className="min-h-screen bg-linear-to-b from-cream via-cream to-sage-muted/10 dark:from-background dark:via-background dark:to-accent/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sage-muted/30 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80 dark:border-border dark:bg-background/95 dark:supports-[backdrop-filter]:bg-background/80">
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
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={28} height={28} className="text-primary" />
            <span className="text-lg font-bold text-foreground">Nest</span>
          </Link>
          <div className="w-20" aria-hidden />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Celebration header */}
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
            <span className="font-mono font-semibold text-primary">{totalFound}</span>{' '}
            {totalFound === 1 ? 'apartment' : 'apartments'} ranked by your priorities.
            {topApartment && (
              <>
                {' '}
                <span className="font-medium text-foreground">{topApartment.title}</span> scored highest.
              </>
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" aria-hidden />
              Live listings
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" aria-hidden />
              Scored for your priorities
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-primary" aria-hidden />
              Transparent scoring
            </span>
          </motion.div>
        </motion.div>

        {/* Results list */}
        {apartments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-col items-center gap-4 text-center"
          >
            <AlertCircle className="h-12 w-12 text-muted-foreground/40" aria-hidden />
            <p className="text-lg font-medium text-foreground">No listings found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search again.</p>
            <Button size="lg" className="mt-2" asChild>
              <Link to="/search">Adjust search</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="mt-10 space-y-4">
            {apartments.map((apt) => (
              <RankingCard
                key={apt.id}
                apartment={apt}
                onViewDetails={() => setSelectedApartment(apt)}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {apartments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border border-sage-muted/30 bg-muted/40 p-8 text-center backdrop-blur-sm dark:border-border dark:bg-card/90"
          >
            <p className="text-lg font-semibold text-foreground">Not quite right?</p>
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
        )}
      </main>

      {/* Detail modal for #1 */}
      <AnimatePresence>
        {selectedApartment && (
          <ApartmentDetailModal apartment={selectedApartment} onClose={() => setSelectedApartment(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
