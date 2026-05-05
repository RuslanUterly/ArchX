namespace ArchX.Server.Features.Shared.Exteptions;

public abstract class DomainException : Exception
{
    public abstract int StatusCode { get; }
    public abstract string Title { get; }

    protected DomainException(string message) : base(message) { }
}

public class BadRequestException : DomainException
{
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Некорректный запрос";

    public string? Code { get; }
    public IDictionary<string, string[]>? Errors { get; }

    public BadRequestException(string message) : base(message)
    {
    }

    public BadRequestException(string code, string message) : base(message)
    {
        Code = code;
    }

    public BadRequestException(string message, IDictionary<string, string[]> errors)
        : base(message)
    {
        Errors = errors;
    }

    public BadRequestException(string code, string message, IDictionary<string, string[]> errors)
        : base(message)
    {
        Code = code;
        Errors = errors;
    }
}


public class UnauthorizedException : DomainException
{
    public override int StatusCode => StatusCodes.Status401Unauthorized;
    public override string Title => "Ошибка авторизации";

    public UnauthorizedException(string message) : base(message) { }
}

public class NotFoundException : DomainException
{
    public override int StatusCode => StatusCodes.Status404NotFound;
    public override string Title => "Не найден";

    public NotFoundException(string message) : base(message) { }
}
