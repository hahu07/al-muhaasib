"use client";

import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  children: React.ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const baseClasses = 'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7';
    
    const variantClasses = {
      default: 'bg-background text-foreground border-border',
      destructive: 'border-red-500/50 text-red-900 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
      success: 'border-green-500/50 text-green-900 dark:text-green-400 bg-green-50 dark:bg-green-950/50',
      warning: 'border-yellow-500/50 text-yellow-900 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/50',
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
    
    // Auto-add appropriate icon based on variant if no svg child present
    const hasIcon = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === 'svg'
    );
    
    const getDefaultIcon = () => {
      switch (variant) {
        case 'destructive':
          return <X className="h-4 w-4" />;
        case 'success':
          return <CheckCircle className="h-4 w-4" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4" />;
        default:
          return <Info className="h-4 w-4" />;
      }
    };
    
    return (
      <div ref={ref} role="alert" className={classes} {...props}>
        {!hasIcon && getDefaultIcon()}
        {children}
      </div>
    );
  }
);

const AlertTitle = React.forwardRef<HTMLParagraphElement, AlertTitleProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `mb-1 font-medium leading-none tracking-tight ${className}`;
    
    return (
      <h5 ref={ref} className={classes} {...props}>
        {children}
      </h5>
    );
  }
);

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = `text-sm [&_p]:leading-relaxed ${className}`;
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Alert.displayName = 'Alert';
AlertTitle.displayName = 'AlertTitle';
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };