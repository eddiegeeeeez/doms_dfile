using DFile.backend.Data;
using DFile.backend.Models;
using Microsoft.EntityFrameworkCore;

namespace DFile.backend.Services
{
    /// <summary>
    /// Daily check for recurring maintenance whose next due date is today (UTC); creates tenant notifications.
    /// </summary>
    public class MaintenanceDueReminderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly IConfiguration _configuration;
        private readonly ILogger<MaintenanceDueReminderService> _logger;

        public MaintenanceDueReminderService(
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            ILogger<MaintenanceDueReminderService> logger)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var hours = Math.Clamp(_configuration.GetValue("Maintenance:DueReminderIntervalHours", 24), 1, 168);
            _logger.LogInformation("Maintenance due reminders will run every {Hours} hour(s).", hours);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    await RunOnceAsync(db, notifications, stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Maintenance due reminder run failed.");
                }

                try
                {
                    await Task.Delay(TimeSpan.FromHours(hours), stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }
            }
        }

        internal static async Task RunOnceAsync(
            AppDbContext db,
            INotificationService notifications,
            CancellationToken cancellationToken)
        {
            var today = DateTime.UtcNow.Date;
            var records = await db.MaintenanceRecords
                .Include(r => r.Asset)
                .Where(r => !r.IsArchived
                    && !string.Equals(r.Status, "Completed", StringComparison.OrdinalIgnoreCase)
                    && MaintenanceSchedulingService.IsRecurring(r.Frequency))
                .ToListAsync(cancellationToken);

            foreach (var r in records)
            {
                var next = MaintenanceSchedulingService.ComputeNextDueDate(r, DateTime.UtcNow);
                if (!next.HasValue || next.Value.Date != today)
                    continue;

                var tomorrow = today.AddDays(1);
                var already = await db.Notifications.AnyAsync(
                    n => n.EntityType == "MaintenanceRecord"
                         && n.EntityId == r.Id
                         && n.CreatedAt >= today
                         && n.CreatedAt < tomorrow,
                    cancellationToken);
                if (already)
                    continue;

                await notifications.NotifyMaintenanceDueAsync(r, cancellationToken);
            }

            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
