using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DFile.backend.Models
{
    public class AssetCategory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("Name")]
        public string CategoryName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public HandlingType HandlingType { get; set; } = HandlingType.Fixed;

        public string Status { get; set; } = "Active";

        public bool Archived { get; set; } = false;
        public int? TenantId { get; set; }

        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }
    }
}
