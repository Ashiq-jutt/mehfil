using Mehfil.Core.Common;
using Mehfil.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Testcontainers.MsSql;

namespace Mehfil.Tests.Integration;

/// <summary>
/// Provides a throwaway SQL Server database for integration tests.
/// Order of preference: MEHFIL_TEST_CONNECTION_STRING → Testcontainers (Docker) → unavailable (tests skip).
/// </summary>
public sealed class SqlServerFixture : IAsyncLifetime
{
    public const string ConnectionStringVariable = "MEHFIL_TEST_CONNECTION_STRING";
    public const string SqlServerImage = "mcr.microsoft.com/mssql/server:2022-latest";

    private MsSqlContainer? _container;

    public string? ConnectionString { get; private set; }
    public string UnavailableReason { get; private set; } = "";
    public bool Available => ConnectionString is not null;

    public async Task InitializeAsync()
    {
        var external = Environment.GetEnvironmentVariable(ConnectionStringVariable);
        if (!string.IsNullOrWhiteSpace(external))
        {
            ConnectionString = WithTestDatabase(external);
            return;
        }

        try
        {
            _container = new MsSqlBuilder(SqlServerImage).Build();
            await _container.StartAsync();
            ConnectionString = WithTestDatabase(_container.GetConnectionString());
        }
        catch (Exception ex)
        {
            UnavailableReason =
                $"SQL Server is not available: set {ConnectionStringVariable} or start Docker. ({ex.GetType().Name}: {ex.Message})";
        }
    }

    public async Task DisposeAsync()
    {
        if (ConnectionString is not null)
        {
            var options = new DbContextOptionsBuilder<MehfilDbContext>().UseSqlServer(ConnectionString).Options;
            await using var db = new MehfilDbContext(options, new SystemClock());
            await db.Database.EnsureDeletedAsync();
        }

        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }

    private static string WithTestDatabase(string connectionString) =>
        new SqlConnectionStringBuilder(connectionString)
        {
            InitialCatalog = $"Mehfil_Test_{Guid.NewGuid():N}",
            TrustServerCertificate = true,
        }.ConnectionString;
}
