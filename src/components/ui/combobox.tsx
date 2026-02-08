"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

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
    const [searchQuery, setSearchQuery] = React.useState("")

    // Find label for current value
    const selectedLabel = React.useMemo(() => {
        return options.find((option) => option.value === value)?.label
    }, [value, options])

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options
        const query = searchQuery.toLowerCase()
        return options.filter((option) =>
            option.label.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    // Reset search when popover closes
    React.useEffect(() => {
        if (!open) {
            setSearchQuery("")
        }
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-stone-700 border-stone-600 text-stone-100 hover:bg-stone-600 hover:text-stone-100", className)}
                    disabled={disabled}
                >
                    {value ? selectedLabel : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 min-w-[200px] bg-stone-800 border-stone-700" align="start">
                <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="flex items-center border-b border-stone-700 px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-stone-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 border-0 bg-transparent py-3 text-sm outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-stone-100 placeholder:text-stone-500"
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-stone-400">
                                {emptyText}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    role="option"
                                    aria-selected={value === option.value}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-stone-100 hover:bg-stone-700 hover:text-stone-100",
                                        value === option.value && "bg-stone-700 text-primary"
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
