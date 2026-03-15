import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface ScrollIndicatorProps {
  targetId?: string
  label?: string
}

export function ScrollIndicator({
  targetId = 'how-it-works',
  label = 'Explore',
}: ScrollIndicatorProps) {
  const scrollToTarget = () => {
    const el = document.getElementById(targetId)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.button
      onClick={scrollToTarget}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="group flex cursor-pointer flex-col items-center gap-2 rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Scroll to ${label}`}
    >
      <span className="text-sm font-medium">{label}</span>
      <motion.span
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current"
      >
        <ChevronDown className="h-5 w-5" aria-hidden />
      </motion.span>
    </motion.button>
  )
}
