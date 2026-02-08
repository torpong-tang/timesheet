import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { LanguageProvider } from '@/components/providers/language-provider'

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

// Wrapper for providing language context
function TestWrapper({ children }: { children: React.ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>
}

describe('LanguageSwitcher Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()
    })

    describe('Rendering', () => {
        it('should render EN and TH buttons', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            expect(screen.getByText('EN')).toBeInTheDocument()
            expect(screen.getByText('TH')).toBeInTheDocument()
        })

        it('should render within a container', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            const buttons = screen.getAllByRole('button')
            expect(buttons).toHaveLength(2)
        })

        it('should highlight EN button by default', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            const enButton = screen.getByText('EN')
            expect(enButton.className).toContain('bg-white')
            expect(enButton.className).toContain('shadow-sm')
        })
    })

    describe('Language Switching', () => {
        it('should switch to Thai when TH is clicked', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            const thButton = screen.getByText('TH')
            fireEvent.click(thButton)

            // After clicking, TH should be highlighted
            expect(thButton.className).toContain('bg-white')
            expect(thButton.className).toContain('shadow-sm')
        })

        it('should switch back to English when EN is clicked', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            // First switch to Thai
            fireEvent.click(screen.getByText('TH'))

            // Then switch back to English
            fireEvent.click(screen.getByText('EN'))

            const enButton = screen.getByText('EN')
            expect(enButton.className).toContain('bg-white')
        })

        it('should save language preference to localStorage', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            fireEvent.click(screen.getByText('TH'))

            expect(localStorageMock.setItem).toHaveBeenCalledWith('app-language', 'th')
        })
    })

    describe('Active State Styling', () => {
        it('should apply active styling to selected language', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            const enButton = screen.getByText('EN')
            const thButton = screen.getByText('TH')

            // EN should be active by default
            expect(enButton.className).toContain('bg-white')
            expect(enButton.className).toContain('text-primary')

            // TH should be inactive
            expect(thButton.className).toContain('text-slate-500')
        })

        it('should swap active styling when language changes', () => {
            render(
                <TestWrapper>
                    <LanguageSwitcher />
                </TestWrapper>
            )

            // Click TH
            fireEvent.click(screen.getByText('TH'))

            const enButton = screen.getByText('EN')
            const thButton = screen.getByText('TH')

            // TH should now be active
            expect(thButton.className).toContain('bg-white')
            expect(thButton.className).toContain('text-primary')

            // EN should be inactive
            expect(enButton.className).toContain('text-slate-500')
        })
    })

    describe('Integration with Translation', () => {
        it('should work alongside useLanguage hook', () => {
            // Create a component that uses both
            function TestComponent() {
                return (
                    <LanguageProvider>
                        <LanguageSwitcher />
                    </LanguageProvider>
                )
            }

            render(<TestComponent />)

            expect(screen.getByText('EN')).toBeInTheDocument()
            expect(screen.getByText('TH')).toBeInTheDocument()
        })
    })
})
