import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
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
    hoverBorder: 'hover:border-primary/25',
  },
  {
    icon: Timer,
    title: 'Ranked in 1 Minute',
    description: 'Scored by what you care about — price, space, amenities, lease.',
    color: 'bg-secondary/10 text-secondary',
    hoverBorder: 'hover:border-secondary/25',
  },
  {
    icon: Eye,
    title: 'Transparent Scoring',
    description: 'See exactly why each apartment ranked. No black boxes. No secrets.',
    color: 'bg-primary/15 text-primary',
    hoverBorder: 'hover:border-primary/25',
  },
]

const steps = [
  {
    icon: MousePointerClick,
    number: '01',
    title: 'Tell us what matters',
    description: 'Set your budget, space, and amenity priorities. We weight everything to your preferences.',
    accent: 'golden' as const,
  },
  {
    icon: Zap,
    number: '02',
    title: 'We search for you',
    description: 'Multiple listing sites, one unified search. No more tab chaos.',
    accent: 'green' as const,
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Get your shortlist',
    description: 'Ranked matches in under a minute. See exactly why each apartment scored.',
    accent: 'golden' as const,
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
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * value)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, value])

  return <span ref={ref}>{display}{suffix}</span>
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
      <div className="animate-ambient-1 absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-golden/[0.07] blur-[120px] dark:bg-golden/[0.015]" />
      {/* Green orb — bottom left */}
      <div className="animate-ambient-2 absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/[0.04] blur-[140px] dark:bg-primary/[0.015]" />
      {/* Soft warm orb — center */}
      <div className="animate-ambient-1 absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-golden/[0.05] blur-[100px] dark:bg-golden/[0.01]" style={{ animationDelay: '-8s' }} />
    </div>
  )
}

