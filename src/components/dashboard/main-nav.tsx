"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useLanguage } from "@/components/providers/language-provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LayoutDashboard, Calendar as CalendarIcon, LogOut, Settings, User } from "lucide-react"

export function MainNav({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname()
    const { data: session } = useSession()

    const { t } = useLanguage()

    const routes = [
        {
            href: "/dashboard",
            label: t('nav.dashboard'),
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            href: "/dashboard/calendar",
            label: t('nav.calendar'),
            icon: CalendarIcon,
            active: pathname === "/dashboard/calendar",
        },
        {
            href: "/dashboard/reports",
            label: t('nav.reports'),
            icon: LayoutDashboard,
            active: pathname === "/dashboard/reports",
        },
    ]

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                        route.active ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                </Link>
            ))}
            {session?.user.role === 'ADMIN' && (
                <Link
                    href="/admin"
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                        pathname.startsWith("/admin") ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    {t('nav.admin')}
                </Link>
            )}
        </nav>
    )
}

export function UserNav() {
    const { data: session } = useSession()
    const { t } = useLanguage()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-50/20">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-panel" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session?.user?.email}
                        </p>
                        <p className="text-xs font-semibold text-primary mt-1">
                            Role: {session?.user?.role}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        {t('nav.profile')}
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-600 cursor-pointer" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
