import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'secondary' | 'outline';
};

export const Button = ({ children, variant = 'primary', className = '', ...props }: Props) => {
  const baseClasses = "inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#5bc5a7] text-white hover:bg-[#48a98f] focus:ring-[#5bc5a7]",
    danger: "bg-[#ff652f] text-white hover:bg-[#e55a29] focus:ring-[#ff652f]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-[#5bc5a7]",
  };

  return (
    <button
      {...props}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
