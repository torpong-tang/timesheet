"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { format, isWeekend, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { getAssignedProjects, getTimesheetEntries, logTime, deleteEntry, TimesheetInput, getHolidays } from "@/app/actions"
import { Project, TimesheetEntry, Holiday } from "@prisma/client"
import { Trash2, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TimesheetCalendar() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [projects, setProjects] = useState<Project[]>([])
    const [entries, setEntries] = useState<TimesheetEntry[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form State
    const [selectedProject, setSelectedProject] = useState("")
    const [hours, setHours] = useState("1.0")
    const [description, setDescription] = useState("")

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

    const handleDayClick = (day: Date) => {
        setDate(day)
        setIsDialogOpen(true)
        // Reset form
        setSelectedProject("")
        setHours("1.0")
        setDescription("")
    }

    const handleSave = async () => {
        if (!date || !selectedProject) {
            toast.error("Please fill all required fields")
            return
        }

        setLoading(true)
        try {
            await logTime({
                projectId: selectedProject,
                date: date,
                hours: parseFloat(hours),
                description
            })
            toast.success("Time logged successfully")
            setIsDialogOpen(false)
            fetchData() // Refresh
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

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar Section */}
                <div className="md:col-span-2">
                    <Card className="glass-panel border-none h-full">
                        <CardHeader>
                            <CardTitle>Calendar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                onDayClick={handleDayClick}
                                className="rounded-md border bg-white/50 w-full"
                                classNames={{
                                    day_today: "calendar-today text-yellow-700",
                                    // We'll handle custom classes via modifiers if possible or inline logic below
                                }}
                                modifiers={{
                                    weekend: (d) => isWeekend(d),
                                    holiday: (d) => isHoliday(d),
                                    hasEntries: (d) => getDayTotal(d) > 0,
                                    fullDay: (d) => getDayTotal(d) >= 7
                                }}
                                modifiersClassNames={{
                                    weekend: "text-orange-600 font-bold bg-orange-100",
                                    holiday: "text-orange-600 font-bold bg-orange-100",
                                    fullDay: "border-2 border-green-500"
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Details Sidebar */}
                <div>
                    <Card className="glass-panel border-none h-full">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{date ? format(date, 'MMM dd, yyyy') : 'Select a date'}</span>
                                {date && getDayTotal(date) < 7 && (
                                    <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {date && getDayEntries(date).map(entry => (
                                <div key={entry.id} className="flex justify-between items-start p-3 bg-white/40 rounded-lg shadow-sm">
                                    <div>
                                        <p className="font-semibold text-sm">{entry.project.code}</p>
                                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-primary">{entry.hours}h</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDelete(entry.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {date && getDayEntries(date).length === 0 && (
                                <p className="text-muted-foreground text-center py-8">No entries for this day.</p>
                            )}
                            {date && (
                                <div className="pt-4 border-t border-dashed">
                                    <div className="flex justify-between font-bold">
                                        <span>Total:</span>
                                        <span className={getDayTotal(date) > 7 ? "text-red-500" : "text-green-600"}>
                                            {getDayTotal(date)} / 7.0 h
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Log Time Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-panel">
                    <DialogHeader>
                        <DialogTitle>Log Time for {date ? format(date, 'MMM dd') : ''}</DialogTitle>
                        <DialogDescription>
                            Record your work hours. Total hours per day cannot exceed 7.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Project</Label>
                            <Select onValueChange={setSelectedProject} value={selectedProject}>
                                <SelectTrigger>
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
                            <Label>Hours</Label>
                            <Select onValueChange={setHours} value={hours}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(h => (
                                        <SelectItem key={h} value={h.toString()}>{h} Hours</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="What did you work on?"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
