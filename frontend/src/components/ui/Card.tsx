import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type Props = HTMLMotionProps<"div"> & {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid' | 'neon-accent';
};

export const Card = ({ children, className = '', padding = 'md', variant = 'glass', ...props }: Props) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variants = {
    glass: 'bg-[rgba(255,255,255,0.02)] backdrop-blur-3xl border border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.95)] rounded-[24px] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)] hover:shadow-[0_0_60px_rgba(60,227,112,0.15),0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)]',
    solid: 'bg-[#121214] border border-[rgba(255,255,255,0.05)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.95)] rounded-[24px] hover:border-[rgba(255,255,255,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]',
    'neon-accent': 'bg-[#3CE370] text-[#070709] rounded-[24px] shadow-[0_4px_20px_rgba(60,227,112,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_12px_32px_rgba(60,227,112,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-[#32c962]',
  };

  return (
    <motion.div
      className={`${variants[variant]} ${paddingClasses[padding]} ${className} transition-all duration-300`}
      whileHover={{ scale: 0.995, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
