
intel :
0953 f3e4 159b 5e97

## done 
- Implemented Attendance Device Sync (SDK DB as source of truth)
- Refactored single user sync API to use non-blocking background queue and removed 409 errors
- Created bulk sync API (`/api/v1/users/bulk`) for syncing multiple users at once
- Updated iClock push handler to reject unknown users and only accept biometrics for existing users
- Built Reconciliation Cron Job running every 6 hours to ensure devices mirror SDK DB
- Added real-time sync status badges to the Frontend Student Details page
- Added "Sync Selected" and "Sync Displayed" bulk actions to the Frontend Students List page
- Added colored Sync Status dots (Green/Yellow/Gray) and individual row "Sync" actions to the Students List table
- Added "Timetable / Shift" selection to the Student Admission form to set defaultTimetableId directly
- Trigger instant background Reconciliation sync automatically when using Bulk Sync in the frontend
- Handled null `classId` gracefully for Global Fee Groups in frontend UI, schema, and API types
- Added "Available Student" and "Available Employees" data counts in the Schedule Assign person selection modal
- added schedule bulk delete
## waiting for backend solution



## problems:
- problem in combine paymenbt hsitory
- roll number should be ascending deascending filtering in student page and collect fee page
- active deactivation of student


## change text: 




