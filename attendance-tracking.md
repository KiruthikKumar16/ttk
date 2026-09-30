# Attendance Tracking

## Overview

Added attendance tracking functionality to monitor student attendance across courses and sessions.

## Database Changes

- Created `attendance` table with:
  - `id` (UUID primary key)
  - `student_id` (references students)
  - `course_id` (references courses)
  - `session_date` (date)
  - `status` (Present/Absent/Late/Excused)
  - `marked_by` (references profiles)
  - `created_at` (timestamp)
  - Unique constraint on (student_id, course_id, session_date) to prevent duplicate entries for same day/course/student
- Added Row Level Security policies:
  - Staff and admin can insert/select attendance records
  - Trainers can insert/select attendance records (with follow-up needed for course-specific assignments once course ownership concept is implemented)

## API

- `GET /api/attendance` - Fetch attendance records with filtering options:
  - `studentId`: Filter by student ID
  - `courseId`: Filter by course ID
  - `startDate`: Filter by start date (inclusive)
  - `endDate`: Filter by end date (inclusive)
  - `limit`: Number of records to return (default 50)
  - `offset`: Offset for pagination
- `POST /api/attendance` - Mark or update attendance (upsert on unique constraint):
  - Requires authentication
  - Validates student and course existence
  - Checks permissions (staff, admin, or trainer)
  - Inserts new record or updates existing one for same student/course/date

## Components

- `<Attendance />` - Main attendance viewing component with:
  - Filtering by student ID, course ID, date range
  - Pagination
  - Visual status badges (Present/Absent/Late/Excused)
  - Details about who marked the attendance
- Accessible from:
  - Student detail page (via "Attendance" button in header)
  - Course level view (to be implemented)

## Usage

1. Navigate to a student's detail page
2. Click the "Attendance" button in the header
3. View attendance records for that student (or use filters to see broader data)
4. To mark attendance for a student, use the POST /api/attendance endpoint or future UI integration

## Notes

- Trainer permissions currently allow marking attendance for any course (follow-up needed to restrict to assigned courses once course ownership/assignment concept is implemented)
- The attendance table uses a unique constraint to prevent duplicate entries for the same student on the same course on the same day - re-marking updates the existing record instead of creating a duplicate
