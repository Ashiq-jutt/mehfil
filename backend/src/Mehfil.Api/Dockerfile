# Build context is the backend/ folder:  docker build -f src/Mehfil.Api/Dockerfile .
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props ./
COPY src/Mehfil.Core/Mehfil.Core.csproj src/Mehfil.Core/
COPY src/Mehfil.Infrastructure/Mehfil.Infrastructure.csproj src/Mehfil.Infrastructure/
COPY src/Mehfil.Api/Mehfil.Api.csproj src/Mehfil.Api/
RUN dotnet restore src/Mehfil.Api/Mehfil.Api.csproj
COPY src/ src/
RUN dotnet publish src/Mehfil.Api/Mehfil.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Mehfil.Api.dll"]
