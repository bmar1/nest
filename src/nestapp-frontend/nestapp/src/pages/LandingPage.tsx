import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValueEvent } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { ScrollIndicator } from '@/components/ui/scroll-indicator'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Home,
  ChevronRight,
  Search,
  Zap,
  Sparkles,
  Shield,
  CheckCircle2,
  Quote,
  Clock,
  Layers,
  BarChart3,
  Eye,
  ArrowRight,
  X,
  MousePointerClick,
  Timer,
  AlertTriangle,
  Copy,
  LinkIcon,
  BrainCircuit,
  Menu,
  MapPin,
  Heart,
  Coffee,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Data ─────────────────────────────── */

const stats = [
  { value: 2, suffix: ' min', label: 'To your shortlist' },
  { value: 100, suffix: '+', label: 'Listings per search' },
  { value: 0, suffix: '', label: 'Hidden fees' },
]

const frustrations = [
  {
    icon: Copy,
    title: 'Duplicate listings',
    description: 'The same apartment on five different sites with five different prices.',
  },
  {
    icon: LinkIcon,
    title: 'Broken links',
    description: 'Half the listings are expired. You won\'t know until you click.',
  },
  {
    icon: BrainCircuit,
    title: 'Decision fatigue',
    description: 'After 40 tabs, everything blurs together. Nothing feels right.',
  },
]

const features = [
  {
    icon: Layers,
    title: 'Smart Aggregation',
    description: 'One search. Dozens of sources. Every listing in one clean view.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Timer,
    title: 'Ranked in 2 Minutes',
    description: 'Scored by what you care about — price, space, amenities, lease.',
    color: 'bg-warm/10 text-warm',
  },
  {
    icon: Eye,
    title: 'Transparent Scoring',
    description: 'See exactly why each apartment ranked. No black boxes. No secrets.',
    color: 'bg-sage/10 text-sage',
  },
]

const steps = [
  {
    icon: MousePointerClick,
    number: '01',
    title: 'Tell us what matters',
    description: 'Budget, space, amenities — pick your priority. We\'ll weight results accordingly.',
  },
  {
    icon: Zap,
    number: '02',
    title: 'We search for you',
    description: 'Multiple sites. One unified search. Ranked by your preferences.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Get your shortlist',
    description: 'Top matches in under 2 minutes. No endless scrolling, ever.',
  },
]

const journeyStages = [
  {
    id: 'frustration',
    icon: AlertTriangle,
    badge: 'The Frustration',
    title: 'You open 42 tabs. None of them feel like home.',
    description: 'Every site shows you the same recycled listings in different order. Filters barely work. Half the results are already taken. You spend hours just to feel more confused.',
    visual: 'chaos' as const,
    accentColor: 'text-red-500',
    bgAccent: 'bg-red-500/10',
  },
  {
    id: 'search',
    icon: Search,
    badge: 'The Search',
    title: 'One search. Every source. Your priorities.',
    description: 'Nest pulls listings from every major platform into one unified search. You tell us what matters \u2014 budget, space, amenities \u2014 and we score everything for you.',
    visual: 'search' as const,
    accentColor: 'text-primary',
    bgAccent: 'bg-primary/10',
  },
  {
    id: 'shortlist',
    icon: Sparkles,
    badge: 'The Shortlist',
    title: 'Ranked results in under 2 minutes.',
    description: 'No more endless scrolling. Get a clean, ranked shortlist of your top matches \u2014 with transparent scores so you know exactly why each apartment made the cut.',
    visual: 'shortlist' as const,
    accentColor: 'text-sage',
    bgAccent: 'bg-sage/10',
  },
  {
    id: 'home',
    icon: Heart,
    badge: 'The Home',
    title: 'You found it. Welcome home.',
    description: 'That warm feeling when the search is finally over. The keys are in your hand. The coffee is brewing. This is what Nest was built for.',
    visual: 'home' as const,
    accentColor: 'text-warm',
    bgAccent: 'bg-warm/10',
  },
]

