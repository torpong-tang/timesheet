import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HighlightText } from "@/components/data-table/highlight-text"

describe("HighlightText", () => {
    it("highlights matching text without changing its case", () => {
        const { container } = render(
            <HighlightText text="Project Alpha" highlight="alpha" />
        )

        expect(screen.getByText("Alpha")).toBeInTheDocument()
        expect(container.querySelector("mark")).toHaveTextContent("Alpha")
    })

    it("treats regular-expression characters as literal search text", () => {
        const { container } = render(
            <HighlightText text="Project [Alpha] (v2)" highlight="[" />
        )

        expect(container).toHaveTextContent("Project [Alpha] (v2)")
        expect(container.querySelector("mark")).toHaveTextContent("[")
    })

    it("renders plain text when the query is blank", () => {
        const { container } = render(
            <HighlightText text="No highlight" highlight="   " />
        )

        expect(container).toHaveTextContent("No highlight")
        expect(container.querySelector("mark")).toBeNull()
    })
})
