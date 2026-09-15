using Mehfil.Core.Storage;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mehfil.Infrastructure.Storage;

/// <summary>
/// Stores uploads on the local disk under the content root and serves them as static files.
/// Swap for a blob/S3 implementation of IFileStorage when deploying to more than one instance.
/// </summary>
public sealed class LocalFileStorage(IHostEnvironment environment, IOptions<StorageOptions> options, ILogger<LocalFileStorage> logger)
    : IFileStorage
{
    private readonly StorageOptions _options = options.Value;

    private string RootPath => Path.GetFullPath(Path.Combine(environment.ContentRootPath, _options.LocalRoot));

    private string PublicPrefix => _options.PublicPath.TrimEnd('/') + "/";

    public async Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken ct)
    {
        var safeFolder = string.Join('/', folder.Split('/', StringSplitOptions.RemoveEmptyEntries).Select(SanitizeSegment));
        var fileName = $"{Guid.NewGuid():N}.{extension.TrimStart('.').ToLowerInvariant()}";

        var directory = Path.Combine(RootPath, safeFolder.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(directory);

        var fullPath = Path.Combine(directory, fileName);
        await using (var file = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true))
        {
            await content.CopyToAsync(file, ct);
        }

        return $"{PublicPrefix}{safeFolder}/{fileName}";
    }

    public Task DeleteAsync(string? url, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(url) || !url.StartsWith(PublicPrefix, StringComparison.Ordinal))
        {
            return Task.CompletedTask; // external URL (e.g. Google avatar) or nothing to delete
        }

        var relative = url[PublicPrefix.Length..].Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(RootPath, relative));
        if (!fullPath.StartsWith(RootPath, StringComparison.Ordinal))
        {
            logger.LogWarning("Refused to delete path outside storage root: {Url}", url);
            return Task.CompletedTask;
        }

        try
        {
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Could not delete {Path}", fullPath);
        }

        return Task.CompletedTask;
    }

    private static string SanitizeSegment(string segment)
    {
        var chars = segment.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_').ToArray();
        return chars.Length == 0 ? "_" : new string(chars);
    }
}
