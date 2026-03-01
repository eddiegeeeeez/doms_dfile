# DFile — Enterprise Architecture Audit & Restructuring Plan

> **Audit Date:** February 28, 2026
> **Auditor Role:** Senior Enterprise Architect — Fixed Asset Management Systems
> **Scope:** Full-stack architecture, business logic, roles, modules, backend enforcement
> **Constraint:** Enterprise FAMS structure using Tenants (no SaaS billing/subscription features)

---

## Table of Contents

1. [Full System Identity](#1-full-system-identity)
2. [Role Access Matrix](#2-role-access-matrix)
3. [Clean Module Architecture](#3-clean-module-architecture)
4. [Role Template Implementation Plan](#4-role-template-implementation-plan)
5. [Backend Enforcement Strategy](#5-backend-enforcement-strategy)
6. [Business Process Correction Plan](#6-business-process-correction-plan)
7. [Controller Refactor Plan](#7-controller-refactor-plan)
8. [Security Checklist](#8-security-checklist)
9. [Missing Enterprise Features](#9-missing-enterprise-features)
10. [Redundant Components to Remove](#10-redundant-components-to-remove)

---

# PHASE 1 — FULL SYSTEM AUDIT

---

## 1. Full System Identity

### 1.1 What Is This System Fundamentally?

DFile is a **multi-tenant Fixed Asset Management System (FAMS)** designed for organizations that need to register, track, depreciate, maintain, procure, and dispose of physical assets across locations. It operates on a single-host deployment model where one ASP.NET Core process serves both API endpoints and a statically-exported Next.js frontend.

### 1.2 Core Business Purpose

Track the **full lifecycle of fixed assets** — from procurement request through registration, allocation to locations, depreciation tracking, maintenance scheduling, and eventual disposal/archiving — while isolating data per tenant (organization) and enforcing role-based access.

### 1.3 Module Alignment Assessment

| Module | FAMS Aligned? | Verdict |
|---|---|---|
| Asset Registration | Yes | Core FAMS function. Properly tracks tag, category, manufacturer, serial, purchase details. |
| Asset Allocation | Yes | Core function. Assigns assets to rooms/locations. |
| Asset Depreciation | Yes | Core function. Straight-line depreciation auto-calculated. |
| Room/Location Management | Yes | Supporting function. Locations where assets are deployed. |
| Maintenance Tracking | Yes | Core function. Preventive/corrective maintenance linked to assets. |
| Purchase Orders | Partially | Should be full procurement lifecycle; currently just a status-change form with no approval workflow. |
| Task Management | Tangential | Generic task system not tied to FAMS business processes. Should be scoped to maintenance work orders only. |
| Organization (Dept/Role/Employee) | Supporting | Necessary for assignment and accountability. Not a core FAMS function but supports it. |
| Tenant Management | Yes | Platform governance. Correct for multi-tenant FAMS. |
| Subscription Plans | Out of Scope | SaaS concern — excluded per directive. Feature limits (MaxRooms, MaxPersonnel) are not enforced anywhere in the codebase. |

### 1.4 Core Modules (Must Exist in Any FAMS)

| # | Module | Current State | Gap |
|---|---|---|---|
| 1 | **Asset Registry** | Exists. Full CRUD, categories, tag uniqueness. | No barcode/QR integration (modal exists but no workflow). No bulk import. |
| 2 | **Asset Allocation** | Exists. Assign asset to room. | No occupancy validation. No transfer workflow (room-to-room). No custody tracking (which employee holds it). |
| 3 | **Depreciation Engine** | Exists. Straight-line only, auto-calculated. | No declining-balance or units-of-production methods. No fiscal year alignment. No depreciation schedule export. Current book value is snapshot — not recalculated dynamically. |
| 4 | **Maintenance Management** | Exists. Records linked to assets with priority/type/frequency. | No scheduled maintenance automation. No work order assignment. No SLA tracking. Cost aggregation per asset missing. |
| 5 | **Procurement** | Partial. PO entity exists with Pending/Approved/Delivered/Cancelled. | No approval workflow. No vendor management. No budget validation. No requisition-to-PO-to-receipt flow. Status transitions not enforced. |
| 6 | **Disposal/Write-Off** | Missing entirely. | Assets can only be "Archived" — there is no disposal workflow, write-off approval, or salvage value tracking. |
| 7 | **Audit Trail** | Missing entirely. | No record of who changed what, when. Critical for enterprise FAMS compliance. |

### 1.5 Supporting Modules

| # | Module | Current State | Assessment |
|---|---|---|---|
| 1 | **Room/Location** | Exists. CRUD with categories, stats. | Adequate as a location registry. |
| 2 | **Organization (Dept/Role/Employee)** | Exists. CRUD for each. | These are *organizational* structures (job titles, org chart), separate from auth roles. Adequate. |
| 3 | **Tenant Management** | Exists. Create + status management. | Adequate for platform governance. No edit capability (name/plan changes). |
| 4 | **User Management** | Partial. Register endpoint exists. No list/edit/deactivate UI for tenant admins. | Critical gap — tenant admins cannot manage their own users. |
| 5 | **Reporting** | Missing. Finance dashboard has a disabled "Reports" tab. | No report generation, export, or analytics. |

### 1.6 Redundant Logic Identified

| # | Redundancy | Location | Impact |
|---|---|---|---|
| 1 | **Task Management as standalone module** | `TasksController`, `/maintenancemanager/tasks` | Generic task system disconnected from FAMS processes. Should be *work orders* within the maintenance module, not a separate entity. |
| 2 | **Dual archive mechanisms** | Assets use `Archived` bool + `Status = "Archived"`. Rooms use `Archived` bool + `Status = "Deactivated"`. | Inconsistent pattern. Should standardize on one mechanism. |
| 3 | **Duplicate category naming** | `Asset.Cat` (legacy dead field) + `Asset.CategoryId` (active FK). | `Cat` should be removed. Dead column in schema. |
| 4 | **Duplicate Tenant interface** | `src/types/asset.ts` exports `Tenant` interface. `src/hooks/use-tenants.ts` also defines a local `Tenant` interface. | Type drift risk. Should have single source of truth. |
| 5 | **Procurement role shares tenantadmin namespace** | Procurement uses `/tenantadmin/*` pages, same as Admin and Employee. | Three different roles with different access levels crammed into one route namespace. Creates confusion and requires per-page role guards. |
| 6 | **Subscription plan enforcement logic** | `Tenant.Create()` sets MaxRooms/MaxPersonnel limits, but no controller ever checks them. | Dead business logic — limits exist in the database but are never enforced. |
| 7 | **`Role` model vs auth roles** | The `Role` model (organizational designations like "IT Manager") is completely separate from the 6 auth roles ("Admin", "Finance", etc.). | Confusing naming. The `Role` model should be renamed to `JobTitle` or `Position` to avoid ambiguity. |

### 1.7 Missing Enterprise Components

| # | Component | Priority | Rationale |
|---|---|---|---|
| 1 | **Audit Trail / Change Log** | Critical | Every FAMS needs immutable records of who changed what asset data and when. |
| 2 | **Disposal / Write-Off Workflow** | Critical | Asset lifecycle is incomplete without disposal, salvage value, and write-off approval. |
| 3 | **Approval Workflows** | Critical | Purchase orders have statuses but no approval chain. Maintenance has no sign-off. |
| 4 | **User Management UI** | High | Tenant admins cannot create, edit, or deactivate users within their tenant. |
| 5 | **Asset Transfer** | High | No ability to move assets between rooms, departments, or tenants with tracking. |
| 6 | **Vendor Management** | High | PurchaseOrder stores vendor as a plain string. Should be a managed entity. |
| 7 | **Asset Custody Tracking** | High | No record of which employee currently holds/uses an asset. |
| 8 | **Reporting Engine** | High | No reports, exports, or analytics beyond basic dashboard stat cards. |
| 9 | **Pagination** | Medium | All list endpoints return full datasets. Will not scale. |
| 10 | **Global Query Filters** | Medium | Tenant isolation relies on manual controller filtering. One missed filter = cross-tenant data leak. |
| 11 | **FK Constraints** | Medium | Only 1 FK in entire schema ($Room \rightarrow RoomCategory$). No referential integrity. |
| 12 | **Password Management** | Medium | No password change, forgot-password, or password policy enforcement. |

---

# PHASE 2 — ROLE STRUCTURE VALIDATION

---

## 2. Role Access Matrix

### 2.1 Current State: What Each Role Actually Sees

#### Super Admin

| Check | Finding | Status |
|---|---|---|
| Sees only platform-level pages | Yes — dashboard, organizations, create-tenant | PASS |
| Cannot access tenant operational pages | Correct — no tenantadmin/finance/maintenance pages | PASS |
| Landing route `/superadmin/dashboard` | Correct | PASS |
| Dashboard shows correct data | Yes — tenant KPIs, summary list | PASS |
| **Backend access** | Has access to ALL tenant-aware controllers (bypasses tenant filter) | VIOLATION |

**Violation Detail:** Super Admin is listed in the `[Authorize]` attribute of every tenant-aware controller (Assets, Rooms, Maintenance, Tasks, Employees, Departments, Roles, PurchaseOrders, AssetCategories, RoomCategories). While the frontend correctly restricts Super Admin to platform pages, the **backend grants full CRUD access** to all tenant operational data. A Super Admin with API knowledge can directly create, edit, or delete any tenant's assets, maintenance records, purchase orders, etc.

**Correct Behavior:** Super Admin should only have *read-only* access to tenant data for oversight purposes, not write access. Platform governance ≠ operational control.

---

#### Admin (Tenant Administrator)

| Check | Finding | Status |
|---|---|---|
| Sees tenant operational pages | Yes — all tenantadmin pages | PASS |
| Cannot access other tenants | Correct — JWT tenant filter | PASS |
| Cannot access platform pages | Correct — layout `requiredRoles` blocks | PASS |
| Landing route `/tenantadmin/dashboard` | Correct | PASS |
| Dashboard shows asset stats + table | Correct — `<AssetStats>` for Admin | PASS |
| Has full CRUD on all tenant entities | Yes | PASS |
| Can register users | Only via API (`POST /api/auth/register`), no UI | GAP |
| **User management UI** | Missing entirely | FAIL |

---

#### Finance Manager

| Check | Finding | Status |
|---|---|---|
| Sees finance pages only | Yes — finance dashboard + depreciation | PASS |
| Landing route `/financemanager/dashboard` | Correct | PASS |
| Dashboard shows financial data | Yes — overview, depreciation tabs | PASS |
| Can update asset financial fields | Yes — via `/api/assets/{id}/financial` | PASS |
| Can manage purchase orders | Yes — full CRUD on PurchaseOrders controller | PASS |
| **Can create/edit asset categories** | Yes — listed on AssetCategoriesController | QUESTIONABLE |
| **Cannot access maintenance, tasks, rooms, employees, departments** | Correct | PASS |
| **Reports tab** | Disabled/placeholder | GAP |

**Questionable:** Finance role having write access to AssetCategories is debatable. Categories are structural data that should be managed by Admin. Finance should have read-only access to categories.

---

#### Maintenance Manager

| Check | Finding | Status |
|---|---|---|
| Sees maintenance pages only | Yes — dashboard, maintenance, tasks | PASS |
| Landing route `/maintenancemanager/dashboard` | Correct | PASS |
| Can CRUD maintenance records | Yes — full access | PASS |
| Can CRUD tasks | Yes — full access | PASS |
| Can read employees | Yes — for task assignment | PASS |
| Can read assets | Yes — for maintenance linking | PASS |
| **Can update assets (standard fields)** | Yes — listed on Assets class-level auth | VIOLATION |
| **Can create purchase orders** | No — not listed on PurchaseOrders controller | PASS |
| **No status-transition enforcement** | Maintenance records can jump between any statuses | GAP |

**Violation Detail:** Maintenance role has full CRUD on assets (class-level `[Authorize]` on AssetsController includes "Maintenance"). Maintenance should only be able to *read* assets and *update asset condition/status* — not create, delete, or modify financial fields.

---

#### Procurement

| Check | Finding | Status |
|---|---|---|
| Shares `/tenantadmin` namespace with Admin and Employee | Yes | DESIGN ISSUE |
| Has separate dashboard stats (`<ProcurementStats>`) | Yes — shows total assets + unallocated count | PASS |
| Can register assets | Yes | PASS |
| Can allocate assets | Yes | PASS |
| Can view depreciation | Yes — read-only view | PASS |
| Can manage purchase orders | Yes — full CRUD | PASS |
| **No procurement-specific pages** | Uses same pages as Admin with nav filtering | GAP |
| **No seeded Procurement user** | Cannot test out-of-box | GAP |
| **No vendor management** | Vendor is a plain string on PurchaseOrder | GAP |

---

#### Employee

| Check | Finding | Status |
|---|---|---|
| Landing route `/tenantadmin/dashboard` | Correct | PASS |
| Sees only static welcome message | Correct — `<EmployeeDashboard>` | PASS |
| Nav shows only Dashboard | Correct — all other items have `allowedRoles` excluding Employee | PASS |
| **Has zero backend API access** | Not listed on ANY resource controller | CONFIRMED |
| **Cannot view own assigned assets** | No endpoint or UI for this | FAIL |
| **Cannot submit maintenance requests** | No endpoint or UI | FAIL |

**Assessment:** Employee role is functionally useless. In a proper FAMS, employees should be able to view their assigned assets, report issues, and submit basic requests.

---

### 2.2 Role Access Violation Summary

| # | Violation | Severity | Fix Required |
|---|---|---|---|
| 1 | Super Admin has write access to all tenant operational data via backend | High | Restrict SA to read-only on tenant data; remove from CRUD endpoints |
| 2 | Maintenance role has full asset CRUD (should be read + condition update only) | High | Remove Maintenance from Assets class-level auth; add read-only endpoint |
| 3 | Finance role can create/edit asset categories (should be Admin only) | Medium | Remove Finance from AssetCategories write endpoints |
| 4 | Employee role has zero utility (no asset view, no request submission) | High | Add Employee-accessible read endpoints |
| 5 | No user management UI for Tenant Admin | High | Build user list/edit/deactivate page |
| 6 | Procurement shares namespace with Admin/Employee causing architectural confusion | Medium | Consider dedicated `/procurement` namespace or accept shared namespace with proper guards |
| 7 | No status-transition validation on any module | High | Implement state machine validation on backend |

---

### 2.3 Correct Role Access Design (Target State)

#### Super Admin — Platform Governance Only

**SHOULD access:**
- Tenant CRUD (create, view, archive/restore, status management)
- Global Role Template management (Phase 4)
- Cross-tenant audit center (read-only tenant data for oversight)
- Platform metrics (tenant counts, total assets across platform, health)
- Emergency tenant controls (force-deactivate tenant, lock accounts)
- User management across tenants (create users for any tenant, but NOT edit tenant operational data)

**MUST NOT:**
- Register assets in any tenant
- Approve or create purchase orders
- Create or edit maintenance records
- Modify tenant financial records
- Delete or archive tenant operational data (assets, rooms, employees, etc.)

**Backend Enforcement:** Remove "Super Admin" from all tenant-aware controller `[Authorize]` attributes. Create separate read-only oversight endpoints under `/api/platform/*` for cross-tenant visibility.

---

#### Tenant Admin — Full Tenant Operations + Procurement Owner

**SHOULD access:**
- All tenant operational modules (assets, rooms, maintenance, purchasing)
- User management within tenant (create, edit roles, activate/deactivate)
- Department management
- Location/room management
- Asset category management
- Approval configuration
- Tenant settings (contact info, preferences)
- Full procurement lifecycle (requests, vendor selection, PO generation, asset intake)

**MUST NOT:**
- Modify global role templates (can only assign them)
- Access other tenants' data
- Access platform audit data
- Change tenant subscription plan (Super Admin function)

---

#### Finance Manager

**SHOULD access (read/write):**
- Asset financial records (purchase price, current book value, depreciation)
- Depreciation schedules and reports
- Disposal approvals and write-off records
- Financial reports and exports
- Procurement approval (financial approval step only — not PO creation)

**SHOULD access (read-only):**
- Asset registry (view assets, categories — no create/edit/delete)
- Purchase orders (view status — approval action only, not CRUD)
- Room/location list (reference only)

**MUST NOT:**
- Create or delete assets
- Create or edit asset categories
- Manage maintenance records
- Manage employees, departments, or roles
- Create purchase orders (that's Procurement/Admin)

---

#### Maintenance Manager

**SHOULD access (read/write):**
- Maintenance records (full CRUD)
- Work orders / task management (scoped to maintenance)
- Asset condition updates (update asset status to "Under Maintenance" / "Operational")

**SHOULD access (read-only):**
- Asset registry (view assets to link maintenance records)
- Employee list (for work order assignment)
- Room/location list (reference for asset locations)

**MUST NOT:**
- Create, delete, or archive assets
- Modify asset financial fields
- Manage purchase orders
- Manage departments or organizational roles
- Manage rooms or room categories

---

#### Procurement (Currently part of Tenant Admin scope — see recommendation)

**Recommendation:** Merge Procurement responsibilities into **Tenant Admin** role. Rationale:
- In the current system, Procurement and Admin share the same namespace, the same pages, and nearly identical access.
- A separate Procurement role only makes sense in large enterprises with dedicated purchasing departments.
- If kept separate, Procurement should have: asset registration (intake), PO creation/management, vendor records, asset allocation. But NOT: room management, department management, employee management, user management.

**If kept as separate role, SHOULD access:**
- Purchase order CRUD (create requests, track status)
- Asset registration (intake from delivered POs)
- Asset allocation (assign received assets to rooms)
- Vendor records (CRUD — currently missing as entity)
- Asset categories (read-only)
- Room list (read-only for allocation reference)

---

#### Employee

**SHOULD access (read-only):**
- View own assigned assets (assets linked to their employee record)
- View own department assets
- Dashboard with personal asset summary

**SHOULD access (write):**
- Submit maintenance requests (create maintenance record with "Requested" status)
- Submit asset issue reports

**MUST NOT:**
- Access any other tenant operational data
- Approve anything
- Manage other users' data

---

# PHASE 3 — CLEAN MODULE ARCHITECTURE

---

## 3. Clean Module Architecture

### 3.1 Target Module Structure

```
PLATFORM LAYER (Super Admin Only)
+-- Tenant Management
|   +-- Create Tenant + Initial Admin
|   +-- View/Archive/Restore Tenants
|   +-- Tenant Status Control
|   +-- Tenant Metrics
+-- Role Template Management (NEW)
|   +-- Global Role Templates
|   +-- Permission Matrix Editor
+-- Platform Oversight (NEW)
|   +-- Cross-Tenant Summary Dashboard
|   +-- Platform Health Metrics
+-- User Oversight (NEW)
    +-- List users across tenants (read-only)
    +-- Emergency user lock

TENANT OPERATIONS LAYER
+-- Asset Management (Core)
|   +-- Asset Registry (CRUD, categories, tags)
|   +-- Asset Allocation (assign to room/employee)
|   +-- Asset Transfer (NEW — room-to-room, dept-to-dept)
|   +-- Asset Disposal (NEW — write-off, salvage, approval chain)
|   +-- Asset Custody (NEW — who holds what)
|
+-- Financial Management (Core)
|   +-- Depreciation Engine (view schedules, recalculate)
|   +-- Financial Records (asset values, book values)
|   +-- Disposal Financial Processing (write-off values)
|   +-- Financial Reports (NEW)
|
+-- Procurement (Core)
|   +-- Purchase Requests
|   +-- Vendor Management (NEW)
|   +-- Purchase Orders (with approval workflow)
|   +-- Asset Intake (PO → registered asset)
|
+-- Maintenance (Core)
|   +-- Maintenance Records (linked to assets)
|   +-- Work Orders (replaces generic Tasks)
|   +-- Scheduled Maintenance (automation — future)
|   +-- Condition Reporting
|
+-- Organization (Supporting)
|   +-- Department Management
|   +-- Position/Job Title Management (rename from "Role")
|   +-- Employee Management
|
+-- Location (Supporting)
|   +-- Room/Location Registry
|   +-- Room Categories
|   +-- Occupancy Tracking
|
+-- Administration (Supporting)
    +-- User Management (NEW — tenant-level)
    +-- Role Assignment (from templates)
    +-- Tenant Settings (NEW)
    +-- Audit Log Viewer (NEW)
```

### 3.2 Module-to-Role Mapping

| Module | Admin | Finance | Maintenance | Employee |
|---|---|---|---|---|
| **Asset Registry** | Full CRUD | Read-only | Read-only | Read own |
| **Asset Allocation** | Full | Read-only | Read-only | — |
| **Asset Transfer** | Full | Read-only | Read-only | — |
| **Asset Disposal** | Initiate | Approve (financial) | — | — |
| **Asset Custody** | Full | Read-only | Read-only | View own |
| **Depreciation** | View | Full (recalc, reports) | — | — |
| **Financial Records** | View | Full | — | — |
| **Financial Reports** | View | Full | — | — |
| **Purchase Requests** | Full CRUD | Approve (financial) | — | — |
| **Vendor Management** | Full CRUD | Read-only | — | — |
| **Purchase Orders** | Full CRUD | Approve (financial) | — | — |
| **Asset Intake** | Full | — | — | — |
| **Maintenance Records** | View all | — | Full CRUD | Submit request |
| **Work Orders** | View all | — | Full CRUD | — |
| **Condition Reporting** | View | — | Update | Report issue |
| **Departments** | Full CRUD | — | — | — |
| **Positions** | Full CRUD | — | — | — |
| **Employees** | Full CRUD | — | Read-only | — |
| **Rooms/Locations** | Full CRUD | Read-only | Read-only | — |
| **Room Categories** | Full CRUD | — | — | — |
| **User Management** | Full (own tenant) | — | — | — |
| **Role Assignment** | Full (own tenant) | — | — | — |
| **Tenant Settings** | Full | — | — | — |
| **Audit Log** | View (own tenant) | View (own tenant) | View (own) | View (own) |

---

# PHASE 4 — GLOBAL ROLE TEMPLATE ARCHITECTURE

---

## 4. Role Template Implementation Plan

### 4.1 Objective

Replace hardcoded `[Authorize(Roles = "Admin,Finance,...")]` attributes with a permission-based authorization system where:
- Super Admin defines **global role templates** with granular module-level permissions
- Tenants assign roles from these templates to their users
- Backend enforces permissions at the service layer, not just controller attributes
- Tenant admins can assign templates and customize display labels, but cannot modify the permission matrix

### 4.2 Database Schema

#### `RoleTemplate`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `Id` | `int` | PK, auto-increment | Template identifier |
| `Name` | `string` | Required, unique | System name (e.g., "Admin", "Finance Manager") |
| `Description` | `string` | | Human-readable description |
| `IsSystem` | `bool` | Default `true` | System templates cannot be deleted |
| `CreatedAt` | `DateTime` | Default `UtcNow` | Creation timestamp |
| `UpdatedAt` | `DateTime?` | | Last modification timestamp |

**Seeded Templates:** Admin, Finance Manager, Maintenance Manager, Procurement Officer, Employee

#### `RolePermission`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `Id` | `int` | PK, auto-increment | Permission record identifier |
| `RoleTemplateId` | `int` | FK → RoleTemplate, Required | Parent template |
| `ModuleName` | `string` | Required | Module identifier (e.g., "Assets", "Maintenance", "PurchaseOrders") |
| `CanView` | `bool` | Default `false` | Read access |
| `CanCreate` | `bool` | Default `false` | Create access |
| `CanEdit` | `bool` | Default `false` | Update access |
| `CanDelete` | `bool` | Default `false` | Delete/archive access |
| `CanApprove` | `bool` | Default `false` | Approval authority |
| `CanArchive` | `bool` | Default `false` | Archive/restore access |

**Unique Constraint:** `(RoleTemplateId, ModuleName)`

#### `TenantRole`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `Id` | `int` | PK, auto-increment | Tenant-level role identifier |
| `TenantId` | `int` | FK → Tenant, Required | Owning tenant |
| `RoleTemplateId` | `int` | FK → RoleTemplate, Required | Source template |
| `CustomLabel` | `string?` | | Tenant-specific display name (e.g., "Asset Coordinator" instead of "Procurement Officer") |
| `IsActive` | `bool` | Default `true` | Soft-enable/disable |
| `CreatedAt` | `DateTime` | Default `UtcNow` | |

**Unique Constraint:** `(TenantId, RoleTemplateId)`

#### `UserRoleAssignment`

| Column | Type | Constraint | Description |
|---|---|---|---|
| `Id` | `int` | PK, auto-increment | Assignment identifier |
| `UserId` | `int` | FK → User, Required | Assigned user |
| `TenantRoleId` | `int` | FK → TenantRole, Required | Assigned tenant role |
| `AssignedAt` | `DateTime` | Default `UtcNow` | When assigned |
| `AssignedBy` | `int?` | FK → User | Who assigned it |

**Unique Constraint:** `(UserId)` — one role per user (can be relaxed later for multi-role)

### 4.3 Module Name Constants

Define as a static class for type safety:

```csharp
public static class Modules
{
    public const string Assets = "Assets";
    public const string AssetCategories = "AssetCategories";
    public const string AssetAllocation = "AssetAllocation";
    public const string Depreciation = "Depreciation";
    public const string Maintenance = "Maintenance";
    public const string WorkOrders = "WorkOrders";
    public const string PurchaseOrders = "PurchaseOrders";
    public const string Vendors = "Vendors";
    public const string Rooms = "Rooms";
    public const string RoomCategories = "RoomCategories";
    public const string Employees = "Employees";
    public const string Departments = "Departments";
    public const string Positions = "Positions";
    public const string Users = "Users";
    public const string AuditLog = "AuditLog";
    public const string TenantSettings = "TenantSettings";
    public const string Tenants = "Tenants";
    public const string RoleTemplates = "RoleTemplates";
}
```

### 4.4 Default Permission Matrix (Seeded)

| Module | Admin | Finance | Maintenance | Employee |
|---|---|---|---|---|
| **Assets** | V C E D A Ar | V | V | V (own) |
| **AssetCategories** | V C E D | V | V | — |
| **AssetAllocation** | V C E | V | V | — |
| **Depreciation** | V | V E | — | — |
| **Maintenance** | V | — | V C E D Ar | V (submit) |
| **WorkOrders** | V | — | V C E D | — |
| **PurchaseOrders** | V C E D | V Ap | — | — |
| **Vendors** | V C E D | V | — | — |
| **Rooms** | V C E D Ar | V | V | — |
| **RoomCategories** | V C E D Ar | — | — | — |
| **Employees** | V C E D Ar | — | V | — |
| **Departments** | V C E D Ar | — | — | — |
| **Positions** | V C E D Ar | — | — | — |
| **Users** | V C E D | — | — | — |
| **AuditLog** | V | V | V | V (own) |
| **TenantSettings** | V E | — | — | — |

*Legend: V=View, C=Create, E=Edit, D=Delete, Ap=Approve, Ar=Archive*

### 4.5 Permission Enforcement

#### `IPermissionService` Interface

```csharp
public interface IPermissionService
{
    Task<bool> HasPermission(int userId, string module, string action);
    Task<bool> HasAnyPermission(int userId, string module, params string[] actions);
    Task<RolePermission?> GetPermissions(int userId, string module);
    bool IsSuperAdmin(ClaimsPrincipal user);
}
```

#### Enforcement Rules

1. **Super Admin bypasses tenant module permissions** — has implicit access to platform-level modules (Tenants, RoleTemplates) and read-only access to tenant data for oversight.
2. **Every controller action** calls `_permissionService.HasPermission(userId, module, action)` before executing business logic.
3. **Service layer** also validates permissions for nested operations (e.g., creating a PO that also updates asset status).
4. **`[Authorize]` attribute** remains as a first-pass gate (authenticated user required) but is no longer the sole authorization mechanism.
5. **Action names** map to permission columns: `"View"` → `CanView`, `"Create"` → `CanCreate`, `"Edit"` → `CanEdit`, `"Delete"` → `CanDelete`, `"Approve"` → `CanApprove`, `"Archive"` → `CanArchive`.

#### Migration Path (Incremental)

**Phase A — Schema & Seed (no behavior change):**
1. Add the 4 new tables via EF migration
2. Seed default role templates with permission matrix
3. Seed TenantRoles for existing tenants
4. Seed UserRoleAssignments for existing users (map from `User.Role` string)

**Phase B — Service Layer (parallel enforcement):**
1. Implement `PermissionService`
2. Add permission checks to each controller alongside existing `[Authorize(Roles=...)]`
3. Log any permission mismatches (where old role check passes but new permission check fails, or vice versa)

**Phase C — Cutover:**
1. Remove hardcoded `Roles = "..."` from all `[Authorize]` attributes
2. `[Authorize]` remains (requires authentication) but role logic is fully in `PermissionService`
3. Keep `User.Role` string field for backward compatibility and JWT claims, but source of truth becomes `UserRoleAssignment → TenantRole → RoleTemplate → RolePermission`

### 4.6 Super Admin Page: `/superadmin/role-templates`

**Required UI:**
- Table listing all role templates (Name, Description, IsSystem badge, permission count, created date)
- Click template → expand/modal showing full permission matrix grid
- Edit permission matrix (toggle checkboxes per module/action)
- Add new template (name, description, then configure permissions)
- System templates can have permissions edited but cannot be deleted

### 4.7 Tenant Admin Behavior

**Can do:**
- View available role templates (read-only table)
- Assign a template to a user → creates `UserRoleAssignment`
- Set `CustomLabel` on `TenantRole` (e.g., rename "Finance Manager" to "Financial Controller")
- View permission matrix for any template (read-only)

**Cannot do:**
- Modify permission matrix values
- Create new role templates
- Override approval authority
- Assign Super Admin template

---

# PHASE 5 — BUSINESS PROCESS CORRECTION PLAN

---

## 6. Business Process Correction Plan

### 6.1 Asset Registration Flow

#### Current State
```
User opens Add Asset modal
  → Fills form (tag, description, category, manufacturer, model, serial, purchase details)
  → POST /api/assets
  → Backend auto-calculates depreciation
  → Asset appears in list with Status = "Active"
```

**Problems:**
- No validation that tag number follows any organizational standard
- No duplicate check across categories (same asset registered twice under different categories)
- No approval step for high-value assets
- No link to a purchase order (asset can appear from nowhere)
- No custody assignment (who received the asset?)

#### Corrected Flow
```
1. INTAKE (Triggered by PO delivery OR manual registration)
   → If from PO: Pre-fill asset details from PurchaseOrder record
   → If manual: User fills complete asset form
   → System validates: tag uniqueness, required fields, category exists
   → Asset created with Status = "Registered" (not yet active)

2. VERIFICATION (Admin reviews)
   → Admin verifies asset details match physical item
   → Admin confirms serial number, condition, location
   → Status → "Verified"

3. ALLOCATION
   → Admin assigns asset to Room/Location
   → Admin assigns custody to Employee (NEW)
   → Status → "Active"

4. OPERATIONAL
   → Asset is in use, depreciating
   → Maintenance records can be created against it
   → Condition updates tracked

5. DISPOSAL (see Disposal Flow below)
```

### 6.2 Purchase Order / Procurement Flow

#### Current State
```
User creates PO (from maintenance acquisition modal OR direct)
  → PO created with Status = "Pending"
  → Anyone with access can change Status to anything (Pending/Approved/Delivered/Cancelled)
  → No approval workflow
  → No link back to asset on delivery
```

**Problems:**
- No approval chain (who approves the purchase?)
- Status transitions not enforced (can go Delivered → Pending)
- No budget validation
- No vendor management (vendor is a free-text string)
- PO creation from maintenance modal is the only UI entry point
- `PurchaseDate` and `CreatedAt` stored as strings, not DateTime

#### Corrected Flow
```
1. REQUEST (Admin/Procurement creates)
   → Fill: asset details, vendor, estimated cost, justification
   → Status = "Requested"
   → System records RequestedBy (user ID, not free text)

2. FINANCIAL APPROVAL (Finance Manager)
   → Finance reviews estimated cost
   → Finance approves or rejects with comments
   → Status → "Approved" or "Rejected"
   → Only Finance role (CanApprove on PurchaseOrders) can perform this

3. PO GENERATION
   → After approval, PO number generated
   → Vendor notified (future enhancement)
   → Status → "Ordered"

4. RECEIVING
   → Asset physically arrives
   → Admin/Procurement confirms receipt
   → Status → "Delivered"
   → System prompts: "Register this as a new asset?" → triggers Asset Registration flow

5. COMPLETION
   → Asset registered and linked via PO.AssetId
   → Status → "Completed"
   → PO archived automatically

VALID STATUS TRANSITIONS:
  Requested → Approved | Rejected
  Approved → Ordered | Cancelled
  Ordered → Delivered | Cancelled
  Delivered → Completed
  Rejected → (terminal)
  Cancelled → (terminal)
```

### 6.3 Maintenance Flow

#### Current State
```
Maintenance Manager creates record (links to asset)
  → Sets priority, type, frequency
  → Status starts at "Pending"
  → Can change to any status at any time
  → If replacement needed → opens acquisition modal → creates PO
```

**Problems:**
- No status transition enforcement
- No work order assignment tied to a specific employee with due date
- No cost approval for expensive maintenance
- No condition update on the asset itself after maintenance
- TaskItem entity is a generic task system disconnected from maintenance workflow

#### Corrected Flow
```
1. REPORT
   → Maintenance Manager (or Employee via request) logs issue
   → Selects asset, describes problem, sets priority
   → Status = "Reported"
   → Asset.Status optionally updated to "Under Maintenance"

2. ASSESSMENT
   → Maintenance Manager reviews and assesses
   → Determines: repair vs. replace
   → Estimates cost
   → Status → "Assessed"

3. APPROVAL (if cost exceeds threshold)
   → Admin or Finance approves maintenance cost
   → Status → "Approved"
   → If replacement: triggers PO Request flow

4. WORK ORDER (replaces generic TaskItem)
   → Create work order with: assigned technician, scheduled date, parts needed
   → Status → "In Progress"
   → Technician updates progress

5. COMPLETION
   → Work done, tested
   → Maintenance Manager reviews and signs off
   → Status → "Completed"
   → Asset.Status updated back to "Operational"
   → Cost finalized and recorded

6. CLOSURE
   → Record archived after review period
   → Cost attributed to asset total maintenance cost

VALID STATUS TRANSITIONS:
  Reported → Assessed | Cancelled
  Assessed → Approved | Cancelled (if cost approval needed)
  Assessed → In Progress (if no approval needed)
  Approved → In Progress
  In Progress → Completed | On Hold
  On Hold → In Progress | Cancelled
  Completed → Closed
  Cancelled → (terminal)
  Closed → (terminal)
```

### 6.4 Disposal Flow (NEW — Does Not Exist)

```
1. INITIATE (Admin requests disposal)
   → Select asset, reason (obsolete, damaged, surplus, expired)
   → Propose disposal method: sell, donate, scrap, trade-in
   → Enter salvage/residual value estimate
   → Status = "Disposal Requested"

2. FINANCIAL REVIEW (Finance Manager)
   → Review current book value vs salvage value
   → Calculate write-off impact
   → Approve or reject disposal
   → Status → "Disposal Approved" or "Disposal Rejected"

3. EXECUTION
   → Asset physically removed/sold/scrapped
   → Record: actual proceeds (if sold), disposal date, disposal handler
   → Status → "Disposed"

4. FINANCIAL CLOSE
   → Write off remaining book value
   → Record loss/gain on disposal
   → Asset.Status = "Disposed"
   → Asset archived (not deleted — must retain history)

REQUIRED DATA MODEL ADDITIONS:
  - Asset: add DisposalDate, DisposalMethod, DisposalReason, SalvageValue, DisposalApprovedBy
  - New entity: DisposalRecord (Id, AssetId, Reason, Method, EstimatedSalvageValue,
    ActualProceeds, BookValueAtDisposal, DisposalDate, ApprovedBy, Status, TenantId)
```

### 6.5 Archiving Logic Correction

#### Current State — Inconsistent
| Entity | Archive Mechanism | Problems |
|---|---|---|
| Asset | `Archived` bool + `Status = "Archived"` | Dual flag — which is authoritative? |
| Room | `Archived` bool + `Status = "Deactivated"` | Status says "Deactivated", not "Archived" — mismatch |
| MaintenanceRecord | `Archived` bool | Only bool, no status change |
| PurchaseOrder | `Archived` bool | Only bool, no status change |
| TaskItem | `Archived` bool | Only bool, no status change |
| Employee | `Status = "Archived"` | Only status string, no bool |
| Department | `Status = "Archived"` | Only status string, no bool |
| Role | `Status = "Archived"` | Only status string, no bool |
| AssetCategory | `Status = "Archived"` | Only status string, no bool |
| RoomCategory | `Archived` bool + `Status = "Archived"` | Dual flag — both used |

#### Corrected Standard
**Standardize on ONE mechanism across all entities:**

Use `Archived` boolean + `ArchivedAt` DateTime + `ArchivedBy` int (user ID).

- `Archived = true` means soft-deleted / hidden from active lists
- `Status` field tracks *business state* (Active, Under Maintenance, Disposed, etc.) — not visibility
- Archive is about *visibility*, Status is about *business lifecycle*
- Never set `Status = "Archived"` — that conflates two concepts

### 6.6 Audit Logging (NEW — Does Not Exist)

#### Required
Every data mutation must create an immutable audit record:

```
AuditLog:
  Id (int, PK)
  TenantId (int)
  UserId (int)
  UserName (string)
  Action (string: "Create", "Update", "Delete", "Archive", "Restore", "Approve", "Reject")
  EntityType (string: "Asset", "MaintenanceRecord", etc.)
  EntityId (string)
  Timestamp (DateTime, UTC)
  OldValues (JSON string, nullable — for updates)
  NewValues (JSON string)
  IpAddress (string, nullable)
```

**Implementation:** EF Core `SaveChanges` interceptor or explicit service-layer logging calls.

**Retention:** Audit logs are immutable. No update, no delete. Archive after configurable retention period (default: 7 years for asset records per accounting standards).

---

# PHASE 6 — CONTROLLER + SERVICE QA

---

## 7. Controller Refactor Plan

### 7.1 Current State Assessment

| Problem | Severity | Controllers Affected |
|---|---|---|
| **Fat controllers** — all business logic (validation, calculations, status checks, queries) lives in controller actions | Critical | All 13 controllers |
| **No service layer** — controllers inject `AppDbContext` directly | Critical | All 13 controllers |
| **No transaction handling** — TenantsController does 2 `SaveChanges()` calls without a transaction | High | TenantsController |
| **Inconsistent error responses** — some return `BadRequest(string)`, some return `BadRequest(object)` | Medium | Mixed |
| **No input validation beyond `[Required]`** — DTOs use minimal validation attributes | High | All |
| **No standardized response envelope** — some return raw entities, some return DTOs, some return anonymous objects | Medium | Mixed |
| **Depreciation calculated only on create/financial-update** — not dynamically recalculated | Medium | AssetsController |
| **String-typed dates** — PurchaseOrder.PurchaseDate and CreatedAt stored as strings | Medium | PurchaseOrdersController |

### 7.2 Target Service Layer Structure

```
Services/
+-- Interfaces/
|   +-- IAssetService.cs
|   +-- IMaintenanceService.cs
|   +-- IPurchaseOrderService.cs
|   +-- IRoomService.cs
|   +-- IEmployeeService.cs
|   +-- IDepartmentService.cs
|   +-- IPositionService.cs          (renamed from IRoleService)
|   +-- IAssetCategoryService.cs
|   +-- IRoomCategoryService.cs
|   +-- ITenantService.cs
|   +-- IAuthService.cs
|   +-- IPermissionService.cs
|   +-- IAuditLogService.cs
|   +-- IUserService.cs              (NEW)
|
+-- Implementations/
    +-- AssetService.cs
    +-- MaintenanceService.cs
    +-- PurchaseOrderService.cs
    +-- RoomService.cs
    +-- EmployeeService.cs
    +-- DepartmentService.cs
    +-- PositionService.cs
    +-- AssetCategoryService.cs
    +-- RoomCategoryService.cs
    +-- TenantService.cs
    +-- AuthService.cs
    +-- PermissionService.cs
    +-- AuditLogService.cs
    +-- UserService.cs
```

### 7.3 Service Layer Responsibilities

Each service:
1. **Receives** pre-validated DTO from controller
2. **Checks permissions** via `IPermissionService`
3. **Executes business logic** (calculations, state transitions, cross-entity validation)
4. **Calls `AppDbContext`** for data operations
5. **Logs audit trail** via `IAuditLogService`
6. **Returns** result DTO or throws domain exception
7. **Manages transactions** where multiple saves are needed

### 7.4 Controller Pattern (Post-Refactor)

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssetsController : TenantAwareController
{
    private readonly IAssetService _assetService;

    public AssetsController(IAssetService assetService)
    {
        _assetService = assetService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<AssetResponseDto>>>> GetAssets(
        [FromQuery] bool? showArchived)
    {
        var tenantId = GetCurrentTenantId();
        var result = await _assetService.GetAssets(tenantId, showArchived);
        return Ok(ApiResponse.Success(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<AssetResponseDto>>> CreateAsset(
        [FromBody] CreateAssetDto dto)
    {
        var userId = GetCurrentUserId();
        var tenantId = GetRequiredTenantId();
        var result = await _assetService.CreateAsset(dto, tenantId, userId);
        return CreatedAtAction(nameof(GetAsset), new { id = result.Id }, ApiResponse.Success(result));
    }
}
```

### 7.5 Standardized API Response Envelope

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string>? Errors { get; set; }
    public int StatusCode { get; set; }
}

public class ApiResponse
{
    public static ApiResponse<T> Success<T>(T data, string? message = null)
        => new() { Success = true, Data = data, StatusCode = 200, Message = message };

    public static ApiResponse<T> Created<T>(T data)
        => new() { Success = true, Data = data, StatusCode = 201 };

    public static ApiResponse<object> Error(string message, int statusCode = 400)
        => new() { Success = false, Message = message, StatusCode = statusCode };

    public static ApiResponse<object> ValidationError(List<string> errors)
        => new() { Success = false, Errors = errors, StatusCode = 422 };
}
```

### 7.6 Validation Strategy

**Layer 1 — DTO Attributes:** `[Required]`, `[StringLength]`, `[Range]`, `[RegularExpression]` for format validation. ASP.NET ModelState handles this automatically.

**Layer 2 — Service Business Rules:** Uniqueness checks, cross-entity validation (e.g., CategoryId exists), status transition validation, permission checks, tenant boundary enforcement.

**Layer 3 — Database Constraints:** Unique indexes, FK constraints (once added), not-null constraints.

### 7.7 Error Handling Strategy

```csharp
// Domain exceptions
public class NotFoundException : Exception { }
public class DuplicateException : Exception { }
public class ForbiddenException : Exception { }
public class BusinessRuleException : Exception { }
public class InvalidStatusTransitionException : BusinessRuleException { }

// Global exception handler middleware
public class ExceptionHandlingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try { await next(context); }
        catch (NotFoundException ex)    { /* 404 */ }
        catch (DuplicateException ex)   { /* 409 */ }
        catch (ForbiddenException ex)   { /* 403 */ }
        catch (BusinessRuleException ex){ /* 422 */ }
        catch (Exception ex)            { /* 500 — log, return generic message */ }
    }
}
```

### 7.8 Transaction Handling

Current `TenantsController.CreateTenant` does two `SaveChangesAsync()` calls (tenant first to get ID, then user) without a transaction. If the second save fails, an orphan tenant exists.

**Fix:** Use explicit transactions wherever multiple saves are required:

```csharp
using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // save tenant
    // save user
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

---

# DELIVERABLES 5 & 8 — BACKEND ENFORCEMENT & SECURITY

---

## 5. Backend Enforcement Strategy

### 5.1 Tenant Isolation — Current Gaps & Fixes

| Gap | Current State | Required Fix |
|---|---|---|
| No global query filter | Tenant filtering is manual in every controller action | Add EF Core global query filter: `.HasQueryFilter(e => EF.Property<int?>(e, "TenantId") == _tenantId)` |
| Super Admin has write access to all tenant data | Listed in every controller's `[Authorize]` roles | Remove SA from tenant-aware CRUD; create read-only oversight endpoints |
| No tenant validation on related entities | Creating a maintenance record for another tenant's asset? Controller checks, but one miss = data leak | Service layer validates cross-entity tenant ownership for every FK-like reference |
| `RequireTenantFilter` has no tests | Critical security filter without verification | Unit test coverage required |

### 5.2 Permission Enforcement Flow

```
HTTP Request
  → [Authorize] attribute (is user authenticated?)
  → TenantAwareController.RequireTenantFilter (does user have a tenant claim?)
  → Controller extracts userId, tenantId
  → Controller calls Service method
  → Service calls PermissionService.HasPermission(userId, module, action)
  → If denied: throw ForbiddenException
  → If allowed: proceed with business logic
  → Service validates tenantId on all related entities
  → Service performs operation + audit log
  → Controller returns standardized response
```

### 5.3 Status Transition Enforcement

Implement state machines for entities with lifecycle statuses:

**Asset Status Machine:**
```
Registered → Verified → Active
Active → Under Maintenance → Active
Active → Disposal Requested → Disposal Approved → Disposed
Active → Archived (soft-delete visibility only, not a business state)
```

**PurchaseOrder Status Machine:**
```
Requested → Approved → Ordered → Delivered → Completed
Requested → Rejected (terminal)
Approved → Cancelled (terminal)
Ordered → Cancelled (terminal)
```

**MaintenanceRecord Status Machine:**
```
Reported → Assessed → [Approved →] In Progress → Completed → Closed
Any active state → Cancelled (terminal)
In Progress → On Hold → In Progress
```

**Implementation:** State machine validation in each service:
```csharp
private static readonly Dictionary<string, HashSet<string>> ValidTransitions = new()
{
    ["Requested"] = new() { "Approved", "Rejected" },
    ["Approved"] = new() { "Ordered", "Cancelled" },
    ["Ordered"] = new() { "Delivered", "Cancelled" },
    ["Delivered"] = new() { "Completed" },
};

public void ValidateTransition(string current, string next)
{
    if (!ValidTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next))
        throw new InvalidStatusTransitionException(current, next);
}
```

---

## 8. Security Checklist

### Authentication

| # | Check | Current State | Status |
|---|---|---|---|
| 1 | JWT secret key minimum length (256 bits) | Key from config — length not validated | WARN |
| 2 | Token expiry reasonable | 7 days — too long for enterprise | FAIL |
| 3 | Token refresh mechanism | None — user must re-login after 7 days | FAIL |
| 4 | Password policy (complexity, length) | None — any password accepted | FAIL |
| 5 | Password change / forgot-password | Not implemented | FAIL |
| 6 | Account lockout after failed attempts | Not implemented | FAIL |
| 7 | HTTPS enforcement | `RequireHttpsMetadata = false` | FAIL |
| 8 | Password hashing algorithm | BCrypt — acceptable | PASS |
| 9 | JWT claims contain sensitive data? | Only userId, email, role, tenantId — acceptable | PASS |
| 10 | Token stored securely | `localStorage` — vulnerable to XSS | WARN |

### Authorization

| # | Check | Current State | Status |
|---|---|---|---|
| 11 | All endpoints require authentication | All except `/api/auth/login` and `/api/health` | PASS |
| 12 | Role-based access on all controllers | Yes — `[Authorize(Roles=...)]` | PASS |
| 13 | Tenant isolation enforced | Manual per-controller, no global filter | WARN |
| 14 | Super Admin write access restricted | SA has write access to all tenant data | FAIL |
| 15 | No role validation on user registration | `POST /api/auth/register` accepts any role string | FAIL |
| 16 | Employee role has zero access | Not listed on any controller | FAIL (by design gap) |

### Data Security

| # | Check | Current State | Status |
|---|---|---|---|
| 17 | SQL injection protection | EF Core parameterized queries | PASS |
| 18 | PasswordHash excluded from responses | `[JsonIgnore]` on User.PasswordHash | PASS |
| 19 | No sensitive data in error responses | Controllers return custom messages, not stack traces | PASS |
| 20 | CORS policy | `AllowAnyOrigin` — too permissive for production | FAIL |
| 21 | Rate limiting | None | FAIL |
| 22 | FK constraints prevent orphan data | Only 1 FK in entire schema | FAIL |
| 23 | Input validation on DTOs | Minimal — only `[Required]` on a few fields | WARN |

### Infrastructure

| # | Check | Current State | Status |
|---|---|---|---|
| 24 | Secrets in config (not hardcoded) | `appsettings.json` — acceptable with env overrides | PASS |
| 25 | Database connection string secured | Config-based with env override support | PASS |
| 26 | Audit logging | Not implemented | FAIL |
| 27 | Request/response logging | Not implemented | WARN |
| 28 | Exception handling middleware | Not implemented — raw exceptions may leak in 500s | FAIL |
| 29 | Health check endpoint | Exists at `/api/health` | PASS |
| 30 | Static file cache headers | Default (no explicit cache policy) | WARN |

### Summary

| Status | Count |
|---|---|
| PASS | 10 |
| WARN | 5 |
| FAIL | 15 |

**Critical Failures:** No rate limiting, no account lockout, no password policy, no CORS restriction, no audit logging, no global exception handling, token expiry too long, Super Admin has unrestricted write access, user registration accepts any role string.

---

# REMAINING DELIVERABLES

---

## 9. Missing Enterprise Features

### Critical Priority (Must Have for Enterprise FAMS)

| # | Feature | Current State | Impact |
|---|---|---|---|
| 1 | **Audit Trail** | Not implemented | Cannot track who changed what — compliance failure |
| 2 | **Disposal / Write-Off Workflow** | Not implemented | Asset lifecycle incomplete — assets can only be "archived" |
| 3 | **Approval Workflows** | PO has status field but no approval enforcement | No authorization control over purchases and disposals |
| 4 | **User Management** (tenant-level) | No UI; register endpoint exists but no list/edit/deactivate | Tenant admins cannot manage their team |
| 5 | **Status Transition Validation** | All status changes accept any value | Data integrity compromise — Delivered PO can become Pending |
| 6 | **Service Layer** | All logic in controllers | Untestable, unreusable, transaction-unsafe |
| 7 | **Global Query Filters** | Manual tenant filtering | One missed filter = cross-tenant data leak |
| 8 | **FK Constraints** | 1 FK in entire schema | No referential integrity — orphan records everywhere |
| 9 | **Exception Handling Middleware** | Not implemented | Unhandled exceptions may expose stack traces |
| 10 | **CORS Restriction** | `AllowAnyOrigin` | Any external site can call the API |

### High Priority

| # | Feature | Description |
|---|---|---|
| 11 | **Asset Custody Tracking** | Track which employee currently holds each asset |
| 12 | **Asset Transfer Workflow** | Move assets between rooms/departments with approval |
| 13 | **Vendor Management** | Entity with contact, contracts, rating — not just a string on PO |
| 14 | **Financial Reports** | Depreciation schedules, asset value summaries, disposal reports |
| 15 | **Pagination** | Server-side pagination on all list endpoints |
| 16 | **Password Management** | Change password, forgot password, password policy |
| 17 | **Account Lockout** | Lock after N failed attempts |
| 18 | **Rate Limiting** | Prevent API abuse |
| 19 | **Token Refresh** | Short-lived access tokens + refresh token pattern |
| 20 | **Role Template System** | Replace hardcoded `[Authorize(Roles=...)]` with dynamic permissions |

### Medium Priority

| # | Feature | Description |
|---|---|---|
| 21 | **Bulk Operations** | Bulk import/export assets (CSV/Excel) |
| 22 | **Global Search** | Server-side search across all entities |
| 23 | **QR/Barcode Integration** | Generate and scan QR codes for asset identification |
| 24 | **Email Notifications** | Alerts for maintenance due dates, PO approvals, task assignments |
| 25 | **Dashboard Role Customization** | Each role sees relevant KPIs, not just stat cards |
| 26 | **File Upload for Attachments** | Asset images, maintenance photos, PO documents |
| 27 | **Tenant Settings Page** | Allow tenant admins to configure their organization |
| 28 | **Multi-Method Depreciation** | Declining balance, units-of-production alongside straight-line |

---

## 10. Redundant Components to Remove

| # | Component | Location | Reason | Action |
|---|---|---|---|---|
| 1 | **`Asset.Cat` field** | `Models/Asset.cs` | Dead column — replaced by `CategoryId`. Never read or written by any controller. | Remove from model, create migration to drop column |
| 2 | **Generic `TaskItem` entity/controller** | `Models/TaskItem.cs`, `Controllers/TasksController.cs`, `src/hooks/use-tasks.ts`, `src/app/maintenancemanager/tasks/page.tsx` | Should be replaced by Work Orders within the Maintenance module. Current implementation is a disconnected generic task system. | Refactor into `WorkOrder` entity linked to `MaintenanceRecord` |
| 3 | **`Role` model naming** | `Models/Role.cs`, `Controllers/RolesController.cs` | Confusing — conflicts with auth role concept. These are organizational job titles/positions. | Rename to `Position` (model, controller, DTOs, frontend types/hooks) |
| 4 | **Duplicate `Tenant` interface** | `src/hooks/use-tenants.ts` (local interface) | Duplicates `Tenant` interface from `src/types/asset.ts` | Remove local interface, import from `types/asset.ts` |
| 5 | **Subscription plan enforcement code** | `Models/Tenant.cs` (`Create()` factory), `Tenant.MaxRooms/MaxPersonnel/MaintenanceModule/ReportsLevel` | Feature limits are set but never checked by any controller or service | Either implement enforcement or remove the fields (per SaaS exclusion directive, remove) |
| 6 | **Dual archive flags** | Multiple entities use both `Archived` bool AND `Status = "Archived"` | Conflates visibility (archived) with business state (status). | Standardize: `Archived` bool = visibility, `Status` = business lifecycle. Remove `Status = "Archived"` pattern. |
| 7 | **`PurchaseOrder.PurchaseDate` as string** | `Models/PurchaseOrder.cs` | Should be `DateTime?`, not string. Prevents date operations. | Change to `DateTime?`, create migration |
| 8 | **`PurchaseOrder.CreatedAt` as string** | `Models/PurchaseOrder.cs` | Same as above. Should be `DateTime`. | Change to `DateTime`, create migration |
| 9 | **Procurement as separate auth role** | `User.Role = "Procurement"`, frontend nav filtering | Procurement responsibilities overlap almost entirely with Admin in the current design. No unique pages, no unique endpoints. | Merge into TenantAdmin scope OR create dedicated procurement pages to justify the role |
| 10 | **Notification bell in header** | `src/components/app-shell.tsx` | Decorative — badge shows but no notification system exists. | Remove until notification system is implemented |

---

# APPENDIX — IMPLEMENTATION PRIORITY ROADMAP

---

## Suggested Execution Order

### Sprint 1 — Foundation (Architecture Fix)
1. Add service layer interfaces and implementations for all modules
2. Refactor controllers to be thin (delegate to services)
3. Add global exception handling middleware
4. Add standardized API response envelope
5. Restrict CORS to known origins

### Sprint 2 — Data Integrity
1. Add EF Core FK constraints for all cross-entity references
2. Add global query filters for tenant isolation
3. Add status transition validation (state machines)
4. Fix PurchaseOrder date fields (string → DateTime)
5. Remove `Asset.Cat` dead column
6. Standardize archive pattern across all entities

### Sprint 3 — Permission System
1. Add RoleTemplate/RolePermission/TenantRole/UserRoleAssignment tables
2. Seed default permission matrix
3. Implement PermissionService
4. Migrate existing users to UserRoleAssignment
5. Add `/superadmin/role-templates` page

### Sprint 4 — User Management & Security
1. Build tenant-level user management page (list, create, edit, deactivate)
2. Add password change / password policy
3. Implement token refresh pattern (reduce token life to 15-30 min)
4. Add rate limiting middleware
5. Add account lockout after failed login attempts

### Sprint 5 — Business Process Completion
1. Implement PO approval workflow with Finance sign-off
2. Implement disposal workflow (request, approve, execute)
3. Implement audit trail logging on all data mutations
4. Rename Role → Position (model/controller/frontend)
5. Refactor TaskItem → WorkOrder (linked to MaintenanceRecord)

### Sprint 6 — Enterprise Features
1. Add vendor management entity and CRUD
2. Add asset custody tracking (employee assignment)
3. Add asset transfer workflow (room-to-room with tracking)
4. Add pagination to all list endpoints
5. Add financial reporting (depreciation schedules, asset value reports)

---

*End of Enterprise Architecture Audit*
