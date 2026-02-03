Timesheet System Implementation Plan
This plan documents the architecture and development steps for the Timesheet application.

User Review Required
NOTE

Database: Using MySQL. You will need a running MySQL instance. I will configure Prisma to connect via DATABASE_URL. Images: Profile pictures will be stored in the local public/imgs folder.

Tech Stack
Framework: Next.js 14+ (App Router)
Language: TypeScript
Database: MySQL
ORM: Prisma
UI: Tailwind CSS + Shadcn UI (Calendar, Dialog, Select, Avatar)
Auth: NextAuth.js (Custom Credentials with userlogin field)
Database Schema (Prisma)
Refined to match specific field requirements.

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
enum Role {
  ADMIN
  GM
  PM
  DEV
}
model User {
  id          String    @id @default(uuid())
  userlogin   String    @unique // Support login by 'Torpong.T'
  email       String    @unique
  password    String
  name        String
  role        Role      @default(DEV)
  image       String?   // Stored as relative path e.g. "/imgs/profile_123.jpg"
  
  // Relations
  assignments ProjectAssignment[]
  timesheets  TimesheetEntry[]
  auditLogs   AuditLog[]
}
model Project {
  id          String   @id @default(cuid())
  code        String   @unique // e.g. STW02S6
  name        String
  startDate   DateTime
  endDate     DateTime
  budget      Float
  
  assignments ProjectAssignment[]
  timesheets  TimesheetEntry[]
}
model ProjectAssignment {
  id        String @id @default(cuid())
  userId    String
  projectId String
  
  user      User    @relation(fields: [userId], references: [id])
  project   Project @relation(fields: [projectId], references: [id])
  @@unique([userId, projectId])
}
model TimesheetEntry {
  id          String   @id @default(cuid())
  date        DateTime
  hours       Float    // Validated 0.5 to 7.0 step 0.5
  description String
  
  userId      String
  projectId   String
  user        User     @relation(fields: [userId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt // For lock logic check
}
model Holiday {
  id    String   @id @default(cuid())
  date  DateTime @unique
  name  String
  year  Int
}
model AuditLog {
  id        String   @id @default(cuid())
  action    String
  details   String?
  userId    String
  timestamp DateTime @default(now())
}
Proposed Changes
1. Initialization
Initialize Next.js in /timesheet.
Configure public/imgs for static serving.
Setup Prisma/SQLite.
2. UI & Design System
Theme: Glassmorphism aesthetic.
Use translucent backgrounds (bg-white/30, backdrop-blur-md).
Palette: Orange (Primary/Highlights) and Blue (Secondary/Accents).
Calendar Colors:
Orange: Weekends & Holidays (Background/Text).
Yellow: Current date (Circle/Highlight).
Blue/Glass: Normal working days.
3. Business Logic Implementation
Time Validation:
Input: Dropdown [0.5, 1.0, ..., 7.0].
Constraint: SUM(daily_hours) <= 7 (Hard limit: Cannot exceed 7).
Requirement: Users are expected/forced to log exactly 7 hours total per working day (can be split across multiple projects).
Locking Logic:
IF (Today > EndOfMonth(EntryDate) + 5 Days) THEN Edit/Delete = BLOCKED.
Role Filtering:
GM: View all.
PM: View projects they are assigned to (as manager).
Dev: View assigned projects only.
4. Admin & Master Data
CRUD pages for Users, Projects, Holidays.
Image upload handler (save to disk).
5. Reporting
"Export to Excel" button using exceljs.
Calculation: WorkableHours = (DaysInMonth - Weekends - Holidays) * 7.
Verification Plan
Validation Test: Try to input 7.5 hours (should be impossible via UI).
Lock Test: Set system date to future, try to edit old entry.
Role Test: Login as Dev, check if restricted projects are hidden.
Visual Test: Verify Orange weekends and Yellow "Today" circle.