"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Calendar, FolderKanban, ShieldAlert, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/holidays", label: "Holidays", icon: Calendar },
    { href: "/admin/assignments", label: "Assignments", icon: Users },
    { href: "/admin/audit", label: "Audit Logs", icon: ShieldAlert },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="flex min-h-screen">
            <aside className="fixed z-10 hidden h-full w-64 flex-col border-r border-slate-200 bg-slate-50 shadow-xl md:flex">
                <div className="p-8">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="select-none bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-xl font-bold text-transparent">
                            Admin Portal
                        </h2>
                    </div>
                    <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Management System</p>
                </div>

                <nav className="flex-1 space-y-1 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn("nav-link", isActive ? "nav-link-active" : "nav-link-inactive")}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary")} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="mt-auto p-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="group w-full justify-start text-slate-600 hover:bg-slate-50/50 hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Dashboard
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="min-h-screen flex-1 p-8 md:ml-64">
                <div className="mx-auto max-w-7xl space-y-6">{children}</div>
            </main>
        </div>
    )
}
