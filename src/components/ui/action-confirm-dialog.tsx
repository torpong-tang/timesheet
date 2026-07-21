"use client"

import { AlertTriangle, Loader2, Plus, Save, Trash2, X } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ActionKind = "create" | "update" | "delete"

interface ActionConfirmDialogProps {
    open: boolean
    action: ActionKind
    title: string
    description: string
    confirmLabel?: string
    loading?: boolean
    onConfirm: () => void | Promise<void>
    onOpenChange: (open: boolean) => void
}

const actionIcon = {
    create: Plus,
    update: Save,
    delete: Trash2,
}

export function ActionConfirmDialog({
    open,
    action,
    title,
    description,
    confirmLabel = "Confirm",
    loading = false,
    onConfirm,
    onOpenChange,
}: ActionConfirmDialogProps) {
    const ActionIcon = actionIcon[action]
    const destructive = action === "delete"

    return (
        <AlertDialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                        {destructive ? <AlertTriangle className="h-6 w-6" /> : <ActionIcon className="h-6 w-6" />}
                    </div>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={loading}
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={loading}
                        onClick={onConfirm}
                        className={destructive
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ActionIcon className="h-4 w-4" />
                        )}
                        {loading ? "Processing..." : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
