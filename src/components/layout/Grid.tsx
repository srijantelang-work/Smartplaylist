import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  className?: string;
}

const colsToClass = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
  12: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-12',
};

const gapToClass = {
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
};

export function Grid({ children, cols = 1, gap = 4, className = '' }: GridProps) {
  return (
    <div className={`grid ${colsToClass[cols]} ${gapToClass[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface GridItemProps {
  children: ReactNode;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  className?: string;
}

const colSpanToClass = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  12: 'col-span-12',
  full: 'col-span-full',
};

export function GridItem({ children, colSpan = 1, className = '' }: GridItemProps) {
  return (
    <div className={`${colSpanToClass[colSpan]} ${className}`}>
      {children}
    </div>
  );
} 