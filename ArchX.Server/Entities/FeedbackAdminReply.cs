using System.ComponentModel.DataAnnotations;

namespace ArchX.Server.Entities;

/// <summary>
/// Ответ администратора на обращение (отдельная сущность, связь 1:1 с обращением).
/// </summary>
public class FeedbackAdminReply
{
    public int Id { get; set; }

    public int FeedbackTicketId { get; set; }

    public FeedbackTicket Ticket { get; set; } = null!;

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
