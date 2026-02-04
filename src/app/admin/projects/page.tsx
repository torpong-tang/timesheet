"use client"

import { useState, useEffect } from "react"
import { getProjects, upsertProject, deleteProject } from "@/app/admin-actions"
import { Project } from "@prisma/client"
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

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        startDate: "",
        endDate: "",
        budget: 0
    })

    const loadProjects = async () => {
        try {
            const data = await getProjects()
            setProjects(data)
        } catch (err) {
            toast.error("Failed to load projects")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProjects()
    }, [])

    const handleEdit = (project: Project) => {
        setEditingId(project.id)
        setFormData({
            code: project.code,
            name: project.name,
            startDate: format(new Date(project.startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(project.endDate), 'yyyy-MM-dd'),
            budget: project.budget
        })
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setEditingId(null)
        setFormData({
            code: "",
            name: "",
            startDate: "",
            endDate: "",
            budget: 0
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!formData.startDate || !formData.endDate) {
            toast.error("Dates are required")
            return
        }
        setSaving(true)
        try {
            await upsertProject({
                id: editingId || undefined,
                code: formData.code,
                name: formData.name,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
                budget: Number(formData.budget)
            })
            toast.success(editingId ? "Project updated" : "Project created")
            setIsDialogOpen(false)
            loadProjects()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            await deleteProject(id)
            toast.success("Project deleted")
            loadProjects()
        } catch (err) {
            toast.error("Failed to delete project")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Project <span className="text-primary italic">Catalog</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and monitor all active development projects</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900">Code</TableHead>
                            <TableHead className="font-bold text-slate-900">Project Name</TableHead>
                            <TableHead className="font-bold text-slate-900">Timeline</TableHead>
                            <TableHead className="font-bold text-slate-900">Budget</TableHead>
                            <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-bold text-slate-400">Loading catalog...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <p className="text-slate-500 font-medium">No projects found. Create your first one!</p>
                                </TableCell>
                            </TableRow>
                        ) : projects.map((project) => (
                            <TableRow key={project.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                <TableCell className="font-bold text-primary">{project.code}</TableCell>
                                <TableCell className="font-bold text-slate-800">{project.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-xs">
                                        <span className="text-blue-600 font-bold">{format(new Date(project.startDate), 'dd MMM yyyy')}</span>
                                        <span className="text-slate-400">to</span>
                                        <span className="text-orange-600 font-bold">{format(new Date(project.endDate), 'dd MMM yyyy')}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                        {project.budget.toLocaleString()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full" onClick={() => handleEdit(project)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(project.id)}>
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
                <DialogContent className="sm:max-w-[500px] bg-white border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingId ? "Edit Project Details" : "Launch New Project"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Project Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="PRJ-001"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Budget Allocation</Label>
                                <Input
                                    type="number"
                                    value={isNaN(formData.budget) ? "" : formData.budget}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, budget: val === "" ? 0 : parseFloat(val) });
                                    }}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Project Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Website Redesign"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
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
                            Save Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
