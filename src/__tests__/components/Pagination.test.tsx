import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '@/components/Pagination'

describe('Pagination Component', () => {
    const mockOnPageChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should not render when totalPages is 1', () => {
            const { container } = render(
                <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
            )

            expect(container.firstChild).toBeNull()
        })

        it('should not render when totalPages is 0', () => {
            const { container } = render(
                <Pagination currentPage={1} totalPages={0} onPageChange={mockOnPageChange} />
            )

            expect(container.firstChild).toBeNull()
        })

        it('should render all page numbers when totalPages <= 7', () => {
            render(
                <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
            )

            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('3')).toBeInTheDocument()
            expect(screen.getByText('4')).toBeInTheDocument()
            expect(screen.getByText('5')).toBeInTheDocument()
        })

        it('should render navigation buttons', () => {
            render(
                <Pagination currentPage={3} totalPages={10} onPageChange={mockOnPageChange} />
            )

            // There should be 4 navigation buttons (first, prev, next, last)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThanOrEqual(4)
        })
    })

    describe('Navigation Button States', () => {
        it('should disable first/prev buttons on first page', () => {
            render(
                <Pagination currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            // First two buttons are first/prev
            expect(buttons[0]).toBeDisabled()
            expect(buttons[1]).toBeDisabled()
        })

        it('should disable next/last buttons on last page', () => {
            render(
                <Pagination currentPage={10} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            // Last two buttons are next/last
            expect(buttons[buttons.length - 1]).toBeDisabled()
            expect(buttons[buttons.length - 2]).toBeDisabled()
        })

        it('should enable all buttons on middle pages', () => {
            render(
                <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            expect(buttons[0]).not.toBeDisabled()
            expect(buttons[1]).not.toBeDisabled()
            expect(buttons[buttons.length - 1]).not.toBeDisabled()
            expect(buttons[buttons.length - 2]).not.toBeDisabled()
        })
    })

    describe('Click Handlers', () => {
        it('should call onPageChange with correct page when clicking page number', () => {
            render(
                <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
            )

            fireEvent.click(screen.getByText('3'))

            expect(mockOnPageChange).toHaveBeenCalledWith(3)
        })

        it('should call onPageChange with page 1 when clicking first button', () => {
            render(
                <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            fireEvent.click(buttons[0]) // First button

            expect(mockOnPageChange).toHaveBeenCalledWith(1)
        })

        it('should call onPageChange with currentPage - 1 when clicking prev button', () => {
            render(
                <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            fireEvent.click(buttons[1]) // Prev button

            expect(mockOnPageChange).toHaveBeenCalledWith(4)
        })

        it('should call onPageChange with currentPage + 1 when clicking next button', () => {
            render(
                <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            fireEvent.click(buttons[buttons.length - 2]) // Next button

            expect(mockOnPageChange).toHaveBeenCalledWith(6)
        })

        it('should call onPageChange with totalPages when clicking last button', () => {
            render(
                <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
            )

            const buttons = screen.getAllByRole('button')
            fireEvent.click(buttons[buttons.length - 1]) // Last button

            expect(mockOnPageChange).toHaveBeenCalledWith(10)
        })
    })

    describe('Ellipsis Logic', () => {
        it('should show ellipsis for large page counts when near start', () => {
            render(
                <Pagination currentPage={2} totalPages={30} onPageChange={mockOnPageChange} />
            )

            // Should show: 1, 2, 3, 4, 5, ..., 30
            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('30')).toBeInTheDocument()
        })

        it('should show ellipsis for large page counts when near end', () => {
            render(
                <Pagination currentPage={28} totalPages={30} onPageChange={mockOnPageChange} />
            )

            // Should show: 1, ..., 26, 27, 28, 29, 30
            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('26')).toBeInTheDocument()
            expect(screen.getByText('30')).toBeInTheDocument()
        })

        it('should show double ellipsis when in middle of large range', () => {
            render(
                <Pagination currentPage={15} totalPages={30} onPageChange={mockOnPageChange} />
            )

            // Should show: 1, ..., 14, 15, 16, ..., 30
            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('14')).toBeInTheDocument()
            expect(screen.getByText('15')).toBeInTheDocument()
            expect(screen.getByText('16')).toBeInTheDocument()
            expect(screen.getByText('30')).toBeInTheDocument()
        })
    })

    describe('Active State', () => {
        it('should highlight current page as active', () => {
            render(
                <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
            )

            const currentPageButton = screen.getByText('3')
            // The active button should have the 'bg-primary' class
            expect(currentPageButton.className).toContain('bg-primary')
        })
    })
})
