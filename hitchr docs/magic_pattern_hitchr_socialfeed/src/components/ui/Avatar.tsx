import React from 'react';
import { BadgeType } from './Badge';
interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: BadgeType;
  isLive?: boolean;
  className?: string;
}
export function Avatar({
  src,
  alt,
  size = 'md',
  badge,
  isLive,
  className = ''
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  const badgeColors = {
    trust: 'bg-trust-blue border-white',
    verified: 'bg-trust-green border-white',
    achievement: 'bg-amber-500 border-white',
    live: 'bg-coral-500 border-white',
    neutral: 'bg-gray-400 border-white'
  };
  return <div className={`relative inline-block ${className}`}>
      <div className={`
        relative rounded-full overflow-hidden
        ${sizeClasses[size]}
        ${isLive ? 'ring-2 ring-offset-2 ring-coral-500' : ''}
      `}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>

      {badge && <span className={`
          absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 
          ${badgeColors[badge]}
        `} />}
    </div>;
}