"use client"

import { useState, useEffect } from "react"
import { getProjectAssignments, assignUserToProject, removeUserFromProject, getUsers, getProjects } from "@/app/admin-actions"
import { ProjectAssignment, User, Project } from "@prisma/client"
import { Button } from "@/components/ui/button"
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
import { Loader2, Plus, Trash2 } from "lucide-react"

type AssignmentWithRelations = ProjectAssignment & {
    user: User,
    project: Project
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedProject, setSelectedProject] = useState("")

    const loadData = async () => {
        try {
            const [assigns, usrs, prjs] = await Promise.all([
                getProjectAssignments(),
                getUsers(),
                getProjects()
            ])
            setAssignments(assigns)
            setUsers(usrs)
            setProjects(prjs)
        } catch (err) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleAdd = () => {
        setSelectedUser("")
        setSelectedProject("")
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedUser || !selectedProject) {
            toast.error("User and Project are required")
            return
        }
        setSaving(true)
        try {
            const result = await assignUserToProject(selectedUser, selectedProject)
            if (result.success) {
                toast.success("User assigned to project successfully")
                setIsDialogOpen(false)
                loadData()
            }
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will remove the user from the project.")) return
        try {
            await removeUserFromProject(id)
            toast.success("Assignment removed")
            loadData()
        } catch (err) {
            toast.error("Failed to remove assignment")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Resource <span className="text-primary italic">Allocation</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Link team members to specific active projects</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Member
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900">Team Member</TableHead>
                            <TableHead className="font-bold text-slate-900">Assigned Project</TableHead>
                            <TableHead className="font-bold text-slate-900">User Role</TableHead>
                            <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-bold text-slate-400">Loading resources...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : assignments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                    <p className="text-slate-500 font-medium">No assignments yet.</p>
                                </TableCell>
                            </TableRow>
                        ) : assignments.map((assignment) => (
                            <TableRow key={assignment.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{assignment.user.name}</span>
                                        <span className="text-[10px] font-mono text-blue-600">ID: {assignment.user.userlogin}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800">{assignment.project.name}</span>
                                        <span className="text-[10px] font-bold text-primary">{assignment.project.code}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded border border-slate-200 uppercase">
                                        {assignment.user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(assignment.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] bg-white border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-50 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">Assign Member</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Team Member</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select User" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Target Project</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-orange-600 text-white font-bold ml-2">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
