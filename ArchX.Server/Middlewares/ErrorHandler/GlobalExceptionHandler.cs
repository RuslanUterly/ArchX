using ArchX.Server.Features.Shared.Exteptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace ArchX.Server.Middlewares.ErrorHandler;

public class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, 
        Exception exception, 
        CancellationToken cancellationToken)
    {
        if (exception is not DomainException)
        {
            logger.LogError(exception, "Unhandled exception for request {Path}", httpContext.Request.Path);
        }

        var problemDetails = ExceptionDetailsHelper.GetExceptionDetails(exception);

        httpContext.Response.StatusCode = problemDetails.Status!.Value;
        var context = new ProblemDetailsContext { 
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        };

        return await problemDetailsService.TryWriteAsync(context);
    }
}

public static class ExceptionDetailsHelper
{
    public static ProblemDetails GetExceptionDetails(Exception exception)
    {
        var problemDetails = new ProblemDetails();

        return exception switch
        {
            BadRequestException badRequest => CreateBadRequestProblemDetails(badRequest),

            UnauthorizedException access => new ProblemDetails
            {
                Status = access.StatusCode,
                Title = access.Title,
                Detail = access.Message,
            },

            NotFoundException notFound => new ProblemDetails
            {
                Status = notFound.StatusCode,
                Title = notFound.Title,
                Detail = notFound.Message,
            },

            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Ошибка сервера",
                Detail = "Произошла непредвиденная ошибка",
            }
        };
    }

    private static ProblemDetails CreateBadRequestProblemDetails(BadRequestException exception)
    {
        var problemDetails = new ProblemDetails
        {
            Status = exception.StatusCode,
            Title = exception.Title,
            Detail = exception.Message
        };

        if (!string.IsNullOrEmpty(exception.Code))
        {
            problemDetails.Extensions["code"] = exception.Code;
        }

        if (exception.Errors?.Any() == true)
        {
            problemDetails.Extensions["errors"] = exception.Errors;
        }

        return problemDetails;
    }
}
