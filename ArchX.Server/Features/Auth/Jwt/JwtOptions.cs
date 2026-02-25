namespace ArchX.Server.Features.Auth.Jwt;

public class JwtOptions
{
    public string SecretKey { get; set; } = "SecretKey121212";
    public int ExpiresHours { get; set; } = 24;
}
