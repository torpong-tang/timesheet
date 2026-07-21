import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface ProcessSpinnerProps {
    label?: string
    className?: string
    iconClassName?: string
}

export function ProcessSpinner({
    label = "Loading...",
    className,
    iconClassName,
}: ProcessSpinnerProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn("flex items-center justify-center gap-2", className)}
        >
            <Loader2 className={cn("h-5 w-5 animate-spin text-primary", iconClassName)} />
            <span>{label}</span>
        </div>
    )
}
