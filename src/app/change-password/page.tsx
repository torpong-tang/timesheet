import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { KeyRound } from "lucide-react"
import { RequiredPasswordChangeForm } from "@/components/auth/required-password-change-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authOptions } from "@/lib/auth"

export default async function ChangePasswordPage() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.status !== "Enable") redirect("/login")
    if (!session.user.mustChangePassword) redirect("/dashboard")

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-amber-500" />
                        Password Update Required
                    </CardTitle>
                    <CardDescription>
                        Your account predates the current password policy or was reset by an administrator.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequiredPasswordChangeForm />
                </CardContent>
            </Card>
        </main>
    )
}
