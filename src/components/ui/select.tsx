"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface SelectTriggerProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "type"
  > {
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
}

interface SelectValueProps {
  className?: string;
  placeholder?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

const Select = ({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  placeholder,
  disabled = false,
}: SelectProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        onOpenChange: setOpen,
        placeholder,
        disabled,
      }}
    >
      {children}
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ children, className = "", placeholder, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) {
      throw new Error("SelectTrigger must be used within Select");
    }

    const classes = `flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`;

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-controls="select-content"
        aria-expanded={context.open}
        aria-haspopup="listbox"
        disabled={context.disabled}
        className={classes}
        onClick={(e) => {
          console.log("SelectTrigger clicked:", {
            disabled: context.disabled,
            open: context.open,
          });
          e.preventDefault();
          if (!context.disabled) {
            context.onOpenChange(!context.open);
            console.log("SelectTrigger: toggled open to:", !context.open);
          }
        }}
        {...props}
      >
        <span className="truncate">{children}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
    );
  },
);

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className = "", placeholder, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) {
      throw new Error("SelectValue must be used within Select");
    }

    const displayPlaceholder =
      placeholder || context.placeholder || "Select...";
    const classes = `pointer-events-none ${className}`;

    return (
      <span ref={ref} className={classes} {...props}>
        {context.value || displayPlaceholder}
      </span>
    );
  },
);

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  (
    {
      children,
      className = "",
      position = "popper",
      side = "bottom",
      align = "start",
      ...props
    },
    ref,
  ) => {
    const context = useContext(SelectContext);
    const contentRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [styles, setStyles] = useState<React.CSSProperties>({});

    if (!context) {
      throw new Error("SelectContent must be used within Select");
    }

    // Find the trigger button and calculate position
    useEffect(() => {
      const updatePosition = () => {
        if (!context.open) return;

        // Find the trigger button (previous sibling or search up the tree)
        const findTrigger = () => {
          const triggers = document.querySelectorAll('[role="combobox"]');
          for (let i = 0; i < triggers.length; i++) {
            const trigger = triggers[i] as HTMLButtonElement;
            if (trigger.getAttribute("aria-expanded") === "true") {
              return trigger;
            }
          }
          return null;
        };

        const trigger = findTrigger();
        if (trigger) {
          triggerRef.current = trigger;
          const rect = trigger.getBoundingClientRect();

          // Use fixed positioning relative to viewport
          const top = rect.bottom + 4; // 4px gap
          const left = rect.left;
          const width = rect.width;

          // Check if dropdown would go off-screen
          const maxHeight = 384; // 96 * 4 (max-h-96 in rem)
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          let finalTop = top;
          let finalMaxHeight = Math.min(maxHeight, spaceBelow - 8);

          // If not enough space below, show above
          if (spaceBelow < 200 && spaceAbove > spaceBelow) {
            finalTop = rect.top - Math.min(maxHeight, spaceAbove - 8);
            finalMaxHeight = Math.min(maxHeight, spaceAbove - 8);
          }

          setStyles({
            position: "fixed",
            top: `${finalTop}px`,
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${finalMaxHeight}px`,
            zIndex: 99999,
          });
        }
      };

      if (context.open) {
        updatePosition();
        // Update position on scroll and resize
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
          window.removeEventListener("scroll", updatePosition, true);
          window.removeEventListener("resize", updatePosition);
        };
      }
    }, [context.open]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        // Don't close if clicking inside the dropdown content
        if (contentRef.current && contentRef.current.contains(target)) {
          return;
        }

        // Don't close if clicking on the trigger
        if (triggerRef.current && triggerRef.current.contains(target)) {
          return;
        }

        // Close if clicking outside both
        context.onOpenChange(false);
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          context.onOpenChange(false);
        }
      };

      if (context.open) {
        // Use mousedown instead of click to prevent interference with scrolling
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

    const classes = `overflow-y-auto overflow-x-hidden rounded-md border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-1 shadow-lg ${className}`;

    // Render to document.body portal for proper z-index
    if (typeof document === "undefined") {
      return null;
    }

    const content = (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="listbox"
        className={classes}
        style={{
          ...styles,
          // Enable smooth scrolling
          overscrollBehavior: "contain",
          // Ensure content is scrollable
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        data-state={context.open ? "open" : "closed"}
        data-side={side}
        data-align={align}
        onMouseDown={(e) => {
          // Prevent mousedown from bubbling to document (which would close the dropdown)
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent click from bubbling to document
          e.stopPropagation();
        }}
        {...props}
      >
        {children}
      </div>
    );

    // Use portal to render dropdown at document.body level
    return typeof document !== "undefined" && document.body
      ? createPortal(content, document.body)
      : null;
  },
);

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className = "", disabled = false, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) {
      throw new Error("SelectItem must be used within Select");
    }

    const isSelected = context.value === value;
    const classes = `relative flex w-full select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""} ${disabled ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer pointer-events-auto"} ${className}`;

    const handleClick = (e: React.MouseEvent) => {
      console.log("SelectItem clicked:", {
        value,
        disabled,
        contextOpen: context.open,
      });
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !context.disabled) {
        console.log("SelectItem: calling onValueChange with:", value);
        context.onValueChange(value);
      } else {
        console.log("SelectItem click ignored - disabled:", {
          disabled,
          contextDisabled: context.disabled,
        });
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent document mousedown handler from firing
    };

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        data-disabled={disabled}
        className={classes}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        {...props}
      >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  },
);

Select.displayName = "Select";
SelectTrigger.displayName = "SelectTrigger";
SelectValue.displayName = "SelectValue";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
