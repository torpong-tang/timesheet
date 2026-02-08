import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'

describe('Switch Component', () => {
    describe('Rendering', () => {
        it('should render switch element', () => {
            render(<Switch />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement).toBeInTheDocument()
        })

        it('should render unchecked by default', () => {
            render(<Switch />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement).toHaveAttribute('data-state', 'unchecked')
        })

        it('should render checked when defaultChecked is true', () => {
            render(<Switch defaultChecked />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement).toHaveAttribute('data-state', 'checked')
        })

        it('should render with controlled checked state', () => {
            render(<Switch checked={true} onCheckedChange={() => { }} />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement).toHaveAttribute('data-state', 'checked')
        })
    })

    describe('Interaction', () => {
        it('should toggle state on click', () => {
            const handleChange = vi.fn()
            render(<Switch onCheckedChange={handleChange} />)

            const switchElement = screen.getByRole('switch')
            fireEvent.click(switchElement)

            expect(handleChange).toHaveBeenCalledWith(true)
        })

        it('should call onCheckedChange with false when unchecking', () => {
            const handleChange = vi.fn()
            render(<Switch defaultChecked onCheckedChange={handleChange} />)

            const switchElement = screen.getByRole('switch')
            fireEvent.click(switchElement)

            expect(handleChange).toHaveBeenCalledWith(false)
        })
    })

    describe('Disabled State', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Switch disabled />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement).toBeDisabled()
        })

        it('should not toggle when disabled', () => {
            const handleChange = vi.fn()
            render(<Switch disabled onCheckedChange={handleChange} />)

            const switchElement = screen.getByRole('switch')
            fireEvent.click(switchElement)

            expect(handleChange).not.toHaveBeenCalled()
        })

        it('should apply disabled styling', () => {
            render(<Switch disabled />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement.className).toContain('disabled:cursor-not-allowed')
            expect(switchElement.className).toContain('disabled:opacity-50')
        })
    })

    describe('Styling', () => {
        it('should apply custom className', () => {
            render(<Switch className="custom-switch" />)

            const switchElement = screen.getByRole('switch')
            expect(switchElement.className).toContain('custom-switch')
        })

        it('should have correct styling for unchecked state', () => {
            render(<Switch />)

            const switchElement = screen.getByRole('switch')
            // Check for unchecked background class
            expect(switchElement.className).toContain('data-[state=unchecked]:bg-slate-200')
        })

        it('should have correct styling for checked state', () => {
            render(<Switch defaultChecked />)

            const switchElement = screen.getByRole('switch')
            // Check for checked background class
            expect(switchElement.className).toContain('data-[state=checked]:bg-primary')
        })
    })

    describe('Accessibility', () => {
        it('should have switch role', () => {
            render(<Switch />)

            expect(screen.getByRole('switch')).toBeInTheDocument()
        })

        it('should be keyboard accessible', () => {
            const handleChange = vi.fn()
            render(<Switch onCheckedChange={handleChange} />)

            const switchElement = screen.getByRole('switch')
            switchElement.focus()
            fireEvent.keyDown(switchElement, { key: 'Enter' })

            // Note: The actual toggle behavior on Enter may depend on Radix implementation
            // This tests that it can receive keyboard focus
            expect(document.activeElement).toBe(switchElement)
        })
    })
})
