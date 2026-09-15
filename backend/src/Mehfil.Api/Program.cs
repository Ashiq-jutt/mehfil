using System.Text.Json.Serialization;
using FluentValidation;
using Mehfil.Api.Extensions;
using Mehfil.Api.Filters;
using Mehfil.Api.Middleware;
using Mehfil.Infrastructure;
using Mehfil.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

// Infrastructure: EF Core (SQL Server, Code First), auth services, options.
builder.Services.AddInfrastructure(builder.Configuration);

// MVC controllers + JSON conventions (camelCase, enums as strings).
builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add<FluentValidationFilter>();
        options.Conventions.Add(new RouteTokenTransformerConvention(new LowercaseParameterTransformer()));
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddValidatorsFromAssemblyContaining<Program>(includeInternalTypes: true);

// RFC 7807 errors for everything.
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = ctx =>
        ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<AppExceptionHandler>();

builder.Services.AddApiAuthentication(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddApiRateLimiting();
builder.Services.AddSwaggerDocs();
builder.Services.AddHealthChecks().AddDbContextCheck<MehfilDbContext>("database");

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Mehfil API v1");
        options.DocumentTitle = "Mehfil API";
    });
}

app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/healthz");

// Code First: create/upgrade the database and seed catalogs before serving traffic.
await DatabaseInitializer.InitializeAsync(app.Services);

await app.RunAsync();

/// <summary>Exposed for WebApplicationFactory in integration tests.</summary>
public partial class Program;
