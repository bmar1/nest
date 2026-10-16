import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export function Hero() {
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 40, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { delay, duration: 0.7, ease: EASE_OUT },
        }

  return (
    <section ref={heroRef} data-field="hero" className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-night">
      <motion.img
        src="/hero-apartment.png"
        alt="A sunlit apartment window at golden hour, looking out over the city"
        className="absolute inset-0 h-full w-full object-cover"
        initial={reduce ? false : { scale: 1.15, filter: 'blur(8px)' }}
        animate={{ scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.8, ease: EASE_OUT }}
        style={{ y: imageY, scale: imageScale }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" /* taste-skill-ignore: neutral scrim under the headline */ />

      <div className="absolute inset-x-0 bottom-0 z-10 px-[var(--margin)] pb-16 lg:pb-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[13vw] leading-[0.9] font-bold tracking-tight text-white sm:text-[10vw] lg:text-[7vw]">
              <motion.span className="block" {...rise(0.15)}>
                Apartment hunting,
              </motion.span>
              <motion.span className="block italic text-golden" {...rise(0.3)}>
                reimagined. {/* taste-skill-ignore: the hero line is kept by request */}
              </motion.span>
            </h1>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-6"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5, ease: EASE_OUT }}
            >
              <a href="#search" className="btn btn-dawn">
                Find your nest
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a href="#how" className="link-u font-semibold text-white">
                How it works
              </a>
            </motion.div>
          </div>

          <motion.p
            className="step-body max-w-[19rem] text-white lg:text-right"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6, ease: EASE_OUT }}
          >
            One search across Craigslist and Kijiji in Toronto. Duplicates gone, every apartment ranked by what you care about, in about a minute.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
