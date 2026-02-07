-- Database Indexes Script for Timesheet Application
-- Run this script to add performance indexes to the database
-- Note: Some indexes may already exist from Prisma schema

-- ============================================
-- USER TABLE INDEXES
-- ============================================
-- For filtering users by role (Team Overview, Admin)
-- CREATE INDEX User_role_idx ON User(role);
-- For filtering enabled/disabled users
-- CREATE INDEX User_status_idx ON User(status);
-- For searching users by name
-- CREATE INDEX User_name_idx ON User(name);
-- For sorting by creation date
-- CREATE INDEX User_createdAt_idx ON User(createdAt);

-- ============================================
-- PROJECT TABLE INDEXES
-- ============================================
-- For searching projects by name
-- CREATE INDEX Project_name_idx ON Project(name);
-- For filtering by date range
-- CREATE INDEX Project_startDate_idx ON Project(startDate);
-- CREATE INDEX Project_endDate_idx ON Project(endDate);
-- CREATE INDEX Project_dateRange_idx ON Project(startDate, endDate);

-- ============================================
-- PROJECT ASSIGNMENT TABLE INDEXES
-- ============================================
-- For getting all projects for a user
-- CREATE INDEX ProjectAssignment_userId_idx ON ProjectAssignment(userId);
-- For getting all users for a project
-- CREATE INDEX ProjectAssignment_projectId_idx ON ProjectAssignment(projectId);

-- ============================================
-- TIMESHEET ENTRY TABLE INDEXES
-- ============================================
-- Composite index for user and date (most common query)
-- CREATE INDEX TimesheetEntry_userId_date_idx ON TimesheetEntry(userId, date);
-- For getting all entries for a user
-- CREATE INDEX TimesheetEntry_userId_idx ON TimesheetEntry(userId);
-- For getting all entries for a project
-- CREATE INDEX TimesheetEntry_projectId_idx ON TimesheetEntry(projectId);
-- For getting all entries on a date
-- CREATE INDEX TimesheetEntry_date_idx ON TimesheetEntry(date);
-- For user+project queries
-- CREATE INDEX TimesheetEntry_userProject_idx ON TimesheetEntry(userId, projectId);
-- For complex report queries
-- CREATE INDEX TimesheetEntry_userDateProject_idx ON TimesheetEntry(userId, date, projectId);
-- For sorting by creation date
-- CREATE INDEX TimesheetEntry_createdAt_idx ON TimesheetEntry(createdAt);

-- ============================================
-- HOLIDAY TABLE INDEXES
-- ============================================
-- For getting holidays by year
-- CREATE INDEX Holiday_year_idx ON Holiday(year);
-- For getting holidays in a year sorted by date
-- CREATE INDEX Holiday_yearDate_idx ON Holiday(year, date);

-- ============================================
-- AUDIT LOG TABLE INDEXES
-- ============================================
-- For getting logs for a user
-- CREATE INDEX AuditLog_userId_idx ON AuditLog(userId);
-- For filtering by action type
-- CREATE INDEX AuditLog_action_idx ON AuditLog(action);
-- For sorting by timestamp (recent logs)
-- CREATE INDEX AuditLog_timestamp_idx ON AuditLog(timestamp);
-- For getting user logs sorted by time
-- CREATE INDEX AuditLog_userTimestamp_idx ON AuditLog(userId, timestamp);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- To verify indexes exist:
SHOW INDEX FROM User;
SHOW INDEX FROM Project;
SHOW INDEX FROM ProjectAssignment;
SHOW INDEX FROM TimesheetEntry;
SHOW INDEX FROM Holiday;
SHOW INDEX FROM AuditLog;
