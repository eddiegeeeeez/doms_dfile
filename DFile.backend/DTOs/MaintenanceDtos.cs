using System.ComponentModel.DataAnnotations;

namespace DFile.backend.DTOs
{
    public class CreateMaintenanceRecordDto
    {
        [Required]
        public string AssetId { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";
        public string Priority { get; set; } = "Medium";
        public string Type { get; set; } = "Corrective";
        public string? Frequency { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Cost { get; set; }
        public string? Attachments { get; set; }
    }

    public class UpdateMaintenanceRecordDto
    {
        [Required]
        public string AssetId { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";
        public string Priority { get; set; } = "Medium";
        public string Type { get; set; } = "Corrective";
        public string? Frequency { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Cost { get; set; }
        public DateTime? DateReported { get; set; }
        public string? Attachments { get; set; }
    }
}
