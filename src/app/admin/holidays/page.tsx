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
                <h1 className="text-3xl font-bold tracking-tight">Holiday Management</h1>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                </Button>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : holidays.map((holiday) => (
                            <TableRow key={holiday.id}>
                                <TableCell className="font-medium">{format(new Date(holiday.date), 'dd MMM yyyy')}</TableCell>
                                <TableCell>{holiday.name}</TableCell>
                                <TableCell>{holiday.year}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(holiday)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(holiday.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Holiday Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="New Year's Day"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date</Label>
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
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Year</Label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
