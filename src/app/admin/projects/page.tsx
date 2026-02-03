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
                <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : projects.map((project) => (
                            <TableRow key={project.id}>
                                <TableCell className="font-medium">{project.code}</TableCell>
                                <TableCell>{project.name}</TableCell>
                                <TableCell>{format(new Date(project.startDate), 'dd MMM yyyy')}</TableCell>
                                <TableCell>{format(new Date(project.endDate), 'dd MMM yyyy')}</TableCell>
                                <TableCell>{project.budget}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(project.id)}>
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
                        <DialogTitle>{editingId ? "Edit Project" : "Add New Project"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Project Code</Label>
                            <Input
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                placeholder="PRJ-001"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Project Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Website Redesign"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Budget (Hours or Currency)</Label>
                            <Input
                                type="number"
                                value={formData.budget}
                                onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
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
