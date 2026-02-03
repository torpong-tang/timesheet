"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { writeFile, unlink } from "fs/promises"
import path from "path"
import { logAudit } from "@/lib/audit"

export async function updateProfileImage(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error("Unauthorized")

    const file = formData.get("file") as File
    if (!file) throw new Error("No file uploaded")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure directory exists (assuming public/imgs exists based on task)
    // Generate unique filename
    const filename = `profile_${session.user.id}_${Date.now()}.jpg`
    const publicPath = `/imgs/${filename}`
    const diskPath = path.join(process.cwd(), "public", "imgs", filename)

    try {
        await writeFile(diskPath, buffer)

        // Update user record
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: publicPath }
        })

        await logAudit("UPDATE_PROFILE_PIC", session.user.id, "Updated profile picture")

        return { success: true, imagePath: publicPath }
    } catch (error) {
        console.error("Upload failed:", error)
        throw new Error("Failed to upload image")
    }
}

export async function changePassword(currentState: any, formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { error: "Unauthorized" }

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required" }
    }

    if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match" }
    }

    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) return { error: "User not found" }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return { error: "Incorrect current password" }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword }
    })

    await logAudit("UPDATE_PASSWORD", session.user.id, "Changed password")

    return { success: "Password updated successfully" }
}
