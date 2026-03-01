using System.ComponentModel.DataAnnotations;

namespace DFile.backend.DTOs
{
    public class CreateRoomDto
    {
        [Required]
        public string UnitId { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Floor { get; set; } = string.Empty;
        public string? CategoryId { get; set; }
        public string Status { get; set; } = "Available";
        public int MaxOccupancy { get; set; }
    }

    public class UpdateRoomDto
    {
        [Required]
        public string UnitId { get; set; } = string.Empty;

        [Required]
        public string Name { get; set; } = string.Empty;

        public string Floor { get; set; } = string.Empty;
        public string? CategoryId { get; set; }
        public string Status { get; set; } = "Available";
        public int MaxOccupancy { get; set; }
        public bool Archived { get; set; }
    }

    public class CreateRoomCategoryDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string SubCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal BaseRate { get; set; }
        public int MaxOccupancy { get; set; }
    }

    public class UpdateRoomCategoryDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        public string SubCategory { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal BaseRate { get; set; }
        public int MaxOccupancy { get; set; }
        public bool Archived { get; set; }
        public string Status { get; set; } = "Active";
    }
}
