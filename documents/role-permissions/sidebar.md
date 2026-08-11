# Sidebar Navigation — Role-Based Views

> The sidebar is **permission-driven**, not role-name-driven.
> Each item's required permission is listed. If the user has that permission, they see it.
> The admin sidebar below is the **full system view**. Other roles see a subset.

---

## 👑 Admin / Full System Sidebar

> Shown to users with `people:*`, `system:*`, or multiple domain permissions.

```
📊 Dashboard                     ← dashboard:read
│
├─ 👨‍🎓 Student                  ← student:read
│   ├─ All Students              ← student:read
│   ├─ Admissions                ← student:approveAdmission
│   ├─ Promotions                ← student:promote
│   └─ Transfer Certificate      ← student:transfer
│
├─ 📚 Academic                   ← academic:read
│   ├─ Classes                   ← academic:read
│   ├─ Sections                  ← academic:read
│   ├─ Subjects                  ← academic:read
│   ├─ Subject Groups            ← academic:read
│   ├─ Syllabus                  ← academic:manageSyllabus
│   ├─ Timetable                 ← academic:manageTimetable
│   ├─ Academic Years            ← academic:read
│   └─ Homework                  ← academic:manageHomework
│
├─ 👨‍🏫 Teachers                  ← teacher:read
│   ├─ All Teachers              ← teacher:read
│   └─ Assignments               ← teacher:assign
│
├─ 📝 Exam & Grades              ← exam:read
│   ├─ Exam List                 ← exam:read
│   ├─ Exam Routine              ← exam:read
│   ├─ Grade Entry               ← exam:gradeEntry
│   ├─ Report Cards              ← exam:generateReport
│   └─ Rankings                  ← exam:read
│
├─ ✅ Attendance                 ← attendance:read
│   ├─ Student Attendance        ← attendance:read
│   ├─ Teacher Attendance        ← attendance:read
│   └─ Leave Management          ← attendance:approveLeave
│
├─ 💰 Fees                     ← fees:read
│   ├─ Fee Types                 ← fees:configure
│   ├─ Fee Structures            ← fees:configure
│   ├─ Fee Discounts             ← fees:discount
│   ├─ Invoices                  ← fees:read
│   ├─ Payments                  ← fees:collect
│   ├─ Send Reminder             ← fees:sendReminder
│   └─ Fee Reports               ← fees:generateReport
│
├─ 📈 Finance                   ← income:read
│   ├─ Income                    ← income:read
│   ├─ Expense                   ← expense:read
│   ├─ Accounts                  ← accounts:read
│   └─ Financial Reports         ← accounts:generateReport
│
├─ 🚌 Transport                  ← transport:read
│   ├─ Routes                    ← transport:read
│   ├─ Vehicles                  ← transport:read
│   ├─ Stops                     ← transport:read
│   └─ Assignments               ← transport:assign
│
├─ 👥 People & Access            ← people:read
│   ├─ Users                     ← people:read
│   └─ Roles & Permissions       ← people:manageRoles
│
├─ 📢 Communication              ← communication:read
│   ├─ Notices                   ← communication:read
│   ├─ Events                    ← communication:read
│   ├─ Holidays                  ← communication:read
│   └─ Send Notification         ← communication:send
│
└─ ⚙️ System                     ← system:read
    ├─ Configuration             ← system:read
    ├─ Branches                  ← system:manageBranches
    ├─ Audit Logs                ← system:read
    └─ Reports                   ← system:export
```

---

## 👨‍🏫 Teacher Sidebar

> Shown to users with `teacher` role or equivalent permissions.
> Focus: teaching activities, class management, grading.

```
📊 Dashboard                     ← dashboard:read
│
├─ 📚 My Classes                 ← academic:read
│   ├─ Class Timetable           ← academic:read
│   └─ My Subjects               ← academic:read
│
├─ 📝 Teaching                   ← exam:gradeEntry OR academic:manageHomework
│   ├─ Mark Attendance           ← attendance:write
│   ├─ Grade Entry               ← exam:gradeEntry
│   ├─ Homework                  ← academic:manageHomework
│   └─ Exam Routine              ← exam:read
│
├─ 👨‍🎓 Students                  ← student:read
│   ├─ My Students               ← student:read
│   └─── (opens class-wise filtered list)
│
├─ 📢 Communication              ← communication:read
│   ├─ Notices                   ← communication:read
│   └─ Events                    ← communication:read
│
└─ 👤 My Profile                 ← (always visible)
    ├─ My Timetable              ← academic:read
    └─ Leave Application         ← attendance:approveLeave (if can apply)
```

**Permission check logic for teacher sidebar:**
```
if user has attendance:write     → show "Mark Attendance"
if user has exam:gradeEntry     → show "Grade Entry"
if user has teacher role         → show "My Classes", "My Students"
```

---

## 🧑‍🎓 Student Sidebar

> Shown to users with `student` role.
> Focus: personal academics, results, fees.