/* ─── Step Card Component ──────────────── */

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const shouldReduce = useReducedMotion()
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mouseX = useSpring(rawX, { stiffness: 150, damping: 20 })
  const mouseY = useSpring(rawY, { stiffness: 150, damping: 20 })
  const isGreen = step.accent === 'green'

  function handleMouseMove(e: React.MouseEvent) {
    if (shouldReduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    rawX.set((e.clientX - cx) * 0.02)
    rawY.set((e.clientY - cy) * 0.02)
  }

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? {} : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.6, ease: EASE_OUT }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { rawX.set(0); rawY.set(0) }}
      style={{ rotateX: mouseY, rotateY: mouseX }}
      className="group relative [perspective:800px]"
    >
      {/* Large faded number behind */}
      <div className={cn(
        'pointer-events-none absolute -top-6 -left-2 font-display text-[8rem] font-bold leading-none select-none',
        isGreen ? 'text-secondary/[0.08] dark:text-secondary/[0.12]' : 'text-golden/[0.07] dark:text-golden/[0.1]'
      )}>
        {step.number}
      </div>

      <div className={cn(
        'surface-card relative rounded-2xl border border-border bg-card/90 p-8 backdrop-blur-sm dark:bg-card lg:p-10',
        isGreen ? 'hover:border-secondary/30' : 'hover:border-golden/25'
      )}>
        {/* Step number pill */}
        <div className="flex items-center gap-3">
          <span className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
            isGreen ? 'bg-secondary text-white' : 'bg-golden text-black'
          )}>
            {step.number}
          </span>
          <div className={cn('h-px flex-1', isGreen ? 'bg-secondary/25' : 'bg-golden/25')} />
        </div>

        {/* Icon — reduced hover scale per Emil: scale-105 max */}
        <div className={cn(
          'mt-6 flex h-14 w-14 items-center justify-center rounded-2xl [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105',
          isGreen ? 'bg-secondary/10 text-secondary' : 'bg-golden/15 text-golden'
        )}>
          <step.icon className="h-7 w-7" aria-hidden />
        </div>

        {/* Content */}
        <h3 className="mt-5 text-xl font-semibold text-foreground">{step.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{step.description}</p>
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
              <a href="#problem" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground [transition:background-color_150ms_ease-out] hover:bg-muted">The Problem</a>
              <a href="#features" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground [transition:background-color_150ms_ease-out] hover:bg-muted">Features</a>
              <a href="#how-it-works" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground [transition:background-color_150ms_ease-out] hover:bg-muted">How It Works</a>
              <a href="#testimonials" onClick={onClose} className="cursor-pointer rounded-xl px-4 py-3 text-base font-medium text-foreground [transition:background-color_150ms_ease-out] hover:bg-muted">Testimonials</a>
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

      {/* ─── HERO-OVERLAY NAV (pill-shaped, slightly white) ─── */}
      <nav
        className={cn(
          'absolute top-6 left-1/2 z-50 w-[95%] max-w-7xl -translate-x-1/2 [transition:opacity_300ms_ease-out] sm:w-[90%]',
          pastHero ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
      >
        <div className="flex items-center justify-between rounded-full border border-white/20 bg-white/10 px-6 py-2.5 backdrop-blur-md">
          <Link to="/" className="flex min-h-[44px] min-w-[44px] items-center gap-3 font-bold" aria-label="Nest home">
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={34} height={34} />
            <span className="text-xl tracking-tight text-white lg:text-2xl">Nest</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {[['#problem', 'The Problem'], ['#features', 'Features'], ['#how-it-works', 'How It Works']].map(([href, label]) => (
              <a key={href} href={href} className="cursor-pointer text-sm font-medium text-white/70 [transition:color_200ms_ease-out] hover:text-white">{label}</a>
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
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-white hover:bg-white/10"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── PILL NAV (appears after scrolling past hero — no pulse-glow per Emil: high-frequency element) ─── */}
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
                  <a key={href} href={href} className="group relative cursor-pointer text-sm font-medium text-muted-foreground [transition:color_150ms_ease-out] hover:text-foreground">
                    {label}
                    <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 rounded-full bg-secondary [transition:width_200ms_cubic-bezier(0.23,1,0.32,1)] group-hover:w-full" />
                  </a>
                ))}
              </div>
              <ThemeToggle />
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/search">
                  Start search
                  <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-foreground hover:bg-muted md:hidden"
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
      <section ref={heroRef} className="relative z-10 h-[105vh] w-full overflow-hidden">
        {/* Cinematic image reveal */}
        <motion.img
          src="/hero-apartment.png"
          alt="Beautiful modern apartment with warm natural lighting overlooking the city"
          className="absolute inset-0 h-full w-full object-cover"
          initial={shouldReduce ? {} : { scale: 1.15, filter: 'blur(8px)' }}
          animate={{ scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
          style={{ y: heroImageY, scale: heroImageScale }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pb-20 lg:px-16 lg:pb-32">
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
                  className="mt-10 flex flex-wrap items-center gap-3"
                >
                  <Button
                    size="sm"
                    className="cursor-pointer rounded-full bg-golden px-6 text-sm font-semibold text-black shadow-xl shadow-golden/20 [transition:background-color_150ms_ease-out,transform_140ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-golden/90 active:scale-[0.97]"
                    asChild
                  >
                    <Link to="/search" className="inline-flex items-center gap-1.5">
                      Find your nest
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <a
                    href="#how-it-works"
                    className="cursor-pointer rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white/80 backdrop-blur-sm [transition:background-color_200ms_ease-out,color_200ms_ease-out,transform_140ms_cubic-bezier(0.23,1,0.32,1)] hover:bg-white/20 hover:text-white active:scale-[0.97]"
                  >
                    How it works
                  </a>
                </motion.div>
              </div>

              <motion.div
                initial={shouldReduce ? {} : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6, ease: EASE_OUT }}
                className="ml-auto self-end text-right lg:max-w-[220px]"
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

      {/* ─── GOLDEN BRIDGE ─── Softened opacity per Refactoring UI audit */}
      <div className="pointer-events-none relative z-10 -mt-0 h-32" aria-hidden>
        <div
          className="absolute inset-x-0 top-0 h-full dark:hidden"
          style={{
            background: 'radial-gradient(ellipse 100% 120% at 50% 0%, oklch(0.62 0.18 65 / 0.45) 0%, oklch(0.68 0.15 65 / 0.2) 40%, transparent 80%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-full hidden dark:block" style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 0%, oklch(0.78 0.11 65 / 0.25) 0%, transparent 70%)' }} />
      </div>

      {/* ─── THE PROBLEM ─── */}
      <section id="problem" className="relative z-10 bg-background py-28 sm:py-36">
        {/* Lingering golden warmth at top */}
        <div className="pointer-events-none absolute -top-10 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-golden/[0.08] blur-[100px] dark:bg-golden/[0.06]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full bg-secondary/[0.06] blur-[100px]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            {/* De-emphasized badge per Refactoring UI: labels are secondary */}
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              The Problem
            </span>
            {/* Smaller heading — not the main conversion section */}
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
              The old way is broken
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
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
                className="group cursor-default rounded-2xl border border-border bg-card/70 p-8 text-center backdrop-blur-sm [transition:border-color_180ms_ease-out,background-color_180ms_ease-out] hover:border-destructive/20 hover:bg-card"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/8 [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105">
                  <point.icon className="h-6 w-6 text-destructive/70" aria-hidden />
                </div>
                <div className="mt-5 font-heading text-4xl font-bold text-foreground"><AnimCount value={parseInt(point.value)} suffix={point.value.replace(/[0-9]/g, '')} /></div>
                <h3 className="mt-2 text-lg font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-14 text-center">
            <p className="text-lg text-muted-foreground sm:text-xl">
              Nest finds your shortlist in <span className="font-semibold text-primary">under 1 minute</span>.
            </p>
            <Button
              size="lg"
              className="mt-6 h-12 cursor-pointer rounded-full px-8 [transition:background-color_200ms_ease-out,transform_140ms_cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]"
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
      {/* No border-t — spacing alone separates per Refactoring UI */}
      <section id="features" className="relative z-10 py-28 sm:py-36">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Left-aligned heading per Refactoring UI: "Don't center everything" */}
          <motion.div {...fadeUp} className="max-w-xl">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Why Nest
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              We built Nest because we were tired of the search ourselves.
            </p>
          </motion.div>

          {/* Removed GlowCard: simple shadow elevation per Refactoring UI's shadow scale principle */}
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
                <Card className={cn('h-full cursor-default border-2 border-border bg-card/90 p-8 shadow-sm backdrop-blur-sm dark:bg-card [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1),box-shadow_220ms_cubic-bezier(0.23,1,0.32,1),border-color_180ms_ease-out] hover:-translate-y-0.5 hover:shadow-lg', feature.hoverBorder)}>
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105', feature.color)}>
                    <feature.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{feature.description}</p>
                </Card>
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

      {/* ─── HOW IT WORKS ─── Key conversion section — keeps larger heading */}
      <section id="how-it-works" className="relative z-10 py-28 sm:py-36">
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-[320px] w-[320px] rounded-full bg-secondary/[0.05] blur-[100px]" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-[280px] w-[280px] rounded-full bg-primary/[0.04] blur-[100px]" />

        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeUp} className="text-center">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Three steps. One minute.</h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">No account required. No commitment. Just your shortlist.</p>
          </motion.div>

          {/* Connector line */}
          <div className="relative mt-20">
            <div className="absolute top-[4.25rem] left-[8%] right-[8%] hidden h-px lg:block" style={{ background: 'linear-gradient(to right, transparent, oklch(0.75 0.12 65 / 0.3) 30%, oklch(0.45 0.12 145 / 0.3) 50%, oklch(0.75 0.12 65 / 0.3) 70%, transparent)' }} />

            <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
              {steps.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>

          <motion.div {...fadeUp} className="mt-14 text-center">
            <Button size="lg" className="h-14 cursor-pointer rounded-full px-10 text-base shadow-lg shadow-primary/20 [transition:background-color_200ms_ease-out,transform_140ms_cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] sm:px-12" asChild>
              <Link to="/search" className="inline-flex items-center gap-2">
                Try it now — it's free
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST & TRANSPARENCY ─── */}
      <section className="relative z-10 py-28 sm:py-36">
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
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Trust through transparency
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
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
                    className="flex cursor-default items-center gap-4 text-muted-foreground [transition:color_200ms_ease-out] hover:text-foreground"
                  >
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-secondary" aria-hidden />
                    <span className="text-base sm:text-lg">{point}</span>
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
                    className="h-full w-full object-cover [transition:transform_400ms_cubic-bezier(0.23,1,0.32,1)] hover:scale-105"
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
                      { label: 'Price Score', value: 88, delay: 0, color: 'bg-primary' },
                      { label: 'Space Score', value: 92, delay: 0.1, color: 'bg-secondary' },
                      { label: 'Amenities', value: 96, delay: 0.2, color: 'bg-primary' },
                      { label: 'Lease Flex', value: 85, delay: 0.3, color: 'bg-secondary' },
                    ].map((score) => (
                      <div key={score.label} className="group">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground [transition:color_150ms_ease-out] group-hover:text-foreground">{score.label}</span>
                          <span className="font-mono font-semibold text-foreground">{score.value}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${score.value}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + score.delay, duration: 0.8, ease: 'easeOut' }}
                            className={cn('h-full rounded-full', score.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-2 rounded-lg border border-secondary/20 bg-secondary/8 px-3 py-2 text-sm text-secondary">
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
      <section id="testimonials" className="relative z-10 py-28 sm:py-36">
        <div className="pointer-events-none absolute top-0 left-0 h-[300px] w-[400px] rounded-full bg-secondary/[0.04] blur-[120px]" />
        <div className="container mx-auto max-w-6xl px-4">
          {/* Left-aligned heading per Refactoring UI */}
          <motion.div {...fadeUp} className="max-w-xl">
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Loved by renters
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Real people. Real relief.</h2>
            <p className="mt-3 text-base text-muted-foreground">Real homes found.</p>
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
                <Card className={cn(
                  'h-full cursor-default border-border bg-card/90 p-8 backdrop-blur-sm dark:bg-card [transition:transform_200ms_cubic-bezier(0.23,1,0.32,1),box-shadow_220ms_cubic-bezier(0.23,1,0.32,1),border-color_180ms_ease-out] hover:-translate-y-0.5 hover:shadow-lg',
                  i % 2 === 0 ? 'hover:border-secondary/20' : 'hover:border-primary/15'
                )}>
                  <Quote className={cn(
                    'h-10 w-10 [transition:color_300ms_ease-out]',
                    i % 2 === 0 ? 'text-secondary/40 group-hover:text-secondary/70' : 'text-golden/40 group-hover:text-golden/70'
                  )} aria-hidden />
                  <blockquote className="mt-4 text-base leading-relaxed text-foreground">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <footer className="mt-6 flex items-center gap-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold',
                      i % 2 === 0 ? 'bg-secondary/10 text-secondary' : 'bg-golden/15 text-golden-deep'
                    )}>{t.initials}</div>
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

      {/* ─── FINAL CTA ─── subtle hover lift, press feedback only for scale */}
      <section className="relative z-10 overflow-hidden border-t-2 border-primary/30 bg-background py-28 sm:py-36">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-golden/[0.14] blur-[120px] dark:bg-golden/[0.09]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-[200px] w-[200px] rounded-full bg-secondary/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-[200px] w-[200px] rounded-full bg-secondary/[0.06] blur-[80px]" />

        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeUp}>
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
            >
              <Home className="h-8 w-8 text-primary" aria-hidden />
            </motion.div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
              Ready to find your nest?
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Get your personalized shortlist in under 1 minute. Completely free. No signup. No strings attached.
            </p>
            <div className="mt-10 inline-block">
              <Button
                size="lg"
                className="group h-14 cursor-pointer rounded-full px-10 text-base shadow-lg shadow-primary/20 [transition:background-color_200ms_ease-out,box-shadow_220ms_ease-out,transform_180ms_cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97] sm:h-16 sm:px-12 sm:text-lg"
                asChild
              >
                <Link to="/search" className="inline-flex items-center gap-2">
                  <Search className="h-5 w-5" aria-hidden />
                  Start your free search
                  <ChevronRight className="h-5 w-5 [transition:transform_180ms_cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-border bg-cream dark:bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          {/* Top: brand + columns */}
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={26} height={26} />
                <span className="text-lg font-bold tracking-tight text-foreground">Nest</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Apartment hunting, reimagined. One search, transparent scores, your shortlist in under a minute.
              </p>
              <a
                href="https://github.com/bmar1/nest"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground [transition:border-color_200ms_ease-out,color_200ms_ease-out] hover:border-primary/40 hover:text-primary"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                bmar1/nest
              </a>
            </div>

            {/* Product */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Product</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'The Problem', href: '#problem' },
                  { label: 'Features', href: '#features' },
                  { label: 'How It Works', href: '#how-it-works' },
                  { label: 'Testimonials', href: '#testimonials' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="cursor-pointer text-muted-foreground [transition:color_150ms_ease-out] hover:text-primary"
                    >
                      {label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to="/search" className="font-medium text-primary [transition:color_150ms_ease-out] hover:text-primary/80">
                    Start searching →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Company</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'About', href: '#' },
                  { label: 'Contact', href: 'mailto:hello@nestsearch.co' },
                  { label: 'GitHub', href: 'https://github.com/bmar1/nest' },
                  { label: 'Privacy Policy', href: '#' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="cursor-pointer text-muted-foreground [transition:color_150ms_ease-out] hover:text-primary"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Nest. Built with care for apartment hunters everywhere.</p>
            <p>Made with ♥ — open source on <a href="https://github.com/bmar1/nest" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">GitHub</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
