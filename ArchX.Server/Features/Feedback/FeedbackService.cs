using ArchX.Server.Database;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Extension;
using ArchX.Server.Features.Shared.Exteptions;
using ArchX.Server.Features.Shared.Request;
using ArchX.Server.Features.Shared.Response;
using Microsoft.EntityFrameworkCore;

namespace ArchX.Server.Features.Feedback;

public class FeedbackService(IDbContextFactory<ArchXContext> dbFactory)
{
    public async Task<FeedbackTicketResponse> CreateAsync(long userId, CreateFeedbackRequest request)
    {
        var trimmed = request.Message.Trim();
        if (string.IsNullOrEmpty(trimmed))
            throw new BadRequestException("Введите текст обращения");

        if (!Enum.IsDefined(typeof(FeedbackCategory), request.Category))
            throw new BadRequestException("Укажите корректную категорию");

        using var context = await dbFactory.CreateDbContextAsync();

        int? sessionId = null;
        if (request.SessionId.HasValue)
        {
            var session = await context.Sessions.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.SessionId.Value);
            if (session == null)
                throw new BadRequestException("Сессия не найдена");
            if (session.UserId != userId)
                throw new BadRequestException("Можно указать только свою сессию");
            sessionId = session.Id;
        }

        var entity = new FeedbackTicket
        {
            UserId = userId,
            SessionId = sessionId,
            Category = request.Category,
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? null : request.Subject.Trim(),
            Message = trimmed,
            Status = FeedbackStatus.New,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        context.FeedbackTickets.Add(entity);
        await context.SaveChangesAsync();

        return await MapToResponseAsync(context, entity.Id, userIdFilter: null, includeUserEmail: false)
               ?? throw new InvalidOperationException();
    }

    public async Task<PagedResult<FeedbackTicketResponse>> GetPagedAsync(
        QueryParameter query,
        long? userIdFilter,
        bool includeUserEmail)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var fieldMap = new Dictionary<string, string>
        {
            { "useremail", "UserEmail" },
            { "id", "Id" },
            { "sessionid", "SessionId" },
            { "sessionprojectname", "SessionProjectName" },
            { "category", "Category" },
            { "subject", "Subject" },
            { "message", "Message" },
            { "adminreplymessage", "AdminReply.Message" },
            { "adminreplycreatedat", "AdminReply.CreatedAt" },
            { "createdat", "CreatedAt" },
        };

        FilterMapExtension.RemapQueryFields(query, fieldMap);

        var q = context.FeedbackTickets
            .Include(f => f.User)
            .Include(f => f.AdminReply)
            .Include(f => f.Session)
            .AsQueryable();

        if (userIdFilter.HasValue)
            q = q.Where(f => f.UserId == userIdFilter.Value);

        q = q.ApplyFilters(query.Filters);

        var totalCount = await q.CountAsync();

        if (query.Page > 0 && query.PageSize > 0)
        {
            q = q
                .ApplySorting(query.SortField, query.SortOrder, nameof(FeedbackTicket.CreatedAt), fallbackDescending: true)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize);
        }
        else
        {
            q = q
                .ApplySorting(query.SortField, query.SortOrder, nameof(FeedbackTicket.CreatedAt), fallbackDescending: true);
        }

        var items = await q.ToListAsync();
        var responses = items.Select(f => MapToResponse(f, includeUserEmail)).ToList();

        return new PagedResult<FeedbackTicketResponse>
        {
            TotalCount = totalCount,
            Items = responses,
        };
    }

    public async Task<FeedbackTicketResponse?> GetByIdAsync(int id, long? userIdFilter, bool includeUserEmail)
    {
        using var context = await dbFactory.CreateDbContextAsync();
        return await MapToResponseAsync(context, id, userIdFilter, includeUserEmail);
    }

    public async Task<FeedbackTicketResponse> UpdateByAdminAsync(int id, UpdateFeedbackRequest request)
    {
        using var context = await dbFactory.CreateDbContextAsync();

        var entity = await context.FeedbackTickets
            .Include(f => f.User)
            .Include(f => f.AdminReply)
            .Include(f => f.Session)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (entity == null)
            throw new NotFoundException("Обращение не найдено");

        if (request.Status.HasValue)
        {
            if (!Enum.IsDefined(typeof(FeedbackStatus), request.Status.Value))
                throw new BadRequestException("Укажите корректный статус");
            entity.Status = request.Status.Value;
        }

        if (request.AdminResponse != null)
        {
            var text = request.AdminResponse.Trim();
            if (string.IsNullOrEmpty(text))
            {
                if (entity.AdminReply != null)
                {
                    context.FeedbackAdminReplies.Remove(entity.AdminReply);
                    entity.AdminReply = null;
                }
            }
            else
            {
                var now = DateTime.UtcNow;
                if (entity.AdminReply == null)
                {
                    entity.AdminReply = new FeedbackAdminReply
                    {
                        Message = text,
                        CreatedAt = now,
                        UpdatedAt = now,
                    };
                }
                else
                {
                    entity.AdminReply.Message = text;
                    entity.AdminReply.UpdatedAt = now;
                }
            }
        }

        entity.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        return MapToResponse(entity, includeUserEmail: true);
    }

    private static async Task<FeedbackTicketResponse?> MapToResponseAsync(
        ArchXContext context,
        int id,
        long? userIdFilter = null,
        bool includeUserEmail = false)
    {
        var q = context.FeedbackTickets
            .Include(f => f.User)
            .Include(f => f.AdminReply)
            .Include(f => f.Session)
            .Where(f => f.Id == id);
        if (userIdFilter.HasValue)
            q = q.Where(f => f.UserId == userIdFilter.Value);

        var entity = await q.FirstOrDefaultAsync();
        return entity == null ? null : MapToResponse(entity, includeUserEmail);
    }

    private static FeedbackTicketResponse MapToResponse(FeedbackTicket f, bool includeUserEmail)
    {
        return new FeedbackTicketResponse
        {
            Id = f.Id,
            UserId = f.UserId,
            UserEmail = includeUserEmail ? f.User?.Email : null,
            SessionId = f.SessionId,
            SessionProjectName = f.Session?.ProjectName,
            Category = f.Category,
            Subject = f.Subject,
            Message = f.Message,
            Status = f.Status,
            AdminReply = f.AdminReply == null
                ? null
                : new FeedbackAdminReplyResponse
                {
                    Message = f.AdminReply.Message,
                    CreatedAt = f.AdminReply.CreatedAt,
                    UpdatedAt = f.AdminReply.UpdatedAt,
                },
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt,
        };
    }
}
