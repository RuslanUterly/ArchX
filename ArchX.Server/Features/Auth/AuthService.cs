using ArchX.Server.Entities;
using ArchX.Server.Features.Auth.Jwt;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;

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

        var token = jwtProvider.GenerateToken(account);

        return token;
    }

    public async Task<long> RegisterAsync(RegisterRequest request)
    {
        if (await userManager.FindByEmailAsync(request.Email) is not null)
            throw new NotFoundException("Пользователь уже зарегистрирован");

        var user = new User()
        {
            Email = request.Email,
            UserName = request.Email,
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            throw new BadRequestException("Произошла ошибка");

        return user.Id;
    }
}
