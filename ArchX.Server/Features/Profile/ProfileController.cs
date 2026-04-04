using System.Security.Claims;
using ArchX.Server.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.Profile;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProfileController(ProfileService profileService) : ControllerBase
{
    private long? GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(sub, out var id) ? id : null;
    }

    /// <summary>
    /// Текущий профиль (только для роли User, не для администратора)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAsync()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (User.IsInRole(Roles.Admin))
            return Forbid();

        var profile = await profileService.GetAsync(userId.Value);
        return Ok(profile);
    }

    /// <summary>
    /// Обновить грейд и тип пользователя
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateAsync([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (User.IsInRole(Roles.Admin))
            return Forbid();

        var updated = await profileService.UpdateAsync(userId.Value, request);
        return Ok(updated);
    }
}