```
📊 Dashboard                     ← dashboard:read
│
├─ 📚 Academics                  ← academic:read
│   ├─ My Schedule               ← academic:read
│   ├─ My Subjects               ← academic:read
│   └─ Homework                  ← homework:read (via academic)
│
├─ 📝 Results & Exams            ← exam:read
│   ├─ My Grades                 ← exam:read
│   ├─ Exam Routine              ← exam:read
│   └─── (upcoming exams)
│
├─ ✅ Attendance                 ← attendance:read
│   └─ My Attendance             ← attendance:read
│
├─ 💰 Fees                       ← fees:read
│   ├─ Fee Summary               ← fees:read
│   └─ Payment History           ← fees:read
│
├─ 📢 Communication              ← communication:read
│   ├─ Notices                   ← communication:read
│   └─ Events                    ← communication:read
│
└─ 👤 My Profile                 ← (always visible)
```

**Student sidebar = read-only for most modules.**
No write/edit/delete/approve actions — those are teacher/admin.

---

## 👪 Parent Sidebar

> Shown to users with `parent` role.
> Focus: monitoring children's progress.

```
📊 Dashboard                     ← dashboard:read
│
├─ 👨‍🎓 My Children               ← student:read
│   ├─── (list of linked children)
│   ├─ Child's Profile           ← student:read
│   ├─ Child's Grades            ← exam:read
│   ├─ Child's Attendance        ← attendance:read
│   └─ Child's Schedule          ← academic:read
│
├─ 💰 Fees                       ← fees:read
│   ├─ Fee Summary               ← fees:read
│   ├─ Pay Fees                  ← fees:collect (online payment)
│   └─ Payment History           ← fees:read
│
├─ 📢 Communication              ← communication:read
│   ├─ Notices                   ← communication:read
│   ├─ Events                    ← communication:read
│   └─ Contact School            ← communication:send (if allowed)
│
└─ 👤 My Profile                 ← (always visible)
```

**Parent sidebar = monitoring + fee payment.**
Cannot modify anything — just view and pay.

---

## 🧑‍💼 Custom Role Sidebar (e.g., Accountant, Transport Manager)

> When an admin creates a **custom role**, the sidebar auto-composes based on granted permissions.
> No hardcoded sidebar needed — it's generated dynamically.

**Example — Accountant** (has `fees:*`, `income:*`, `expense:*`, `accounts:*`, `students:read`):

```
📊 Dashboard                     ← dashboard:read
│
├─ 💰 Fees                     ← fees:read
│   ├─ Fee Types                 ← fees:configure
│   ├─ Fee Structures            ← fees:configure
│   ├─ Fee Discounts             ← fees:discount
│   ├─ Invoices                  ← fees:read
│   ├─ Payments                  ← fees:collect
│   ├─ Send Reminder             ← fees:sendReminder
│   └─ Fee Reports               ← fees:generateReport
│
├─ 📈 Finance                   ← income:read
│   ├─ Income                    ← income:read
│   ├─ Expense                   ← expense:read
│   ├─ Accounts                  ← accounts:read
│   └─ Financial Reports         ← accounts:generateReport
│
├─ 📢 Communication              ← communication:read
│   └─ Notices                   ← communication:read
│
└─ 👤 My Profile                 ← (always visible)
```

**Example — Transport Manager** (has `transport:*`, `students:read`):

```
📊 Dashboard                     ← dashboard:read
│
├─ 🚌 Transport                  ← transport:read
│   ├─ Routes                    ← transport:read
│   ├─ Vehicles                  ← transport:read
│   ├─ Stops                     ← transport:read
│   └─ Assignments               ← transport:assign
│
├─ 👨‍🎓 Students                  ← student:read
│   └─ (filtered for transport assignment)
│
├─ 📢 Communication              ← communication:read
│   └─ Notices                   ← communication:read
│
└─ 👤 My Profile                 ← (always visible)
```

---

## 🧠 How Sidebar Rendering Works in Code

```typescript
// src/config/nav.ts

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: string;        // ← Permission required to see this item
  children?: NavItem[];      // ← Sub-items
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Single unified nav config — not one per role
const ALL_NAV_ITEMS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
    ],
  },
  {
    label: "Student",
    items: [
      { title: "All Students",  href: "/dashboard/students",         icon: GraduationCap, permission: "student:read" },
      { title: "Admissions",    href: "/dashboard/admissions",       icon: FilePlus,      permission: "student:approveAdmission" },
      { title: "Promotions",    href: "/dashboard/promotions",       icon: ArrowUp,        permission: "student:promote" },
    ],
  },
  // ... etc for all groups/items
];

// Filter function used in sidebar component
export function getFilteredNav(userPermissions: string[]): NavGroup[] {
  return ALL_NAV_ITEMS
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        hasPermission(userPermissions, item.permission)
      ),
    }))
    .filter(group => group.items.length > 0); // Remove empty groups
}
```

**This single config replaces the current role-specific arrays** (`adminNav`, `teacherNav`, `studentNav`, `parentNav`). The sidebar just filters by the user's permissions at render time.

---

## ✅ Summary

| Role | Sidebar Source | Key Difference |
|------|---------------|----------------|
| **Admin** | Full config (all items) | Everything visible |
| **Teacher** | Filtered by teacher permissions | Teaching, grading, class attendance |
| **Student** | Filtered by student permissions | Read-only: grades, schedule, fees |
| **Parent** | Filtered by parent permissions | Children's data, fee payment |
| **Custom (e.g., Accountant)** | Filtered by custom permissions | Only their assigned modules |



## testing text here