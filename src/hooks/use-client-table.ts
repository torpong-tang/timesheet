"use client"

import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"
export type SortConfig<TKey extends PropertyKey> = {
    key: TKey
    direction: SortDirection
}

type SortValue = string | number | boolean | Date | null | undefined

interface UseClientTableOptions<TItem, TKey extends PropertyKey> {
    items: TItem[]
    matchesSearch: (item: TItem, normalizedQuery: string) => boolean
    getSortValue: (item: TItem, key: TKey) => SortValue
    initialPageSize?: number
    initialSort?: SortConfig<TKey> | null
}

function compareValues(left: SortValue, right: SortValue) {
    if (left instanceof Date || right instanceof Date) {
        const toTimestamp = (value: SortValue) => {
            if (value instanceof Date) return value.getTime()
            if (typeof value === "string" || typeof value === "number") {
                return new Date(value).getTime()
            }
            return 0
        }

        return toTimestamp(left) - toTimestamp(right)
    }

    if (typeof left === "number" && typeof right === "number") {
        return left - right
    }

    if (typeof left === "boolean" && typeof right === "boolean") {
        return Number(left) - Number(right)
    }

    return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
    })
}

export function useClientTable<TItem, TKey extends PropertyKey>({
    items,
    matchesSearch,
    getSortValue,
    initialPageSize = 10,
    initialSort = null,
}: UseClientTableOptions<TItem, TKey>) {
    const [searchQuery, setSearchQueryState] = useState("")
    const [sortConfig, setSortConfig] = useState<SortConfig<TKey> | null>(initialSort)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSizeState] = useState(initialPageSize)

    const processedItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
        const result = normalizedQuery
            ? items.filter((item) => matchesSearch(item, normalizedQuery))
            : [...items]

        if (!sortConfig) return result

        return result.sort((left, right) => {
            const comparison = compareValues(
                getSortValue(left, sortConfig.key),
                getSortValue(right, sortConfig.key)
            )

            return sortConfig.direction === "asc" ? comparison : -comparison
        })
    }, [getSortValue, items, matchesSearch, searchQuery, sortConfig])

    const totalPages = Math.ceil(processedItems.length / pageSize)
    const safePage = Math.min(page, Math.max(totalPages, 1))
    const paginatedItems = processedItems.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    )

    const setSearchQuery = (value: string) => {
        setSearchQueryState(value)
        setPage(1)
    }

    const setPageSize = (value: number) => {
        setPageSizeState(value)
        setPage(1)
    }

    const toggleSort = (key: TKey) => {
        setSortConfig((current) => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
        }))
        setPage(1)
    }

    return {
        page: safePage,
        pageSize,
        paginatedItems,
        processedItems,
        searchQuery,
        setPage,
        setPageSize,
        setSearchQuery,
        sortConfig,
        toggleSort,
        totalPages,
    }
}
