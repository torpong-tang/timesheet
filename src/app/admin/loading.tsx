import { SkeletonTable, Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Search/Filter */}
            <div className="flex gap-4">
                <Skeleton className="h-10 w-64 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Table */}
            <SkeletonTable rows={8} cols={5} />

            {/* Pagination */}
            <div className="flex justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-10 rounded-lg" />
                ))}
            </div>
        </div>
    )
}
