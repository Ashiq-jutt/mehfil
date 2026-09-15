using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mehfil.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ActiveSeconds",
                table: "Users",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "ProfileViews",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoyaltyPoints",
                table: "Users",
                column: "RoyaltyPoints");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_RoyaltyPoints",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ActiveSeconds",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProfileViews",
                table: "Users");
        }
    }
}
