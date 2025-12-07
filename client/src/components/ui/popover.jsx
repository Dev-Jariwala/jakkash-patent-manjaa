import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../../lib/utils"
import { X } from "lucide-react"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, showArrow, arrowClassname, showClose, closeButtonClassName, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-[99] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} >
      {props.children}
      {showClose && (
        <PopoverPrimitive.Close className={cn("absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded p-1 cursor-pointer", closeButtonClassName)}>
          <X className="size-4" />
        </PopoverPrimitive.Close>
      )}
      {showArrow && (
        <PopoverPrimitive.Arrow style={{
          fill: 'white',
          filter: 'drop-shadow(0 0 1px gray)',
          clipPath: 'inset(0 -10px -10px -10px)',
        }} className="w-4 h-2.5 absolute -top-0.5 transform translate-x-[-50%]" />
      )}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
