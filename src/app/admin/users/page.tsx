"use client"

import { useState, useEffect } from "react"
import { getUsers, upsertUser, deleteUser } from "@/app/admin-actions"
import { User } from "@prisma/client"
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        userlogin: "",
        name: "",
        email: "",
        role: "DEV",
        password: ""
    })

    const loadUsers = async () => {
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (err) {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const handleEdit = (user: User) => {
        setEditingId(user.id)
        setFormData({
            userlogin: user.userlogin,
            name: user.name ?? "",
            email: user.email,
            role: user.role,
            password: "" // Don't fill password on edit
        })
        setIsDialogOpen(true)
    }

    const handleAdd = () => {
        setEditingId(null)
        setFormData({
            userlogin: "",
            name: "",
            email: "",
            role: "DEV",
            password: ""
        })
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await upsertUser({
                id: editingId || undefined,
                ...formData,
                role: formData.role as any // Type assertion needed for string -> Enum
            })
            toast.success(editingId ? "User updated" : "User created")
            setIsDialogOpen(false)
            loadUsers()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return
        try {
            await deleteUser(id)
            toast.success("User deleted")
            loadUsers()
        } catch (err) {
            toast.error("Failed to delete user")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Team <span className="text-primary italic">Members</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Manage access control and user registrations</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900">User</TableHead>
                            <TableHead className="font-bold text-slate-900">Contact Info</TableHead>
                            <TableHead className="font-bold text-slate-900">Role</TableHead>
                            <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-bold text-slate-400">Fetching team...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900">{user.name}</span>
                                        <span className="text-xs font-mono text-primary">@{user.userlogin}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">{user.email}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                        user.role === 'GM' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                            user.role === 'PM' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                'bg-green-50 text-green-700 ring-green-600/20'
                                        }`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full" onClick={() => handleEdit(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(user.id)}>
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
                            {editingId ? "Edit User Account" : "Register New Member"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">User Login</Label>
                                <Input
                                    value={formData.userlogin}
                                    onChange={e => setFormData({ ...formData, userlogin: e.target.value })}
                                    placeholder="Torpong.T"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-400">Role</Label>
                                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEV">Developer</SelectItem>
                                        <SelectItem value="PM">Project Manager</SelectItem>
                                        <SelectItem value="GM">General Manager</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Torpong T."
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Email Address</Label>
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="torpong@example.com"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-400">Password {editingId && "(Optional)"}</Label>
                            <Input
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                type="password"
                                placeholder="******"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-orange-600 text-white font-bold ml-2">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
