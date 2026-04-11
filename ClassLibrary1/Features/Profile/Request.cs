using System.ComponentModel.DataAnnotations;
using ArchX.Server.Entities;

namespace ArchX.Server.Features.Profile;

public class UpdateProfileRequest
{
    [Required]
    public UserType UserType { get; set; }

    [Required]
    public Grade Grade { get; set; }
}
