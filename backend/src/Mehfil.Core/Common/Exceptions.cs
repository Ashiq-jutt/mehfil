namespace Mehfil.Core.Common;

/// <summary>
/// Base for expected, client-facing failures. The API maps these to RFC 7807 ProblemDetails
/// with the given status code; anything else is a 500.
/// </summary>
public abstract class AppException : Exception
{
    protected AppException(int statusCode, string code, string message) : base(message)
    {
        StatusCode = statusCode;
        Code = code;
    }

    public int StatusCode { get; }

    /// <summary>Stable machine-readable error code, e.g. "auth.invalid_google_token".</summary>
    public string Code { get; }
}

public sealed class NotFoundException(string code, string message) : AppException(404, code, message)
{
    public static NotFoundException For(string entity, object key) =>
        new($"{entity.ToLowerInvariant()}.not_found", $"{entity} '{key}' was not found.");
}

public sealed class ConflictException(string code, string message) : AppException(409, code, message);

public sealed class ForbiddenException(string code, string message) : AppException(403, code, message);

public sealed class UnauthorizedException(string code, string message) : AppException(401, code, message);

public sealed class BadRequestException(string code, string message) : AppException(400, code, message);

/// <summary>503: a dependency or feature is not configured / available.</summary>
public sealed class AppUnavailableException(string code, string message) : AppException(503, code, message);
