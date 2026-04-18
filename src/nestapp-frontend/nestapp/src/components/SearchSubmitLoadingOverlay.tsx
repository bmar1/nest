import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Loader2, Home, KeyRound, Sparkles, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPS = [
  'Hosted backends sometimes nap — waking up can take 30–60 seconds. You’re not stuck!',
  'While you wait: we’re lining up listings that match your nest goals.',
  'Patience = warmer servers. Thanks for sticking with us.',
  'Fun fact: tap the windows below to “turn on the lights” in our tiny building.',
]

const WINDOW_COUNT = 9

interface SearchSubmitLoadingOverlayProps {
  open: boolean
}

export function SearchSubmitLoadingOverlay({ open }: SearchSubmitLoadingOverlayProps) {
  const reduceMotion = useReducedMotion()
  const [tipIndex, setTipIndex] = useState(0)
  const [windowsLit, setWindowsLit] = useState<boolean[]>(() => Array(WINDOW_COUNT).fill(false))

  useEffect(() => {
    if (!open) return
    setTipIndex(0)
    setWindowsLit(Array(WINDOW_COUNT).fill(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 4800)
    return () => window.clearInterval(id)
  }, [open])

  const toggleWindow = useCallback((i: number) => {
    setWindowsLit((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }, [])

  const litCount = windowsLit.filter(Boolean).length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-cream/90 backdrop-blur-md dark:bg-background/90"
          aria-live="polite"
          aria-busy="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-loading-title"
          aria-describedby="search-loading-desc"
        >
          {/* Ambient orbs */}
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute top-[18%] left-[12%] h-40 w-40 rounded-full bg-primary/20 blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="pointer-events-none absolute right-[10%] bottom-[22%] h-48 w-48 rounded-full bg-sage/25 blur-3xl dark:bg-secondary/20"
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}

          <motion.div
            initial={reduceMotion ? {} : { y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduceMotion ? {} : { y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-sage-muted/35 bg-white/95 shadow-[var(--shadow-card)] dark:border-border dark:bg-surface/95"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-golden to-sage opacity-90" />

            <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
              {/* Floating icons */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                {[Home, KeyRound, Sparkles].map((Icon, idx) => (
                  <motion.div
                    key={`loading-decor-${idx}`}
                    className="absolute text-primary/15 dark:text-primary/20"
                    style={{
                      left: `${18 + idx * 28}%`,
                      top: `${12 + (idx % 2) * 38}%`,
                    }}
                    animate={
                      reduceMotion
                        ? {}
                        : {
                            y: [0, -10, 0],
                            rotate: [0, idx % 2 ? 8 : -8, 0],
                          }
                    }
                    transition={{
                      duration: 3.2 + idx * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: idx * 0.35,
                    }}
                  >
                    <Icon className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden />
                  </motion.div>
                ))}
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 shadow-inner dark:bg-primary/15"
                    animate={reduceMotion ? {} : { scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Loader2 className="h-9 w-9 text-primary" aria-hidden />
                  </motion.div>
                  {!reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-2xl border-2 border-primary/35"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </div>

                <h2
                  id="search-loading-title"
                  className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  Finding your nest…
                </h2>

                <p id="search-loading-desc" className="mt-2 text-sm text-muted-foreground">
                  Sending your preferences to the server.
                </p>

                <div
                  className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/35 bg-amber-50/90 px-3 py-2.5 text-left text-xs text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/35 dark:text-amber-100"
                  role="status"
                >
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                  <span>
                    <span className="font-semibold">Heads up:</span> if the backend was cold (for example right after
                    deploy), it may need a moment to spin up — please stay on this screen.
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="mt-4 min-h-[3rem] text-sm leading-relaxed text-muted-foreground"
                  >
                    {TIPS[tipIndex]}
                  </motion.p>
                </AnimatePresence>

                {/* Interactive “building” */}
                <div className="mt-5 w-full rounded-2xl border border-sage-muted/40 bg-cream/80 p-4 dark:border-border dark:bg-surface-elevated/80">
                  <p className="mb-3 text-center text-xs font-medium text-foreground">
                    Mini distraction: light up the building
                    {litCount > 0 && (
                      <span className="ml-1.5 font-mono text-primary">({litCount}/{WINDOW_COUNT})</span>
                    )}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5" role="group" aria-label="Tap windows to toggle lights">
                    {windowsLit.map((lit, i) => (
                      <motion.button
                        key={i}
                        type="button"
                        onClick={() => toggleWindow(i)}
                        whileTap={reduceMotion ? {} : { scale: 0.92 }}
                        className={cn(
                          'flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          lit
                            ? 'border-primary bg-primary/20 text-primary shadow-md shadow-primary/15'
                            : 'border-sage-muted/50 bg-white/90 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 dark:border-border dark:bg-surface'
                        )}
                        aria-pressed={lit}
                        aria-label={lit ? `Window ${i + 1} lit` : `Window ${i + 1} dark, tap to light`}
                      >
                        <span className={cn('h-2 w-2 rounded-full', lit ? 'bg-primary shadow-[0_0_10px_oklch(0.75_0.12_65)]' : 'bg-muted-foreground/35')} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
