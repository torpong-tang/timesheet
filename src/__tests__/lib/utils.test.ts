import { describe, it, expect } from 'vitest'
import { cn, formatDuration } from '@/lib/utils'

describe('Utility Functions', () => {
    describe('cn (class name merger)', () => {
        it('should merge class names', () => {
            const result = cn('class1', 'class2')
            expect(result).toContain('class1')
            expect(result).toContain('class2')
        })

        it('should handle conditional classes', () => {
            const result = cn('base', true && 'true-class', false && 'false-class')
            expect(result).toContain('base')
            expect(result).toContain('true-class')
            expect(result).not.toContain('false-class')
        })

        it('should handle undefined and null values', () => {
            const result = cn('base', undefined, null, 'valid')
            expect(result).toContain('base')
            expect(result).toContain('valid')
        })
    })

    describe('formatDuration', () => {
        it('should format whole hours correctly', () => {
            // Format: Xh (Yd) where Y = X/7 (7-hour workday)
            expect(formatDuration(7)).toBe('7h (1d)')
            expect(formatDuration(14)).toBe('14h (2d)')
        })

        it('should format partial hours correctly', () => {
            expect(formatDuration(3.5)).toBe('3.5h (0.5d)')
            expect(formatDuration(1)).toBe('1h (0.1d)')
        })

        it('should format zero correctly', () => {
            expect(formatDuration(0)).toBe('0h (0d)')
        })

        it('should handle decimal values', () => {
            expect(formatDuration(2.5)).toBe('2.5h (0.4d)')
            expect(formatDuration(5.25)).toBe('5.25h (0.8d)')
        })
    })
})
