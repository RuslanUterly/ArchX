using System.ComponentModel.DataAnnotations;

namespace ClassLibrary1.Entities;

public enum FeedbackCategory
{
    Praise = 1,
    Complaint = 2,
    Suggestion = 3,
}

public enum FeedbackStatus
{
    New = 1,
    InReview = 2,
    Resolved = 3,
}

public class FeedbackTicket
{
    public int Id { get; set; }

    [Required]
    public long UserId { get; set; }

    public User User { get; set; } = null!;

    /// <summary>
    /// Опционально: сессия опроса, если обращение про баг в конкретном проходе.
    /// </summary>
    public int? SessionId { get; set; }

    public Session? Session { get; set; }

    [Required]
    public FeedbackCategory Category { get; set; }

    [MaxLength(200)]
    public string? Subject { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public FeedbackStatus Status { get; set; } = FeedbackStatus.New;

    public FeedbackAdminReply? AdminReply { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public FeedbackAdminReply FeedbackAdminReply
    {
        get => default;
        set
        {
        }
    }
}
