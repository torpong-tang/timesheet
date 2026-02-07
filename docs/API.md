# Timesheet API Documentation

## Overview

This document describes the Server Actions API for the Timesheet application.

**Base URL:** `http://localhost:3000`  
**Authentication:** NextAuth.js Session-based

---

## Authentication

### Login
**Endpoint:** `POST /api/auth/signin`

**Request Body:**
```json
{
  "userlogin": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "userlogin": "string",
    "name": "string",
    "role": "ADMIN | GM | PM | DEV",
    "email": "string"
  }
}
```

---

## Server Actions

### Timesheet Actions (`src/app/actions.ts`)

#### `getProjects()`
Get all projects assigned to the current user.

**Returns:**
```typescript
Project[] | { error: string }

interface Project {
  id: string
  code: string
  name: string
  startDate: Date
  endDate: Date
  budget: number
}
```

---

#### `getTimesheetEntries(startDate: Date, endDate: Date)`
Get timesheet entries for the current user within a date range.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| startDate | Date | Start of date range |
| endDate | Date | End of date range |

**Returns:**
```typescript
TimesheetEntry[]

interface TimesheetEntry {
  id: string
  date: Date
  hours: number
  description: string
  projectId: string
  project: {
    id: string
    code: string
    name: string
  }
}
```

---

#### `createTimesheetEntry(data: TimesheetEntryInput)`
Create a new timesheet entry.

**Parameters:**
```typescript
interface TimesheetEntryInput {
  date: Date
  hours: number          // 0.5 to 7.0, step 0.5
  description: string
  projectId: string
}
```

**Validation Rules:**
- Hours must be between 0.5 and 7.0
- Hours must be in 0.5 increments
- Total hours per day cannot exceed 7.0
- Cannot log time on weekends or holidays

**Returns:**
```typescript
{ success: true, entry: TimesheetEntry } | { error: string }
```

---

#### `updateTimesheetEntry(id: string, data: Partial<TimesheetEntryInput>)`
Update an existing timesheet entry.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Entry ID |
| data | object | Fields to update |

**Returns:**
```typescript
{ success: true, entry: TimesheetEntry } | { error: string }
```

---

#### `deleteTimesheetEntry(id: string)`
Delete a timesheet entry.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| id | string | Entry ID |

**Returns:**
```typescript
{ success: true } | { error: string }
```

---

#### `createRecurringEntries(data: RecurringEntryInput)`
Create recurring timesheet entries.

**Parameters:**
```typescript
interface RecurringEntryInput {
  startDate: Date
  endDate: Date
  hours: number
  description: string
  projectId: string
  frequency: 'daily' | 'weekly' | 'monthly'
}
```

**Returns:**
```typescript
{ success: true, count: number } | { error: string }
```

---

### Dashboard Actions (`src/app/dashboard-actions.ts`)

#### `getDashboardStats()`
Get dashboard statistics for the current user.

**Returns:**
```typescript
interface DashboardStats {
  totalHoursThisMonth: number
  workableDays: number
  workableHours: number
  remainingHours: number
  recentEntries: TimesheetEntry[]
}
```

---

#### `getTeamOverview(userId?: string)`
Get team overview data (GM/PM only).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| userId | string? | Optional user filter |

**Returns:**
```typescript
interface TeamOverview {
  users: TeamMember[]
  totalHours: number
  averageHours: number
}

interface TeamMember {
  id: string
  name: string
  role: Role
  hoursThisMonth: number
  lastEntry: Date
}
```

---

### Admin Actions (`src/app/admin-actions.ts`)

#### `getUsers(page?: number, pageSize?: number)`
Get paginated list of users (Admin only).

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | number | 1 | Page number |
| pageSize | number | 10 | Items per page |

**Returns:**
```typescript
interface PaginatedUsers {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

#### `createUser(data: UserInput)`
Create a new user (Admin only).

**Parameters:**
```typescript
interface UserInput {
  userlogin: string
  email: string
  password: string
  name: string
  role: 'ADMIN' | 'GM' | 'PM' | 'DEV'
}
```

**Returns:**
```typescript
{ success: true, user: User } | { error: string }
```

---

#### `updateUser(id: string, data: Partial<UserInput>)`
Update a user (Admin only).

---

#### `toggleUserStatus(id: string)`
Enable/Disable a user (Admin only).

---

#### `getProjects(page?: number)`
Get paginated list of projects (Admin only).

---

#### `createProject(data: ProjectInput)`
Create a new project (Admin only).

```typescript
interface ProjectInput {
  code: string
  name: string
  startDate: Date
  endDate: Date
  budget: number
}
```

---

#### `assignUserToProject(userId: string, projectId: string)`
Assign a user to a project (Admin only).

---

#### `removeUserFromProject(userId: string, projectId: string)`
Remove a user from a project (Admin only).

---

#### `getHolidays(year?: number)`
Get holidays for a year (Admin only).

---

#### `createHoliday(data: HolidayInput)`
Create a new holiday (Admin only).

```typescript
interface HolidayInput {
  date: Date
  name: string
}
```

---

#### `getAuditLogs(page?: number, userId?: string)`
Get audit logs (Admin only).

---

### Report Actions (`src/app/report-actions.ts`)

#### `getTimesheetReport(filters: ReportFilters)`
Generate timesheet report.

**Parameters:**
```typescript
interface ReportFilters {
  startDate: Date
  endDate: Date
  userId?: string
  projectId?: string
}
```

**Returns:**
```typescript
interface TimesheetReport {
  entries: TimesheetEntry[]
  summary: {
    totalHours: number
    byProject: { projectId: string; projectName: string; hours: number }[]
    byUser: { userId: string; userName: string; hours: number }[]
  }
}
```

---

#### `exportToExcel(filters: ReportFilters)`
Export report to Excel file.

**Returns:** Excel file buffer

---

## Data Models

### User
```typescript
interface User {
  id: string
  userlogin: string
  email: string
  name: string
  role: 'ADMIN' | 'GM' | 'PM' | 'DEV'
  status: 'Enable' | 'Disable'
  image?: string
  createdAt: Date
  updatedAt: Date
}
```

### Project
```typescript
interface Project {
  id: string
  code: string
  name: string
  startDate: Date
  endDate: Date
  budget: number
  createdAt: Date
  updatedAt: Date
}
```

### TimesheetEntry
```typescript
interface TimesheetEntry {
  id: string
  date: Date
  hours: number
  description: string
  userId: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}
```

### Holiday
```typescript
interface Holiday {
  id: string
  date: Date
  name: string
  year: number
}
```

### AuditLog
```typescript
interface AuditLog {
  id: string
  action: string
  details?: string
  userId: string
  timestamp: Date
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `FORBIDDEN` | User lacks permission |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `DUPLICATE_ENTRY` | Unique constraint violation |
| `HOURS_EXCEEDED` | Daily hours limit exceeded |
| `WEEKEND_HOLIDAY` | Cannot log on weekend/holiday |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production.

---

## Changelog

### v0.1.0 (2026-02-08)
- Initial API documentation
- Server Actions based API
- NextAuth.js authentication
