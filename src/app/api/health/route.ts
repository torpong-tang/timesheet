import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { access, statfs } from "node:fs/promises"
import { constants } from "node:fs"
import { getProfileStorageDir } from "@/lib/profile-storage"

export const dynamic = "force-dynamic"

export async function GET() {
    let database = "ok"
    let profileStorage = "ok"
    let diskFreeBytes: number | null = null

    try {
        await prisma.$queryRaw`SELECT 1`
    } catch {
        database = "unavailable"
    }

    try {
        const storageDir = getProfileStorageDir()
        await access(storageDir, constants.R_OK | constants.W_OK)
        const filesystem = await statfs(storageDir)
        diskFreeBytes = filesystem.bavail * filesystem.bsize
    } catch {
        profileStorage = "unavailable"
    }

    const healthy = database === "ok" && profileStorage === "ok"
    return NextResponse.json(
        {
            status: healthy ? "ok" : "error",
            database,
            profileStorage,
            diskFreeBytes,
            service: "timesheet",
            timestamp: new Date().toISOString(),
        },
        { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    )
}
