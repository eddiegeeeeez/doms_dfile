using DFile.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            try
            {
                context.Database.Migrate();
            }
            catch (Exception ex)
            {
                // If a migration fails because objects already exist in the DB (e.g., from a partial
                // previous run), mark all pending migrations as applied so EF Core stops retrying.
                var msg = ex.Message + (ex.InnerException?.Message ?? "");
                if (msg.Contains("already an object named") || msg.Contains("There is already"))
                {
                    try
                    {
                        foreach (var migration in context.Database.GetPendingMigrations().ToList())
                        {
                            context.Database.ExecuteSqlRaw(
                                "IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = {0}) " +
                                "INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({0}, '8.0.0')",
                                migration);
                        }
                    }
                    catch { /* best-effort */ }
                }
            }

            // Ensure Default Tenant Exists
            var tenant = context.Tenants.FirstOrDefault(t => t.Name == "Acme Corp");
            if (tenant == null)
            {
                tenant = new Tenant
                {
                    Name = "Acme Corp",
                    Status = "Active",
                    SubscriptionPlan = SubscriptionPlanType.Pro,
                    CreatedAt = DateTime.UtcNow,
                    MaxRooms = 500,
                    MaxPersonnel = 100,
                    MaintenanceModule = true,
                    ReportsLevel = "Able"
                };
                context.Tenants.Add(tenant);
                context.SaveChanges();
                Console.WriteLine("Created default tenant 'Acme Corp'.");
            }

            // Define all standard users to seed
            var seedUsers = new List<User>
            {
                // 1. Super Admin (Platform Level)
                new User
                {
                    Name = "System Super Admin",
                    Email = "superadmin@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("superadmin123"),
                    Role = "Super Admin",
                    RoleLabel = "System Super Admin",
                    TenantId = null // Platform level
                },
                // 2. Tenant Admin (Company Level Admin)
                new User
                {
                    Name = "Tenant Admin",
                    Email = "tenantadmin@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = "Admin",
                    RoleLabel = "Tenant Administrator",
                    TenantId = tenant.Id,
                    Avatar = "https://github.com/shadcn.png"
                },
                // 3. Maintenance Manager
                new User
                {
                    Name = "Maintenance Manager",
                    Email = "maintenance@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("maintenance123"),
                    Role = "Maintenance",
                    RoleLabel = "Maintenance Manager",
                    TenantId = tenant.Id,
                    Avatar = "https://github.com/shadcn.png"
                },
                // 4. Finance Manager
                new User
                {
                    Name = "Finance Manager",
                    Email = "finance@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("finance123"),
                    Role = "Finance",
                    RoleLabel = "Finance Manager",
                    TenantId = tenant.Id,
                    Avatar = "https://github.com/shadcn.png"
                },
                // 5. Procurement Manager
                new User
                {
                    Name = "Procurement Manager",
                    Email = "procurement@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("procurement123"),
                    Role = "Procurement",
                    RoleLabel = "Procurement Manager",
                    TenantId = tenant.Id,
                    Avatar = "https://github.com/shadcn.png"
                },
                // 6. Regular Employee
                new User
                {
                    Name = "John Doe",
                    Email = "employee@dfile.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("employee123"),
                    Role = "Employee",
                    RoleLabel = "Staff Member",
                    TenantId = tenant.Id,
                    Avatar = "https://github.com/shadcn.png"
                }
            };

            bool usersAdded = false;
            foreach (var user in seedUsers)
            {
                var existingUser = context.Users.FirstOrDefault(u => u.Email == user.Email);
                if (existingUser == null)
                {
                    context.Users.Add(user);
                    usersAdded = true;
                    Console.WriteLine($"Seeding user: {user.Email}");
                }
                else
                {
                    // Force update password for dev/test convenience
                    existingUser.PasswordHash = user.PasswordHash;
                    // Also ensure TenantId is correct if null? (Optional)
                    if (existingUser.TenantId == null && user.TenantId != null)
                    {
                         existingUser.TenantId = user.TenantId;
                    }
                    context.Entry(existingUser).State = EntityState.Modified;
                    usersAdded = true; // Mark as modified to trigger SaveChanges
                    Console.WriteLine($"Updated password for existing user: {user.Email}");
                }
            }

            if (usersAdded)
            {
                context.SaveChanges();
                Console.WriteLine("All missing users seeded successfully.");
            }
            else
            {
                Console.WriteLine("All users already exist.");
            }
        }
    }
}
