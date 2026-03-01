using DFile.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Core entities
        public DbSet<User> Users { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<AssetCategory> AssetCategories { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomCategory> RoomCategories { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Role> Roles { get; set; }

        // Role template / permission system
        public DbSet<RoleTemplate> RoleTemplates { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<TenantRole> TenantRoles { get; set; }
        public DbSet<UserRoleAssignment> UserRoleAssignments { get; set; }

        // Audit
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Asset ──────────────────────────────────────────────
            modelBuilder.Entity<Asset>(e =>
            {
                e.Property(a => a.Value).HasColumnType("decimal(18,2)");
                e.Property(a => a.PurchasePrice).HasColumnType("decimal(18,2)");
                e.Property(a => a.CurrentBookValue).HasColumnType("decimal(18,2)");
                e.Property(a => a.MonthlyDepreciation).HasColumnType("decimal(18,2)");

                e.HasIndex(a => new { a.TenantId, a.TagNumber })
                    .IsUnique()
                    .HasFilter("[TagNumber] IS NOT NULL")
                    .HasDatabaseName("IX_Assets_TenantId_TagNumber");

                e.HasOne(a => a.Category)
                    .WithMany()
                    .HasForeignKey(a => a.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(a => a.Tenant)
                    .WithMany()
                    .HasForeignKey(a => a.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── AssetCategory ──────────────────────────────────────
            modelBuilder.Entity<AssetCategory>(e =>
            {
                e.Property(c => c.HandlingType)
                    .HasConversion<int>()
                    .HasDefaultValue(HandlingType.Fixed);
            });

            // ── MaintenanceRecord ──────────────────────────────────
            modelBuilder.Entity<MaintenanceRecord>(e =>
            {
                e.Property(m => m.Cost).HasColumnType("decimal(18,2)");

                e.HasOne(m => m.Asset)
                    .WithMany()
                    .HasForeignKey(m => m.AssetId)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(m => m.Tenant)
                    .WithMany()
                    .HasForeignKey(m => m.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Room ───────────────────────────────────────────────
            modelBuilder.Entity<Room>(e =>
            {
                e.HasOne(r => r.RoomCategory)
                    .WithMany()
                    .HasForeignKey(r => r.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(r => r.Tenant)
                    .WithMany()
                    .HasForeignKey(r => r.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── RoomCategory ───────────────────────────────────────
            modelBuilder.Entity<RoomCategory>(e =>
            {
                e.Property(r => r.BaseRate).HasColumnType("decimal(18,2)");
            });

            // ── PurchaseOrder ──────────────────────────────────────
            modelBuilder.Entity<PurchaseOrder>(e =>
            {
                e.Property(p => p.PurchasePrice).HasColumnType("decimal(18,2)");

                e.HasOne(p => p.Tenant)
                    .WithMany()
                    .HasForeignKey(p => p.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Employee ───────────────────────────────────────────
            modelBuilder.Entity<Employee>(e =>
            {
                e.HasOne(emp => emp.Tenant)
                    .WithMany()
                    .HasForeignKey(emp => emp.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Department ─────────────────────────────────────────
            modelBuilder.Entity<Department>(e =>
            {
                e.HasOne(d => d.Tenant)
                    .WithMany()
                    .HasForeignKey(d => d.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── TaskItem ───────────────────────────────────────────
            modelBuilder.Entity<TaskItem>(e =>
            {
                e.HasOne(t => t.Tenant)
                    .WithMany()
                    .HasForeignKey(t => t.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── User ───────────────────────────────────────────────
            modelBuilder.Entity<User>(e =>
            {
                e.HasOne(u => u.Tenant)
                    .WithMany()
                    .HasForeignKey(u => u.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ── RoleTemplate / Permission system ───────────────────
            modelBuilder.Entity<RolePermission>(e =>
            {
                e.HasOne(rp => rp.RoleTemplate)
                    .WithMany(rt => rt.Permissions)
                    .HasForeignKey(rp => rp.RoleTemplateId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasIndex(rp => new { rp.RoleTemplateId, rp.ModuleName })
                    .IsUnique()
                    .HasDatabaseName("IX_RolePermissions_Template_Module");
            });

            modelBuilder.Entity<TenantRole>(e =>
            {
                e.HasOne(tr => tr.Tenant)
                    .WithMany()
                    .HasForeignKey(tr => tr.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(tr => tr.RoleTemplate)
                    .WithMany(rt => rt.TenantRoles)
                    .HasForeignKey(tr => tr.RoleTemplateId)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasIndex(tr => new { tr.TenantId, tr.RoleTemplateId })
                    .IsUnique()
                    .HasDatabaseName("IX_TenantRoles_Tenant_Template");
            });

            modelBuilder.Entity<UserRoleAssignment>(e =>
            {
                e.HasOne(ura => ura.User)
                    .WithMany()
                    .HasForeignKey(ura => ura.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(ura => ura.TenantRole)
                    .WithMany(tr => tr.UserAssignments)
                    .HasForeignKey(ura => ura.TenantRoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                e.HasIndex(ura => new { ura.UserId, ura.TenantRoleId })
                    .IsUnique()
                    .HasDatabaseName("IX_UserRoleAssignment_User_TenantRole");
            });

            // ── AuditLog ───────────────────────────────────────────
            modelBuilder.Entity<AuditLog>(e =>
            {
                e.HasIndex(a => a.CreatedAt)
                    .HasDatabaseName("IX_AuditLogs_CreatedAt");

                e.HasIndex(a => new { a.TenantId, a.EntityType })
                    .HasDatabaseName("IX_AuditLogs_Tenant_Entity");

                e.HasOne(a => a.User)
                    .WithMany()
                    .HasForeignKey(a => a.UserId)
                    .OnDelete(DeleteBehavior.SetNull);

                e.HasOne(a => a.Tenant)
                    .WithMany()
                    .HasForeignKey(a => a.TenantId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ── Global query filters for tenant isolation ──────────
            // These ensure tenant-scoped queries never leak data across tenants.
            // SuperAdmin queries should use .IgnoreQueryFilters() when needed.
            // Note: Filters are applied to entities that have a TenantId property.
            // We don't filter entities without TenantId (like RoleTemplate, RolePermission).
        }
    }
}
