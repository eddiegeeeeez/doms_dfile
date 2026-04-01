using DFile.backend.Models;

namespace DFile.backend.Services
{
    /// <summary>
    /// Validates maintenance schedules and computes the next due date from frequency, start, and end.
    /// </summary>
    public static class MaintenanceSchedulingService
    {
        public static readonly string[] SupportedFrequencies =
        {
            "One-time", "Daily", "Weekly", "Monthly", "Yearly", "Quarterly"
        };

        public static bool IsRecurring(string? frequency) =>
            !string.IsNullOrWhiteSpace(frequency) &&
            !string.Equals(frequency, "One-time", StringComparison.OrdinalIgnoreCase);

        /// <summary>Returns null if valid; otherwise an error message.</summary>
        public static string? ValidateSchedule(string? frequency, DateTime? startDate, DateTime? endDate)
        {
            var f = frequency?.Trim() ?? "";
            if (!string.IsNullOrEmpty(f) && !SupportedFrequencies.Any(s => s.Equals(f, StringComparison.OrdinalIgnoreCase)))
                return $"Frequency must be one of: {string.Join(", ", SupportedFrequencies)}.";

            if (IsRecurring(f))
            {
                if (!startDate.HasValue)
                    return "Start date is required when a recurring frequency (Daily, Weekly, Monthly, or Yearly) is selected.";
            }

            if (startDate.HasValue && endDate.HasValue && endDate.Value.Date < startDate.Value.Date)
                return "End date cannot be before start date.";

            return null;
        }

        public static DateTime StepForward(DateTime dateUtc, string? frequency)
        {
            if (string.IsNullOrWhiteSpace(frequency)) return dateUtc;
            if (string.Equals(frequency, "Daily", StringComparison.OrdinalIgnoreCase))
                return dateUtc.AddDays(1);
            if (string.Equals(frequency, "Weekly", StringComparison.OrdinalIgnoreCase))
                return dateUtc.AddDays(7);
            if (string.Equals(frequency, "Monthly", StringComparison.OrdinalIgnoreCase))
                return dateUtc.AddMonths(1);
            if (string.Equals(frequency, "Quarterly", StringComparison.OrdinalIgnoreCase))
                return dateUtc.AddMonths(3);
            if (string.Equals(frequency, "Yearly", StringComparison.OrdinalIgnoreCase))
                return dateUtc.AddYears(1);
            return dateUtc;
        }

        /// <summary>Next occurrence on or after <paramref name="fromUtc"/> within optional end date; null if none.</summary>
        public static DateTime? ComputeNextDueDate(MaintenanceRecord r, DateTime fromUtc)
        {
            if (r.IsArchived || string.Equals(r.Status, "Completed", StringComparison.OrdinalIgnoreCase))
                return null;

            var freq = r.Frequency;
            if (string.IsNullOrWhiteSpace(freq) || string.Equals(freq, "One-time", StringComparison.OrdinalIgnoreCase))
            {
                if (!r.StartDate.HasValue) return null;
                var s = DateTime.SpecifyKind(r.StartDate.Value.Date, DateTimeKind.Utc);
                if (s < fromUtc.Date) return null;
                if (r.EndDate.HasValue && s > r.EndDate.Value.Date) return null;
                return s;
            }

            if (!r.StartDate.HasValue) return null;

            var end = r.EndDate?.Date;
            var anchor = r.StartDate.Value.Date;
            var fromDate = fromUtc.Date;
            var cursor = anchor;
            const int maxSteps = 4000;
            var steps = 0;
            while (cursor < fromDate && steps++ < maxSteps)
                cursor = StepForward(cursor, freq).Date;

            if (end.HasValue && cursor > end.Value)
                return null;

            if (steps >= maxSteps)
                return null;

            return DateTime.SpecifyKind(cursor, DateTimeKind.Utc);
        }
    }
}
