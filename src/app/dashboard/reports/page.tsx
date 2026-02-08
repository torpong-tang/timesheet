"use client"

import { useState, useEffect, useMemo } from "react"
import { getReportData, generateExcelReport, type ReportEntry } from "@/app/report-actions"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Download, Search, ArrowUpDown, ArrowUp, ArrowDown, LayoutList, Grip } from "lucide-react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import { cn, formatDuration } from "@/lib/utils"
import { Pagination } from "@/components/Pagination"
import { Combobox } from "@/components/ui/combobox"

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

export default function ReportsPage() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)

    // Raw Data
    const [rawData, setRawData] = useState<ReportEntry[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    // View Mode: 'daily' (flat list) or 'summary' (grouped by user+project)
    const [viewMode, setViewMode] = useState<'daily' | 'summary'>('daily')

    // Filters State
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedUser, setSelectedUser] = useState<string>("all")
    const [selectedProject, setSelectedProject] = useState<string>("all")

    // Client-Side Grid State
    const [searchQuery, setSearchQuery] = useState("")
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Derived Options for Cascading Dropdowns
    const dropdownOptions = useMemo(() => {
        const users = new Map<string, { id: string, name: string }>()
        const projects = new Map<string, { id: string, code: string }>()

        rawData.forEach(item => {
            users.set(item.user.id, { id: item.user.id, name: item.user.name || item.user.userlogin })
            projects.set(item.projectId, { id: item.projectId, code: item.project.code })
        })

        return {
            users: Array.from(users.values()),
            projects: Array.from(projects.values())
        }
    }, [rawData])

    // --- Actions ---

    const fetchReport = async () => {
        setLoading(true)
        try {
            const data = await getReportData({ month })
            setRawData(data)
            setHasSearched(true)
            setPage(1)
        } catch (err) {
            toast.error("Failed to load report")
        } finally {
            setLoading(false)
        }
    }

    // --- Data Processing (Memoized) ---

    // 1. Filtered Flat List
    const processedData = useMemo(() => {
        let data = [...rawData]

        // Filter by Dropdowns
        if (selectedUser !== "all") {
            data = data.filter(item => item.userId === selectedUser)
        }
        if (selectedProject !== "all") {
            data = data.filter(item => item.project.code === selectedProject || (item as any).projectId === selectedProject)
        }

        // Search
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.description.toLowerCase().includes(lowerQ) ||
                (item.user.name || "").toLowerCase().includes(lowerQ) ||
                item.project.code.toLowerCase().includes(lowerQ) ||
                item.project.name.toLowerCase().includes(lowerQ)
            )
        }

        return data
    }, [rawData, selectedUser, selectedProject, searchQuery])

    // 2. Grouped Summary Data (Derived from processedData)
    const summaryData = useMemo(() => {
        if (viewMode !== 'summary') return []

        const map = new Map<string, { id: string, user: any, project: any, hours: number }>()

        processedData.forEach(entry => {
            // Group Key: UserId + ProjectCode (using UUID for uniqueness)
            const key = `${entry.userId}_${entry.project.code}`

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    user: entry.user,
                    project: entry.project,
                    hours: 0
                })
            }

            map.get(key)!.hours += entry.hours
        })

        return Array.from(map.values())
    }, [processedData, viewMode])


    // 3. Sorting & Pagination (Common Logic applied to current view data)
    const currentViewData = viewMode === 'daily' ? processedData : summaryData

    const sortedData = useMemo(() => {
        let data = [...currentViewData] as any[]

        if (sortConfig) {
            data.sort((a, b) => {
                let aVal: any = a
                let bVal: any = b

                // Handle nested keys safely
                if (sortConfig.key === 'user.name') {
                    aVal = a.user.name || ""
                    bVal = b.user.name || ""
                } else if (sortConfig.key === 'project.code') {
                    aVal = a.project.code
                    bVal = b.project.code
                } else if (sortConfig.key === 'project.name') {
                    aVal = a.project.name
                    bVal = b.project.name
                } else {
                    aVal = a[sortConfig.key]
                    bVal = b[sortConfig.key]
                }

                // String comparison safe check
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase()
                    bVal = (bVal || "").toString().toLowerCase()
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        } else if (viewMode === 'summary') {
            // Default sort for summary: User then Project
            data.sort((a, b) => {
                const userCompare = a.user.name.localeCompare(b.user.name)
                if (userCompare !== 0) return userCompare
                return a.project.code.localeCompare(b.project.code)
            })
        } else {
            // Default sort for daily: Date desc
            data.sort((a, b) => new Date((b as any).date).getTime() - new Date((a as any).date).getTime())
        }

        return data
    }, [currentViewData, sortConfig, viewMode])


    // Cascading Option Logic
    const availableOptions = useMemo(() => {
        let uData = rawData
        let pData = rawData

        if (selectedProject !== "all") {
            uData = rawData.filter(d => d.project.code === selectedProject || (d as any).projectId === selectedProject)
        }
        if (selectedUser !== "all") {
            pData = rawData.filter(d => d.user.userlogin === selectedUser || (d as any).userId === selectedUser)
        }

        const users = Array.from(new Set(uData.map(d => JSON.stringify({ id: d.user.id, name: d.user.name, userlogin: d.user.userlogin }))))
            .map(s => JSON.parse(s))
            .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))

        const projects = Array.from(new Set(pData.map(d => JSON.stringify({ id: d.projectId, code: d.project.code, name: d.project.name }))))
            .map(s => JSON.parse(s))
            .sort((a: any, b: any) => a.code.localeCompare(b.code))

        return { users, projects }
    }, [rawData, selectedProject, selectedUser])


    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize)
    const totalHours = processedData.reduce((sum, item) => sum + item.hours, 0) // Always sum from full filtered list

    // Sort Handler
    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 inline text-stone-500" />
        return sortConfig.direction === 'asc' ?
            <ArrowUp className="ml-2 h-3 w-3 inline text-primary" /> :
            <ArrowDown className="ml-2 h-3 w-3 inline text-primary" />
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const base64 = await generateExcelReport({
                month,
                userId: selectedUser === "all" ? undefined : availableOptions.users.find(u => u.id === selectedUser)?.id,
                projectId: selectedProject === "all" ? undefined : availableOptions.projects.find(p => p.id === selectedProject)?.id
            })

            const link = document.createElement('a')
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
            link.download = `Timesheet_Report_${month}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Export successful")
        } catch (e) { toast.error("Export failed") }
        finally { setExporting(false) }
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-stone-100">Advanced <span className="text-primary italic">Reports</span></h1>
                    <p className="text-stone-400 font-medium">Analyze time logs with precision</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={exporting || rawData.length === 0}>
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-stone-800 p-6 rounded-3xl border border-stone-700 shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="grid gap-2">
                        <Label className="text-xs font-black uppercase text-stone-400">Month</Label>
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="h-11 bg-stone-700 border-stone-600 rounded-xl font-bold text-stone-100"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <Button onClick={fetchReport} disabled={loading} size="lg" className="rounded-xl px-8 font-black uppercase tracking-widest text-xs h-11">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load Data"}
                        </Button>
                    </div>
                </div>

                {hasSearched && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-stone-700 pt-6 animate-in slide-in-from-top-2">
                        {/* Filters */}
                        <div className="md:col-span-3 grid gap-2">
                            <Label className="text-xs font-black uppercase text-stone-400">User</Label>
                            <Combobox
                                value={selectedUser}
                                onChange={(v) => { setSelectedUser(v); setPage(1); }}
                                options={[
                                    { label: `All Users (${availableOptions.users.length})`, value: "all" },
                                    ...availableOptions.users.map((u: any) => ({ label: `${u.name} (@${u.userlogin})`, value: u.id }))
                                ]}
                                placeholder="Select User"
                                searchPlaceholder="Search user..."
                                emptyText="No user found."
                            />
                        </div>
                        <div className="md:col-span-3 grid gap-2">
                            <Label className="text-xs font-black uppercase text-stone-400">Project</Label>
                            <Combobox
                                value={selectedProject}
                                onChange={(v) => { setSelectedProject(v); setPage(1); }}
                                options={[
                                    { label: `All Projects (${availableOptions.projects.length})`, value: "all" },
                                    ...availableOptions.projects.map(p => ({ label: `${p.code} - ${p.name}`, value: p.id }))
                                ]}
                                placeholder="Select Project"
                                searchPlaceholder="Search project..."
                                emptyText="No project found."
                            />
                        </div>

                        {/* Search */}
                        <div className="md:col-span-6 grid gap-2">
                            <Label className="text-xs font-black uppercase text-stone-400">Quick Find</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                <Input
                                    placeholder="Type to search description, user, or project..."
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="pl-9 h-10 bg-amber-900/20 border-amber-700/50 text-stone-100 placeholder:text-stone-500 rounded-xl focus-visible:ring-amber-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {hasSearched && (
                <div className="rounded-3xl border border-stone-700 bg-stone-800 shadow-xl overflow-hidden flex flex-col">
                    {/* Summary Row & Tabs */}
                    <div className="bg-stone-900 border-b border-stone-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-stone-800/50 rounded-xl">
                            <Button
                                variant={viewMode === 'daily' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => { setViewMode('daily'); setPage(1); }}
                                className={cn("rounded-lg text-xs font-bold", viewMode === 'daily' && "bg-stone-700 text-primary shadow-sm")}
                            >
                                <LayoutList className="mr-2 h-3.5 w-3.5" />
                                Daily Logs
                            </Button>
                            <Button
                                variant={viewMode === 'summary' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => { setViewMode('summary'); setPage(1); }}
                                className={cn("rounded-lg text-xs font-bold", viewMode === 'summary' && "bg-stone-700 text-primary shadow-sm")}
                            >
                                <Grip className="mr-2 h-3.5 w-3.5" />
                                Summary by Project
                            </Button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase text-stone-400 tracking-widest hidden md:inline">
                                {viewMode === 'daily' ? `Found ${processedData.length} records` : `Found ${summaryData.length} groups`}
                            </span>
                            <div className="flex items-center gap-2 bg-stone-700 px-4 py-2 rounded-xl border border-stone-600 shadow-sm">
                                <span className="text-xs font-bold text-stone-400 uppercase">Total Hours</span>
                                <span className="text-xl font-black text-primary">{formatDuration(totalHours)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent bg-stone-900/50">
                                    {viewMode === 'daily' ? (
                                        <>
                                            <TableHead className="w-[150px] cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('date')}>
                                                Date <SortIcon column="date" />
                                            </TableHead>
                                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('user.name')}>
                                                Employee <SortIcon column="user.name" />
                                            </TableHead>
                                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('project.code')}>
                                                Project <SortIcon column="project.code" />
                                            </TableHead>
                                            <TableHead className="w-[40%] cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('description')}>
                                                Description <SortIcon column="description" />
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('hours')}>
                                                Hours <SortIcon column="hours" />
                                            </TableHead>
                                        </>
                                    ) : (
                                        <>
                                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('user.name')}>
                                                Employee <SortIcon column="user.name" />
                                            </TableHead>
                                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('project.code')}>
                                                Project Code <SortIcon column="project.code" />
                                            </TableHead>
                                            <TableHead className="cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('project.name')}>
                                                Project Name <SortIcon column="project.name" />
                                            </TableHead>
                                            <TableHead className="text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('hours')}>
                                                Total Hours <SortIcon column="hours" />
                                            </TableHead>
                                        </>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={viewMode === 'daily' ? 5 : 4} className="h-32 text-center text-stone-400 font-medium italic">
                                            No matching records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((entry, idx) => (
                                        viewMode === 'daily' ? (
                                            <TableRow key={entry.id} className="hover:bg-stone-700/50 transition-colors border-stone-700">
                                                <TableCell className="font-mono text-xs font-bold text-stone-400">
                                                    {format(new Date((entry as any).date), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-stone-100 text-sm">
                                                            <HighlightText text={entry.user.name} highlight={searchQuery} />
                                                        </span>
                                                        <span className="text-[10px] text-stone-500 font-mono">@{entry.user.userlogin}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded w-fit text-xs mb-0.5">
                                                            <HighlightText text={entry.project.code} highlight={searchQuery} />
                                                        </span>
                                                        <span className="text-[10px] text-stone-400 truncate max-w-[150px]">{entry.project.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-stone-300 font-medium">
                                                    <HighlightText text={(entry as any).description} highlight={searchQuery} />
                                                </TableCell>
                                                <TableCell className="text-right font-black text-stone-100">
                                                    {formatDuration((entry as any).hours)}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            <TableRow key={(entry as any).id} className="hover:bg-stone-700/50 transition-colors border-stone-700">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-stone-100 text-sm">
                                                            <HighlightText text={entry.user.name} highlight={searchQuery} />
                                                        </span>
                                                        <span className="text-[10px] text-stone-500 font-mono">@{entry.user.userlogin}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded w-fit text-xs">
                                                        <HighlightText text={entry.project.code} highlight={searchQuery} />
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-stone-300">
                                                    <HighlightText text={entry.project.name} highlight={searchQuery} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-black bg-emerald-900/50 text-emerald-400 px-3 py-1 rounded-lg">
                                                        {formatDuration((entry as any).hours)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-stone-900 border-t border-stone-700 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-400">Rows per page</span>
                            <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-8 w-[70px] bg-stone-700 border-stone-600 rounded-lg text-xs font-bold text-stone-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
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
            )}
        </div>
    )
}
