"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getDashboardStats, DashboardStats } from "@/app/dashboard-actions"
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Clock, Briefcase, Calendar, Activity } from "lucide-react"
import { format } from "date-fns"
import { cn, formatDuration } from "@/lib/utils"
import { useLanguage } from "@/components/providers/language-provider"
import { TeamView } from "@/components/dashboard/team-view"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { SkeletonDashboard } from "@/components/ui/skeleton"

export default function DashboardPage() {
    const { data: session } = useSession()
    const { t } = useLanguage()
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
            <div className="space-y-6 pb-10" aria-label="Loading dashboard">
                <div className="space-y-3">
                    <div className="h-10 w-72 animate-pulse rounded-md bg-stone-700/80" />
                    <div className="h-5 w-96 max-w-full animate-pulse rounded-md bg-stone-800" />
                </div>
                <SkeletonDashboard />
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
                    <h1 className="text-4xl font-black tracking-tight text-stone-100 mb-2">
                        {t('dash.title')} <span className="text-primary italic">{t('dash.subtitle')}</span>
                    </h1>
                    <p className="text-stone-400 font-medium">
                        {t('dash.welcome')} <span className="text-stone-100 font-bold">{session?.user?.name}</span>.
                        {isManager ? t('dash.desc.manager') : t('dash.desc.user')}
                    </p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Hours Card */}
                <Card className="group overflow-hidden rounded-lg border-stone-700 bg-stone-800 shadow-lg transition-colors hover:border-amber-600/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-stone-400 uppercase tracking-widest">
                            {t('dash.hours.user')}
                        </CardTitle>
                        <CardAction className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-400">
                            <Clock className="h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-stone-100 tracking-tight mb-2">
                            {formatDuration(stats.totalHoursMonth)}
                        </div>
                        <Badge variant="outline" className={cn("gap-1 border-stone-600", growth >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(Number(growthPercent))}% {growth >= 0 ? t('dash.growth.up') : t('dash.growth.down')}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Active Projects Card */}
                <Card className="group overflow-hidden rounded-lg border-stone-700 bg-stone-800 shadow-lg transition-colors hover:border-sky-600/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-stone-400 uppercase tracking-widest">
                            {t('dash.projects.title')}
                        </CardTitle>
                        <CardAction className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2.5 text-sky-400">
                            <Briefcase className="h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <div className="text-5xl font-black text-stone-100 tracking-tight mb-2">
                            {stats.topProjects.length}
                        </div>
                        <p className="text-stone-400 font-medium text-sm">
                            {t('dash.projects.desc')}
                        </p>
                    </CardContent>
                </Card>

                {/* Monthly Progress / Completion Card */}
                <Card className="overflow-hidden rounded-lg border-amber-600/40 bg-stone-800 text-white shadow-lg transition-colors hover:border-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-white/80 uppercase tracking-widest">
                            {t('dash.capacity.title')}
                        </CardTitle>
                        <CardAction className="rounded-lg border border-amber-500/30 bg-amber-500/15 p-2.5 text-amber-300">
                            <Activity className="h-5 w-5" />
                        </CardAction>
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

                        <Progress
                            value={Math.min((stats.totalHoursMonth / stats.workableHoursMonth) * 100, 100)}
                            className="my-3 bg-stone-700"
                            indicatorClassName={stats.totalHoursMonth >= stats.workableHoursMonth ? "bg-emerald-500" : "bg-amber-500"}
                        />

                        <p className="text-white font-bold text-sm flex justify-between">
                            <span>{((stats.totalHoursMonth / stats.workableHoursMonth) * 100).toFixed(0)}% {t('dash.complete')}</span>
                            <span className="opacity-80">
                                {Math.max(stats.workableHoursMonth - stats.totalHoursMonth, 0).toFixed(1)}h {t('dash.remaining')}
                            </span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Projects List */}
                <Card className="overflow-hidden rounded-lg border-stone-700 bg-stone-800 shadow-lg">
                    <CardHeader className="bg-stone-900/50 border-b border-stone-700">
                        <CardTitle className="text-lg font-black text-stone-100 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-primary" />
                            {t('dash.top_projects')}
                        </CardTitle>
                        <CardDescription className="text-stone-400">{t('dash.top_projects.desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {stats.topProjects.map((proj, i) => (
                                <div key={i} className="flex items-center justify-between p-5 border-b border-stone-700 last:border-none hover:bg-stone-700/50 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-stone-100">{proj.name}</span>
                                        <Badge variant="outline" className="border-sky-800 bg-sky-950/50 text-sky-300">
                                            {proj.code}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block font-black text-lg text-stone-100">{formatDuration(proj.hours)}</span>
                                            <span className="text-xs text-stone-400 font-bold">{t('dash.logged')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.topProjects.length === 0 && (
                                <div className="p-10 text-center text-stone-400 font-medium italic">{t('dash.no_activity')}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity Log */}
                <Card className="overflow-hidden rounded-lg border-stone-700 bg-stone-800 shadow-lg">
                    <CardHeader className="bg-stone-900/50 border-b border-stone-700">
                        <CardTitle className="text-lg font-black text-stone-100 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            {t('dash.recent')}
                        </CardTitle>
                        <CardDescription className="text-stone-400">{t('dash.recent.desc.user')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {stats.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 p-5 border-b border-stone-700 last:border-none hover:bg-stone-700/50 transition-colors">
                                    <div className="min-w-[4rem] text-center">
                                        <span className="block text-xs font-black text-stone-400 uppercase tracking-wider">{format(new Date(log.date), "MMM")}</span>
                                        <span className="block text-sm font-black text-stone-100 leading-none">{format(new Date(log.date), "dd/MM/yyyy")}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
                                                {log.project}
                                            </span>
                                            <span className="font-black text-primary">{formatDuration(log.hours)}</span>
                                        </div>
                                        <p className="text-sm font-medium text-stone-300 line-clamp-2">{log.description}</p>
                                    </div>
                                </div>
                            ))}
                            {stats.recentActivity.length === 0 && (
                                <div className="p-10 text-center text-stone-400 font-medium italic">{t('dash.no_logs')}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manager Only: Budget Overview - REMOVED per request */}
            {/* Focus is on hours only now */}

            {isManager && (
                    <div className="space-y-6 pt-4">
                        <Separator className="bg-stone-700" />
                        <TeamView />
                </div>
            )}
        </div>
    )
}
