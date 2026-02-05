"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { updateProfileImage, changePassword } from "@/app/profile-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload, User, KeyRound, Eye, EyeOff } from "lucide-react"

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [uploading, setUploading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file")
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

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
        }
    }

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setPasswordLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await changePassword(null, formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success(result.success);
                (e.target as HTMLFormElement).reset()
            }
        } catch (err) {
            toast.error("An error occurred")
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>

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
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                    </div>
                    {uploading && <p className="text-sm text-muted-foreground animate-pulse">Uploading...</p>}
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
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
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
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={passwordLoading} className="w-full">
                            {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
