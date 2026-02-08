"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getDashboardStats, DashboardStats } from "@/app/dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, TrendingUp, TrendingDown, Clock, Briefcase, Calendar, Activity } from "lucide-react"
import { format } from "date-fns"
import { cn, formatDuration } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/components/providers/language-provider"
import { TeamView } from "@/components/dashboard/team-view"

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
                    <h1 className="text-4xl font-black tracking-tight text-stone-100 mb-2">
                        {t('dash.title')} <span className="text-primary italic">{t('dash.subtitle')}</span>
                    </h1>
                    <p className="text-stone-400 font-medium">
                        {t('dash.welcome')} <span className="text-stone-100 font-bold">{session?.user?.name}</span>.
                        {isManager ? t('dash.desc.manager') : t('dash.desc.user')}
                    </p>
                </div>
                <LanguageSwitcher />
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Hours Card */}
                <Card className="bg-stone-800 border-stone-700 shadow-xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-32 h-32 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-stone-400 uppercase tracking-widest">
                            {t('dash.hours.user')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-stone-100 tracking-tight mb-2">
                            {formatDuration(stats.totalHoursMonth)}
                        </div>
                        <div className={cn("flex items-center text-sm font-bold gap-1", growth >= 0 ? "text-green-400" : "text-red-400")}>
                            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {Math.abs(Number(growthPercent))}% {growth >= 0 ? t('dash.growth.up') : t('dash.growth.down')}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Projects Card */}
                <Card className="bg-stone-800 border-stone-700 shadow-xl rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Briefcase className="w-32 h-32 text-blue-400" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-stone-400 uppercase tracking-widest">
                            {t('dash.projects.title')}
                        </CardTitle>
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
                <Card className={cn(
                    "text-white border-none shadow-xl rounded-3xl overflow-hidden relative transition-all duration-500",
                    stats.totalHoursMonth >= stats.workableHoursMonth
                        ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-green-200"
                        : "bg-gradient-to-br from-primary to-amber-600 shadow-primary/30"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Activity className="w-32 h-32 text-white" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-black text-white/80 uppercase tracking-widest">
                            {t('dash.capacity.title')}
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
                <Card className="bg-stone-800 border-stone-700 shadow-xl rounded-3xl overflow-hidden">
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
                                <div key={i} className="flex items-center justify-between p-6 border-b border-stone-700 last:border-none hover:bg-stone-700/50 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-stone-100">{proj.name}</span>
                                        <span className="text-[10px] font-black uppercase text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded w-fit">
                                            {proj.code}
                                        </span>
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
                <Card className="bg-stone-800 border-stone-700 shadow-xl rounded-3xl overflow-hidden">
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
                                <div key={log.id} className="flex items-start gap-4 p-6 border-b border-stone-700 last:border-none hover:bg-stone-700/50 transition-colors">
                                    <div className="min-w-[4rem] text-center">
                                        <span className="block text-xs font-black text-stone-400 uppercase tracking-wider">{format(new Date(log.date), "MMM")}</span>
                                        <span className="block text-xl font-black text-stone-100 leading-none">{format(new Date(log.date), "dd/MM/yyyy")}</span>
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
                <div className="pt-4 border-t border-stone-700">
                    <TeamView />
                </div>
            )}
        </div>
    )
}

