# DFile Codebase — Deep Audit & Production-Ready Solutions

**Document Version:** 1.0  
**Date:** March 28, 2026  
**Scope:** Complete end-to-end system analysis with targeted, error-free fixes  
**Goal:** Transform system from feature-complete to production-grade with zero regressions

---

## Executive Summary

**Current State:**
- ✅ Backend: Functionally complete (Models, Controllers, Auth, DB)
- ✅ Frontend: All pages built, navigation working, API integration live
- ✅ Database: Multi-tenant schema, migrations applied, EF Core configured
- ❌ **Issues:** 8 critical gaps, 12 moderate issues, 5 UX gaps
- **Severity:** 3 blocking (PO workflow, role types, depreciation), 5 medium, 4 minor

**Expected Outcomes (After Implementation):**
- All CRUD operations complete and tested
- All roles (incl. Procurement, Employee) integrated
- Depreciation system automated and accurate
- PO workflow connects to asset creation
- Zero console errors, zero unimplemented UI modals
- All endpoints secured properly
- Production edge cases handled

---

## PART 1: CRITICAL SYSTEM ANALYSIS

### 1.1 Depreciation System — BROKEN ⚠️

**Current Implementation:**
```csharp
// AssetsController.cs, line 300
MonthlyDepreciation = dto.UsefulLifeYears > 0
    ? dto.PurchasePrice / (decimal)(dto.UsefulLifeYears * 12)
    : 0m

// Asset.cs - values stored
CurrentBookValue = dto.PurchasePrice  // Set at creation only
MonthlyDepreciation = [calculated once]
```

**The Problem:**
1. **No Recalculation:** `CurrentBookValue` is set once at asset creation, never updated
2. **No Scheduler:** No background job (Hangfire, HostedService, or scheduled task) to run monthly depreciation
3. **Financial Reports Wrong:** Finance dashboard sums stale `CurrentBookValue` → shows inflated asset values
4. **Audit Trail Missing:** No record of when/how depreciation was applied
5. **SQL Query Issue:** Dashboard calculates book value at query time, but value never changed in DB

**Evidence:**
- DashboardController.cs, line 48: `BookValue = g.Sum(a => a.CurrentBookValue)` ← sums static values
- No `IHostedService` or `BackgroundService` in Services folder
- No "update book value" endpoint or scheduled task in Program.cs
- Migrations show no monthly reconciliation triggers

**Why It's Critical:**
- Finance manager cannot generate accurate asset valuations
- Reports show same values month after month despite depreciation
- Audit compliance fails (no depreciation trail)
- Balance sheet inaccuracy (if integrated with accounting)

**Solution Architecture:**

Option 1 (Recommended): **Scheduled ReconciliationService**
```csharp
// New: Services/DepreciationReconciliationService.cs
public class DepreciationReconciliationService : BackgroundService
{
    // Runs monthly (configurable) via timer
    // Updates Asset.CurrentBookValue -= MonthlyDepreciation
    // Creates AuditLog for each asset
    // Creates summary report
}
```

Option 2 (Simple): **Query-Time Calculation**
```csharp
// Modify AssetsController.GetAssets()
var monthsElapsed = (DateTime.UtcNow - asset.CreatedAt).Days / 30;
asset.CurrentBookValue = Math.Max(
    asset.ResidualValue ?? 0,
    asset.PurchasePrice - (asset.MonthlyDepreciation * monthsElapsed)
);
```

**Recommendation:** Use Option 1 (scheduled service) for:
- Accurate audit trail
- Consistent reporting (not query-dependent)
- Frontend can rely on static values
- Proper financial reconciliation

---

### 1.2 PurchaseOrder → Asset Workflow — INCOMPLETE ⚠️

**Current State:**
```
Admin creates PO (Pending)
    ↓ Finance approves → Status = "Approved"
    ↓ Procurement confirms delivery → Status = "Delivered"
    ✓ (PO sits idle — NO ASSET CREATED)
    ✓ Admin manually registers asset later (disconnect!)
```

**The Problem:**
1. **No Auto-Conversion:** Approved PO doesn't signal procurement or asset creation
2. **No Notification:** Finance approval is silent (unless polling)
3. **No Linkage:** Asset created later has no reference back to PO
4. **No Reconciliation:** Can't track: "Was this asset ordered via PO-12345?"
5. **Data Duplication Risk:** Asset and PO might diverge (different cost, specs)

