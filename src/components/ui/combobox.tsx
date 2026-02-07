"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    value?: string
    onChange: (value: string) => void
    options: { label: string; value: string }[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    disabled?: boolean
}

export function Combobox({
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    className,
    disabled
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)

    // Find label for current value
    const selectedLabel = React.useMemo(() => {
        return options.find((option) => option.value === value)?.label
    }, [value, options])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-slate-100 border-slate-200 hover:bg-slate-200/50 hover:text-slate-900", className)}
                    disabled={disabled}
                >
                    {value ? selectedLabel : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 min-w-[200px]" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Search by label
                                    onSelect={(currentValue) => {
                                        // currentValue is the label (lowercase) from cmdk
                                        // We need to find the matching option value
                                        const matchingOption = options.find(o => o.label.toLowerCase() === currentValue.toLowerCase())
                                        if (matchingOption) {
                                            onChange(matchingOption.value === value ? "" : matchingOption.value)
                                            setOpen(false)
                                        }
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
