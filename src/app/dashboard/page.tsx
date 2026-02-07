"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getDashboardStats, DashboardStats } from "@/app/dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, TrendingUp, TrendingDown, Clock, Briefcase, Calendar, Activity } from "lucide-react"
import { format } from "date-fns"
import { cn, formatDuration } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function DashboardPage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getDashboardStats()
                setStats(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!stats) return null

    const role = session?.user?.role || "DEV"
    const isManager = role === 'PM' || role === 'GM' || role === 'ADMIN'

    const growth = stats.totalHoursMonth - stats.totalHoursPrevMonth
    const growthPercent = stats.totalHoursPrevMonth > 0
        ? ((growth / stats.totalHoursPrevMonth) * 100).toFixed(1)
        : "100"

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                        Dashboard <span className="text-primary italic">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Welcome back, <span className="text-slate-900 font-bold">{session?.user?.name}</span>.
                        Here's what's happening {isManager ? "with your team" : "with your work"}.
                    </p>
                </div>
                <LanguageSwitcher />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Hours Card */}
                <Card className="bg-slate-50 border-slate-200 shadow-xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock className="w-32 h-32 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">
                            {isManager ? "Team Hours (This Month)" : "My Hours (This Month)"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                            {formatDuration(stats.totalHoursMonth)}
                        </div>
                        <div className={cn("flex items-center text-sm font-bold gap-1", growth >= 0 ? "text-green-400" : "text-red-500")}>
                            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(Number(growthPercent))}% from last month
                        </div>
                    </CardContent>
                </Card>

                {/* Active Projects Card */}
                <Card className="bg-slate-50 border-slate-200 shadow-xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Briefcase className="w-32 h-32 text-blue-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">
                            Active Projects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">
                            {stats.topProjects.length}
                        </div>
                        <p className="text-slate-500 font-medium text-sm">
                            Projects with logged time this month
                        </p>
                    </CardContent>
                </Card>

                {/* Monthly Progress / Completion Card */}
                <Card className="bg-gradient-to-br from-primary to-orange-600 text-white border-none shadow-xl shadow-orange-200 rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Activity className="w-32 h-32 text-white" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-white/80 uppercase tracking-widest">
                            Monthly Capacity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-5xl font-black text-white tracking-tight">
                                {formatDuration(stats.totalHoursMonth)}
                            </span>
                            <span className="text-xl text-white/70 font-bold">
                                / {stats.workableHoursMonth}h
                            </span>
                        </div>

                        <div className="w-full bg-black/20 rounded-full h-3 mt-2 mb-3">
                            <div
                                className="bg-white rounded-full h-3 transition-all duration-1000"
                                style={{ width: `${Math.min((stats.totalHoursMonth / stats.workableHoursMonth) * 100, 100)}%` }}
                            />
                        </div>

                        <p className="text-white font-bold text-sm flex justify-between">
                            <span>{((stats.totalHoursMonth / stats.workableHoursMonth) * 100).toFixed(0)}% Complete</span>
                            <span className="opacity-80">
                                {Math.max(stats.workableHoursMonth - stats.totalHoursMonth, 0).toFixed(1)}h Remaining
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Projects List */}
                <Card className="bg-slate-50 border-slate-200 shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-100/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            Top Projects
                        </CardTitle>
                        <CardDescription>Most time consumed this month</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {stats.topProjects.map((proj, i) => (
                                <div key={i} className="flex items-center justify-between p-6 border-b border-slate-50 last:border-none hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-slate-900">{proj.name}</span>
                                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
                                            {proj.code}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block font-black text-lg text-slate-900">{formatDuration(proj.hours)}</span>
                                            <span className="text-xs text-slate-500 font-bold">LOGGED</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.topProjects.length === 0 && (
                                <div className="p-10 text-center text-slate-500 font-medium italic">No activity recorded yet.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Log */}
                <Card className="bg-slate-50 border-slate-200 shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-100/50 border-b border-slate-100">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest logs {isManager ? "from your team" : "from you"}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {stats.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 p-6 border-b border-slate-50 last:border-none hover:bg-slate-100 transition-colors">
                                    <div className="min-w-[4rem] text-center">
                                        <span className="block text-xs font-black text-slate-500 uppercase tracking-wider">{format(new Date(log.date), "MMM")}</span>
                                        <span className="block text-xl font-black text-slate-900 leading-none">{format(new Date(log.date), "dd/MM/yyyy")}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                {log.project}
                                            </span>
                                            <span className="font-black text-primary">{formatDuration(log.hours)}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 line-clamp-2">{log.description}</p>
                                    </div>
                                </div>
                            ))}
                            {stats.recentActivity.length === 0 && (
                                <div className="p-10 text-center text-slate-500 font-medium italic">No recent logs.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manager Only: Budget Overview - REMOVED per request */}
            {/* Focus is on hours only now */}
        </div>
    )
}