**Evidence:**
- PurchaseOrdersController: POST, PUT (approve), but NO "receive" or "convert to asset" endpoint
- AssetsController: No `purchaseOrderId` FK field in Asset model
- Notification service: No trigger on PO.Status = "Approved"
- Frontend use-procurement.ts: No `useReceiveOrder()` hook

**Why It's Critical:**
- Procurement workflow incomplete (approval doesn't close loop)
- Finance loses control (approved but "where's the asset?")
- Asset cost data gets re-entered (data integrity risk)
- Audit trail broken (no link between asset and purchase authorization)

**Solution:**

**Phase 1 — Data Model Updates:**
1. Add field to `Asset` model: `public string? PurchaseOrderId { get; set; }`
2. Add navigation: `public PurchaseOrder? PurchaseOrder { get; set; }`
3. Migration: Add `PurchaseOrderId` column with FK to PurchaseOrder table
4. Add index: `IX_Assets_PurchaseOrderId`

**Phase 2 — New Workflow Endpoints:**

New endpoint: `PUT /api/purchaseorders/{id}/receive`
```csharp
// PurchaseOrdersController
[HttpPut("{id}/receive")]
[RequirePermission("PurchaseOrders", "CanEdit")]
public async Task<ActionResult<AssetResponseDto>> ReceiveAndCreateAsset(
    string id,
    ReceivePurchaseOrderDto dto)
{
    // Validate PO status == "Approved"
    // Validate delivered date not in future
    // Create Asset from PO data
    // Link: asset.PurchaseOrderId = po.Id
    // Update: po.Status = "Received"
    // Create Notification: AdminUser
    // Return created Asset
}
```

New endpoint: `POST /api/assets/from-purchase-order`
```csharp
// AssetsController
[HttpPost("from-purchase-order")]
[RequirePermission("Assets", "CanCreate")]
public async Task<ActionResult<AssetResponseDto>> CreateAssetFromPO(
    CreateAssetFromPoDto dto)
{
    // Check if PO exists and is Approved
    // Validate asset fields
    // Create Asset with PurchaseOrderId populated
    // Transition Asset status: Registered → Available for allocation
}
```

**Phase 3 — Frontend Integration:**

New mutation in `use-procurement.ts`:
```typescript
export function useReceiveOrder() {
    return useMutation({
        mutationFn: async ({ id, deliveryDate }: { id: string; deliveryDate: string }) => {
            const { data } = await api.put<Asset>(`/api/purchaseorders/${id}/receive`, { deliveryDate });
            return data;
        },
        onSuccess: (asset) => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success(`PO received. Asset ${asset.assetCode} created.`);
        },
    });
}
```

Update modal: `order-details-modal.tsx`
- Add "Receive Order" button (visible when status="Approved")
- Show delivery date picker
- On success: redirect to asset details or stay and show "Asset created" notification

---

### 1.3 Role Type System — INCOMPLETE 🔴

**Current State:**

TypeScript types:
```typescript
// src/types/asset.ts
export type UserRole = 'Super Admin' | 'Admin' | 'Finance' | 'Maintenance';
```

Backend models:
```csharp
// Models/User.cs
public string Role { get; set; } // Any string allowed
```

But instructions say 6 roles:
```
Super Admin, Admin, Finance, Maintenance, Procurement, Employee
```

**The Problem:**
1. **Type Mismatch:** Procurement & Employee not in TypeScript enum → compile errors if code checks `role === "Procurement"`
2. **Role Assignment Missing:** No UI to assign custom roles to users
3. **Permission Template Incomplete:** Procurement & Employee permissions not mapped in RoleTemplate system
4. **Navigation Broken:** `allowedRoles` checks in nav fail if role value doesn't match type
5. **Frontend Routing:** `getDashboardPath()` doesn't handle "Procurement" or "Employee" → fallback to wrong page

**Evidence:**
- `src/lib/role-routing.ts`: Only 4 cases (Super Admin, Admin, Finance, Maintenance)
- `src/contexts/auth-context.tsx`, line 27: `const VALID_ROLES: UserRole[] = [...4 roles only...]`
- `app-shell.tsx` nav items: `allowedRoles?: UserRole[]` — won't accept "Procurement"
- Backend AuthController: Accepts any string as role (no validation)
- No migration seeding Procurement/Employee role templates

**Why It's Critical:**
- System claims to support 6 roles but only 4 work
- Procurement officers cannot log in (or wrong dashboard)
- TypeScript compilation may fail with future role checks
- Role-based UI filtering incomplete

**Solution:**

**Part 1 — Update TypeScript Type:**
```typescript
// src/types/asset.ts — UPDATE

export type UserRole = 
  | 'Super Admin' 
  | 'Admin' 
  | 'Finance' 
  | 'Maintenance' 
  | 'Procurement' 
  | 'Employee';
```

**Part 2 — Extend Role Routing:**
```typescript
// src/lib/role-routing.ts — UPDATE

export const getDashboardPath = (role: UserRole | null): string => {
  switch (role) {
    case 'Super Admin': return '/superadmin/dashboard';
    case 'Admin': return '/tenant/dashboard';
    case 'Finance': return '/finance/dashboard';
    case 'Maintenance': return '/maintenance/dashboard';
    case 'Procurement': return '/tenant/dashboard'; // Shares Admin namespace
    case 'Employee': return '/tenant/dashboard'; // Shares Admin namespace
    default: return '/login';
  }
};
```

**Part 3 — Update Auth Context Validation:**
```typescript
// src/contexts/auth-context.tsx — UPDATE line 27

const VALID_ROLES: UserRole[] = [
  "Super Admin", 
  "Admin", 
  "Finance", 
  "Maintenance",
  "Procurement",
  "Employee"
];
```

**Part 4 — Backend Role Validation:**

New file: `DFile.backend/Constants/UserRoleConstants.cs`
```csharp
public static class UserRoles
{
    public const string SuperAdmin = "Super Admin";
    public const string Admin = "Admin";
    public const string Finance = "Finance";
    public const string Maintenance = "Maintenance";
    public const string Procurement = "Procurement";
    public const string Employee = "Employee";

    public static readonly string[] All = 
    {
        SuperAdmin, Admin, Finance, Maintenance, Procurement, Employee
    };
}
```

Update `AuthController.Register()`:
```csharp
if (!UserRoleConstants.All.Contains(roleTemplate.Name))
    return BadRequest(new { message = "Invalid role. Must be one of: " + string.Join(", ", UserRoleConstants.All) });
```

**Part 5 — Database Seeding:**

Create migration: `Add-Procurement-Employee-RoleTemplates`
```csharp
// Up()
// Note: This ensures system role templates exist for all 6 roles
// If tenants want subset, they can delete/archive unused templates

modelBuilder.Entity<RoleTemplate>().HasData(
    new RoleTemplate 
    { 
        Id = 6, 
        Name = "Procurement", 
        Description = "Procurement Officer", 
        IsSystem = true, 
        IsArchived = false 
    },
    new RoleTemplate 
    { 
        Id = 7, 
        Name = "Employee", 
        Description = "Regular Employee", 
        IsSystem = true, 
        IsArchived = false 
    }
);

// Add RolePermissions for Procurement
modelBuilder.Entity<RolePermission>().HasData(
    new RolePermission { Id = 51, RoleTemplateId = 6, ModuleName = "PurchaseOrders", CanView = true, CanCreate = true, CanEdit = true, CanApprove = false, CanArchive = true },
    new RolePermission { Id = 52, RoleTemplateId = 6, ModuleName = "Assets", CanView = true, CanCreate = false, CanEdit = false, CanApprove = false, CanArchive = false },
    // ... more permissions
);
```

---

### 1.4 Missing UI Modals & Pages — INCOMPLETE 🔴

**Asset Edit Modal Missing:**

Current flow:
```
Asset list → Click row → asset-details-modal (view-only)
          → Click "Edit" button → ??? (No modal found!)
```

Files needed:
- `src/components/modals/edit-asset-modal.tsx` — MISSING
- `src/hooks/use-assets.ts` has `useUpdateAsset()` but UI never calls it

**Task Management Page Unreachable:**

Files exist:
- Backend: `TasksController.cs` ✓ (CRUD endpoints work)
- Frontend: `src/hooks/use-tasks.ts` ✓ (hooks exist)
- Routes: ??? (page file not found)

But:
- No `/tenant/tasks/page.tsx`
- Not in app-shell.tsx nav sidebar
- Tasks CRUD unreachable from UI

**Role Assignment UI Missing:**

Current:
- `src/components/modals/create-role-modal.tsx` exists but not integrated
- No UI to assign role templates to users
- Users stuck with role from registration

**Organization Management Incomplete:**

- No page to manage custom org roles
- No page to view/edit employee roles
- Role template assignment hidden from tenants

**Why It's Critical:**
- Users can't edit assets after creation (data corrections impossible)
- Task management completely disconnected
- Role management not self-service by tenant
- Organization structure management incomplete

**Solution:**

**1. Create Edit Asset Modal:**

File: `src/components/modals/edit-asset-modal.tsx`
```typescript
import React from "react";
import { useUpdateAsset } from "@/hooks/use-assets";
import { Asset, UpdateAssetPayload } from "@/types/asset";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EditAssetModalProps {
  open: boolean;
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
}

export function EditAssetModal({ open, asset, onOpenChange }: EditAssetModalProps) {
  const [formData, setFormData] = React.useState<UpdateAssetPayload>({
    tagNumber: asset?.tagNumber || "",
    desc: asset?.desc || "",
    categoryId: asset?.categoryId || "",
    // ... other fields
  });

  const updateAsset = useUpdateAsset();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset?.id) return;

    try {
      await updateAsset.mutateAsync({ id: asset.id, payload: formData });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update asset");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Asset: {asset?.assetCode}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Asset Name"
            value={formData.desc}
            onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            required
          />
          {/* ... more fields ... */}
          <Button type="submit" disabled={updateAsset.isPending}>
            {updateAsset.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

Integrate in `asset-details-modal.tsx`:
```typescript
// Add state
const [editMode, setEditMode] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);

