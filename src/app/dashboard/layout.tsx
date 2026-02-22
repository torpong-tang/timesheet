import { MainNav, UserNav } from "@/components/dashboard/main-nav"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/login")
    }

    return (
        <div className="flex-col md:flex min-h-screen">
            <div className="border-b border-stone-700 bg-stone-900/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex h-16 items-center px-4 container mx-auto">
                    <Link href="/dashboard" className="mr-8 flex items-center gap-2 focus:outline-none caret-transparent" tabIndex={-1}>
                        <img src="/timesheet/app-logo.svg" alt="Logo" className="w-10 h-10 object-contain drop-shadow transition-transform hover:scale-110" />
                        <span className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 select-none caret-transparent">
                            Timesheet
                        </span>
                    </Link>
                    <MainNav className="mx-6" />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-8 pt-6 w-full">
                {children}
            </div>
        </div>
    )
}
