import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import type { SortConfig } from "@/hooks/use-client-table"

interface SortIndicatorProps {
    column: PropertyKey
    sortConfig: SortConfig<PropertyKey> | null
    inactiveClassName?: string
}

export function SortIndicator({
    column,
    sortConfig,
    inactiveClassName = "text-slate-600",
}: SortIndicatorProps) {
    if (sortConfig?.key !== column) {
        return <ArrowUpDown className={`ml-2 inline h-3 w-3 ${inactiveClassName}`} />
    }

    return sortConfig.direction === "asc" ? (
        <ArrowUp className="ml-2 inline h-3 w-3 text-primary" />
    ) : (
        <ArrowDown className="ml-2 inline h-3 w-3 text-primary" />
    )
}