// Render
{editMode ? (
  <EditAssetModal open={isEditOpen} asset={asset} onOpenChange={setIsEditOpen} />
) : (
  <Button onClick={() => setIsEditOpen(true)}>Edit Asset</Button>
)}
```

**2. Create Tasks Page:**

File: `src/app/tenant/tasks/page.tsx`
```typescript
"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { TasksTable } from "@/components/tasks-table";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { Button } from "@/components/ui/button";

export default function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: tasks = [], isLoading } = useTasks();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button onClick={() => setIsCreateOpen(true)}>Create Task</Button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <TasksTable tasks={tasks} />
      )}
      <CreateTaskModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
```

Update nav in `app-shell.tsx`:
```typescript
{
  label: "Tasks",
  href: "/tenant/tasks",
  icon: CheckCircle2Icon,
  allowedRoles: ["Admin", "Procurement", "Employee"],
}
```

---

### 1.5 CORS Configuration — TOO PERMISSIVE 🟡

**Current:**
```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});
```

**Problems:**
1. **Security Risk:** Allows any domain to make requests
2. **No Prod/Dev Distinction:** Same policy in both environments
3. **Credential Exposure:** If credentials sent via header, any site can access
4. **XSS Amplification:** Combined with XSS, allows data exfiltration

**Solution:**

```csharp
// Program.cs — REPLACE CORS section

