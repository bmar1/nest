import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

type RevealTag = 'div' | 'p' | 'li' | 'figure' | 'h2' | 'h3'

interface RevealProps {
  children: ReactNode
  /** Position in the section's reading order; each step waits 80ms. */
  order?: number
  as?: RevealTag
  className?: string
  /** Rise distance in px. */
  rise?: number
}

export function Reveal({ children, order = 0, as = 'div', className, rise = 24 }: RevealProps) {
  const reduce = useReducedMotion()
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: reduce ? 0.3 : 0.8, delay: order * 0.08, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  )
}

/** A photograph that opens from its top edge and settles from a slight scale. */
export function Shutter({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
