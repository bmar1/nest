import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EthicalHero } from '@/components/ui/hero-5'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Search,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'

const heroData = {
  title: (
    <>
      Find your dream home,
      <br />
      <span className="text-primary">cheaper, faster</span> and without the
      hassle.
    </>
  ),
  subtitle:
    'Nest is an intelligent apartment search platform that aggregates listings, removes fees where possible, and ranks homes based on what actually matters to you. Skip the stress and go straight to the right shortlist.',
  ctaLabel: 'Start your free search',
  ctaHref: '/search',
  features: [
    {
      id: 'dream-home',
      title: 'Find your dream home',
      imageUrl:
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop',
      href: '/search',
    },
    {
      id: 'save-money',
      title: 'Save on rent & fees',
      imageUrl:
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800&auto=format&fit=crop',
      href: '/search',
    },
    {
      id: 'no-hassle',
      title: 'No-hassle, guided search',
      imageUrl:
        'https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=800&auto=format&fit=crop',
      href: '/search',
    },
  ],
}

const steps = [
  {
    icon: Search,
    title: 'Tell us what matters',
    description: 'Choose your priority—budget, space, amenities, or balanced—and set your criteria.',
  },
  {
    icon: Zap,
    title: 'We search for you',
    description: 'We scan multiple listing sites at once and rank results by your preferences.',
  },
  {
    icon: Sparkles,
    title: 'Get your shortlist',
    description: 'Receive a ranked list of top matches in under 2 minutes. No endless scrolling.',
  },
]

const trustPoints = [
  'Free to use—no hidden fees',
  'Transparent scoring—see why each apartment ranks',
  'Respects your time—results in under 2 minutes',
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <nav className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground" aria-label="Nest home">
            <span className="text-xl">Nest</span>
          </Link>
          <Button size="sm" asChild>
            <Link to="/search">Start search</Link>
          </Button>
        </div>
      </nav>

      {/* Hero + Features */}
      <div className="w-full bg-background">
        <EthicalHero
          title={heroData.title}
          subtitle={heroData.subtitle}
          ctaLabel={heroData.ctaLabel}
          ctaHref={heroData.ctaHref}
          features={heroData.features}
        />
      </div>

      {/* How it works */}
      <section className="border-t border-border/60 bg-white/50 py-20 sm:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Nest works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps from search to shortlist.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="group h-full cursor-default border-border/80 bg-card p-6 transition-all duration-300 hover:shadow-md hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & transparency */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
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
              <p className="mt-4 text-lg text-muted-foreground">
                We show you exactly how each apartment scores. Price, space,
                amenities, lease flexibility—all weighted by your priority.
                No black-box algorithms.
              </p>
              <ul className="mt-6 space-y-3">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl border border-border/80 shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop"
                  alt="Modern apartment interior with natural light"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-primary/5 py-20 sm:py-28">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to find your nest?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Stop scrolling. Start scoring. Get your personalized shortlist in
              under 2 minutes.
            </p>
            <Button
              size="lg"
              className="mt-8 h-12 px-8 text-base sm:h-14 sm:px-10 sm:text-lg"
              asChild
            >
              <Link to="/search" className="inline-flex items-center gap-2">
                Start your free search
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
