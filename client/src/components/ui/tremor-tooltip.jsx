
import React from "react"
import * as TooltipPrimitives from "@radix-ui/react-tooltip"

import { cn } from "../../lib/utils"

const Tooltip = React.forwardRef(({
    children,
    className,
    content,
    delayDuration,
    defaultOpen = false,
    open,
    onClick,
    onOpenChange,
    showArrow = true,
    side,
    sideOffset = 4,
    triggerAsChild = false,
    ...props
}, forwardedRef) => {
    return (
        <TooltipPrimitives.Provider delayDuration={300}>
            <TooltipPrimitives.Root
                open={open}
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                delayDuration={delayDuration}
            >
                <TooltipPrimitives.Trigger onClick={onClick} asChild={triggerAsChild}>
                    {children}
                </TooltipPrimitives.Trigger>
                <TooltipPrimitives.Portal>
                    <TooltipPrimitives.Content
                        ref={forwardedRef}
                        side={side}
                        sideOffset={sideOffset}
                        align="center"
                        className={cn(
                            // base
                            "max-w-60 z-[111] select-none rounded-md px-2.5 py-1.5 text-sm leading-5 shadow-md",
                            // text color
                            "text-gray-50 dark:text-gray-900",
                            // background color
                            "bg-gray-900 dark:bg-gray-50",
                            // transition
                            "will-change-[transform,opacity]",
                            "data-[side=bottom]:animate-slideDownAndFade data-[side=left]:animate-slideLeftAndFade data-[side=right]:animate-slideRightAndFade data-[side=top]:animate-slideUpAndFade data-[state=closed]:animate-hide",
                            className,
                        )}
                        {...props}
                    >
                        {content}
                        {showArrow ? (
                            <TooltipPrimitives.Arrow
                                className="border-none fill-gray-900 dark:fill-gray-50"
                                width={12}
                                height={7}
                                aria-hidden="true"
                            />
                        ) : null}
                    </TooltipPrimitives.Content>
                </TooltipPrimitives.Portal>
            </TooltipPrimitives.Root>
        </TooltipPrimitives.Provider>
    )
},
)

Tooltip.displayName = "Tooltip"

export { Tooltip }