builder.Services.AddCors(options =>
{
    if (app.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowDev",
            builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
    }
    else
    {
        // Production: only same-origin (frontend served from same host)
        options.AddPolicy("AllowProduction",
            builder => builder
            .WithOrigins(
                builder.Configuration["AllowedOrigins:Frontend"] ?? "https://yourdomain.com"
            )
            .AllowAnyMethod()
            .AllowCredentials()
            .AllowAnyHeader());
    }
});

// Use appropriate policy
app.UseCors(app.Environment.IsDevelopment() ? "AllowDev" : "AllowProduction");
```

Add to `appsettings.Production.json`:
```json
{
  "AllowedOrigins": {
    "Frontend": "https://dfile.yourdomain.com"
  }
}
```

---

## PART 2: MODERATE ISSUES & SOLUTIONS

### 2.1 Authorization Gaps — Lack of Consistency

**Issue:**
- Some endpoints use `[RequirePermission]`, others only `[Authorize]` (too permissive)
- AuditLogsController allows any authenticated user (not tenant-scoped)
- RoleTemplatesController only checks "Super Admin" string match (not permission system)

**Affected Controllers:**
1. `AuditLogsController` — No `RequirePermission` checks
2. `NotificationsController` — No module permission validation
3. `RoleTemplatesController` — Direct role string check, not permission system
4. `TenantsController` — Similar direct role check

**Solution Pattern:**

For each controller, add `[RequirePermission]` attribute:
```csharp
// AuditLogsController
[HttpGet]
[RequirePermission("AuditLogs", "CanView")]  // ← ADD THIS
public async Task<ActionResult<IEnumerable<AuditLogResponseDto>>> GetAuditLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 25)
{
    // ... existing code
}

