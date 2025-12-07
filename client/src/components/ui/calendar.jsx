import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ScrollArea } from "./scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

import { cn } from "../../lib/utils"
import { buttonVariants } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  const handleCalendarChange = (_value, _e) => {
    const _event = {
      target: {
        value: String(_value),
      },
    };
    _e(_event);
  };
  const { selected } = props

  return (
    (<DayPicker
      defaultMonth={selected ? new Date(selected) : new Date()}
      style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption_start: "is-start",
        caption_between: "is-between",
        caption_end: "is-end",
        caption: "flex justify-center pt-1 relative items-center gap-1",
        caption_label: "flex h-7 text-sm font-medium justify-center items-center grow [.is-multiple_&]:flex",
        caption_dropdowns: "flex justify-center gap-1 grow dropdowns pl-8 pr-9",
        multiple_months: "is-multiple",
        vhidden: "hidden [.is-between_&]:flex [.is-end_&]:flex [.is-start.is-end_&]:hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex text-center",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-indigo-500 text-primary-foreground hover:!bg-indigo-500 hover:!text-primary-foreground focus:bg-indigo-500 focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground !font-bold underline",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: function (props) {
          return (
            <Select
              {...props}
              onValueChange={value => {
                if (props.onChange) {
                  handleCalendarChange(value, props.onChange);
                }
              }}
              value={props.value}
            >
              <SelectTrigger className={cn(buttonVariants({ variant: "ghost" }), "focus:ring-0 pl-2 pr-1 py-2 h-7 w-fit font-medium [.is-between_&]:hidden [.is-end_&]:hidden [.is-start.is-end_&]:flex")}>
                <SelectValue placeholder={props?.caption}>{props?.caption}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-80">
                  {props?.children &&
                    React.Children.map(props.children, child => (
                      <SelectItem value={child.props?.value}>
                        {child.props?.children}
                      </SelectItem>
                    ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          );
        },
      }}
      {...props} />)
  );
}
Calendar.displayName = "Calendar"

export { Calendar }