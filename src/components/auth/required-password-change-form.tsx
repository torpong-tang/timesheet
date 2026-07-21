"use client"

import { useRef, useState } from "react"
import { signOut } from "next-auth/react"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { changePassword } from "@/app/profile-actions"
import { ActionConfirmDialog } from "@/components/ui/action-confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RequiredPasswordChangeForm() {
    const formRef = useRef<HTMLFormElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function submitPasswordChange() {
        if (!formRef.current) return
        setLoading(true)
        try {
            const result = await changePassword(null, new FormData(formRef.current))
            if (result?.error) {
                toast.error(result.error)
                return
            }
            toast.success(result?.success ?? "Password updated")
            await signOut({ callbackUrl: "/timesheet/login" })
        } catch {
            toast.error("Unable to update the password")
        } finally {
            setLoading(false)
            setConfirmOpen(false)
        }
    }

    return (
        <>
            <form
                ref={formRef}
                className="space-y-5"
                onSubmit={(event) => {
                    event.preventDefault()
                    setConfirmOpen(true)
                }}
            >
                {[
                    ["currentPassword", "Current Password", "current-password"],
                    ["newPassword", "New Password", "new-password"],
                    ["confirmPassword", "Confirm New Password", "new-password"],
                ].map(([name, label, autoComplete], index) => (
                    <div key={name} className="space-y-2">
                        <Label htmlFor={name}>{label}</Label>
                        <div className="relative">
                            <Input
                                id={name}
                                name={name}
                                type={showPassword ? "text" : "password"}
                                minLength={index === 0 ? undefined : 12}
                                maxLength={128}
                                autoComplete={autoComplete}
                                required
                                className="pr-11"
                            />
                            {index === 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}

                <p className="text-xs text-muted-foreground">
                    Use at least 12 characters with uppercase, lowercase, number, and symbol.
                </p>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Set Strong Password
                </Button>
            </form>

            <ActionConfirmDialog
                open={confirmOpen}
                action="update"
                title="Set your strong password?"
                description="All existing sessions will be revoked. Sign in again with the new password after this change."
                confirmLabel="Update password"
                loading={loading}
                onConfirm={submitPasswordChange}
                onOpenChange={(open) => !loading && setConfirmOpen(open)}
            />
        </>
    )
}
