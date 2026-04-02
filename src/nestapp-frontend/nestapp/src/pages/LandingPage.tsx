import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion, useScroll, useTransform, useMotionValue, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Home, ChevronRight, Search, Zap, Sparkles, Shield,
  CheckCircle2, Quote, Clock, Layers, BarChart3, Eye,
  ArrowRight, ArrowDown, X, MousePointerClick, Timer, Menu,
  DollarSign, Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Easing (DESIGN-SKILL.md) ─── */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

/* ─── Data ─────────────────────────────── */

const painPoints = [
  {
    icon: Clock,
    value: '30+',
    title: 'Hours wasted',
    description: 'The average renter spends over 30 hours searching across sites each listing period.',
  },
  {
    icon: Layers,
    value: '40+',
    title: 'Tabs opened',
    description: 'Endless browser tabs. Same listings, different prices. None of them feel right.',
  },
  {
    icon: Eye,
    value: '65%',
    title: 'Are duplicates',
    description: 'Most listings appear on multiple platforms. You compare apartments to themselves.',
  },
]

const features = [
  {
    icon: Layers,
    title: 'Smart Aggregation',
    description: 'One search. Dozens of sources. Every listing in one clean view.',
    color: 'bg-primary/15 text-primary',
  },
  {
    icon: Timer,
    title: 'Ranked in 1 Minute',
    description: 'Scored by what you care about — price, space, amenities, lease.',
    color: 'bg-primary/15 text-primary',
  },
  {
    icon: Eye,
    title: 'Transparent Scoring',
    description: 'See exactly why each apartment ranked. No black boxes. No secrets.',
    color: 'bg-secondary/10 text-secondary',
  },
]

const steps = [
  {
    icon: MousePointerClick,
    number: '01',
    title: 'Tell us what matters',
    description: 'Set your budget, space, and amenity priorities. We weight everything to your preferences.',
  },
  {
    icon: Zap,
    number: '02',
    title: 'We search for you',
    description: 'Multiple listing sites, one unified search. No more tab chaos.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Get your shortlist',
    description: 'Ranked matches in under a minute. See exactly why each apartment scored.',
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
  'Your time back — results in under 1 minute',
  'No duplicate listings — we de-dupe for you',
]

/* ─── Animated Counter (counts up on scroll) ─── */

function AnimCount({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1200
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * value)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value])

  return <span ref={ref}>{display}{suffix}</span>
}

/* ─── Glow Card (mouse-tracking radial glow) ─── */

function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const shouldReduce = useReducedMotion()

  function handleMouseMove(e: React.MouseEvent) {
    if (shouldReduce || !cardRef.current || !glowRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glowRef.current.style.background = `radial-gradient(350px circle at ${x}px ${y}px, oklch(0.78 0.11 65 / 0.15), transparent 65%)`
  }

  function handleMouseLeave() {
    if (glowRef.current) glowRef.current.style.background = 'none'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('group relative', className)}
    >
      {/* Glow layer */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-px z-20 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

/* ─── Scroll Progress Bar ──────────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      className="fixed top-0 right-0 left-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-primary via-golden to-primary"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

/* ─── Ambient Background Orbs ──────────── */

function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Warm golden orb — top right */}
      <div className="animate-ambient-1 absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-golden/[0.07] blur-[120px] dark:bg-golden/[0.05]" />
      {/* Green orb — bottom left */}
      <div className="animate-ambient-2 absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/[0.04] blur-[140px] dark:bg-primary/[0.05]" />
      {/* Soft warm orb — center */}
      <div className="animate-ambient-1 absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-golden/[0.05] blur-[100px] dark:bg-golden/[0.03]" style={{ animationDelay: '-8s' }} />
    </div>
  )
}

