import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils"

const inputvariants = cva("flex w-full rounded-md border transition border-input bg-background px-3 py-2 text-sm ring-offset-background file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70", {
  variants: {
    variant: {
      default: "focus-visible:border-ring",
      ringShadow: "hover:border-indigo-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-indigo-200/80 focus-visible:dark:ring-indigo-700/30",
      shadow: "focus-visible:border-ring focus-visible:shadow-input",
      ringed: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const Input = React.forwardRef(({ variant, className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(inputvariants({ variant }),
        className
      )}
      ref={ref}
      autoComplete="new-password"
      {...props} />)
  );
})
Input.displayName = "Input"

const rootVariants = cva(
  "py-1 px-2 flex rounded gap-1 items-center transition duration-200",
  {
    variants: {
      variant: {
        // outline
        default:
          "border ring-zinc-800 ring-zinc-300 focus-within:ring-2 focus-within:ring-offset-2 dark:focus-within:ring-zinc-400 focus-within:ring-offset-white dark:focus-within:ring-offset-black focus-within:ring-zinc-600",

        underlined:
          "border-b dark:border-zinc-800 focus-within:border-b-2 dark:focus-within:border-zinc-400 focus-within:border-zinc-500 rounded-none px-0",

        filled:
          "bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 focus-within:bg-zinc-200 dark:focus-within:bg-zinc-800",

        ghost:
          "bg-transparent dark:bg-transparent dark:text-zinc-100 focus-within:bg-zinc-100 dark:focus-within:bg-zinc-900",
        neubrutalism:
          "border border-zinc-700 rounded-sm shadow-[2px_2px_0px_rgb(82,82,91)] dark:shadow-[2px_2px_0px_rgb(82,82,91)] focus-within:bg-yellow-50 dark:focus-within:bg-zinc-900/40",
        // with floating label
      },
      size: {
        sm: "h-8",
        default: "h-10",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


const InputBlock = ({
  root: { size, variant, className, inputClassName } = { size: "default", variant: "default" },
  leftIcon,
  rightIcon,
  ...input
}) => (
  <div className={cn(rootVariants({ variant, size, className }))}>
    {leftIcon && <span className="px-1">{leftIcon}</span>}
    <Input {...input} className={cn("p-0 border-none", inputClassName)} />
    {rightIcon && <span className="px-1">{rightIcon}</span>}
  </div>
)

export { Input, InputBlock }