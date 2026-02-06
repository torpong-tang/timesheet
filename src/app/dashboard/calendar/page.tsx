"use client"

import { useState, useEffect } from "react"
import { Calendar as ShadcnCalendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format, isWeekend, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, endOfWeek, addDays } from "date-fns"
import { getAssignedProjects, getTimesheetEntries, deleteEntry, updateEntry, TimesheetInput, getHolidays, logRecurringTime } from "@/app/actions"
import { Project, TimesheetEntry, Holiday } from "@prisma/client"
import { Trash2, Plus, Loader2, Calendar, ArrowLeft, ArrowRight, Pencil } from "lucide-react"
import { cn, formatDuration } from "@/lib/utils"

type TimesheetEntryWithProject = TimesheetEntry & {
    project: Project
}

export default function TimesheetCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [projects, setProjects] = useState<Project[]>([])
    const [entries, setEntries] = useState<TimesheetEntryWithProject[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [selectedProject, setSelectedProject] = useState("")
    const [hours, setHours] = useState("1.0")
    const [description, setDescription] = useState("")
    const [recurringType, setRecurringType] = useState<string>("none")
    const [editingId, setEditingId] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [date]) // Refetch when month _could_ change or just initial

    const fetchData = async () => {
        try {
            const [p, e, h] = await Promise.all([
                getAssignedProjects(),
                getTimesheetEntries(date || new Date()),
                getHolidays(date?.getFullYear() || new Date().getFullYear())
            ])
            setProjects(p)
            setEntries(e)
            setHolidays(h)
        } catch (err) {
            toast.error("Failed to load data")
        }
    }

    const resetForm = () => {
        setSelectedProject("")
        setHours("1.0")
        setDescription("")
        setRecurringType("none")
        setEditingId(null)
    }

    const handleDayClick = (day: Date) => {
        setDate(day)
        resetForm()
    }

    const handleEdit = (entry: TimesheetEntryWithProject) => {
        // Although the main view is set, let's ensure we are on the right date context or just open dialog
        // Since the list shows entries for the 'date' state, we are already there.
        setEditingId(entry.id)
        setSelectedProject(entry.projectId)
        setHours(entry.hours.toString())
        setDescription(entry.description)
        setRecurringType("none") // Editing is single entry only
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!date || !selectedProject || !hours) {
            toast.error("Please fill in all fields")
            return
        }

        const h = parseFloat(hours)
        if (isNaN(h)) return

        setLoading(true)
        try {
            if (editingId) {
                // UPDATE MODE
                await updateEntry(editingId, {
                    hours: h,
                    description: description
                })
                toast.success("Entry updated")
            } else {
                // CREATE MODE (including recurring)
                const targetDates: Date[] = []
                let endDate = date

                if (recurringType === "weekly") {
                    endDate = endOfWeek(date, { weekStartsOn: 1 })
                } else if (recurringType === "monthly") {
                    endDate = endOfMonth(date)
                }

                // Generate dates
                let currentCursor = date
                while (currentCursor <= endDate) {
                    // Skip weekends and holidays
                    if (!isWeekend(currentCursor) && !isHoliday(currentCursor)) {
                        targetDates.push(currentCursor)
                    }
                    currentCursor = addDays(currentCursor, 1)
                }

                if (targetDates.length === 0) {
                    toast.error("No valid working days in selected range")
                    setLoading(false)
                    return
                }

                // Server-side batch log
                const result = await logRecurringTime({
                    dates: targetDates,
                    projectId: selectedProject,
                    hours: h,
                    description: description
                })

                toast.success(`Logged ${h}h for ${result.count || targetDates.length} day(s)`)
            }

            // Refresh data
            fetchData()

            setIsDialogOpen(false)
            resetForm()
        } catch (err: any) {
            toast.error(err.message || "Failed to log time")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return
        try {
            await deleteEntry(id)
            toast.success("Entry deleted")
            fetchData()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    // Calculate totals
    const getDayEntries = (d: Date) => entries.filter(e => isSameDay(new Date(e.date), d))
    const getDayTotal = (d: Date) => getDayEntries(d).reduce((sum, e) => sum + e.hours, 0)

    // Custom Day Render
    const isHoliday = (d: Date) => holidays.some(h => isSameDay(new Date(h.date), d))

    const renderDayContent = (d: Date) => {
        const total = getDayTotal(d);
        // Tooltip logic handled in Button component now, but we keep the content simple
        return (
            <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                <span className="leading-none text-4xl font-black">{format(d, "d")}</span>
                {total > 0 && (
                    <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-black transition-all",
                        total >= 7 ? "bg-green-600 text-white shadow-lg shadow-green-200" : "bg-primary text-white shadow-lg shadow-orange-200"
                    )}>
                        {formatDuration(total)}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full pb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                        Time <span className="text-primary italic">Tracker</span>
                    </h1>
                    <p className="text-slate-500 font-medium italic">Log your daily activities and manage your schedule</p>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8 w-full items-start">
                {/* Calendar Section (9/12 width) */}
                <div className="col-span-8">
                    <Card className="bg-slate-50 border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
                        <CardHeader className="bg-slate-100 border-b border-slate-100 py-8 px-10">
                            <CardTitle className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-6">
                                    <Button
                                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                        className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 w-10 p-0 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    >
                                        <ArrowLeft className="h-6 w-6 text-white" strokeWidth={3} />
                                    </Button>
                                    <div className="text-4xl font-black text-slate-900 min-w-[220px] text-center pb-1 cursor-default select-none">
                                        {format(currentMonth, "MMMM yyyy")}
                                    </div>
                                    <Button
                                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                        className="bg-orange-500 hover:bg-orange-600 rounded-full h-10 w-10 p-0 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    >
                                        <ArrowRight className="h-6 w-6 text-white" strokeWidth={3} />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                                        <span className="text-sm font-bold text-slate-500">Working Day</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-500" />
                                        <span className="text-sm font-bold text-slate-500">Holiday</span>
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 flex-1 flex flex-col">
                            <ShadcnCalendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                onDayClick={handleDayClick}
                                components={{
                                    DayButton: (props) => {
                                        const { day } = props
                                        const holiday = holidays.find(h => isSameDay(new Date(h.date), day.date))
                                        const title = holiday && !isWeekend(day.date) ? holiday.name : undefined
                                        return <CalendarDayButton {...props} getDayContent={renderDayContent} title={title} />
                                    }
                                }}
                                className="w-full"
                                classNames={{
                                    root: "w-full h-full flex flex-col",
                                    months: "w-full flex-1 flex flex-col relative",
                                    month: "w-full flex-1 flex flex-col",
                                    caption: "hidden",
                                    nav: "hidden",
                                    table: "w-full flex-1 border-collapse table-fixed",
                                    head_row: "flex w-full mb-8",
                                    head_cell: "flex-1 text-slate-600 font-black text-xl uppercase tracking-[0.4em] text-center first:text-red-500 last:text-red-500",
                                    row: "flex w-full mb-4 flex-1 min-h-[140px]",
                                    cell: "flex-1 p-1 h-full",
                                    day: cn(
                                        "h-full w-full p-0 font-black aria-selected:opacity-100 hover:bg-orange-50 rounded-[2.5rem] transition-all flex flex-col items-center justify-center gap-6 text-4xl border-4 border-transparent text-slate-900"
                                    ),
                                    day_selected: "bg-primary text-white hover:bg-primary/90 focus:bg-primary/90 shadow-2xl shadow-primary/40 scale-[1.05] z-10 border-white/30",
                                    day_today: "border-4 border-amber-300 bg-amber-50",
                                    day_outside: "opacity-10",
                                    day_disabled: "opacity-100 cursor-not-allowed",
                                }}
                                modifiers={{
                                    weekend: (d) => isWeekend(d),
                                    holiday: (d) => isHoliday(d),
                                }}
                                modifiersClassNames={{
                                    weekend: "!text-red-600",
                                    holiday: "!bg-red-50 !text-slate-900 border-2 border-red-100",
                                }}
                                disabled={(d) => isHoliday(d) || isWeekend(d)}
                                required
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Details Sidebar (4/12 width) */}
                <div className="col-span-4">
                    <Card className="bg-slate-50 border-slate-200 min-h-[600px] flex flex-col shadow-2xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-slate-100 border-b border-slate-100 py-8 px-8">
                            <CardTitle className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 leading-none">Schedule</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tight">{date ? format(date, 'dd/MM/yyyy') : 'Pick Date'}</span>
                                </div>
                                {date && getDayTotal(date) < 7 && (
                                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all" onClick={() => setIsDialogOpen(true)}>
                                        <Plus className="h-6 w-6 text-white" />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 flex-1 overflow-y-auto space-y-6 bg-slate-100/50">
                            {date && getDayEntries(date).map(entry => (
                                <div key={entry.id} className="group flex flex-col p-6 bg-slate-200 border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl transition-all relative border-l-8 border-l-blue-600">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[11px] font-black rounded-lg uppercase tracking-wider">
                                            {entry.project.code}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-primary">{formatDuration(entry.hours)}</span>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" onClick={() => handleEdit(entry)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" onClick={() => handleDelete(entry.id)}>
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-slate-700 leading-relaxed line-clamp-3">{entry.description}</p>
                                </div>
                            ))}
                            {date && getDayEntries(date).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-32 text-center opacity-30">
                                    <div className="w-24 h-24 bg-slate-200 rounded-[2.5rem] flex items-center justify-center mb-6 border-4 border-white shadow-inner">
                                        <Plus className="h-12 w-12 text-slate-500" />
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm">Nothing Recorded</p>
                                </div>
                            )}
                        </CardContent>
                        {date && (
                            <div className="p-10 bg-slate-50 border-t border-slate-100 mt-auto">
                                <div className="flex justify-between items-end mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Daily Progress</span>
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                            {formatDuration(getDayTotal(date))}
                                            <span className="text-slate-600 text-lg ml-2 font-black uppercase">/ 7h (1d)</span>
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm",
                                        getDayTotal(date) >= 7 ? "bg-green-600 text-white" : "bg-amber-100 text-amber-700"
                                    )}>
                                        {getDayTotal(date) >= 7 ? "Full" : "Work"}
                                    </div>
                                </div>
                                <div className="w-full h-5 bg-slate-200 rounded-full overflow-hidden shadow-inner border-2 border-white">
                                    <div
                                        className={cn("h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)", getDayTotal(date) >= 7 ? "bg-green-600" : "bg-primary")}
                                        style={{ width: `${Math.min((getDayTotal(date) / 7) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>





            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] bg-slate-50 border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-slate-100 border-b">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-3xl font-black text-slate-900 mb-1">{editingId ? 'Edit Entry' : 'Daily Log'}</DialogTitle>
                                <DialogDescription className="text-slate-500 font-bold text-lg">
                                    {date ? format(date, 'EEEE, dd/MM/yyyy') : ''}
                                </DialogDescription>
                            </div>
                            <div className="bg-primary/10 px-4 py-2 rounded-2xl flex flex-col items-center">
                                <span className="text-[10px] font-black text-primary uppercase">Total Hours</span>
                                <span className="text-2xl font-black text-primary">{date ? formatDuration(getDayTotal(date)) : 0} / 7h</span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Summary List */}
                        <div className="p-8 border-r border-slate-100 bg-slate-100/30">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Recorded Entries</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {date && getDayEntries(date).length > 0 ? getDayEntries(date).map(entry => (
                                    <div key={entry.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                                                {entry.project.code}
                                            </span>
                                            <span className="font-black text-primary">{formatDuration(entry.hours)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium line-clamp-2">{entry.description}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(entry.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 opacity-20">
                                        <Plus className="h-12 w-12 mx-auto mb-2" />
                                        <p className="font-black text-xs uppercase">Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Entry Form */}
                        <div className="p-8">
                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Add New Entry</h3>
                            <div className="space-y-6">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase text-slate-500">Project</Label>
                                    <Select onValueChange={setSelectedProject} value={selectedProject}>
                                        <SelectTrigger className="h-12 bg-slate-100 border-slate-200 rounded-xl">
                                            <SelectValue placeholder="Select Project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase text-slate-500">Hours</Label>
                                    <Select onValueChange={setHours} value={hours}>
                                        <SelectTrigger className="h-12 bg-slate-100 border-slate-200 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0]
                                                .filter(h => h <= (7 - (date ? getDayTotal(date) : 0)))
                                                .map(h => (
                                                    <SelectItem key={h} value={h.toString()}>{h} Hours</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {!editingId && (
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-slate-500">Repeat</Label>
                                        <Select onValueChange={setRecurringType} value={recurringType}>
                                            <SelectTrigger className="h-12 bg-slate-100 border-slate-200 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">One Time Only</SelectItem>
                                                <SelectItem value="weekly">Daily until End of Week (Fri)</SelectItem>
                                                <SelectItem value="monthly">Daily until End of Month</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label className="text-xs font-black uppercase text-slate-500">Description</Label>
                                    <Textarea
                                        placeholder="What did you work on?"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="min-h-[100px] bg-slate-100 border-slate-200 resize-none rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-100 border-t gap-3 sm:gap-0">
                        <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-12 px-6 border-slate-300 font-black uppercase text-xs tracking-widest rounded-xl">
                            Close
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading || (date ? getDayTotal(date) >= 7 : false)}
                            className="h-12 px-8 bg-primary hover:bg-orange-600 text-white font-black uppercase text-xs tracking-widest rounded-xl ml-2 shadow-lg shadow-primary/20"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? 'Save Changes' : 'Log Work'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </div>
    )
}

