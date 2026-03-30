import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValueEvent } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Home, ChevronRight, Search, Zap, Sparkles, Shield, CheckCircle2,
  Quote, Clock, Layers, BarChart3, Eye, ArrowRight, X,
  MousePointerClick, Timer, AlertTriangle, Copy, LinkIcon,
  BrainCircuit, Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Easing ─── */
const easeOut = [0.23, 1, 0.32, 1] as const

/* ─── Data ─── */
const stats = [
  { value: 2, suffix: ' min', label: 'To your shortlist' },
  { value: 100, suffix: '+', label: 'Listings per search' },
  { value: 0, suffix: '', label: 'Hidden fees' },
]

const frustrations = [
  {
    icon: Copy, title: 'Duplicate listings everywhere',
    stat: '5×', statLabel: 'same apartment',
    description: 'The same apartment appears on five different sites with five different prices. You waste time comparing what turns out to be the same place.',
  },
  {
    icon: LinkIcon, title: 'Dead links & expired posts',
    stat: '48%', statLabel: 'already gone',
    description: "Nearly half the listings you click are expired, rented, or simply broken. You won't know until you've already invested the time.",
  },
  {
    icon: BrainCircuit, title: 'Decision fatigue takes over',
    stat: '40+', statLabel: 'tabs deep',
    description: 'After the 40th tab, everything blurs together. You can\'t remember which had laundry, which allowed pets, or which was actually in budget.',
  },
]

const features = [
  { icon: Layers, title: 'Smart Aggregation', description: 'One search. Dozens of sources. Every listing in one clean view — deduplicated and verified.', color: 'bg-primary/10 text-primary' },
  { icon: Timer, title: 'Ranked in 2 Minutes', description: 'Scored by what you care about — price, space, amenities, lease flexibility. Your priorities, your ranking.', color: 'bg-warm/10 text-warm' },
  { icon: Eye, title: 'Transparent Scoring', description: 'See exactly why each apartment ranked where it did. No black boxes. No hidden algorithms. No secrets.', color: 'bg-sage/10 text-sage' },
]

const steps = [
  { icon: MousePointerClick, number: '01', title: 'Tell us what matters', description: "Budget, space, amenities — pick your priorities. We'll weight every result accordingly." },
  { icon: Zap, number: '02', title: 'We search for you', description: 'Multiple sites. One unified search. Ranked by your personal preferences.' },
  { icon: Sparkles, number: '03', title: 'Get your shortlist', description: 'Top matches in under 2 minutes. No endless scrolling. Just your best options.' },
]

const journeyStages = [
  {
    id: 'frustration', icon: AlertTriangle, badge: 'The Problem',
    title: 'You open 42 tabs. None of them feel like home.',
    description: 'Every site shows you the same recycled listings in different order. Filters barely work. Half the results are already taken. You spend hours just to feel more confused than when you started.',
    accentColor: 'text-red-500', bgAccent: 'bg-red-500/10',
  },
  {
    id: 'search', icon: Search, badge: 'The Solution',
    title: 'One search. Every source. Your priorities.',
    description: 'Nest pulls listings from every major platform into one unified search. You tell us what matters — budget, space, amenities — and we score everything based on your personal criteria.',
    accentColor: 'text-primary', bgAccent: 'bg-primary/10',
  },
  {
    id: 'shortlist', icon: Sparkles, badge: 'The Result',
    title: 'A ranked shortlist in under 2 minutes.',
    description: 'No more endless scrolling. Get a clean, ranked shortlist of your top matches — with transparent scores so you know exactly why each apartment made the cut.',
    accentColor: 'text-sage', bgAccent: 'bg-sage/10',
  },
]

const testimonials = [
  { quote: "Cut my search from weeks to an afternoon. The scoring actually made sense — I could see exactly why each place ranked.", author: 'Sarah M.', context: 'Toronto, 2024', initials: 'SM' },
  { quote: "Finally, something that understands I care more about laundry than square footage. Found my place in one sitting.", author: 'James K.', context: 'First-time renter', initials: 'JK' },
  { quote: "I was drowning in tabs. Nest gave me a shortlist of 8 apartments and the first one was perfect. Magic.", author: 'Priya R.', context: 'Vancouver, 2024', initials: 'PR' },
]

const benefits = [
  'Free to use — no signup, no fees',
  'Transparent scoring — see why each apartment ranks',
  'Your time back — results in under 2 minutes',
  'No duplicate listings — we de-dupe for you',
]

