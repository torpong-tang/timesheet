import { redirect } from "next/navigation"

export default function DashboardPage() {
    // For now, redirect to calendar as it is the main feature
    redirect("/dashboard/calendar")
}
