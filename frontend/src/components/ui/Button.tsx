import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// Merge both sets of props
type Props = Omit<HTMLMotionProps<"button">, "variant"> & {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
};

export const Button = ({ children, variant = 'primary', isLoading = false, className = '', disabled, ...props }: Props) => {
  const baseClasses = "inline-flex justify-center items-center px-[20px] py-[12px] font-sans font-semibold text-[16px] rounded-[16px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed tracking-normal border border-transparent relative overflow-hidden active:scale-95 group";
  
  const variants = {
    primary: "bg-[#3CE370] text-[#070709] shadow-[0_4px_20px_rgba(60,227,112,0.2)] hover:bg-[#32c962] hover:shadow-[0_6px_28px_rgba(60,227,112,0.3)]",
    danger: "bg-[#FF4A00] text-[#ffffff] shadow-[0_4px_20px_rgba(255,74,0,0.2)] hover:bg-[#e04000] hover:shadow-[0_6px_28px_rgba(255,74,0,0.3)]",
    secondary: "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.1)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]",
    outline: "bg-transparent border-[rgba(255,255,255,0.2)] text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.3)]",
    ghost: "bg-transparent text-[rgba(255,255,255,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]",
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={disabled || isLoading}
      {...props}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {/* Subtle shine effect on hover for primary/danger buttons */}
      {(variant === 'primary' || variant === 'danger') && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent pointer-events-none" />
      )}
      
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-80">{children}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
