import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useClientTable } from "@/hooks/use-client-table"

type Item = {
    id: string
    name: string
    score: number
}

const items: Item[] = [
    { id: "alpha", name: "Alpha", score: 20 },
    { id: "bravo", name: "Bravo", score: 3 },
    { id: "charlie", name: "Charlie", score: 100 },
]

const matchesSearch = (item: Item, query: string) =>
    item.name.toLocaleLowerCase().includes(query)

const getSortValue = (item: Item, key: keyof Item) => item[key]

describe("useClientTable", () => {
    it("filters and resets pagination when the search changes", () => {
        const { result } = renderHook(() =>
            useClientTable<Item, keyof Item>({
                items,
                matchesSearch,
                getSortValue,
                initialPageSize: 2,
            })
        )

        act(() => result.current.setPage(2))
        expect(result.current.page).toBe(2)

        act(() => result.current.setSearchQuery("brav"))

        expect(result.current.page).toBe(1)
        expect(result.current.processedItems.map((item) => item.id)).toEqual(["bravo"])
    })

    it("sorts numeric values numerically in both directions", () => {
        const { result } = renderHook(() =>
            useClientTable<Item, keyof Item>({
                items,
                matchesSearch,
                getSortValue,
            })
        )

        act(() => result.current.toggleSort("score"))
        expect(result.current.processedItems.map((item) => item.score)).toEqual([3, 20, 100])

        act(() => result.current.toggleSort("score"))
        expect(result.current.processedItems.map((item) => item.score)).toEqual([100, 20, 3])
    })

    it("clamps the visible page after the item count shrinks", () => {
        const { result, rerender } = renderHook(
            ({ tableItems }) =>
                useClientTable<Item, keyof Item>({
                    items: tableItems,
                    matchesSearch,
                    getSortValue,
                    initialPageSize: 2,
                }),
            { initialProps: { tableItems: items } }
        )

        act(() => result.current.setPage(2))
        rerender({ tableItems: items.slice(0, 1) })

        expect(result.current.page).toBe(1)
        expect(result.current.paginatedItems).toHaveLength(1)
    })
})
