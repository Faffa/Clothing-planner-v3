import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const baseClass = 'bg-parchment-deep/60 overflow-hidden relative';
  const variantClass = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-maison">
      <Skeleton className="h-5 w-32 mb-4" variant="text" />
      <Skeleton className="h-40 w-full mb-3" />
      <Skeleton className="h-4 w-24" variant="text" />
    </div>
  );
}

export function ClothingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-maison">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
      </div>
    </div>
  );
}
