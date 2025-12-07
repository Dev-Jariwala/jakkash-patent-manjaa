import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils"

const inputvariants = cva("flex w-full rounded-md border border-input px-3 py-2 text-sm transition duration-200 ease-in-out ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", {
  variants: {
    variant: {
      default: "focus-visible:border-ring",
      ringed: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      ringShadow: "hover:border-indigo-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-indigo-200/80 focus-visible:dark:ring-indigo-700/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
}
)

const Textarea = React.forwardRef(({ variant, className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(inputvariants({ variant }),
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