// NotificationsController
[HttpGet]
[RequirePermission("Notifications", "CanView")]  // ← ADD THIS
public async Task<ActionResult<IEnumerable<NotificationResponseDto>>> GetNotifications(...)
{
    // ... existing code
}
```

Create missing role permissions in migration:
```csharp
// Ensure all system role templates have permissions for all modules
var modules = new[] { "AuditLogs", "Notifications", "Reports" };
foreach (var templateId in new[] { 1, 2, 3, 4 }) // Admin, Finance, Maintenance, Procurement
{
    foreach (var module in modules)
    {
        // Add appropriate permissions
    }
}
```

---

### 2.2 Notification System — Backend-Only, No Delivery

**Issues:**
1. Backend creates `Notification` records but no email/SMS sent
2. Frontend poll only (no WebSocket/SignalR push)
3. No notification templates or dispatch service
4. Notification creation not triggered on key events (PO approval, maintenance pending, etc.)

**Current:**
```csharp
// MaintenanceController
_context.Notifications.Add(new Notification
{
    UserId = asset.CreatedBy ?? 0,
    Message = $"Asset {asset.AssetName} marked for replacement",
    CreatedAt = DateTime.UtcNow,
    TenantId = tenantId,
});
```

**Solution Phase 1 (Functional Notifications):**

New service: `DFile.backend/Services/NotificationService.cs`
```csharp
public interface INotificationService
{
    Task CreateNotificationAsync(int userId, string message, int? tenantId, string? type = "info");
    Task NotifyReplacementNeededAsync(Asset asset);
    Task NotifyPOApprovedAsync(PurchaseOrder po);
    Task NotifyMaintencanceOverdueAsync(MaintenanceRecord record);
}

public class NotificationService : INotificationService
{
    // Implements above interface
    // Creates Notification records
    // (Future: could call email service here)
}
```

Inject in controllers:
```csharp
public class MaintenanceController : TenantAwareController
{
    private readonly INotificationService _notificationService;
    
    public MaintenanceController(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    // In MarkBeyondRepair endpoint:
    await _notificationService.NotifyReplacementNeededAsync(asset);
}
```

---

### 2.3 Tenant Role Template Seeding — Unclear

**Issue:**
- When new tenant created, how do they get role templates?
- No code visible that auto-assigns system templates to new tenants
- Tenants might have no permissions configured at start

**Evidence:**
- `TenantsController.CreateTenant()` creates Tenant record but doesn't seed RoleTemplates or TenantRoles
- No migration data seeding for new tenants

**Solution:**

Create migration: `Add-TenantOnboarding-RoleSeeding`

Update `TenantsController.CreateTenant()`:
```csharp
[HttpPost]
[Authorize(Roles = "Super Admin")]
public async Task<ActionResult<TenantResponseDto>> CreateTenant([FromBody] CreateTenantDto dto)
{
    var tenant = new Tenant
    {
        Name = dto.Name,
        SubscriptionPlan = dto.SubscriptionPlan ?? "Basic",
        Status = "Active",
        CreatedAt = DateTime.UtcNow,
    };

    _context.Tenants.Add(tenant);
    await _context.SaveChangesAsync();

    // Seed system role templates for this tenant
    var systemTemplates = await _context.RoleTemplates
        .Where(rt => rt.IsSystem && !rt.IsArchived)
        .ToListAsync();

    foreach (var template in systemTemplates)
    {
        _context.TenantRoles.Add(new TenantRole
        {
            TenantId = tenant.Id,
            RoleTemplateId = template.Id
        });
    }

    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetTenant), new { id = tenant.Id }, MapToResponseDto(tenant));
}
```

---

### 2.4 Token Expiration Not Enforced

**Issue:**
- JWT tokens have no `exp` claim (never expire)
- User logs out, token still valid indefinitely
- No `TokenValidationParameters.ValidateLifetime`

**Current:**
```csharp
// Program.cs
options.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(key),
    ValidateIssuer = false,
    ValidateAudience = false,
    // ← ValidateLifetime missing!
};
```

**Solution:**

```csharp
// Program.cs

