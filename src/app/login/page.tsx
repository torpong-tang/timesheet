"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Home, Loader2, LogIn, LockKeyhole, UserRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { IconTooltip } from "@/components/ui/icon-tooltip"

import { useLanguage } from "@/components/providers/language-provider"

export default function LoginPage() {
    const router = useRouter()
    const { t } = useLanguage()
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
                toast.error(t('login.fail'), {
                    description: t('login.fail_desc')
                })
            } else {
                toast.success(t('login.welcome'))
                router.push("/dashboard")
                router.refresh()
            }
        } catch {
            toast.error(t('common.loading') + " failed") // Using simple fallback or can add key
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <IconTooltip label="Back to 2Startup Cloud" side="left">
                <a
                    href="https://2startup.cloud/"
                    aria-label="Return to 2Startup Cloud"
                    className="fixed right-5 top-5 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-400/50 bg-amber-500 text-stone-950 shadow-lg shadow-black/30 transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-300/40"
                >
                    <Home className="h-5 w-5" aria-hidden="true" />
                </a>
            </IconTooltip>
            <Card className="relative w-full max-w-md overflow-hidden rounded-lg border-stone-700 bg-stone-900/95 shadow-2xl shadow-black/40">

                <CardHeader className="space-y-4 text-center relative z-10">
                    <div className="mx-auto mb-3 h-28 w-28 transition-transform duration-300 hover:scale-105">
                        <img
                            src="/timesheet/app-logo.svg"
                            alt="Timesheet Logo"
                            className="w-full h-full object-contain drop-shadow-2xl"
                        />
                    </div>
                    <Badge variant="outline" className="mx-auto border-amber-500/30 bg-amber-500/10 text-amber-400">
                        Secure workspace
                    </Badge>
                    <CardTitle className="pb-1 text-4xl font-black tracking-tight text-stone-100">
                        TIME<span className="text-amber-500 italic">SHEET</span>
                    </CardTitle>
                    <CardDescription className="font-medium text-stone-400">
                        {t('login.subtitle')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin} className="relative z-10">
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="userlogin" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('login.user')}</Label>
                            <div className="relative">
                                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                                <Input
                                    id="userlogin"
                                    placeholder="Torpong.T"
                                    value={userlogin}
                                    onChange={(e) => setUserlogin(e.target.value)}
                                    required
                                    className="h-12 rounded-lg border-stone-600 bg-stone-800 pl-10 font-medium text-stone-100 placeholder:text-stone-500 focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" title="password" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('login.pass')}</Label>
                            <div className="relative">
                                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 rounded-lg border-stone-600 bg-stone-800 pl-10 font-medium text-stone-100 placeholder:text-stone-500 focus:border-primary"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button className="h-12 w-full rounded-lg bg-amber-500 text-base font-bold text-stone-950 shadow-lg shadow-amber-950/30 transition-all hover:bg-amber-400 active:scale-[0.99]" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                            {loading ? t('common.loading') : t('login.btn')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
