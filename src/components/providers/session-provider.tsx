"use client"

import { SessionProvider } from "next-auth/react"
import { LanguageProvider } from "@/components/providers/language-provider"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider basePath="/timesheet/api/auth">
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </SessionProvider>
    )
}
