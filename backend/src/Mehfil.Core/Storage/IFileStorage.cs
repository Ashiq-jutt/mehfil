namespace Mehfil.Core.Storage;

/// <summary>Stores user-uploaded files and returns the public URL path to reference them.</summary>
public interface IFileStorage
{
    /// <summary>Saves the stream and returns a URL path such as "/uploads/avatars/12/abc.jpg".</summary>
    Task<string> SaveAsync(Stream content, string folder, string extension, CancellationToken ct);

    /// <summary>Deletes a file previously returned by SaveAsync. Ignores URLs it does not own.</summary>
    Task DeleteAsync(string? url, CancellationToken ct);
}

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Directory for local storage, relative to the content root (default wwwroot/uploads).</summary>
    public string LocalRoot { get; set; } = "wwwroot/uploads";

    /// <summary>Public URL prefix the local root is served under.</summary>
    public string PublicPath { get; set; } = "/uploads";

    public long MaxUploadBytes { get; set; } = 5 * 1024 * 1024;
}
