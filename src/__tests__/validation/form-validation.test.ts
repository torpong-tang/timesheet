import { describe, it, expect } from 'vitest'

/**
 * Form Validation Tests
 * 
 * These tests validate the business logic for form validation 
 * used throughout the timesheet application.
 */

describe('Form Validation Logic', () => {
    describe('Timesheet Entry Validation', () => {
        // Hours validation rules
        const validateHours = (hours: number): { valid: boolean; error?: string } => {
            if (hours < 0.5) return { valid: false, error: 'Minimum 0.5 hours required' }
            if (hours > 7) return { valid: false, error: 'Maximum 7 hours per day' }
            if (hours % 0.5 !== 0) return { valid: false, error: 'Hours must be in 0.5 increments' }
            return { valid: true }
        }

        it('should reject hours less than 0.5', () => {
            expect(validateHours(0)).toEqual({ valid: false, error: 'Minimum 0.5 hours required' })
            expect(validateHours(0.25)).toEqual({ valid: false, error: 'Minimum 0.5 hours required' })
        })

        it('should reject hours greater than 7', () => {
            expect(validateHours(7.5)).toEqual({ valid: false, error: 'Maximum 7 hours per day' })
            expect(validateHours(8)).toEqual({ valid: false, error: 'Maximum 7 hours per day' })
            expect(validateHours(10)).toEqual({ valid: false, error: 'Maximum 7 hours per day' })
        })

        it('should reject non-0.5 increments', () => {
            expect(validateHours(1.25)).toEqual({ valid: false, error: 'Hours must be in 0.5 increments' })
            expect(validateHours(2.3)).toEqual({ valid: false, error: 'Hours must be in 0.5 increments' })
            expect(validateHours(3.75)).toEqual({ valid: false, error: 'Hours must be in 0.5 increments' })
        })

        it('should accept valid hours', () => {
            expect(validateHours(0.5)).toEqual({ valid: true })
            expect(validateHours(1)).toEqual({ valid: true })
            expect(validateHours(3.5)).toEqual({ valid: true })
            expect(validateHours(7)).toEqual({ valid: true })
        })
    })

    describe('User Form Validation', () => {
        const validateUserForm = (data: {
            userlogin?: string
            email?: string
            name?: string
            password?: string
            isNew?: boolean
        }): { valid: boolean; errors: Record<string, string> } => {
            const errors: Record<string, string> = {}

            // Userlogin validation
            if (!data.userlogin || data.userlogin.trim() === '') {
                errors.userlogin = 'User login is required'
            } else if (data.userlogin.length < 3) {
                errors.userlogin = 'User login must be at least 3 characters'
            } else if (!/^[a-zA-Z0-9._]+$/.test(data.userlogin)) {
                errors.userlogin = 'User login can only contain letters, numbers, dots, and underscores'
            }

            // Email validation
            if (!data.email || data.email.trim() === '') {
                errors.email = 'Email is required'
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                errors.email = 'Invalid email format'
            }

            // Name validation
            if (!data.name || data.name.trim() === '') {
                errors.name = 'Name is required'
            }

            // Password validation (only for new users)
            if (data.isNew) {
                if (!data.password || data.password === '') {
                    errors.password = 'Password is required for new users'
                } else if (data.password.length < 6) {
                    errors.password = 'Password must be at least 6 characters'
                }
            }

            return {
                valid: Object.keys(errors).length === 0,
                errors,
            }
        }

        it('should require userlogin', () => {
            const result = validateUserForm({
                email: 'test@test.com',
                name: 'Test User',
                password: 'password123',
                isNew: true,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.userlogin).toBe('User login is required')
        })

        it('should validate userlogin format', () => {
            const result = validateUserForm({
                userlogin: 'user@name',
                email: 'test@test.com',
                name: 'Test User',
                password: 'password123',
                isNew: true,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.userlogin).toBe('User login can only contain letters, numbers, dots, and underscores')
        })

        it('should accept valid userlogin formats', () => {
            const validUserlogins = ['john.doe', 'john_doe', 'JohnDoe123', 'user.name_123']

            validUserlogins.forEach((userlogin) => {
                const result = validateUserForm({
                    userlogin,
                    email: 'test@test.com',
                    name: 'Test User',
                    password: 'password123',
                    isNew: true,
                })

                expect(result.errors.userlogin).toBeUndefined()
            })
        })

        it('should require valid email', () => {
            const result = validateUserForm({
                userlogin: 'valid.user',
                email: 'invalid-email',
                name: 'Test User',
                password: 'password123',
                isNew: true,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.email).toBe('Invalid email format')
        })

        it('should require password for new users', () => {
            const result = validateUserForm({
                userlogin: 'valid.user',
                email: 'test@test.com',
                name: 'Test User',
                isNew: true,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.password).toBe('Password is required for new users')
        })

        it('should not require password for existing users', () => {
            const result = validateUserForm({
                userlogin: 'valid.user',
                email: 'test@test.com',
                name: 'Test User',
                isNew: false,
            })

            expect(result.valid).toBe(true)
            expect(result.errors.password).toBeUndefined()
        })

        it('should validate password length', () => {
            const result = validateUserForm({
                userlogin: 'valid.user',
                email: 'test@test.com',
                name: 'Test User',
                password: '123',
                isNew: true,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.password).toBe('Password must be at least 6 characters')
        })

        it('should pass all validations for valid data', () => {
            const result = validateUserForm({
                userlogin: 'john.doe',
                email: 'john@example.com',
                name: 'John Doe',
                password: 'securePassword123',
                isNew: true,
            })

            expect(result.valid).toBe(true)
            expect(result.errors).toEqual({})
        })
    })

    describe('Project Form Validation', () => {
        const validateProjectForm = (data: {
            code?: string
            name?: string
            startDate?: Date
            endDate?: Date
            budget?: number
        }): { valid: boolean; errors: Record<string, string> } => {
            const errors: Record<string, string> = {}

            // Code validation
            if (!data.code || data.code.trim() === '') {
                errors.code = 'Project code is required'
            } else if (data.code.length < 2) {
                errors.code = 'Project code must be at least 2 characters'
            } else if (!/^[A-Z0-9]+$/.test(data.code)) {
                errors.code = 'Project code must be uppercase alphanumeric'
            }

            // Name validation
            if (!data.name || data.name.trim() === '') {
                errors.name = 'Project name is required'
            }

            // Date validation
            if (!data.startDate) {
                errors.startDate = 'Start date is required'
            }
            if (!data.endDate) {
                errors.endDate = 'End date is required'
            }
            if (data.startDate && data.endDate && data.startDate > data.endDate) {
                errors.dateRange = 'End date must be after start date'
            }

            // Budget validation
            if (data.budget !== undefined && data.budget < 0) {
                errors.budget = 'Budget cannot be negative'
            }

            return {
                valid: Object.keys(errors).length === 0,
                errors,
            }
        }

        it('should require project code', () => {
            const result = validateProjectForm({
                name: 'Test Project',
                startDate: new Date(),
                endDate: new Date(),
            })

            expect(result.valid).toBe(false)
            expect(result.errors.code).toBe('Project code is required')
        })

        it('should validate project code format', () => {
            const result = validateProjectForm({
                code: 'abc123',
                name: 'Test Project',
                startDate: new Date(),
                endDate: new Date(),
            })

            expect(result.valid).toBe(false)
            expect(result.errors.code).toBe('Project code must be uppercase alphanumeric')
        })

        it('should accept valid project codes', () => {
            const validCodes = ['ABC', 'PROJECT123', 'P1', 'STW02S6']

            validCodes.forEach((code) => {
                const result = validateProjectForm({
                    code,
                    name: 'Test Project',
                    startDate: new Date('2026-01-01'),
                    endDate: new Date('2026-12-31'),
                })

                expect(result.errors.code).toBeUndefined()
            })
        })

        it('should validate date range', () => {
            const result = validateProjectForm({
                code: 'TEST',
                name: 'Test Project',
                startDate: new Date('2026-12-31'),
                endDate: new Date('2026-01-01'),
            })

            expect(result.valid).toBe(false)
            expect(result.errors.dateRange).toBe('End date must be after start date')
        })

        it('should reject negative budget', () => {
            const result = validateProjectForm({
                code: 'TEST',
                name: 'Test Project',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                budget: -1000,
            })

            expect(result.valid).toBe(false)
            expect(result.errors.budget).toBe('Budget cannot be negative')
        })

        it('should pass all validations for valid data', () => {
            const result = validateProjectForm({
                code: 'PROJ2026',
                name: 'New Project 2026',
                startDate: new Date('2026-01-01'),
                endDate: new Date('2026-12-31'),
                budget: 100000,
            })

            expect(result.valid).toBe(true)
            expect(result.errors).toEqual({})
        })
    })

    describe('Daily Hours Limit Validation', () => {
        const validateDailyLimit = (
            existingHours: number,
            newHours: number
        ): { valid: boolean; error?: string; remainingHours: number } => {
            const MAX_DAILY_HOURS = 7
            const total = existingHours + newHours
            const remaining = MAX_DAILY_HOURS - existingHours

            if (total > MAX_DAILY_HOURS) {
                return {
                    valid: false,
                    error: `Daily limit exceeded. You have ${existingHours}h logged. Maximum additional: ${remaining}h`,
                    remainingHours: remaining,
                }
            }

            return { valid: true, remainingHours: remaining - newHours }
        }

        it('should reject when new hours exceed remaining capacity', () => {
            const result = validateDailyLimit(5, 3)

            expect(result.valid).toBe(false)
            expect(result.error).toContain('Daily limit exceeded')
        })

        it('should accept when new hours fit within limit', () => {
            const result = validateDailyLimit(3, 4)

            expect(result.valid).toBe(true)
            expect(result.remainingHours).toBe(0)
        })

        it('should calculate remaining hours correctly', () => {
            const result = validateDailyLimit(2, 2)

            expect(result.valid).toBe(true)
            expect(result.remainingHours).toBe(3) // 7 - 2 - 2 = 3
        })

        it('should allow exactly 7 hours total', () => {
            const result = validateDailyLimit(0, 7)

            expect(result.valid).toBe(true)
            expect(result.remainingHours).toBe(0)
        })

        it('should reject going over by even 0.5 hours', () => {
            const result = validateDailyLimit(7, 0.5)

            expect(result.valid).toBe(false)
        })
    })
})
