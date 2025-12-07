import React from 'react';
import { Tag } from './tag';
import { cn } from '../../../lib/utils';

export const TagList = ({
    tags,
    customTagRenderer,
    direction,
    className,
    includeTagsInInput,
    activeTagIndex,
    setActiveTagIndex,
    ...tagListProps
}) => {

    return (
        <>
            {!includeTagsInInput ? (
                <div
                    className={cn('rounded-md w-full', className, {
                        'flex flex-wrap gap-2': direction === 'row',
                        'flex flex-col gap-2': direction === 'column',
                    })}
                >

                    {tags.map((tagObj, index) =>
                        customTagRenderer ? customTagRenderer(tagObj, index === activeTagIndex) : <Tag key={tagObj.id} isActiveTag={index === activeTagIndex} tagObj={tagObj} {...tagListProps} />,
                    )}
                </div>
            ) : (
                <>
                    {
                        tags.map((tagObj, index) =>
                            customTagRenderer ? customTagRenderer(tagObj, index === activeTagIndex) : <Tag key={tagObj.id} tagObj={tagObj} isActiveTag={index === activeTagIndex} {...tagListProps} />,
                        )
                    }
                </>
            )}
        </>
    );
};