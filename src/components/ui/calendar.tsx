"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  getDayContent, // New Prop
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  getDayContent?: (date: Date) => React.ReactNode
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 w-full h-full",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full h-full", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col relative w-full h-full",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full h-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-14 w-14 aria-disabled:opacity-50 p-0 select-none rounded-xl",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-14 w-14 aria-disabled:opacity-50 p-0 select-none rounded-xl",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-12 w-full px-8",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-8 gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-popover inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-black text-4xl",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse table-fixed flex-1",
        weekdays: cn("flex w-full mb-4", defaultClassNames.weekdays),
        weekday: cn(
          "text-stone-300 rounded-md flex-1 font-black text-base uppercase tracking-widest select-none text-center",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2 h-full", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-8",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-1 text-center group/day aspect-square select-none overflow-hidden",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-l-md bg-accent",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-amber-900/40 text-amber-400 ring-2 ring-amber-500/50 rounded-3xl",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/20 aria-selected:text-muted-foreground/20",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-8", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-8", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-6", className)} {...props} />
          )
        },
        DayButton: (dayProps) => (
          <CalendarDayButton {...dayProps} getDayContent={getDayContent} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-8 items-center justify-center text-center font-bold">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  getDayContent, // New Prop
  ...props
}: React.ComponentProps<typeof DayButton> & {
  getDayContent?: (date: Date) => React.ReactNode
}) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-selected={modifiers.selected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground flex w-full h-full flex-col items-center justify-center gap-1 p-2 transition-all rounded-[1.5rem] hover:bg-stone-700/60 text-stone-200",
        modifiers.today && "bg-amber-900/40 text-amber-400 border-2 border-amber-500/50",
        modifiers.outside && "opacity-30",
        className
      )}
      {...props}
    >
      {!getDayContent && <span className="text-xl font-black">{day.date.getDate()}</span>}
      {getDayContent && getDayContent(day.date)}
    </Button>
  )
}


export { Calendar, CalendarDayButton }
