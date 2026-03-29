

# School Management System - Implementation Plan

This is a large feature set. Here is a phased plan covering database changes, new pages, and UI improvements.

## Database Changes (Migration)

Create three new tables:

1. **`employees`** - Store employee records managed by admin
   - `id` (uuid, PK), `user_id` (uuid, nullable - linked if they have an account), `full_name` (text), `email` (text), `phone` (text, nullable), `role` (text: teacher/staff/admin), `department` (text, nullable), `position` (text, nullable), `status` (text: active/inactive), `hire_date` (date), `created_at`, `updated_at`
   - RLS: Admin can manage all; employees can read own record

2. **`attendance`** - Track employee attendance
   - `id` (uuid, PK), `employee_id` (uuid, FK to employees), `date` (date), `status` (text: present/absent/late/excused), `check_in` (timestamptz, nullable), `check_out` (timestamptz, nullable), `notes` (text, nullable), `created_at`
   - RLS: Admin can manage all; employees can read own attendance

3. **`leave_requests`** - Employee leave management
   - `id` (uuid, PK), `employee_id` (uuid, FK to employees), `user_id` (uuid - the requester), `leave_type` (text: sick/personal/vacation), `start_date` (date), `end_date` (date), `reason` (text), `status` (text: pending/approved/rejected), `admin_notes` (text, nullable), `reviewed_by` (uuid, nullable), `created_at`, `updated_at`
   - RLS: Admin can manage all; employees can read/insert own requests

Also add an **`announcements`** table:
   - `id` (uuid, PK), `title` (text), `content` (text), `author_id` (uuid), `target_audience` (text: all/teachers/staff/students), `is_pinned` (boolean), `status` (text: published/draft), `created_at`, `updated_at`
   - RLS: Admin can manage all; authenticated users can read published announcements

## New Pages & Components

### 1. Employee Management (Admin)
- Add an "Employees" tab to `AdminDashboard.tsx`
- CRUD dialog for adding/editing employees (name, email, role, department, position, hire date)
- Table listing all employees with search/filter
- Ability to assign roles and deactivate employees

### 2. Leave Management (Admin)
- Add a "Leave Requests" tab to `AdminDashboard.tsx`
- View pending/approved/rejected requests in a table
- Approve/reject buttons with optional admin notes

### 3. Attendance Management (Admin)
- Add an "Attendance" tab to `AdminDashboard.tsx`
- Date picker to view attendance for a specific day
- Mark attendance for employees (present/absent/late)
- View attendance history with filters

### 4. Announcements (Admin)
- Add an "Announcements" tab to `AdminDashboard.tsx`
- Create/edit/delete announcements with target audience selection

### 5. Employee Portal (Teacher Dashboard)
- Add tabs to `TeacherDashboard.tsx` for:
  - **My Attendance**: View personal attendance history
  - **Leave Requests**: Submit new leave requests, view status of existing ones
  - **Announcements**: View published announcements

### 6. Student Announcements
- Add an "Announcements" section to `StudentDashboard.tsx`
- Show announcements targeted at "all" or "students"

## Homepage Improvements
- Add an announcements carousel/banner section to `LandingPage.tsx`
- Add school logo prominently (currently uses a gradient icon - keep or replace)
- Add an "Announcements" section showing pinned/recent announcements

## UI/UX Improvements

### Responsive & Mobile
- Audit all dashboard pages for mobile breakpoints (current viewport is 360px)
- Ensure tables use horizontal scroll on mobile
- Make stat cards stack properly on small screens
- Improve touch targets for mobile buttons

### Dark Mode
- A dark mode toggle button in the Navbar (the CSS variables for `.dark` already exist but there's no toggle)
- Persist preference in localStorage

### General Polish
- Consistent card styling across all dashboards
- Better loading states with skeleton components
- Improved typography hierarchy
- Clean button styles with consistent sizing

## Routing Updates
- No new standalone pages needed; features are added as tabs within existing dashboards
- The admin dashboard will have tabs: Posts, Employees, Attendance, Leave Requests, Announcements

## Technical Details

**Files to create:**
- None (all features integrated into existing pages)

**Files to modify:**
- `src/pages/AdminDashboard.tsx` - Add employee, attendance, leave, announcements management tabs
- `src/pages/TeacherDashboard.tsx` - Add attendance, leave, announcements tabs
- `src/pages/StudentDashboard.tsx` - Add announcements section
- `src/pages/LandingPage.tsx` - Add announcements section, improve hero
- `src/components/Navbar.tsx` - Add dark mode toggle
- `src/index.css` - Minor polish if needed

**Migration:** One SQL migration creating 4 tables (employees, attendance, leave_requests, announcements) with RLS policies and enabling Realtime for leave_requests.

