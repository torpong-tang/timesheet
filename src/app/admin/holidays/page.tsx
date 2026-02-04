"use client"

import { useState, useEffect } from "react"
import { getHolidays, upsertHoliday, deleteHoliday } from "@/app/admin-actions"
import { Holiday } from "@prisma/client"
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
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Public <span className="text-primary italic">Holidays</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Define non-working days and annual company holidays</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900">Holiday Date</TableHead>
                            <TableHead className="font-bold text-slate-900">Description</TableHead>
                            <TableHead className="font-bold text-slate-900">Year</TableHead>
                            <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-bold text-slate-400">Loading holidays...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : holidays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <p className="text-slate-500 font-medium">No holidays defined yet.</p>
                                </TableCell>
                            </TableRow>
                        ) : holidays.map((holiday) => (
                            <TableRow key={holiday.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                <TableCell className="font-bold text-orange-600">
                                    {format(new Date(holiday.date), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell className="font-bold text-slate-800">{holiday.name}</TableCell>
                                <TableCell className="font-mono text-slate-500">{holiday.year}</TableCell>
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


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingId ? "Edit Holiday Info" : "Register Holiday"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Holiday Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="New Year's Day"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Date</Label>
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
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Year</Label>
                                <Input
                                    type="number"
                                    value={isNaN(formData.year) ? "" : formData.year}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, year: val === "" ? new Date().getFullYear() : parseInt(val) });
                                    }}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t gap-2 sm:gap-0">
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
