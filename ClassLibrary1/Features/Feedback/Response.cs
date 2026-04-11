using ArchX.Server.Entities;

namespace ArchX.Server.Features.Feedback;

public class FeedbackAdminReplyResponse
{
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FeedbackTicketResponse
{
    public int Id { get; set; }
    public long UserId { get; set; }
    public string? UserEmail { get; set; }
    public int? SessionId { get; set; }
    public string? SessionProjectName { get; set; }
    public FeedbackCategory Category { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    public FeedbackStatus Status { get; set; }
    public FeedbackAdminReplyResponse? AdminReply { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
