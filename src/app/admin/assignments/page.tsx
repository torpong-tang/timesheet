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
                toast.success(result.message || "Assigned successfully")
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
                <h1 className="text-3xl font-bold tracking-tight">Project Assignments</h1>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign User
                </Button>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Role</TableHead>
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
                        ) : assignments.map((assignment) => (
                            <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.user.name} ({assignment.user.userlogin})</TableCell>
                                <TableCell>{assignment.project.name} ({assignment.project.code})</TableCell>
                                <TableCell>{assignment.user.role}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(assignment.id)}>
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
                        <DialogTitle>Assign User to Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>User</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
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
                            <Label>Project</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger>
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
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
