import { readFile } from "node:fs/promises"
import path from "node:path"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import {
    getMimeTypeFromFilename,
    getProfileStorageDir,
    isValidProfileFilename,
} from "@/lib/profile-storage"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.status !== "Enable") {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { filename } = await params
    if (!isValidProfileFilename(filename)) {
        return new NextResponse("Not found", { status: 404 })
    }

    try {
        const file = await readFile(
            path.join(/* turbopackIgnore: true */ getProfileStorageDir(), filename)
        )
        return new NextResponse(file, {
            headers: {
                "Cache-Control": "private, max-age=3600",
                "Content-Type": getMimeTypeFromFilename(filename),
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch {
        return new NextResponse("Not found", { status: 404 })
    }
}
