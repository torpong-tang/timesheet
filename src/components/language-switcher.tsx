"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage("en")}
                className={`h-7 px-2 text-xs font-bold rounded-md ${language === "en" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
                EN
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage("th")}
                className={`h-7 px-2 text-xs font-bold rounded-md ${language === "th" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
                TH
            </Button>
        </div>
    )
}
