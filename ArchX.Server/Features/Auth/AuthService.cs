using ArchX.Server.Entities;
using ArchX.Server.Features.Auth.Jwt;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using System.Security.Claims;

namespace ArchX.Server.Features.Auth;

public class AuthService(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    IJwtProvider jwtProvider)
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
