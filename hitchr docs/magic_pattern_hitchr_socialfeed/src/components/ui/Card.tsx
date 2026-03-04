import React, { Component } from 'react';
import { motion } from 'framer-motion';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}
export function Card({
  children,
  className = '',
  variant = 'elevated',
  padding = 'md',
  onClick
}: CardProps) {
  const variants = {
    elevated: 'bg-white shadow-soft border border-gray-100',
    flat: 'bg-gray-100',
    outlined: 'bg-white border border-gray-200'
  };
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };
  const Component = onClick ? motion.div : 'div';
  return <Component className={`
        rounded-2xl overflow-hidden
        ${variants[variant]}
        ${paddings[padding]}
        ${className}
      `} onClick={onClick} whileTap={onClick ? {
    scale: 0.99
  } : undefined}>
      {children}
    </Component>;
}