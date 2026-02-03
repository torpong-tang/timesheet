import { prisma } from "@/lib/prisma"

export async function logAudit(action: string, userId: string, details?: string) {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                userId,
                details
            }
        })
    } catch (error) {
        console.error("Failed to write audit log:", error)
        // We generally don't want audit logging failure to crash the main application flow,
        // so we catch and log the error here.
    }
}