const galleryImages = [
  {
    src: '/apartment-hero.png',
    alt: 'Bright apartment living space',
    eyebrow: 'Room To Breathe',
    title: 'Open layouts that feel calm the second you walk in',
  },
  {
    src: '/apartment-modern.png',
    alt: 'Modern apartment interior',
    eyebrow: 'Modern Finishes',
    title: 'Clean kitchens and updated details worth bookmarking',
  },
  {
    src: '/apartment-studio.png',
    alt: 'Compact studio apartment',
    eyebrow: 'Small But Smart',
    title: 'Studios that make the most of every square foot',
  },
]

/* ─── Animated Word Reveal ─── */
function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.2 + i * 0.07, duration: 0.6, ease: easeOut }}
          className="inline-block mr-[0.3em]"
        >{word}</motion.span>
      ))}
    </span>
  )
}

/* ─── Tab Counter ─── */
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
        if (prev >= maxTabs) { if (intervalRef.current) clearInterval(intervalRef.current); return maxTabs }
        return prev + 1
      })
    }, 55)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [inView])

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative flex items-baseline gap-1.5">
        <motion.span key={tabCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className={cn('font-mono text-7xl font-bold tracking-tighter sm:text-8xl lg:text-9xl',
            tabCount >= maxTabs ? 'text-red-400' : 'text-foreground'
          )}
        >{tabCount}</motion.span>
        <span className="text-2xl font-medium text-muted-foreground sm:text-3xl">tabs open</span>
      </div>
      <AnimatePresence>
        {tabCount >= maxTabs && (
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-lg font-medium text-red-500/80">
            ...and still no clear winner.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Scroll-Reveal Journey ─── */
function ScrollRevealJourney() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const idx = Math.min(Math.floor(latest * journeyStages.length), journeyStages.length - 1)
    setActiveIndex(idx)
  })

  const activeStage = journeyStages[activeIndex]

  return (
    <section className="border-t border-border">
      <div ref={containerRef} className="relative" style={{ height: `${journeyStages.length * 100}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="container mx-auto max-w-5xl px-4">
            {/* Progress dots */}
            <div className="mb-10 flex justify-center gap-2">
              {journeyStages.map((_, i) => (
                <motion.div key={i}
                  animate={{ width: i === activeIndex ? 40 : 12, backgroundColor: i === activeIndex ? 'var(--nest-primary)' : 'var(--nest-sage-muted)' }}
                  className="h-2 rounded-full" transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeStage.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="mx-auto max-w-3xl text-center"
              >
                <span className={cn('inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold', activeStage.bgAccent, activeStage.accentColor)}>
                  <activeStage.icon className="h-3.5 w-3.5" aria-hidden />
                  {activeStage.badge}
                </span>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
                  {activeStage.title}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {activeStage.description}
                </p>

                {activeIndex === journeyStages.length - 1 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
                    <Button size="lg" className="h-14 px-10 text-base active:scale-[0.97]" asChild>
                      <Link to="/search" className="inline-flex items-center gap-2">
                        Start your search <ArrowRight className="h-5 w-5" aria-hidden />
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Scroll hint */}
            <motion.p animate={{ opacity: activeIndex < journeyStages.length - 1 ? 0.5 : 0 }}
              className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>↓</motion.span>
              Scroll to continue
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Image Gallery Section ─── */
function ImageGallery() {
  return (
    <section className="border-t border-border py-20 sm:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Find spaces that feel like you</h2>
          <p className="mt-4 text-lg text-muted-foreground">Nest surfaces apartments that match your lifestyle — not just your budget.</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img, i) => (
            <motion.div key={img.src}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: easeOut }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 shadow-sm transition-shadow duration-300 hover:shadow-xl"
            >
              <img src={img.src} alt={img.alt} className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <div className="rounded-xl bg-card/88 p-4 text-foreground shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{img.eyebrow}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/90">
                    {img.title}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Mobile Menu ─── */
function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/50" />
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-4 left-4 z-50 rounded-2xl border border-border bg-card/98 p-6 shadow-xl backdrop-blur-md sm:left-auto sm:w-72"
          >
            <nav className="flex flex-col gap-3">
              {[['#problem', 'The Problem'], ['#features', 'Features'], ['#how-it-works', 'How It Works'], ['#testimonials', 'Testimonials']].map(([href, label]) => (
                <a key={href} href={href} onClick={onClose}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent">{label}</a>
              ))}
              <hr className="border-border" />
              <Button size="lg" asChild className="w-full"><Link to="/search" onClick={onClose}>Start search <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-4 left-4 right-4 z-30 mx-auto max-w-6xl rounded-2xl border border-border/60 bg-card/85 px-5 py-3 shadow-sm backdrop-blur-xl">
        <div className="flex h-12 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-foreground hover:text-primary transition-colors" aria-label="Nest home">
            <img src="/nest-logo-transparent-cropped.png" alt="Nest logo" width={28} height={28} />
            <span className="text-xl tracking-tight">Nest</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#problem" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">The Problem</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <ThemeToggle />
            <Button size="sm" asChild><Link to="/search">Start search <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* ─── HERO — Centered ─── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden flex items-center justify-center pt-8 pb-16">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-apartment.png" alt="" className="h-full w-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] dark:bg-background/85" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }}
          className="container relative z-10 mx-auto max-w-4xl px-4 text-center"
        >
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Free · No signup required
            </span>
          </motion.div>

          <h1 className="mt-8 text-balance">
            <span className="text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <AnimatedHeadline text="Apartment hunting" />
              <br />
              <AnimatedHeadline text="is broken." />
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6, ease: easeOut }}
              className="mt-3 inline-block text-5xl font-bold tracking-tight text-primary sm:text-6xl lg:text-7xl"
            >
              We fixed it.
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5, ease: easeOut }}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            Nest aggregates listings from every major source, scores them by your priorities, and delivers a ranked shortlist — in under 2 minutes. Stop drowning in tabs.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5, ease: easeOut }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button size="lg"
              className="h-14 px-10 text-base shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] sm:h-16 sm:px-12 sm:text-lg"
              asChild
            >
              <Link to="/search" className="inline-flex items-center gap-2">
                Find your nest <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <a href="#how-it-works" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              See how it works <ChevronRight className="h-4 w-4" aria-hidden />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.5, ease: easeOut }}
            className="mt-16 flex flex-wrap justify-center gap-6 sm:gap-10"
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7 + i * 0.08, duration: 0.4, ease: easeOut }}
                className="flex flex-col items-center rounded-2xl border border-border/50 bg-card/60 px-6 py-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md active:scale-[0.97]"
              >
                <span className="font-mono text-2xl font-bold text-primary"><AnimatedCounter value={stat.value} suffix={stat.suffix} /></span>
                <span className="mt-1 text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Floating apartment card preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: easeOut }}
            className="mx-auto mt-16 max-w-md animate-float"
          >
            <div className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Sunlit Studio Downtown</h4>
                  <p className="text-sm text-muted-foreground">620 sq ft · 1 bed · Pet friendly</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <span className="font-mono text-sm font-bold text-primary">98</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[{ l: 'Price', s: 92 }, { l: 'Space', s: 78 }, { l: 'Amenities', s: 95 }].map((s) => (
                  <div key={s.l} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-muted-foreground">{s.l}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.s}%` }}
                        transition={{ delay: 2.5, duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-primary/70" />
                    </div>
                    <span className="font-mono text-muted-foreground">{s.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 2.5 }}
            className="mt-12 flex flex-col items-center gap-1 text-sm text-muted-foreground">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="h-8 w-5 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-1.5">
              <motion.div animate={{ opacity: [1, 0], y: [0, 8] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── THE PROBLEM ─── */}
      <section id="problem" className="relative overflow-hidden border-t border-border py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Section header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/5 px-4 py-1.5 text-sm font-semibold text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> The Problem
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl lg:text-5xl">
              Apartment hunting is a broken, exhausting process
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every renter knows the pain. Here's what you're up against.
            </p>
          </motion.div>

          {/* Tab counter */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 flex justify-center">
            <TabCounter />
          </motion.div>

          {/* Frustration cards with stats */}
          <div className="grid gap-6 md:grid-cols-3">
            {frustrations.map((item, i) => (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 30, clipPath: 'inset(0 0 100% 0)' }}
                whileInView={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: easeOut }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: easeOut } }}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card/70 p-7 backdrop-blur-sm transition-all duration-300 hover:border-red-500/20 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                    <item.icon className="h-6 w-6 text-red-400" aria-hidden />
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold text-red-400">{item.stat}</span>
                    <p className="text-xs text-muted-foreground">{item.statLabel}</p>
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Transition CTA */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.5 }} className="mt-12 text-center">
            <Button variant="secondary" size="lg" className="h-12 px-8 active:scale-[0.97] transition-all duration-200" asChild>
              <Link to="/search" className="inline-flex items-center gap-2">
                There's a better way <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── SCROLL-REVEAL JOURNEY ─── */}
      <ScrollRevealJourney />

      {/* ─── IMAGE GALLERY ─── */}
      <ImageGallery />

      {/* ─── FEATURES ─── */}
      <section id="features" className="border-t border-border bg-gradient-to-b from-background to-card py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Why Nest
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">We built Nest because we were tired of the search ourselves.</p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div key={feature.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                <Card className="group h-full cursor-default border-2 border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl">
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110', feature.color)}>
                    <feature.icon className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> No data sold</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Results in 2 min</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> 100% free</span>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="border-t border-border bg-card py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How Nest works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three steps. Two minutes. One shortlist.</p>
          </motion.div>

          <div className="relative mt-20">
            <div className="absolute top-20 left-[16.67%] right-[16.67%] hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />
            <div className="grid gap-12 lg:grid-cols-3 lg:gap-8">
              {steps.map((step, i) => (
                <motion.div key={step.title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: easeOut }}
                  className="relative flex flex-col items-center text-center"
                >
                  <motion.div whileHover={{ scale: 1.1 }}
                    className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background shadow-md transition-all duration-300">
                    <span className="font-mono text-lg font-bold text-primary">{step.number}</span>
                  </motion.div>
                  <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 max-w-xs leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.4 }} className="mt-16 text-center">
            <Button size="lg" className="h-14 px-10 text-base active:scale-[0.97] sm:h-16 sm:px-12 sm:text-lg" asChild>
              <Link to="/search" className="inline-flex items-center gap-2">
                Try it now — it's free <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section className="border-t border-border bg-accent/30 py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-7 w-7" aria-hidden />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Trust through transparency</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                See exactly how each apartment scores. Price, space, amenities, lease flexibility — all weighted by your priority.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((point, i) => (
                  <motion.li key={point}
                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.08, ease: easeOut }}
                    className="flex items-center gap-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                    <span className="text-lg">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="overflow-hidden rounded-2xl border-2 border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
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
                  {[{ label: 'Price Score', value: 88, delay: 0 }, { label: 'Space Score', value: 92, delay: 0.1 }, { label: 'Amenities', value: 96, delay: 0.2 }, { label: 'Lease Flex', value: 85, delay: 0.3 }].map((score) => (
                    <div key={score.label} className="group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{score.label}</span>
                        <span className="font-mono font-semibold text-foreground">{score.value}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${score.value}%` }} viewport={{ once: true }}
                          transition={{ delay: 0.3 + score.delay, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-sage" />
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

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="border-t border-border bg-card py-24 sm:py-32">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Loved by renters</h2>
            <p className="mt-4 text-lg text-muted-foreground">Real people. Real relief. Real homes found.</p>
          </motion.div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.author}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }} whileHover={{ y: -4 }}
              >
                <Card className="group h-full cursor-default border-border/60 bg-background/40 p-8 transition-all duration-300 hover:border-primary/15 hover:shadow-lg">
                  <Quote className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/30 transition-colors duration-300" aria-hidden />
                  <blockquote className="mt-4 text-lg leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                  <footer className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{t.initials}</div>
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
      <section className="relative overflow-hidden border-t border-primary/20 bg-primary py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(135,169,107,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(184,149,107,0.1),transparent_50%)]" />
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Home className="h-8 w-8 text-primary-foreground/90" aria-hidden />
            </motion.div>
            <h2 className="mt-8 text-3xl font-bold tracking-tight text-primary-foreground text-balance sm:text-4xl lg:text-5xl">
              Ready to find your nest?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/85">
              Get your personalized shortlist in under 2 minutes. Completely free. No signup. No strings attached.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="mt-10 inline-block">
              <Button size="lg" variant="secondary"
                className="h-14 px-10 text-base shadow-xl shadow-black/10 active:scale-[0.97] sm:h-16 sm:px-12 sm:text-lg" asChild>
                <Link to="/search" className="inline-flex items-center gap-2">
                  <Search className="h-5 w-5" aria-hidden /> Start your free search <ChevronRight className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-background py-10">
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
