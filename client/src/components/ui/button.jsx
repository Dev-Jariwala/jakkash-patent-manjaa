import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"
import { Loader } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md md:text-sm text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-blue-500 underline-offset-4 hover:underline",
        cancel: "bg-gray-200 text-gray-600 hover:bg-gray-300",
        none: "text-primary",
        gradient: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl",
        grey: "bg-accent text-accent-foreground shadow-sm hover:bg-accent",
        indigo:
          "border border-input bg-background enabled:hover:bg-accent enabled:hover:text-accent-foreground w-fit text-nowrap text-indigo-500 gap-2 border bg-white self-end md:self-center hover:!text-white border-indigo-500 enabled:hover:bg-indigo-500",
      },
      size: {
        default: "px-4 py-2",
        sm: " rounded-md px-3 py-1.5",
        lg: "rounded-md px-5 py-3",
        icon: "h-8 w-8",
        xs: "text-xs px-2 py-2",
      },
      intent: {
        indigo: "bg-indigo-500 hover:bg-indigo-600 text-white",
        green: "bg-green-500 hover:bg-green-600 text-white",
        red: "bg-red-500 hover:bg-red-600 text-white",
        yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
        teal: "bg-teal-500 hover:bg-teal-600 text-white",
        emerald: "bg-emerald-500 hover:bg-emerald-600 text-white",
      },
      border: {
        default: " border-input",
        none: "",
        indigo: "border border-indigo-500 hover:border-indigo-600 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100",
        green: "border border-green-500 hover:border-green-600 text-green-600 hover:text-green-800 hover:bg-green-100",
        red: "border border-red-500 hover:border-red-600 text-red-600 hover:text-red-800 hover:bg-red-100",
        yellow: "border border-yellow-500 hover:border-yellow-600 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100",
        teal: "border border-teal-500 hover:border-teal-600 text-teal-600 hover:text-teal-800 hover:bg-teal-100",
        emerald: "border border-emerald-500 hover:border-emerald-600 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100",
      },

    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, intent, variant, border, size, disabled, asChild = false, isLoading = false, loadingText, loaderClassname, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, intent, border, className }))}
      disabled={disabled || isLoading}
      ref={ref}
      {...props} >
      {isLoading ? (
        <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
          <Loader
            className={cn("size-4 shrink-0 animate-spin", loaderClassname)}
            aria-hidden="true"
          />
          <span className="sr-only">
            {loadingText ? loadingText : "Loading..."}
          </span>
          {loadingText ? loadingText : children}
        </span>
      ) : (
        children
      )}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
