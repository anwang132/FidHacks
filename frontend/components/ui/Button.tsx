'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = 'rounded-2xl px-6 py-3 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40',
    secondary: 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-900/40',
    ghost: 'border border-violet-500/40 text-violet-300 hover:bg-violet-900/30',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
