'use client'

import { motion, MotionProps } from 'framer-motion'
import React from 'react'

interface AnimatedContainerProps extends MotionProps {
  children: React.ReactNode
  delay?: number
  className?: string
  animationType?: 'fadeUp' | 'fadeDown' | 'slideLeft' | 'slideRight' | 'scale' | 'none'
}

const animationVariants = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
  slideRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
}

export default function AnimatedContainer({
  children,
  delay = 0,
  className = '',
  animationType = 'fadeUp',
  ...motionProps
}: AnimatedContainerProps) {
  const variants = animationVariants[animationType]

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut',
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
