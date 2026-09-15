namespace Mehfil.Api.Extensions;

/// <summary>Turns [controller] tokens into lowercase so routes read /api/v1/auth/google, not /api/v1/Auth/google.</summary>
public sealed class LowercaseParameterTransformer : IOutboundParameterTransformer
{
    public string? TransformOutbound(object? value) => value?.ToString()?.ToLowerInvariant();
}