const testimonials = [
  {
    quote: "Cut my search from weeks to an afternoon. The scoring actually made sense — I could see exactly why each place ranked.",
    author: 'Sarah M.',
    context: 'Toronto, 2024',
    initials: 'SM',
  },
  {
    quote: "Finally, something that understands I care more about laundry than square footage. Found my place in one sitting.",
    author: 'James K.',
    context: 'First-time renter',
    initials: 'JK',
  },
  {
    quote: "I was drowning in tabs. Nest gave me a shortlist of 8 apartments and the first one was perfect. Magic.",
    author: 'Priya R.',
    context: 'Vancouver, 2024',
    initials: 'PR',
  },
]

const benefits = [
  'Free to use — no signup, no fees',
  'Transparent scoring — see why each apartment ranks',
  'Your time back — results in under 2 minutes',
  'No duplicate listings — we de-dupe for you',
]

/* ─── Animated Word Reveal ─────────────── */

function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── Floating Apartment Card Mockup ───── */

function FloatingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="animate-float"
    >
      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border-2 border-sage-muted/50 bg-white/90 shadow-2xl backdrop-blur-md dark:border-border dark:bg-surface/90">
        <div className="relative h-72 overflow-hidden">
          <img
            src="/hero-apartment.png"
            alt="Beautiful modern apartment with warm natural lighting"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute top-3 right-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            98% Match
          </div>
        </div>
        <div className="p-7">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Sunlit Studio Downtown</h4>
            <span className="font-mono text-lg font-bold text-primary">$1,850</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">620 sq ft · 1 bed · Pet friendly</p>
          {/* Mini score bar */}
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Price', score: 92 },
              { label: 'Space', score: 78 },
              { label: 'Amenities', score: 95 },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-muted-foreground">{s.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sage-muted/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-primary/70"
                  />
                </div>
                <span className="font-mono text-muted-foreground">{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Interactive Tab Counter ──────────── */

function TabCounter() {
  const [tabCount, setTabCount] = useState(1)
  const maxTabs = 42
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!inView) return
    intervalRef.current = setInterval(() => {
      setTabCount((prev) => {
        if (prev >= maxTabs) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return maxTabs
        }
        return prev + 1
      })
    }, 60)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [inView])

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative flex items-baseline gap-1">
        <motion.span
          key={tabCount}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className={cn(
            'font-mono text-6xl font-bold sm:text-7xl',
            tabCount >= maxTabs ? 'text-red-400' : 'text-white dark:text-white'
          )}
        >
          {tabCount}
        </motion.span>
        <span className="text-2xl font-semibold text-slate-400 dark:text-slate-400">tabs</span>
      </div>
      <AnimatePresence>
        {tabCount >= maxTabs && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-medium text-red-500/80"
          >
            ...and still no clear winner.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Scroll-Reveal Journey ──────────────── */

function ScrollRevealJourney() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const stageIndex = Math.min(
      Math.floor(latest * journeyStages.length),
      journeyStages.length - 1
    )
    setActiveIndex(stageIndex)
  })

  const activeStage = journeyStages[activeIndex]

  const stageVisuals: Record<string, React.ReactNode> = {
    chaos: (
      <div className="relative flex h-full items-center justify-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{
              rotate: (i - 2) * 6 + (activeIndex === 0 ? (i % 2 === 0 ? 2 : -2) : 0),
              x: (i - 2) * 18,
              y: (i - 2) * -8,
              scale: activeIndex === 0 ? 1 : 0.9,
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="absolute h-40 w-56 rounded-xl border border-red-200/50 bg-white/90 p-3 shadow-lg dark:border-red-500/20 dark:bg-surface/90"
          >
            <div className="h-2 w-16 rounded-full bg-red-200/60" />
            <div className="mt-2 h-2 w-24 rounded-full bg-slate-200" />
            <div className="mt-1.5 h-2 w-20 rounded-full bg-slate-100" />
            <div className="mt-3 h-16 rounded-lg bg-slate-50" />
          </motion.div>
        ))}
        <motion.div
          animate={{ opacity: activeIndex === 0 ? 1 : 0 }}
          className="absolute -right-2 -bottom-4 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white shadow-md"
        >
          42 tabs open
        </motion.div>
      </div>
    ),
    search: (
      <div className="relative flex h-full items-center justify-center">
        <motion.div
          animate={{ scale: activeIndex === 1 ? 1 : 0.85, opacity: activeIndex === 1 ? 1 : 0.5 }}
          transition={{ type: 'spring', damping: 20 }}
          className="h-64 w-full max-w-xs rounded-2xl border-2 border-primary/30 bg-white/95 p-5 shadow-xl dark:bg-surface/95"
        >
          <div className="flex items-center gap-2 rounded-xl bg-cream px-4 py-3 dark:bg-surface-elevated">
            <Search className="h-4 w-4 text-primary" />
            <div className="h-2 w-32 rounded-full bg-primary/20" />
          </div>
          <div className="mt-4 space-y-2">
            {['Budget', 'Space', 'Amenities'].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-16 text-xs text-muted-foreground">{label}</span>
                <div className="h-2 flex-1 rounded-full bg-sage-muted/30">
                  <motion.div
                    animate={{ width: activeIndex === 1 ? `${70 + i * 10}%` : '0%' }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    className="h-full rounded-full bg-primary/60"
                  />
                </div>
              </div>
            ))}
          </div>
          <motion.div
            animate={{ opacity: activeIndex === 1 ? 1 : 0, y: activeIndex === 1 ? 0 : 8 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary"
          >
            <Zap className="h-3 w-3" />
            Scanning 47 sources...
          </motion.div>
        </motion.div>
      </div>
    ),
    shortlist: (
      <div className="relative flex h-full items-center justify-center">
        <div className="w-full max-w-xs space-y-3">
          {[{ score: 98, name: 'Sunlit Studio', price: '$1,850' }, { score: 94, name: 'Maple Gallery', price: '$2,100' }, { score: 89, name: 'Harbor View', price: '$1,950' }].map((apt, i) => (
            <motion.div
              key={apt.name}
              animate={{
                opacity: activeIndex === 2 ? 1 : 0,
                x: activeIndex === 2 ? 0 : 30,
                scale: activeIndex === 2 ? 1 : 0.95,
              }}
              transition={{ delay: i * 0.12, type: 'spring', damping: 20 }}
              className="flex items-center justify-between rounded-xl border border-sage-muted/50 bg-white/95 px-4 py-3 shadow-sm dark:border-border dark:bg-surface/95"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <span className="font-mono text-xs font-bold text-primary">{apt.score}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{apt.name}</p>
                  <p className="text-xs text-muted-foreground">{apt.price}/mo</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </motion.div>
          ))}
        </div>
      </div>
    ),
    home: (
      <div className="relative flex h-full items-center justify-center">
        <motion.div
          animate={{
            scale: activeIndex === 3 ? 1 : 0.85,
            opacity: activeIndex === 3 ? 1 : 0.3,
          }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-center"
        >
          <motion.div
            animate={activeIndex === 3 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: activeIndex === 3 ? Infinity : 0, ease: 'easeInOut' }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-warm/10"
          >
            <Heart className="h-12 w-12 text-warm" />
          </motion.div>
          <p className="mt-4 text-lg font-semibold text-foreground">Welcome home.</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Coffee className="h-4 w-4" />
            <span>Coffee's brewing</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Your neighborhood</span>
          </div>
        </motion.div>
      </div>
    ),
  }

  return (
    <section className="border-t border-sage-muted/30 bg-gradient-to-b from-white to-cream dark:from-background dark:to-surface dark:border-border">
      <div ref={containerRef} className="relative" style={{ height: `${journeyStages.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Left: Visual panel */}
              <div className="hidden h-[400px] lg:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage.visual}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="h-full w-full rounded-3xl border border-sage-muted/30 bg-cream/60 p-8 backdrop-blur-sm dark:border-border dark:bg-surface/60"
                  >
                    {stageVisuals[activeStage.visual]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: Text content */}
              <div>
                {/* Progress indicator */}
                <div className="mb-8 flex gap-2">
                  {journeyStages.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === activeIndex ? 40 : 12,
                        backgroundColor: i === activeIndex ? 'var(--nest-primary)' : 'var(--nest-sage-muted)',
                      }}
                      className="h-2 rounded-full"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium',
                      activeStage.bgAccent,
                      activeStage.accentColor
                    )}>
                      <activeStage.icon className="h-3.5 w-3.5" aria-hidden />
                      {activeStage.badge}
                    </span>

                    <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
                      {activeStage.title}
                    </h2>
                    <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted-foreground">
                      {activeStage.description}
                    </p>

                    {activeIndex === journeyStages.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8"
                      >
                        <Button size="lg" className="h-14 px-10 text-base" asChild>
                          <Link to="/search" className="inline-flex items-center gap-2">
                            Start your search
                            <ArrowRight className="h-5 w-5" aria-hidden />
                          </Link>
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Scroll hint */}
                <motion.p
                  animate={{ opacity: activeIndex < journeyStages.length - 1 ? 0.6 : 0 }}
                  className="mt-12 flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <motion.span
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ↓
                  </motion.span>
                  Keep scrolling to continue the story
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Mobile Menu ──────────────────────── */

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 left-4 z-50 rounded-2xl border border-sage-muted/50 bg-cream/98 p-6 shadow-xl backdrop-blur-md sm:left-auto sm:w-72 dark:border-border dark:bg-surface/98"
          >
            <nav className="flex flex-col gap-3">
              <a
                href="#problem"
                onClick={onClose}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-sage-muted/20 dark:hover:bg-surface-elevated"
              >
                The Problem
              </a>
              <a
                href="#features"
                onClick={onClose}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-sage-muted/20 dark:hover:bg-surface-elevated"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={onClose}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-sage-muted/20 dark:hover:bg-surface-elevated"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                onClick={onClose}
                className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-sage-muted/20 dark:hover:bg-surface-elevated"
              >
                Testimonials
              </a>
              <hr className="border-sage-muted/30 dark:border-border" />
              <Button size="lg" asChild className="w-full">
                <Link to="/search" onClick={onClose}>
                  Start search
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80])

  return (
    <div className="min-h-screen bg-cream dark:bg-background">
      {/* ─── Floating Navbar ─────────────────── */}
      <nav className="sticky top-4 left-4 right-4 z-30 mx-auto max-w-6xl rounded-2xl border border-sage-muted/50 bg-cream/90 px-5 py-3 shadow-sm backdrop-blur-xl dark:border-border dark:bg-surface/90">
        <div className="flex h-12 items-center justify-between">
          <Link
            to="/"
            className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2.5 font-bold text-foreground transition-colors duration-200 hover:text-primary focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Nest home"
          >
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={28} height={28} className="text-primary" />
            <span className="text-xl tracking-tight">Nest</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-6 md:flex">
            <a href="#problem" className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
              The Problem
            </a>
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
              How It Works
            </a>
            <ThemeToggle />
            <Button size="sm" className="animate-pulse-glow" asChild>
              <Link to="/search">
                Start search
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* Mobile: theme + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-foreground transition-colors hover:bg-sage-muted/20 dark:hover:bg-surface-elevated"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* ─── HERO ────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden pt-16 sm:pt-20">
        {/* Warm gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cream via-cream/90 to-sage-muted/20 animate-gradient dark:from-transparent dark:via-transparent dark:to-transparent" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="container relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:pb-24"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Copy */}
            <div className="pt-8 text-center lg:pt-16 lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Free · No signup required
                </span>
              </motion.div>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                <AnimatedHeadline text="Apartment hunting is broken." />
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="text-primary"
                >
                  We fixed it.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0"
              >
                Nest aggregates listings from every major source, scores them by your priorities, and delivers a ranked shortlist — in under 2 minutes. Stop drowning in tabs. Start finding home.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              >
                <Button
                  size="lg"
                  className="h-14 px-10 text-base shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30 sm:h-16 sm:px-12 sm:text-lg"
                  asChild
                >
                  <Link to="/search" className="inline-flex items-center gap-2">
                    Find your nest
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  See how it works
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </a>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-10 lg:justify-start"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 + i * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex cursor-default flex-col items-center rounded-2xl border border-sage-muted/40 bg-white/60 px-6 py-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md dark:border-border dark:bg-surface/60"
                  >
                    <span className="font-mono text-2xl font-bold text-primary">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right: Floating card */}
            <div className="hidden lg:block">
              <FloatingCard />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-8 flex justify-center lg:mt-16">
            <ScrollIndicator targetId="problem" label="Discover more" />
          </div>
        </motion.div>
      </section>

      {/* ─── THE PROBLEM ─────────────────────── */}
      <section
        id="problem"
        className="relative overflow-hidden border-t border-sage-muted/30 bg-[#1e293b] py-24 sm:py-32 dark:bg-surface"
      >
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <img
                  src="/tab-chaos.png"
                  alt="Chaotic desktop with dozens of apartment listing tabs open"
                  className="aspect-[4/3] w-full object-cover opacity-90"
                />
              </div>
              {/* Floating alert badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="absolute -right-4 -bottom-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 shadow-lg backdrop-blur-md sm:-right-6 sm:-bottom-6"
              >
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
                <span className="text-sm font-medium text-red-300">Browser limit reached</span>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
            >
              {/* Interactive tab counter */}
              <TabCounter />

              <h2 className="mt-8 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
                This is what apartment hunting looks like today
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-400">
                Endless scrolling. Duplicate listings. Dead links. You waste hours
                comparing things that should take minutes. Sound familiar?
              </p>

              {/* Frustration cards */}
              <div className="mt-10 space-y-4">
                {frustrations.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    whileHover={{ x: 4 }}
                    className="group flex cursor-default items-start gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:border-white/10 hover:bg-white/[0.08] dark:border-border/30 dark:bg-surface-elevated/30 dark:hover:bg-surface-elevated/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                      <item.icon className="h-5 w-5 text-red-400" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-12 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/20"
                  asChild
                >
                  <Link to="/search" className="inline-flex items-center gap-2">
                    There's a better way
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO GRID ─────────────── */}
      <section
        id="features"
        className="border-t border-sage-muted/30 bg-gradient-to-b from-cream to-white py-24 sm:py-32 dark:from-background dark:to-surface dark:border-border"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Why Nest
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We built Nest because we were tired of the search ourselves.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    'group h-full cursor-default border-2 border-sage-muted/40 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl dark:border-border dark:bg-surface/80',
                    i === 0 && 'sm:col-span-2 lg:col-span-1'
                  )}
                >
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110', feature.color)}>
                    <feature.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" aria-hidden />
              No data sold
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              Results in 2 min
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              100% free
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────── */}
      <section
        id="how-it-works"
        className="border-t border-sage-muted/30 bg-white py-24 sm:py-32 dark:bg-background dark:border-border"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Nest works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three steps. Two minutes. One shortlist.
            </p>
          </motion.div>

          <div className="relative mt-20">
            {/* Connector line (desktop only) */}
            <div className="absolute top-20 left-[16.67%] right-[16.67%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />

            <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Number circle */}
                  <motion.div
                    whileHover={{ scale: 1.1, boxShadow: '0 8px 30px rgba(45,80,22,0.15)' }}
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-cream shadow-md transition-all duration-300 dark:bg-surface"
                  >
                    <span className="font-mono text-lg font-bold text-primary">{step.number}</span>
                  </motion.div>

                  {/* Icon */}
                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA under steps */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Button size="lg" className="h-14 px-10 text-base sm:h-16 sm:px-12 sm:text-lg" asChild>
              <Link to="/search" className="inline-flex items-center gap-2">
                Try it now — it's free
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── SCROLL-REVEAL JOURNEY ────────────── */}
      <ScrollRevealJourney />

      {/* ─── TRUST & TRANSPARENCY ────────────── */}
      <section className="border-t border-sage-muted/30 bg-sage-muted/20 py-24 sm:py-32 dark:bg-surface/60 dark:border-border">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-7 w-7" aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Trust through transparency
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                See exactly how each apartment scores. Price, space, amenities,
                lease flexibility — all weighted by your priority. No black boxes.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((point, i) => (
                  <motion.li
                    key={point}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="flex cursor-default items-center gap-4 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    <CheckCircle2
                      className="h-6 w-6 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-lg">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Apartment score card preview */}
              <div className="overflow-hidden rounded-2xl border-2 border-sage-muted/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8 dark:border-border dark:bg-surface/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">Maple Street Gallery</h4>
                    <p className="text-sm text-muted-foreground">2 bed · 1 bath · 850 sq ft</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <span className="font-mono text-xl font-bold text-primary">94</span>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { label: 'Price Score', value: 88, delay: 0 },
                    { label: 'Space Score', value: 92, delay: 0.1 },
                    { label: 'Amenities', value: 96, delay: 0.2 },
                    { label: 'Lease Flex', value: 85, delay: 0.3 },
                  ].map((score) => (
                    <div key={score.label} className="group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground transition-colors group-hover:text-foreground">{score.label}</span>
                        <span className="font-mono font-semibold text-foreground">{score.value}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-sage-muted/30">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${score.value}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + score.delay, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-sage"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  <span className="font-medium">Your priorities shape every score</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────── */}
      <section
        id="testimonials"
        className="border-t border-sage-muted/30 bg-white py-24 sm:py-32 dark:bg-background dark:border-border"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by renters
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Real people. Real relief. Real homes found.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group h-full cursor-default border-sage-muted/40 bg-cream/40 p-8 transition-all duration-300 hover:border-primary/15 hover:shadow-lg dark:border-border dark:bg-card dark:text-foreground">
                  <Quote
                    className="h-10 w-10 text-sage-muted transition-colors duration-300 group-hover:text-primary/30"
                    aria-hidden
                  />
                  <blockquote className="mt-4 text-lg leading-relaxed text-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {t.initials}
                    </div>
                    <div>
                      <cite className="not-italic font-semibold text-foreground">
                        {t.author}
                      </cite>
                      <p className="text-sm text-muted-foreground">{t.context}</p>
                    </div>
                  </footer>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────── */}
      <section className="relative overflow-hidden border-t border-primary/20 bg-primary py-24 sm:py-32">
        {/* Radial texture overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(135,169,107,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(184,149,107,0.1),transparent_50%)]" />

        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10"
            >
              <Home className="h-8 w-8 text-primary-foreground/90" aria-hidden />
            </motion.div>

            <h2 className="mt-8 text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl lg:text-5xl">
              Ready to find your nest?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/85">
              Get your personalized shortlist in under 2 minutes. Completely free.
              No signup. No strings attached.
            </p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-10 inline-block"
            >
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-base shadow-xl shadow-black/10 sm:h-16 sm:px-12 sm:text-lg"
                asChild
              >
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  <Search className="h-5 w-5" aria-hidden />
                  Start your free search
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────── */}
      <footer className="border-t border-sage-muted/30 bg-cream py-10 dark:border-border dark:bg-background">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={20} height={20} className="text-primary" />
            <span className="font-semibold text-foreground">Nest</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-center">
            Built with care for apartment hunters everywhere.
          </p>
        </div>
      </footer>
    </div>
  )
}
