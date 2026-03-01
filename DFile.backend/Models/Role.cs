using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DFile.backend.Models
{
    public class Role
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string Designation { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;
        public string Scope { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active | Archived
        public bool Archived { get; set; } = false;
        public int? TenantId { get; set; }

        [ForeignKey("TenantId")]
        public Tenant? Tenant { get; set; }
    }
}
