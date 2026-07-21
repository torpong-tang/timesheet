"use client"

import { useState, useEffect } from "react"
import { getHolidays, upsertHoliday, deleteHoliday } from "@/app/admin-actions"
import { Holiday } from "@prisma/client"
import { Pagination } from "@/components/Pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, Search, Save, X } from "lucide-react"
import { format } from "date-fns"
import { HighlightText } from "@/components/data-table/highlight-text"
import { SortIndicator } from "@/components/data-table/sort-indicator"
import { useClientTable } from "@/hooks/use-client-table"
import { ActionConfirmDialog } from "@/components/ui/action-confirm-dialog"
import { IconTooltip } from "@/components/ui/icon-tooltip"

const matchesHolidaySearch = (holiday: Holiday, query: string) =>
    holiday.name.toLocaleLowerCase().includes(query) ||
    holiday.year.toString().includes(query)

const getHolidaySortValue = (holiday: Holiday, key: keyof Holiday) => holiday[key]

type PendingAction =
    | { type: "save" }
    | { type: "delete"; id: string; label: string }

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        date: "",
        year: new Date().getFullYear()
    })

    const loadHolidays = async () => {
        try {
            const data = await getHolidays()
            setHolidays(data)
        } catch (err) {
            toast.error("Failed to load holidays")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHolidays()
    }, [])

    const {
        page,
        pageSize,
        paginatedItems: paginatedHolidays,
        processedItems: processedHolidays,
        searchQuery,
        setPage,
        setPageSize,
        setSearchQuery,
        sortConfig,
        toggleSort: handleSort,
        totalPages,
    } = useClientTable<Holiday, keyof Holiday>({
        items: holidays,
        matchesSearch: matchesHolidaySearch,
        getSortValue: getHolidaySortValue,
    })


    // --- Actions ---

    const handleEdit = (holiday: Holiday) => {
        setEditingId(holiday.id)
        setFormData({
            name: holiday.name,
            date: format(new Date(holiday.date), 'yyyy-MM-dd'),
            year: holiday.year
        })
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setEditingId(null)
        setFormData({
            name: "",
            date: "",
            year: new Date().getFullYear()
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.date || !formData.name) {
            toast.error("Name and Date are required")
            return
        }
        setSaving(true)
        try {
            await upsertHoliday({
                id: editingId || undefined,
                name: formData.name,
                date: new Date(formData.date),
                year: Number(formData.year)
            })
            toast.success(editingId ? "Holiday updated" : "Holiday created")
            setIsDialogOpen(false)
            await loadHolidays()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        setSaving(true)
        try {
            await deleteHoliday(id)
            toast.success("Holiday deleted")
            await loadHolidays()
        } catch (err) {
            toast.error("Failed to delete holiday")
        } finally {
            setSaving(false)
            setPendingAction(null)
        }
    }

    const requestSave = () => {
        if (!formData.date || !formData.name.trim()) {
            toast.error("Name and Date are required")
            return
        }
        setPendingAction({ type: "save" })
    }

    const handleConfirmedAction = async () => {
        if (!pendingAction) return
        if (pendingAction.type === "save") {
            await handleSave()
            setPendingAction(null)
            return
        }
        await handleDelete(pendingAction.id)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Public <span className="text-primary italic">Holidays</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Define non-working days and annual company holidays</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                </Button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                {/* Controls */}
                <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search holidays..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9 h-11 bg-slate-100 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest hidden md:inline">
                            Total {processedHolidays.length} Holidays
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                    Holiday Date <SortIndicator column="date" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    Description <SortIndicator column="name" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('year')}>
                                    Year <SortIndicator column="year" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm font-bold text-slate-500">Loading holidays...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedHolidays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium italic">
                                        No matching holidays found.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedHolidays.map((holiday) => (
                                <TableRow key={holiday.id} className="hover:bg-slate-100 border-slate-50 transition-colors">
                                    <TableCell className="font-bold text-orange-600">
                                        {format(new Date(holiday.date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-800">
                                        <HighlightText text={holiday.name} highlight={searchQuery} />
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-500">
                                        <HighlightText text={holiday.year.toString()} highlight={searchQuery} />
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            <IconTooltip label="Edit holiday">
                                                <Button variant="ghost" size="icon" aria-label={`Edit ${holiday.name}`} className="h-9 w-9 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleEdit(holiday)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </IconTooltip>
                                            <IconTooltip label="Delete holiday">
                                                <Button variant="ghost" size="icon" aria-label={`Delete ${holiday.name}`} className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingAction({ type: "delete", id: holiday.id, label: holiday.name })}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </IconTooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Rows per page</span>
                        <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-8 w-[70px] bg-slate-100 border-slate-200 rounded-lg text-xs font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </div>


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] bg-slate-50 border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-100 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingId ? "Edit Holiday Info" : "Register Holiday"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Holiday Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="New Year's Day"
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => {
                                        const date = new Date(e.target.value)
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                            year: isNaN(date.getFullYear()) ? formData.year : date.getFullYear()
                                        })
                                    }}
                                    className="bg-slate-100 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">Year</Label>
                                <Input
                                    type="number"
                                    value={isNaN(formData.year) ? "" : formData.year}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, year: val === "" ? new Date().getFullYear() : parseInt(val) });
                                    }}
                                    className="bg-slate-100 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-100 border-t gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 font-bold">
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={requestSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold ml-2">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Holiday
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ActionConfirmDialog
                open={pendingAction !== null}
                action={pendingAction?.type === "delete" ? "delete" : editingId ? "update" : "create"}
                title={pendingAction?.type === "delete" ? "Delete holiday?" : editingId ? "Update holiday?" : "Create holiday?"}
                description={pendingAction?.type === "delete"
                    ? `Holiday ${pendingAction.label} will be permanently deleted.`
                    : `Confirm ${editingId ? "updating" : "creating"} holiday ${formData.name}.`}
                confirmLabel={pendingAction?.type === "delete" ? "Delete holiday" : editingId ? "Update holiday" : "Create holiday"}
                loading={saving}
                onConfirm={handleConfirmedAction}
                onOpenChange={(open) => { if (!open && !saving) setPendingAction(null) }}
            />

        </div>
    )
}
