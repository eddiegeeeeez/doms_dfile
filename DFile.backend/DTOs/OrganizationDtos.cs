using System.ComponentModel.DataAnnotations;

namespace DFile.backend.DTOs
{
    public class CreateDepartmentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string Head { get; set; } = string.Empty;
    }

    public class UpdateDepartmentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public string Head { get; set; } = string.Empty;
    }

    public class CreateRoleDto
    {
        [Required]
        public string Designation { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;
        public string Scope { get; set; } = string.Empty;
    }

    public class UpdateRoleDto
    {
        [Required]
        public string Designation { get; set; } = string.Empty;

        public string Department { get; set; } = string.Empty;
        public string Scope { get; set; } = string.Empty;
    }
}
