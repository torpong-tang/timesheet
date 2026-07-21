"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { writeFile, unlink, mkdir } from "fs/promises"
import path from "path"
import { logAudit } from "@/lib/audit"
import { requireSession } from "@/lib/authorization"
import { passwordSchema } from "@/lib/server-validation"
import {
    getProfileStorageDir,
    isValidImageSignature,
    MAX_PROFILE_IMAGE_BYTES,
    PROFILE_IMAGE_TYPES,
} from "@/lib/profile-storage"

export async function updateProfileImage(formData: FormData) {
    const session = await requireSession()

    const file = formData.get("file") as File
    if (!file) throw new Error("No file uploaded")

    if (file.size <= 0 || file.size > MAX_PROFILE_IMAGE_BYTES) {
        throw new Error("Profile image must not exceed 2 MB")
    }

    const extension = PROFILE_IMAGE_TYPES[file.type as keyof typeof PROFILE_IMAGE_TYPES]
    if (!extension) throw new Error("Only JPEG, PNG and WebP images are allowed")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    if (!isValidImageSignature(buffer, file.type as keyof typeof PROFILE_IMAGE_TYPES)) {
        throw new Error("The uploaded file is not a valid image")
    }

    const filename = `profile_${session.user.id}_${randomUUID()}${extension}`
    const publicPath = `/timesheet/api/profile-image/${filename}`
    const imgDir = getProfileStorageDir()
    const diskPath = path.join(/* turbopackIgnore: true */ imgDir, filename)

    try {
        // Ensure directory exists
        await mkdir(imgDir, { recursive: true })
        await writeFile(diskPath, buffer, { mode: 0o600 })

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true },
        })

        // Update user record
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: publicPath }
        })

        await logAudit("UPDATE_PROFILE_PIC", session.user.id, "Updated profile picture")

        const previousFilename = currentUser?.image?.match(/\/api\/profile-image\/([^/]+)$/)?.[1]
        if (previousFilename) {
            await unlink(
                path.join(/* turbopackIgnore: true */ imgDir, previousFilename)
            ).catch(() => undefined)
        }

        return { success: true, imagePath: publicPath }
    } catch (error) {
        console.error("Upload failed:", error)
        throw new Error("Failed to upload image")
    }
}

export async function changePassword(currentState: any, formData: FormData) {
    const session = await requireSession(undefined, { allowPasswordChange: true }).catch(() => null)
    if (!session) return { error: "Unauthorized" }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required" }
    }

    if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match" }
    }

    const passwordResult = passwordSchema.safeParse(newPassword)
    if (!passwordResult.success) {
        return { error: passwordResult.error.issues[0]?.message || "Password is not strong enough" }
    }

    if (currentPassword === newPassword) {
        return { error: "New password must be different from the current password" }
    }

    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return { error: "User not found" }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return { error: "Incorrect current password" }

    // Update password
    const hashedPassword = await bcrypt.hash(passwordResult.data, 12)
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            password: hashedPassword,
            mustChangePassword: false,
            sessionVersion: { increment: 1 },
        }
    })

    await logAudit("UPDATE_PASSWORD", session.user.id, "Changed password")

    return { success: "Password updated successfully. Please sign in again." }
}
