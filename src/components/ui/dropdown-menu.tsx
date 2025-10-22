"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronRight } from "lucide-react";

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | undefined>(
  undefined,
);

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative">
      <DropdownMenuContext.Provider
        value={{ open, onOpenChange: setOpen, triggerRef }}
      >
        {children}
      </DropdownMenuContext.Provider>
    </div>
  );
};

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, className = "", asChild = false, ...props }, ref) => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenuTrigger must be used within DropdownMenu");
  }

  const handleClick = () => {
    context.onOpenChange(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      {
        onClick: handleClick,
        "aria-expanded": context.open,
        "aria-haspopup": "menu",
      },
    );
  }

  return (
    <button
      ref={(node) => {
        context.triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onClick={handleClick}
      className={className}
      aria-expanded={context.open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  );
});

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(
  (
    {
      children,
      className = "",
      align = "center",
      side = "bottom",
      sideOffset = 4,
      ...props
    },
    ref,
  ) => {
    const context = useContext(DropdownMenuContext);
    const contentRef = useRef<HTMLDivElement>(null);

    if (!context) {
      throw new Error("DropdownMenuContent must be used within DropdownMenu");
    }

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          context.triggerRef.current &&
          !context.triggerRef.current.contains(event.target as Node)
        ) {
          context.onOpenChange(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          context.onOpenChange(false);
        }
      };

      if (context.open) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [context.open, context]);

    if (!context.open) {
      return null;
    }

    const baseClasses = `z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2`;
    const classes = `${baseClasses} ${className}`;

    return (
      <div className="absolute top-full right-0 z-50 mt-1">
        <div
          ref={(node) => {
            contentRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={classes}
          role="menu"
          aria-orientation="vertical"
          data-state={context.open ? "open" : "closed"}
          data-side={side}
          style={{
            backgroundColor: "white",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            minWidth: "180px",
            zIndex: 9999,
            padding: "4px",
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ children, className = "", disabled = false, onClick, ...props }, ref) => {
  const context = useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
      // Close the dropdown after a successful click
      setTimeout(() => {
        context?.onOpenChange(false);
      }, 0);
    }
  };

  const classes = `relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 ${
    disabled ? "pointer-events-none opacity-50 cursor-default" : ""
  } ${className}`;

  return (
    <div
      ref={ref}
      role="menuitem"
      className={classes}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
});

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  DropdownMenuLabelProps
>(({ children, className = "", ...props }, ref) => {
  const classes = `px-2 py-1.5 text-sm font-semibold ${className}`;

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSeparatorProps
>(({ className = "", ...props }, ref) => {
  const classes = `-mx-1 my-1 h-px bg-muted ${className}`;

  return <div ref={ref} role="separator" className={classes} {...props} />;
});

DropdownMenu.displayName = "DropdownMenu";
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuLabel.displayName = "DropdownMenuLabel";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
