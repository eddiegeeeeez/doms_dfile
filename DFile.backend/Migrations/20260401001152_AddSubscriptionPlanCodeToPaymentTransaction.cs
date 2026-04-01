using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DFile.backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPlanCodeToPaymentTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlanCode",
                table: "PaymentTransactions",
                type: "nvarchar(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubscriptionPlanCode",
                table: "PaymentTransactions");
        }
    }
}
