import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    // Logic to determine which page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = []

        // Always show first page
        pages.push(1)

        // Calculate start and end of siblings
        // If current is 5, siblings (1) -> 4, 5, 6
        // We want to avoid 1 ... 2 3 4 ...
        // Logic: 
        // 1. If total pages <= 7, show all
        // 2. If total > 7:
        //    - Show 1, ..., current-1, current, current+1, ..., last
        //    - Edge cases for start and end

        if (totalPages <= 7) {
            for (let i = 2; i <= totalPages; i++) {
                pages.push(i)
            }
            return pages
        }

        const showLeftEllipsis = currentPage > 4
        const showRightEllipsis = currentPage < totalPages - 3

        if (!showLeftEllipsis && showRightEllipsis) {
            // Near start: 1, 2, 3, 4, 5, ..., 30
            for (let i = 2; i <= 5; i++) {
                pages.push(i)
            }
            pages.push("...")
            pages.push(totalPages)
        } else if (showLeftEllipsis && !showRightEllipsis) {
            // Near end: 1, ..., 26, 27, 28, 29, 30
            pages.push("...")
            for (let i = totalPages - 4; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Middle: 1, ..., 14, 15, 16, ..., 30
            pages.push("...")
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i)
            }
            pages.push("...")
            pages.push(totalPages)
        }

        return pages
    }

    const pages = getPageNumbers()

    return (
        <div className="flex items-center gap-1">
            {/* First Page */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === 1}
                onClick={() => onPageChange(1)}
            >
                <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
                {pages.map((p, i) => (
                    typeof p === 'number' ? (
                        <Button
                            key={i}
                            variant={p === currentPage ? "default" : "outline"}
                            size="icon"
                            className={`h-8 w-8 rounded-lg text-xs font-bold ${p === currentPage ? "bg-primary text-white hover:bg-primary/90" : "text-slate-600"}`}
                            onClick={() => onPageChange(p)}
                        >
                            {p}
                        </Button>
                    ) : (
                        <div key={i} className="flex items-center justify-center w-8 h-8 text-slate-400">
                            <MoreHorizontal className="h-4 w-4" />
                        </div>
                    )
                ))}
            </div>

            {/* Next Page */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(totalPages)}
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
