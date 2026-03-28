namespace DFile.backend.Constants
{
    public static class UserRoleConstants
    {
        public const string SuperAdmin = "Super Admin";
        public const string Admin = "Admin";
        public const string Finance = "Finance";
        public const string Maintenance = "Maintenance";
        public const string Procurement = "Procurement";
        public const string Employee = "Employee";

        public static readonly string[] All =
        {
            SuperAdmin, Admin, Finance, Maintenance, Procurement, Employee
        };

        public static bool IsKnownName(string name) =>
            Array.Exists(All, x => string.Equals(x, name, StringComparison.Ordinal));
    }
}
