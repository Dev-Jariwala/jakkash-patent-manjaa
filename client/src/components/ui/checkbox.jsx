import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"

const inputvariants = cva("peer h-4 w-4 shrink-0 rounded-sm border border-indigo-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-primary-foreground data-[state=checked]:border-ring data-[state=checked]:bg-ring data-[state=checked]:text-primary-foreground", {
  variants: {
    variant: {
      default: "focus-visible:border-ring",
      ringed: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    },
  },
  defaultVariants: {
    variant: "default",
  },
}
)

const Checkbox = React.forwardRef(({ variant, className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(inputvariants({ variant }),
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
