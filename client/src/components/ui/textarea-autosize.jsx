import { cn } from "../../lib/utils"
import ReactTextareaAutosize from "react-textarea-autosize"
import { cva } from "class-variance-authority";


const textAreavariants = cva("bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full resize-none rounded-md border border-input px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", {
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

export const TextareaAutosize = ({
    value,
    onValueChange,
    textareaRef,
    className,
    placeholder = "",
    minRows = 1,
    maxRows = 6,
    maxLength,
    onKeyDown = () => { },
    onPaste = () => { },
    onCompositionStart = () => { },
    onCompositionEnd = () => { },
    variant = "default"
}) => {
    return (
        <ReactTextareaAutosize
            ref={textareaRef}
            className={cn(textAreavariants({ variant }), className)}
            minRows={minRows}
            maxRows={minRows > maxRows ? minRows : maxRows}
            placeholder={placeholder}
            value={value}
            maxLength={maxLength}
            onChange={event => onValueChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
        />
    )
}