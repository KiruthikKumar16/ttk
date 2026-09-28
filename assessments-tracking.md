# Assessments Tracking

## Overview
Added assessments tracking functionality to manage assessments (tests, exams, etc.) and record student results.

## Database Changes
- Created `assessments` table with:
  - `id` (UUID primary key)
  - `course_id` (references courses)
  - `title` (assessment title)
  - `max_score` (maximum possible score)
  - `assessment_date` (date of assessment)
  - `created_by` (references profiles)
  - `created_at` (timestamp)
- Created `assessment_results` table with:
  - `id` (UUID primary key)
  - `assessment_id` (references assessments)
  - `student_id` (references students)
  - `score` (numeric score, must be >= 0)
  - `remarks` (optional remarks)
  - `graded_by` (references profiles)
  - `graded_at` (timestamp)
  - Unique constraint on (assessment_id, student_id) to prevent duplicate entries for the same student and assessment
- Added Row Level Security policies:
  - Staff, admin, and trainer can create/select/update/delete assessments and assessment results
- Added trigger function to validate that score <= assessment.max_score before inserting or updating assessment results

## API
- `GET /api/assessments` - Fetch assessments with filtering options:
  - `courseId`: Filter by course ID
  - `limit`: Number of records to return (default 50)
  - `offset`: Offset for pagination
- `POST /api/assessments` - Create a new assessment:
  - Requires authentication
  - Validates course existence and user permissions (staff, admin, or trainer)
- `GET /api/assessments/[id]/results` - Fetch results for a specific assessment with pagination:
  - `limit`: Number of records to return (default 50)
  - `offset`: Offset for pagination
- `POST /api/assessments/[id]/results` - Create or update a result for a student in a specific assessment (upsert on unique constraint):
  - Requires authentication
  - Validates assessment and student existence
  - Validates user permissions (staff, admin, or trainer)
  - Validates that score <= assessment.max_score (both early validation and database trigger)

## Components
- `<Assessments />` - Main assessments management component with:
  - Form to create new assessments (course, title, max score, date)
  - List of assessments with filtering by course
  - For each assessment, a button to view/enter results
  - Assessment results view:
    - Form to enter results for a student (student selection, score, remarks)
    - List of results for the assessment with student details, score, percentage, remarks, grader info, and date
    - Buttons to edit/delete individual results
- Accessible from:
  - Sidebar navigation (Assessments item)
  - Can be viewed programmatically by setting view to 'Assessments'

## Usage
1. Navigate to the Assessments view via the sidebar or by setting view to 'Assessments'
2. To create a new assessment:
   - Select a course
   - Enter title, max score, and assessment date
   - Click "Create Assessment"
3. To view/enter results for an assessment:
   - Click the "View Results" button on an assessment in the list
   - In the results view, select a student, enter score and optional remarks, then click "Save Result"
   - View the list of existing results for the assessment
   - Use the edit/delete buttons on individual results to modify or remove them

## Notes
- Trainer permissions currently allow managing assessments and results for any course (follow-up needed to restrict to assigned courses once course ownership/assignment concept is implemented)
- The assessment_results table uses a unique constraint to prevent duplicate entries for the same student and assessment - saving a result for the same student and assessment updates the existing record instead of creating a duplicate
- The database trigger ensures that score cannot exceed the assessment's max_score, providing an additional layer of validation beyond the API validation