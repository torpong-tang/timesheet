import { z } from "zod"

export const USER_ROLES = ["ADMIN", "GM", "PM", "DEV"] as const
export const USER_STATUSES = ["Enable", "Disable"] as const

const idSchema = z.string().trim().min(1, "ID is required").max(128)
const dateSchema = z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), "Invalid date")

export const passwordSchema = z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a symbol")

export const timesheetInputSchema = z.object({
    projectId: idSchema,
    date: dateSchema,
    hours: z
        .number()
        .finite()
        .min(0.5, "Hours must be at least 0.5")
        .max(7, "Hours must not exceed 7")
        .refine((hours) => Number.isInteger(hours * 2), "Hours must use 0.5-hour increments"),
    description: z.string().trim().min(1, "Description is required").max(1000),
})

export const recurringTimesheetInputSchema = timesheetInputSchema
    .omit({ date: true })
    .extend({
        dates: z.array(dateSchema).min(1, "At least one date is required").max(62, "Too many dates"),
    })

export const updateTimesheetInputSchema = z
    .object({
        hours: timesheetInputSchema.shape.hours.optional(),
        description: timesheetInputSchema.shape.description.optional(),
    })
    .refine((data) => data.hours !== undefined || data.description !== undefined, "No changes supplied")

export const userInputSchema = z.object({
    id: idSchema.optional(),
    userlogin: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9._@-]+$/, "Invalid username"),
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email().max(254),
    role: z.enum(USER_ROLES),
    password: z.union([passwordSchema, z.literal("")]).optional(),
    status: z.enum(USER_STATUSES),
})

export const projectInputSchema = z
    .object({
        id: idSchema.optional(),
        code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9._-]+$/, "Invalid project code"),
        name: z.string().trim().min(1, "Project name is required").max(160),
        startDate: dateSchema,
        endDate: dateSchema,
        budget: z.number().finite().min(0).max(1_000_000_000_000).optional(),
    })
    .refine((data) => data.endDate >= data.startDate, {
        message: "End date must be on or after start date",
        path: ["endDate"],
    })

export const holidayInputSchema = z
    .object({
        id: idSchema.optional(),
        name: z.string().trim().min(1, "Holiday name is required").max(160),
        date: dateSchema,
        year: z.number().int().min(2000).max(2200),
    })
    .refine((data) => data.date.getFullYear() === data.year, {
        message: "Holiday year must match its date",
        path: ["year"],
    })

export const assignmentInputSchema = z.object({
    userId: idSchema,
    projectId: idSchema,
})

export const identifierSchema = idSchema

export const reportFilterSchema = z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM"),
    userId: idSchema.optional(),
    projectId: idSchema.optional(),
})

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input)
    if (!result.success) {
        throw new Error(result.error.issues[0]?.message || "Invalid input")
    }
    return result.data
}
