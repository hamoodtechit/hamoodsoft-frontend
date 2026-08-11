# School Management System — API & Permissions Reference

> Comprehensive module, permission, and API endpoint reference for a professional school management system.

---


## optimized role's modules and actions



Role Name: [________________________]

Permissions:

☑ 📊 Dashboard       ☑ Read

☑ 👨‍🎓 Student        ☑ Read  ☑ Write  ☑ Edit  ☑ Delete  ☐ Promote  ☐ Transfer  ☐ Approve Admission
☑ 📚 Academic        ☑ Read  ☑ Write  ☑ Edit  ☑ Delete  ☐ Manage Timetable  ☐ Manage Syllabus  ☐ Manage Homework
☐ 👨‍🏫 Teachers       ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Assign
☑ 📝 Exam & Grades   ☑ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Grade Entry  ☐ Publish  ☐ Generate Report
☑ ✅ Attendance      ☑ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Report  ☐ Approve Leave
☐ 💰 Fees  ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Collect  ☐ Discount  ☐ Waive  ☐ Refund  ☐ Configure  ☐ Send Reminder  ☐ Generate Report
☐ 📈 Income  ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Approve Transaction  ☐ Generate Report
☐ 📉 Expense  ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Approve Transaction  ☐ Generate Report
☐ 🏦 Accounts & Ledger  ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Reconcile  ☐ Manage Chart of Accounts  ☐ Export Ledger  ☐ Close Period  ☐ Generate Report
☐ 🚌 Transport       ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Assign
☐ 👥 People & Access ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Assign Roles  ☐ Manage Roles
☑ 📢 Communication   ☑ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Publish  ☐ Send  ☐ Manage Templates
☐ ⚙️ System          ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Manage Branches  ☐ Export


✅ Final Permission Modules ↔ Sidebar Mapping
#	Sidebar Group	Permission Module	Actions
1	 Dashboard: read
2	 Student:	read, write, edit, delete, promote, transfer, approveAdmission
3	 Academic:	read, write, edit, delete, manageTimetable, manageSyllabus, manageHomework
4	 Teachers	teacher	read, write, edit, delete, assign
5	 Exam & Grades:	read, write, edit, delete, gradeEntry, publish, generateEeport
6	 Attendance: read, write, edit, delete, report, approveLeave
7	 Fees: read, write, edit, delete, collect, discount, waive, refund, configure, sendReminder, generateReport
8	 Income:	read, write, edit, delete, approve, generateReport
9	 Expense:	read, write, edit, delete, approve, generateReport
10 Accounts & Ledger:	read, write, edit, delete, reconcile, exportLedger, closePeriod, generateReport
8	 Transport:	read, write, edit, delete, assign
9	 People & Access	people	read, write, edit, delete, assignRoles, manageRoles
10 Communication:	read, write, edit, delete, publish, send, manageTemplates
11 System:	read, write, edit, delete, manageBranches, export



## new udpate :

╔══════════════════════════════════════════════════════════════════════════════╗
║                        SCHOOL MANAGEMENT — PERMISSIONS                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read                                                                      │
│   └─ View summary widgets, stats, charts etc.                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👨‍🎓 STUDENTS                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Approve Admission   ☐ Promote   ☐ Transfer   ☐ Generate ID Card           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👨‍🏫 TEACHERS                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Assign Subject & Class   ☐ Generate ID Card                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📚 ACADEMIC                                                                 │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ 🗂 Subjects & Classes        │ ☐ Read  ☐ Write  ☐ Edit  ☐ Delete            │
│ 🕐 Timetable                 │ ☐ Read  ☐ Write  ☐ Edit  ☐ Delete            │
│ 📖 Syllabus                  │ ☐ Read  ☐ Write  ☐ Edit  ☐ Delete            │
│ 📝 Homework & Assignments    │ ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Review  │
└──────────────────────────────┴──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🧪 EXAM & GRADES                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Schedule Exam   ☐ Grade Entry   ☐ Publish Result   ☐ Generate Report      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ ATTENDANCE                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
  ☐ Approve Leave   ☐ Generate Report                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 💰 FEES & PAYMENTS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Collect Fee  ☐ Apply Discount   ☐ Waive Fee   ☐ Refund   ☐ Send Reminder │
│ ☐ Configure Fee Structure  │ ☐ generate report                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📈 INCOME                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete  ☐ Approve Transaction    │ ☐ generate report
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📈 EXPENSE                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete ☐ Approve Transaction  │ ☐ generate report
                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏦 ACCOUNTS & LEDGER                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Reconcile   ☐ Manage Chart of Accounts   ☐ Export Ledger   ☐ Close Period │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚌 TRANSPORT                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Assign Route   ☐ Assign Student   ☐ Track Vehicle (if needed)                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📢 COMMUNICATION                                                            │
├──────────────────────────────┬──────────────────────────────────────────────┤
│ 📣 Announcements             │ ☐ Read  ☐ Write  ☐ Edit  ☐ Delete  ☐ Publish │
│ 💬 Messages                  │ ☐ Read  ☐ Send   ☐ Delete                    │
│ 🔔 Notifications             │ ☐ Read  ☐ Send   ☐ Manage Templates          │
└──────────────────────────────┴──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 PEOPLE & ACCESS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Assign Role   ☐ Manage Roles   ☐ Manage Permissions      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ SYSTEM                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ☐ Read   ☐ Write   ☐ Edit   ☐ Delete                                        │
│ ☐ Manage Branches   ☐ Manage Academic Year   ☐ Backup & Restore             │
│ ☐ View Audit Logs   ☐ Export Data   ☐ Configure Integrations                │
└─────────────────────────────────────────────────────────────────────────────┘



