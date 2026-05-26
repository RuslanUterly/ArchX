using ArchX.Server.Entities;
using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Identity;

namespace ArchX.Server.Features.Profile;

public class ProfileService(UserManager<User> userManager)
{
    public async Task<ProfileResponse> GetAsync(long userId)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());

        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        return new ProfileResponse(user.Email ?? string.Empty, user.UserType, user.Grade);
    }

    public async Task<ProfileResponse> UpdateAsync(long userId, UpdateProfileRequest request)
    {
        if (!IsSelectableUserType(request.UserType))
            throw new BadRequestException("Укажите корректную должность");

        if (!Enum.IsDefined(typeof(Grade), request.Grade))
            throw new BadRequestException("Укажите корректный грейд");

        var user = await userManager.FindByIdAsync(userId.ToString());

        if (user == null)
            throw new NotFoundException("Пользователь не найден");

        user.UserType = request.UserType;
        user.Grade = request.Grade;

        var result = await userManager.UpdateAsync(user);

        if (!result.Succeeded)
            throw new BadRequestException("Не удалось сохранить профиль");

        return new ProfileResponse(user.Email ?? string.Empty, user.UserType, user.Grade);
    }

    private static bool IsSelectableUserType(UserType userType) =>
        Enum.IsDefined(typeof(UserType), userType);
}
