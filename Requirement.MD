# Project Requirements & Change Log Summary

This document summarizes the requirements, features, and subsequent change requests successfully implemented for the **Employee Profile** web application project.

---

## 1. Core Technical Stack
*   **Framework**: Next.js (App Router, dynamic API handlers)
*   **Styling**: Tailwind CSS v4 (minimalist style, Slate/Zinc neutral base theme, `#7C3AED` purple accents)
*   **Database**: Raw SQLite (`sqlite` + `sqlite3` driver)
*   **Icons**: Lucide React (vector-based clean SVGs)

---

## 2. Core Features & Initial Specifications
*   **Full CRUD Support**: Create, Read (view card), Update (edit details), and Delete employee records.
*   **Dashboard Directory**: Home page displays a comprehensive list of employees formatted in a data table.
*   **Global Filters & Search**: Search by name, title, email, or department, and filter by status and department.
*   **Registration Form**: Interactive overlay modal to register new profiles directly from the main view.
*   **Automatic Initials Avatar**: Auto-generates initials-based SVG avatars (via Dicebear API) if no custom avatar URL is provided.
*   **Initial Database Seeding**: Pre-populates the database with 5 distinct mock employees on the first startup.

---

## 3. Implemented Modifications & Change Requests

### 📑 A. Copying Agent Skills (Completed)
*   Copied the `.agent/` folder containing specialized agent intelligence scripts and markdown assets from the `test04_AI` project to the root of the current project (`test06_AI`). Exposes the `grill-with-docs` and `ui-ux-pro-max` plugins.

### 📋 B. Splitting Job Title and System Role (Completed)
*   **Requirement**: Split the single input field representing the role into two distinct elements: "Job Title" (free text) and "System Role" (dropdown selection).
*   **Implementation**:
    *   Updated type interfaces and SQLite schema columns to store both `jobTitle` and `role`.
    *   Defined strict dropdown values for System Role: **`User`**, **`Superuser`**, **`Manager`**, **`Admin`**.
    *   Redesigned the forms (Create/Edit modals), details card view, and data table rows to distinguish between the two fields, using custom styled badges for each system role type.

### 🌓 C. Theme Toggle & Light/Dark Mode (Completed)
*   **Requirement**: Enable changing between Light Mode and Dark Mode via a selector in the header.
*   **Implementation**:
    *   Integrated a Sun/Moon theme switcher button in the main header of the dashboard.
    *   Toggles a `.dark` class on the root HTML element and persists user preference inside `localStorage`.
    *   Expanded Tailwind styling across all layouts to support `dark:` specific variants (e.g. Zinc-900 panels and Slate text variants).

### 🤝 D. "Head Is" Supervisor Selection (Completed)
*   **Requirement**: Add a field named "Head Is" in the employee form to select a supervisor. The selectable options must only include employees whose system role is `Manager`.
*   **Implementation**:
    *   Added a `headId` column (referencing `employees.id`) to the SQLite table schema.
    *   Implemented a self-join query inside the API endpoints (`GET /api/employees` and `GET /api/employees/[id]`) to resolve the manager's name as `headName`.
    *   Created a "Head Is" dropdown in Create/Edit modals that pulls all employees with `role === 'Manager'`. Excludes the current employee during edits to prevent self-reference loops.
    *   Displayed reports-to relationships inside the main table listing (e.g., `→ Manager Name`) and on detailed profile cards.

---

## 4. Verification & Status
*   **Type Safety**: Fully typed with TypeScript.
*   **Build Success**: Validated using `npm run build` with zero compiler warnings or lint errors.
*   **Live Preview**: Locally hosted and running on [http://localhost:3000](http://localhost:3000).
