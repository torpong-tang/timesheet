import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button Component', () => {
    describe('Rendering', () => {
        it('should render button with children', () => {
            render(<Button>Click me</Button>)

            expect(screen.getByRole('button')).toHaveTextContent('Click me')
        })

        it('should render as a button element by default', () => {
            render(<Button>Test</Button>)

            const button = screen.getByRole('button')
            expect(button.tagName).toBe('BUTTON')
        })

        it('should apply default variant and size', () => {
            render(<Button>Default</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'default')
            expect(button).toHaveAttribute('data-size', 'default')
        })

        it('should apply data-slot attribute', () => {
            render(<Button>Test</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-slot', 'button')
        })
    })

    describe('Variants', () => {
        it('should render default variant', () => {
            render(<Button variant="default">Default</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'default')
            expect(button.className).toContain('bg-primary')
        })

        it('should render destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'destructive')
            expect(button.className).toContain('bg-destructive')
        })

        it('should render outline variant', () => {
            render(<Button variant="outline">Outline</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'outline')
            expect(button.className).toContain('border')
        })

        it('should render secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'secondary')
            expect(button.className).toContain('bg-secondary')
        })

        it('should render ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'ghost')
        })

        it('should render link variant', () => {
            render(<Button variant="link">Link</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-variant', 'link')
            expect(button.className).toContain('underline-offset-4')
        })
    })

    describe('Sizes', () => {
        it('should render default size', () => {
            render(<Button size="default">Default Size</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-size', 'default')
            expect(button.className).toContain('h-9')
        })

        it('should render sm size', () => {
            render(<Button size="sm">Small</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-size', 'sm')
            expect(button.className).toContain('h-8')
        })

        it('should render lg size', () => {
            render(<Button size="lg">Large</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-size', 'lg')
            expect(button.className).toContain('h-10')
        })

        it('should render icon size', () => {
            render(<Button size="icon">🔥</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-size', 'icon')
            expect(button.className).toContain('size-9')
        })

        it('should render xs size', () => {
            render(<Button size="xs">XS</Button>)

            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-size', 'xs')
            expect(button.className).toContain('h-6')
        })
    })

    describe('States', () => {
        it('should handle disabled state', () => {
            render(<Button disabled>Disabled</Button>)

            const button = screen.getByRole('button')
            expect(button).toBeDisabled()
            expect(button.className).toContain('disabled:opacity-50')
        })

        it('should handle click events', () => {
            const handleClick = vi.fn()
            render(<Button onClick={handleClick}>Click</Button>)

            fireEvent.click(screen.getByRole('button'))

            expect(handleClick).toHaveBeenCalledTimes(1)
        })

        it('should not fire click when disabled', () => {
            const handleClick = vi.fn()
            render(<Button disabled onClick={handleClick}>Disabled</Button>)

            fireEvent.click(screen.getByRole('button'))

            expect(handleClick).not.toHaveBeenCalled()
        })
    })

    describe('Custom className', () => {
        it('should merge custom className with variant classes', () => {
            render(<Button className="custom-class">Custom</Button>)

            const button = screen.getByRole('button')
            expect(button.className).toContain('custom-class')
            expect(button.className).toContain('inline-flex')
        })
    })

    describe('buttonVariants utility', () => {
        it('should generate correct classes for variant', () => {
            const classes = buttonVariants({ variant: 'destructive' })
            expect(classes).toContain('bg-destructive')
        })

        it('should generate correct classes for size', () => {
            const classes = buttonVariants({ size: 'lg' })
            expect(classes).toContain('h-10')
        })

        it('should generate correct classes for combination', () => {
            const classes = buttonVariants({ variant: 'outline', size: 'sm' })
            expect(classes).toContain('border')
            expect(classes).toContain('h-8')
        })
    })
})
