import React from "react"
import * as DialogPrimitives from "@radix-ui/react-dialog"

import { cn } from "@/lib/utils"

const Dialog = (props) => {
    return <DialogPrimitives.Root {...props} />
}
Dialog.displayName = "Dialog"

const DialogTrigger = DialogPrimitives.Trigger

DialogTrigger.displayName = "DialogTrigger"

const DialogClose = DialogPrimitives.Close

DialogClose.displayName = "DialogClose"

const DialogPortal = DialogPrimitives.Portal

DialogPortal.displayName = "DialogPortal"

const DialogOverlay = React.forwardRef(({ className, ...props }, forwardedRef) => {
    return (
        <DialogPrimitives.Overlay
            ref={forwardedRef}
            className={cn(
                "tw-fixed tw-inset-0 tw-z-[99] tw-bg-black/70 !tw-duration-150 data-[state=open]:tw-animate-backdrop-in data-[state=closed]:tw-animate-backdrop-out tw-overflow-y-auto tw-max-h-screen tw-grid tw-place-items-center",
                className
            )}
            /* className={cn(
                // base
                "tw-fixed tw-inset-0 tw-z-[99] tw-overflow-y-auto",
                // background color
                "tw-bg-black/70",
                // transition
                "data-[state=open]:tw-animate-dialogOverlayShow",
                className,
            )} */
            {...props}
        />
    )
})

DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef(({ className, overlayClassName, stopOutsideClick, ...props }, forwardedRef) => {
    const [outsideClick, setOutsideClick] = React.useState(false);
    const handleInteractOutside = (e) => {
        e.preventDefault();
        setOutsideClick(true);
        setTimeout(() => setOutsideClick(false), 100);
    };
    return (
        <DialogPortal className='tw-overflow-y-auto'>
            <DialogOverlay className={overlayClassName}>
                <DialogPrimitives.Content
                    ref={forwardedRef}
                    onInteractOutside={(e) => stopOutsideClick && handleInteractOutside(e)}
                    className={cn(
                        "tw-z-[99] tw-relative tw-grid tw-w-full tw-max-w-md sm:tw-max-w-lg tw-gap-1 tw-bg-background tw-p-6 tw-shadow-lg ",
                        // "data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out",
                        "!tw-duration-300 data-[state=open]:tw-animate-dialog-in data-[state=closed]:tw-animate-dialog-out",
                        /* "tw-transition-all !tw-duration-200 data-[state=open]:tw-animate-in data-[state=closed]:tw-animate-out data-[state=closed]:tw-fade-out-0 data-[state=open]:tw-fade-in-0 data-[state=closed]:tw-slide-out-to-top-10 data-[state=open]:tw-slide-in-from-top-10", */
                        "sm:tw-rounded-lg md:tw-w-full",
                        outsideClick && "!tw-scale-[.98]",
                        className
                    )}
                    {...props}
                />
            </DialogOverlay>
        </DialogPortal>
    )
})

DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => {
    return <div className={cn("tw-flex tw-flex-col tw-gap-y-1", className)} {...props} />
}

DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef(({ className, ...props }, forwardedRef) => (
    <DialogPrimitives.Title
        ref={forwardedRef}
        className={cn(
            // base
            "tw-text-lg tw-font-semibold tw-mb-0",
            // text color
            "tw-text-gray-900 dark:tw-text-gray-50",
            className,
        )}
        {...props}
    />
))

DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, forwardedRef) => {
    return (
        <DialogPrimitives.Description
            ref={forwardedRef}
            className={cn("tw-text-gray-500 dark:tw-text-gray-500", className)}
            {...props}
        />
    )
})

DialogDescription.displayName = "DialogDescription"

const DialogFooter = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                "tw-flex tw-flex-col-reverse sm:tw-flex-row sm:tw-justify-end sm:tw-space-x-2",
                className,
            )}
            {...props}
        />
    )
}

DialogFooter.displayName = "DialogFooter"

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
}