using System.ComponentModel.DataAnnotations;
using ArchX.Server.Entities;

namespace ArchX.Server.Features.Auth;

public class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public UserType UserType { get; set; }
}
