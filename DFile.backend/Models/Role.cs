using System.ComponentModel.DataAnnotations;

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
        public int? TenantId { get; set; }
    }
}
