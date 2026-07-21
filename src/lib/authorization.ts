import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { USER_ROLES } from "@/lib/server-validation"

export type UserRole = (typeof USER_ROLES)[number]

export async function requireSession(
    allowedRoles?: readonly UserRole[],
    options: { allowPasswordChange?: boolean } = {}
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.status === "Disable") {
        throw new Error("Unauthorized")
    }

    if (session.user.mustChangePassword && !options.allowPasswordChange) {
        throw new Error("Password change required")
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
        throw new Error("Unauthorized")
    }

    return session
}

export async function requireProjectAccess(userId: string, role: string, projectId: string) {
    if (role === "ADMIN" || role === "GM") return

    const assignment = await prisma.projectAssignment.findFirst({
        where: { userId, projectId },
        select: { id: true },
    })

    if (!assignment) {
        throw new Error("You are not assigned to this project")
    }
}
