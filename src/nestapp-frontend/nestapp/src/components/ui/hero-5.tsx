import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// --- Animation Variants ---

const FADE_UP_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.8 } },
};

const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// --- Prop Types ---

interface Feature {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
}

interface EthicalHeroProps {
  /**
   * The main title. Can be a string or ReactNode for complex formatting (e.g., line breaks, bolding).
   */
  title: React.ReactNode;
  /**
   * The subtitle text displayed below the main title.
   */
  subtitle: string;
  /**
   * The text label for the call-to-action button.
   */
  ctaLabel: string;
  /**
   * The URL the call-to-action button links to.
   * Use path (e.g. /search) for client-side routing via React Router.
   */
  ctaHref: string;
  /**
   * An array of feature objects to be displayed as cards.
   */
  features: Feature[];
}

// --- Component ---

export function EthicalHero({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  features,
}: EthicalHeroProps) {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={STAGGER_CONTAINER_VARIANTS}
      className="container mx-auto max-w-6xl px-4 py-16 sm:py-24"
    >
      {/* 1. Hero Text Content */}
      <div className="mx-auto max-w-3xl text-center">
        <motion.h1
          variants={FADE_UP_VARIANTS}
          className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          {title}
        </motion.h1>

        <motion.p
          variants={FADE_UP_VARIANTS}
          className="mt-6 text-lg leading-8 text-muted-foreground"
        >
          {subtitle}
        </motion.p>

        <motion.div variants={FADE_UP_VARIANTS} className="mt-10">
          <Button
            size="lg"
            className="h-12 px-8 text-base sm:h-14 sm:px-10 sm:text-lg"
            asChild
          >
            <Link to={ctaHref}>{ctaLabel}</Link>
          </Button>
        </motion.div>
      </div>

      {/* 2. Feature Card Grid */}
      <motion.div
        variants={STAGGER_CONTAINER_VARIANTS}
        className="mt-16 grid grid-cols-1 gap-6 sm:mt-24 md:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div key={feature.id}>
            <Link
              to={feature.href}
              aria-label={feature.title}
              className="block cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <motion.div
                variants={FADE_UP_VARIANTS}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group h-full overflow-hidden rounded-2xl border-2 border-sage-muted/40 bg-white/90 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              {/* Card Image */}
              <div className="overflow-hidden">
                <img
                  src={feature.imageUrl}
                  alt={feature.title}
                  className="aspect-square w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 transition-colors duration-300 group-hover:bg-muted">
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Card>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
