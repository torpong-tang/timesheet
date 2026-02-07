"use client"

import { useState, useEffect, useCallback } from "react"
import { getTeamData, getFilters, TeamUserStat, TeamEntry } from "@/app/dashboard-actions"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, User, Clock, FileText, BarChart3, ListFilter, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn, formatDuration } from "@/lib/utils"
import { useLanguage } from "@/components/providers/language-provider"

export function TeamView() {
    const { t } = useLanguage()

    // Filters
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [selectedProject, setSelectedProject] = useState<string>("")

    // Data
    const [stats, setStats] = useState<{ users: TeamUserStat[], entries: TeamEntry[] } | null>(null)
    const [filters, setFilters] = useState<{ users: { id: string, name: string }[], projects: { id: string, name: string, code: string }[] }>({ users: [], projects: [] })
    const [loading, setLoading] = useState(true)

    // Load Filter Options
    useEffect(() => {
        getFilters().then(data => {
            setFilters(data)
        })
    }, [])

    // Load Data
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const userId = selectedUser === "ALL" ? undefined : (selectedUser || undefined)
            const data = await getTeamData(new Date(), userId, selectedProject || undefined)
            setStats(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [selectedUser, selectedProject])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Filter Options for Combobox
    const userOptions = [
        { label: t('common.all') || "All Users", value: "ALL" },
        ...filters.users.map(u => ({ label: u.name, value: u.id }))
    ]
    const projectOptions = filters.projects.map(p => ({ label: `[${p.code}] ${p.name}`, value: p.id }))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-slate-900">{t('team.title') || "Team Overview"}</h2>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full sm:w-[200px]">
                        <Combobox
                            value={selectedUser}
                            onChange={(val) => setSelectedUser(val)}
                            options={userOptions}
                            placeholder={t('filter.user') || "Filter by User"}
                            searchPlaceholder="Search user..."
                            emptyText="No user found."
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !stats ? null : (
                <div className="space-y-6">
                    {/* Capacity Chart */}
                    <Card className="bg-white border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="flex justify-between items-center text-lg">
                                <span>{t('team.capacity') || "Monthly Capacity Status"}</span>
                                <span className="text-sm font-normal text-slate-500">
                                    {stats.users.length} {t('common.users') || "Members"}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid gap-5">
                            {stats.users.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 italic">No users found for this filter.</div>
                            ) : (
                                stats.users.map(user => (
                                    <div key={user.userId} className="space-y-1.5">
                                        <div className="flex justify-between items-end text-sm">
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 overflow-hidden">
                                                    {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : <User className="w-3 h-3" />}
                                                </div>
                                                {user.name}
                                            </div>
                                            <div className={cn("font-bold flex items-center gap-2", user.isComplete ? "text-green-600" : "text-amber-600")}>
                                                {formatDuration(user.totalHours)} / {user.workableHours}h
                                                {user.isComplete ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 opacity-50" />}
                                            </div>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", user.isComplete ? "bg-green-500" : "bg-primary")}
                                                style={{ width: `${user.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                </div>
            )}
        </div>
    )
}
