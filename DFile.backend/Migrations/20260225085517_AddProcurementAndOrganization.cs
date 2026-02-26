using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace dfile.backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProcurementAndOrganization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Departments')
                CREATE TABLE [Departments] (
                    [Id] nvarchar(450) NOT NULL,
                    [Name] nvarchar(max) NOT NULL,
                    [Description] nvarchar(max) NOT NULL,
                    [Head] nvarchar(max) NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [TenantId] int NULL,
                    CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
                );
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PurchaseOrders')
                CREATE TABLE [PurchaseOrders] (
                    [Id] nvarchar(450) NOT NULL,
                    [AssetName] nvarchar(max) NOT NULL,
                    [Category] nvarchar(max) NOT NULL,
                    [Vendor] nvarchar(max) NULL,
                    [Manufacturer] nvarchar(max) NULL,
                    [Model] nvarchar(max) NULL,
                    [SerialNumber] nvarchar(max) NULL,
                    [PurchasePrice] decimal(18,2) NOT NULL,
                    [PurchaseDate] nvarchar(max) NULL,
                    [UsefulLifeYears] int NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [RequestedBy] nvarchar(max) NULL,
                    [CreatedAt] nvarchar(max) NOT NULL,
                    [AssetId] nvarchar(max) NULL,
                    [Archived] bit NOT NULL,
                    [TenantId] int NULL,
                    CONSTRAINT [PK_PurchaseOrders] PRIMARY KEY ([Id])
                );
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles')
                CREATE TABLE [Roles] (
                    [Id] nvarchar(450) NOT NULL,
                    [Designation] nvarchar(max) NOT NULL,
                    [Department] nvarchar(max) NOT NULL,
                    [Scope] nvarchar(max) NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [TenantId] int NULL,
                    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
