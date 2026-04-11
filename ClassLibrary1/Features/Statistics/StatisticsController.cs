using System.Security.Claims;
using ArchX.Server.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.Statistics;

[ApiController]
[Route("api/v1/[controller]")]
public class StatisticsController(StatisticsService statisticsService) : ControllerBase
{
    private long? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>
    /// Краткие агрегаты для главной страницы без авторизации.
    /// </summary>
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublic()
    {
        var result = await statisticsService.GetPublicAsync();
        return Ok(result);
    }

    /// <summary>
    /// Полная статистика: общий блок для любого авторизованного пользователя; расширенный — только для администратора.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var isAdmin = User.IsInRole(Roles.Admin);
        var result = await statisticsService.GetForUserAsync(userId.Value, isAdmin);
        return Ok(result);
    }
}
