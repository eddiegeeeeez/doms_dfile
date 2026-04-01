using DFile.backend.Models;

namespace DFile.backend.Services
{
    public interface INotificationService
    {
        Task NotifyPurchaseOrderApprovedAsync(PurchaseOrder order, CancellationToken cancellationToken = default);
        Task NotifyReplacementNeededAsync(Asset asset, int? tenantId, CancellationToken cancellationToken = default);
        Task NotifyMaintenanceDueAsync(MaintenanceRecord record, CancellationToken cancellationToken = default);
    }
}
