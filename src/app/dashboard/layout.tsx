import { MainNav, UserNav } from "@/components/dashboard/main-nav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex-col md:flex min-h-screen">
            <div className="border-b bg-white/40 backdrop-blur-md sticky top-0 z-50">
                <div className="flex h-16 items-center px-4 container mx-auto">
                    <div className="mr-8 font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">
                        Timesheet
                    </div>
                    <MainNav className="mx-6" />
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-8 pt-6 container mx-auto">
                {children}
            </div>
        </div>
    )
}
