import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

const TIPS = [
  'Hosted backends sometimes nap. Waking up can take 30 to 60 seconds, so you are not stuck.',
  'Nest is reading Craigslist and Kijiji for listings that fit your rent.',
  'Duplicates and reposts are being dropped before anything is scored.',
  'Tap the windows below to turn on the lights in our small building.',
]

const WINDOW_COUNT = 9

interface SearchSubmitLoadingOverlayProps {
  open: boolean
}

export function SearchSubmitLoadingOverlay({ open }: SearchSubmitLoadingOverlayProps) {
  return <AnimatePresence>{open && <LoadingScreen key="search-loading-overlay" />}</AnimatePresence>
}

function LoadingScreen() {
  const reduceMotion = useReducedMotion()
  const [tipIndex, setTipIndex] = useState(0)
  const [windowsLit, setWindowsLit] = useState<boolean[]>(() => Array(WINDOW_COUNT).fill(false))

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 4800)
    return () => window.clearInterval(id)
  }, [])

  const toggleWindow = useCallback((i: number) => {
    setWindowsLit((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }, [])

  const litCount = windowsLit.filter(Boolean).length

  return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="field-night fixed inset-0 z-50 flex items-center px-[var(--margin)]"
          aria-live="polite"
          aria-busy="true"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-loading-title"
          aria-describedby="search-loading-desc"
        >
          <motion.div
            initial={reduceMotion ? false : { y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid w-full gap-12 md:grid-cols-12 md:items-end"
          >
            <div className="md:col-span-7">
              <h2 id="search-loading-title" className="display text-[clamp(3rem,1rem+7vw,8rem)]">
                Finding your nest
              </h2>
              <p id="search-loading-desc" className="step-lead mt-6 max-w-[34rem]">
                Your search is running. If the server was asleep it can take a minute to wake, so please stay on this screen.
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25 }}
                  className="step-body mt-6 min-h-[3rem] max-w-[34rem]"
                >
                  {TIPS[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="md:col-span-4 md:col-start-9">
              <p className="mb-3 text-[15px] font-semibold">
                Light up the building{litCount > 0 && <span className="tabular">, {litCount} of {WINDOW_COUNT}</span>}
              </p>
              <div
                className="grid max-w-[18rem] grid-cols-3 gap-2 bg-night-soft p-3"
                role="group"
                aria-label="Tap windows to toggle lights"
              >
                {windowsLit.map((lit, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => toggleWindow(i)}
                    whileTap={reduceMotion ? {} : { scale: 0.94 }}
                    className={cn(
                      'aspect-square cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
                      lit ? 'bg-dawn' : 'bg-night hover:bg-[oklch(0.31_0.02_60)]',
                    )}
                    aria-pressed={lit}
                    aria-label={lit ? `Window ${i + 1} lit` : `Window ${i + 1} dark, tap to light`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
  )
}
