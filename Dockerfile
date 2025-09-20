# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY CampusSwap.sln ./
COPY src/CampusSwap.Domain/*.csproj ./src/CampusSwap.Domain/
COPY src/CampusSwap.Application/*.csproj ./src/CampusSwap.Application/
COPY src/CampusSwap.Infrastructure/*.csproj ./src/CampusSwap.Infrastructure/
COPY src/CampusSwap.WebApi/*.csproj ./src/CampusSwap.WebApi/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY src/ ./src/

# Build and publish
WORKDIR /src/src/CampusSwap.WebApi
RUN dotnet build -c Release -o /app/build
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=build /app/publish .

# Create uploads directory for local file storage
RUN mkdir -p wwwroot/uploads

# Expose ports
EXPOSE 80
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "CampusSwap.WebApi.dll"]