using System.ComponentModel.DataAnnotations;
using ArchX.Server.Entities;

namespace ArchX.Server.Features.Feedback;

public class CreateFeedbackRequest
{
    [Required]
    public FeedbackCategory Category { get; set; }

    /// <summary>
    /// Необязательно: id сессии опроса (только своя сессия).
    /// </summary>
    public int? SessionId { get; set; }

    [MaxLength(200)]
    public string? Subject { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;
}

public class UpdateFeedbackRequest
{
    public FeedbackStatus? Status { get; set; }

    [MaxLength(4000)]
    public string? AdminResponse { get; set; }
}
