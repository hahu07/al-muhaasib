"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const Dialog = ({
  children,
  open: controlledOpen,
  onOpenChange,
}: DialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, asChild = false, className = "", ...props }, ref) => {
    const context = useContext(DialogContext);
    if (!context) {
      throw new Error("DialogTrigger must be used within Dialog");
    }

    const handleClick = () => {
      context.onOpenChange(true);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          onClick: handleClick,
        },
      );
    }

    return (
      <button ref={ref} onClick={handleClick} className={className} {...props}>
        {children}
      </button>
    );
  },
);

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  (
    {
      children,
      className = "",
      onEscapeKeyDown,
      onPointerDownOutside,
      ...props
    },
    ref,
  ) => {
    const context = useContext(DialogContext);
    if (!context) {
      throw new Error("DialogContent must be used within Dialog");
    }

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (onEscapeKeyDown) {
            onEscapeKeyDown(event);
          }
          if (!event.defaultPrevented) {
            context.onOpenChange(false);
          }
        }
      };

      if (context.open) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [context.open, onEscapeKeyDown, context]);

    if (!context.open) {
      return null;
    }

    const handleBackdropClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        context.onOpenChange(false);
      }
    };

    const classes = `fixed inset-0 z-50 bg-black/80 ${className}`;

    return (
      <div className={classes} onClick={handleBackdropClick}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div
            className="relative inline-block max-h-[90vh] w-full transform overflow-y-auto rounded-lg bg-white px-4 pt-5 pb-4 text-left align-middle shadow-xl transition-all sm:p-6 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-50 rounded-sm bg-white text-gray-700 opacity-70 ring-offset-white transition-opacity hover:text-gray-900 hover:opacity-100 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none dark:bg-gray-800 dark:text-gray-300 dark:ring-offset-gray-800 dark:hover:text-white"
              onClick={() => context.onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <div ref={ref} className="grid gap-4" {...props}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const DialogHeader = ({
  children,
  className = "",
  ...props
}: DialogHeaderProps) => {
  const classes = `flex flex-col space-y-1.5 text-center sm:text-left ${className}`;
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const DialogFooter = ({
  children,
  className = "",
  ...props
}: DialogFooterProps) => {
  const classes = `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`;
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ children, className = "", ...props }, ref) => {
    const classes = `text-lg font-semibold leading-none tracking-tight ${className}`;
    return (
      <h2 ref={ref} className={classes} {...props}>
        {children}
      </h2>
    );
  },
);

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ children, className = "", ...props }, ref) => {
  const classes = `text-sm text-muted-foreground ${className}`;
  return (
    <p ref={ref} className={classes} {...props}>
      {children}
    </p>
  );
});

Dialog.displayName = "Dialog";
DialogTrigger.displayName = "DialogTrigger";
DialogContent.displayName = "DialogContent";
DialogHeader.displayName = "DialogHeader";
DialogFooter.displayName = "DialogFooter";
DialogTitle.displayName = "DialogTitle";
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
