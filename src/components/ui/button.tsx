"use client";

import React from 'react';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation select-none';
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 focus-visible:ring-blue-500 shadow-lg',
      secondary: 'bg-gray-800 text-blue-300 hover:bg-gray-700 active:bg-gray-600 focus-visible:ring-purple-500 border border-gray-600',
      outline: 'border border-blue-400 bg-transparent text-blue-300 hover:bg-blue-400/10 active:bg-blue-400/20 focus-visible:ring-blue-500',
      ghost: 'text-blue-300 hover:bg-blue-400/10 active:bg-blue-400/20 focus-visible:ring-purple-500',
    };
    
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm min-h-[44px] sm:min-h-[36px]', // 44px min-height for mobile touch targets
      md: 'h-10 px-4 py-2 min-h-[44px] sm:min-h-[40px]',
      lg: 'h-11 px-6 text-lg min-h-[44px] sm:min-h-[44px]',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';