/* ─── Step Card Component ──────────────── */

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const shouldReduce = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove(e: React.MouseEvent) {
    if (shouldReduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    mouseX.set((e.clientX - cx) * 0.02)
    mouseY.set((e.clientY - cy) * 0.02)
  }

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? {} : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.6, ease: EASE_OUT }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0) }}
      style={{ rotateX: mouseY, rotateY: mouseX }}
      className="group relative [perspective:800px]"
    >
      {/* Large faded number behind */}
      <div className="pointer-events-none absolute -top-6 -left-2 font-display text-[8rem] font-bold leading-none text-golden/[0.07] select-none dark:text-golden/[0.1]">
        {step.number}
      </div>

      <div className="relative rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm transition-all duration-300 hover:border-golden/25 hover:bg-card/90 hover:shadow-xl lg:p-10">
        {/* Step number pill */}
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-golden text-xs font-bold text-black">
            {step.number}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-golden/30 to-transparent" />
        </div>

        {/* Icon */}
        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-golden/15 text-golden transition-transform duration-300 group-hover:scale-110">
          <step.icon className="h-7 w-7" aria-hidden />
        </div>

        {/* Content */}
        <h3 className="mt-5 text-xl font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
      </div>
    </motion.div>
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
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 left-4 z-[70] rounded-2xl border border-border bg-cream/98 p-6 shadow-xl backdrop-blur-md sm:left-auto sm:w-72 dark:bg-card/98"
          >
            <nav className="flex flex-col gap-3">
              <a href="#problem" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted">The Problem</a>
              <a href="#features" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted">Features</a>
              <a href="#how-it-works" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted">How It Works</a>
              <a href="#testimonials" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted">Testimonials</a>
              <hr className="border-border" />
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
  const [pastHero, setPastHero] = useState(false)
  const shouldReduce = useReducedMotion()

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroImageY = useTransform(heroProgress, [0, 1], ['0%', '20%'])
  const heroImageScale = useTransform(heroProgress, [0, 1], [1, 1.1])

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight - 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fadeUp = shouldReduce
    ? {}
    : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, ease: EASE_OUT } }

  return (
    <div className="relative min-h-screen bg-cream dark:bg-background">

      {/* Scroll progress bar */}
      <ScrollProgress />

      {/* Ambient background orbs */}
      <AmbientOrbs />

      {/* ─── HERO-OVERLAY NAV ─── */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-opacity duration-300',
          pastHero ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-16">
          <Link to="/" className="flex min-h-[44px] min-w-[44px] items-center gap-3 font-bold" aria-label="Nest home">
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={34} height={34} />
            <span className="text-2xl tracking-tight text-white">Nest</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {[['#problem', 'The Problem'], ['#features', 'Features'], ['#how-it-works', 'How It Works']].map(([href, label]) => (
              <a key={href} href={href} className="cursor-pointer text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white">{label}</a>
            ))}
            <ThemeToggle />
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/search">Start search</Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white hover:bg-white/10"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── PILL NAV ─── */}
      <AnimatePresence>
        {pastHero && (
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-4 rounded-full border border-border bg-cream/90 px-6 py-2.5 shadow-lg backdrop-blur-xl dark:bg-card/90">
              <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground" aria-label="Nest home">
                <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={28} height={28} />
                <span className="text-lg tracking-tight">Nest</span>
              </Link>
              <div className="hidden items-center gap-4 md:flex">
                {[['#problem', 'Problem'], ['#features', 'Features'], ['#how-it-works', 'How It Works']].map(([href, label]) => (
                  <a key={href} href={href} className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{label}</a>
                ))}
              </div>
              <ThemeToggle />
              <Button size="sm" className="rounded-full animate-pulse-glow" asChild>
                <Link to="/search">
                  Start search
                  <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-foreground hover:bg-muted md:hidden"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative z-10 h-screen w-full overflow-hidden lg:h-[92vh]">
        <motion.img
          src="/hero-apartment.png"
          alt="Beautiful modern apartment with warm natural lighting overlooking the city"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ y: heroImageY, scale: heroImageScale }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-16 lg:pb-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-[12vw] font-bold leading-[0.9] tracking-tight text-white sm:text-[10vw] lg:text-[7vw]">
                  {['Apartment', 'hunting,'].map((word, i) => (
                    <motion.span
                      key={word}
                      initial={shouldReduce ? {} : { opacity: 0, y: 40, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: EASE_OUT }}
                      className="block"
                    >
                      {word}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={shouldReduce ? {} : { opacity: 0, y: 40, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: 0.39, duration: 0.7, ease: EASE_OUT }}
                    className="block italic text-golden"
                  >
                    reimagined.
                  </motion.span>
                </h1>

                <motion.div
                  initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5, ease: EASE_OUT }}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <Button
                    size="sm"
                    className="cursor-pointer rounded-full bg-golden px-6 text-sm font-semibold text-black shadow-xl shadow-golden/20 transition-transform duration-150 hover:bg-golden/90 active:scale-[0.97]"
                    asChild
                  >
                    <Link to="/search" className="inline-flex items-center gap-1.5">
                      Find your nest
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <a
                    href="#how-it-works"
                    className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-[0.97]"
                  >
                    How it works
                  </a>
                </motion.div>
              </div>

              <motion.div
                initial={shouldReduce ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6, ease: EASE_OUT }}
                className="lg:max-w-[220px] lg:text-right"
              >
                <p className="text-sm leading-relaxed text-white/50">
                  A modern solution to apartment hunting. One search, ranked results, under a minute.
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <ArrowDown className="h-5 w-5 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section id="problem" className="relative z-10 overflow-hidden bg-[#0a0f1a] py-24 sm:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        {/* Ambient golden glow for problem section */}
        <div className="pointer-events-none absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-golden/[0.08] blur-[100px]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              The Problem
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl">
              The old way is broken
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Apartment hunting hasn't changed in a decade. Here's what it costs you.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {painPoints.map((point, i) => (
              <motion.div
                key={point.title}
                initial={shouldReduce ? {} : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT }}
                className="group cursor-default rounded-2xl border border-white/5 bg-white/[0.03] p-8 text-center backdrop-blur-sm transition-all duration-200 hover:border-white/10 hover:bg-white/[0.06]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 transition-transform duration-300 group-hover:scale-110">
                  <point.icon className="h-6 w-6 text-red-400/80" aria-hidden />
                </div>
                <div className="mt-5 font-heading text-4xl font-bold text-white"><AnimCount value={parseInt(point.value)} suffix={point.value.replace(/[0-9]/g, '')} /></div>
                <h3 className="mt-2 text-lg font-semibold text-white/90">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{point.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-14 text-center">
            <p className="text-xl text-white/60">
              Nest finds your shortlist in <span className="font-semibold text-golden">under 1 minute</span>.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="mt-6 h-12 cursor-pointer rounded-full bg-white/10 px-8 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.97]"
              asChild
            >
              <Link to="/search" className="inline-flex items-center gap-2">
                There's a better way
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES / WHY NEST ─── */}
      <section
        id="features"
        className="relative z-10 border-t border-border py-24 sm:py-32"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
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
                initial={shouldReduce ? {} : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: EASE_OUT }}
                className="group"
              >
                <GlowCard className="h-full">
                  <Card className="h-full cursor-default border-2 border-border bg-card/60 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-xl">
                    <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110', feature.color)}>
                      <feature.icon className="h-7 w-7" aria-hidden />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
                  </Card>
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-secondary" aria-hidden /> No data sold</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" aria-hidden /> Results in 1 min</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" aria-hidden /> 100% free</span>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (Clean card grid — no timeline) ─── */}
      <section id="how-it-works" className="relative z-10 border-t border-border py-24 sm:py-32">
        {/* Section-local ambient glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/[0.03] blur-[120px]" />

        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How Nest works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three steps. One minute. One shortlist.</p>
          </motion.div>

          {/* Horizontal progress line (desktop only) */}
          <div className="relative mt-20">
            <div className="absolute top-[4.25rem] left-[8%] right-[8%] hidden h-px bg-gradient-to-r from-transparent via-golden/30 to-transparent lg:block" />

            <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
              {steps.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>

          <motion.div {...fadeUp} className="mt-14 text-center">
            <Button size="lg" className="h-14 cursor-pointer rounded-full px-10 text-base transition-transform duration-150 active:scale-[0.97] sm:px-12" asChild>
              <Link to="/search" className="inline-flex items-center gap-2">
                Try it now — it's free
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST & TRANSPARENCY ─── */}
      <section className="relative z-10 border-t border-border py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
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
                    initial={shouldReduce ? {} : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, ease: EASE_OUT }}
                    className="flex cursor-default items-center gap-4 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-secondary" aria-hidden />
                    <span className="text-lg">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={shouldReduce ? {} : { opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl">
                <div className="relative h-52 overflow-hidden">
                  <img
                    src="/apartment-modern.png"
                    alt="Modern apartment interior with open-concept living space"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-golden px-3 py-1 text-xs font-semibold text-black backdrop-blur-sm">
                    94% Match
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <DollarSign className="h-3 w-3" aria-hidden />
                    $1,850/mo
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">Maple Street Gallery</h4>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building className="h-3.5 w-3.5" aria-hidden />
                        2 bed · 1 bath · 850 sq ft
                      </p>
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
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${score.value}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + score.delay, duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-golden-deep to-primary"
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="relative z-10 border-t border-border py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Loved by renters</h2>
            <p className="mt-4 text-lg text-muted-foreground">Real people. Real relief. Real homes found.</p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                initial={shouldReduce ? {} : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: EASE_OUT }}
                className="group"
              >
                <Card className="h-full cursor-default border-border bg-card/60 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/15 hover:shadow-lg">
                  <Quote className="h-10 w-10 text-golden/40 transition-colors duration-300 group-hover:text-golden/70" aria-hidden />
                  <blockquote className="mt-4 text-lg leading-relaxed text-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-golden/15 text-sm font-bold text-golden-deep">{t.initials}</div>
                    <div>
                      <cite className="not-italic font-semibold text-foreground">{t.author}</cite>
                      <p className="text-sm text-muted-foreground">{t.context}</p>
                    </div>
                  </footer>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative z-10 overflow-hidden border-t border-primary/30 bg-gradient-to-br from-golden-deep to-primary py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeUp}>
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15"
            >
              <Home className="h-8 w-8 text-white/90" aria-hidden />
            </motion.div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
              Ready to find your nest?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Get your personalized shortlist in under 1 minute. Completely free. No signup. No strings attached.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-10 inline-block">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 cursor-pointer rounded-full px-10 text-base shadow-xl shadow-black/10 sm:h-16 sm:px-12 sm:text-lg"
                asChild
              >
                <Link to="/search" className="inline-flex items-center gap-2">
                  <Search className="h-5 w-5" aria-hidden />
                  Start your free search
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-border bg-cream py-10 dark:bg-background">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={20} height={20} />
            <span className="font-semibold text-foreground">Nest</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-center">Built with care for apartment hunters everywhere.</p>
        </div>
      </footer>
    </div>
  )
}
