using ArchX.Server.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Database;

public class ArchXContext(DbContextOptions<ArchXContext> options) : IdentityDbContext<User, IdentityRole<long>, long>(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Node> Nodes { get; set; }
    public DbSet<Link> Links { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<FeedbackTicket> FeedbackTickets { get; set; }
    public DbSet<FeedbackAdminReply> FeedbackAdminReplies { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        // Настройка связей Node -> Link
        builder.Entity<Link>()
            .HasOne(l => l.Parent)
            .WithMany(n => n.OutgoingLinks)
            .HasForeignKey(l => l.ParentId)
            .OnDelete(DeleteBehavior.Restrict); // запрещаем каскадное удаление

        builder.Entity<Link>()
            .HasOne(l => l.Child)
            .WithMany(n => n.IncomingLinks)
            .HasForeignKey(l => l.ChildId)
            .OnDelete(DeleteBehavior.Restrict);

        // Уникальность связи ParentId + Condition (чтобы не было дублирующих условий)
        builder.Entity<Link>()
            .HasIndex(l => new { l.ParentId, l.Condition })
            .IsUnique();

        // Индексы для быстрого поиска
        builder.Entity<Node>().HasIndex(n => n.Type);
        builder.Entity<Session>().HasIndex(s => s.UserId);

        builder.Entity<FeedbackTicket>()
            .HasOne(f => f.User)
            .WithMany(u => u.FeedbackTickets)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FeedbackTicket>()
            .HasOne(f => f.Session)
            .WithMany(s => s.FeedbackTickets)
            .HasForeignKey(f => f.SessionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<FeedbackTicket>()
            .HasOne(f => f.AdminReply)
            .WithOne(r => r.Ticket)
            .HasForeignKey<FeedbackAdminReply>(r => r.FeedbackTicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FeedbackAdminReply>()
            .HasIndex(r => r.FeedbackTicketId)
            .IsUnique();

        builder.Entity<FeedbackTicket>().HasIndex(f => f.UserId);
        builder.Entity<FeedbackTicket>().HasIndex(f => f.CreatedAt);
        builder.Entity<FeedbackTicket>().HasIndex(f => f.SessionId);

        base.OnModelCreating(builder);
    }
}
