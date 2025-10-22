# Al-Muhaasib - Quick Reference Card

## 🚀 Start Development

```bash
npm run dev
# → http://localhost:3000 (or 3001)
```

## 📝 Common Tasks

### Register a Student

1. `/students` → "Register Student"
2. Fill student details
3. Fill guardian details
4. Select class (or create sample classes)
5. Submit

### Record Payment

- **From List**: Click "Pay" on student
- **From Profile**: View student → "Record Payment"
- Enter amount → Select method → Submit → Receipt

### View Student Details

- Click "View" on any student
- See all info + payment history
- Record payments directly

### Create Sample Classes

- Open registration form
- If no classes, click "Create Sample Classes"
- ✅ 20 classes created instantly!

## 🗂️ Key Routes

| Route            | Description      |
| ---------------- | ---------------- |
| `/`              | Home (Dashboard) |
| `/students`      | Student List     |
| `/students/[id]` | Student Profile  |

## 📱 Pages Overview

### Dashboard (/)

- Financial statistics
- Quick actions
- Recent activity
- Tabs: Overview, Students, Payments

### Students (/students)

- Search & filter students
- Register new students
- Quick payment recording
- View student profiles

### Student Profile (/students/[id])

- Complete student details
- Guardian information
- Financial summary
- Fee assignments
- Payment history
- Quick payment button

## 🎨 UI Components

### Forms

- `Input` - Text, date, number inputs
- `Select` - Dropdown with options
- `Button` - Primary, outline, ghost variants
- `Modal` - Centered dialog

### Status Badges

- 🟢 **Paid** - All fees paid
- 🟡 **Partial** - Some payment made
- 🔴 **Pending** - No payment yet

## 🛠️ Services

```typescript
import {
  studentService,
  paymentService,
  classService,
  feeService,
} from "@/services";

// Student operations
await studentService.create(data);
await studentService.getById(id);
await studentService.list();

// Payment operations
await paymentService.recordPayment(data);
await paymentService.getByStudent(studentId);

// Class operations
await classService.getActiveClasses();
await classService.updateEnrollment(id, change);

// Seed data
import { seedClasses } from "@/utils/seedData";
await seedClasses(); // Creates 20 sample classes
```

## 🐛 Fixed Issues

### ✅ Dashboard Buttons

- "Add Student" → Now works
- "Record Payment" → Now works
- "Export Report" → Shows alert

### ✅ Class Select

- Smart placeholder
- Loading states
- Helpful messages
- One-click seed data

## 📊 Sample Data

### Classes Created (20 total)

```
Nursery: 2 classes (25 capacity)
Primary: 6 classes (30-35 capacity)
JSS: 6 classes (40 capacity, A/B sections)
SSS: 6 classes (35 capacity, Science/Arts)
```

## 🎯 Quick Tips

1. **Dark Mode**: Toggle in top-right corner
2. **Search**: Use name, admission number, or phone
3. **Filters**: Combine with search for best results
4. **Capacity**: Shows as "Class Name (enrolled/capacity)"
5. **Balance**: Auto-calculated after payments

## 📖 Documentation

| Doc                          | Purpose                |
| ---------------------------- | ---------------------- |
| `README.md`                  | Overview & quick start |
| `PHASE_1_COMPLETE.md`        | Latest features        |
| `IMPLEMENTATION_COMPLETE.md` | Full project details   |
| `SESSION_SUMMARY_OCT_12.md`  | Today's work           |
| `BUGFIX_*.md`                | Bug fix details        |

## 🔐 Authentication

- Uses Internet Identity
- Roles: Admin, Accounting
- Context: `useAuth()` hook

## 📱 Responsive

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: ≥ 1024px

## 🚨 Need Help?

1. Check `/docs` folder
2. Review component source
3. Check service layer
4. Read TypeScript types

## ✅ Status

**Phase 1**: COMPLETE ✅  
**Version**: 1.0.1  
**Production**: READY 🚀

---

**Al-Muhaasib - Making School Management Simple** 🎓
