import {
    add,
    eachMonthOfInterval,
    endOfYear,
    format,
    isEqual,
    isFuture,
    parse,
    startOfMonth,
    startOfToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';

function getStartOfCurrentMonth() {
    return startOfMonth(startOfToday());
}


export default function MonthSelecter({ currentMonth, onMonthChange, className }) {
    // const [currentYear, setCurrentYear] = React.useState(
    //     format(currentMonth, 'yyyy')
    // );
    const currentMonthDate = currentMonth ? new Date(currentMonth) : null;
    const [currentYear, setCurrentYear] = React.useState(currentMonthDate ? format(currentMonthDate, "yyyy") : format(new Date(), "yyyy"));
    const firstDayCurrentYear = parse(currentYear, "yyyy", new Date());

    const months = eachMonthOfInterval({
        start: firstDayCurrentYear,
        end: endOfYear(firstDayCurrentYear),
    });

    function previousYear() {
        const firstDayNextYear = add(firstDayCurrentYear, { years: -1 });
        setCurrentYear(format(firstDayNextYear, "yyyy"));
    }

    function nextYear() {
        const firstDayNextYear = add(firstDayCurrentYear, { years: 1 });
        setCurrentYear(format(firstDayNextYear, "yyyy"));
    }

    return (
        <div className={cn("p-3 w-full", className)}>
            <div className="space-y-4 grid items-center justify-center">
                <div className="flex items-center justify-between pt-1 px-2">
                    <Button
                        name="previous-year"
                        aria-label="Go to previous year"
                        variant="outline"

                        className={cn(
                            'h-7 w-7 bg-transparent p-0 hover:opacity-100',
                            'left-1'
                        )}
                        type="button"
                        onClick={previousYear}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div
                        className="text-sm font-medium"
                        aria-live="polite"
                        role="presentation"
                        id="month-picker"
                    >
                        {format(firstDayCurrentYear, 'yyyy')}
                    </div>
                    <Button
                        name="next-year"
                        aria-label="Go to next year"
                        variant="outline"
                        className={cn(
                            'h-7 w-7 bg-transparent p-0 hover:opacity-100',
                            'right-1 disabled:bg-slate-100'
                        )}
                        type="button"
                        disabled={isFuture(add(firstDayCurrentYear, { years: 1 }))}
                        onClick={nextYear}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div
                    className="grid w-full grid-cols-3 gap-2"
                    role="grid"
                    aria-labelledby="month-picker"
                >
                    {months.map((month) => (
                        <div
                            key={month.toString()}
                            className="flex items-center justify-center h-9 w-12"
                            role="presentation"
                        >
                            <Button
                                name="day"
                                variant='none'
                                className={cn(
                                    'h-9 w-12 p-0 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:ring-offset-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 dark:focus-visible:ring-slate-800',
                                    isEqual(month, currentMonth) &&
                                    'bg-indigo-500 text-slate-50 hover:bg-indigo-600 hover:text-slate-50 focus:bg-indigo-600 focus:text-slate-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50 dark:hover:text-slate-900 dark:focus:bg-slate-50 dark:focus:text-slate-900',
                                    !isEqual(month, currentMonth) &&
                                    isEqual(month, getStartOfCurrentMonth()) &&
                                    'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                                )}
                                disabled={isFuture(month)}
                                role="gridcell"
                                tabIndex={-1}
                                type="button"
                                onClick={() => onMonthChange(month)}
                            >
                                <time dateTime={format(month, 'yyyy-MM-dd')}>
                                    {format(month, 'MMM')}
                                </time>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

    );
}