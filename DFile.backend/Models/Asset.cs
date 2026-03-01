using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DFile.backend.Models
{
    public class Asset
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        public string? TagNumber { get; set; }

        [Required]
        public string Desc { get; set; } = string.Empty;

        public string? CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public AssetCategory? Category { get; set; }

        public string Status { get; set; } = string.Empty;
        public string? Room { get; set; }
        public string? Image { get; set; }
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public string? SerialNumber { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public string? Vendor { get; set; }
        public decimal Value { get; set; }
        public int UsefulLifeYears { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal CurrentBookValue { get; set; }
        public decimal MonthlyDepreciation { get; set; }
        public int? TenantId { get; set; }

        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }

        public DateTime? WarrantyExpiry { get; set; }
        public string? Notes { get; set; }
        public string? Documents { get; set; }
        public bool Archived { get; set; } = false;
    }
}
