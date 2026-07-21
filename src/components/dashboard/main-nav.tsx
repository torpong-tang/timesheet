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
import { LayoutDashboard, Calendar as CalendarIcon, LogOut, Settings, User, Menu, BarChart3 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
            active: pathname === "/timesheet/dashboard" || pathname === "/timesheet/dashboard/",
        },
        {
            href: "/dashboard/calendar",
            label: t('nav.calendar'),
            icon: CalendarIcon,
            active: pathname.startsWith("/timesheet/dashboard/calendar"),
        },
        {
            href: "/dashboard/reports",
            label: t('nav.reports'),
            icon: BarChart3,
            active: pathname.startsWith("/timesheet/dashboard/reports"),
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
                        pathname.startsWith("/timesheet/admin") ? "text-primary font-bold" : "text-muted-foreground"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    {t('nav.admin')}
                </Link>
            )}
        </nav>
    )
}

export function MobileNav() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const { t } = useLanguage()
    const routes = [
        {
            href: "/dashboard",
            label: t('nav.dashboard'),
            icon: LayoutDashboard,
            active: pathname === "/timesheet/dashboard" || pathname === "/timesheet/dashboard/",
        },
        {
            href: "/dashboard/calendar",
            label: t('nav.calendar'),
            icon: CalendarIcon,
            active: pathname.startsWith("/timesheet/dashboard/calendar"),
        },
        {
            href: "/dashboard/reports",
            label: t('nav.reports'),
            icon: BarChart3,
            active: pathname.startsWith("/timesheet/dashboard/reports"),
        },
    ]

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" aria-label="Open navigation" className="border-stone-700 bg-stone-800 text-stone-100 lg:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Navigation</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-56 border-stone-700 bg-stone-900 text-stone-100">
                <DropdownMenuLabel>{t('nav.dashboard')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {routes.map((route) => (
                    <DropdownMenuItem key={route.href} asChild>
                        <Link href={route.href} className={cn("flex cursor-pointer items-center gap-2", route.active && "text-primary")}>
                            <route.icon className="h-4 w-4" />
                            {route.label}
                        </Link>
                    </DropdownMenuItem>
                ))}
                {session?.user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/admin"
                            className={cn(
                                "flex cursor-pointer items-center gap-2",
                                pathname.startsWith("/timesheet/admin") && "text-primary"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            {t('nav.admin')}
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function UserNav() {
    const { data: session } = useSession()
    const { t } = useLanguage()

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" aria-label="Open user menu" className="relative h-10 w-10 rounded-full hover:bg-stone-800">
                            <Avatar className="h-10 w-10 border-2 border-stone-600 shadow-sm">
                                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Account</TooltipContent>
            </Tooltip>
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
                <DropdownMenuItem className="text-red-500 focus:text-red-600 cursor-pointer" onClick={() => signOut({ callbackUrl: "/timesheet/login" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
