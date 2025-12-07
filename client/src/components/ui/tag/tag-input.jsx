import React from 'react';
import { Input } from '../input';
import { Button } from '../button';
import { CommandInput } from '../command';
import { TagPopover } from './tag-popover';
import { TagList } from './tag-list';
import { Autocomplete } from './autocomplete';
import { cn } from '../../../lib/utils';
import { v4 as uuid } from 'uuid';

const Delimiter = {
    Comma: ',',
    Enter: 'Enter',
};

const TagInput = React.forwardRef((props, ref) => {
    const {
        id,
        placeholder,
        tags,
        setTags,
        variant,
        size,
        shape,
        className,
        enableAutocomplete,
        autocompleteOptions,
        maxTags,
        delimiter = Delimiter.Comma,
        onTagAdd,
        onTagRemove,
        allowDuplicates,
        showCount,
        validateTag,
        placeholderWhenFull = 'Max tags reached',
        sortTags,
        delimiterList,
        truncate,
        autocompleteFilter,
        borderStyle,
        textCase,
        interaction,
        animation,
        textStyle,
        minLength,
        maxLength,
        direction = 'row',
        onInputChange,
        customTagRenderer,
        onFocus,
        onBlur,
        onTagClick,
        draggable = false,
        inputFieldPosition = 'bottom',
        clearAll = false,
        onClearAll,
        usePopoverForTags = false,
        inputProps = {},
        restrictTagsToAutocompleteOptions,
        includeTagsInInput = true,
        activeTagIndex,
        setActiveTagIndex,
    } = props;

    const [inputValue, setInputValue] = React.useState('');
    const [tagCount, setTagCount] = React.useState(Math.max(0, tags.length));
    const inputRef = React.useRef(null);
    // const [activeTagIndex, setActiveTagIndex] = React.useState<number | null>(null);

    if ((maxTags !== undefined && maxTags < 0) || (props.minTags !== undefined && props.minTags < 0)) {
        console.warn('maxTags and minTags cannot be less than 0');
        // error
        return null;
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onInputChange?.(newValue);
    };

    const handleInputFocus = (event) => {
        setActiveTagIndex(null); // Reset active tag index when the input field gains focus
        onFocus?.(event);
    };

    const handleInputBlur = (event) => {
        onBlur?.(event);
    };

    const handleKeyDown = (e) => {
        if (delimiterList ? delimiterList.includes(e.key) : e.key === delimiter || e.key === Delimiter.Enter) {
            e.preventDefault();
            const newTagText = inputValue.trim();

            // Check if the tag is in the autocomplete options if restrictTagsToAutocomplete is true
            if (restrictTagsToAutocompleteOptions && !autocompleteOptions?.some((option) => option.text === newTagText)) {
                // error
                return;
            }

            if (validateTag && !validateTag(newTagText)) {
                return;
            }

            if (minLength && newTagText.length < minLength) {
                console.warn('Tag is too short');
                // error
                return;
            }

            // Validate maxLength
            if (maxLength && newTagText.length > maxLength) {
                // error
                console.warn('Tag is too long');
                return;
            }

            const newTagId = uuid();

            if (
                newTagText &&
                (allowDuplicates || !tags.some((tag) => tag.text === newTagText)) &&
                (maxTags === undefined || tags.length < maxTags)
            ) {
                setTags([...tags, { id: newTagId, text: newTagText }]);
                onTagAdd?.(newTagText);
                setTagCount((prevTagCount) => prevTagCount + 1);
            }
            setInputValue('');
        } else {
            switch (e.key) {
                case 'Delete':
                    if (activeTagIndex !== null) {
                        e.preventDefault();
                        const newTags = [...tags];
                        newTags.splice(activeTagIndex, 1);
                        setTags(newTags);
                        setActiveTagIndex((prev) =>
                            newTags.length === 0 ? null : (prev >= newTags.length ? newTags.length - 1 : prev)
                        );
                    }
                    break;
                case 'Backspace':
                    if (activeTagIndex !== null) {
                        e.preventDefault();
                        const newTags = [...tags];
                        newTags.splice(activeTagIndex, 1);
                        setTags(newTags);
                        setActiveTagIndex((prev) => (prev === 0 ? null : prev - 1));
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (activeTagIndex === null) {
                        setActiveTagIndex(0);
                    } else {
                        setActiveTagIndex((prev) => (prev + 1 >= tags.length ? 0 : prev + 1));
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (activeTagIndex === null) {
                        setActiveTagIndex(tags.length - 1);
                    } else {
                        setActiveTagIndex((prev) => (prev === 0 ? tags.length - 1 : prev - 1));
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    setActiveTagIndex(0);
                    break;
                case 'End':
                    e.preventDefault();
                    setActiveTagIndex(tags.length - 1);
                    break;
                default:
                    break;
            }
        }
    };


    const removeTag = (idToRemove) => {
        setTags(tags.filter((tag) => tag.id !== idToRemove));
        onTagRemove?.(tags.find((tag) => tag.id === idToRemove)?.text || '');
        setTagCount((prevTagCount) => prevTagCount - 1);
    };

    const onSortEnd = (oldIndex, newIndex) => {
        setTags((currentTags) => {
            const newTags = [...currentTags];
            const [removedTag] = newTags.splice(oldIndex, 1);
            newTags.splice(newIndex, 0, removedTag);

            return newTags;
        });
    };

    const handleClearAll = () => {
        onClearAll?.();
    };

    const filteredAutocompleteOptions = autocompleteFilter
        ? autocompleteOptions?.filter((option) => autocompleteFilter(option.text))
        : autocompleteOptions;

    const displayedTags = sortTags ? [...tags].sort() : tags;

    const truncatedTags = truncate
        ? tags.map((tag) => ({
            id: tag.id,
            text: tag.text?.length > truncate ? `${tag.text.substring(0, truncate)}...` : tag.text,
        }))
        : displayedTags;

    return (
        <div
            className={`w-full flex ${!includeTagsInInput && tags.length > 0 ? 'gap-3' : ''} ${inputFieldPosition === 'bottom' ? 'flex-col' : inputFieldPosition === 'top' ? 'flex-col-reverse' : 'flex-row'
                }`}
        >
            {!usePopoverForTags &&
                (!includeTagsInInput ? (
                    <TagList
                        tags={truncatedTags}
                        customTagRenderer={customTagRenderer}
                        variant={variant}
                        size={size}
                        shape={shape}
                        borderStyle={borderStyle}
                        textCase={textCase}
                        interaction={interaction}
                        animation={animation}
                        textStyle={textStyle}
                        onTagClick={onTagClick}
                        draggable={draggable}
                        onSortEnd={onSortEnd}
                        onRemoveTag={removeTag}
                        direction={direction}
                        includeTagsInInput={includeTagsInInput}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                    />
                ) : (
                    !enableAutocomplete && (
                        <div className="w-full">
                            <div
                                className={`flex flex-row flex-wrap items-center gap-2 p-2 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                <TagList
                                    tags={truncatedTags}
                                    customTagRenderer={customTagRenderer}
                                    variant={variant}
                                    size={size}
                                    shape={shape}
                                    borderStyle={borderStyle}
                                    textCase={textCase}
                                    interaction={interaction}
                                    animation={animation}
                                    textStyle={textStyle}
                                    onTagClick={onTagClick}
                                    draggable={draggable}
                                    onSortEnd={onSortEnd}
                                    onRemoveTag={removeTag}
                                    direction={direction}
                                    includeTagsInInput={includeTagsInInput}
                                    activeTagIndex={activeTagIndex}
                                    setActiveTagIndex={setActiveTagIndex}
                                />
                                <Input
                                    ref={inputRef}
                                    id={id}
                                    type="text"
                                    placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    {...inputProps}
                                    className={cn(
                                        className,
                                        'border-0 px-1 py-0 bg-transparent sm:min-w-focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0 min-w-10 w-fit',
                                    )}
                                    autoComplete={enableAutocomplete ? 'on' : 'off'}
                                    list={enableAutocomplete ? 'autocomplete-options' : undefined}
                                    disabled={maxTags !== undefined && tags.length >= maxTags}
                                />
                            </div>
                        </div>
                    )
                ))}
            {enableAutocomplete ? (
                <div className="w-full">
                    <Autocomplete
                        tags={tags}
                        setTags={setTags}
                        autocompleteOptions={filteredAutocompleteOptions}
                        maxTags={maxTags}
                        onTagAdd={onTagAdd}
                        allowDuplicates={allowDuplicates ?? false}
                        includeTagsInInput={includeTagsInInput}
                    >
                        {!usePopoverForTags ? (
                            !includeTagsInInput ? (
                                <CommandInput
                                    placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                    ref={inputRef}
                                    value={inputValue}
                                    disabled={maxTags !== undefined && tags.length >= maxTags}
                                    onChangeCapture={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    className={cn('w-full', className)}
                                />
                            ) : (
                                <div
                                    className={`flex flex-row flex-wrap items-center p-2 gap-2 h-fit w-full bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <TagList
                                        tags={truncatedTags}
                                        customTagRenderer={customTagRenderer}
                                        variant={variant}
                                        size={size}
                                        shape={shape}
                                        borderStyle={borderStyle}
                                        textCase={textCase}
                                        interaction={interaction}
                                        animation={animation}
                                        textStyle={textStyle}
                                        onTagClick={onTagClick}
                                        draggable={draggable}
                                        onSortEnd={onSortEnd}
                                        onRemoveTag={removeTag}
                                        direction={direction}
                                        includeTagsInInput={includeTagsInInput}
                                        activeTagIndex={activeTagIndex}
                                        setActiveTagIndex={setActiveTagIndex}
                                    />
                                    <CommandInput
                                        placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                        ref={inputRef}
                                        value={inputValue}
                                        disabled={maxTags !== undefined && tags.length >= maxTags}
                                        onChangeCapture={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        onFocus={handleInputFocus}
                                        onBlur={handleInputBlur}
                                        includeTagsInInput={includeTagsInInput}
                                        className={cn('border-0 min-w-[130px] h-5', className)}
                                    />
                                </div>
                            )
                        ) : (
                            <TagPopover
                                tags={truncatedTags}
                                customTagRenderer={customTagRenderer}
                                variant={variant}
                                size={size}
                                shape={shape}
                                borderStyle={borderStyle}
                                textCase={textCase}
                                interaction={interaction}
                                animation={animation}
                                textStyle={textStyle}
                                onTagClick={onTagClick}
                                draggable={draggable}
                                onSortEnd={onSortEnd}
                                onRemoveTag={removeTag}
                                direction={direction}
                                activeTagIndex={activeTagIndex}
                                setActiveTagIndex={setActiveTagIndex}
                            >
                                <CommandInput
                                    placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                    ref={inputRef}
                                    value={inputValue}
                                    disabled={maxTags !== undefined && tags.length >= maxTags}
                                    onChangeCapture={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    className={cn('w-full', className)}
                                />
                            </TagPopover>
                        )}
                    </Autocomplete>
                </div>
            ) : (
                <div className="w-full">
                    {!usePopoverForTags ? (
                        !includeTagsInInput ? (
                            <Input
                                ref={inputRef}
                                id={id}
                                type="text"
                                placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                {...inputProps}
                                className={className}
                                autoComplete={enableAutocomplete ? 'on' : 'off'}
                                list={enableAutocomplete ? 'autocomplete-options' : undefined}
                                disabled={maxTags !== undefined && tags.length >= maxTags}
                            />
                        ) : null
                    ) : (
                        <TagPopover
                            tags={truncatedTags}
                            customTagRenderer={customTagRenderer}
                            variant={variant}
                            size={size}
                            shape={shape}
                            borderStyle={borderStyle}
                            textCase={textCase}
                            interaction={interaction}
                            animation={animation}
                            textStyle={textStyle}
                            onTagClick={onTagClick}
                            draggable={draggable}
                            onSortEnd={onSortEnd}
                            onRemoveTag={removeTag}
                            direction={direction}
                            activeTagIndex={activeTagIndex}
                            setActiveTagIndex={setActiveTagIndex}
                        >
                            <Input
                                ref={inputRef}
                                id={id}
                                type="text"
                                placeholder={maxTags !== undefined && tags.length >= maxTags ? placeholderWhenFull : placeholder}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                {...inputProps}
                                className={className}
                                autoComplete={enableAutocomplete ? 'on' : 'off'}
                                list={enableAutocomplete ? 'autocomplete-options' : undefined}
                                disabled={maxTags !== undefined && tags.length >= maxTags}
                            />
                        </TagPopover>
                    )}
                </div>
            )}

            {showCount && maxTags && (
                <div className="flex">
                    <span className="text-muted-foreground text-sm mt-1 ml-auto">
                        {`${tagCount}`}/{`${maxTags}`}
                    </span>
                </div>
            )}
            {clearAll && (
                <Button type="button" onClick={handleClearAll} className="mt-2">
                    Clear All
                </Button>
            )}
        </div>
    );
});

TagInput.displayName = 'TagInput';

export { TagInput };