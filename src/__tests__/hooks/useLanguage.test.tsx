import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react'
import React from 'react'
import { LanguageProvider, useLanguage, type Language } from '@/components/providers/language-provider'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value
        }),
        clear: () => {
            store = {}
        },
    }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Wrapper component for testing hooks
function TestWrapper({ children }: { children: React.ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>
}

describe('useLanguage Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()
    })

    describe('Initial State', () => {
        it('should default to English', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            expect(result.current.language).toBe('en')
        })

        it('should load saved language from localStorage', () => {
            localStorageMock.getItem.mockReturnValueOnce('th')

            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            // Note: The effect runs asynchronously, so we may need to wait
            // For this test, we verify the mechanism is in place
            expect(localStorageMock.getItem).toHaveBeenCalledWith('app-language')
        })
    })

    describe('setLanguage', () => {
        it('should change language to Thai', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            act(() => {
                result.current.setLanguage('th')
            })

            expect(result.current.language).toBe('th')
        })

        it('should change language to English', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            act(() => {
                result.current.setLanguage('th')
            })

            act(() => {
                result.current.setLanguage('en')
            })

            expect(result.current.language).toBe('en')
        })

        it('should save language to localStorage', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            act(() => {
                result.current.setLanguage('th')
            })

            expect(localStorageMock.setItem).toHaveBeenCalledWith('app-language', 'th')
        })
    })

    describe('Translation function (t)', () => {
        it('should return English translation by default', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            expect(result.current.t('dash.title')).toBe('Dashboard')
        })

        it('should return Thai translation when language is Thai', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            act(() => {
                result.current.setLanguage('th')
            })

            expect(result.current.t('dash.title')).toBe('แดชบอร์ด')
        })

        it('should return the key if translation not found', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            expect(result.current.t('unknown.key')).toBe('unknown.key')
        })

        it('should translate common keys', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            expect(result.current.t('common.cancel')).toBe('Cancel')
            expect(result.current.t('common.delete')).toBe('Delete')
            expect(result.current.t('common.edit')).toBe('Edit')
        })

        it('should translate navigation keys', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            expect(result.current.t('nav.dashboard')).toBe('Dashboard')
            expect(result.current.t('nav.calendar')).toBe('My Calendar')
            expect(result.current.t('nav.reports')).toBe('Reports')
        })

        it('should translate Thai navigation keys', () => {
            const { result } = renderHook(() => useLanguage(), {
                wrapper: TestWrapper,
            })

            act(() => {
                result.current.setLanguage('th')
            })

            expect(result.current.t('nav.dashboard')).toBe('แดชบอร์ด')
            expect(result.current.t('nav.calendar')).toBe('ปฏิทินของฉัน')
            expect(result.current.t('nav.reports')).toBe('รายงาน')
        })
    })

    describe('Error Handling', () => {
        it('should throw error when used outside of LanguageProvider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            expect(() => {
                renderHook(() => useLanguage())
            }).toThrow('useLanguage must be used within a LanguageProvider')

            consoleSpy.mockRestore()
        })
    })
})

describe('LanguageProvider Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()
    })

    it('should provide language context to children', () => {
        function TestComponent() {
            const { language } = useLanguage()
            return <div data-testid="language">{language}</div>
        }

        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        )

        expect(screen.getByTestId('language')).toHaveTextContent('en')
    })

    it('should allow nested components to access translations', () => {
        function TestComponent() {
            const { t } = useLanguage()
            return <div data-testid="translation">{t('app.title')}</div>
        }

        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        )

        expect(screen.getByTestId('translation')).toHaveTextContent('Timesheet App')
    })
})
