"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Loader2, Plus, Pencil, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { format } from "date-fns"

// Helper to highlight text
const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 text-slate-900 font-bold px-0.5 rounded-sm">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    )
}

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Data Grid State
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: keyof Holiday, direction: 'asc' | 'desc' } | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

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

    // --- Data Processing ---
    const processedHolidays = useMemo(() => {
        let data = [...holidays]

        // 1. Search
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            data = data.filter(h =>
                h.name.toLowerCase().includes(lowerQ) ||
                h.year.toString().includes(lowerQ)
            )
        }

        // 2. Sort
        if (sortConfig) {
            data.sort((a, b) => {
                const aVal = (a[sortConfig.key] || "").toString().toLowerCase()
                const bVal = (b[sortConfig.key] || "").toString().toLowerCase()

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return data
    }, [holidays, searchQuery, sortConfig])

    // Pagination
    const totalPages = Math.ceil(processedHolidays.length / pageSize)
    const paginatedHolidays = processedHolidays.slice((page - 1) * pageSize, page * pageSize)

    const handleSort = (key: keyof Holiday) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ column }: { column: keyof Holiday }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 inline text-slate-600" />
        return sortConfig.direction === 'asc' ?
            <ArrowUp className="ml-2 h-3 w-3 inline text-primary" /> :
            <ArrowDown className="ml-2 h-3 w-3 inline text-primary" />
    }


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
            loadHolidays()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            await deleteHoliday(id)
            toast.success("Holiday deleted")
            loadHolidays()
        } catch (err) {
            toast.error("Failed to delete holiday")
        }
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
                                    Holiday Date <SortIcon column="date" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    Description <SortIcon column="name" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('year')}>
                                    Year <SortIcon column="year" />
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
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full" onClick={() => handleEdit(holiday)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(holiday.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-orange-600 text-white font-bold ml-2">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Holiday
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