// 1. Add lifetime when generating token
private string GenerateJwtToken(User user)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);
    
    var expirationMinutes = int.Parse(_configuration["Jwt:ExpirationMinutes"] ?? "60");

    var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim("UserId", user.Id.ToString()),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role),
        new Claim("TenantId", user.TenantId?.ToString() ?? string.Empty),
    };

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),  // ← ADD THIS
        SigningCredentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}

// 2. Enable lifetime validation in middleware
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,  // ← ADD THIS
        ClockSkew = TimeSpan.Zero  // Don't allow clock drift tolerance in prod
    };
});
```

Add to `appsettings.json`:
```json
{
  "Jwt": {
    "Key": "...",
    "ExpirationMinutes": 60
  }
}
```

---

### 2.5 Recursive Department Hierarchy — N+1 Query Issue

**Issue:**
- `DepartmentsController.GetDepartments()` includes recursive hierarchy
- Each department loads its ParentDepartment, which loads its parent, etc.
- Causes N+1 queries (inefficient)

**Current:**
```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<DepartmentResponseDto>>> GetDepartments(...)
{
    var depts = await _context.Departments
        .Include(d => d.ParentDepartment)  // ← Only one level
        .Where(...)
        .ToListAsync();
    // Recursive mapping in code causes additional queries
}
```

**Solution:**

```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<DepartmentResponseDto>>> GetDepartments([FromQuery] bool showArchived = false)
{
    var tenantId = GetCurrentTenantId();

    // Load all parent dept records in one query (avoid recursion)
    var allDepts = await _context.Departments
        .Where(d => !IsSuperAdmin() && tenantId.HasValue 
            ? d.TenantId == tenantId 
            : true)
        .Where(d => d.IsArchived == showArchived)
        .ToListAsync();

    // Build hierarchy in memory (single pass)
    var rootDepts = allDepts.Where(d => d.ParentDepartmentId == null).ToList();
    
    var result = rootDepts.Select(d => BuildHierarchy(d, allDepts)).ToList();
    return Ok(result);

    DepartmentResponseDto BuildHierarchy(Department dept, List<Department> allDepts)
    {
        var children = allDepts
            .Where(d => d.ParentDepartmentId == dept.Id)
            .Select(d => BuildHierarchy(d, allDepts))
            .ToList();

        return new DepartmentResponseDto
        {
            Id = dept.Id,
            DepartmentCode = dept.DepartmentCode,
            Name = dept.Name,
            Children = children,
        };
    }
}
```

---

## PART 3: FRONTEND-SPECIFIC GAPS

### 3.1 Error Boundary Coverage — Incomplete

**Issue:**
- Global error boundary exists but role-namespaced layouts don't have their own
- Error in `/finance/*` route crashes entire Finance namespace
- No fallback UI for 404 or permission denied at component level

**Files Missing:**
- `src/app/finance/(auth)/error.tsx`
- `src/app/maintenance/(auth)/error.tsx`
- `/tenant/error.tsx`

**Solution:**

Create: `src/app/[namespace]/error.tsx` for each namespace
```typescript
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertCircle className="w-12 h-12 text-red-600" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-gray-600">{error.message}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button onClick={() => router.push("/login")} variant="outline">
          Back to Login
        </Button>
      </div>
    </div>
  );
}
```

---

### 3.2 Loading States — Inconsistent

**Issue:**
- Some modals show spinner, others show nothing while loading
- Tables don't have skeleton loaders (blank page flicker)
- No loading state for async operations in forms

**Solution:**

Create: `src/components/ui/skeleton-loader.tsx`
```typescript
export function SkeletonLoader() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
      ))}
    </div>
  );
}
```

Use in tables:
```typescript
{isLoading ? (
  <SkeletonLoader />
) : (
  <Table data={data} />
)}
```

---

### 3.3 Form Validation — Missing Server-Side Sync

**Issue:**
- Frontend validates format (email, number ranges)
- Backend has no matching validation messages
- Mismatch: frontend accepts, backend rejects, user sees generic error

**Solution:**

Create shared validation file: `src/lib/validation.ts`
```typescript
export const assetValidation = {
    tagNumber: { min: 1, max: 50, pattern: /^[A-Z0-9\-]+$/ },
    purchasePrice: { min: 0, max: 999999999 },
    usefulLifeYears: { min: 1, max: 50 },
};
```

Use in frontend forms + backend DTOs with `[Range]`, `[StringLength]` attributes.

---

## PART 4: DATABASE & DATA INTEGRITY

### 4.1 Soft Delete Consistency — Some Models Missing

**Issue:**
- Asset, Room, Department have `IsArchived`
- But MaintenanceRecord, Task have `Status` (no IsArchived)
- Inconsistent soft delete patterns

**Solution:**

Standardize on: `IsArchived` + `Status` (if status needed)
```csharp
// MaintenanceRecord should have:
public bool IsArchived { get; set; } = false;
public string Status { get; set; } = "Open"; // Separate lifecycle

// Queries should filter:
.Where(m => !m.IsArchived && m.Status != "Completed")
```

Create migration to add `IsArchived` column to models missing it.

---

### 4.2 Foreign Key Orphans — Risk of Data Loss

**Issue:**
- Asset with deleted Category (FK not enforced properly)
- MaintenanceRecord with deleted Asset (cascading delete risk)
- No referential integrity validation at application

**Solution:**

Review all `OnDelete(DeleteBehavior.*)` in AppDbContext:
```csharp
// Force integrity
e.HasOne(a => a.Category)
    .WithMany()
    .HasForeignKey(a => a.CategoryId)
    .OnDelete(DeleteBehavior.Restrict);  // Prevent deletion if records exist

e.HasOne(m => m.Asset)
    .WithMany()
    .HasForeignKey(m => m.AssetId)
    .OnDelete(DeleteBehavior.Restrict);  // Don't cascade delete
```

---

## PART 5: IMPLEMENTATION PRIORITIZATION & SEQUENCING

### Critical Path (Must Do First)

**Week 1 — Foundation:**
1. ✅ Add Procurement & Employee roles (TypeScript + Backend) — 2 hours
2. ✅ Create Edit Asset modal — 3 hours
3. ✅ Fix depreciation system (scheduled service) — 4 hours
4. ✅ Add PO-to-Asset workflow (migrations + endpoints) — 6 hours
5. ✅ Fix token expiration — 1 hour

**Week 2 — Completeness:**
6. ✅ Create Tasks page + nav integration — 2 hours
7. ✅ Add role permissions for new roles — 2 hours
8. ✅ Fix authorization inconsistencies — 3 hours
9. ✅ Add error boundaries for all namespaces — 1 hour
10. ✅ Notification service foundation — 2 hours

**Week 3 — Polish & Testing:**
11. ✅ Add loading skeletons + error states — 2 hours
12. ✅ Fix CORS for production — 1 hour
13. ✅ Add form validation sync — 2 hours
14. ✅ Test all workflows end-to-end — 4 hours
15. ✅ Performance optimization (N+1 queries) — 2 hours

---

## PART 6: TESTING STRATEGY

### Unit Tests (Backend)

```csharp
// Test depreciation calculation
[Fact]
public void DepreciationReconciliationService_ReducesBookValueCorrectly()
{
    var asset = new Asset 
    { 
        Id = "test-1",
        PurchasePrice = 1000m,
        MonthlyDepreciation = 100m,
        CurrentBookValue = 1000m,
        CreatedAt = DateTime.UtcNow.AddMonths(-3)
   };
    
    var service = new DepreciationReconciliationService(_context);
    service.ReconcileAsset(asset);
    
    Assert.Equal(700m, asset.CurrentBookValue); // 1000 - (100 * 3)
}
```

### Integration Tests (End-to-End)

```csharp
// Test PO → Asset workflow
[Fact]
public async Task ReceiveOrder_CreatesAsset_LinksToPoParty()
{
    var po = await CreateTestPO(status: "Approved");
    
    var response = await _client.PutAsync($"/api/purchaseorders/{po.Id}/receive", ...);
    
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    var asset = await response.Content.ReadAsAsync<AssetResponseDto>();
    Assert.Equal(po.Id, asset.PurchaseOrderId);
}
```

### Frontend Tests

```typescript
// Test role routing
it("should route Procurement to /tenant/dashboard", () => {
  const path = getDashboardPath("Procurement");
  expect(path).toBe("/tenant/dashboard");
});

// Test auth context role validation
it("should reject invalid roles", () => {
  const { result } = renderHook(() => useAuth());
  // Simulate invalid role in localStorage
  expect(result.current.isLoggedIn).toBe(false);
});
```

---

## PART 7: DEPLOYMENT CHECKLIST

### Before Production Deployment

- [ ] All 8 critical issues fixed and tested
- [ ] Zero `console.log` statements in code
- [ ] Zero `// TODO` comments in production code
- [ ] All endpoints secured with `[Authorize]` or `[RequirePermission]`
- [ ] CORS policy restricted to production domain
- [ ] JWT expiration enforced
- [ ] Depreciation scheduler running on schedule
- [ ] Database migrations applied
- [ ] Frontend built with `npm run build` and wwwroot updated
- [ ] All modals open/close correctly
- [ ] Navigation works for all 6 roles
- [ ] Error handling tested for all workflows
- [ ] Load test: 100 concurrent users
- [ ] Security scan: no SQL injection, XSS, CSRF vulnerabilities
- [ ] All role permissions verified with manual testing

### Post-Deployment Validation

- [ ] Login works for all 6 roles
- [ ] Dashboards load without errors
- [ ] CRUD operations functional (create, read, update, delete)
- [ ] PO workflow tested end-to-end
- [ ] Depreciation calculations verified
- [ ] Notifications displayed correctly
- [ ] Audit logs populated on all operations
- [ ] Performance: page loads < 2 seconds
- [ ] Mobile responsive: tested on tablet/phone

---

## PART 8: SUMMARY OF FIXES BY COMPONENT

| Issue | Severity | Fix Time | Files Touched |
|---|---|---|---|
| Depreciation recalculation | 🔴 Critical | 4hrs | DepreciationReconciliationService.cs, Program.cs |
| PO → Asset workflow | 🔴 Critical | 6hrs | PurchaseOrdersController, Asset.cs, migrations |
| Role types incomplete | 🔴 Critical | 2hrs | types/asset.ts, role-routing.ts, UserRoleConstants.cs |
| Missing edit asset modal | 🔴 Critical | 3hrs | edit-asset-modal.tsx, asset-details-modal.tsx |
| Token expiration | 🟡 High | 1hr | AuthController.cs, Program.cs, appsettings.json |
| Missing tasks page | 🟡 High | 2hrs | app/tenant/tasks/page.tsx, app-shell.tsx |
| Authorization inconsistent | 🟡 High | 3hrs | All controllers |
| CORS too permissive | 🟡 High | 1hr | Program.cs, appsettings.json |
| Tenant role seeding | 🟡 Medium | 2hrs | TenantsController.cs, migration |
| N+1 queries | 🟡 Medium | 2hrs | DepartmentsController.cs |
| Error boundaries missing | 🟠 Low | 1hr | Multiple error.tsx files |
| Loading states | 🟠 Low | 2hrs | Various components |

**Total Implementation Time: ~30-35 hours (4-5 days for experienced developer)**

---

## CONCLUSION

The DFile system is **functionally complete but not production-grade**. The identified issues are manageable and don't require architectural changes:

1. **Depreciation** → Needs scheduled service (backend only)
2. **Procurement** → Needs API endpoint + frontend modal (moderate work)
3. **Roles** → Needs type updates + permissions (straightforward)
4. **UX** → Needs missing modals + pages (repetitive, low risk)

**After implementing these fixes**, the system will be:
- ✅ Fully functional for all 6 roles
- ✅ Production-compliant (security, auth, CORS)
- ✅ Financially accurate (depreciation automated)
- ✅ All CRUD operations complete
- ✅ True multi-tenant isolation
- ✅ Audit trail comprehensive

**Estimated Timeline:** 30-35 engineering hours → Full production readiness
