using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArchX.Server.Database.Migrations
{
    /// <inheritdoc />
    public partial class addGrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Grade",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Grade",
                table: "AspNetUsers");
        }
    }
}
