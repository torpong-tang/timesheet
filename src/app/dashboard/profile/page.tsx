"use client"

import { useRef, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { updateProfileImage, changePassword } from "@/app/profile-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload, User, KeyRound, Eye, EyeOff } from "lucide-react"
import { ActionConfirmDialog } from "@/components/ui/action-confirm-dialog"
import { ProcessSpinner } from "@/components/ui/process-spinner"

type PendingProfileAction = "avatar" | "password" | null

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [uploading, setUploading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingProfileAction>(null)
    const [pendingAvatar, setPendingAvatar] = useState<File | null>(null)
    const passwordFormRef = useRef<HTMLFormElement>(null)
    const avatarInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file")
            return
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Only JPEG, PNG and WebP images are allowed")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Profile image must not exceed 2 MB")
            return
        }

        setPendingAvatar(file)
        setPendingAction("avatar")
    }

    const uploadPendingImage = async () => {
        if (!pendingAvatar) return
        setUploading(true)
        const formData = new FormData()
        formData.append("file", pendingAvatar)

        try {
            const result = await updateProfileImage(formData)
            if (result.success) {
                toast.success("Profile picture updated")
                // Update session to reflect new image
                await update({ image: result.imagePath })
                // Force reload to see change if needed, or rely on session update
                window.location.reload()
            }
        } catch (err) {
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
            setPendingAction(null)
            setPendingAvatar(null)
            if (avatarInputRef.current) avatarInputRef.current.value = ""
        }
    }

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setPendingAction("password")
    }

    const updatePendingPassword = async () => {
        if (!passwordFormRef.current) return
        setPasswordLoading(true)
        const formData = new FormData(passwordFormRef.current)

        try {
            const result = await changePassword(null, formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success(result.success);
                passwordFormRef.current?.reset()
                await signOut({ callbackUrl: "/timesheet/login" })
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setPasswordLoading(false)
            setPendingAction(null)
        }
    }

    const handleConfirmedAction = async () => {
        if (pendingAction === "avatar") await uploadPendingImage()
        if (pendingAction === "password") await updatePendingPassword()
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>

            {session?.user?.mustChangePassword && (
                <div role="alert" className="rounded-lg border border-amber-400/60 bg-amber-50 p-4 text-sm font-medium text-amber-950">
                    You must set a strong password before continuing. All existing sessions will be signed out after the change.
                </div>
            )}

            {/* Profile Picture Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Picture
                    </CardTitle>
                    <CardDescription>Click the avatar to upload a new photo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <Avatar className="h-32 w-32 border-4 border-slate-100 dark:border-slate-200 shadow-lg">
                            <AvatarImage src={session?.user?.image || ""} className="object-cover" />
                            <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                                {session?.user?.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>

                        {/* Overlay */}
                        <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Upload className="h-8 w-8 text-white" />
                        </label>
                        <input
                            ref={avatarInputRef}
                            id="avatar-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                    </div>
                    {uploading && <ProcessSpinner label="Uploading profile picture..." className="text-sm text-muted-foreground" />}
                    <div className="text-center">
                        <p className="font-medium">{session?.user?.name}</p>
                        <p className="text-sm text-muted-foreground">{session?.user?.role}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>Ensure your account is using a strong password.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={passwordFormRef} onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Hide passwords" : "Show passwords"}
                                    aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    minLength={12}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    minLength={12}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={passwordLoading} className="w-full">
                            {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <ActionConfirmDialog
                open={pendingAction !== null}
                action="update"
                title={pendingAction === "avatar" ? "Update profile picture?" : "Update password?"}
                description={pendingAction === "avatar"
                    ? `Confirm using ${pendingAvatar?.name || "the selected image"} as your profile picture.`
                    : "Your account password will be changed and the new password will be required for future sign-ins."}
                confirmLabel={pendingAction === "avatar" ? "Update picture" : "Update password"}
                loading={uploading || passwordLoading}
                onConfirm={handleConfirmedAction}
                onOpenChange={(open) => {
                    if (!open && !uploading && !passwordLoading) {
                        setPendingAction(null)
                        setPendingAvatar(null)
                        if (avatarInputRef.current) avatarInputRef.current.value = ""
                    }
                }}
            />
        </div>
    )
}
