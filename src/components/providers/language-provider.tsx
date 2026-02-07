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
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.search": "Search...",
        "common.all": "All",
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
        "assign.search": "Search assignments...",
        "assign.loading": "Loading resources...",
        "assign.no_match": "No matching assignments found.",

        // Admin Projects
        "proj.title": "Project Catalog",
        "proj.subtitle": "Manage and monitor all active development projects",
        "proj.add": "Add Project",
        "proj.total": "Total Projects",
        "proj.search": "Search projects...",
        "proj.table.code": "Code",
        "proj.table.name": "Project Name",
        "proj.table.timeline": "Timeline",
        "proj.table.budget": "Budget",
        "proj.dialog.add": "Launch New Project",
        "proj.dialog.edit": "Edit Project Details",
        "proj.form.code": "Project Code",
        "proj.form.budget": "Budget Allocation",
        "proj.form.name": "Project Name",
        "proj.form.start": "Start Date",
        "proj.form.end": "End Date",
        "proj.save": "Save Project",

        // Dashboard
        "dash.title": "Dashboard",
        "dash.subtitle": "Overview",
        "dash.welcome": "Welcome back,",
        "dash.desc.manager": "Here's what's happening with your team.",
        "dash.desc.user": "Here's what's happening with your work.",
        "dash.hours.team": "Team Hours (This Month)",
        "dash.hours.user": "My Hours (This Month)",
        "dash.growth.up": "from last month",
        "dash.growth.down": "from last month",
        "dash.projects.title": "Active Projects",
        "dash.projects.desc": "Projects with logged time this month",
        "dash.capacity.title": "Monthly Capacity",
        "dash.complete": "Complete",
        "dash.remaining": "Remaining",
        "dash.top_projects": "Top Projects",
        "dash.top_projects.desc": "Most time consumed this month",
        "dash.recent": "Recent Activity",
        "dash.recent.desc.manager": "Latest logs from your team",
        "dash.recent.desc.user": "Latest logs from you",
        "dash.no_activity": "No activity recorded yet.",
        "dash.no_logs": "No recent logs.",
        "dash.logged": "LOGGED",

        // Nav
        "nav.dashboard": "Dashboard",
        "nav.calendar": "My Calendar",
        "nav.reports": "Reports",
        "nav.admin": "Admin",
        "nav.profile": "Profile",

        // Login
        "login.subtitle": "Access your workspace to track productivity",
        "login.user": "User Login",
        "login.pass": "Password",
        "login.btn": "Sign In",
        "login.welcome": "Welcome back!",
        "login.fail": "Login failed",
        "login.fail_desc": "Invalid User Login or Password",

        // Calendar
        "cal.title": "Time Tracker",
        "cal.subtitle": "Log your daily activities and manage your schedule",
        "cal.legend.work": "Working Day",
        "cal.legend.holiday": "Holiday",
        "cal.schedule": "Schedule",
        "cal.pick_date": "Pick Date",
        "cal.total_hours": "Total Hours",
        "cal.recorded": "Recorded Entries",
        "cal.add_new": "Add New Entry",
        "cal.project": "Project",
        "cal.select_project": "Select Project",
        "cal.hours": "Hours",
        "cal.repeat": "Repeat",
        "cal.repeat.none": "One Time Only",
        "cal.repeat.weekly": "Daily until End of Week (Fri)",
        "cal.repeat.monthly": "Daily until End of Month",
        "cal.desc": "Description",
        "cal.placeholder.desc": "What did you work on?",
        "cal.close": "Close",
        "cal.save": "Save Changes",
        "cal.log_work": "Log Work",
        "cal.edit_title": "Edit Entry",
        "cal.log_title": "Daily Log",
        "cal.progress": "Daily Progress",
        "cal.full": "Full",
        "cal.work": "Work",
        "cal.empty": "Nothing Recorded",
        "cal.empty_sub": "No activity recorded for this day",
        "cal.empty_list": "Empty",
        "cal.delete_confirm": "Are you sure you want to delete this entry?",
        "cal.delete_success": "Entry deleted",
        "cal.update_success": "Entry updated",
        "cal.create_success": "Logged time successfully",
        "cal.error.fill": "Please fill in all fields",
        "cal.error.no_days": "No valid working days in selected range",
        "cal.no_project": "No project found",

        // Status
        "status.enable": "Enable",
        "status.disable": "Disable",

        // Team View
        "team.title": "Team Overview",
        "team.capacity": "Monthly Capacity Status",
        "team.activity": "Filtered Activity Log",
        "filter.user": "Filter by User",
        "filter.project": "Filter by Project",
        "common.users": "Users",
        "common.entries": "Entries",
    },
    th: {
        // General
        "app.title": "ระบบลงเวลาทำงาน",
        "common.cancel": "ยกเลิก",
        "common.save": "บันทึก",
        "common.delete": "ลบ",
        "common.edit": "แก้ไข",
        "common.search": "ค้นหา...",
        "common.all": "ทั้งหมด",
        "common.actions": "การจัดการ",
        "common.loading": "กำลังโหลด...",

        // Nav
        "nav.dashboard": "แดชบอร์ด",
        "nav.calendar": "ปฏิทินของฉัน",
        "nav.reports": "รายงาน",
        "nav.admin": "ผู้ดูแลระบบ",
        "nav.profile": "โปรไฟล์",

        // Login
        "login.subtitle": "เข้าสู่พื้นที่ทำงานเพื่อติดตามผลงานของคุณ",
        "login.user": "ชื่อผู้ใช้",
        "login.pass": "รหัสผ่าน",
        "login.btn": "เข้าสู่ระบบ",
        "login.welcome": "ยินดีต้อนรับกลับ!",
        "login.fail": "เข้าสู่ระบบไม่สำเร็จ",
        "login.fail_desc": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",

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
        "assign.search": "ค้นหารายการ...",
        "assign.loading": "กำลังโหลดข้อมูล...",
        "assign.no_match": "ไม่พบรายการที่ตรงกัน",

        // Admin Projects
        "proj.title": "แคตตาล็อกโครงการ",
        "proj.subtitle": "จัดการและติดตามโครงการพัฒนาที่กำลังดำเนินการทั้งหมด",
        "proj.add": "เพิ่มโครงการ",
        "proj.total": "โครงการทั้งหมด",
        "proj.search": "ค้นหาโครงการ...",
        "proj.table.code": "รหัส",
        "proj.table.name": "ชื่อโครงการ",
        "proj.table.timeline": "ระยะเวลา",
        "proj.table.budget": "งบประมาณ",
        "proj.dialog.add": "เริ่มโครงการใหม่",
        "proj.dialog.edit": "แก้ไขรายละเอียดโครงการ",
        "proj.form.code": "รหัสโครงการ",
        "proj.form.budget": "งบประมาณที่จัดสรร",
        "proj.form.name": "ชื่อโครงการ",
        "proj.form.start": "วันที่เริ่มต้น",
        "proj.form.end": "วันที่สิ้นสุด",
        "proj.save": "บันทึกโครงการ",

        // Calendar
        "cal.title": "บันทึกเวลาทำงาน",
        "cal.subtitle": "จดบันทึกกิจกรรมประจำวันและจัดการตารางเวลาของคุณ",
        "cal.legend.work": "วันทำงาน",
        "cal.legend.holiday": "วันหยุด",
        "cal.schedule": "ตารางงาน",
        "cal.pick_date": "เลือกวันที่",
        "cal.total_hours": "ชั่วโมงรวม",
        "cal.recorded": "รายการที่บันทึก",
        "cal.add_new": "เพิ่มรายการใหม่",
        "cal.project": "โครงการ",
        "cal.select_project": "เลือกโครงการ",
        "cal.hours": "ชั่วโมง",
        "cal.repeat": "ทำซ้ำ",
        "cal.repeat.none": "ครั้งเดียว",
        "cal.repeat.weekly": "ทุกวันจนสิ้นสัปดาห์ (ศุกร์)",
        "cal.repeat.monthly": "ทุกวันจนสิ้นเดือน",
        "cal.desc": "รายละเอียด",
        "cal.placeholder.desc": "คุณทำอะไรไปบ้าง?",
        "cal.close": "ปิด",
        "cal.save": "บันทึกการเปลี่ยนแปลง",
        "cal.log_work": "บันทึกงาน",
        "cal.edit_title": "แก้ไขรายการ",
        "cal.log_title": "บันทึกประจำวัน",
        "cal.progress": "ความคืบหน้าประจำวัน",
        "cal.full": "เต็ม",
        "cal.work": "งาน",
        "cal.empty": "ไม่มีบันทึก",
        "cal.empty_sub": "ไม่มีกิจกรรมที่บันทึกไว้สำหรับวันนี้",
        "cal.empty_list": "ว่างเปล่า",
        "cal.delete_confirm": "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
        "cal.delete_success": "ลบรายการเรียบร้อยแล้ว",
        "cal.update_success": "อัปเดตรายการเรียบร้อยแล้ว",
        "cal.create_success": "บันทึกเวลาเรียบร้อยแล้ว",
        "cal.error.fill": "กรุณากรอกข้อมูลให้ครบถ้วน",
        "cal.error.no_days": "ไม่มีวันทำงานในช่วงที่เลือก",
        "cal.no_project": "ไม่พบโปรเจกต์",

        // Dashboard
        "dash.title": "แดชบอร์ด",
        "dash.subtitle": "ภาพรวม",
        "dash.welcome": "ยินดีต้อนรับกลับ,",
        "dash.desc.manager": "นี่คือความเคลื่อนไหวของทีมคุณ",
        "dash.desc.user": "นี่คือความเคลื่อนไหวของการทำงานของคุณ",
        "dash.hours.team": "ชั่วโมงทำงานทีม (เดือนนี้)",
        "dash.hours.user": "ชั่วโมงทำงานฉัน (เดือนนี้)",
        "dash.growth.up": "เพิ่มขึ้นจากเดือนก่อน",
        "dash.growth.down": "ลดลงจากเดือนก่อน",
        "dash.projects.title": "โครงการที่ทำอยู่",
        "dash.projects.desc": "โครงการที่มีการลงเวลาในเดือนนี้",
        "dash.capacity.title": "ความจุรายเดือน",
        "dash.complete": "เสร็จสิ้น",
        "dash.remaining": "คงเหลือ",
        "dash.top_projects": "โครงการยอดนิยม",
        "dash.top_projects.desc": "ใช้เวลามากที่สุดในเดือนนี้",
        "dash.recent": "กิจกรรมล่าสุด",
        "dash.recent.desc.manager": "บันทึกล่าสุดจากทีมของคุณ",
        "dash.recent.desc.user": "บันทึกล่าสุดจากคุณ",
        "dash.no_activity": "ยังไม่มีกิจกรรม",
        "dash.no_logs": "ไม่มีบันทึกล่าสุด",
        "dash.logged": "ลงเวลาแล้ว",

        // Status
        "status.enable": "เปิดใช้งาน",
        "status.disable": "ปิดใช้งาน",

        // Team View
        "team.title": "ภาพรวมทีม",
        "team.capacity": "สถานะความจุรายเดือน",
        "team.activity": "บันทึกกิจกรรมที่กรอง",
        "filter.user": "กรองตามผู้ใช้",
        "filter.project": "กรองตามโครงการ",
        "common.users": "ผู้ใช้",
        "common.entries": "รายการ",
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
