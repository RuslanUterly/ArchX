using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ArchX.Server.Database.Migrations
{
    /// <inheritdoc />
    public partial class SplitFeedbackAdminReplyAndSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SessionId",
                table: "FeedbackTickets",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FeedbackAdminReplies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FeedbackTicketId = table.Column<int>(type: "integer", nullable: false),
                    Message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackAdminReplies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackAdminReplies_FeedbackTickets_FeedbackTicketId",
                        column: x => x.FeedbackTicketId,
                        principalTable: "FeedbackTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackAdminReplies_FeedbackTicketId",
                table: "FeedbackAdminReplies",
                column: "FeedbackTicketId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackTickets_SessionId",
                table: "FeedbackTickets",
                column: "SessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_FeedbackTickets_Sessions_SessionId",
                table: "FeedbackTickets",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.Sql(
                """
                INSERT INTO "FeedbackAdminReplies" ("FeedbackTicketId", "Message", "CreatedAt", "UpdatedAt")
                SELECT "Id", TRIM("AdminResponse"), COALESCE("RespondedAt", "UpdatedAt"), COALESCE("RespondedAt", "UpdatedAt")
                FROM "FeedbackTickets"
                WHERE "AdminResponse" IS NOT NULL AND LENGTH(TRIM("AdminResponse")) > 0;
                """);

            migrationBuilder.DropColumn(
                name: "AdminResponse",
                table: "FeedbackTickets");

            migrationBuilder.DropColumn(
                name: "RespondedAt",
                table: "FeedbackTickets");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FeedbackTickets_Sessions_SessionId",
                table: "FeedbackTickets");

            migrationBuilder.DropTable(
                name: "FeedbackAdminReplies");

            migrationBuilder.DropIndex(
                name: "IX_FeedbackTickets_SessionId",
                table: "FeedbackTickets");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "FeedbackTickets");

            migrationBuilder.AddColumn<string>(
                name: "AdminResponse",
                table: "FeedbackTickets",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RespondedAt",
                table: "FeedbackTickets",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
