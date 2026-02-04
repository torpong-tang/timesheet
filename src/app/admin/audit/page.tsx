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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { Loader2, ShieldAlert } from "lucide-react"

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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        System <span className="text-primary italic">Audits</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Track security events and administrative actions</p>
                </div>
                <div className="p-3 bg-white rounded-2xl flex items-center gap-2 border border-slate-200 shadow-sm">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Protected Activity</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-bold text-slate-900">Timestamp</TableHead>
                            <TableHead className="font-bold text-slate-900">User</TableHead>
                            <TableHead className="font-bold text-slate-900">Action</TableHead>
                            <TableHead className="font-bold text-slate-900">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-slate-400 font-medium italic">
                                    No audit logs recorded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                                    <TableCell className="font-mono text-[10px] text-slate-500 font-bold">
                                        {format(new Date(log.timestamp), "dd MMM yyyy")}
                                        <br />
                                        <span className="text-primary">{format(new Date(log.timestamp), "HH:mm:ss")}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">{log.user.name ?? 'System'}</span>
                                            <span className="text-[10px] font-mono text-blue-600">@{log.user.userlogin}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-tighter">
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-slate-700 max-w-md">
                                        {log.details}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

        </div>
    )
}

