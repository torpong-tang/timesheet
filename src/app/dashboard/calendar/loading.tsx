import { SkeletonCalendar, SkeletonCard } from "@/components/ui/skeleton"

export default function CalendarLoading() {
    return (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SkeletonCalendar />
                </div>
                <div className="space-y-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        </div>
    )
}
