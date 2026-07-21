"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    return (
        <div className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 p-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage("en")}
                title="Switch to English"
                aria-label="Switch to English"
                className={`h-7 rounded-md px-2 text-xs font-bold ${language === "en" ? "bg-amber-500 text-stone-950 shadow-sm" : "text-stone-400 hover:bg-stone-700 hover:text-stone-100"}`}
            >
                EN
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage("th")}
                title="เปลี่ยนเป็นภาษาไทย"
                aria-label="เปลี่ยนเป็นภาษาไทย"
                className={`h-7 rounded-md px-2 text-xs font-bold ${language === "th" ? "bg-amber-500 text-stone-950 shadow-sm" : "text-stone-400 hover:bg-stone-700 hover:text-stone-100"}`}
            >
                TH
            </Button>
        </div>
    )
}
