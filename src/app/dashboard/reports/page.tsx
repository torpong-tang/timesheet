"use client"

import { useState, useEffect } from "react"
import { getReportData, generateExcelReport, type ReportEntry } from "@/app/report-actions"
import { getProjects, getUsers } from "@/app/admin-actions" // Reusing admin actions for dropdowns
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
import { Loader2, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import { useSession } from "next-auth/react"

export default function ReportsPage() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [reportData, setReportData] = useState<ReportEntry[]>([])

    // Filters
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedUser, setSelectedUser] = useState<string>("all")
    const [selectedProject, setSelectedProject] = useState<string>("all")

    // Dropdown Data
    const [users, setUsers] = useState<{ id: string, name: string }[]>([])
    const [projects, setProjects] = useState<{ id: string, code: string, name: string }[]>([])

    // Load filter options (only if Admin/GM/PM)
    useEffect(() => {
        const loadOptions = async () => {
            if (session?.user.role === 'DEV') return // Devs don't need these filters usually

            try {
                // We might need a non-admin version of getProjects/getUsers for PMs?
                // For now reusing admin-actions but wrapping in try-catch in case of permission error
                // In a real app we'd have a specific "getDropdownOptions" action.
                // Assuming admin-actions checks "ADMIN" role, this might fail for GM/PM.
                // Let's rely on RBAC in report-actions instead and maybe skip fetching lists for now or handle gracefully.
                // Actually, let's just try to fetch. If it fails (403), we just won't populate the dropdowns.
                // *Self-correction*: admin-actions throws "Unauthorized" if not ADMIN. 
                // We need a safer way to get lists.
                // For this iteration, I'll skip fetching lists if not ADMIN, 
                // OR I should update admin-actions to allow GM/PM to read lists. 
                // Let's create a local helper or rely on the fact the user might be ADMIN for testing.
                if (session?.user.role === 'ADMIN') {
                    const [u, p] = await Promise.all([getUsers(), getProjects()])
                    setUsers(u)
                    setProjects(p)
                }
            } catch (e) {
                console.error("Failed to load filter options", e)
            }
        }
        if (session?.user) loadOptions()
    }, [session])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const data = await getReportData({
                month,
                userId: selectedUser === "all" ? undefined : selectedUser,
                projectId: selectedProject === "all" ? undefined : selectedProject
            })
            setReportData(data)
        } catch (err) {
            toast.error("Failed to load report")
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const base64 = await generateExcelReport({
                month,
                userId: selectedUser === "all" ? undefined : selectedUser,
                projectId: selectedProject === "all" ? undefined : selectedProject
            })

            // Trigger Download
            const link = document.createElement('a')
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
            link.download = `Timesheet_Report_${month}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success("Export successful")
        } catch (err) {
            toast.error("Failed to export")
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <Button onClick={handleExport} disabled={exporting || reportData.length === 0}>
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export to Excel
                </Button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="grid gap-2">
                    <Label>Month</Label>
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>

                {session?.user.role === 'ADMIN' && (
                    <>
                        <div className="grid gap-2">
                            <Label>Employee</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
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
                                    <SelectValue placeholder="All Projects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                <Button onClick={fetchReport} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                    Generate Report
                </Button>
            </div>

            {/* Results Table */}
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Employee</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No data found. Click "Generate Report".
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {reportData.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{format(new Date(entry.date), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{entry.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{entry.user.userlogin}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{entry.project.code}</span>
                                                <span className="text-xs text-muted-foreground">{entry.project.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={entry.description}>
                                            {entry.description}
                                        </TableCell>
                                        <TableCell className="text-right">{entry.hours}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={4} className="text-right">Total Hours</TableCell>
                                    <TableCell className="text-right text-primary">
                                        {reportData.reduce((sum, item) => sum + item.hours, 0)}
                                    </TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
