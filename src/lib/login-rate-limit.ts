type Attempt = { count: number; resetAt: number }

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const MAX_TRACKED_KEYS = 10_000

const globalForRateLimit = globalThis as typeof globalThis & {
    timesheetLoginAttempts?: Map<string, Attempt>
}

const attempts = globalForRateLimit.timesheetLoginAttempts ?? new Map<string, Attempt>()
globalForRateLimit.timesheetLoginAttempts = attempts

export function getLoginKey(userlogin: string, forwardedFor?: string) {
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown"
    return `${ip}:${userlogin.trim().toLocaleLowerCase()}`
}

export function isLoginBlocked(key: string, now = Date.now()) {
    const attempt = attempts.get(key)
    if (!attempt) return false
    if (attempt.resetAt <= now) {
        attempts.delete(key)
        return false
    }
    return attempt.count >= MAX_ATTEMPTS
}

export function recordLoginFailure(key: string, now = Date.now()) {
    if (attempts.size >= MAX_TRACKED_KEYS) {
        for (const [candidateKey, attempt] of attempts) {
            if (attempt.resetAt <= now) attempts.delete(candidateKey)
        }
        if (attempts.size >= MAX_TRACKED_KEYS) {
            const oldestKey = attempts.keys().next().value
            if (oldestKey) attempts.delete(oldestKey)
        }
    }
    const current = attempts.get(key)
    if (!current || current.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return
    }
    current.count += 1
}

export function clearLoginFailures(key: string) {
    attempts.delete(key)
}
