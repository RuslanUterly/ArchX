using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Features.Auth;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> LoginAsync([FromBody] LoginRequest loginRequest)
    {
        var token = await authService.LoginAsync(loginRequest);

        return Ok(token);
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterAsync([FromBody] RegisterRequestDto registerRequest)
    {
        var result = await authService.RegisterAsync(registerRequest);

        return Ok(result);
    }

    [HttpGet("roles")]
    [Authorize]
    public async Task<IActionResult> GetUserRolesAsync()
    {
        var roles = await authService.GetUserRolesAsync(User);
        return Ok(roles);
    }
}
