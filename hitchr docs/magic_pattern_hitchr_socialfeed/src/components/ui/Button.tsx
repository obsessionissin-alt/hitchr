import React from 'react';
import { motion } from 'framer-motion';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-coral-500 text-white hover:bg-coral-600 focus:ring-coral-500 shadow-sm',
    secondary: 'bg-white text-coral-500 border border-coral-200 hover:bg-coral-50 focus:ring-coral-500',
    tertiary: 'bg-coral-50 text-coral-600 hover:bg-coral-100 focus:ring-coral-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400'
  };
  const sizes = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base'
  };
  return <motion.button whileTap={{
    scale: 0.98
  }} className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `} {...props}>
      {children}
    </motion.button>;
}