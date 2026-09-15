using Mehfil.Core.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Mehfil.Infrastructure.Data;

/// <summary>
/// Lets `dotnet ef migrations add ...` build the model without booting the API or a live database.
/// The connection string is only used for provider selection at design time.
/// </summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<MehfilDbContext>
{
    public MehfilDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("MEHFIL_CONNECTION_STRING")
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=Mehfil;Trusted_Connection=True;TrustServerCertificate=True";

        var options = new DbContextOptionsBuilder<MehfilDbContext>()
            .UseSqlServer(connectionString, sql => sql.MigrationsAssembly(typeof(MehfilDbContext).Assembly.FullName))
            .Options;

        return new MehfilDbContext(options, new SystemClock());
    }
}
