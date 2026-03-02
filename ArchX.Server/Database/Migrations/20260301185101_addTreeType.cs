using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArchX.Server.Database.Migrations
{
    /// <inheritdoc />
    public partial class addTreeType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStyleSelected",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SelectedStyleNodeId",
                table: "Sessions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TreeType",
                table: "Sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TreeType",
                table: "Nodes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStyleSelected",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "SelectedStyleNodeId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TreeType",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TreeType",
                table: "Nodes");
        }
    }
}
