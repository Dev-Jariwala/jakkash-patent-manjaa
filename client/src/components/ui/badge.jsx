import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-white",
        none: ''
      },
      color: {
        indigo: "bg-indigo-500 text-white hover:bg-indigo-600",
        green: "bg-green-500 text-white hover:bg-green-600",
        red: "bg-red-500 text-white hover:bg-red-600",
        yellow: "bg-yellow-500 text-white hover:bg-yellow-600",
        orange: "bg-orange-500 text-white hover:bg-orange-600",
        pink: "bg-pink-500 text-white hover:bg-pink-600",
        purple: "bg-purple-500 text-white hover:bg-purple-600",
        teal: "bg-teal-500 text-white hover:bg-teal-600",
        blue: "bg-blue-500 text-white hover:bg-blue-600",
      },
      radius: {
        rounded: "rounded",
        pill: "rounded-full",
        square: "rounded-none",
        md: "rounded-md",
      },
      border: {
        default: "border-transparent",
        bordered: "border",
      },
      borderColors: {
        indigo: "border-indigo-500/50 bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
        green: "border-green-500/50 bg-green-500/15 text-green-800 dark:text-green-300",
        red: "border-red-500/50 bg-red-500/15 text-red-800 dark:text-red-300",
        yellow: "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300",
        orange: "border-orange-500/50 bg-orange-500/15 text-orange-800 dark:text-orange-300",
        pink: "border-pink-500/50 bg-pink-500/15 text-pink-800 dark:text-pink-300",
        purple: "border-purple-500/50 bg-purple-500/15 text-purple-800 dark:text-purple-300",
        teal: "border-teal-500/50 bg-teal-500/15 text-teal-800 dark:text-teal-300",
        blue: "border-blue-500/50 bg-blue-500/15 text-blue-800 dark:text-blue-300",
        gray: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "rounded",
      border: "default",
    },
  }
)

function Badge({
  className,
  variant,
  color,
  radius,
  border,
  borderColors,
  count,
  ...props
}) {
  return (
    <div className={cn(className, badgeVariants({ variant, color, radius, border, borderColors }), 'gap-1')} {...props}>
      {props.children}
      {count && (
        <span className="inline-block align-middle text-center text-xs font-semibold leading-none rounded-full select-none whitespace-nowrap px-1 py-1 bg-white/30">
          {count}
        </span>
      )}
    </div>
  );
}

export { Badge, badgeVariants }
