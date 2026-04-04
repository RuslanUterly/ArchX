using ArchX.Server.Entities;

namespace ArchX.Server.Features.Profile;

public record ProfileResponse(string Email, UserType UserType, Grade Grade);
