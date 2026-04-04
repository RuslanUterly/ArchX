using System.Security.Claims;
using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Request;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.Feedback;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FeedbackController(FeedbackService feedbackService) : ControllerBase
{
    private long? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(sub, out var id) ? id : null;
    }

    private static bool IsAdmin(ClaimsPrincipal user) => user.IsInRole(Roles.Admin);

    /// <summary>
    /// Создать обращение
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (IsAdmin(User))
            return Forbid();

        var created = await feedbackService.CreateAsync(userId.Value, request);
        return Ok(created);
    }

    /// <summary>
    /// Список обращений (свои для пользователя, все — для администратора)
    /// </summary>
    [HttpPost("query")]
    public async Task<IActionResult> Query([FromBody] QueryParameter query)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var admin = IsAdmin(User);
        var filter = admin ? (long?)null : userId;
        var result = await feedbackService.GetPagedAsync(query, filter, includeUserEmail: admin);
        return Ok(result);
    }

    /// <summary>
    /// Получить обращение по идентификатору
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var admin = IsAdmin(User);
        var filter = admin ? (long?)null : userId;
        var item = await feedbackService.GetByIdAsync(id, filter, includeUserEmail: admin);
        if (item == null)
            return NotFound();
        return Ok(item);
    }

    /// <summary>
    /// Ответ администратора и смена статуса
    /// </summary>
    [HttpPatch("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateByAdmin(int id, [FromBody] UpdateFeedbackRequest request)
    {
        if (request.Status == null && request.AdminResponse == null)
            return BadRequest("Укажите статус и/или ответ");

        var updated = await feedbackService.UpdateByAdminAsync(id, request);
        return Ok(updated);
    }
}
