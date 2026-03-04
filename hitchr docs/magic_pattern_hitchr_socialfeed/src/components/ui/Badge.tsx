import React from 'react';
import { ShieldCheck, CheckCircle2, Zap, Trophy } from 'lucide-react';
export type BadgeType = 'trust' | 'verified' | 'achievement' | 'live' | 'neutral';
interface BadgeProps {
  type: BadgeType;
  text?: string;
  className?: string;
  size?: 'sm' | 'md';
}
export function Badge({
  type,
  text,
  className = '',
  size = 'md'
}: BadgeProps) {
  const styles = {
    trust: 'bg-blue-50 text-trust-blue border-blue-100',
    verified: 'bg-green-50 text-trust-green border-green-100',
    achievement: 'bg-amber-50 text-amber-600 border-amber-100',
    live: 'bg-coral-50 text-coral-500 border-coral-100 animate-pulse-slow',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  const icons = {
    trust: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    verified: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    achievement: <Trophy className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    live: <Zap className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="currentColor" />,
    neutral: null
  };
  return <span className={`
      inline-flex items-center gap-1.5 rounded-full border font-medium
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
      ${styles[type]}
      ${className}
    `}>
      {icons[type]}
      {text && <span>{text}</span>}
    </span>;
}