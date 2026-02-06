"use client"

import { useState, useEffect, useMemo } from "react"
import { getUsers, upsertUser, deleteUser } from "@/app/admin-actions"
import { User } from "@prisma/client"
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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Data Grid State
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: keyof User, direction: 'asc' | 'desc' } | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        userlogin: "",
        name: "",
        email: "",
        role: "DEV",
        password: "",
        status: "Enable"
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

    // --- Data Processing ---
    const processedUsers = useMemo(() => {
        let data = [...users]

        // 1. Search
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            data = data.filter(user =>
                user.name?.toLowerCase().includes(lowerQ) ||
                user.userlogin.toLowerCase().includes(lowerQ) ||
                user.email?.toLowerCase().includes(lowerQ) ||
                user.role.toLowerCase().includes(lowerQ)
            )
        }

        // 2. Sort
        if (sortConfig) {
            data.sort((a, b) => {
                // Handle potential nulls
                const aVal = (a[sortConfig.key] || "").toString().toLowerCase()
                const bVal = (b[sortConfig.key] || "").toString().toLowerCase()

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return data
    }, [users, searchQuery, sortConfig])

    // Pagination
    const totalPages = Math.ceil(processedUsers.length / pageSize)
    const paginatedUsers = processedUsers.slice((page - 1) * pageSize, page * pageSize)

    const handleSort = (key: keyof User) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ column }: { column: keyof User }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 inline text-slate-600" />
        return sortConfig.direction === 'asc' ?
            <ArrowUp className="ml-2 h-3 w-3 inline text-primary" /> :
            <ArrowDown className="ml-2 h-3 w-3 inline text-primary" />
    }


    // --- Actions ---

    const handleEdit = (user: User) => {
        setEditingId(user.id)
        setFormData({
            userlogin: user.userlogin,
            name: user.name ?? "",
            email: user.email,
            role: user.role,
            status: (user as any).status || "Enable",
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
            status: "Enable",
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Team <span className="text-primary italic">Members</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Manage access control and user registrations</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                {/* Controls */}
                <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9 h-11 bg-slate-100 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest hidden md:inline">
                            Total {processedUsers.length} Users
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('userlogin')}>
                                    User Login <SortIcon column="userlogin" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    Name <SortIcon column="name" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('email')}>
                                    Contact Info <SortIcon column="email" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('role')}>
                                    Role <SortIcon column="role" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900">
                                    Status
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-900 px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm font-bold text-slate-500">Fetching team...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium italic">
                                        No matching users found.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-100 border-slate-50 transition-colors">
                                    <TableCell>
                                        <span className="font-bold text-slate-900">
                                            <HighlightText text={user.userlogin} highlight={searchQuery} />
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-600 font-medium">
                                            <HighlightText text={user.name || "-"} highlight={searchQuery} />
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium">
                                        <HighlightText text={user.email} highlight={searchQuery} />
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                            user.role === 'GM' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                user.role === 'PM' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                    'bg-green-50 text-green-700 ring-green-600/20'
                                            }`}>
                                            <HighlightText text={user.role} highlight={searchQuery} />
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${(user as any).status === 'Disable' ? 'bg-slate-100 text-slate-600 ring-slate-500/10' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'}`}>
                                            {(user as any).status || "Enable"}
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
                <DialogContent className="sm:max-w-[500px] bg-slate-50 border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-100 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingId ? "Edit User Account" : "Register New Member"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">User Login</Label>
                                <Input
                                    value={formData.userlogin}
                                    onChange={e => setFormData({ ...formData, userlogin: e.target.value })}
                                    placeholder="Torpong.T"
                                    className="bg-slate-100 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">Role</Label>
                                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                                    <SelectTrigger className="bg-slate-100 border-slate-200">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger className="bg-slate-100 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Enable">Enable</SelectItem>
                                        <SelectItem value="Disable">Disable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Torpong T."
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Email Address</Label>
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="torpong@example.com"
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Password {editingId && "(Optional)"}</Label>
                            <Input
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                type="password"
                                placeholder="******"
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-100 border-t gap-2 sm:gap-0">
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

