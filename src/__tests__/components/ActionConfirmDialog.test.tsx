import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ActionConfirmDialog } from "@/components/ui/action-confirm-dialog"

describe("ActionConfirmDialog", () => {
    it("renders the requested action and confirms it", () => {
        const onConfirm = vi.fn()

        render(
            <ActionConfirmDialog
                open
                action="create"
                title="Create project?"
                description="Confirm creating this project."
                confirmLabel="Create project"
                onConfirm={onConfirm}
                onOpenChange={vi.fn()}
            />
        )

        expect(screen.getByRole("heading", { name: "Create project?" })).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Create project" }))
        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it("locks controls and shows process feedback while loading", () => {
        render(
            <ActionConfirmDialog
                open
                action="delete"
                title="Delete entry?"
                description="This cannot be undone."
                loading
                onConfirm={vi.fn()}
                onOpenChange={vi.fn()}
            />
        )

        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
        expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled()
    })
})
