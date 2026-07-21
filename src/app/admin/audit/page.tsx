"use client"

import { useState, useEffect } from "react"
import { getAuditLogs } from "@/app/admin-actions"
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
import { format } from "date-fns"
import { Pagination } from "@/components/Pagination"
import { Loader2, ShieldAlert, Search } from "lucide-react"
import { HighlightText } from "@/components/data-table/highlight-text"
import { SortIndicator } from "@/components/data-table/sort-indicator"
import { useClientTable } from "@/hooks/use-client-table"

interface AuditLog {
    id: string
    action: string
    details: string | null
    timestamp: Date
    user: {
        name: string | null
        userlogin: string
    }
}

type AuditSortKey = "timestamp" | "user" | "action" | "details"

const matchesAuditSearch = (log: AuditLog, query: string) =>
    log.action.toLocaleLowerCase().includes(query) ||
    (log.user.name ?? "").toLocaleLowerCase().includes(query) ||
    log.user.userlogin.toLocaleLowerCase().includes(query) ||
    (log.details ?? "").toLocaleLowerCase().includes(query)

const getAuditSortValue = (log: AuditLog, key: AuditSortKey) => {
    if (key === "timestamp") return new Date(log.timestamp)
    if (key === "user") return log.user.name || log.user.userlogin
    return log[key]
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            const data = await getAuditLogs()
            setLogs(data)
        } catch (error) {
            console.error("Failed to fetch logs", error)
        } finally {
            setLoading(false)
        }
    }

    const {
        page,
        pageSize,
        paginatedItems: paginatedLogs,
        processedItems: processedLogs,
        searchQuery,
        setPage,
        setPageSize,
        setSearchQuery,
        sortConfig,
        toggleSort: handleSort,
        totalPages,
    } = useClientTable<AuditLog, AuditSortKey>({
        items: logs,
        matchesSearch: matchesAuditSearch,
        getSortValue: getAuditSortValue,
    })


    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        System <span className="text-primary italic">Audits</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Track security events and administrative actions</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2 border border-slate-200 shadow-sm">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Protected Activity</span>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Controls */}
                <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                            className="pl-9 h-11 bg-slate-100 border-slate-200 rounded-xl"
                        />
                    </div>
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-widest hidden md:inline">
                            Total {processedLogs.length} Events
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-100/50">
                            <TableRow className="hover:bg-transparent border-slate-200">
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('timestamp')}>
                                    Timestamp <SortIndicator column="timestamp" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('user')}>
                                    User <SortIndicator column="user" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('action')}>
                                    Action <SortIndicator column="action" sortConfig={sortConfig} />
                                </TableHead>
                                <TableHead className="font-bold text-slate-900 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('details')}>
                                    Details <SortIndicator column="details" sortConfig={sortConfig} />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium italic">
                                        No matching logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-100 border-slate-100 transition-colors">
                                        <TableCell className="font-mono text-[10px] text-slate-500 font-bold">
                                            {format(new Date(log.timestamp), "dd MMM yyyy")}
                                            <br />
                                            <span className="text-primary">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    <HighlightText text={log.user.name ?? 'System'} highlight={searchQuery} />
                                                </span>
                                                <span className="text-[10px] font-mono text-blue-600">
                                                    @<HighlightText text={log.user.userlogin} highlight={searchQuery} />
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-tighter">
                                                <HighlightText text={log.action} highlight={searchQuery} />
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-700 max-w-md">
                                            <HighlightText text={log.details || ""} highlight={searchQuery} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
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

        </div>
    )
}
