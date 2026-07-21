import { MainNav, MobileNav, UserNav } from "@/components/dashboard/main-nav"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Separator } from "@/components/ui/separator"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.status !== "Enable") {
        redirect("/login")
    }

    if (session.user.mustChangePassword) {
        redirect("/change-password")
    }

    return (
        <div className="flex-col md:flex min-h-screen">
            <div className="border-b border-stone-700 bg-stone-900/90 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto flex h-16 items-center gap-3 px-4">
                    <MobileNav />
                    <Link href="/dashboard" className="mr-2 flex items-center gap-2 focus:outline-none caret-transparent lg:mr-8" tabIndex={-1}>
                        <img src="/timesheet/app-logo.svg" alt="Logo" className="w-10 h-10 object-contain drop-shadow transition-transform hover:scale-110" />
                        <span className="hidden text-2xl font-extrabold tracking-tight text-amber-500 select-none caret-transparent sm:inline">
                            Timesheet
                        </span>
                    </Link>
                    <MainNav className="mx-2 hidden lg:flex" />
                    <div className="ml-auto flex items-center gap-3">
                        <LanguageSwitcher />
                        <Separator orientation="vertical" className="hidden h-7 bg-stone-700 sm:block" />
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="w-full flex-1 space-y-4 p-4 pt-6 md:p-8 md:pt-6">
                {children}
            </div>
        </div>
    )
}
