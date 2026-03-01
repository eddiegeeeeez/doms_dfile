using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DFile.backend.Models
{
    public class PurchaseOrder
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string AssetName { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;
        public string? Vendor { get; set; }
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public string? SerialNumber { get; set; }

        public decimal PurchasePrice { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public int UsefulLifeYears { get; set; }

        public string Status { get; set; } = "Pending"; // Pending | Approved | Delivered | Cancelled
        public string? RequestedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? AssetId { get; set; }

        public bool Archived { get; set; } = false;
        public int? TenantId { get; set; }

        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }
    }
}
