using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace dfile.backend.Migrations
{
    /// <inheritdoc />
    public partial class Audit20260328_PoAssetDepreciationRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepreciationMonthsApplied",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PurchaseOrderId",
                table: "Assets",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Assets_PurchaseOrderId",
                table: "Assets",
                column: "PurchaseOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assets_PurchaseOrders_PurchaseOrderId",
                table: "Assets",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // System role templates + module permissions (idempotent)
            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM RoleTemplates WHERE Name = N'Procurement')
                INSERT INTO RoleTemplates (Name, Description, IsSystem, IsArchived, CreatedAt)
                VALUES (N'Procurement', N'Procurement Officer', 1, 0, SYSUTCDATETIME());

                IF NOT EXISTS (SELECT 1 FROM RoleTemplates WHERE Name = N'Employee')
                INSERT INTO RoleTemplates (Name, Description, IsSystem, IsArchived, CreatedAt)
                VALUES (N'Employee', N'Regular Employee', 1, 0, SYSUTCDATETIME());

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'AuditLogs', 1, 0, 0, 0, 0
                FROM RoleTemplates rt
                WHERE rt.Name IN (N'Admin', N'Finance', N'Maintenance')
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'AuditLogs');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'Notifications', 1, 0, 1, 0, 0
                FROM RoleTemplates rt
                WHERE rt.Name IN (N'Admin', N'Finance', N'Maintenance', N'Procurement', N'Employee')
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'Notifications');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'Tasks', 1, 1, 1, 0, 1
                FROM RoleTemplates rt
                WHERE rt.Name = N'Admin'
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'Tasks');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'Tasks', 1, 0, 0, 0, 0
                FROM RoleTemplates rt
                WHERE rt.Name = N'Employee'
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'Tasks');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'Tasks', 1, 1, 1, 0, 0
                FROM RoleTemplates rt
                WHERE rt.Name = N'Procurement'
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'Tasks');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'PurchaseOrders', 1, 1, 1, 0, 1
                FROM RoleTemplates rt
                WHERE rt.Name = N'Procurement'
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'PurchaseOrders');

                INSERT INTO RolePermissions (RoleTemplateId, ModuleName, CanView, CanCreate, CanEdit, CanApprove, CanArchive)
                SELECT rt.Id, N'Assets', 1, 0, 0, 0, 0
                FROM RoleTemplates rt
                WHERE rt.Name = N'Procurement'
                  AND NOT EXISTS (SELECT 1 FROM RolePermissions rp WHERE rp.RoleTemplateId = rt.Id AND rp.ModuleName = N'Assets');

                INSERT INTO TenantRoles (TenantId, RoleTemplateId)
                SELECT t.Id, rt.Id
                FROM Tenants t
                CROSS JOIN RoleTemplates rt
                WHERE rt.Name IN (N'Procurement', N'Employee') AND rt.IsSystem = 1 AND rt.IsArchived = 0
                  AND NOT EXISTS (SELECT 1 FROM TenantRoles tr WHERE tr.TenantId = t.Id AND tr.RoleTemplateId = rt.Id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assets_PurchaseOrders_PurchaseOrderId",
                table: "Assets");

            migrationBuilder.DropIndex(
                name: "IX_Assets_PurchaseOrderId",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "DepreciationMonthsApplied",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                table: "Assets");
        }
    }
}
