using ArchX.Server.Entities;
using ArchX.Server.Features.Email;
using ArchX.Server.Features.Auth.Jwt;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace ArchX.Server.Features.Auth;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    IJwtProvider jwtProvider,
    IEmailSender emailSender,
    IOptions<PasswordResetOptions> passwordResetOptions,
    ILogger<AuthService> logger)
{
    public async Task<string> LoginAsync(LoginRequest request)
    {
        var account = await userManager.FindByEmailAsync(request.Email);

        if (account == null)
            throw new UnauthorizedException("Ошибка авторизации! Проверьте логин или пароль");

        var signInResult = await signInManager.CheckPasswordSignInAsync(account, request.Password, false);

        if (!signInResult.Succeeded)
            throw new UnauthorizedException("Ошибка авторизации! Проверьте логин или пароль");

        var token = await jwtProvider.GenerateTokenAsync(account);

        return token;
    }

    public async Task<long> RegisterAsync(RegisterRequestDto request)
    {
        if (!IsSelectableUserType(request.UserType))
            throw new BadRequestException("Укажите корректную должность");

        if (!Enum.IsDefined(typeof(Grade), request.Grade))
            throw new BadRequestException("Укажите корректный грейд");

        if (await userManager.FindByEmailAsync(request.Email) is not null)
            throw new BadRequestException("Пользователь уже зарегистрирован");

        var user = new User()
        {
            Email = request.Email,
            UserName = request.Email,
            UserType = request.UserType,
            Grade = request.Grade,
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            throw new BadRequestException("Произошла ошибка");

        if (!await userManager.IsInRoleAsync(user, "User"))
            await userManager.AddToRoleAsync(user, "User");

        return user.Id;
    }

    public async Task SendPasswordResetEmailAsync(ForgotPasswordRequestDto request)
    {
        var account = await userManager.FindByEmailAsync(request.Email);

        if (account?.Email is null)
            return;

        try
        {
            var resetPasswordUrl = passwordResetOptions.Value.ResetPasswordUrl;
            if (string.IsNullOrWhiteSpace(resetPasswordUrl))
                throw new InvalidOperationException("PasswordResetOptions:ResetPasswordUrl не задан в конфигурации.");

            var token = await userManager.GeneratePasswordResetTokenAsync(account);
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var resetLink = QueryHelpers.AddQueryString(resetPasswordUrl, new Dictionary<string, string?>
            {
                ["email"] = account.Email,
                ["token"] = encodedToken,
            });

            var safeResetLink = WebUtility.HtmlEncode(resetLink);
            var htmlBody = $"""
                <p>Здравствуйте!</p>
                <p>Для восстановления пароля в ArchX перейдите по ссылке:</p>
                <p><a href="{safeResetLink}">Восстановить пароль</a></p>
                <p>Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
                """;

            await emailSender.SendAsync(account.Email, "Восстановление пароля ArchX", htmlBody);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to send password reset email to {Email}", account.Email);
        }
    }

    public async Task ResetPasswordAsync(ResetPasswordRequestDto request)
    {
        var account = await userManager.FindByEmailAsync(request.Email);

        if (account == null)
            throw new BadRequestException("Некорректная или устаревшая ссылка восстановления пароля");

        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch (FormatException)
        {
            throw new BadRequestException("Некорректная или устаревшая ссылка восстановления пароля");
        }

        var result = await userManager.ResetPasswordAsync(account, token, request.NewPassword);

        if (!result.Succeeded)
        {
            var errors = result.Errors
                .GroupBy(error => error.Code)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.Description).ToArray());

            throw new BadRequestException("Не удалось восстановить пароль", errors);
        }
    }

    private static bool IsSelectableUserType(UserType userType) =>
        Enum.IsDefined(typeof(UserType), userType);

    public async Task<IList<string>> GetUserRolesAsync(ClaimsPrincipal user)
    {
        var account = await userManager.GetUserAsync(user);

        if (account == null)
            throw new NotFoundException("Пользователь не найден");

        var roles = await userManager.GetRolesAsync(account);
        return roles;
    }
}
