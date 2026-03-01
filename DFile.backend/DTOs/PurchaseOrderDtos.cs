using System.ComponentModel.DataAnnotations;

namespace DFile.backend.DTOs
{
    public class CreatePurchaseOrderDto
    {
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
        public string? RequestedBy { get; set; }
    }

    public class UpdatePurchaseOrderDto
    {
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
        public string Status { get; set; } = "Pending";
        public string? RequestedBy { get; set; }
        public string? AssetId { get; set; }
    }
}
