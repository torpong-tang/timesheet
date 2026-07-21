"use client"

import Image from "next/image"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Home, Loader2, LogIn, LockKeyhole, UserRound } from "lucide-react"
import { toast } from "sonner"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IconTooltip } from "@/components/ui/icon-tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [userlogin, setUserlogin] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

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
                toast.error(t("login.fail"), {
                    description: t("login.fail_desc"),
                })
            } else {
                toast.success(t("login.welcome"))
                router.push("/dashboard")
                router.refresh()
            }
        } catch {
            toast.error(`${t("common.loading")} failed`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100svh-57px)] w-full p-3 sm:p-5 lg:p-7">
            <div className="mx-auto grid min-h-[calc(100svh-113px)] w-full max-w-[1480px] overflow-hidden rounded-lg border border-stone-700/70 bg-stone-950/80 shadow-2xl shadow-black/50 lg:grid-cols-[minmax(0,1.45fr)_minmax(390px,0.7fr)]">
                <section className="relative min-h-[300px] overflow-hidden border-b border-stone-700/70 lg:min-h-0 lg:border-b-0 lg:border-r">
                    <Image
                        src="/timesheet/timesheet-work-schedule.png"
                        alt="Weekly work schedule and project time dashboard"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                        <div className="max-w-xl border-l-4 border-amber-400 pl-5">
                            <p className="mb-2 text-sm font-semibold text-amber-300">Work, clearly scheduled.</p>
                            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                                Make every hour count.
                            </h1>
                            <p className="mt-3 max-w-lg text-sm leading-6 text-stone-300 sm:text-base">
                                A focused workspace for time, projects, and daily progress.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="relative flex items-center justify-center px-5 py-12 sm:px-10 lg:px-12">
                    <IconTooltip label="Back to 2Startup Cloud" side="left">
                        <a
                            href="https://2startup.cloud/"
                            aria-label="Return to 2Startup Cloud"
                            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-amber-300/60 bg-amber-500 text-stone-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-300/40"
                        >
                            <Home className="h-5 w-5" aria-hidden="true" />
                        </a>
                    </IconTooltip>

                    <Card className="w-full max-w-[420px] border-0 bg-transparent shadow-none">
                        <CardHeader className="space-y-4 px-0 text-left">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 shrink-0">
                                    <Image
                                        src="/timesheet/app-logo.svg"
                                        alt="Timesheet logo"
                                        width={64}
                                        height={64}
                                        className="h-full w-full object-contain drop-shadow-xl"
                                    />
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-semibold text-amber-400">SECURE WORKSPACE</p>
                                    <CardTitle className="text-4xl font-black text-stone-100">
                                        TIME<span className="italic text-amber-500">SHEET</span>
                                    </CardTitle>
                                </div>
                            </div>
                            <CardDescription className="text-base font-medium leading-6 text-stone-400">
                                {t("login.subtitle")}
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleLogin}>
                            <CardContent className="grid gap-5 px-0">
                                <div className="grid gap-2">
                                    <Label htmlFor="userlogin" className="text-xs font-bold uppercase text-stone-400">
                                        {t("login.user")}
                                    </Label>
                                    <div className="relative">
                                        <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" aria-hidden="true" />
                                        <Input
                                            id="userlogin"
                                            autoComplete="username"
                                            placeholder="Torpong.T"
                                            value={userlogin}
                                            onChange={(e) => setUserlogin(e.target.value)}
                                            required
                                            className="h-14 rounded-lg border-stone-600 bg-stone-900 pl-12 text-base font-medium text-stone-100 placeholder:text-stone-600 focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-xs font-bold uppercase text-stone-400">
                                        {t("login.pass")}
                                    </Label>
                                    <div className="relative">
                                        <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" aria-hidden="true" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-14 rounded-lg border-stone-600 bg-stone-900 pl-12 pr-14 text-base font-medium text-stone-100 placeholder:text-stone-600 focus:border-amber-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            aria-pressed={showPassword}
                                            title={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-800 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                        >
                                            {showPassword
                                                ? <EyeOff className="h-5 w-5" aria-hidden="true" />
                                                : <Eye className="h-5 w-5" aria-hidden="true" />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="px-0 pt-7">
                                <Button
                                    className="h-14 w-full rounded-lg bg-amber-500 text-base font-bold text-stone-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-400 active:scale-[0.99]"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading
                                        ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                                        : <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />}
                                    {loading ? t("common.loading") : t("login.btn")}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </section>
            </div>
        </div>
    )
}
