"use client"

import { useState, useEffect, useMemo } from "react"
import { getProjectAssignments, assignUserToProject, removeUserFromProject, getUsers, getProjects } from "@/app/admin-actions"
import { ProjectAssignment, User, Project } from "@prisma/client"
import { Pagination } from "@/components/Pagination"
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
import { Combobox } from "@/components/ui/combobox"
import { useLanguage } from "@/components/providers/language-provider"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

type AssignmentWithRelations = ProjectAssignment & {
    user: User,
    project: Project
}

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



export default function AssignmentsPage() {
    const { t, language } = useLanguage()
    const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Data Grid State
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

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

    // --- Data Processing ---
    const processedAssignments = useMemo(() => {
        let data = [...assignments]

        // 1. Search
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            data = data.filter(a =>
                a.user.name?.toLowerCase().includes(lowerQ) ||
                a.user.userlogin.toLowerCase().includes(lowerQ) ||
                a.project.name.toLowerCase().includes(lowerQ) ||
                a.project.code.toLowerCase().includes(lowerQ) ||
                a.user.role.toLowerCase().includes(lowerQ)
            )
        }

        // 2. Sort
        if (sortConfig) {
            data.sort((a, b) => {
                let aVal = ""
                let bVal = ""

                switch (sortConfig.key) {
                    case 'user':
                        aVal = a.user.name || ""
                        bVal = b.user.name || ""
                        break;
                    case 'project':
                        aVal = a.project.name || ""
                        bVal = b.project.name || ""
                        break;
                    case 'role':
                        aVal = a.user.role || ""
                        bVal = b.user.role || ""
                        break;
                    default:
                        // @ts-ignore
                        aVal = (a[sortConfig.key] || "").toString()
                        // @ts-ignore
                        bVal = (b[sortConfig.key] || "").toString()
                }

                aVal = aVal.toLowerCase()
                bVal = bVal.toLowerCase()

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return data
    }, [assignments, searchQuery, sortConfig])

    // Pagination
    const totalPages = Math.ceil(processedAssignments.length / pageSize)
    const paginatedAssignments = processedAssignments.slice((page - 1) * pageSize, page * pageSize)

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 inline text-slate-600" />
        return sortConfig.direction === 'asc' ?
            <ArrowUp className="ml-2 h-3 w-3 inline text-primary" /> :
            <ArrowDown className="ml-2 h-3 w-3 inline text-primary" />
    }


    // --- Actions ---

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        {language === 'en' ? <>Resource <span className="text-primary italic">Allocation</span></> : <span className="text-primary">{t('assign.title')}</span>}
                    </h1>
                    <p className="text-slate-500 font-medium">{t('assign.subtitle')}</p>
                </div>
                <Button onClick={handleAdd} className="shadow-lg shadow-primary/25 bg-primary hover:bg-orange-600 rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('assign.add')}
                </Button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                {/* Controls */}
                <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search assignments..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9 h-11 bg-slate-100 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest hidden md:inline">
                            {t('assign.total')} {processedAssignments.length}
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('user')}>
                                    {t('assign.table.member')} <SortIcon column="user" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('project')}>
                                    {t('assign.table.project')} <SortIcon column="project" />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('role')}>
                                    {t('assign.table.role')} <SortIcon column="role" />
                                </TableHead>
                                <TableHead className="text-right font-bold text-slate-900 px-6">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm font-bold text-slate-500">Loading resources...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedAssignments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium italic">
                                        No matching assignments found.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedAssignments.map((assignment) => (
                                <TableRow key={assignment.id} className="hover:bg-slate-100 border-slate-50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900">
                                                <HighlightText text={assignment.user.name || ""} highlight={searchQuery} />
                                            </span>
                                            <span className="text-[10px] font-mono text-blue-600">
                                                ID: <HighlightText text={assignment.user.userlogin} highlight={searchQuery} />
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">
                                                <HighlightText text={assignment.project.name} highlight={searchQuery} />
                                            </span>
                                            <span className="text-[10px] font-bold text-primary">
                                                <HighlightText text={assignment.project.code} highlight={searchQuery} />
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-black rounded border border-slate-200 uppercase">
                                            <HighlightText text={assignment.user.role} highlight={searchQuery} />
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(assignment.id)}>
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
                        <DialogTitle className="text-2xl font-black text-slate-900">Assign Member</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 p-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">{t('assign.form.member')}</Label>
                            <Combobox
                                value={selectedUser}
                                onChange={setSelectedUser}
                                options={users.map(u => ({ label: `${u.name || "Unknown"} (${u.userlogin})`, value: u.id }))}
                                placeholder={t('assign.form.select_user')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-black uppercase text-slate-500">{t('assign.form.project')}</Label>
                            <Combobox
                                value={selectedProject}
                                onChange={setSelectedProject}
                                options={projects.map(p => ({ label: `${p.code} - ${p.name}`, value: p.id }))}
                                placeholder={t('assign.form.select_project')}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-100 border-t gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 font-bold">
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-orange-600 text-white font-bold ml-2">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('assign.add')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}
