import React, { useRef, useState } from 'react';
import { Command, CommandList, CommandItem, CommandGroup, CommandEmpty } from '../command';
import { cn } from '../../../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';


export const Autocomplete = ({
    tags,
    setTags,
    autocompleteOptions,
    maxTags,
    onTagAdd,
    allowDuplicates,
    includeTagsInInput,
    children,
}) => {
    const triggerRef = useRef(null);
    // const inputRef = useRef<HTMLInputElement | null>(null);
    const [popoverWidth, setPopoverWidth] = useState(undefined);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleOpenChange = (open) => {
        if (open && triggerRef.current) {
            setPopoverWidth(triggerRef.current.offsetWidth);
        }
        setIsPopoverOpen(open);
    };

    const handleInputFocus = (event) => {
        setIsPopoverOpen(true);
        const userOnFocus = (children).props.onFocus;
        if (userOnFocus) userOnFocus(event);
    };

    const handleInputBlur = (event) => {
        // Delay the popover closing to allow for related focus events to complete
        setTimeout(() => {
            const input = event.target

            // Check if the related target (new focus element) is within the input
            if (triggerRef.current?.contains(input)) {
                input.focus();
                return;
            }

            setIsPopoverOpen(false);
            const userOnBlur = (children).props.onBlur;
            if (userOnBlur) userOnBlur(event);
        }, 100);
    };

    return (
        <Command className="border w-full">
            <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild ref={triggerRef}>
                    {React.cloneElement(children, {
                        onFocus: handleInputFocus,
                        onBlur: handleInputBlur,
                    })}
                </PopoverTrigger>
                <PopoverContent
                    className={cn(`p-0`)}
                    style={{
                        width: !includeTagsInInput ? `calc(${popoverWidth}px + 45px)` : `${popoverWidth}px`,
                        marginLeft: !includeTagsInInput ? '-25px' : '0',
                    }}
                >
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions" className={cn('overflow-y-auto')}>
                            {autocompleteOptions.map((option) => (
                                <CommandItem key={option.id} className="cursor-pointer">
                                    <div
                                        className="tw-w-full flex items-center gap-2"
                                        onClick={() => {
                                            if (maxTags && tags.length >= maxTags) return;
                                            if (!allowDuplicates && tags.some((tag) => tag.text === option.text)) return;
                                            setTags([...tags, option]);
                                            onTagAdd?.(option.text);
                                        }}
                                    >
                                        {option.text}
                                        {tags.some((tag) => tag.text === option.text) && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-check"
                                            >
                                                <path d="M20 6 9 17l-5-5"></path>
                                            </svg>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </PopoverContent>
            </Popover>
        </Command>
    );
};