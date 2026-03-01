using System.ComponentModel.DataAnnotations;
using DFile.backend.Models;

namespace DFile.backend.DTOs
{
    public class CreateAssetCategoryDto
    {
        [Required]
        public string CategoryName { get; set; } = string.Empty;

        public HandlingType HandlingType { get; set; } = HandlingType.Fixed;

        public string Description { get; set; } = string.Empty;
    }

    public class UpdateAssetCategoryDto
    {
        [Required]
        public string CategoryName { get; set; } = string.Empty;

        public HandlingType HandlingType { get; set; } = HandlingType.Fixed;

        public string Description { get; set; } = string.Empty;
    }

    public class AssetCategoryResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public HandlingType HandlingType { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? TenantId { get; set; }
        public int Items { get; set; }
    }
}
