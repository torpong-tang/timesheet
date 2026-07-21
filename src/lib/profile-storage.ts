import path from "node:path"

export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024

export const PROFILE_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
} as const

export function getProfileStorageDir() {
    const configuredPath = process.env.PROFILE_IMAGE_DIR
    if (!configuredPath && process.env.NODE_ENV === "production") {
        throw new Error("PROFILE_IMAGE_DIR is required in production")
    }
    return path.resolve(
        /* turbopackIgnore: true */ configuredPath || "/tmp/timesheet-profile-images"
    )
}

export function isValidProfileFilename(filename: string) {
    return /^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(filename)
}

export function isValidImageSignature(buffer: Buffer, mimeType: keyof typeof PROFILE_IMAGE_TYPES) {
    if (mimeType === "image/jpeg") {
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    }
    if (mimeType === "image/png") {
        return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    }
    return buffer.length >= 12
        && buffer.subarray(0, 4).toString("ascii") === "RIFF"
        && buffer.subarray(8, 12).toString("ascii") === "WEBP"
}

export function getMimeTypeFromFilename(filename: string) {
    if (filename.endsWith(".png")) return "image/png"
    if (filename.endsWith(".webp")) return "image/webp"
    return "image/jpeg"
}
