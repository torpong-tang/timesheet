"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, FolderKanban, Calendar, ArrowLeft, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navItems = [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/projects", label: "Projects", icon: FolderKanban },
        { href: "/admin/holidays", label: "Holidays", icon: Calendar },
        { href: "/admin/assignments", label: "Assignments", icon: Users },
        { href: "/admin/audit", label: "Audit Logs", icon: ShieldAlert },
    ]

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-50 border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col shadow-xl">
                <div className="p-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                            <Calendar className="text-white h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-600">
                            Admin Portal
                        </h2>
                    </div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Management System</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "nav-link",
                                    isActive ? "nav-link-active" : "nav-link-inactive"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary")} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 mt-auto">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-primary hover:bg-slate-50/50 group">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Dashboard
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}

