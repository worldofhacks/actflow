'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Types for our animation props
interface AnimationProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Fade Up animation
export function FadeUpMotion({ children, delay = 0, className = '' }: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

// Fade Scale animation
export function FadeScaleMotion({ children, delay = 0, className = '' }: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// Fade In from Left animation
export function FadeInLeftMotion({ children, delay = 0, className = '' }: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// Fade In from Right animation
export function FadeInRightMotion({ children, delay = 0, className = '' }: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// Slide Up with Fade animation
export function SlideUpMotion({ children, delay = 0, className = '' }: AnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// Stagger Children animation wrapper
interface StaggerContainerProps extends AnimationProps {
  delayChildren?: number;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  delay = 0,
  className = '',
  delayChildren = 0.2,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delay,
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Child element for StaggerContainer
export function StaggerItem({ children, className = '' }: Omit<AnimationProps, 'delay'>) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Interactive Button animation
interface ButtonMotionProps extends AnimationProps {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function ButtonMotion({
  children,
  delay = 0,
  className = '',
  onClick,
  type = 'button',
}: ButtonMotionProps) {
  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.button>
  );
}

// Float animation for stars/planets
interface FloatMotionProps extends AnimationProps {
  duration?: number;
  y?: number;
  x?: number;
}

export function FloatMotion({
  children,
  className = '',
  duration = 3,
  y = 15,
  x = 0,
}: FloatMotionProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, y, 0],
        x: [0, x, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// Rotate animation for spiral/circular elements
interface RotateMotionProps extends AnimationProps {
  duration?: number;
  reverse?: boolean;
  scale?: boolean;
}

export function RotateMotion({
  children,
  className = '',
  duration = 20,
  reverse = false,
  scale = true,
}: RotateMotionProps) {
  return (
    <motion.div
      className={className}
      animate={{
        rotate: reverse ? -360 : 360,
        scale: scale ? [1, 1.05, 1] : 1,
      }}
      transition={{
        rotate: {
          duration,
          repeat: Infinity,
          ease: 'linear',
        },
        scale: {
          duration: 6,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulse Scale animation for backgrounds/elements
interface PulseScaleMotionProps extends AnimationProps {
  duration?: number;
  scaleRange?: number;
}

export function PulseScaleMotion({
  children,
  className = '',
  duration = 8,
  scaleRange = 1.1,
}: PulseScaleMotionProps) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, scaleRange, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}
