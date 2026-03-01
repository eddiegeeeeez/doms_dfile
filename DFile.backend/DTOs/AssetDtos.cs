using System.ComponentModel.DataAnnotations;
using DFile.backend.Models;

namespace DFile.backend.DTOs
{
    public class CreateAssetDto
    {
        [Required]
        public string TagNumber { get; set; } = string.Empty;

        [Required]
        public string Desc { get; set; } = string.Empty;

        [Required]
        public string CategoryId { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
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
        public DateTime? WarrantyExpiry { get; set; }
        public string? Notes { get; set; }
        public string? Documents { get; set; }
    }

    public class UpdateAssetDto
    {
        [Required]
        public string TagNumber { get; set; } = string.Empty;

        [Required]
        public string Desc { get; set; } = string.Empty;

        [Required]
        public string CategoryId { get; set; } = string.Empty;

        public string Status { get; set; } = "Active";
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
        public DateTime? WarrantyExpiry { get; set; }
        public string? Notes { get; set; }
        public string? Documents { get; set; }
    }

    public class UpdateAssetFinancialDto
    {
        public decimal PurchasePrice { get; set; }
        public decimal Value { get; set; }
        public int UsefulLifeYears { get; set; }
        public decimal? CurrentBookValue { get; set; }
    }

    public class AllocateAssetDto
    {
        [Required]
        public string Room { get; set; } = string.Empty;
    }

    public class AssetResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string? TagNumber { get; set; }
        public string Desc { get; set; } = string.Empty;
        public string? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public HandlingType? HandlingType { get; set; }
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
        public DateTime? WarrantyExpiry { get; set; }
        public string? Notes { get; set; }
        public string? Documents { get; set; }
        public bool Archived { get; set; }
    }
}
