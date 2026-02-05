"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Calendar } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [userlogin, setUserlogin] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                userlogin,
                password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Login failed", {
                    description: "Invalid User Login or Password"
                })
            } else {
                toast.success("Welcome back!")
                router.push("/dashboard")
                router.refresh()
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-50 border border-slate-200 shadow-2xl relative overflow-hidden rounded-3xl">
                {/* Decorative blob */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-3xl rounded-full" />

                <CardHeader className="space-y-2 text-center relative z-10">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 mb-2 rotate-3 hover:rotate-0 transition-transform">
                        <Calendar className="text-white h-8 w-8" />
                    </div>
                    <CardTitle className="text-4xl font-black tracking-tighter text-slate-900">
                        TIME<span className="text-primary italic">SHEET</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                        Access your workspace to track productivity
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin} className="relative z-10">
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="userlogin" className="font-bold text-slate-700 ml-1 uppercase text-[10px] tracking-widest">User Login</Label>
                            <Input
                                id="userlogin"
                                placeholder="Torpong.T"
                                value={userlogin}
                                onChange={(e) => setUserlogin(e.target.value)}
                                required
                                className="h-12 bg-slate-50/60 border-white/40 focus:bg-slate-50 focus:border-primary transition-all rounded-xl shadow-inner font-medium"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" title="password" className="font-bold text-slate-700 ml-1 uppercase text-[10px] tracking-widest">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 bg-slate-50/60 border-white/40 focus:bg-slate-50 focus:border-primary transition-all rounded-xl shadow-inner font-medium"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button className="w-full h-12 font-bold text-lg bg-primary hover:bg-orange-600 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] rounded-xl text-white" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign In"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

