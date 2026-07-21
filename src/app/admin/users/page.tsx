"use client"

import { useState, useEffect } from "react"
import { getUsers, upsertUser, deleteUser } from "@/app/admin-actions"
import type { SafeUser } from "@/app/admin-actions"
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
    DialogDescription,
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
import { Combobox } from "@/components/ui/combobox"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/providers/language-provider"
import { HighlightText } from "@/components/data-table/highlight-text"
import { SortIndicator } from "@/components/data-table/sort-indicator"
import { useClientTable } from "@/hooks/use-client-table"
import { ActionConfirmDialog } from "@/components/ui/action-confirm-dialog"
import { IconTooltip } from "@/components/ui/icon-tooltip"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Save, Trash2, Search, X } from "lucide-react"

const matchesUserSearch = (user: SafeUser, query: string) =>
    Boolean(
        user.name?.toLocaleLowerCase().includes(query) ||
        user.userlogin.toLocaleLowerCase().includes(query) ||
        user.email?.toLocaleLowerCase().includes(query) ||
        user.role.toLocaleLowerCase().includes(query)
    )

const getUserSortValue = (user: SafeUser, key: keyof SafeUser) => user[key]

type PendingAction =
    | { type: "save" }
    | { type: "delete"; id: string; label: string }


export default function UsersPage() {
    const { t, language } = useLanguage()
    const [users, setUsers] = useState<SafeUser[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

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

    const {
        page,
        pageSize,
        paginatedItems: paginatedUsers,
        processedItems: processedUsers,
        searchQuery,
        setPage,
        setPageSize,
        setSearchQuery,
        sortConfig,
        toggleSort: handleSort,
        totalPages,
    } = useClientTable<SafeUser, keyof SafeUser>({
        items: users,
        matchesSearch: matchesUserSearch,
        getSortValue: getUserSortValue,
    })


    // --- Actions ---

    const handleEdit = (user: SafeUser) => {
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
            await loadUsers()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        } finally {
            setSaving(false)
            setPendingAction(null)
        }
    }

    const handleDelete = async (id: string) => {
        setSaving(true)
        try {
            await deleteUser(id)
            toast.success("User deleted")
            await loadUsers()
        } catch (err) {
            toast.error("Failed to delete user")
        } finally {
            setSaving(false)
            setPendingAction(null)
        }
    }

    const handleConfirmedAction = async () => {
        if (!pendingAction) return
        if (pendingAction.type === "save") await handleSave()
        else await handleDelete(pendingAction.id)
    }

    const requestSave = () => {
        if (!formData.userlogin.trim() || !formData.name.trim() || !formData.email.trim()) {
            toast.error("Username, name and email are required")
            return
        }
        if (!editingId && !formData.password) {
            toast.error("Password is required for a new user")
            return
        }
        if (formData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/.test(formData.password)) {
            toast.error("Password needs 12+ characters with upper, lower, number and symbol")
            return
        }
        setPendingAction({ type: "save" })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        {language === 'en' ? <>Team <span className="text-primary italic">Members</span></> : <span className="text-primary">{t('users.title')}</span>}
                    </h1>
                    <p className="text-slate-500 font-medium">{t('users.subtitle')}</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('users.add')}
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
                            {t('users.total')} {processedUsers.length}
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('userlogin')}>
                                    {t('users.table.login')} <SortIndicator column="userlogin" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    {t('users.table.name')} <SortIndicator column="name" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('email')}>
                                    {t('users.table.contact')} <SortIndicator column="email" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('role')}>
                                    {t('users.table.role')} <SortIndicator column="role" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900">
                                    {t('users.table.status')}
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-900 px-6">{t('common.actions')}</TableHead>
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
                                        {t('common.loading')}
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
                                            {(user as any).status === 'Enable' ? t('status.enable') : t('status.disable')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            <IconTooltip label="Edit user">
                                                <Button aria-label={`Edit ${user.userlogin}`} variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleEdit(user)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </IconTooltip>
                                            <IconTooltip label="Delete user">
                                                <Button aria-label={`Delete ${user.userlogin}`} variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setPendingAction({ type: "delete", id: user.id, label: user.userlogin })}>
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
                <DialogContent className="sm:max-w-[500px] bg-slate-50 border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-slate-100 border-b">
                        <DialogTitle className="text-2xl font-black text-slate-900">
                            {editingId ? t('users.dialog.edit') : t('users.dialog.add')}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600">
                            {editingId
                                ? "Update this member's identity, role, status, and credentials."
                                : "Create a member account and assign its initial access role."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.login')}</Label>
                                <Input
                                    value={formData.userlogin}
                                    onChange={e => setFormData({ ...formData, userlogin: e.target.value })}
                                    placeholder="Torpong.T"
                                    className="bg-slate-100 border-slate-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.role')}</Label>
                                <Combobox
                                    value={formData.role}
                                    onChange={(v) => setFormData({ ...formData, role: v })}
                                    options={[
                                        { label: "Developer", value: "DEV" },
                                        { label: "Project Manager", value: "PM" },
                                        { label: "General Manager", value: "GM" },
                                        { label: "Admin", value: "ADMIN" }
                                    ]}
                                    placeholder="Select Role"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.status')}</Label>
                                <div className="flex items-center gap-3 h-10">
                                    <Switch
                                        checked={formData.status === "Enable"}
                                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? "Enable" : "Disable" })}
                                    />
                                    <span className="text-sm font-medium text-slate-600">
                                        {formData.status === "Enable" ? t('status.enable') : t('status.disable')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.name')}</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Torpong T."
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.email')}</Label>
                            <Input
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="torpong@example.com"
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">{t('users.form.password')} {editingId && "(Optional)"}</Label>
                            <Input
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                type="password"
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                placeholder="12+ chars with upper, lower, number and symbol"
                                className="bg-slate-100 border-slate-200"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-100 border-t gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 font-bold">
                            <X className="h-4 w-4" />
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={requestSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold ml-2">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ActionConfirmDialog
                open={pendingAction !== null}
                action={pendingAction?.type === "delete" ? "delete" : editingId ? "update" : "create"}
                title={pendingAction?.type === "delete" ? "Delete user?" : editingId ? "Update user?" : "Create user?"}
                description={pendingAction?.type === "delete"
                    ? `User “${pendingAction.label}” will be permanently deleted.`
                    : `Confirm the ${editingId ? "changes to" : "creation of"} user “${formData.userlogin || "this user"}”.`}
                confirmLabel={pendingAction?.type === "delete" ? "Delete" : editingId ? "Update" : "Create"}
                loading={saving}
                onConfirm={handleConfirmedAction}
                onOpenChange={(open) => !open && setPendingAction(null)}
            />

        </div>
    )
}
