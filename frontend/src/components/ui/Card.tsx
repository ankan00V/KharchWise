import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

export const Card = ({ children, className = '', padding = 'md' }: Props) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6 sm:p-8',
    lg: 'p-8 sm:p-12',
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};
