using DFile.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<MaintenanceRecord> MaintenanceRecords { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RoomCategory> RoomCategories { get; set; }
        public DbSet<AssetCategory> AssetCategories { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Explicit decimal precision to prevent silent truncation on SQL Server
            modelBuilder.Entity<Asset>(e =>
            {
                e.Property(a => a.Value).HasColumnType("decimal(18,2)");
                e.Property(a => a.PurchasePrice).HasColumnType("decimal(18,2)");
                e.Property(a => a.CurrentBookValue).HasColumnType("decimal(18,2)");
                e.Property(a => a.MonthlyDepreciation).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<MaintenanceRecord>(e =>
            {
                e.Property(m => m.Cost).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<RoomCategory>(e =>
            {
                e.Property(r => r.BaseRate).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<PurchaseOrder>(e =>
            {
                e.Property(p => p.PurchasePrice).HasColumnType("decimal(18,2)");
            });
        }
    }
}
