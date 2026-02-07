"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Language = "en" | "th"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

// Simple dictionary for translations
const translations: Record<Language, Record<string, string>> = {
    en: {
        // General
        "app.title": "Timesheet App",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.search": "Search...",
        "common.actions": "Actions",
        "common.loading": "Loading...",

        // Auth
        "auth.login": "Sign in",
        "auth.logout": "Sign out",

        // Admin Users
        "users.title": "Team Members",
        "users.subtitle": "Manage access control and user registrations",
        "users.add": "Add User",
        "users.total": "Total Users",
        "users.table.login": "User Login",
        "users.table.name": "Name",
        "users.table.contact": "Contact Info",
        "users.table.role": "Role",
        "users.table.status": "Status",
        "users.dialog.edit": "Edit User Account",
        "users.dialog.add": "Register New Member",
        "users.form.login": "User Login",
        "users.form.password": "Password",
        "users.form.role": "Role",
        "users.form.status": "Status Enable/Disable",
        "users.form.name": "Full Name",
        "users.form.email": "Email Address",

        // Admin Assignments
        "assign.title": "Resource Allocation",
        "assign.subtitle": "Link team members to specific active projects",
        "assign.add": "Assign Member",
        "assign.total": "Total Assignments",
        "assign.table.member": "Team Member",
        "assign.table.project": "Assigned Project",
        "assign.table.role": "User Role",
        "assign.dialog.title": "Assign Member",
        "assign.form.member": "Team Member",
        "assign.form.project": "Target Project",
        "assign.form.select_user": "Select User...",
        "assign.form.select_project": "Select Project...",

        // Status
        "status.enable": "Enable",
        "status.disable": "Disable",

        // Calendar
        "calendar.title": "Time Tracker",
        "calendar.subtitle": "Log your daily activities and manage your schedule",
        "calendar.month": "Month",
        "calendar.working_day": "Working Day",
        "calendar.holiday": "Holiday",
        "calendar.schedule": "Schedule",
        "calendar.pick_date": "Pick Date",
        "calendar.daily_progress": "Daily Progress",
        "calendar.full": "Full",
        "calendar.work": "Work",
        "calendar.dialog.title": "Daily Log",
        "calendar.dialog.edit": "Edit Entry",
        "calendar.dialog.total_hours": "Total Hours",
        "calendar.dialog.recorded": "Recorded Entries",
        "calendar.dialog.add": "Add New Entry",
        "calendar.dialog.project": "Project",
        "calendar.dialog.select_project": "Select Project",
        "calendar.dialog.search_project": "Search project...",
        "calendar.dialog.no_project": "No project found.",
        "calendar.dialog.hours": "Hours",
        "calendar.dialog.repeat": "Repeat",
        "calendar.dialog.repeat.none": "One Time Only",
        "calendar.dialog.repeat.weekly": "Daily until End of Week (Fri)",
        "calendar.dialog.repeat.monthly": "Daily until End of Month",
        "calendar.dialog.description": "Description",
        "calendar.dialog.placeholder": "What did you work on?",
        "calendar.dialog.close": "Close",
        "calendar.dialog.log": "Log Work",
        "calendar.dialog.save": "Save Changes",
        "calendar.empty": "Empty",
        "calendar.nothing_recorded": "Nothing Recorded",

        // Reports
        "reports.title": "Advanced Reports",
        "reports.subtitle": "Analyze time logs with precision",
        "reports.export": "Export",
        "reports.load": "Load Data",
        "reports.month": "Month",
        "reports.user": "User",
        "reports.all_users": "All Users",
        "reports.select_user": "Select User",
        "reports.search_user": "Search user...",
        "reports.no_user": "No user found.",
        "reports.project": "Project",
        "reports.all_projects": "All Projects",
        "reports.select_project": "Select Project",
        "reports.search_project": "Search project...",
        "reports.no_project": "No project found.",
        "reports.quick_find": "Quick Find",
        "reports.search_placeholder": "Type to search description, user, or project...",
        "reports.daily_logs": "Daily Logs",
        "reports.summary": "Summary by Project",
        "reports.found": "Found",
        "reports.records": "records",
        "reports.groups": "groups",
        "reports.total_hours": "Total Hours",
        "reports.table.date": "Date",
        "reports.table.employee": "Employee",
        "reports.table.project_code": "Project Code",
        "reports.table.project_name": "Project Name",
        "reports.table.description": "Description",
        "reports.table.hours": "Hours",
        "reports.table.total": "Total Hours",
        "reports.no_records": "No matching records found.",
        "reports.rows_per_page": "Rows per page",
    },
    th: {
        // General
        "app.title": "ระบบลงเวลาทำงาน",
        "common.cancel": "ยกเลิก",
        "common.save": "บันทึก",
        "common.delete": "ลบ",
        "common.edit": "แก้ไข",
        "common.search": "ค้นหา...",
        "common.actions": "การจัดการ",
        "common.loading": "กำลังโหลด...",

        // Auth
        "auth.login": "เข้าสู่ระบบ",
        "auth.logout": "ออกจากระบบ",

        // Admin Users
        "users.title": "จัดการสมาชิก",
        "users.subtitle": "จัดการสิทธิ์การเข้าถึงและลงทะเบียนผู้ใช้",
        "users.add": "เพิ่มผู้ใช้",
        "users.total": "ผู้ใช้ทั้งหมด",
        "users.table.login": "ชื่อผู้ใช้ (Login)",
        "users.table.name": "ชื่อ-นามสกุล",
        "users.table.contact": "ข้อมูลติดต่อ",
        "users.table.role": "บทบาท",
        "users.table.status": "สถานะ",
        "users.dialog.edit": "แก้ไขข้อมูลผู้ใช้",
        "users.dialog.add": "ลงทะเบียนสมาชิกใหม่",
        "users.form.login": "ชื่อผู้ใช้ (Login)",
        "users.form.password": "รหัสผ่าน",
        "users.form.role": "บทบาท",
        "users.form.status": "เปิดใช้งาน/ปิดใช้งาน",
        "users.form.name": "ชื่อ-นามสกุล",
        "users.form.email": "อีเมล",

        // Admin Assignments
        "assign.title": "จัดสรรทรัพยากร",
        "assign.subtitle": "กำหนดสมาชิกในทีมให้กับโครงการที่กำลังดำเนินอยู่",
        "assign.add": "มอบหมายงาน",
        "assign.total": "รายการทั้งหมด",
        "assign.table.member": "สมาชิกในทีม",
        "assign.table.project": "โครงการที่ได้รับมอบหมาย",
        "assign.table.role": "บทบาทผู้ใช้",
        "assign.dialog.title": "มอบหมายงานให้สมาชิก",
        "assign.form.member": "สมาชิกในทีม",
        "assign.form.project": "โครงการเป้าหมาย",
        "assign.form.select_user": "เลือกผู้ใช้",
        "assign.form.select_project": "เลือกโครงการ",

        // Status
        "status.enable": "เปิดใช้งาน",
        "status.disable": "ปิดใช้งาน",

        // Calendar
        "calendar.title": "บันทึกเวลาทำงาน",
        "calendar.subtitle": "บันทึกกิจกรรมประจำวันและจัดการตารางเวลาของคุณ",
        "calendar.month": "เดือน",
        "calendar.working_day": "วันทำงาน",
        "calendar.holiday": "วันหยุด",
        "calendar.schedule": "ตารางงาน",
        "calendar.pick_date": "เลือกวันที่",
        "calendar.daily_progress": "ความคืบหน้า",
        "calendar.full": "ครบ",
        "calendar.work": "งาน",
        "calendar.dialog.title": "บันทึกประจำวัน",
        "calendar.dialog.edit": "แก้ไขรายการ",
        "calendar.dialog.total_hours": "รวมชั่วโมง",
        "calendar.dialog.recorded": "รายการที่บันทึกแล้ว",
        "calendar.dialog.add": "เพิ่มรายการใหม่",
        "calendar.dialog.project": "โครงการ",
        "calendar.dialog.select_project": "เลือกโครงการ",
        "calendar.dialog.search_project": "ค้นหาโครงการ...",
        "calendar.dialog.no_project": "ไม่พบโครงการ",
        "calendar.dialog.hours": "ชั่วโมง",
        "calendar.dialog.repeat": "ทำซ้ำ",
        "calendar.dialog.repeat.none": "ครั้งเดียว",
        "calendar.dialog.repeat.weekly": "ทุกวันจนถึงสิ้นสัปดาห์ (ศุกร์)",
        "calendar.dialog.repeat.monthly": "ทุกวันจนถึงสิ้นเดือน",
        "calendar.dialog.description": "รายละเอียด",
        "calendar.dialog.placeholder": "คุณทำอะไรไปบ้าง?",
        "calendar.dialog.close": "ปิด",
        "calendar.dialog.log": "บันทึกงาน",
        "calendar.dialog.save": "บันทึกการแก้ไข",
        "calendar.empty": "ว่าง",
        "calendar.nothing_recorded": "ไม่มีการบันทึก",

        // Reports
        "reports.title": "รายงานขั้นสูง",
        "reports.subtitle": "วิเคราะห์บันทึกเวลาอย่างแม่นยำ",
        "reports.export": "ส่งออก",
        "reports.load": "โหลดข้อมูล",
        "reports.month": "เดือน",
        "reports.user": "ผู้ใช้",
        "reports.all_users": "ผู้ใช้ทั้งหมด",
        "reports.select_user": "เลือกผู้ใช้",
        "reports.search_user": "ค้นหาผู้ใช้...",
        "reports.no_user": "ไม่พบผู้ใช้",
        "reports.project": "โครงการ",
        "reports.all_projects": "โครงการทั้งหมด",
        "reports.select_project": "เลือกโครงการ",
        "reports.search_project": "ค้นหาโครงการ...",
        "reports.no_project": "ไม่พบโครงการ",
        "reports.quick_find": "ค้นหาด่วน",
        "reports.search_placeholder": "พิมพ์เพื่อค้นหา รายละเอียด, ผู้ใช้, หรือโครงการ...",
        "reports.daily_logs": "บันทึกรายวัน",
        "reports.summary": "สรุปตามโครงการ",
        "reports.found": "พบ",
        "reports.records": "รายการ",
        "reports.groups": "กลุ่ม",
        "reports.total_hours": "รวมชั่วโมง",
        "reports.table.date": "วันที่",
        "reports.table.employee": "พนักงาน",
        "reports.table.project_code": "รหัสโครงการ",
        "reports.table.project_name": "ชื่อโครงการ",
        "reports.table.description": "รายละเอียด",
        "reports.table.hours": "ชั่วโมง",
        "reports.table.total": "รวมชั่วโมง",
        "reports.no_records": "ไม่พบข้อมูลที่ตรงกัน",
        "reports.rows_per_page": "แถวต่อหน้า",
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("en")

    // Load saved language
    useEffect(() => {
        const saved = localStorage.getItem("app-language") as Language
        if (saved && (saved === "en" || saved === "th")) {
            setLanguage(saved)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem("app-language", lang)
    }

    const t = (key: string) => {
        return translations[language][key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
